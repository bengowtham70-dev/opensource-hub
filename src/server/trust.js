// PRD section 2.2 — Trust & health signals. Phase 2 v2 (plans/PLAN_PHASE2.md P3):
// adds bus factor (contributor count), org/foundation backing, OpenSSF Scorecard
// (via deps.dev, precomputed) and the appeals deep-link required by PRD section 13
// before any public flagging ships.
//
// Score bands (100 max) — v2 weight table:
//   commit recency ......... 25   bus factor ............. 15
//   archived flag .......... 10   backing ................  5
//   license clarity ........ 15   scorecard ..............  5
//   issue hygiene .......... 10
//   community traction ..... 10   project maturity .......  5

const DAY = 86400000;

// Conservative known-steward orgs (foundations + long-standing collectives).
const KNOWN_BACKING = new Set([
  "kde", "gnome", "apache", "eclipse", "mozilla", "blenderfoundation",
  "linuxfoundation", "cff", "osi", "matrix-org", "keepassxreboot",
]);

const APPEALS_REPO = "bengowtham70-dev/opensource-hub";

export function appealUrl(fullName, { score, band, reasons = [] } = {}) {
  const title = encodeURIComponent(`[Trust appeal] ${fullName} — scored ${score ?? "?"} (${band ?? "?"})`);
  const body = encodeURIComponent(
    [
      "## Trust score dispute",
      "",
      `**Repository:** ${fullName}`,
      `**Score:** ${score ?? "unknown"} / 100 (${band ?? "unknown"})`,
      reasons.length ? `**Signals disputed:** ${reasons.join(", ")}` : "**Signals disputed:** (describe below)",
      "",
      "**Why is this flag wrong?**",
      "(Describe the maintenance activity, license status or security practice the score missed.)",
      "",
      "_Filed from the local OpenSource Hub dashboard._",
    ].join("\n")
  );
  return `https://github.com/${APPEALS_REPO}/issues/new?title=${title}&body=${body}`;
}

function daysSince(iso) {
  if (!iso) return Infinity;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY));
}

function scoreCommitRecency(pushedAt) {
  const d = daysSince(pushedAt);
  if (!Number.isFinite(d)) return { points: 0, detail: "unknown" };
  if (d < 7) return { points: 25, detail: "within a week" };
  if (d < 30) return { points: 21, detail: "within a month" };
  if (d < 90) return { points: 15, detail: "1–3 months ago" };
  if (d < 180) return { points: 8, detail: "3–6 months ago" };
  if (d < 365) return { points: 3, detail: "6–12 months ago" };
  return { points: 0, detail: "over a year" };
}

function scoreArchived(archived) {
  return archived
    ? { points: 0, detail: "repository is archived" }
    : { points: 10, detail: "actively maintained repo" };
}

function scoreLicense(license) {
  if (!license?.spdx || license.spdx === "NOASSERTION" || license.spdx === "OTHER") {
    return { points: 0, detail: "no clear license" };
  }
  return { points: 15, detail: `${license.spdx} license` };
}

function scoreIssueHygiene(openIssues, stars) {
  if (openIssues == null) return { points: 5, detail: "unknown" };
  const ratio = stars > 0 ? openIssues / stars : null;
  if (ratio == null) {
    if (openIssues <= 20) return { points: 10, detail: "small, manageable backlog" };
    if (openIssues <= 100) return { points: 5, detail: "moderate backlog" };
    return { points: 2, detail: "large backlog" };
  }
  if (ratio <= 0.02) return { points: 10, detail: "issues well-tended vs popularity" };
  if (ratio <= 0.1) return { points: 7, detail: "healthy issue flow" };
  if (ratio <= 0.3) return { points: 3, detail: "backlog growing faster than fixes" };
  return { points: 1, detail: "issues piling up relative to stars" };
}

function scoreTraction(stars) {
  if (stars >= 5000) return { points: 10, detail: "widely adopted" };
  if (stars >= 1000) return { points: 8, detail: "well-known" };
  if (stars >= 200) return { points: 5, detail: "established niche" };
  if (stars >= 50) return { points: 3, detail: "early but real usage" };
  return { points: 1, detail: "very early stage" };
}

function scoreMaturity(createdAt) {
  const d = daysSince(createdAt);
  if (!Number.isFinite(d)) return { points: 0, detail: "unknown" };
  if (d >= 730) return { points: 5, detail: "2+ years old" };
  if (d >= 365) return { points: 4, detail: "over a year old" };
  if (d >= 180) return { points: 2, detail: "about six months old" };
  return { points: 1, detail: "brand new project" };
}

