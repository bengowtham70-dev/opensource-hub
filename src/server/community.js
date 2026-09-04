import fs from "node:fs";
import path from "node:path";
import { getUserDataDir } from "./paths.js";

// PRD §34 — community layer, local-first, zero backend (plans/PLAN_PHASE2.md P8).
// Suggestions / Yes-No suitability votes / crowd tags / report flags persist in
// the user-data dir next to favorites.json. Export flows compose GitHub issue
// deep links client-side, so no server of ours ever exists (PRD §5).

export const BASELINE_PAIRING_VOTES = {
  "supabase/supabase": { yes: 142, partial: 18, no: 6 },
  "usebruno/bruno": { yes: 115, partial: 14, no: 3 },
  "toeverything/affine": { yes: 92, partial: 31, no: 11 },
  "dani-garcia/vaultwarden": { yes: 130, partial: 8, no: 2 },
  "penpot/penpot": { yes: 88, partial: 24, no: 7 },
  "pocketbase/pocketbase": { yes: 98, partial: 12, no: 4 },
  "mattermost/mattermost": { yes: 76, partial: 20, no: 8 },
  "nocodb/nocodb": { yes: 84, partial: 16, no: 5 },
  "umami-software/umami": { yes: 105, partial: 12, no: 2 },
  "makeplane/plane": { yes: 68, partial: 19, no: 6 },
  "signoz/signoz": { yes: 54, partial: 15, no: 4 },
  "teableio/teable": { yes: 48, partial: 12, no: 3 },
};

export const CURATED_SEED_SUGGESTIONS = [
  {
    id: "sugg-linear-plane",
    name: "Plane",
    url: "https://github.com/makeplane/plane",
    replaces: "Linear / Jira",
    category: "Project Management",
    note: "Modern open-source project management tool with cycles, modules, and views.",
    votes: 142,
    status: "seeded",
    seededRepo: "makeplane/plane",
    createdAt: "2026-08-01T10:00:00.000Z",
  },
  {
    id: "sugg-datadog-signoz",
    name: "SigNoz",
    url: "https://github.com/signoz/signoz",
    replaces: "Datadog / New Relic",
    category: "Observability & APM",
    note: "Open-source APM, distributed tracing, and metrics platform powered by OpenTelemetry.",
    votes: 118,
    status: "seeded",
    seededRepo: "signoz/signoz",
    createdAt: "2026-08-05T12:00:00.000Z",
  },
  {
    id: "sugg-airtable-teable",
    name: "Teable",
    url: "https://github.com/teableio/teable",
    replaces: "Airtable",
    category: "Databases & Spreadsheets",
    note: "Superfast, real-time database-spreadsheet alternative built on top of Postgres.",
    votes: 89,
    status: "seeded",
    seededRepo: "teableio/teable",
    createdAt: "2026-08-10T14:30:00.000Z",
  },
  {
    id: "sugg-zapier-activepieces",
    name: "Activepieces",
    url: "https://github.com/activepieces/activepieces",
    replaces: "Zapier / Make",
    category: "Automation & Workflows",
    note: "Open-source business automation platform with 200+ integrations and AI steps.",
    votes: 74,
    status: "under-review",
    createdAt: "2026-08-15T09:15:00.000Z",
  },
  {
    id: "sugg-loom-cap",
    name: "Cap",
    url: "https://github.com/CapSoftware/Cap",
    replaces: "Loom",
    category: "Video & Screen Recording",
    note: "Open-source Loom alternative for instant screen recording and sharing.",
    votes: 52,
    status: "open",
    createdAt: "2026-08-20T16:45:00.000Z",
  },
  {
    id: "sugg-segment-jitsu",
    name: "Jitsu",
    url: "https://github.com/jitsucom/jitsu",
    replaces: "Segment / RudderStack",
    category: "Analytics & Customer Data",
    note: "Open-source Customer Data Platform (CDP) for event streaming and reverse ETL.",
    votes: 46,
    status: "open",
    createdAt: "2026-08-25T11:20:00.000Z",
  },
];

