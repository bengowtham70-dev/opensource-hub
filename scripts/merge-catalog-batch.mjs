// plans/catalog-batch-2.json merge gate (PRD §19 honesty rule: AI drafts, humans
// verify, and NOTHING unverified reaches alternatives.json).
//
// Stage 2 enforcement: every entry is fetched from the live GitHub API and its
// claimed license/description are checked before merging. Rate-limited runs
// persist progress to scripts/.merge-state.json and resume later — the script
// exits 0 with a clear "resume" message when GitHub quota blocks it.
//
// Usage:
//   node scripts/merge-catalog-batch.mjs --dry-run   # verify only, no write
//   node scripts/merge-catalog-batch.mjs             # verify + append
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const DRAFT = path.join(root, "plans", "catalog-batch-2.json");
const CATALOG = path.join(root, "src", "data", "alternatives.json");
const STATE = path.join(__dirname, ".merge-state.json");

const ALLOWED_PLATFORMS = new Set(["win", "mac", "linux", "web", "self-host"]);
const RELATIONSHIPS = new Set(["direct", "partial", "fork"]);
const LICENSE_TYPES = new Set(["permissive", "copyleft", "network-copyleft"]);
const ECOSYSTEM_KEYS = new Set(["npm", "pypi", "docker"]);
const SPDX_RE = /^[A-Za-z0-9.+-]+( OR [A-Za-z0-9.+-]+)*$/;
const GOAL_RE = /^replace-[a-z0-9]+(-[a-z0-9]+)*$/;

export function schemaValidate(entry) {
  const errors = [];
  const pt = entry.paidTool;
  const a = entry.alternative;
  if (!pt?.name || !pt?.slug || !pt?.category) errors.push("paidTool name/slug/category required");
  if (!Number.isFinite(pt?.pricePerYearUsd) || pt.pricePerYearUsd < 0) errors.push("pricePerYearUsd must be >= 0");
  if (!a?.name || !a?.repo || !/^[^/]+\/[^/]+$/.test(a.repo || "")) errors.push("alternative repo must be owner/name");
  if (!Array.isArray(a.tags) || a.tags.length === 0) errors.push("tags >= 1");
  if (!a.description || typeof a.description !== "string") errors.push("description required");
  if (!Array.isArray(a.parity) || a.parity.length === 0) errors.push("parity >= 1");
  if (!Array.isArray(a.gaps)) errors.push("gaps must be an array");
  if (!RELATIONSHIPS.has(entry.relationship)) errors.push(`relationship ${entry.relationship}`);
  if (!Array.isArray(entry.goalTags) || entry.goalTags.length < 1 || !entry.goalTags.every((t) => GOAL_RE.test(t)))
    errors.push("goalTags invalid");
  if (!Array.isArray(a.platforms) || !a.platforms.length || !a.platforms.every((p) => ALLOWED_PLATFORMS.has(p)))
    errors.push("platforms invalid");
  if (!a.license || !SPDX_RE.test(a.license.spdx || "")) errors.push("license spdx invalid");
  if (!LICENSE_TYPES.has(a.license?.type)) errors.push(`license.type ${a.license?.type}`);
  if (a.demoUrl !== undefined && !/^https:\/\/[\w.-]+/.test(a.demoUrl)) errors.push("demoUrl must be https");
  if (!Array.isArray(a.screenshots ?? [])) errors.push("screenshots must be array");
  for (const [k, v] of Object.entries(a.ecosystems || {})) {
    if (!ECOSYSTEM_KEYS.has(k)) errors.push(`ecosystem key ${k}`);
    if (typeof v !== "string" || !v.trim()) errors.push(`ecosystem ${k} empty`);
  }
  if (a.tco != null) {
    if (!Number.isFinite(a.tco.hostingMonthlyEstimateUsd) || a.tco.hostingMonthlyEstimateUsd <= 0)
      errors.push("tco estimate must be positive");
    if (!a.platforms.includes("self-host")) errors.push("tco requires self-host platform");
  }
  return errors;
}

function family(spdx) {
  return String(spdx).replace(/-or-later$/i, "");
}

async function fetchRepo(repo, fetchImpl) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const headers = {
      "User-Agent": "opensource-hub-catalog-merge",
      Accept: "application/vnd.github+json",
    };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetchImpl(`https://api.github.com/repos/${repo}`, { headers });
    if (res.status === 200) return { ok: true, data: await res.json() };
    if (res.status === 403 || res.status === 429) {
      const reset = Number(res.headers.get("x-ratelimit-reset") || 0) * 1000;
      const waitMs = reset > Date.now() ? Math.min(reset - Date.now(), 60_000) : 30_000;
      await new Promise((r) => setTimeout(r, attempt === 2 ? 0 : waitMs));
      continue;
    }
    if (res.status === 404) return { ok: false, reason: "repo not found on GitHub" };
    return { ok: false, reason: `GitHub ${res.status}` };
  }
  return { ok: false, rateLimited: true, reason: "GitHub API rate limit exhausted" };
}

