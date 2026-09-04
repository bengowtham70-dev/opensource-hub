import { readRepoFile } from "./repo-files.js";
import { computeMaintenance } from "./trust.js";

function readJson(rel) {
  // plans/PLAN_PHASE2.md Phase 9 — disk read on npm installs, embedded payload
  // inside Bun-compiled binaries (PRD section 30 single-file distribution).
  return JSON.parse(readRepoFile(rel));
}

let alternativesCache = null;
export function getAlternatives() {
  if (!alternativesCache) {
    alternativesCache = readJson("src/data/alternatives.json");
  }
  return alternativesCache;
}

export function getPairings() {
  return getAlternatives().pairings;
}

export function findPairingByRepo(fullNameLower) {
  return getPairings().find(
    (p) => p.alternative.repo.toLowerCase() === fullNameLower
  );
}

export function getCatalog() {
  const seen = new Map();
  for (const p of getPairings()) {
    const a = p.alternative;
    if (!seen.has(a.repo)) {
      seen.set(a.repo, {
        repo: a.repo,
        name: a.name,
        language: a.language,
        tags: a.tags,
      });
    }
  }
  return [...seen.values()];
}

// PRD section 2.8: search by paid-tool name or keyword, filterable by language.
// PRD Phase 2 item 1 (plans/PLAN_PHASE2.md Phase 2): platform + license-type
// facets, AND-combined with q/language. Unknown facet values match nothing.
// PRD §38 goal-first browsing (Phase 7): goal facet AND-combined too —
// pre-filtered view behind every "I want to replace…" entry-grid tile.
export function searchPairings({ q = "", language = "", platform = "", license: licenseType = "", goal = "" } = {}) {
  const query = q.trim().toLowerCase();
  const wantPlatform = platform.trim().toLowerCase();
  const wantLicense = licenseType.trim().toLowerCase();
  const wantGoal = goal.trim().toLowerCase();
  return getPairings().filter((p) => {
    if (language && p.alternative.language.toLowerCase() !== language.toLowerCase()) {
      return false;
    }
    if (wantPlatform && !(p.alternative.platforms || []).some((x) => x.toLowerCase() === wantPlatform)) {
      return false;
    }
    if (wantLicense && p.alternative.license?.type?.toLowerCase() !== wantLicense) {
      return false;
    }
    if (wantGoal && !(p.goalTags || []).some((t) => t.toLowerCase() === wantGoal)) {
      return false;
    }
    if (!query) return true;
    const STOPWORDS = new Set([
      "free", "open", "source", "alternative", "alternatives", "replacement", "replacements",
      "replace", "replacing", "instead", "of", "for", "to", "the", "a", "an", "and", "or",
      "vs", "versus", "app", "apps", "tool", "tools", "software", "program", "programs",
    ]);
    const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const haystack = [
      p.paidTool.name,
      p.paidTool.slug,
      p.paidTool.category,
      p.alternative.name,
      p.alternative.repo,
      p.alternative.description,
      p.alternative.language,
      ...(p.alternative.platforms || []),
      ...(p.alternative.tags || []),
      ...(p.goalTags || []),
      p.alternative.license?.spdx || "",
      p.alternative.license?.type || "",
      p.relationship || "",
    ]
      .join(" ")
      .toLowerCase();
    // Split query, normalize hyphens, drop filler words user naturally types ("free alternative to Notion")
    let terms = normalize(query).split(/\s+/).filter((t) => t && !STOPWORDS.has(t));
    // If query was only stopwords ("free alternative"), treat as empty → show all
    if (terms.length === 0) terms = normalize(query).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return true;
    const haystackWords = haystack.split(/\s+/).filter(Boolean);
    const levenshtein = (a, b) => {
      if (Math.abs(a.length - b.length) > 2) return 99;
      const m = a.length, n = b.length;
      const dp = Array.from({ length: m + 1 }, (_, i) => Array(n + 1).fill(0));
      for (let i = 0; i <= m; i++) dp[i][0] = i;
      for (let j = 0; j <= n; j++) dp[0][j] = j;
      for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      return dp[m][n];
    };
    const fuzzyMatch = (term) => {
      if (term.length < 3) return false;
      const maxDist = term.length <= 6 ? 1 : 2;
      return haystackWords.some((w) => w.length >= 3 && levenshtein(term, w) <= maxDist);
    };
    return terms.every((term) => haystack.includes(term) || fuzzyMatch(term));
  });
}