export function createCommunityStore({ dir = process.env.OSH_DATA_DIR || getUserDataDir() } = {}) {
  const file = path.join(dir, "community.json");
  const SCHEMA_VERSION = 1;
  const CAPS = { suggestions: 100, flags: 200, tagsPerRepo: 24 };
  const TAG_RE = /^[a-z0-9][a-z0-9-]{1,23}$/;

  function read() {
    try {
      const raw = JSON.parse(fs.readFileSync(file, "utf8"));
      if (raw.schemaVersion === SCHEMA_VERSION) return raw;
    } catch {
      // first run or corrupted file — start fresh rather than crash
    }
    return { schemaVersion: SCHEMA_VERSION, suggestions: [], votes: {}, tags: {}, flags: [] };
  }

  function write(data) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }

  return {
    getRepo(repo) {
      const data = read();
      const key = repo.toLowerCase();
      const v = data.votes[key] || {};
      return {
        votes: { yes: v.yes || 0, no: v.no || 0 },
        myVote: v.my || null,
        tags: data.tags[key] || {},
      };
    },

    getParityConsensus(repo) {
      const key = repo.toLowerCase();
      const data = read();
      const local = data.votes[key] || { yes: 0, partial: 0, no: 0, my: null };
      const base = BASELINE_PAIRING_VOTES[key] || { yes: 0, partial: 0, no: 0 };

      const yes = (base.yes || 0) + (local.yes || 0);
      const partial = (base.partial || 0) + (local.partial || 0);
      const no = (base.no || 0) + (local.no || 0);
      const total = yes + partial + no;

      const consensusPct = total > 0 ? Math.round(((yes * 1.0 + partial * 0.5) / total) * 100) : 100;
      const fullPct = total > 0 ? Math.round((yes / total) * 100) : 100;
      const partialPct = total > 0 ? Math.round((partial / total) * 100) : 0;
      const notViablePct = total > 0 ? Math.round((no / total) * 100) : 0;
      const caution = total >= 8 && notViablePct >= 35;

      return {
        repo,
        myVote: local.my || null,
        total,
        consensusPct,
        caution,
        breakdown: {
          full: { count: yes, pct: fullPct },
          partial: { count: partial, pct: partialPct },
          notViable: { count: no, pct: notViablePct },
        },
        votes: { yes, partial, no },
      };
    },

    vote(repo, choice) {
      if (choice !== "yes" && choice !== "no" && choice !== "partial") {
        throw new Error("invalid choice");
      }
      const data = read();
      const key = repo.toLowerCase();
      const v = data.votes[key] || { yes: 0, partial: 0, no: 0, my: null };
      if (v.my === choice) {
        // Toggle off — clicking your own vote again retracts it.
        v[choice] = Math.max(0, (v[choice] || 0) - 1);
        v.my = null;
      } else {
        if (v.my && v[v.my]) {
          v[v.my] = Math.max(0, v[v.my] - 1); // switching sides moves the count
        }
        v[choice] = (v[choice] || 0) + 1;
        v.my = choice;
      }
      data.votes[key] = v;
      write(data);
      return this.getRepo(repo);
    },

    addTag(repo, rawTag) {
      const clean = String(rawTag || "").trim().toLowerCase().replace(/\s+/g, "-");
      if (!TAG_RE.test(clean)) throw new Error("invalid tag");
      const data = read();
      const key = repo.toLowerCase();
      const tags = data.tags[key] || {};
      if (!(clean in tags) && Object.keys(tags).length >= CAPS.tagsPerRepo) {
        throw new Error("tag limit reached");
      }
      tags[clean] = (tags[clean] || 0) + 1;
      data.tags[key] = tags;
      write(data);
      return this.getRepo(repo);
    },

    upvoteTag(repo, rawTag) {
      return this.addTag(repo, rawTag);
    },

    addSuggestion({ name, url = "", note = "", replaces = "", category = "" }) {
      const cleanName = String(name || "").trim();
      if (!cleanName || cleanName.length > 120) throw new Error("invalid suggestion");
      const data = read();
      const id = `sugg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const suggestionItem = {
        id,
        name: cleanName,
        url: String(url || "").slice(0, 300),
        replaces: String(replaces || "").slice(0, 100),
        category: String(category || "Developer Tools").slice(0, 80),
        note: String(note || "").slice(0, 500),
        votes: 1,
        status: "open",
        createdAt: new Date().toISOString(),
      };
      data.suggestions.push(suggestionItem);
      if (data.suggestions.length > CAPS.suggestions) data.suggestions.shift();
      write(data);
      return { ok: true, queued: data.suggestions.length, id, suggestion: suggestionItem };
    },

    listSuggestions({ sort = "votes", status = "all", search = "" } = {}) {
      const d = read();
      let list = [...(d.suggestions || [])];
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          (s) =>
            s.name?.toLowerCase().includes(q) ||
            s.replaces?.toLowerCase().includes(q) ||
            s.category?.toLowerCase().includes(q) ||
            s.note?.toLowerCase().includes(q)
        );
      }
      if (status && status !== "all") {
        list = list.filter((s) => (s.status || "open") === status);
      }
      if (sort === "newest") {
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      } else {
        list.sort((a, b) => (b.votes || 1) - (a.votes || 1) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      }
      return list.map((s) => ({ ...s, upvotes: s.votes || 1 }));
    },

    upvoteSuggestion(id) {
      const data = read();
      const target = (data.suggestions || []).find((s) => s.id === id || s.name?.toLowerCase() === String(id).toLowerCase());
      if (!target) throw new Error("Suggestion not found");
      target.votes = (target.votes || 1) + 1;
      write(data);
      return { ok: true, id: target.id, upvotes: target.votes, votes: target.votes };
    },

    ensureSeeded() {
      const data = read();
      if (!Array.isArray(data.suggestions)) {
        data.suggestions = [];
      }
      // Migrate legacy suggestions without id/votes
      data.suggestions = data.suggestions.map((s, idx) => ({
        id: s.id || `sugg-legacy-${idx}-${String(s.name || "item").toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        name: s.name || "Untitled Tool",
        url: s.url || "",
        replaces: s.replaces || "",
        category: s.category || "Developer Tools",
        note: s.note || "",
        votes: typeof s.votes === "number" ? s.votes : 1,
        status: s.status || "open",
        createdAt: s.createdAt || new Date().toISOString(),
        ...s,
      }));

      // Merge curated seed suggestions if not present
      for (const seed of CURATED_SEED_SUGGESTIONS) {
        const exists = data.suggestions.some(
          (s) => s.id === seed.id || (s.name && s.name.toLowerCase() === seed.name.toLowerCase())
        );
        if (!exists) {
          data.suggestions.push({ ...seed });
        }
      }
      write(data);
      return data.suggestions.length;
    },

    addFlag({ repo, field = "", note = "", reason = "", currentClaim = "", suggestedValue = "" }) {
      if (!/^[\w.-]+\/[\w.-]+$/.test(String(repo || ""))) throw new Error("invalid repo");
      const data = read();
      const id = `flag-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const flagItem = {
        id,
        repo: String(repo),
        field: String(field || reason || "").slice(0, 60),
        reason: String(reason || field || "Data Inaccuracy").slice(0, 100),
        currentClaim: String(currentClaim || "").slice(0, 200),
        suggestedValue: String(suggestedValue || "").slice(0, 200),
        note: String(note || "").slice(0, 500),
        status: "open",
        createdAt: new Date().toISOString(),
      };
      data.flags.push(flagItem);
      if (data.flags.length > CAPS.flags) data.flags.shift();
      write(data);
      return { ok: true, reported: data.flags.length, id, flag: flagItem };
    },

    listFlags() {
      const d = read();
      return d.flags || [];
    },

    list() {
      const d = read();
      return { suggestions: d.suggestions, flags: d.flags };
    },

    // PRD §17 — full community data for the user export (F1, plans/PLAN_FEATURES.md).
    exportData() {
      const d = read();
      return { votes: d.votes, tags: d.tags, suggestions: d.suggestions, flags: d.flags };
    },

    // F11 — import side of the export loop. Merges counts; never overwrites
    // higher local values (a vote/tag you already cast stays).
    importData(data) {
      const cur = read();
      for (const [repo, v] of Object.entries(data?.votes || {})) {
        if (!/^[a-z0-9][\w.-]*\/[\w.-]+$/i.test(repo)) continue;
        const key = repo.toLowerCase();
        const mine = cur.votes[key] || { yes: 0, partial: 0, no: 0, my: null };
        cur.votes[key] = {
          yes: Math.max(mine.yes || 0, Number(v.yes) || 0),
          partial: Math.max(mine.partial || 0, Number(v.partial) || 0),
          no: Math.max(mine.no || 0, Number(v.no) || 0),
          my: mine.my || v.my || null,
        };
      }
      for (const [repo, tags] of Object.entries(data?.tags || {})) {
        if (!/^[a-z0-9][\w.-]*\/[\w.-]+$/i.test(repo)) continue;
        const key = repo.toLowerCase();
        cur.tags[key] = { ...(cur.tags[key] || {}) };
        for (const [tag, n] of Object.entries(tags || {})) {
          if (typeof n !== "number") continue;
          cur.tags[key][tag] = Math.max(cur.tags[key][tag] || 0, n);
        }
      }
      const seenSuggestions = new Set(cur.suggestions.map((s) => s.name));
      for (const s of data?.suggestions || []) {
        if (s?.name && !seenSuggestions.has(s.name)) {
          cur.suggestions.push({
            id: s.id || `sugg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: String(s.name).slice(0, 120),
            url: String(s.url || "").slice(0, 300),
            replaces: String(s.replaces || "").slice(0, 100),
            category: String(s.category || "Developer Tools").slice(0, 80),
            note: String(s.note || "").slice(0, 500),
            votes: Number(s.votes) || 1,
            status: s.status || "open",
            createdAt: String(s.createdAt || new Date().toISOString()),
          });
        }
      }
      write(cur);
      return { votes: Object.keys(cur.votes).length, tags: Object.keys(cur.tags).length, suggestions: cur.suggestions.length };
    },
  };
}

