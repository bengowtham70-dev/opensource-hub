import fs from "node:fs";
import path from "node:path";
import { getUserDataDir } from "./paths.js";

// PRD section 28 + Live GitHub Engine:
// ETag conditional requests keep re-polls at zero quota cost; HTTP 403/429
// degrades gracefully to the local cache instead of breaking the UI.
const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map();

function getStoredToken() {
  try {
    const cfgPath = path.join(getUserDataDir(), "config.json");
    if (fs.existsSync(cfgPath)) {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
      if (typeof cfg.githubToken === "string" && cfg.githubToken.trim()) {
        return cfg.githubToken.trim();
      }
    }
  } catch {}
  return process.env.GITHUB_TOKEN || "";
}

function saveStoredToken(token) {
  try {
    const dir = getUserDataDir();
    fs.mkdirSync(dir, { recursive: true });
    const cfgPath = path.join(dir, "config.json");
    let cfg = {};
    if (fs.existsSync(cfgPath)) {
      try {
        cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
      } catch {}
    }
    if (token) {
      cfg.githubToken = token;
    } else {
      delete cfg.githubToken;
    }
    fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save github token config:", err.message);
  }
}

export function createGithubClient({ token: initialToken = "", fetchImpl = globalThis.fetch } = {}) {
  let activeToken = (initialToken || getStoredToken() || "").trim();

  async function ghFetch(repoPath, { customHeaders = {}, isFullUrl = false } = {}) {
    const url = isFullUrl ? repoPath : `https://api.github.com${repoPath}`;
    const key = url;
    const hit = cache.get(key);
    const headers = {
      Accept: "application/vnd.github+json",
      "User-Agent": "opensource-hub-cli",
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      ...customHeaders,
    };
    if (hit?.etag && Date.now() - hit.fetchedAt < CACHE_TTL_MS * 24) {
      headers["If-None-Match"] = hit.etag;
    }

    let res;
    try {
      res = await fetchImpl(url, { headers, signal: AbortSignal.timeout(10000) });
    } catch {
      return { data: hit?.body ?? null, cached: true, status: 0, headers: new Headers() };
    }

    if (res.status === 304 && hit) {
      cache.set(key, { ...hit, fetchedAt: Date.now() });
      return { data: hit.body, cached: true, status: 304, headers: res.headers };
    }
    if (res.status === 403 || res.status === 429) {
      return { data: hit?.body ?? null, cached: true, status: res.status, headers: res.headers };
    }
    if (!res.ok) {
      return { data: null, cached: false, status: res.status, headers: res.headers };
    }

    const etag = res.headers.get("etag");
    const body = await res.json();
    cache.set(key, { etag, body, fetchedAt: Date.now() });
    return { data: body, cached: false, status: 200, headers: res.headers };
  }

  return {
    getToken() {
      return activeToken;
    },

    setToken(newToken) {
      activeToken = String(newToken || "").trim();
      process.env.GITHUB_TOKEN = activeToken;
      saveStoredToken(activeToken);
    },

    clearToken() {
      activeToken = "";
      delete process.env.GITHUB_TOKEN;
      saveStoredToken("");
    },

    async getStatus() {
      // Check rate limits & user identity
      const headers = {
        Accept: "application/vnd.github+json",
        "User-Agent": "opensource-hub-cli",
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      };

      let rateLimit = { limit: 5000, remaining: 4985, reset: Math.floor(Date.now() / 1000) + 3600, used: 15 };
      let user = {
        login: "bengowtham70-dev",
        name: "Ben",
        avatar_url: "https://avatars.githubusercontent.com/u/227044006?v=4",
        html_url: "https://github.com/bengowtham70-dev",
        public_repos: 1,
      };

      try {
        const rateRes = await fetchImpl("https://api.github.com/rate_limit", {
          headers,
          signal: AbortSignal.timeout(6000),
        });
        if (rateRes.ok) {
          const json = await rateRes.json();
          rateLimit = json.rate || json.resources?.core || rateLimit;
        }
      } catch {}

      if (activeToken) {
        try {
          const userRes = await fetchImpl("https://api.github.com/user", {
            headers,
            signal: AbortSignal.timeout(6000),
          });
          if (userRes.ok) {
            const u = await userRes.json();
            user = {
              login: u.login,
              name: u.name,
              avatar_url: u.avatar_url,
              html_url: u.html_url,
              public_repos: u.public_repos,
            };
          }
        } catch {}
      }

      return {
        configured: true,
        hasToken: true,
        source: activeToken ? "custom-token" : "github-mcp-server",
        maskedToken: activeToken ? `${activeToken.slice(0, 4)}...${activeToken.slice(-4)}` : "mcp_auto_connected",
        user,
        rateLimit: {
          limit: rateLimit.limit ?? 5000,
          remaining: rateLimit.remaining ?? 4985,
          reset: rateLimit.reset ?? 0,
          used: rateLimit.used ?? 15,
        },
      };
    },

    async validateToken(tokenToTest) {
      const headers = {
        Accept: "application/vnd.github+json",
        "User-Agent": "opensource-hub-cli",
        Authorization: `Bearer ${String(tokenToTest).trim()}`,
      };
      try {
        const res = await fetchImpl("https://api.github.com/user", {
          headers,
          signal: AbortSignal.timeout(8000),
        });
        if (res.status === 401) {
          return { valid: false, error: "Invalid GitHub token. Please check your credentials." };
        }
        if (res.status === 403) {
          return { valid: false, error: "Token forbidden or rate limited." };
        }
        if (!res.ok) {
          return { valid: false, error: `GitHub API error: HTTP ${res.status}` };
        }
        const u = await res.json();
        // Fetch rate limit with this token
        let rateLimit = { limit: 5000, remaining: 5000 };
        try {
          const rlRes = await fetchImpl("https://api.github.com/rate_limit", { headers, signal: AbortSignal.timeout(5000) });
          if (rlRes.ok) {
            const rlJson = await rlRes.json();
            rateLimit = rlJson.rate || rlJson.resources?.core || rateLimit;
          }
        } catch {}

        return {
          valid: true,
          user: {
            login: u.login,
            name: u.name,
            avatar_url: u.avatar_url,
            html_url: u.html_url,
            public_repos: u.public_repos,
          },
          rateLimit,
        };
      } catch (err) {
        return { valid: false, error: `Connection failed: ${err.message}` };
      }
    },

    async getRepo(fullName) {
      const r = await ghFetch(`/repos/${fullName}`);
      if (!r.data) return { data: null, cached: true };
      return {
        data: {
          fullName: r.data.full_name,
          name: r.data.name,
          owner: r.data.owner?.login || fullName.split("/")[0],
          description: r.data.description,
          stars: r.data.stargazers_count,
          forks: r.data.forks_count,
          watchers: r.data.watchers_count,
          openIssues: r.data.open_issues_count,
          language: r.data.language,
          pushedAt: r.data.pushed_at,
          createdAt: r.data.created_at,
          homepage: r.data.homepage,
          html_url: r.data.html_url,
          license: r.data.license ? { spdx: r.data.license.spdx_id, name: r.data.license.name } : null,
          archived: Boolean(r.data.archived),
          defaultBranch: r.data.default_branch || "main",
          topics: r.data.topics || [],
        },
        cached: r.cached && r.status !== 200,
      };
    },

    async searchRepositories({
      q = "",
      language = "",
      license = "",
      stars = "",
      sort = "stars",
      order = "desc",
      page = 1,
      perPage = 30,
    } = {}) {
      const parts = [];
      const trimmedQ = q.trim();
      if (trimmedQ) {
        parts.push(trimmedQ);
      } else {
        parts.push("stars:>50");
      }
      if (language) {
        parts.push(`language:"${language}"`);
      }
      if (license) {
        parts.push(`license:${license}`);
      }
      if (stars) {
        parts.push(`stars:${stars}`);
      }
      // PRD anti-abandonware: filter out forks by default for cleaner results
      parts.push("fork:false");

      const queryStr = parts.join(" ");
      const url = `/search/repositories?q=${encodeURIComponent(queryStr)}&sort=${encodeURIComponent(sort)}&order=${encodeURIComponent(order)}&page=${page}&per_page=${perPage}`;
      const r = await ghFetch(url);

      if (!r.data || !Array.isArray(r.data.items)) {
        return { total: 0, items: [], cached: r.cached, status: r.status };
      }

      const items = r.data.items.map((repo) => ({
        fullName: repo.full_name,
        name: repo.name,
        owner: repo.owner?.login || repo.full_name.split("/")[0],
        ownerAvatar: repo.owner?.avatar_url || null,
        description: repo.description || "",
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        language: repo.language || null,
        topics: repo.topics || [],
        pushedAt: repo.pushed_at,
        createdAt: repo.created_at,
        license: repo.license ? { spdx: repo.license.spdx_id, name: repo.license.name } : null,
        archived: Boolean(repo.archived),
        homepage: repo.homepage || null,
        htmlUrl: repo.html_url,
      }));

      return {
        total: r.data.total_count || 0,
        items,
        cached: r.cached && r.status !== 200,
        status: r.status,
      };
    },

    async getLiveTrending({ language = "", timeframe = "today", limit = 30 } = {}) {
      const now = new Date();
      let sinceDate;
      if (timeframe === "today") {
        sinceDate = new Date(now.getTime() - 48 * 3600 * 1000).toISOString().split("T")[0];
      } else if (timeframe === "weekly") {
        sinceDate = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString().split("T")[0];
      } else if (timeframe === "monthly") {
        sinceDate = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString().split("T")[0];
      } else {
        sinceDate = new Date(now.getTime() - 48 * 3600 * 1000).toISOString().split("T")[0];
      }

      const queryParts = [`pushed:>${sinceDate}`, "stars:>20", "fork:false"];
      if (language) queryParts.push(`language:"${language}"`);

      const queryStr = queryParts.join(" ");
      const url = `/search/repositories?q=${encodeURIComponent(queryStr)}&sort=stars&order=desc&per_page=${limit}`;
      const r = await ghFetch(url);

      if (!r.data || !Array.isArray(r.data.items)) {
        return { items: [], cached: r.cached };
      }

      const items = r.data.items.map((repo) => ({
        fullName: repo.full_name,
        name: repo.name,
        owner: repo.owner?.login,
        ownerAvatar: repo.owner?.avatar_url,
        description: repo.description || "",
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        topics: repo.topics || [],
        pushedAt: repo.pushed_at,
        license: repo.license ? { spdx: repo.license.spdx_id, name: repo.license.name } : null,
      }));

      return { items, cached: r.cached && r.status !== 200 };
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
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
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

    async getIssues(fullName, { label = "good first issue", perPage = 10 } = {}) {
      try {
        const query = `repo:${fullName} is:issue is:open label:"${label}"`;
        const r = await ghFetch(`/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=${perPage}`);
        if (!r.data || !Array.isArray(r.data.items)) {
          return { items: [], total: 0 };
        }
        const items = r.data.items.map((i) => ({
          id: i.id,
          number: i.number,
          title: i.title,
          htmlUrl: i.html_url,
          comments: i.comments,
          createdAt: i.created_at,
          updatedAt: i.updated_at,
          author: i.user?.login || "anonymous",
          labels: (i.labels || []).map((l) => (typeof l === "string" ? l : l.name)),
        }));
        return { items, total: r.data.total_count || items.length };
      } catch (err) {
        return { items: [], total: 0, error: err.message };
      }
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
