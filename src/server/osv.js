// PRD section 29 — vulnerability advisories via OSV.dev.
// Keyless, no rate limit; querybatch ≤1000 queries per call.
// Details fetched per-hit only, cached by (repo, id, modified) in the user-data
// dir — strictly repo-scoped so one project's advisories can never leak into
// another's during degrade (plans/PLAN_PHASE2.md P4 revision).
// Silent degradation: any network/5xx failure returns the last known cache
// with cached:true — the UI never breaks because OSV is down.
import fs from "node:fs";
import path from "node:path";

export function createOsvClient({ cacheDir, fetchImpl = globalThis.fetch } = {}) {
  const cacheFile = path.join(cacheDir, "osv-cache.json");

  function readCache() {
    try {
      const parsed = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
      // Legacy shape ({vulns:{id:entry}}) predates repo scoping — ignored for
      // reads; the first scoped write replaces the file wholesale.
      return { byRepo: parsed.byRepo || {} };
    } catch {
      return { byRepo: {} };
    }
  }

  function writeCache(cache) {
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify(cache));
  }

  async function fetchDetail(scope, id, modified) {
    const cache = readCache();
    const hit = cache.byRepo[scope]?.[id];
    if (hit && hit.modified === modified) {
      return { ...hit };
    }
    const res = await fetchImpl(`https://api.osv.dev/v1/vulns/${encodeURIComponent(id)}`, {
      headers: { "User-Agent": "opensource-hub-cli" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`osv detail ${res.status}`);
    const json = await res.json();
    const entry = {
      id: json.id,
      modified: json.modified || modified,
      summary: json.summary || json.details?.slice(0, 160) || id,
      severity: json.severity?.[0]?.score || null,
      url: `https://osv.dev/vulnerability/${json.id}`,
    };
    cache.byRepo[scope] = cache.byRepo[scope] || {};
    cache.byRepo[scope][id] = entry;
    writeCache(cache);
    return entry;
  }

  // coords: [{ ecosystem: "npm", name, version? }, ...]
  // opts.commit: HEAD sha for commit-range advisories (covers repos without packages)
  // opts.scope: repo fullName — cache + degrade namespace. When omitted, the
  // scope is derived from the queried coordinates so unrelated packages can
  // never share a degrade bucket (leak regression covered by test/osv.test.js).
  // Returns { vulns: [...], degraded: bool }
  async function query(coords, { commit, scope = "" } = {}) {
    const usable = (coords || []).filter((c) => c && c.ecosystem && c.name);
    const queries = usable.map((c) =>
      c.version
        ? { package: { ecosystem: c.ecosystem, name: c.name }, version: c.version }
        : { package: { ecosystem: c.ecosystem, name: c.name } }
    );
    if (commit) queries.push({ commit });
    if (!queries.length) return { vulns: [], degraded: false };

    const effectiveScope =
      scope ||
      (usable.length
        ? usable.map((c) => `${String(c.ecosystem).toLowerCase()}:${String(c.name).toLowerCase()}`).sort().join("|")
        : `commit:${commit}`);

    let results;
    try {
      const res = await fetchImpl("https://api.osv.dev/v1/querybatch", {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "opensource-hub-cli" },
        signal: AbortSignal.timeout(10000),
        body: JSON.stringify({ queries }),
      });
      if (!res.ok) throw new Error(`osv batch ${res.status}`);
      ({ results } = await res.json());
    } catch {
      // Degrade: serve THIS scope's previously known advisories from disk only.
      const cache = readCache();
      const known = Object.values(cache.byRepo[effectiveScope] || {});
      return { vulns: known, degraded: true };
    }

    const ids = [];
    // OSV guarantees results[i] matches queries[i] — guard anyway against
    // short/malformed responses so one bad batch can't crash the request.
    queries.forEach((q, i) => {
      const r = results?.[i];
      const origin = q.commit
        ? { eco: "git", name: scope }
        : { eco: q.package.ecosystem, name: q.package.name };
      for (const v of r?.vulns || []) {
        ids.push({ id: v.id, modified: v.modified, ...origin });
      }
    });

    const vulns = [];
    let failed = 0;
    for (const { id, modified, eco, name } of ids) {
      try {
        const detail = await fetchDetail(effectiveScope, id, modified);
        vulns.push({ ...detail, ecosystems: [eco], packages: [name] });
      } catch {
        failed += 1;
      }
    }
    if (ids.length > 0 && failed === ids.length) {
      // Every detail fetch failed — degrade to this repo's disk cache only.
      const cache = readCache();
      return { vulns: Object.values(cache.byRepo[scope] || {}), degraded: true };
    }
    return { vulns, degraded: false };
  }

  return { query };
}
