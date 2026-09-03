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
import { searchCatalog } from "./db.js";

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

// Offline fallback: keyword × tags × category × description overlap scoring,
// augmented with SQLite FTS5 catalog search across 26,000+ open-source repos.
export function heuristicFind(task, pairings, limit = 5) {
  const words = tokenize(task);
  const scored = (pairings || []).map((p) => {
    const a = p.alternative;
    const haystackTags = (a.tags || []).join(" ").toLowerCase();
    let score = 0;
    const hits = [];
    for (const w of words) {
      if (p.paidTool.name.toLowerCase().includes(w)) { score += 6; hits.push(w); }
      if (p.paidTool.category.toLowerCase().includes(w)) { score += 4; hits.push(w); }
      if (haystackTags.includes(w)) { score += 3; hits.push(w); }
      if (a.name.toLowerCase().includes(w)) { score += 3; hits.push(w); }
      if (a.description.toLowerCase().includes(w)) { score += 1; hits.push(w); }
    }
    return { pairing: p, score, hits: [...new Set(hits)], repo: a.repo };
  });

  const results = scored
    .filter((s) => s.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((s) => ({
      repo: s.repo,
      reason: `Matched your description on: ${s.hits.join(", ")}.`,
      confidence: Math.min(0.9, 0.3 + s.score / 20),
    }));

  // If fewer than limit, augment from the 26,000+ SQLite catalog via FTS5
  if (results.length < limit && words.length > 0) {
    try {
      const q = words.slice(0, 3).join(" ");
      const cat = searchCatalog({ q, limit: limit * 2, sort: "stars" });
      const existing = new Set(results.map((r) => r.repo.toLowerCase()));
      for (const item of cat.items || []) {
        if (!existing.has(item.repo.toLowerCase())) {
          results.push({
            repo: item.repo,
            reason: item.description ? item.description.slice(0, 120) : `Matched your task keywords: ${words.slice(0, 2).join(", ")}.`,
            confidence: 0.75,
          });
          existing.add(item.repo.toLowerCase());
          if (results.length >= limit) break;
        }
      }
    } catch {}
  }

  return results;
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
  // (localhost http allowed for dev runtimes like Ollama). Anchored with an
  // optional port + path/end boundary so lookalike hosts (localhost.evil.com,
  // 127.0.0.1@evil.com) can't slip past; case-insensitive because URL hosts
  // are case-insensitive (http://LOCALHOST:11434 is still localhost).
  const url = String(baseUrl || "");
  const localhostRe = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i;
  if (!/^https:\/\//.test(url) && !localhostRe.test(url)) {
    // invalidBaseUrl lets the client distinguish "user's URL was rejected"
    // (misconfigured Ollama, typo, uppercase LOCALHOST, IPv6 literal) from a
    // normal no-key offline fallback — silently heuristics here made the
    // misconfiguration undiagnosable.
    return {
      mode: "offline",
      invalidBaseUrl: true,
      summary: "API base URL rejected — use https:// (or http://localhost:port for local runtimes).",
      items: heuristicFind(clean, pairings),
    };
  }

  const isLocalhost = localhostRe.test(url);
  if (!apiKey && !isLocalhost) {
    return {
      mode: "offline",
      summary: "Offline matching (no API key set) — keyword overlap only.",
      items: heuristicFind(clean, pairings),
    };
  }

  // Pre-seed catalog context with pairings + top matching catalog items from SQLite
  const words = tokenize(clean);
  const catalogContext = compactCatalog(pairings);
  if (words.length > 0) {
    try {
      const extraCat = searchCatalog({ q: words.slice(0, 3).join(" "), limit: 15, sort: "stars" });
      const seen = new Set(catalogContext.map((c) => c.repo.toLowerCase()));
      for (const item of extraCat.items || []) {
        if (!seen.has(item.repo.toLowerCase())) {
          catalogContext.push({
            repo: item.repo,
            name: item.name,
            category: (item.topics && item.topics[0]) || item.language || "Open Source Tool",
            replaces: item.alternativeTo || "Commercial Software",
            tags: item.topics || [],
            description: item.description || "",
            platforms: item.platforms && item.platforms.length > 0 ? item.platforms : ["self-host"],
            license: item.license || "Open Source",
          });
          seen.add(item.repo.toLowerCase());
          if (catalogContext.length >= 150) break;
        }
      }
    } catch {}
  }

  try {
    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const res = await fetchImpl(`${url.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers,
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
            content: `Task: ${clean}\n\nCatalog:\n${JSON.stringify(catalogContext)}`,
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
    // Membership AND uniqueness: models without strict structured-output
    // support (Ollama/OpenRouter presets) can repeat a repo; duplicate cards
    // keyed by the same repo would render twice.
    const validRepos = new Set(catalogContext.map((c) => c.repo.toLowerCase()));
    const seenRepos = new Set();
    const items = (Array.isArray(parsed.items) ? parsed.items : [])
      .filter((it) => {
        const repo = String(it.repo || "").toLowerCase();
        if (!validRepos.has(repo) || seenRepos.has(repo)) return false;
        seenRepos.add(repo);
        return true;
      })
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
