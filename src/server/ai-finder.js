// PRD §21 — AI Tool Finder (F7, plans/PLAN_FEATURES.md).
// Architecture note (documented deviation from PRD §21.6): the LOCAL app holds
// the user's OWN key (client-side, sent per-request, never persisted server-side).
// A central proxy becomes necessary only for the paid tier.
//
// API surface verified 2026: Structured Outputs (response_format json_schema,
// strict:true) — OpenAI's recommendation over legacy JSON mode. Schema rules
// honored: top-level object, all fields required, additionalProperties:false.
// The `refusal` field is handled explicitly; local validation runs anyway.
import { searchPairings } from "./data.js";

const STOP = new Set([
  "i", "need", "want", "a", "an", "the", "for", "to", "my", "me", "something", "that",
  "can", "with", "and", "of", "it", "is", "app", "tool", "software", "free", "open",
  "source", "alternative", "replace", "instead", "like", "manage", "managing", "use", "using",
]);

export function tokenize(task) {
  return String(task || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

// Offline fallback: keyword × tags × category × description overlap scoring.
export function heuristicFind(task, pairings, limit = 5) {
  const words = tokenize(task);
  const scored = pairings.map((p) => {
    const a = p.alternative;
    const haystackTags = a.tags.join(" ").toLowerCase();
    let score = 0;
    const hits = [];
    for (const w of words) {
      if (p.paidTool.name.toLowerCase().includes(w)) { score += 6; hits.push(w); }
      if (p.paidTool.category.toLowerCase().includes(w)) { score += 4; hits.push(w); }
      if (haystackTags.includes(w)) { score += 3; hits.push(w); }
      if (a.name.toLowerCase().includes(w)) { score += 3; hits.push(w); }
      if (a.description.toLowerCase().includes(w)) { score += 1; hits.push(w);
      }
    }
    return { pairing: p, score, hits: [...new Set(hits)] };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((s) => ({
      repo: s.pairing.alternative.repo,
      reason: `Matched your description on: ${s.hits.join(", ")}.`,
      confidence: Math.min(0.9, 0.3 + s.score / 20),
    }));
}

const SCHEMA = {
  name: "tool_shortlist",
  strict: true,
  schema: {
    type: "object",
    properties: {
      summary: { type: "string" },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            repo: { type: "string" },
            reason: { type: "string" },
            confidence: { type: "number" },
          },
          required: ["repo", "reason", "confidence"],
          additionalProperties: false,
        },
      },
    },
    required: ["summary", "items"],
    additionalProperties: false,
  },
};

function compactCatalog(pairings) {
  return pairings.map((p) => ({
    repo: p.alternative.repo,
    name: p.alternative.name,
    category: p.paidTool.category,
    replaces: p.paidTool.name,
    tags: p.alternative.tags,
    description: p.alternative.description,
    platforms: p.alternative.platforms,
    license: p.alternative.license?.spdx ?? null,
  }));
}

// Returns { mode: "ai" | "offline", summary, items: [{repo, reason, confidence}] }
export async function findTools({
  task,
  pairings,
  apiKey = process.env.OPENAI_API_KEY || "",
  baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  model = process.env.OPENAI_MODEL || "gpt-5.4-mini",
  fetchImpl = globalThis.fetch,
}) {
  const clean = String(task || "").trim();
  if (!clean) return { mode: "offline", summary: "Describe what you need first.", items: [] };

  // Hardening: the server fetches user-supplied baseUrls — restrict to https
  // (localhost http allowed for dev runtimes like Ollama).
  const url = String(baseUrl || "");
  if (!/^https:\/\//.test(url) && !/^http:\/\/(localhost|127\.0\.0\.1)/.test(url)) {
    return { mode: "offline", summary: "Invalid API base URL — must be https.", items: heuristicFind(clean, pairings) };
  }

  if (!apiKey) {
    return {
      mode: "offline",
      summary: "Offline matching (no API key set) — keyword overlap only.",
      items: heuristicFind(clean, pairings),
    };
  }

  try {
    const res = await fetchImpl(`${url.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You match a described job to open-source tools from a fixed catalog. " +
              "Pick up to 5 repos that genuinely fit. Only use repos from the catalog. " +
              "Explain in one sentence why each fits, referencing the user's actual needs.",
          },
          {
            role: "user",
            content: `Task: ${clean}\n\nCatalog:\n${JSON.stringify(compactCatalog(pairings))}`,
          },
        ],
        response_format: { type: "json_schema", json_schema: SCHEMA },
      }),
    });
    if (!res.ok) throw new Error(`ai ${res.status}`);
    const json = await res.json();
    const msg = json.choices?.[0]?.message;
    if (msg?.refusal) throw new Error(`refusal: ${msg.refusal}`);
    const parsed = JSON.parse(msg?.content || "{}");

    // Local validation (defense-in-depth even with Structured Outputs).
    const byRepo = new Map(pairings.map((p) => [p.alternative.repo, p]));
    const items = (Array.isArray(parsed.items) ? parsed.items : [])
      .filter((it) => byRepo.has(it.repo))
      .slice(0, 5)
      .map((it) => ({
        repo: it.repo,
        reason: String(it.reason || "").slice(0, 300) || "Fits your description.",
        confidence: Math.max(0, Math.min(1, Number(it.confidence) || 0.5)),
      }));

    if (!items.length) throw new Error("empty shortlist");
    return { mode: "ai", summary: String(parsed.summary || "").slice(0, 300), items };
  } catch {
    // Any failure (network, malformed, refusal, empty) → honest offline fallback.
    return {
      mode: "offline",
      summary: "AI call failed — showing offline keyword matches instead.",
      items: heuristicFind(clean, pairings),
    };
  }
}

// Re-export for route convenience.
export { searchPairings };
