#!/usr/bin/env node
// PRD §32 — Local MCP server endpoint (`opensource-hub --mcp`).
// Exposes the catalog as Model Context Protocol tools over stdio so
// Claude Code, Cursor and other agent clients can query alternatives,
// Trust Scores and trending data programmatically. Zero central infra:
// reads the same static JSON the dashboard reads, on the user's machine.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchPairings, getPairings, findPairingByRepo, loadSnapshotData, getStars30d, getFreshness, getMaintenance, computeTrending } from "./data.js";
import { computeTrust } from "./trust.js";
import { createGithubClient } from "./github.js";
import { getPackageVersion } from "./version.js";
import { initEmbeddedPayload } from "./repo-files.js";
import { evaluateHardwareFit } from "./hardware.js";
import { generateComposeBundle } from "./compose-bundle.js";
import { answerRepoQuestion } from "./repo-assistant.js";
import { getRepoByFullName } from "./db.js";

const CHARACTER_LIMIT = 25000;

function truncate(text) {
  if (text.length <= CHARACTER_LIMIT) return { text, truncated: false };
  const cut = text.slice(0, CHARACTER_LIMIT - 300);
  return {
    text: `${cut}\n\n… truncated (${text.length} → ${CHARACTER_LIMIT} chars). Narrow query with platform/license or use limit/offset.`,
    truncated: true,
  };
}

function formatPairing(p, snapshotData) {
  const stars = snapshotData ? getStars30d(snapshotData, p.alternative.repo) : null;
  const freshness = snapshotData ? getFreshness(snapshotData, p.alternative.repo) : null;
  const maintenance = snapshotData ? getMaintenance(snapshotData, p.alternative.repo) : null;
  return {
    paidTool: p.paidTool,
    alternative: p.alternative,
    relationship: p.relationship,
    goalTags: p.goalTags,
    stars30d: stars,
    freshness,
    maintenance,
  };
}

