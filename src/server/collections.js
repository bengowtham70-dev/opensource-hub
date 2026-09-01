// Parity P5 (plans/PLAN_PARITY.md) — auto-derived collections from snapshot meta.
// Pure derivation: graveyard (archived/abandoned) and coming-soon (repo age < 18
// months, from meta.createdAt once the snapshot cron captures it). Graveyard wins
// on overlap. No meta → honest-empty. Never fabricated, never live-API-derived.
const DAY = 86400000;
const GRAVEYARD_AFTER_DAYS = 210; // matches computeMaintenance's abandoned threshold
const COMING_SOON_MAX_AGE_DAYS = 548; // ~18 months

export function deriveCollections(pairings, metaByRepo, { now = Date.now() } = {}) {
  const graveyard = [];
  const comingSoon = [];

  for (const p of pairings || []) {
    const repo = p.alternative.repo;
    const meta = metaByRepo?.[repo];
    if (!meta) continue; // never fabricate a classification without data

    const daysSincePush = meta.pushedAt
      ? Math.floor((now - new Date(meta.pushedAt).getTime()) / DAY)
      : Infinity;

    if (meta.archived) {
      graveyard.push({ repo, name: p.alternative.name, reason: "archived by maintainers" });
      continue; // graveyard wins on overlap — never list a dead repo as "coming soon"
    }
    if (Number.isFinite(daysSincePush) && daysSincePush > GRAVEYARD_AFTER_DAYS) {
      graveyard.push({
        repo,
        name: p.alternative.name,
        reason: `no commits in ${Math.floor(daysSincePush / 30)} months`,
      });
      continue;
    }
    if (meta.createdAt) {
      const ageDays = Math.floor((now - new Date(meta.createdAt).getTime()) / DAY);
      if (ageDays >= 0 && ageDays < COMING_SOON_MAX_AGE_DAYS) {
        comingSoon.push({
          repo,
          name: p.alternative.name,
          reason: `first commit ${Math.floor(ageDays / 30)} months ago — early-stage`,
        });
      }
    }
  }

  return { graveyard, comingSoon };
}
