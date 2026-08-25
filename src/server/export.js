// PRD §17 — "export as JSON" (F1, plans/PLAN_FEATURES.md).
// One file containing everything the user has created locally: favorites,
// community votes/tags, suggestions/flags, and usage stats. No network.
export function buildExport({ favorites, community, usage }) {
  return {
    app: "opensource-hub",
    schema: 1,
    exportedAt: new Date().toISOString(),
    favorites: favorites.list(),
    community: community.exportData(),
    usage: usage.get(),
  };
}
