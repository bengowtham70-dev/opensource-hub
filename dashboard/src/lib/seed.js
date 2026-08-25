// Client-side mirror of the server seed for instant palette suggestions.
import seed from "../../../src/data/alternatives.json";

export function getPairings() {
  return Promise.resolve(seed.pairings);
}

export function getLanguages() {
  return [...new Set(seed.pairings.map((p) => p.alternative.language))].sort();
}

export function getPairingMap() {
  return new Map(seed.pairings.map((p) => [p.alternative.repo.toLowerCase(), p]));
}

// PRD §38 goal-first browsing — client mirror of GET /api/goals so the
// "I want to replace…" entry grid renders instantly from the bundled seed.
export function getGoals() {
  const counts = new Map();
  for (const p of seed.pairings) {
    for (const tag of p.goalTags || []) counts.set(tag, (counts.get(tag) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({
      tag,
      count,
      label: tag
        .replace(/^replace-/, "")
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
