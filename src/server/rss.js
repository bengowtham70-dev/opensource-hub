import { getPairings } from "./data.js";
import { getAggregatedReleases } from "./releases.js";

function escXml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function generateRssFeed({ baseUrl = "http://localhost:3000", type = "all" } = {}) {
  const pairings = getPairings();
  let releases = [];
  try {
    const relRes = await getAggregatedReleases();
    releases = Array.isArray(relRes) ? relRes : (relRes?.releases || []);
  } catch {}
  const now = new Date().toUTCString();

  const items = [];

  if (type === "all" || type === "releases") {
    for (const rel of releases) {
      items.push({
        title: `${rel.name || rel.repo} ${rel.tag || rel.version || ""}`.trim(),
        link: `${baseUrl}/repo/${rel.repo}`,
        guid: `${rel.repo}-${rel.version || rel.publishedAt}`,
        pubDate: rel.publishedAt ? new Date(rel.publishedAt).toUTCString() : now,
        category: "Software Release",
        description: `New release for ${rel.repo}: ${rel.version || "Update"} published on GitHub. ${rel.body ? rel.body.slice(0, 300) : ""}`,
      });
    }
  }

  if (type === "all" || type === "tools") {
    for (const p of pairings.slice(0, 30)) {
      const alt = p.alternative;
      const paid = p.paidTool;
      items.push({
        title: `${alt.name} — Open-Source Alternative to ${paid.name}`,
        link: `${baseUrl}/repo/${alt.repo}`,
        guid: `tool-${alt.repo}`,
        pubDate: alt.pushedAt ? new Date(alt.pushedAt).toUTCString() : now,
        category: paid.category || "Open Source",
        description: `${alt.name} replaces ${paid.name} (saves ~$${paid.pricePerYearUsd || 120}/yr). ${alt.description || ""}`,
      });
    }
  }

  // Sort items by pubDate descending
  items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  const itemsXml = items
    .map(
      (item) => `    <item>
      <title>${escXml(item.title)}</title>
      <link>${escXml(item.link)}</link>
      <guid isPermaLink="false">${escXml(item.guid)}</guid>
      <pubDate>${escXml(item.pubDate)}</pubDate>
      <category>${escXml(item.category)}</category>
      <description><![CDATA[${item.description}]]></description>
    </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>OpenSource Hub — Open Source Software &amp; Releases</title>
    <link>${escXml(baseUrl)}</link>
    <description>Verified open-source alternatives to commercial SaaS, self-hosting blueprints, and release trackers.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${escXml(baseUrl)}/feed.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;
}
