// F10 — parse GitHub's releases atom (already proxied via /api/rss) client-side.
// Browser DOMParser does the XML work — no new dependencies.
export function parseAtomFeed(xmlText, limit = 5) {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("bad feed");
  const entries = [...doc.querySelectorAll("feed > entry")].slice(0, limit);
  return entries.map((e) => ({
    id: e.querySelector("id")?.textContent || "",
    title: e.querySelector("title")?.textContent?.trim() || "Untitled release",
    url: e.querySelector("link")?.getAttribute("href") || "",
    date: e.querySelector("updated")?.textContent || "",
    content: (e.querySelector("content")?.textContent || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 220),
  }));
}