// PRD section 38 — bus factor: how many people can keep this alive?
function scoreBusFactor(contributors) {
  if (contributors == null) return { points: 5, detail: "unknown", count: null };
  if (contributors >= 10) return { points: 15, detail: `${contributors}+ contributors`, count: contributors };
  if (contributors >= 5) return { points: 12, detail: `${contributors} contributors`, count: contributors };
  if (contributors >= 2) return { points: 8, detail: `${contributors} contributors — thin but real`, count: contributors };
  return { points: 0, detail: "single maintainer — key-person risk", count: contributors };
}

function scoreBacking(owner) {
  const org = String(owner || "").toLowerCase();
  if (KNOWN_BACKING.has(org)) {
    return { points: 5, detail: `stewarded by ${org}` };
  }
  return { points: 0, detail: "community-run project" };
}

// OpenSSF Scorecard via deps.dev (0-10 scale).
function scoreScorecard(scorecard) {
  if (scorecard == null) return { points: 0, detail: "not yet scored by OpenSSF" };
  if (scorecard >= 7) return { points: 5, detail: `Scorecard ${scorecard}/10 — strong practices` };
  if (scorecard >= 5) return { points: 3, detail: `Scorecard ${scorecard}/10 — decent practices` };
  if (scorecard >= 3) return { points: 1, detail: `Scorecard ${scorecard}/10 — weak spots` };
  return { points: 0, detail: `Scorecard ${scorecard}/10 — significant gaps` };
}

// PRD 2.2 maintenance status — Active / Slowing / Abandoned.
export function computeMaintenance({ archived, pushedAt }) {
  if (archived) return { status: "abandoned", reason: "archived by maintainers" };
  const d = daysSince(pushedAt);
  if (!Number.isFinite(d)) return { status: "slowing", reason: "no activity data" };
  if (d < 45) return { status: "active", reason: `last push ${d} day${d === 1 ? "" : "s"} ago` };
  if (d < 210) return { status: "slowing", reason: `last push ${Math.floor(d / 30)} months ago` };
  return { status: "abandoned", reason: `no pushes in ${Math.floor(d / 30)} months` };
}

export function computeTrust(repo) {
  if (!repo) return null;
  const recency = scoreCommitRecency(repo.pushedAt);
  const archived = scoreArchived(repo.archived);
  const license = scoreLicense(repo.license);
  const issues = scoreIssueHygiene(repo.openIssues, repo.stars);
  const traction = scoreTraction(repo.stars ?? 0);
  const maturity = scoreMaturity(repo.createdAt);
  const busFactor = scoreBusFactor(repo.contributors);
  const backing = scoreBacking(repo.backing ?? repo.fullName?.split("/")[0]);
  const scorecard = scoreScorecard(repo.scorecard);

  const score =
    recency.points + archived.points + license.points + issues.points + traction.points +
    maturity.points + busFactor.points + backing.points + scorecard.points;

  const band =
    score >= 80 ? "strong" : score >= 60 ? "good" : score >= 40 ? "caution" : "high-risk";

  // PRD 2.2 red-flag check — plain-language warnings surfaced on the listing.
  const redFlags = [];
  if (repo.archived) redFlags.push("This repository has been archived — it will receive no further updates.");
  if (!repo.license?.spdx || ["NOASSERTION", "OTHER"].includes(repo.license.spdx))
    redFlags.push("No clear open-source license — you may not have the legal right to use or modify it.");
  const dPush = daysSince(repo.pushedAt);
  if (Number.isFinite(dPush) && dPush > 210 && !repo.archived)
    redFlags.push(`No commits in ${Math.floor(dPush / 30)} months — the project may be abandoned.`);
  if (!repo.description) redFlags.push("No project description — documentation may be thin.");
  if (busFactor.count === 1)
    redFlags.push("Only one contributor — the project could stall if that person steps away.");

  const maintenance = computeMaintenance(repo);

  return {
    score,
    band,
    maintenance,
    signals: [
      { key: "recency", label: "Commit recency", ...recency },
      { key: "archived", label: "Active repo", ...archived },
      { key: "license", label: "License clarity", ...license },
      { key: "issues", label: "Issue hygiene", ...issues },
      { key: "traction", label: "Community traction", ...traction },
      { key: "maturity", label: "Project maturity", ...maturity },
      { key: "busFactor", label: "Bus factor", ...busFactor, detail: busFactor.detail },
      { key: "backing", label: "Backing", ...backing },
      { key: "scorecard", label: "OpenSSF Scorecard", ...scorecard },
    ],
    redFlags,
    appeal: appealUrl(repo.fullName, { score, band, reasons: redFlags }),
    // Honest labeling per PRD section 38 heuristic-estimate rule.
    disclaimer: "Heuristic signal from public metadata — not a security audit. Always review before installing.",
  };
}
