import { getPairings } from "./data.js";
import { createGithubClient } from "./github.js";

// Cache aggregated releases for 15 minutes to preserve GitHub API quotas
let releasesCache = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function getAggregatedReleases({ gh = createGithubClient() } = {}) {
  const now = Date.now();
  if (releasesCache && now - lastFetchedAt < CACHE_TTL_MS) {
    return { releases: releasesCache, fetchedAt: new Date(lastFetchedAt).toISOString() };
  }

  const pairings = getPairings();
  const topRepos = pairings.slice(0, 30).map((p) => ({
    repo: p.alternative.repo,
    name: p.alternative.name,
    paidTool: p.paidTool.name,
    category: p.paidTool.category,
  }));

  const releasePromises = topRepos.map(async ({ repo, name, paidTool, category }) => {
    try {
      const rel = await gh.getLatestRelease(repo);
      if (rel.data && rel.data.tag) {
        return {
          repo,
          name,
          paidTool,
          category,
          tag: rel.data.tag,
          title: rel.data.name || rel.data.tag,
          publishedAt: rel.data.publishedAt || new Date().toISOString(),
          body: rel.data.body || "",
          htmlUrl: rel.data.htmlUrl,
          assets: rel.data.assets || [],
          prerelease: Boolean(rel.data.prerelease),
        };
      }
    } catch {
      /* ignore individual repo errors */
    }
    return null;
  });

  const results = (await Promise.all(releasePromises)).filter(Boolean);

  // Sort latest first
  results.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  releasesCache = results;
  lastFetchedAt = now;

  return { releases: results, fetchedAt: new Date(now).toISOString() };
}
