import fs from "node:fs";
import path from "node:path";
import { getUserDataDir } from "./paths.js";

// PRD §34 — community layer, local-first, zero backend (plans/PLAN_PHASE2.md P8).
// Suggestions / Yes-No suitability votes / crowd tags / report flags persist in
// the user-data dir next to favorites.json. Export flows compose GitHub issue
// deep links client-side, so no server of ours ever exists (PRD §5).
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

    vote(repo, choice) {
      if (choice !== "yes" && choice !== "no") throw new Error("invalid choice");
      const data = read();
      const key = repo.toLowerCase();
      const v = data.votes[key] || { yes: 0, no: 0, my: null };
      if (v.my === choice) {
        // Toggle off — clicking your own vote again retracts it.
        v[choice] -= 1;
        v.my = null;
      } else {
        if (v.my) v[v.my] -= 1; // switching sides moves the count
        v[choice] += 1;
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

    addSuggestion({ name, url = "", note = "" }) {
      const cleanName = String(name || "").trim();
      if (!cleanName || cleanName.length > 120) throw new Error("invalid suggestion");
      const data = read();
      data.suggestions.push({
        name: cleanName,
        url: String(url || "").slice(0, 300),
        note: String(note || "").slice(0, 500),
        createdAt: new Date().toISOString(),
      });
      if (data.suggestions.length > CAPS.suggestions) data.suggestions.shift();
      write(data);
      return { ok: true, queued: data.suggestions.length };
    },

    addFlag({ repo, field = "", note = "" }) {
      if (!/^[\w.-]+\/[\w.-]+$/.test(String(repo || ""))) throw new Error("invalid repo");
      const data = read();
      data.flags.push({
        repo: String(repo),
        field: String(field || "").slice(0, 60),
        note: String(note || "").slice(0, 500),
        createdAt: new Date().toISOString(),
      });
      if (data.flags.length > CAPS.flags) data.flags.shift();
      write(data);
      return { ok: true, reported: data.flags.length };
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
        const mine = cur.votes[key] || { yes: 0, no: 0, my: null };
        cur.votes[key] = {
          yes: Math.max(mine.yes || 0, Number(v.yes) || 0),
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
            name: String(s.name).slice(0, 120),
            url: String(s.url || "").slice(0, 300),
            note: String(s.note || "").slice(0, 500),
            createdAt: String(s.createdAt || new Date().toISOString()),
          });
        }
      }
      write(cur);
      return { votes: Object.keys(cur.votes).length, tags: Object.keys(cur.tags).length, suggestions: cur.suggestions.length };
    },
  };
}
