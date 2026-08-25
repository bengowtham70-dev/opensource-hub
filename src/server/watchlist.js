// PRD §3/§22 — watchlist alerts (F6, plans/PLAN_FEATURES.md).
// Pure alert math, unit-tested; the route feeds it live trust scores.

// entries: [{ repo, lastScore }] · trustByRepo: Map repo → current score (or null)
export function computeAlerts(entries = [], trustByRepo = new Map(), { dropThreshold = 10 } = {}) {
  const alerts = [];
  for (const { repo, lastScore } of entries) {
    const current = trustByRepo.get(repo);
    if (current == null || lastScore == null) continue;
    const drop = lastScore - current;
    if (drop >= dropThreshold) {
      alerts.push({
        repo,
        type: "trust-drop",
        from: lastScore,
        to: current,
        message: `Trust score dropped ${drop} points (${lastScore} → ${current}). Worth a re-check before you switch.`,
      });
    }
  }
  return alerts;
}

export const WATCHLIST_CAP = 10;