// Verifies draft claims against live GitHub data. Returns {ok, entry?, reasons[]}.
export async function verifyEntry(draft, fetchImpl, nowIso) {
  const reasons = [];
  const { res } = { res: null }; // shape hint
  void res;
  const check = await fetchRepo(draft.alternative.repo, fetchImpl);
  if (!check.ok) {
    return {
      ok: false,
      rateLimited: Boolean(check.rateLimited),
      verified: null,
      reasons: [check.reason],
      entry: null,
    };
  }
  const gh = check.data;
  const claims = draft.claims || {};

  // License claim: GitHub auto-detection is unreliable (NOASSERTION, sub-file
  // picks, -or-later families). Disputes are settled from the repo's OWN
  // LICENSE file; anything still ambiguous becomes needsLicenseReview - held
  // out of the merge until a human re-runs with --include-needs-review.
  const ghSpdx = gh.license?.spdx_id;
  const claimedFamily = family(claims.licenseSpdx || "");
  const baseOf = (x) => String(x || "").replace(/^(AGPL|LGPL|GPL).*$/, "$1");
  const familiesCompatible = (a, b) => a && b && (a === b || baseOf(a).startsWith(baseOf(b)) || baseOf(b).startsWith(baseOf(a)));
  let licenseReview = null;
  let licenseResolvedFrom = null;
  const detectDisputed =
    !ghSpdx || ghSpdx === "NOASSERTION" || ghSpdx === "OTHER" || family(ghSpdx) !== claimedFamily;
  if (detectDisputed) {
    const head = await fetchLicenseHead(draft.alternative.repo, fetchImpl);
    if (!head) {
      licenseReview = `GitHub says "${ghSpdx || "unknown"}", draft claims ${claims.licenseSpdx}, no readable LICENSE file`;
    } else if (familiesCompatible(head.family, claimedFamily)) {
      licenseResolvedFrom = head.url;
    } else {
      licenseReview = `LICENSE file suggests ${head.family}, draft claims ${claims.licenseSpdx} (${head.url})`;
    }
  }
  // Repo health floor: exists, pushed within 18 months, non-trivial stars.
  const pushedAgeDays = Math.floor((Date.now() - new Date(gh.pushed_at).getTime()) / 86400000);
  if (pushedAgeDays > 545) reasons.push(`last push ${pushedAgeDays}d ago (>18 months — stale-listing bar)`);
  if (typeof gh.stargazers_count === "number" && gh.stargazers_count < 300)
    reasons.push(`only ${gh.stargazers_count} stars (<300 floor for new listings)`);

  // Description similarity: at least one meaningful word overlap with our copy.
  const words = (s) =>
    new Set(String(s || "").toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3));
  const overlap = [...words(gh.description)].filter((w) => words(draft.alternative.description).has(w)).length;
  if (overlap === 0) reasons.push("description shares no keywords with GitHub's own description");

  if (reasons.length) return { ok: false, verified: null, reasons, entry: null };
  if (licenseReview)
    return {
      ok: false,
      needsLicenseReview: true,
      reviewNote: licenseReview,
      reasons: [],
      entry: null,
    };

  const entry = JSON.parse(JSON.stringify(draft));
  delete entry.claims;
  entry.verification = {
    apiCheckedAt: nowIso,
    ...(licenseResolvedFrom ? { licenseResolvedFrom } : {}),
    githubStars: gh.stargazers_count,
    githubLicense: ghSpdx,
    lastPushAt: gh.pushed_at,
    source: `https://github.com/${draft.alternative.repo}`,
  };
  return { ok: true, verified: true, entry, reasons: [] };
}

// GitHub's auto license detection frequently reports NOASSERTION or picks a
// sub-file. Resolve the dispute deterministically from the repo's own LICENSE
// file at HEAD (no API quota cost - raw.githubusercontent is CDN-served).
const LICENSE_FILES = ["LICENSE", "LICENSE.md", "LICENSE.txt", "COPYING", "COPYING.txt"];
const FAMILY_RE = /\b(AGPL|LGPL|GPL|Apache|MIT|BSD|MPL)\b[^\n]*/i;