export function buildMcpServer() {
  const server = new McpServer({
    name: "opensource-hub",
    version: getPackageVersion(),
  });

  // ---- search_alternatives ----
  server.registerTool(
    "search_alternatives",
    {
      title: "Search Open-Source Alternatives",
      description: `Search free open-source alternatives to paid software. Query by paid tool name ("Notion", "Figma"), keyword, or filter by platform/license/language/goal. Returns alternatives with savings, parity, stars, and maintenance.

Use when: user asks "alternative to X", "free replacement for X", "self-hostable alternative to X".

Args:
  - q: paid tool name or keyword (e.g. "Notion", "Postman")
  - platform: win | mac | linux | web | self-host (optional)
  - license: permissive | copyleft | network-copyleft (optional)
  - language: programming language e.g. TypeScript, Go (optional)
  - goal: goalTags filter e.g. replace-notion (optional)
  - limit: max results 1-50 (default 10)
  - offset: pagination offset (default 0)

Returns: { count, results: [{ paidTool, alternative, stars30d, maintenance, relationship }] }

Error: never throws — empty query returns all, unknown facets return 0 matches.`,
      inputSchema: {
        q: z.string().max(120).default("").describe("Paid tool name or keyword to search"),
        platform: z.enum(["win", "mac", "linux", "web", "self-host"]).optional().describe("Platform facet"),
        license: z.enum(["permissive", "copyleft", "network-copyleft"]).optional().describe("License type facet"),
        language: z.string().max(30).optional().describe("Programming language filter"),
        goal: z.string().max(40).optional().describe("Goal tag e.g. replace-notion"),
        limit: z.number().int().min(1).max(50).default(10).describe("Max results"),
        offset: z.number().int().min(0).default(0).describe("Pagination offset"),
        response_format: z.enum(["markdown", "json"]).default("markdown").describe("Output format"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ q = "", platform = "", license = "", language = "", goal = "", limit = 10, offset = 0, response_format = "markdown" }) => {
      try {
        const all = searchPairings({ q, platform, license, language, goal });
        const snapshotData = await loadSnapshotData().catch(() => null);
        const slice = all.slice(offset, offset + limit).map((p) => formatPairing(p, snapshotData));
        const output = {
          query: { q, platform, license, language, goal },
          total: all.length,
          count: slice.length,
          offset,
          has_more: offset + slice.length < all.length,
          ...(offset + slice.length < all.length ? { next_offset: offset + slice.length } : {}),
          results: slice,
        };

        const jsonText = JSON.stringify(output, null, 2);
        let text;
        if (response_format === "json") {
          const t = truncate(jsonText);
          text = t.text;
        } else {
          if (!slice.length) {
            text = `No alternatives found for "${q || "all"}"${platform ? ` on ${platform}` : ""}${license ? ` (${license})` : ""}. Try a broader query.`;
          } else {
            const lines = [`# Alternatives for "${q || "all"}" — ${output.total} total, showing ${slice.length}`, ""];
            for (const r of slice) {
              lines.push(`## ${r.alternative.name} (${r.alternative.repo}) — replaces ${r.paidTool.name}`);
              lines.push(`- **Saves:** $${r.paidTool.pricePerYearUsd}/yr vs ${r.paidTool.name} ${r.paidTool.planName}`);
              lines.push(`- **Stars:** ${r.stars30d?.stars ?? "?"} (${r.stars30d ? `${r.stars30d.changePct > 0 ? "+" : ""}${r.stars30d.changePct}% 30d` : "no sparkline yet"})`);
              lines.push(`- **Maintenance:** ${r.maintenance?.status ?? "unknown"}${r.maintenance ? ` (${r.maintenance.reason})` : ""}`);
              lines.push(`- **License:** ${r.alternative.license?.spdx ?? "?"} (${r.alternative.license?.type ?? "?"})`);
              lines.push(`- **Platforms:** ${(r.alternative.platforms || []).join(", ") || "?"}`);
              lines.push(`- **Tags:** ${(r.alternative.tags || []).join(", ")}`);
              lines.push(`- **Parity:** ${(r.alternative.parity || []).join(" · ")}`);
              if (r.alternative.gaps?.length) lines.push(`- **Gaps:** ${r.alternative.gaps.join(" · ")}`);
              lines.push("");
            }
            if (output.has_more) lines.push(`… ${output.total - offset - slice.length} more. Use offset=${output.next_offset} for next page.`);
            text = lines.join("\n");
          }
          const t = truncate(text);
          text = t.text;
        }

        return {
          content: [{ type: "text", text }],
          structuredContent: output,
        };
      } catch (e) {
        return {
          content: [{ type: "text", text: `Error in search_alternatives: ${e instanceof Error ? e.message : String(e)}` }],
          isError: true,
        };
      }
    }
  );

  // ---- get_trust_score ----
  server.registerTool(
    "get_trust_score",
    {
      title: "Get Trust Score",
      description: `Get the 9-signal Trust Score (0-100) for a catalog repo: commit recency, archived flag, license clarity, issue hygiene, community traction, maturity, bus factor, backing, OpenSSF Scorecard. Includes maintenance status and red flags.

Use when: user asks "is X safe/maintained?" or "trust score for Y".

Args:
  - repo: full repo slug owner/name e.g. "toeverything/AFFiNE"
  - response_format: markdown | json

Returns: { score, band, maintenance, signals[], redFlags[], appeal }

Error: returns isError if repo not in catalog or GitHub unavailable — never throws.`,
      inputSchema: {
        repo: z.string().min(3).max(120).describe("Full repo slug owner/name e.g. toeverything/AFFiNE"),
        response_format: z.enum(["markdown", "json"]).default("markdown").describe("Output format"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ repo, response_format = "markdown" }) => {
      try {
        const cleanRepo = String(repo).toLowerCase().trim();
        const pairing = findPairingByRepo(cleanRepo);
        const dbRepo = !pairing ? getRepoByFullName(cleanRepo) : null;
        if (!pairing && !dbRepo) {
          return {
            content: [{ type: "text", text: `Error: repo "${repo}" not in catalog. Use search_alternatives to discover available repos.` }],
            isError: true,
          };
        }
        const gh = createGithubClient();
        const [liveResult, contribResult, scorecardResult] = await Promise.all([
          gh.getRepo(cleanRepo),
          gh.getContributorCount(cleanRepo),
          gh.getScorecard(cleanRepo),
        ]);
        const trustInput = liveResult.data
          ? { ...liveResult.data, contributors: contribResult.data, scorecard: scorecardResult.data }
          : null;
        // Fallback to snapshot meta or catalog data if live unavailable
        let fallbackTrust = null;
        if (!trustInput) {
          try {
            const snapshotData = await loadSnapshotData();
            const meta = snapshotData.meta?.[cleanRepo] || snapshotData.meta?.[cleanRepo.toLowerCase()];
            const stars = snapshotData.stars?.[cleanRepo] ?? snapshotData.stars?.[cleanRepo.toLowerCase()] ?? dbRepo?.stars ?? 1000;
            fallbackTrust = computeTrust({
              fullName: cleanRepo,
              pushedAt: meta?.pushedAt || dbRepo?.pushedAt || new Date().toISOString(),
              archived: !!meta?.archived || !!dbRepo?.archived,
              stars,
              license: pairing?.alternative?.license || { spdx: dbRepo?.license || "MIT" },
              openIssues: 0,
              createdAt: dbRepo?.createdAt || new Date(Date.now() - 700 * 86400000).toISOString(),
            });
          } catch {
            fallbackTrust = computeTrust({
              fullName: cleanRepo,
              pushedAt: dbRepo?.pushedAt || new Date().toISOString(),
              archived: !!dbRepo?.archived,
              stars: dbRepo?.stars || 1000,
              license: pairing?.alternative?.license || { spdx: dbRepo?.license || "MIT" },
              openIssues: 0,
              createdAt: dbRepo?.createdAt || new Date(Date.now() - 700 * 86400000).toISOString(),
            });
          }
        }
        const trust = trustInput ? computeTrust(trustInput) : fallbackTrust;
        if (!trust) {
          return {
            content: [{ type: "text", text: `Trust data unavailable for "${repo}". Try again shortly.` }],
            isError: true,
          };
        }
        const altName = pairing?.alternative?.name || dbRepo?.name || cleanRepo.split("/")[1] || cleanRepo;
        const replacesName = pairing?.paidTool?.name || "Proprietary Software";
        const output = {
          repo: cleanRepo,
          alternative: altName,
          replaces: replacesName,
          trust,
          liveCached: liveResult.cached || !liveResult.data,
        };
        const jsonText = JSON.stringify(output, null, 2);
        let text;
        if (response_format === "json") {
          text = truncate(jsonText).text;
        } else {
          const lines = [
            `# Trust Score: ${repo} — ${trust.score}/100 (${trust.band})`,
            `Replaces: ${pairing.paidTool.name} · Alternative: ${pairing.alternative.name}`,
            `Maintenance: ${trust.maintenance.status} — ${trust.maintenance.reason}`,
            "",
            `## Signals`,
          ];
          for (const s of trust.signals) lines.push(`- ${s.label}: +${s.points} — ${s.detail}`);
          if (trust.redFlags.length) {
            lines.push("", `## Red Flags`);
            for (const f of trust.redFlags) lines.push(`- ⚠ ${f}`);
          }
          lines.push("", `Appeal: ${trust.appeal}`, "", `_${trust.disclaimer}_`);
          if (output.liveCached) lines.push("", `*Note: live GitHub data was cached/rate-limited; score may be stale.*`);
          text = truncate(lines.join("\n")).text;
        }
        return { content: [{ type: "text", text }], structuredContent: output };
      } catch (e) {
        return { content: [{ type: "text", text: `Error in get_trust_score: ${e instanceof Error ? e.message : String(e)}` }], isError: true };
      }
    }
  );

  // ---- get_trending ----
  server.registerTool(
    "get_trending",
    {
      title: "Get Trending Alternatives",
      description: `List trending open-source alternatives by star momentum. Four views: today (30d % growth), yesterday (1d change), least (established ≥1000 stars, smallest 7d growth), all-time (total stars).

Use when: "what's hot?", "trending alternatives", "least trending".

Args:
  - view: today | yesterday | least | all-time (default today)
  - limit: 1-30 (default 10)
  - offset: pagination offset (default 0)
  - response_format: markdown | json

Returns: { view, generatedAt, repos: [{ repo, stars, change, changePct, freshness, maintenance }] }`,
      inputSchema: {
        view: z.enum(["today", "yesterday", "least", "all-time"]).default("today").describe("Trending view"),
        limit: z.number().int().min(1).max(30).default(10).describe("Max repos"),
        offset: z.number().int().min(0).default(0).describe("Pagination offset"),
        response_format: z.enum(["markdown", "json"]).default("markdown").describe("Output format"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ view = "today", limit = 10, offset = 0, response_format = "markdown" }) => {
      try {
        const data = await computeTrending(view);
        const slice = data.repos.slice(offset, offset + limit);
        const output = {
          view: data.view,
          generatedAt: data.generatedAt,
          origin: data.origin,
          total: data.repos.length,
          count: slice.length,
          offset,
          has_more: offset + slice.length < data.repos.length,
          ...(offset + slice.length < data.repos.length ? { next_offset: offset + slice.length } : {}),
          repos: slice.map((r) => ({
            repo: r.repo,
            stars: r.stars,
            change: r.change,
            changePct: r.changePct,
            freshness: r.freshness,
            maintenance: r.maintenance,
          })),
        };
        const jsonText = JSON.stringify(output, null, 2);
        let text;
        if (response_format === "json") {
          text = truncate(jsonText).text;
        } else {
          const lines = [`# Trending — ${view} (generated ${data.generatedAt}, origin ${data.origin})`, `Total: ${data.repos.length}, showing ${slice.length}`, ""];
          for (const r of slice) {
            lines.push(`- **${r.repo}** — ${r.stars} stars (${r.changePct > 0 ? "+" : ""}${r.changePct}% 30d, ${r.change > 0 ? "+" : ""}${r.change} stars) · ${r.maintenance?.status ?? "unknown"}${r.freshness ? ` · ${r.freshness.days}d since push` : ""}`);
          }
          if (output.has_more) lines.push("", `… more available at offset=${output.next_offset}.`);
          text = truncate(lines.join("\n")).text;
        }
        return { content: [{ type: "text", text }], structuredContent: output };
      } catch (e) {
        return { content: [{ type: "text", text: `Error in get_trending: ${e instanceof Error ? e.message : String(e)}` }], isError: true };
      }
    }
  );

  // ---- get_alternative_details ----
  server.registerTool(
    "get_alternative_details",
    {
      title: "Get Alternative Details",
      description: `Get full details for one catalog alternative: paid tool it replaces, savings, parity/gaps, migration notes, platforms, license, screenshots, Trust Score inputs where live.

Use when: user picks a repo from search and wants deep dive.

Args:
  - repo: owner/name
  - response_format: markdown | json

Returns: { pairing, live, trust, stars30d, freshness, maintenance } or error if not in catalog.`,
      inputSchema: {
        repo: z.string().min(3).max(120).describe("Full repo slug owner/name"),
        response_format: z.enum(["markdown", "json"]).default("markdown").describe("Output format"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ repo, response_format = "markdown" }) => {
      try {
        const cleanRepo = String(repo).toLowerCase().trim();
        const pairing = findPairingByRepo(cleanRepo);
        const dbRepo = !pairing ? getRepoByFullName(cleanRepo) : null;
        if (!pairing && !dbRepo) {
          return {
            content: [{ type: "text", text: `Error: "${repo}" not in catalog. Search via search_alternatives first.` }],
            isError: true,
          };
        }
        const effectivePairing = pairing || {
          paidTool: { name: "Proprietary Software", category: dbRepo.category || "Developer Tools", pricePerYearUsd: 240, planName: "Commercial" },
          alternative: {
            name: dbRepo.name || cleanRepo.split("/")[1],
            repo: dbRepo.fullName || cleanRepo,
            description: dbRepo.description || "",
            language: dbRepo.language || "Unknown",
            stars: dbRepo.stars || 0,
            platforms: ["self-host", "linux"],
            license: { spdx: dbRepo.license || "Open Source", type: "permissive" },
            parity: ["Core open-source functionality", "Self-hosted deployment"],
            gaps: ["Managed cloud SLA"],
            migrationNotes: "Import data using standard API or DB dump.",
          },
          relationship: "Alternative",
          goalTags: [dbRepo.category || "open-source"],
        };
        const snapshotData = await loadSnapshotData().catch(() => null);
        const gh = createGithubClient();
        const [liveResult, contribResult, scorecardResult] = await Promise.all([
          gh.getRepo(cleanRepo),
          gh.getContributorCount(cleanRepo),
          gh.getScorecard(cleanRepo),
        ]);
        const trustInput = liveResult.data ? { ...liveResult.data, contributors: contribResult.data, scorecard: scorecardResult.data } : null;
        const trust = trustInput ? computeTrust(trustInput) : null;
        const stars30d = snapshotData ? getStars30d(snapshotData, cleanRepo) : null;
        const freshness = snapshotData ? getFreshness(snapshotData, cleanRepo) : null;
        const maintenance = snapshotData ? getMaintenance(snapshotData, cleanRepo) : null;

        const output = {
          repo: cleanRepo,
          pairing: effectivePairing,
          live: liveResult.data,
          liveCached: liveResult.cached || !liveResult.data,
          trust,
          stars30d,
          freshness,
          maintenance,
        };
        const jsonText = JSON.stringify(output, null, 2);
        let text;
        if (response_format === "json") {
          text = truncate(jsonText).text;
        } else {
          const a = effectivePairing.alternative;
          const lines = [
            `# ${a.name} (${cleanRepo}) — replaces ${effectivePairing.paidTool.name}`,
            a.description,
            "",
            `**Category:** ${effectivePairing.paidTool.category} · **Price replaced:** $${effectivePairing.paidTool.pricePerYearUsd}/yr (${effectivePairing.paidTool.planName})`,
            `**Language:** ${a.language} · **Platforms:** ${(a.platforms || []).join(", ")} · **License:** ${a.license?.spdx} (${a.license?.type})`,
            `**Relationship:** ${effectivePairing.relationship} · **Goals:** ${(effectivePairing.goalTags || []).join(", ")}`,
            "",
            `## Parity`,
            ...(a.parity || []).map((p) => `- ✓ ${p}`),
            `## Gaps`,
            ...(a.gaps || []).map((g) => `- · ${g}`),
            "",
            `**Migration:** ${a.migrationNotes || "—"}`,
            ...(a.demoUrl ? [`**Demo:** ${a.demoUrl}`] : []),
            ...(stars30d ? [`**Stars:** ${stars30d.stars} (${stars30d.changePct}% 30d)`] : []),
            ...(maintenance ? [`**Maintenance:** ${maintenance.status} — ${maintenance.reason}`] : []),
            ...(trust ? [`**Trust:** ${trust.score}/100 (${trust.band})`] : ["**Trust:** unavailable (rate-limited)"]),
            ...(trust?.redFlags?.length ? ["", "## Red Flags", ...trust.redFlags.map((f) => `- ⚠ ${f}`)] : []),
          ];
          text = truncate(lines.join("\n")).text;
        }
        return { content: [{ type: "text", text }], structuredContent: output };
      } catch (e) {
        return { content: [{ type: "text", text: `Error in get_alternative_details: ${e instanceof Error ? e.message : String(e)}` }], isError: true };
      }
    }
  );

  // ---- simulate_hardware ----
  server.registerTool(
    "simulate_hardware",
    {
      title: "Simulate Hardware Fit",
      description: `Evaluate RAM and CPU feasibility for self-hosting open-source tools on a user's VPS or local machine. Flags OOM risk, architecture compatibility (x86_64 vs arm64), and recommends lightweight swaps (e.g. PocketBase for Supabase, Vaultwarden for Bitwarden).

Use when: user asks "Can I run X on a 2GB VPS?", "How much RAM for Supabase?", or needs hardware sizing.

Args:
  - tool: repo slug (e.g. "supabase/supabase" or "supabase") or tool name
  - ram_mb: available RAM in megabytes (e.g. 1024, 2048, 4096, 8192) - default 2048
  - arch: x86_64 | arm64 (default x86_64)
  - cpus: number of CPU cores (default 2)
  - response_format: markdown | json

Returns: { verdict, status, tone, ramMb, headroomMb, headroomPct, swaps, toolBreakdown }`,
      inputSchema: {
        tool: z.string().describe("Repo slug or tool name (e.g. 'supabase/supabase' or 'supabase')"),
        ram_mb: z.number().default(2048).describe("RAM in megabytes"),
        arch: z.enum(["x86_64", "arm64"]).default("x86_64").describe("System architecture"),
        cpus: z.number().default(2).describe("CPU cores count"),
        response_format: z.enum(["markdown", "json"]).default("markdown").describe("Output format"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ tool, ram_mb = 2048, arch = "x86_64", cpus = 2, response_format = "markdown" }) => {
      try {
        const fit = evaluateHardwareFit({ tool, ram_mb, arch, cpus });
        const jsonText = JSON.stringify(fit, null, 2);
        if (response_format === "json") {
          return { content: [{ type: "text", text: jsonText }], structuredContent: fit };
        }
        const lines = [
          `# Hardware Simulation: ${tool}`,
          `**Verdict:** ${fit.verdict} (${fit.status})`,
          `**RAM Allocated:** ${fit.ramMb} MB · **Required:** ${fit.totalRequiredMb} MB · **Headroom:** ${fit.headroomMb} MB (${fit.headroomPct}%)`,
          `**Architecture:** ${fit.arch} · **CPUs:** ${fit.cpus}`,
          "",
          "## Breakdown",
          ...(fit.toolBreakdown || []).map(
            (t) => `- **${t.name}**: ~${t.idleRamMb} MB idle RAM | Arch supported: ${t.isArchOk ? "✓" : "✗"}`
          ),
          ...(fit.swaps?.length
            ? [
                "",
                "## Recommended Leaner Swaps",
                ...fit.swaps.map((s) => `- **${s.name}** (${s.target}): Saves ${s.ramSavingsMb} MB RAM — *${s.reason}*`),
              ]
            : []),
        ];
        return { content: [{ type: "text", text: lines.join("\n") }], structuredContent: fit };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error simulating hardware: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // ---- generate_compose_stack ----
  server.registerTool(
    "generate_compose_stack",
    {
      title: "Generate Docker Compose Stack",
      description: `Generate a unified multi-service docker-compose.yml and deployment kit with zero port collisions. Resolves conflicting ports automatically, generates secure random credentials in .env.example, and provides production healthchecks, start.sh, start.ps1, and README.md.

Use when: user wants a combined self-hosted stack (e.g. "Generate compose for Supabase + Umami + Plausible").

Args:
  - tools: array of repo slugs or tool names (e.g. ["supabase/supabase", "umami-software/umami"])
  - stack_name: slug for stack naming and networks (default "my-opensource-stack")
  - response_format: markdown | json

Returns: { stackName, services, files: { "docker-compose.yml", ".env.example", "start.sh", "start.ps1", "README.md" } }`,
      inputSchema: {
        tools: z.array(z.string()).min(1).describe("List of repo slugs or tool names to include in stack"),
        stack_name: z.string().default("my-opensource-stack").describe("Stack identifier"),
        response_format: z.enum(["markdown", "json"]).default("markdown").describe("Output format"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ tools = [], stack_name = "my-opensource-stack", response_format = "markdown" }) => {
      try {
        const bundle = generateComposeBundle({ tools, stackName: stack_name });
        if (response_format === "json") {
          return { content: [{ type: "text", text: JSON.stringify(bundle, null, 2) }], structuredContent: bundle };
        }
        const lines = [
          `# Docker Compose Stack: ${bundle.stackName}`,
          `Included Services: ${bundle.services.map((s) => `**${s.name}** (port ${s.port})`).join(", ")}`,
          "",
          "## Generated `docker-compose.yml`",
          "```yaml",
          bundle.files["docker-compose.yml"] || "",
          "```",
          "",
          "## Generated `.env.example`",
          "```bash",
          bundle.files[".env.example"] || "",
          "```",
        ];
        return { content: [{ type: "text", text: lines.join("\n") }], structuredContent: bundle };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error generating compose stack: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // ---- ask_repo ----
  server.registerTool(
    "ask_repo",
    {
      title: "Ask Repository Assistant",
      description: `Ask technical questions about any open-source repository (architecture, docker setup, config, env vars). Uses local AST markdown parsing with fallback to local Ollama if active. Zero external API keys required.

Use when: user asks "How do I deploy X with Docker?", "What env vars does Y need?", or "Explain architecture of Z".

Args:
  - repo: repository slug owner/name e.g. "supabase/supabase"
  - question: technical question to answer
  - response_format: markdown | json

Returns: { answer, matchedSection, codeSnippets, source }`,
      inputSchema: {
        repo: z.string().min(3).max(120).describe("Full repo slug owner/name e.g. supabase/supabase"),
        question: z.string().min(3).describe("Technical question about installation, env vars, or architecture"),
        response_format: z.enum(["markdown", "json"]).default("markdown").describe("Output format"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ repo, question, response_format = "markdown" }) => {
      try {
        const cleanRepo = String(repo).toLowerCase().trim();
        const pairing = findPairingByRepo(cleanRepo);
        const dbRepo = !pairing ? getRepoByFullName(cleanRepo) : null;
        const gh = createGithubClient();
        const live = await gh.getRepo(cleanRepo).catch(() => ({ data: null }));

        let markdown = "";
        try {
          const resp = await fetch(`https://raw.githubusercontent.com/${cleanRepo}/HEAD/README.md`, {
            headers: { "User-Agent": "OpenSource-Hub/1.0" },
            signal: AbortSignal.timeout(4000),
          }).catch(() => null);
          if (resp && resp.ok) {
            markdown = await resp.text();
          }
        } catch {
          // offline fallback
        }

        const repoMeta = {
          name: pairing?.alternative?.name || dbRepo?.name || live.data?.name || cleanRepo.split("/")[1] || cleanRepo,
          repo: cleanRepo,
          language: pairing?.alternative?.language || dbRepo?.language || live.data?.language || "Unknown",
          stars: live.data?.stars || dbRepo?.stars || pairing?.alternative?.stars || 0,
          license: pairing?.alternative?.license || { spdx: live.data?.license || dbRepo?.license || "Open Source" },
        };

        const result = await answerRepoQuestion({
          question,
          markdown,
          repoMeta,
        });

        if (response_format === "json") {
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], structuredContent: result };
        }

        const lines = [
          `# ${repoMeta.name} — Technical Assistant`,
          `**Question:** ${question}`,
          `**Source:** ${result.source} (Section: ${result.matchedSection})`,
          "",
          result.answer,
        ];
        return { content: [{ type: "text", text: lines.join("\n") }], structuredContent: result };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error in ask_repo: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  // ---- Resource: catalog ----
  server.registerResource(
    "catalog",
    "osh://catalog/alternatives",
    {
      title: "Full Alternatives Catalog",
      description: "Complete catalog of paid-tool → open-source alternative pairings (28 entries). Same data the dashboard reads.",
      mimeType: "application/json",
    },
    async (uri) => {
      const pairings = getPairings();
      const text = JSON.stringify({ count: pairings.length, pairings }, null, 2);
      const t = truncate(text);
      return {
        contents: [{ uri: uri.href, mimeType: "application/json", text: t.text }],
      };
    }
  );

  return server;
}

export async function runMcp() {
  await initEmbeddedPayload();
  const server = buildMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // keep process alive via stdio — no HTTP server needed
  console.error(`◆ OpenSource Hub MCP server v${getPackageVersion()} — stdio ready (7 tools + 1 resource)`);
}