// Stable pseudo-random drift from repo name hash — deterministic across restarts.
function seedRandom(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13; h >>>= 0;
    h ^= h >> 17;
    h ^= h << 5; h >>>= 0;
    return (h % 10000) / 10000;
  };
}

function generateSeedHistory(fullName, stars) {
  const rand = seedRandom(fullName);
  const points = [];
  let current = stars * (1 - 0.06 - rand() * 0.04);
  const step = (stars - current) / 29;
  const today = Date.now();
  for (let i = 0; i < 30; i += 1) {
    current += step * (0.6 + rand() * 0.9);
    points.push({
      date: new Date(today - (29 - i) * 86400000).toISOString().slice(0, 10),
      stars: Math.round(current),
    });
  }
  points[29].stars = stars;
  return points;
}

let remoteSnapshotsCache = null;

async function fetchRemoteSnapshots(url) {
  if (remoteSnapshotsCache) return remoteSnapshotsCache;
  const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`snapshot fetch ${res.status}`);
  const json = await res.json();
  remoteSnapshotsCache = json;
  return json;
}

// PRD section 28.2: static snapshot JSON is the primary data source
// (built daily by GitHub Actions, served via Pages/jsDelivr).
// The bundled seed file is the offline fallback so the app never shows an empty directory.
export async function loadSnapshotData() {
  const remoteUrl = process.env.OSH_SNAPSHOTS_URL || "";
  if (remoteUrl) {
    try {
      const json = await fetchRemoteSnapshots(remoteUrl);
      return { ...json, origin: "cdn" };
    } catch {
      // fall through to bundled seed
    }
  }
  const bundled = readJson("src/data/snapshots-seed.json");
  return { ...bundled, origin: bundled.source === "seed" ? "seed" : "bundled" };
}

export function getStars30d(snapshotData, fullName) {
  const stars = snapshotData.stars[fullName] ?? null;
  if (stars == null) return null;

  // PRD section 28.2 — the daily Actions cron collects REAL star history.
  // When enough genuine samples exist they win outright; the seeded
  // pseudo-random curve below remains only as the offline first-run demo
  // fallback so the dashboard is never empty before the first cron lands.
  const real = snapshotData.history?.[fullName];
  if (Array.isArray(real) && real.length >= 8) {
    const history = real.slice(-30);
    const first = history[0].stars;
    const last = history[history.length - 1].stars;
    const change = last - first;
    const pct = first > 0 ? (change / first) * 100 : 0;
    return { history, stars: last, change, changePct: Number(pct.toFixed(2)) };
  }

  const history = generateSeedHistory(fullName, stars);
  const first = history[0].stars;
  const last = history[history.length - 1].stars;
  const change = last - first;
  const pct = first > 0 ? (change / first) * 100 : 0;
  return { history, stars: last, change, changePct: Number(pct.toFixed(2)) };
}

// PRD Phase-2 item 6 — card freshness signal (plans/PLAN_PHASE2.md P5).
// Green <90d since last push, amber >180d, dim in between. Returns null when
// the snapshot carries no meta block (bundled seed) — freshness is never
// fabricated; cards simply omit the pill until the Actions cron populates it.
export function getFreshness(snapshotData, fullName) {
  const pushedAt = snapshotData.meta?.[fullName]?.pushedAt;
  if (!pushedAt) return null;
  const days = Math.floor((Date.now() - new Date(pushedAt).getTime()) / 86400000);
  return { pushedAt, days, tone: days < 90 ? "trust" : days > 180 ? "caution" : "dim" };
}

// PRD section 2.2 surfacing mandate — every comparison card carries a
// color-coded maintenance pill (green Active / amber Slowing / red Abandoned).
// Computed from the same snapshot meta the Trust Score uses; null on seed data
// (no meta yet) so cards never fabricate a state.
export function getMaintenance(snapshotData, fullName) {
  const meta = snapshotData.meta?.[fullName];
  if (!meta) return null;
  return computeMaintenance({ archived: Boolean(meta.archived), pushedAt: meta.pushedAt });
}

