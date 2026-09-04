import successorsData from "../data/successors.json" with { type: "json" };

export function getSuccessor(repo = "") {
  if (!repo) return null;
  const norm = repo.toLowerCase().trim();
  return successorsData[norm] || null;
}

export function hasSuccessor(repo = "") {
  return Boolean(getSuccessor(repo));
}
