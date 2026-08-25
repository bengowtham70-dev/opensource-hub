// PRD section 28: unauthenticated GitHub API is used ONLY for on-demand
// per-repo detail lookups from the user's own machine (60 req/hr per IP).
// ETag conditional requests keep re-polls at zero quota cost; HTTP 403/429
// degrades silently to the local cache instead of breaking the UI.
const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map();

export function createGithubClient({ token = process.env.GITHUB_TOKEN || "", fetchImpl = globalThis.fetch } = {}) {
  async function ghFetch(repoPath) {
    const key = repoPath;
    const hit = cache.get(key);
    const headers = {
      Accept: "application/vnd.github+json",
      "User-Agent": "opensource-hub-cli",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    if (hit?.etag && Date.now() - hit.fetchedAt < CACHE_TTL_MS * 24) {
      headers["If-None-Match"] = hit.etag;
    }

    let res;
    try {
      res = await fetchImpl(`https://api.github.com${repoPath}`, { headers, signal: AbortSignal.timeout(8000) });
    } catch {
      return { data: hit?.body ?? null, cached: true, status: 0 };
    }

    if (res.status === 304 && hit) {
      cache.set(key, { ...hit, fetchedAt: Date.now() });
      return { data: hit.body, cached: true, status: 304 };
    }
    if (res.status === 403 || res.status === 429) {
      // Rate-limited: serve whatever we have, flag it so the UI can badge "Cached".
      return { data: hit?.body ?? null, cached: true, status: res.status };
    }
    if (!res.ok) {
      return { data: null, cached: false, status: res.status };
    }

    const etag = res.headers.get("etag");
    const body = await res.json();
    cache.set(key, { etag, body, fetchedAt: Date.now() });
    return { data: body, cached: false, status: 200 };
  }

  return {
    async getRepo(fullName) {
      const r = await ghFetch(`/repos/${fullName}`);
      if (!r.data) return { data: null, cached: true };
      return {
        data: {
          fullName: r.data.full_name,
          description: r.data.description,
          stars: r.data.stargazers_count,
          openIssues: r.data.open_issues_count,
          pushedAt: r.data.pushed_at,
          createdAt: r.data.created_at,
          homepage: r.data.homepage,
        license: r.data.license ? { spdx: r.data.license.spdx_id, name: r.data.license.name } : null,
        archived: Boolean(r.data.archived),
        defaultBranch: r.data.default_branch || "main",
        topics: r.data.topics || [],
        },
        cached: r.cached && r.status !== 200,
      };
    },
    async getLatestRelease(fullName) {
      const r = await ghFetch(`/repos/${fullName}/releases/latest`);
      if (!r.data || !Array.isArray(r.data.assets)) return { data: null, cached: true };
      return {
        data: {
          tag: r.data.tag_name,
          publishedAt: r.data.published_at,
          assets: r.data.assets.map((a) => ({
            name: a.name,
            size: a.size,
            url: a.browser_download_url,
            digest: a.digest || null,
          })),
        },
        cached: r.cached && r.status !== 200,
      };
    },

    // Bus-factor input for Trust Score v2 — one cheap call:
    // per_page=1 + parse the last page number out of the Link header.
    async getContributorCount(fullName) {
      const key = `contributors:${fullName}`;
      const hit = cache.get(key);
      const headers = {
        Accept: "application/vnd.github+json",
        "User-Agent": "opensource-hub-cli",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      if (hit?.etag && Date.now() - hit.fetchedAt < CACHE_TTL_MS * 24) {
        headers["If-None-Match"] = hit.etag;
      }
      let res;
      try {
        res = await fetchImpl(
          `https://api.github.com/repos/${fullName}/contributors?per_page=1&anon=true`,
          { headers, signal: AbortSignal.timeout(8000) }
        );
      } catch {
        return { data: hit?.body ?? null, cached: true };
      }
      if (res.status === 304 && hit) {
        cache.set(key, { ...hit, fetchedAt: Date.now() });
        return { data: hit.body, cached: true };
      }
      if (res.status === 403 || res.status === 429) {
        return { data: hit?.body ?? null, cached: true };
      }
      if (!res.ok) return { data: null, cached: false };
      const link = res.headers.get("link") || "";
      const m = link.match(/[?&]page=(\d+)[^>]*>;\s*rel="last"/);
      const count = m ? Number(m[1]) : 1;
      const etag = res.headers.get("etag");
      cache.set(key, { etag, body: count, fetchedAt: Date.now() });
      return { data: count, cached: false };
    },

    // HEAD sha of a branch — one cached call, feeds OSV commit-range queries
    // (plans/PLAN_PHASE2.md P4: coverage for repos without package ecosystems).
    async getHeadSha(fullName, branch = "main") {
      const r = await ghFetch(`/repos/${fullName}/commits/${encodeURIComponent(branch)}`);
      if (!r.data?.sha) return { data: null, cached: true };
      return { data: r.data.sha, cached: r.cached && r.status !== 200 };
    },

    // OpenSSF Scorecard — keyless. Primary: api.scorecard.dev (official OSSF REST,
    // verified live 2026-08-24: {score: 5.4, repo:...}). Fallback: deps.dev v3alpha
    // precomputed results. Real scores cache 7 days (they move slowly); negative
    // results (repo not yet scored) cache 1h so uncovered repos don't re-hit APIs.
    async getScorecard(fullName) {
      const key = `scorecard:${fullName}`;
      const hit = cache.get(key);
      const ttl = hit ? hit.ttl : 0;
      if (hit && Date.now() - hit.fetchedAt < ttl) {
        return { data: hit.body, cached: true };
      }
      const score = (await this.tryScorecardSources(fullName)) ?? hit?.body ?? null;
      // Negative cache: null results expire quickly, real scores stick for a week.
      cache.set(key, {
        body: score,
        fetchedAt: Date.now(),
        ttl: score == null ? CACHE_TTL_MS : CACHE_TTL_MS * 24 * 7,
      });
      return { data: score, cached: false };
    },

    async tryScorecardSources(fullName) {
      // 1. OpenSSF Scorecard REST API.
      try {
        const res = await fetchImpl(
          `https://api.scorecard.dev/projects/github.com/${fullName}`,
          { headers: { "User-Agent": "opensource-hub-cli" }, signal: AbortSignal.timeout(8000) }
        );
        if (res.ok) {
          const json = await res.json();
          const score = Number(json.score);
          if (Number.isFinite(score)) return score;
        }
      } catch {}
      // 2. deps.dev precomputed fallback (unreachable on some networks).
      try {
        const res = await fetchImpl(
          `https://api.deps.dev/v3alpha/systems/github/repos/${fullName}`,
          { headers: { "User-Agent": "opensource-hub-cli" }, signal: AbortSignal.timeout(8000) }
        );
        if (res.ok) {
          const json = await res.json();
          const entry = (json.scores || []).find(
            (s) => s.scoreSystem === "OPENSSF_SCORECARD" || s.scoreSystem === "OpenSSF Scorecard"
          );
          const score = Number(entry?.score);
          if (Number.isFinite(score)) return score;
        }
      } catch {}
      return null;
    },
  };
}

const OS_ASSET_PATTERNS = {
  win32: [".exe", ".msi"],
  darwin: [".dmg", ".pkg"],
  linux: [".appimage", ".deb"],
};

// PRD section 2.6a: only repos with an OS-matched packaged release get "Run App".
export function pickOsAsset(assets, platform = process.platform) {
  const exts = OS_ASSET_PATTERNS[platform] || [];
  for (const ext of exts) {
    const match = assets.find((a) => a.name.toLowerCase().endsWith(ext));
    if (match) return match;
  }
  // Universal archives as last resort for mac/linux builds shipped as zip/tar.
  if (platform === "darwin") {
    const zips = assets.filter((a) => a.name.toLowerCase().endsWith(".zip"));
    const universal = zips.find((a) => /universal|macos|mac|osx|darwin/i.test(a.name));
    if (universal) return universal;
  }
  return null;
}