// PRD section 35 — "popularity beyond stars": latest weekly downloads sample
// from the snapshot sync (zero live API cost on cards; live lookups stay on the
// detail page via /api/metrics). Null when no samples yet — never fabricated.
export function getLatestDownloads(snapshotData, fullName) {
  const samples = snapshotData.downloadsHistory?.[fullName];
  if (!Array.isArray(samples) || samples.length === 0) return null;
  const last = samples[samples.length - 1];
  const metrics = {};
  for (const key of ["npm", "pypi", "docker"]) {
    if (typeof last[key] === "number") metrics[key] = last[key];
  }
  if (!Object.keys(metrics).length) return null;
  return { ...metrics, sampledAt: last.date };
}

// PRD section 2.3: four star-driven trending views.
export async function computeTrending(view = "today") {
  const snapshotData = await loadSnapshotData();
  const rows = [];
  for (const [repo, stars] of Object.entries(snapshotData.stars)) {
    const s = getStars30d(snapshotData, repo);
    rows.push({
      repo,
      stars: s.stars,
      change: s.change,
      changePct: s.changePct,
      history: s.history,
      freshness: getFreshness(snapshotData, repo),
      maintenance: getMaintenance(snapshotData, repo),
      downloads: getLatestDownloads(snapshotData, repo),
    });
  }
  // Index math must tolerate histories shorter than 30 points (real cron data
  // ramps up over the first month; seed synthesis always emits exactly 30).
  const at = (r, i) => r.history[Math.min(i, r.history.length - 1)].stars;
  const dayChange = (r, idx) => {
    const i = Math.min(idx, r.history.length - 1);
    return at(r, i) - at(r, Math.max(i - 1, 0));
  };
  const weekChange = (r) => {
    const last = r.history.length - 1;
    return at(r, last) - at(r, Math.max(last - 7, 0));
  };

  let result = rows;
  let tfLabel = "today";
  switch (view) {
    case "week":
    case "this-week":
      tfLabel = "this week";
      result = [...rows]
        .map((r) => ({ ...r, timeframeDelta: Math.max(0, weekChange(r)), timeframeLabel: tfLabel }))
        .sort((a, b) => weekChange(b) - weekChange(a));
      break;
    case "month":
    case "this-month":
      tfLabel = "this month";
      result = [...rows]
        .map((r) => ({ ...r, timeframeDelta: Math.max(0, r.change || 0), timeframeLabel: tfLabel }))
        .sort((a, b) => (b.change || 0) - (a.change || 0));
      break;
    case "year":
    case "this-year":
    case "all-time":
      tfLabel = view === "all-time" ? "all time" : "this year";
      result = [...rows]
        .map((r) => ({ ...r, timeframeDelta: r.stars, timeframeLabel: tfLabel }))
        .sort((a, b) => b.stars - a.stars);
      break;
    case "yesterday":
      tfLabel = "yesterday";
      result = [...rows]
        .map((r) => ({ ...r, timeframeDelta: Math.max(0, dayChange(r, 28)), timeframeLabel: tfLabel }))
        .sort((a, b) => dayChange(b, 28) - dayChange(a, 28));
      break;
    case "least":
      // PRD section 2.3: ESTABLISHED repos with the smallest recent growth.
      tfLabel = "this week";
      result = rows
        .filter((r) => r.stars >= 1000)
        .map((r) => ({ ...r, timeframeDelta: Math.max(0, weekChange(r)), timeframeLabel: tfLabel }))
        .sort((a, b) => weekChange(a) - weekChange(b));
      break;
    case "today":
    default:
      tfLabel = "today";
      result = [...rows]
        .map((r) => ({ ...r, timeframeDelta: Math.max(0, dayChange(r, 29)), timeframeLabel: tfLabel }))
        .sort((a, b) => b.changePct - a.changePct);
  }
  return { view, generatedAt: snapshotData.generatedAt, origin: snapshotData.origin, repos: result };
}
