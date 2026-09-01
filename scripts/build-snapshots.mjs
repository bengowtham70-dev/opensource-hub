// PRD section 28.2 layer 3: daily snapshot cron running on GitHub's free
// Actions infrastructure. One GraphQL batch request per ~80 repos keeps a
// 1,000-repo catalog at ~10-13 API calls/day against GITHUB_TOKEN.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPairingMetrics } from "../src/server/metrics.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const OUT = path.join(root, "src", "data", "snapshots-seed.json");
const BATCH = 80;

function getCatalog() {
  const alt = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "alternatives.json"), "utf8"));
  const repos = new Set(alt.pairings.map((p) => p.alternative.repo));
  return [...repos];
}

function batchQuery(repos) {
  const aliases = repos
    .map((r, i) => {
      const [owner, name] = r.split("/");
      return `r${i}: repository(owner: "${owner}", name: "${name}") { stargazerCount pushedAt isArchived createdAt latestRelease { tagName } }`;
    })
    .join("\n");
  return `query { ${aliases} rateLimit { remaining } }`;
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN required (Actions provides one automatically)");
  const catalog = getCatalog();
  const stars = {};
  const meta = {};

  for (let i = 0; i < catalog.length; i += BATCH) {
    const slice = catalog.slice(i, i + BATCH);
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "User-Agent": "opensource-hub-snapshot" },
      body: JSON.stringify({ query: batchQuery(slice) }),
    });
    if (!res.ok) throw new Error(`graphql ${res.status}: ${await res.text()}`);
    const json = await res.json();
    if (json.errors) throw new Error(JSON.stringify(json.errors));
    slice.forEach((repo, j) => {
      const node = json.data[`r${j}`];
      if (!node) return; // repo renamed/deleted — stale-list pruning handles it later (PRD section 15)
      stars[repo] = node.stargazerCount;
      // §3d — createdAt + latestTag ride the same query (zero extra API calls);
      // powers repo-age + latest-release stats on web profiles.
      meta[repo] = {
        pushedAt: node.pushedAt,
        archived: node.isArchived,
        createdAt: node.createdAt || null,
        latestTag: node.latestRelease?.tagName || null,
      };
    });
  }

  // Append today's point to rolling 30-day history per repo.
  let existing = {};
  try {
    existing = JSON.parse(fs.readFileSync(OUT, "utf8"));
  } catch {
    /* first run */
  }
  const today = new Date().toISOString().slice(0, 10);
  const history = existing.history || {};
  for (const [repo, count] of Object.entries(stars)) {
    const points = history[repo] || [];
    if (points.at(-1)?.date !== today) {
      points.push({ date: today, stars: count });
    }
    history[repo] = points.slice(-30);
  }

  // PRD Phase-2 item 6 — weekly downloads samples for repos with package coords.
  // Daily cron, but we only append when the last sample is ≥6 days old.
  const alt = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "alternatives.json"), "utf8"));
  const ecoByRepo = new Map(
    alt.pairings.map((p) => [p.alternative.repo, p.alternative.ecosystems || {}])
  );
  const downloadsHistory = existing.downloadsHistory || {};
  for (const [repo, eco] of ecoByRepo) {
    if (!eco.npm && !eco.pypi && !eco.docker) continue;
    if (!stars[repo]) continue; // repo vanished — stale-list pruning handles removal (PRD §15)
    const samples = downloadsHistory[repo] || [];
    const last = samples.at(-1);
    if (last && (Date.now() - new Date(last.date).getTime()) / 86400000 < 6) continue;
    try {
      const metrics = await getPairingMetrics(eco);
      if (Object.keys(metrics).length) {
        samples.push({ date: today, ...metrics });
        downloadsHistory[repo] = samples.slice(-26);
      }
    } catch {
      /* tolerated — metrics are best-effort */
    }
  }

  fs.writeFileSync(
    OUT,
    `${JSON.stringify(
      {
        version: 1,
        generatedAt: new Date().toISOString(),
        source: "actions",
        stars,
        meta,
        history,
        downloadsHistory,
      },
      null,
      2
    )}\n`
  );
  console.log(`snapshots written for ${Object.keys(stars).length}/${catalog.length} repos`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
