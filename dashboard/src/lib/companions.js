import companionsData from "../../../src/data/companions.json" with { type: "json" };

export function getCompanions(repo = "") {
  if (!repo) return [];
  const norm = repo.toLowerCase().trim();
  return companionsData[norm] || [];
}

export function hasCompanions(repo = "") {
  return getCompanions(repo).length > 0;
}
