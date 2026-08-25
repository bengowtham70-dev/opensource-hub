// PRD §38 monthly public health-snapshot diff (PRD Phase-2 item 6,
// plans/PLAN_PHASE2.md P5). Pure computation over the daily snapshot JSON so it
// is unit-testable; the CLI wrapper below commits the result as public static
// JSON that the daemon serves verbatim (zero-backend rule holds: this runs on
// GitHub Actions' free tier, same as build-snapshots.mjs).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// Baseline = newest sample at least `windowDays` old; falls back to the oldest
// sample when the history is shorter than the window. Fewer than 2 samples of
// any signal → null delta (honest "not enough data yet", never a fake 0).
function delta(samples, windowDays, now) {
  if (!Array.isArray(samples) || samples.length < 2) return null;
  const cutoff = now - windowDays * 86400000;
  let base = samples[0];
  for (const s of samples) {
    if (new Date(s.date).getTime() <= cutoff) base = s;
    else break;
  }
  const latest = samples[samples.length - 1];
  const keys = Object.keys(latest).filter((k) => k !== "date");
  const out = {};
  let any = false;
  for (const k of keys) {
    if (typeof latest[k] !== "number") continue;
    const b = base[k];
    if (typeof b !== "number" || base === latest) continue;
    out[k] = latest[k] - b;
    any = true;
  }
  return any ? out : null;
}

export function computeHealthDiff(snapshotData, { now = Date.now(), windowDays = 30 } = {}) {
  const repos = {};
  for (const repo of Object.keys(snapshotData.stars || {})) {
    const entry = {};
    const starSamples = snapshotData.history?.[repo];
    const starDelta = delta(starSamples, windowDays, now);
    if (starDelta) entry.starsDelta = starDelta.stars ?? null;

    const dlSamples = snapshotData.downloadsHistory?.[repo];
    const dlDelta = delta(dlSamples, windowDays, now);
    if (dlDelta) entry.downloadsDelta = dlDelta;

    // Freshness flags mirror the UI pill thresholds (<90d fresh, >180d stale).
    const pushedAt = snapshotData.meta?.[repo]?.pushedAt || null;
    if (pushedAt) {
      const days = Math.floor((now - new Date(pushedAt).getTime()) / 86400000);
      entry.freshness = days < 90 ? "fresh" : days > 180 ? "stale" : "aging";
      entry.daysSincePush = days;
      entry.archived = Boolean(snapshotData.meta?.[repo]?.archived);
    } else {
      entry.freshness = "unknown";
    }
    repos[repo] = entry;
  }
  return {
    version: 1,
    generatedAt: new Date(now).toISOString(),
    windowDays,
    repos,
  };
}

async function main() {
  const SNAPSHOTS = process.env.OSH_SNAPSHOTS_FILE || path.join(root, "src", "data", "snapshots-seed.json");
  const OUT = path.join(root, "src", "data", "health-diff.json");
  const snapshotData = JSON.parse(fs.readFileSync(SNAPSHOTS, "utf8"));
  const diff = computeHealthDiff(snapshotData);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(diff, null, 2)}\n`);
  console.log(`health diff written: ${Object.keys(diff.repos).length} repos, window=${diff.windowDays}d`);
}

// Run the CLI only when executed directly — importing for tests must stay side-effect free.
const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}