async function fetchLicenseHead(repo, fetchImpl) {
  for (const name of LICENSE_FILES) {
    const url = `https://raw.githubusercontent.com/${repo}/HEAD/${name}`;
    try {
      const res = await fetchImpl(url);
      if (!res.ok) continue;
      const head = (await res.text()).slice(0, 600);
      const m = FAMILY_RE.exec(head);
      if (m) {
        return {
          family: m[1].toUpperCase().replace(/^GNU\s+/i, ""),
          url,
          excerpt: head.replace(/\s+/g, " ").slice(0, 160),
        };
      }
    } catch {}
  }
  return null;
}
export function mergeEntries(catalogPairings, verifiedEntries) {
  const slugs = new Set(catalogPairings.map((p) => p.paidTool.slug));
  const repos = new Set(catalogPairings.map((p) => p.alternative.repo.toLowerCase()));
  const appended = [];
  for (const e of verifiedEntries) {
    if (slugs.has(e.paidTool.slug)) throw new Error(`duplicate paid tool slug ${e.paidTool.slug}`);
    if (repos.has(e.alternative.repo.toLowerCase())) throw new Error(`duplicate repo ${e.alternative.repo}`);
    slugs.add(e.paidTool.slug);
    repos.add(e.alternative.repo.toLowerCase());
    catalogPairings.push(e);
    appended.push(e.paidTool.slug);
  }
  return appended;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const draft = JSON.parse(fs.readFileSync(DRAFT, "utf8"));
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  let state = {};
  try {
    state = JSON.parse(fs.readFileSync(STATE, "utf8"));
  } catch {}

  const existingRepos = new Set(catalog.pairings.map((p) => p.alternative.repo.toLowerCase()));
  let verifiedCount = 0;
  let rejected = 0;
  let skippedDone = 0;
  const verifiedEntries = [];
  const rejectLog = [];
  const reviewLog = [];
  const includeNeedsReview = process.argv.includes("--include-needs-review");

  for (const draftEntry of draft.entries) {
    const repoKey = draftEntry.alternative.repo.toLowerCase();
    if (existingRepos.has(repoKey)) {
      skippedDone += 1;
      continue;
    }
    const result = await verifyEntry(draftEntry, fetch, new Date().toISOString());
    if (result.rateLimited) {
      console.error(
        `\nGitHub API rate limit hit after ${verifiedCount}/${draft.entries.length} verifications.\n` +
          `Progress saved — re-run this command when your quota resets (top of hour).\n`
      );
      break;
    }
    if (result.ok) {
      verifiedEntries.push(result.entry);
      verifiedCount += 1;
      console.log(`  [ok] verified ${draftEntry.alternative.repo} (stars ${result.entry.verification.githubStars})`);
    } else if (result.needsLicenseReview) {
      reviewLog.push({ repo: draftEntry.alternative.repo, note: result.reviewNote });
      console.warn(`  [review] ${draftEntry.alternative.repo}: ${result.reviewNote}`);
    } else {
      rejected += 1;
      rejectLog.push({ repo: draftEntry.alternative.repo, reasons: result.reasons });
      console.error(`  [rejected] ${draftEntry.alternative.repo}: ${result.reasons.join("; ")}`);
    }
  }

  fs.writeFileSync(
    STATE,
    JSON.stringify({ updatedAt: new Date().toISOString(), rejected: rejectLog }, null, 2)
  );

  if (dryRun) {
    console.log(`\nDRY RUN: ${verifiedCount} verifiable now, ${rejected} rejected, ${skippedDone} already merged.`);
    process.exit(rejected > 0 ? 2 : 0);
  }
  if (rejected > 0) {
    console.error("\nRefusing to merge while any entry fails verification (fix or remove them).");
    process.exit(2);
  }
  if (reviewLog.length && !includeNeedsReview) {
    console.error(
      `\n${reviewLog.length} entr(ies) need a human license check (notes above).\n` +
        `Re-run with --include-needs-review to stamp licenseNeedsHumanReview and merge them.\n`
    );
    process.exit(3);
  }
  if (includeNeedsReview && reviewLog.length) {
    for (const item of reviewLog) {
      const src = draft.entries.find((e) => e.alternative.repo.toLowerCase() === item.repo.toLowerCase());
      if (!src) continue;
      const stamped = JSON.parse(JSON.stringify(src));
      delete stamped.claims;
      stamped.verification = {
        apiCheckedAt: new Date().toISOString(),
        licenseNeedsHumanReview: true,
        reviewNote: item.note,
      };
      verifiedEntries.push(stamped);
    }
  }
  if (!verifiedEntries.length) {
    console.log("Nothing new to merge.");
    process.exit(0);
  }

  const appended = mergeEntries(catalog.pairings, verifiedEntries);
  catalog.pairings.forEach(() => {});
  fs.writeFileSync(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`\nMERGED ${appended.length} pairings → catalog now has ${catalog.pairings.length}.`);
  console.log("Next: npm test, then rebuild the web directory.");
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) main().catch((err) => {
  console.error(err);
  process.exit(1);
});
