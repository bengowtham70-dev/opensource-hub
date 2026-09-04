// PRD §21 & §38 — Repository Q&A & Terminal Assistant Engine
// Dual-mode architecture:
// 1. Local Markdown AST & Semantic Section Extractor (100% offline, zero API keys required).
// 2. Local Ollama Bridge (if Ollama is active on localhost:11434, provides streaming generative answers).

/**
 * Tokenize and normalize user question
 */
export function tokenizeQuery(q = "") {
  return String(q)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

/**
 * Parse raw markdown into semantic sections with headings, text, and code blocks.
 */
export function parseMarkdownSections(markdown = "") {
  if (!markdown) return [];

  const lines = markdown.split(/\r?\n/);
  const sections = [];
  let currentSection = {
    title: "Overview",
    level: 1,
    content: [],
    codeBlocks: [],
  };

  let inCode = false;
  let codeBuffer = [];
  let codeLang = "";

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        currentSection.codeBlocks.push({
          lang: codeLang,
          code: codeBuffer.join("\n").trim(),
        });
        codeBuffer = [];
        codeLang = "";
        inCode = false;
      } else {
        inCode = true;
        codeLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    // Heading match
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      if (currentSection.content.length > 0 || currentSection.codeBlocks.length > 0) {
        sections.push({
          ...currentSection,
          rawText: currentSection.content.join("\n").trim(),
        });
      }
      currentSection = {
        title: headingMatch[2].replace(/[#*_`]/g, "").trim(),
        level: headingMatch[1].length,
        content: [],
        codeBlocks: [],
      };
    } else {
      currentSection.content.push(line);
    }
  }

  if (currentSection.content.length > 0 || currentSection.codeBlocks.length > 0) {
    sections.push({
      ...currentSection,
      rawText: currentSection.content.join("\n").trim(),
    });
  }

  return sections;
}

/**
 * Categorize section title into high-level intent
 */
export function categorizeSection(title = "") {
  const t = title.toLowerCase();
  if (t.includes("install") || t.includes("quickstart") || t.includes("get start") || t.includes("setup")) {
    return "install";
  }
  if (t.includes("env") || t.includes("config") || t.includes("key") || t.includes("token") || t.includes("secret") || t.includes("variable")) {
    return "config";
  }
  if (t.includes("docker") || t.includes("compose") || t.includes("container") || t.includes("deploy") || t.includes("self-host")) {
    return "docker";
  }
  if (t.includes("usage") || t.includes("example") || t.includes("how to") || t.includes("api") || t.includes("tutorial")) {
    return "usage";
  }
  if (t.includes("feature") || t.includes("architecture") || t.includes("about") || t.includes("overview")) {
    return "features";
  }
  if (t.includes("faq") || t.includes("troubleshoot") || t.includes("issue")) {
    return "troubleshooting";
  }
  return "general";
}

/**
 * Check if local Ollama service is reachable
 */
async function checkOllama(endpoint = "http://localhost:11434") {
  try {
    const url = new URL("/api/tags", endpoint);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return false;
    const data = await res.json();
    return data?.models?.length > 0 ? data.models[0].name : false;
  } catch {
    return false;
  }
}

/**
 * Query Ollama local LLM with grounded repository context
 */
async function queryOllama({ endpoint = "http://localhost:11434", model, prompt, context }) {
  const systemPrompt = `You are Byte, the friendly and hyper-capable OpenSource Hub technical guardian. 
Answer developer questions using the provided repository README context. 
Keep answers concise, actionable, and formatted with clean markdown code blocks. Always provide exact shell or code commands where available.`;

  const userPrompt = `Context from repository README:\n${context.slice(0, 4000)}\n\nQuestion: ${prompt}`;

  const res = await fetch(new URL("/api/generate", endpoint).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      stream: false,
    }),
  });

  if (!res.ok) throw new Error(`Ollama generation failed: ${res.status}`);
  const data = await res.json();
  return data.response;
}

/**
 * Synthesize local heuristic answer when offline
 */
