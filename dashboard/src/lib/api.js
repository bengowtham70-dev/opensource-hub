const jsonFetch = async (url, options) => {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
};

export const api = {
  trending: (view) => jsonFetch(`/api/trending/${view}`),
  search: ({ q, language, platform, license, goal }) =>
    jsonFetch(
      `/api/search?q=${encodeURIComponent(q)}&language=${encodeURIComponent(language)}` +
        `&platform=${encodeURIComponent(platform || "")}&license=${encodeURIComponent(license || "")}` +
        `&goal=${encodeURIComponent(goal || "")}`
    ),
  repo: (owner, name) => jsonFetch(`/api/repo/${owner}/${name}`),
  releases: (owner, name) => jsonFetch(`/api/releases/${owner}/${name}`),
  security: (owner, name) => jsonFetch(`/api/security/${owner}/${name}`),
  metrics: (owner, name) => jsonFetch(`/api/metrics/${owner}/${name}`),
  communityGet: (owner, name) => jsonFetch(`/api/community/${owner}/${name}`),
  communityVote: (repo, choice) =>
    jsonFetch(`/api/community/${repo}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choice }),
    }),
  communityTag: (repo, tag) =>
    jsonFetch(`/api/community/${repo}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag }),
    }),
  communitySuggest: (payload) =>
    jsonFetch("/api/community/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  communityFlag: (payload) =>
    jsonFetch("/api/community/flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  watchlistCheck: (repos) =>
    jsonFetch("/api/watchlist-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repos }),
    }),
  aiFind: (payload) =>
    jsonFetch("/api/ai-find", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  saveAudit: (repo, trust) =>
    jsonFetch(`/api/audits/${repo}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        score: trust.score,
        band: trust.band,
        signals: trust.signals,
      }),
    }),
  audits: () => jsonFetch("/api/audits"),
  removeAudit: (repo) => jsonFetch(`/api/audits/${repo}`, { method: "DELETE" }).catch(() => null),
  stackAudit: (input) =>
    jsonFetch("/api/stack-audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    }),
  stackSaved: () => jsonFetch("/api/stack-audit/saved"),
  saveStack: (report) =>
    jsonFetch("/api/stack-audit/saved", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report }),
    }),
  import: (data) =>
    jsonFetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    }),
  favorites: () => jsonFetch("/api/favorites"),
  addFavorite: (repo) =>
    jsonFetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo }),
    }),
  removeFavorite: (repo) =>
    jsonFetch(`/api/favorites/${repo}`, { method: "DELETE" }).catch(() => null),
  lists: () => jsonFetch("/api/lists"),
  list: (slug) => jsonFetch(`/api/lists/${encodeURIComponent(slug)}`),
  learnList: () => jsonFetch("/api/learn"),
  learnArticle: (slug) => jsonFetch(`/api/learn/${slug}`),
};