export function heuristicAnswer({ question, sections, repoMeta = {} }) {
  const qTokens = tokenizeQuery(question);
  const qLower = question.toLowerCase();

  let targetCategory = "general";
  if (/docker|compose|container|self[- ]?host|kubernetes|helm/i.test(qLower)) {
    targetCategory = "docker";
  } else if (/trade[- ]?off|vs|compare|alternative|competitor|why use|diff|advantage/i.test(qLower)) {
    targetCategory = "compare";
  } else if (/env|variable|api[- ]?key|token|secret|config|setting|auth|credential/i.test(qLower)) {
    targetCategory = "config";
  } else if (/install|setup|quickstart|run|start|build|download|clone|getting started|get started/i.test(qLower)) {
    targetCategory = "install";
  } else if (/usage|example|call|code|how (do|to)|workflow/i.test(qLower)) {
    targetCategory = "usage";
  }

  // Score sections based on intent match and token hits
  let bestSection = null;
  let bestScore = -1;

  for (const s of sections) {
    const cat = categorizeSection(s.title);
    let score = 0;
    if (cat === targetCategory) score += 15;

    const sTitleLower = s.title.toLowerCase();
    for (const t of qTokens) {
      if (sTitleLower.includes(t)) score += 5;
      if (s.rawText.toLowerCase().includes(t)) score += 1;
    }
    if (s.codeBlocks.length > 0) score += 2;

    if (score > bestScore) {
      bestScore = score;
      bestSection = s;
    }
  }

  const repoName = repoMeta.name || "this project";

  // Intent 1: Docker & Self-Hosting
  if (targetCategory === "docker") {
    const dockerSec = sections.find((s) => categorizeSection(s.title) === "docker") || bestSection;
    const composeBlock = dockerSec?.codeBlocks?.find((c) => /version:|services:|docker-compose/i.test(c.code));
    const runBlock = dockerSec?.codeBlocks?.find((c) => /docker run/i.test(c.code));

    let md = `### 🐳 Docker & Self-Hosting Setup for **${repoName}**\n\n`;
    if (runBlock) {
      md += `Run with Docker directly:\n\`\`\`bash\n${runBlock.code}\n\`\`\`\n\n`;
    } else if (composeBlock) {
      md += `Here is the Docker Compose configuration from the repository docs:\n\`\`\`yaml\n${composeBlock.code}\n\`\`\`\n\n`;
    } else {
      md += `\`\`\`bash\n# 1-click container run\ndocker run -d -p 8080:8080 --name ${repoName.toLowerCase()} ${repoMeta.repo || repoName.toLowerCase()}\n\`\`\`\n\n`;
    }

    if (dockerSec && dockerSec.rawText) {
      const cleanExcerpt = dockerSec.rawText.split("\n").filter((l) => !l.startsWith("```")).slice(0, 5).join("\n");
      if (cleanExcerpt.trim()) md += `${cleanExcerpt}\n\n`;
    }

    return {
      answer: md,
      matchedSection: dockerSec?.title || "Docker Setup",
      codeSnippets: (dockerSec?.codeBlocks || []).map((c) => c.code),
      source: "local_ast",
    };
  }

  // Intent 2: Architectural Comparison & Trade-Offs
  if (targetCategory === "compare") {
    let md = `### ⚖️ Architectural Advantages & Trade-Offs for **${repoName}**\n\n`;
    md += `**Superpowers & Advantages:**\n`;
    md += `- **100% Data Sovereignty**: Self-hosted on your own infrastructure with zero vendor telemetry lock-in.\n`;
    md += `- **Public Auditability**: Licensed under **${repoMeta.license?.spdx || "Open Source"}** with transparent source code.\n`;
    md += `- **Cost Elimination**: Replaces typical commercial subscription fees (saving ~$240–$1,200/year).\n\n`;
    md += `**Considerations:**\n`;
    md += `- **Operational Maintenance**: Requires your own backups, runtime updates, and host server provisioning.\n`;

    return {
      answer: md,
      matchedSection: "Architectural Comparison",
      codeSnippets: [],
      source: "local_ast",
    };
  }

  // Intent 3: Environment Variables & Keys
  if (targetCategory === "config") {
    const configSec = sections.find((s) => categorizeSection(s.title) === "config") || bestSection;
    let md = `### 🔑 Environment Variables & Configuration for **${repoName}**\n\n`;

    // Look for lines with KEY= or uppercase config vars
    const envLines = [];
    for (const s of sections) {
      const lines = s.rawText.split("\n");
      for (const line of lines) {
        if (/^[A-Z0-9_]{3,}\s*[:=]/.test(line.trim()) || line.includes(".env") || /export\s+[A-Z0-9_]+=/i.test(line)) {
          envLines.push(line.trim());
        }
      }
    }

    if (envLines.length > 0) {
      md += `Key variables defined in the repository:\n\`\`\`bash\n${envLines.slice(0, 8).join("\n")}\n\`\`\`\n\n`;
    } else if (configSec?.codeBlocks?.length > 0) {
      md += `Configuration snippet from **${configSec.title}**:\n\`\`\`${configSec.codeBlocks[0].lang || "bash"}\n${configSec.codeBlocks[0].code}\n\`\`\`\n\n`;
    } else if (configSec?.rawText) {
      md += `${configSec.rawText.slice(0, 350)}\n\n`;
    } else {
      md += `No dedicated \`.env\` variables table found in the root README. Default configuration runs with zero mandatory credentials.\n\n`;
    }

    return {
      answer: md,
      matchedSection: configSec?.title || "Configuration",
      codeSnippets: (configSec?.codeBlocks || []).map((c) => c.code),
      source: "local_ast",
    };
  }

  // Intent 4: Installation & Quickstart
  if (targetCategory === "install") {
    const installSec = sections.find((s) => categorizeSection(s.title) === "install") || bestSection;
    let md = `### ⚡ Quickstart & Installation for **${repoName}**\n\n`;

    if (installSec?.codeBlocks?.length > 0) {
      md += `Run the following commands to install and start:\n\`\`\`${installSec.codeBlocks[0].lang || "bash"}\n${installSec.codeBlocks[0].code}\n\`\`\`\n\n`;
    } else if (repoMeta.language === "Python") {
      md += `\`\`\`bash\npip install ${repoName.toLowerCase()}\n\`\`\`\n\n`;
    } else if (repoMeta.language === "JavaScript" || repoMeta.language === "TypeScript") {
      md += `\`\`\`bash\nnpm install ${repoName.toLowerCase()}\n\`\`\`\n\n`;
    }

    if (installSec?.rawText) {
      const notes = installSec.rawText.split("\n").filter((l) => !l.startsWith("```") && l.trim().length > 0).slice(0, 4).join("\n");
      if (notes) md += `${notes}\n\n`;
    }

    return {
      answer: md,
      matchedSection: installSec?.title || "Installation",
      codeSnippets: (installSec?.codeBlocks || []).map((c) => c.code),
      source: "local_ast",
    };
  }

  // Generic fallback: Use best matching section
  if (bestSection) {
    let md = `### 📖 Information from **${bestSection.title}**\n\n`;
    const cleanText = bestSection.rawText.split("\n").filter((l) => !l.startsWith("```")).slice(0, 6).join("\n");
    if (cleanText) md += `${cleanText}\n\n`;

    if (bestSection.codeBlocks.length > 0) {
      md += `\`\`\`${bestSection.codeBlocks[0].lang || "bash"}\n${bestSection.codeBlocks[0].code}\n\`\`\`\n\n`;
    }

    return {
      answer: md,
      matchedSection: bestSection.title,
      codeSnippets: bestSection.codeBlocks.map((c) => c.code),
      source: "local_ast",
    };
  }

  return {
    answer: `**${repoName}** is an open-source project written in **${repoMeta.language || "code"}** with **${repoMeta.stars || "active"}** stars on GitHub. Consult the official documentation or README tabs for full usage details.`,
    matchedSection: "Overview",
    codeSnippets: [],
    source: "local_ast",
  };
}

/**
 * Main entry point: Answer a question about a repository using local AST or Ollama
 */
export async function answerRepoQuestion({ question, markdown, repoMeta = {}, ollamaEndpoint = "http://localhost:11434" }) {
  if (!question || !question.trim()) {
    throw new Error("Question cannot be empty.");
  }

  const sections = parseMarkdownSections(markdown);

  // Check if Ollama is running locally
  const ollamaModel = await checkOllama(ollamaEndpoint);
  if (ollamaModel && markdown && markdown.length > 100) {
    try {
      const ollamaResponse = await queryOllama({
        endpoint: ollamaEndpoint,
        model: ollamaModel,
        prompt: question,
        context: markdown,
      });

      if (ollamaResponse && ollamaResponse.trim()) {
        return {
          answer: ollamaResponse.trim(),
          matchedSection: "Live Ollama Context",
          codeSnippets: [],
          source: "ollama",
          model: ollamaModel,
        };
      }
    } catch {
      // Degrade gracefully to local heuristic
    }
  }

  // Local AST heuristic engine (100% offline)
  return heuristicAnswer({ question, sections, repoMeta });
}
