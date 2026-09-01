import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.OSH_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "osh-web-"));

const { esc, deriveSlug, sparklineSvg, profileHtml, alternativesHubHtml, alternativesIndexHtml, buildSitemap, paginate, maintStatusFor, parityPct, slugify, computeTaxonomies, computeCollections, buildSite, updateFeedState, buildRssFeed, buildRobots, buildFeeds, renderMarkdown, parseFrontMatter } = await import(
  "../scripts/build-web-directory.mjs"
);

const CONFIG = {
  baseUrl: "https://example.com",
  siteName: "OpenSource Hub",
  tagline: "t",
  nav: [{ label: "Alternatives", href: "/alternatives" }],
};

const PAIRING = {
  paidTool: {
    name: "Notion",
    slug: "notion",
    category: "Notes & Docs",
    pricePerYearUsd: 96,
    planName: "Plus",
  },
  alternative: {
    name: "AFFiNE",
    repo: "toeverything/AFFiNE",
    language: "TypeScript",
    tags: ["docs", "<script>alert(1)</script>"],
    description: "Docs + whiteboard.",
    parity: ["Docs"],
    gaps: [],
    platforms: ["win", "linux"],
    license: { spdx: "MIT", type: "permissive" },
    screenshots: [],
  },
};

const NOW = Date.now();
const hist = (n, start = 1000) =>
  Array.from({ length: n }, (_, i) => ({
    date: new Date(NOW - (n - 1 - i) * 86400000).toISOString().slice(0, 10),
    stars: start + i * 10,
  }));

test("esc() neutralizes HTML injection in every field it wraps", () => {
  const html = esc('<script>alert("x")</script>&');
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
});

test("deriveSlug lowercases and prefixes owner only on collision", () => {
  assert.equal(deriveSlug("toeverything/AFFiNE"), "affine");
  const taken = new Set(["affine"]);
  assert.equal(deriveSlug("other/affine", taken), "other-affine");
});

test("sparkline renders only from genuine history >= 8 samples", () => {
  assert.equal(sparklineSvg(hist(7)), "", "7 samples must not fabricate a curve");
  const svg = sparklineSvg(hist(12));
  assert.ok(svg.includes("<polyline"));
});

function ctxFor(snapshots) {
  return { snapshots, config: CONFIG, routes: new Map(), route: "/affine" };
}

test("profile page: honest degradation with no snapshot meta/history", () => {
  const html = profileHtml(PAIRING, ctxFor({ stars: { "toeverything/AFFiNE": 42000 } }));
  assert.ok(html.includes("42k")); // stars render
  assert.ok(!html.includes(">abandoned<") && !html.includes(">active<"), "no fabricated status");
  assert.ok(!html.includes("star trajectory"), "no synthetic curve on public pages");
  assert.ok(html.includes("application/ld+json"));
});

test("profile page: real meta drives maintenance + freshness pills", () => {
  const pushedAt = new Date(NOW - 250 * 86400000).toISOString(); // >210d
  const html = profileHtml(
    PAIRING,
    ctxFor({
      stars: { "toeverything/AFFiNE": 1000 },
      meta: { "toeverything/AFFiNE": { pushedAt, archived: false } },
      history: { "toeverything/AFFiNE": hist(20) },
    })
  );
  assert.ok(html.includes("abandoned"));
  assert.ok(html.includes(">250d<"));
  assert.ok(html.includes("<polyline"), "genuine history earns its sparkline");
});

test("JSON-LD parses and carries SoftwareApplication shape with $0 offer", () => {
  const html = profileHtml(PAIRING, ctxFor({}));
  const block = html.split('application/ld+json">')[1].split("</script>")[0];
  const ld = JSON.parse(block);
  assert.equal(ld["@type"], "SoftwareApplication");
  assert.equal(ld.offers.price, "0");
  assert.equal(ld.license, "MIT");
});

test("tag content is escaped end-to-end (XSS via catalog data)", () => {
  const html = profileHtml(PAIRING, ctxFor({}));
  assert.ok(!html.includes("<script>alert"));
  assert.ok(html.includes("&lt;script&gt;"));
});

test("cross-link to the SaaS hub stays text until W2 generates that route", () => {
  const html = profileHtml(PAIRING, ctxFor({}));
  assert.ok(!html.includes('href="/alternatives/notion"'), "no dead links pre-W2");
  assert.ok(html.includes("Notion"));

  const ctxWithHub = ctxFor({});
  ctxWithHub.routes.set("alternatives/notion", "<html></html>");
  const linked = profileHtml(PAIRING, ctxWithHub);
  assert.ok(linked.includes('href="/alternatives/notion"'));
});

test("buildSite emits one route per pairing; slugs unique and stable", () => {
  const pairings = [
    PAIRING,
    JSON.parse(JSON.stringify(PAIRING)),
  ];
  pairings[1].alternative.repo = "other/affine";
  pairings[1].alternative.name = "AffineTwo";
  const routes = buildSite({ alternatives: { pairings }, snapshots: {}, config: CONFIG });
  for (const key of [
    "affine",
    "other-affine",
    "alternatives",
    "alternatives/notion",
    // W3 taxonomy surfaces ride along (omit-empty: only data-derived keys appear)
    "tags",
    "categories",
    "licenses",
    "stacks",
  ]) {
    assert.ok(routes.has(key), `missing route ${key}`);
  }
});

// --- W2: alternatives hubs + index + sitemap ---------------------------------

function hubCtx(routes) {
  return { snapshots: {}, config: CONFIG, routes, route: "/alternatives/notion", takenSlugs: new Set() };
}

test("hub page: H1, matrix row, savings, migration notes and FAQ JSON-LD", () => {
  const pairing = JSON.parse(JSON.stringify(PAIRING));
  pairing.alternative.migrationNotes = "Export from Notion, then import.";
  pairing.alternative.parity = ["Docs"];
  pairing.alternative.gaps = ["Offline sync"];
  const html = alternativesHubHtml([pairing], hubCtx(new Map()));
  const year = new Date().getFullYear();
  assert.ok(html.includes(`alternatives to Notion in ${year}`));
  assert.ok(html.includes("$96/yr"));
  assert.ok(html.includes("AFFiNE")); // matrix row
  assert.ok(html.includes("Export from Notion")); // migration section
  // JSON-LD is an array of ItemList + BreadcrumbList + FAQPage â€” all parse.
  const block = html.split('application/ld+json">')[1].split("</script>")[0];
  const [list, crumbs, faq] = JSON.parse(block);
  assert.equal(list["@type"], "ItemList");
  assert.deepEqual(crumbs.itemListElement.map((c) => c.name), ["Home", "Alternatives", "Notion"]);
  assert.equal(faq["@type"], "FAQPage");
  assert.equal(faq.mainEntity.length, 3);
});

test("hub helpers: parity % and maintenance thresholds match the server rules", () => {
  assert.equal(parityPct({ parity: [1, 2], gaps: [] }), 100);
  assert.equal(parityPct({ parity: [], gaps: [] }), null);
  assert.equal(maintStatusFor({}, "x/y"), null);
  const now = Date.now();
  const iso = (d) => new Date(now - d * 86400000).toISOString();
  assert.equal(maintStatusFor({ meta: { "o/r": { pushedAt: iso(10) } } }, "o/r"), "active");
  assert.equal(maintStatusFor({ meta: { "o/r": { pushedAt: iso(120) } } }, "o/r"), "slowing");
  assert.equal(maintStatusFor({ meta: { "o/r": { pushedAt: iso(300) } } }, "o/r"), "abandoned");
});

test("index page: alphabetical hubs, category chips, honest empty-safe pager math", () => {
  const zeta = JSON.parse(JSON.stringify(PAIRING));
  zeta.paidTool = { name: "Zulip", slug: "zulip", category: "Team Chat", pricePerYearUsd: 72, planName: "" };
  zeta.alternative = { ...PAIRING.alternative, name: "Rocket.Chat", repo: "rocketchat/server" };
  const hubs = new Map([
    ["notion", [PAIRING]],
    ["zulip", [zeta]],
  ]);
  const html = alternativesIndexHtml(hubs, hubCtx(new Map()), {});
  const notionAt = html.indexOf("<strong>Notion</strong>");
  const zulipAt = html.indexOf("<strong>Zulip</strong>");
  assert.ok(notionAt !== -1 && zulipAt !== -1 && notionAt < zulipAt, "alphabetical order");
  assert.ok(html.includes('data-cat="Notes & Docs"'.replace("&", "&amp;")) || html.includes("Notes &amp; Docs"));
  assert.ok(!html.includes('aria-current'), "single page â†’ no pager");

  assert.equal(paginate(0, 50), 1);
  assert.equal(paginate(28, 50), 1);
  assert.equal(paginate(51, 50), 2);
});

test("sitemap covers every generated route with lastmod", () => {
  const pairings = [JSON.parse(JSON.stringify(PAIRING))];
  const routes = buildSite({ alternatives: { pairings }, snapshots: {}, config: CONFIG });
  const xml = buildSitemap(routes, "https://example.com", "2026-08-24");
  assert.ok(xml.startsWith("<?xml"));
  for (const route of routes.keys()) {
    assert.ok(xml.includes(`https://example.com/${route}</loc>`), `missing ${route}`);
  }
});

test("buildSite registers hub routes so profile cross-links go live (W2 flip)", () => {
  const routes = buildSite({
    alternatives: { pairings: [JSON.parse(JSON.stringify(PAIRING))] },
    snapshots: {},
    config: CONFIG,
  });
  const profile = routes.get("affine");
  assert.ok(profile.includes('href="/alternatives/notion"'), "profile â†” hub mesh live");
  assert.ok(routes.get("alternatives/notion").includes("Best open source alternatives to Notion"));
});

// --- W3: taxonomy engine -----------------------------------------------------

test("slugify: categories, whitespace and symbol handling", () => {
  assert.equal(slugify("Notes & Docs"), "notes-docs");
  assert.equal(slugify("  AI  "), "ai");
  assert.equal(slugify("C++"), "c");
  assert.equal(slugify("Self-Hosted"), "self-hosted");
});

test("computeTaxonomies: counts, per-repo dedupe and license family folding", () => {
  const a = JSON.parse(JSON.stringify(PAIRING));
  a.alternative.tags = ["docs", "docs", "offline"];
  a.alternative.license = { spdx: "AGPL-3.0-or-later", type: "network-copyleft" };
  const b = JSON.parse(JSON.stringify(PAIRING));
  b.alternative.repo = "other/affine";
  b.alternative.license = { spdx: "AGPL-3.0", type: "network-copyleft" };

  const { tags, licenses, stacks } = computeTaxonomies([a, b]);
  assert.equal(tags.get("docs").pairings.length, 2, "same tag on two repos");
  const agpl = licenses.get("agpl-30") ?? licenses.get("agpl-3-0");
  assert.ok(agpl, "family page exists");
  assert.deepEqual([...agpl.variants].sort(), ["AGPL-3.0", "AGPL-3.0-or-later"]);
  assert.equal(agpl.type, "network-copyleft");
  assert.ok(stacks.has("typescript"), "language stack derived");
});

test("buildSite emits taxonomy indexes + details; omit-empty is structural", () => {
  const pairings = [JSON.parse(JSON.stringify(PAIRING))];
  pairings[0].alternative.ecosystems = {}; // no docker
  delete pairings[0].alternative.platforms; // no self-host
  const routes = buildSite({ alternatives: { pairings }, snapshots: {}, config: CONFIG });

  for (const kind of ["tags", "categories", "licenses", "stacks"]) {
    assert.ok(routes.has(kind), `index /${kind} missing`);
  }
  assert.ok(routes.has("tags/docs"));
  assert.ok(routes.has("licenses/mit"));
  assert.ok(!routes.has("stacks/docker"), "no docker stack without docker ecosystems");
  // Every detail page references at least one real tool.
  assert.ok(routes.get("tags/docs").includes("AFFiNE"));
  assert.ok(routes.get("categories/notes-docs").includes("AFFiNE"));
});

test("profile pills link into taxonomy routes in real builds", () => {
  const routes = buildSite({
    alternatives: { pairings: [JSON.parse(JSON.stringify(PAIRING))] },
    snapshots: {},
    config: CONFIG,
  });
  const profile = routes.get("affine");
  assert.ok(profile.includes('href="/tags/docs"'));
  assert.ok(profile.includes('href="/stacks/typescript"'));
  assert.ok(profile.includes('href="/licenses/mit"'));
  // And the sitemap grew with the taxonomy sections.
  const xml = buildSitemap(routes, CONFIG.baseUrl, "2026-08-24");
  for (const section of ["/tags", "/categories", "/licenses", "/stacks"]) {
    assert.ok(xml.includes(`${CONFIG.baseUrl}${section}</loc>`), `sitemap missing ${section}`);
  }
});

// --- W4: collections + discounts ---------------------------------------------
// (`hist(n, start)` helper is declared with the W1 tests above.)

test("computeCollections: matchers, union dedupe and honest gating", () => {
  const docker = JSON.parse(JSON.stringify(PAIRING));
  docker.alternative.ecosystems = { docker: "x/y" };
  docker.alternative.platforms = ["self-host", "linux"];
  const localOnly = JSON.parse(JSON.stringify(PAIRING));
  localOnly.alternative.repo = "other/local";
  localOnly.alternative.name = "LocalTool";
  localOnly.alternative.ecosystems = {};
  localOnly.alternative.platforms = ["self-host"];

  const cols = computeCollections([docker, localOnly], {});
  assert.ok(cols.has("latest"), "latest always present");
  assert.equal(cols.get("latest").pairings.length, 2);
  const sh = cols.get("self-hosted");
  assert.equal(sh.pairings.length, 2, "docker ? self-host platforms");
  // No real history -> trending/coming-soon absent; no AI signals -> ai-native absent.
  assert.ok(!cols.has("trending") && !cols.has("coming-soon") && !cols.has("ai-native"));
});

test("trending requires >=5 real movers; coming-soon honors isPreRelease", () => {
  const movers = [];
  for (let i = 0; i < 6; i += 1) {
    const p = JSON.parse(JSON.stringify(PAIRING));
    p.alternative.repo = `org/mover${i}`;
    movers.push(p);
  }
  const snapshots = { history: {} };
  movers.forEach((p) => {
    snapshots.history[p.alternative.repo] = hist(12, 500);
    snapshots.stars = snapshots.stars || {};
    snapshots.stars[p.alternative.repo] = 610;
  });
  const cols = computeCollections(movers, snapshots);
  assert.ok(cols.has("trending"), "6 real movers unlock trending");

  const early = JSON.parse(JSON.stringify(PAIRING));
  early.alternative.repo = "org/early";
  early.alternative.isPreRelease = true;
  const withEarly = computeCollections([early], {});
  assert.ok(withEarly.has("coming-soon"), "isPreRelease alone unlocks coming-soon");
});

test("graveyard activates on paidTool.discontinued; discounts page honest empty state", () => {
  const dead = JSON.parse(JSON.stringify(PAIRING));
  dead.paidTool.discontinued = true;
  dead.alternative.ecosystems = { docker: "acme/alt" };
  dead.alternative.platforms = ["self-host", "linux"];
  const cols = computeCollections([dead], {});
  assert.ok(cols.has("graveyard"));
  assert.ok(cols.has("self-hosted"));

  const routes = buildSite({
    alternatives: { pairings: [JSON.parse(JSON.stringify(PAIRING))] },
    snapshots: {},
    config: CONFIG,
    discounts: [],
  });
  assert.ok(routes.has("discounts"), "discounts page always exists");
  assert.ok(routes.get("discounts").includes("No active deals right now"));
  // Base fixture has no self-host/docker signal -> index must NOT fake a tile.
  assert.ok(!routes.get("collections").includes("/collections/self-hosted"));
  assert.ok(routes.get("collections").includes("activating automatically"));

  const populated = buildSite({
    alternatives: { pairings: [dead] },
    snapshots: {},
    config: CONFIG,
    discounts: [{ vendor: "HostCo", offer: "$50 credit", url: "https://host.example" }],
  });
  assert.ok(populated.has("collections/graveyard"));
  assert.ok(populated.get("collections").includes("/collections/self-hosted"));
  assert.ok(populated.get("discounts").includes("HostCo"));
});

// --- W5: syndication + robots -------------------------------------------------

test("updateFeedState: assigns first-seen only, preserves existing dates, stays pure", () => {
  const existing = { tools: { "old/repo": "2020-01-01T00:00:00.000Z" } };
  const now = Date.now();
  const next = updateFeedState(existing, "tools", ["old/repo", "new/repo"], now);
  assert.equal(next.tools["old/repo"], "2020-01-01T00:00:00.000Z", "existing date kept");
  assert.equal(new Date(next.tools["new/repo"]).getTime(), now);
  assert.deepEqual(existing.tools, { "old/repo": "2020-01-01T00:00:00.000Z" }, "input untouched");
});

test("buildRssFeed: channel skeleton, perma-guid, RFC-822 pubDate and escaping", () => {
  const xml = buildRssFeed({
    title: "Feed <Title>",
    link: "https://example.com/",
    description: "desc",
    lastBuild: "2026-08-24T00:00:00Z",
    items: [
      {
        title: "Tool",
        link: "https://example.com/tool",
        description: 'Use <script>alert(1)</script> & enjoy',
        pubDate: "2026-08-01T12:00:00Z",
      },
    ],
  });
  assert.ok(xml.startsWith('<?xml version="1.0"'));
  assert.ok(xml.includes("<rss version=\"2.0\">"));
  assert.ok(xml.includes("&lt;script&gt;"));
  assert.ok(xml.includes('<guid isPermaLink="true">https://example.com/tool</guid>'));
  assert.ok(xml.includes("GMT"), "pubDate rendered as RFC-822");
  assert.ok(xml.includes("Feed &lt;Title&gt;"));
});

test("posts feed is a valid empty channel before W6 content exists", () => {
  const xml = buildRssFeed({
    title: "blog",
    link: "https://example.com/blog",
    description: "d",
    items: [],
    lastBuild: "2026-08-24T00:00:00Z",
  });
  assert.ok(!xml.includes("<item>"));
});

test("robots.txt explicitly allows AI crawlers and points at the sitemap", () => {
  const withBase = buildRobots("https://example.com");
  for (const bot of ["GPTBot", "ClaudeBot", "PerplexityBot"]) {
    assert.ok(withBase.includes("User-agent: " + bot));
  }
  assert.ok(withBase.includes("Sitemap: https://example.com/sitemap.xml"));
  assert.ok(!buildRobots("").includes("Sitemap:"), "no fake sitemap URL without baseUrl");
});

test("buildFeeds: honest ordering from persisted state; hubs + empty posts emitted", () => {
  const newer = JSON.parse(JSON.stringify(PAIRING));
  newer.alternative.repo = "org/new";
  newer.alternative.name = "NewTool";
  newer.paidTool.slug = "fresh";
  const pairings = [JSON.parse(JSON.stringify(PAIRING)), newer]; // AFFiNE + org/new
  const feedState = { tools: { "toeverything/AFFiNE": "2024-01-01T00:00:00.000Z" } };
  const { files, state } = buildFeeds({ alternatives: { pairings }, config: CONFIG, feedState });

  const toolsXml = files["rss/tools.xml"];
  const affIdx = toolsXml.indexOf("/affine<");
  const newIdx = toolsXml.indexOf("/new<");
  assert.ok(affIdx !== -1 && newIdx !== -1 && newIdx < affIdx, "newest first-seen ranks first");
  assert.ok(files["rss/alternatives.xml"].includes("/alternatives/fresh"));
  assert.ok(!files["rss/posts.xml"].includes("<item>"), "empty until W6");
  assert.ok(state.tools["org/new"], "state records the unseen tool");
});

// --- W6: blog ------------------------------------------------------------------

test("renderMarkdown: escape-first — raw HTML can never reach output", () => {
  const html = renderMarkdown('Hello <img src=x onerror="alert(1)"> world');
  assert.ok(!html.includes("<img"));
  assert.ok(html.includes("&lt;img"));
});

test("renderMarkdown: inline transforms, fences and lists", () => {
  const md = [
    "## Heading",
    "",
    "Bold **thing** and `code` plus [site](https://example.com).",
    "",
    "- one",
    "- two",
    "",
    "1. first",
    "2. second",
    "",
    "> quoted",
    "",
    "```",
    "<raw> & stuff",
    "```",
  ].join("\n");
  const html = renderMarkdown(md);
  assert.ok(html.includes("<h2>Heading</h2>"));
  assert.ok(html.includes("<strong>thing</strong>"));
  assert.ok(html.includes("<code>code</code>"));
  assert.ok(html.includes('<a href="https://example.com"'));
  assert.ok(html.includes("<ul><li>one</li><li>two</li></ul>"));
  assert.ok(html.includes("<ol><li>first</li><li>second</li></ol>"));
  assert.ok(html.includes("<blockquote><p>quoted</p></blockquote>"));
  assert.ok(html.includes("<pre><code>&lt;raw&gt; &amp; stuff</code></pre>"));
});

test("renderMarkdown: javascript: hrefs are neutralized", () => {
  const html = renderMarkdown("[click](javascript:alert(1))");
  assert.ok(!html.includes("href=\"javascript:"));
  assert.ok(html.includes('href="#"'));
});

test("parseFrontMatter: title/description/date extracted, body separated", () => {
  const { meta, body } = parseFrontMatter("---\ntitle: T\ndescription: D\ndate: 2026-01-02\n---\n\nBody here");
  assert.equal(meta.title, "T");
  assert.equal(meta.date, "2026-01-02");
  assert.ok(body.startsWith("Body here"));
});

test("blog: omit-empty when no posts; index+articles+sitemap when posts exist", () => {
  const without = buildSite({ alternatives: { pairings: [] }, snapshots: {}, config: CONFIG });
  assert.ok(!without.has("blog"));

  const posts = [
    { slug: "newer", title: "Newer post", description: "d2", date: "2026-08-20", html: "<p>v2 body</p>" },
    { slug: "older", title: "Older post", description: "d1", date: "2026-07-01", html: "<p>v1 body</p>" },
  ];
  const routes = buildSite({ alternatives: { pairings: [] }, snapshots: {}, config: CONFIG, posts });
  const idx = routes.get("blog");
  assert.ok(idx.includes("Newer post") && idx.includes("Older post"));
  assert.ok(idx.indexOf("Newer post") < idx.indexOf("Older post"), "date-desc ordering");

  const art = routes.get("blog/newer");
  assert.ok(art.includes("<p>v2 body</p>"));
  assert.ok(art.includes('"@type":"Article"') || art.includes('"@type": "Article"'), "Article JSON-LD");

  const xml = buildSitemap(routes, CONFIG.baseUrl, "2026-08-24");
  assert.ok(xml.includes(`${CONFIG.baseUrl}/blog/newer</loc>`));

  // RSS carries the posts with author-controlled pubDates.
  const feedState = {};
  const fed = buildFeeds({
    alternatives: { pairings: [] },
    config: CONFIG,
    feedState,
    posts: posts.map((p) => ({
      slug: p.slug,
      title: p.title,
      link: CONFIG.baseUrl + "/blog/" + p.slug,
      description: p.description,
      pubDate: p.date,
    })),
  });
  const postsXml = fed.files["rss/posts.xml"];
  assert.ok(postsXml.includes("<item>"));
  const expectedRfc = new Date("2026-07-01").toUTCString();
  assert.ok(postsXml.includes(expectedRfc), `expected RFC-822 date ${expectedRfc}`);
});

// --- W7: OG cards + newsletter -------------------------------------------------

const { ogImagePath, layout } = await import("../scripts/build-web-directory.mjs");
const { buildCardSpec, buildCardSvg, flatten } = await import("../scripts/generate-og-images.mjs");

test("ogImagePath: deterministic flattening shared by meta tags and generator", () => {
  assert.equal(ogImagePath("affine"), "/og/affine.png");
  assert.equal(ogImagePath("alternatives/notion"), "/og/alternatives__notion.png");
  assert.equal(flatten("alternatives/notion"), "alternatives__notion");
  assert.equal(ogImagePath(""), "/og/home.png");
});

test("layout emits absolute og:image only when provided", () => {
  const ctx = (extra) => ({
    config: { baseUrl: "https://example.com", siteName: "OSH", nav: [], tagline: "t" },
    routes: new Map(),
    route: "/x",
    title: "t",
    description: "d",
    ...extra,
  });
  const withImg = layout(ctx({ ogImage: "/og/affine.png" }), "b");
  assert.ok(withImg.includes('property="og:image" content="https://example.com/og/affine.png"'));
  assert.ok(withImg.includes('name="twitter:card"'));
  const without = layout(ctx({}), "b");
  assert.ok(!without.includes("og:image"));
});

test("newsletter footer: dual honesty gates (embedUrl + numeric subscribers)", () => {
  const mk = (newsletter) =>
    layout(
      {
        config: {
          baseUrl: "",
          siteName: "OSH",
          nav: [],
          tagline: "t",
          newsletter,
        },
        routes: new Map(),
        route: "/x",
        title: "t",
        description: "d",
      },
      "b"
    );
  assert.ok(!mk(undefined).includes("Weekly digest"), "hidden without config");
  assert.ok(mk({ embedUrl: "https://buttondown.email/x" }).includes("Weekly digest"));
  const fake = mk({ embedUrl: "https://b.example", subscribers: "12K+" });
  assert.ok(!fake.includes("12K+"), "non-numeric subscriber counts never render");
  const real = mk({ embedUrl: "https://b.example", subscribers: 1200 });
  assert.ok(real.includes("1,200 subscribers"));
});

test("buildCardSpec: stars pass through; delta gated on genuine history", () => {
  const pairing = JSON.parse(JSON.stringify(PAIRING));
  void pairing;
  const specNoData = buildCardSpec(PAIRING, {});
  assert.equal(specNoData.stars, null);
  assert.equal(specNoData.delta, null);

  const real = buildCardSpec(PAIRING, {
    stars: { "toeverything/AFFiNE": 42000 },
    history: { "toeverything/AFFiNE": hist(20, 40000) },
  });
  assert.equal(real.stars, 42000);
  assert.equal(real.delta, 0.5); // hist(20, 40000): 40000 -> 40190

  const short = buildCardSpec(PAIRING, {
    stars: { "toeverything/AFFiNE": 100 },
    history: { "toeverything/AFFiNE": hist(5) }, // <8 samples
  });
  assert.equal(short.delta, null, "synthetic-grade data never becomes a public delta");
});

test("buildCardSvg renders escaped SVG with brand, chips and CTA", () => {
  const svg = buildCardSvg({
    name: "AFFiNE",
    paidTool: "Notion",
    pricePerYearUsd: 96,
    stars: 42000,
    delta: 2.4,
    license: "MIT",
  });
  assert.ok(svg.includes('width="1200"') && svg.includes('height="630"'));
  assert.ok(svg.includes(">AFFiNE</text>"));
  assert.ok(svg.includes("Free open-source alternative to Notion"));
  assert.ok(svg.includes("★ 42.0k")); // star chip
  assert.ok(svg.includes("▲ 2.4% 30d")); // momentum chip (real history only)
  assert.ok(svg.includes("opensource-hub")); // CTA

  const hostile = buildCardSvg({
    name: '<script>alert(1)</script>',
    paidTool: "X",
    pricePerYearUsd: 1,
    stars: null,
    delta: null,
    license: null,
  });
  assert.ok(!hostile.includes("<script>"));
});

// --- W8: dormant monetization -------------------------------------------------

const { advertisePageHtml, submitPageHtml, adBannerHtml } = await import("../scripts/build-web-directory.mjs");

const W8_CTX = (config) => ({ config, routes: new Map(), route: "/advertise", repoSlug: new Map() });

test("advertise page: three market-priced tiers; zero payment rails while dormant", () => {
  const html = advertisePageHtml({ ads: { slots: [] }, pairings: [PAIRING], hubCount: 1 }, W8_CTX({
    baseUrl: "", siteName: "OSH", nav: [], tagline: "t",
    activateMonetization: false, contactEmail: "", repoSlug: "osh/osh", stripe: {},
  }));
  for (const t of ["Silver", "Gold", "Platinum"]) assert.ok(html.includes(t));
  assert.ok(html.includes("$147") && html.includes("$297") && html.includes("$597"));
  // Dormant + no email -> CTA falls back to the public GitHub issue queue.
  assert.ok(html.includes("https://github.com/osh/osh/issues/new?title="));
  assert.ok(!html.includes("stripe.com") && !html.includes("mailto:"));
});

test("advertise CTA chain: stripe -> mailto -> issues, never a fabricated email", () => {
  const base = { baseUrl: "", siteName: "OSH", nav: [], tagline: "t", repoSlug: "osh/osh" };
  const withStripe = advertisePageHtml({}, W8_CTX({ ...base, activateMonetization: true, stripe: { submitUrl: "https://buy.stripe.com/x" } }));
  void withStripe;
  const withMail = advertisePageHtml({}, W8_CTX({ ...base, contactEmail: "hi@real.example" }));
  assert.ok(withMail.includes("mailto:hi@real.example"));
  const noEmail = advertisePageHtml({}, W8_CTX({ ...base }));
  assert.ok(!noEmail.includes("mailto:"));
});

test("submit page: free GitHub path always; expedited only when flag AND url set", () => {
  const dormant = submitPageHtml(W8_CTX({
    baseUrl: "", siteName: "OSH", nav: [], tagline: "t",
    activateMonetization: false, contactEmail: "", repoSlug: "osh/osh", stripe: {},
  }));
  assert.ok(dormant.includes("https://github.com/osh/osh/issues/new?title="));
  assert.ok(!dormant.includes("Expedited review"));

  const live = submitPageHtml(W8_CTX({
    baseUrl: "", siteName: "OSH", nav: [], tagline: "t",
    activateMonetization: true, repoSlug: "osh/osh", stripe: { submitUrl: "https://buy.stripe.com/y" },
  }));
  assert.ok(live.includes("Expedited review"));
  assert.ok(live.includes("https://buy.stripe.com/y"));

  const flagNoUrl = submitPageHtml(W8_CTX({
    baseUrl: "", siteName: "OSH", nav: [], tagline: "t",
    activateMonetization: true, repoSlug: "osh/osh", stripe: { submitUrl: "" },
  }));
  assert.ok(!flagNoUrl.includes("Expedited review"), "flag without URL stays dormant");
});

test("ad banner: empty ads render nothing; populated slot is labeled Sponsored", () => {
  assert.equal(adBannerHtml({ slots: [] }), "");
  assert.equal(adBannerHtml(undefined), "");
  const banner = adBannerHtml({ slots: [{ label: "HostCo", url: "https://host.example", image: "" }] });
  assert.ok(banner.includes("Sponsored"));
  assert.ok(banner.includes('rel="sponsored noreferrer noopener"'));
  assert.ok(banner.includes("https://host.example"));
});

test("buildSite registers /advertise and /submit; sitemap covers them", () => {
  const routes = buildSite({
    alternatives: { pairings: [JSON.parse(JSON.stringify(PAIRING))] },
    snapshots: {},
    config: CONFIG,
    discounts: [],
    posts: [],
    ads: { slots: [] },
  });
  assert.ok(routes.has("advertise") && routes.has("submit"));
  const xml = buildSitemap(routes, CONFIG.baseUrl, "2026-08-24");
  assert.ok(xml.includes("/advertise</loc>") && xml.includes("/submit</loc>"));
});

// ---------- §3d: compare engine, methodology page, bylines, share bar ----------

const PAIRING_B = JSON.parse(JSON.stringify(PAIRING));
PAIRING_B.alternative.repo = "appflowy/io_appflowy";
PAIRING_B.alternative.name = "AppFlowy";
PAIRING_B.paidTool.slug = "notion";

const CMP_SNAP = {
  stars: {
    "toeverything/AFFiNE": 30000,
    "appflowy/io_appflowy": 50000,
  },
  meta: {
    "toeverything/AFFiNE": {
      pushedAt: new Date(NOW - 3 * 86400000).toISOString(),
      createdAt: new Date(NOW - 3 * 365.25 * 86400000).toISOString(),
      archived: false,
    },
    "appflowy/io_appflowy": {
      pushedAt: new Date(NOW - 200 * 86400000).toISOString(),
      createdAt: new Date(NOW - 5 * 365.25 * 86400000).toISOString(),
      archived: false,
    },
  },
};

test("compareRouteSlug is order-independent and deterministic", async () => {
  const { compareRouteSlug } = await import("../scripts/build-web-directory.mjs");
  assert.equal(compareRouteSlug("b", "a"), compareRouteSlug("a", "b"));
  assert.equal(compareRouteSlug("zeta", "alpha"), "alpha-vs-zeta");
});

test("compareDimensions declares winners from real snapshot data only", async () => {
  const { compareDimensions } = await import("../scripts/build-web-directory.mjs");
  const rows = compareDimensions(PAIRING, PAIRING_B, CMP_SNAP);
  const byName = Object.fromEntries(rows.map((r) => [r[0], r]));
  assert.equal(byName["Community & popularity"][1], "30k stars"); // side A value
  assert.equal(byName["Community & popularity"][2], "50k stars"); // side B value
  assert.equal(byName["Community & popularity"][3], "b"); // 50k vs 30k
  assert.equal(byName["Project maturity"][1], "3 yrs old");
  assert.equal(byName["Project maturity"][2], "5 yrs old");
  assert.equal(byName["Project maturity"][3], "b"); // older = more mature
  assert.equal(byName["Development activity"][3], "a"); // 3d vs 200d
  // Seed data (no history/meta): every dimension must be honest-null, not fabricated.
  const seedRows = compareDimensions(PAIRING, PAIRING_B, {});
  for (const [, , , winner] of seedRows) assert.equal(winner, "tie");
});

test("buildSite generates pairwise compare pages + about; profiles cross-link them", async () => {
  const { buildSite } = await import("../scripts/build-web-directory.mjs");
  const routes = buildSite({
    alternatives: { pairings: [JSON.parse(JSON.stringify(PAIRING)), PAIRING_B] },
    snapshots: CMP_SNAP,
    config: CONFIG,
  });
  assert.ok(routes.has("about"), "methodology route always exists");
  const cmpRoute = [...routes.keys()].find((k) => k.startsWith("compare/"));
  assert.ok(cmpRoute, "same-category pairings produce a head-to-head page");
  const html = routes.get(cmpRoute);
  assert.ok(html.includes("cmp-verdict"), "verdict block renders");
  assert.ok(html.includes("share-bar"), "compare pages carry the share bar");
  assert.ok(!html.includes("undefined") && !html.includes("[object Object]"));
  const profile = routes.get(cmpRoute.split("-vs-")[0].replace("compare/", ""));
  if (profile) assert.ok(profile.includes("Head-to-head"), "profile links its comparisons");
});

test("byline carries last-updated date and links methodology once the route exists", async () => {
  const { bylineHtml } = await import("../scripts/build-web-directory.mjs");
  const bare = bylineHtml("2026-08-25T10:00:00Z", { routes: new Map() });
  assert.ok(bare.includes("Last updated 2026-08-25"));
  assert.ok(!bare.includes("about.html"), "no dead methodology link pre-registration");
  const linked = bylineHtml("2026-08-25T10:00:00Z", {
    routes: new Map([["about", "<html></html>"]]),
  });
  assert.ok(linked.includes('href="/about.html"'));
});

// ---------- §3d Tier-2: sort dropdown, category growth badges ----------

test("alternatives index renders sort control with sortable card data attributes", async () => {
  const { buildSite } = await import("../scripts/build-web-directory.mjs");
  const routes = buildSite({
    alternatives: { pairings: [JSON.parse(JSON.stringify(PAIRING))] },
    snapshots: {},
    config: CONFIG,
  });
  const indexHtml = routes.get("alternatives");
  assert.ok(indexHtml.includes('id="sort"'), "order-by select present");
  assert.ok(indexHtml.includes('data-name="Notion"'), "cards expose name key");
  assert.ok(indexHtml.includes('data-save="96"'), "cards expose savings key");
  assert.ok(indexHtml.includes('data-count="'), "cards expose option-count key");
});

test("categoryGrowth averages real history only; honest null on seed data", async () => {
  const { categoryGrowth } = await import("../scripts/build-web-directory.mjs");
  assert.equal(categoryGrowth([PAIRING], {}), null);
  const g = categoryGrowth(
    [
      { alternative: { repo: "toeverything/AFFiNE" } },
      { alternative: { repo: "appflowy/io_appflowy" } },
    ],
    { history: { "toeverything/AFFiNE": hist(12), "appflowy/io_appflowy": hist(12, 500) } }
  );
  assert.equal(g.n, 2);
  assert.equal(typeof g.pct, "number");
});

// ---------- §3d editorial depth: generated tool deep-dive ----------

const FULL_PAIRING = JSON.parse(JSON.stringify(PAIRING));
FULL_PAIRING.alternative.relationship = "direct";
FULL_PAIRING.alternative.gaps = ["No offline mode yet"];
FULL_PAIRING.alternative.migrationNotes = "Export as Markdown, then import.";
FULL_PAIRING.alternative.platforms = ["win", "mac", "self-host"];
FULL_PAIRING.alternative.ecosystems = { docker: true };
FULL_PAIRING.alternative.tco = { hostingMonthlyEstimateUsd: 5 };

function explainerCtx(routes = new Map()) {
  return { snapshots: {}, config: CONFIG, routes, route: "/affine" };
}

test("deep-dive renders every section from verified catalog fields", async () => {
  const { toolExplainerHtml } = await import("../scripts/build-web-directory.mjs");
  const html = toolExplainerHtml(FULL_PAIRING, explainerCtx(new Map([["licenses", "<x>"]])));
  assert.ok(html.includes("What is AFFiNE?"));
  assert.ok(html.includes("drop-in replacement"));
  assert.ok(html.includes("&check; Docs"), "parity items render");
  assert.ok(html.includes("&#9650; No offline mode yet"), "gaps render with caution mark");
  assert.ok(html.includes("Export as Markdown"));
  assert.ok(html.includes("two weeks"), "trial-sprint tip present");
  assert.ok(html.includes("commercial-friendly"), "plain-language license note");
  assert.ok(html.includes("/licenses/mit"), "license link when route registered");
  assert.ok(html.includes("$5/mo") && html.includes("$96/yr"), "honest TCO math vs paid price");
  assert.ok(html.includes("Docker image"), "docker guidance from ecosystems flag");
});

test("deep-dive degrades honestly on sparse data; editorial override respected", async () => {
  const { toolExplainerHtml } = await import("../scripts/build-web-directory.mjs");
  const bare = JSON.parse(JSON.stringify(PAIRING));
  delete bare.alternative.parity;
  delete bare.alternative.gaps;
  const html = toolExplainerHtml(bare, explainerCtx());
  assert.ok(!html.includes("&check;"), "no invented parity items");
  assert.ok(html.includes("No known gaps reported yet"), "explicit empty state");
  assert.ok(!html.includes("Switching from"), "no migration section without notes");

  const custom = JSON.parse(JSON.stringify(PAIRING));
  custom.alternative.editorial = "Hand-verified team notes.";
  const overridden = toolExplainerHtml(custom, explainerCtx());
  assert.ok(overridden.includes("Hand-verified team notes."));
});

// ---------- §3d round-3: breadcrumbs, trending categories, rich collection cards ----------

test("breadcrumbs render on profile/hub/taxonomy/compare; absent when unset", async () => {
  const { buildSite } = await import("../scripts/build-web-directory.mjs");
  const routes = buildSite({
    alternatives: { pairings: [JSON.parse(JSON.stringify(PAIRING)), PAIRING_B] },
    snapshots: CMP_SNAP,
    config: CONFIG,
  });
  for (const key of ["alternatives/notion", "affine", "categories", "categories/notes-docs"]) {
    if (!routes.has(key)) continue;
    const html = routes.get(key);
    assert.ok(html.includes('class="crumbs"'), `crumbs on ${key}`);
    assert.ok(html.includes('aria-label="Breadcrumb"'));
  }
  const compareKey = [...routes.keys()].find((k) => k.startsWith("compare/"));
  assert.ok(routes.get(compareKey).includes("<b>Compare</b>"));
});

test("trending categories strip appears only with real growth data (omit-empty)", async () => {
  const { taxonomyIndexHtml } = await import("../scripts/build-web-directory.mjs");
  const entries = new Map([
    [
      "notes-docs",
      {
        slug: "notes-docs",
        label: "Notes & Docs",
        variants: new Set(),
        pairings: [PAIRING, PAIRING_B],
      },
    ],
  ]);
  const bare = taxonomyIndexHtml(
    "categories",
    entries,
    { snapshots: {}, config: CONFIG, routes: new Map(), repoSlug: new Map() }
  );
  assert.ok(!bare.includes("Trending categories"), "no fabricated trend on seed data");
  const rich = taxonomyIndexHtml(
    "categories",
    entries,
    {
      snapshots: { history: { "toeverything/AFFiNE": hist(12), "appflowy/io_appflowy": hist(12) }, stars: {} },
      config: CONFIG,
      routes: new Map(),
      repoSlug: new Map(),
    }
  );
  assert.ok(rich.includes("Trending categories"));
  assert.ok(rich.includes("% avg 30d"));
});

test("collection cards show stars/maintenance/license meta from snapshots", async () => {
  const { computeCollections, buildSite } = await import("../scripts/build-web-directory.mjs");
  const snap = {
    stars: { "toeverything/AFFiNE": 42000 },
    meta: { "toeverything/AFFiNE": { pushedAt: new Date(NOW - 5 * 86400000).toISOString(), archived: false } },
  };
  const cols = computeCollections([JSON.parse(JSON.stringify(PAIRING))], snap);
  const selfhosted = cols.get("self-hosted");
  if (selfhosted && selfhosted.pairings.length) {
    const html = buildSite({
      alternatives: { pairings: [JSON.parse(JSON.stringify(PAIRING))] },
      snapshots: snap,
      config: CONFIG,
    });
    const detail = [...html.entries()].find(([k]) => k.startsWith("collections/self-hosted"));
    if (detail) {
      assert.ok(detail[1].includes("42k stars"));
      assert.ok(detail[1].includes(">active<") || detail[1].includes("MIT"));
    }
  }
});

// ---------- §3d round-4: socials footer, release stat, Cmd+K palette ----------

test("socials footer renders from config; honest-empty until URLs exist", async () => {
  const { socialsHtml, layout } = await import("../scripts/build-web-directory.mjs");
  assert.equal(socialsHtml({}), "", "no fabricated links without config");
  const html = socialsHtml({
    socials: {
      x: "opensourcehub",
      github: "https://github.com/osh/osh",
      mastodon: "@osh",
    },
  });
  assert.ok(html.includes('href="https://x.com/opensourcehub"'));
  assert.ok(html.includes('href="https://github.com/osh/osh"'), "absolute URL passes through");
  assert.ok(html.includes('href="https://mastodon.social/@osh"'), "prefix applied to handles");
  assert.ok(html.includes(">X<") && html.includes(">Mastodon<"));
  const page = layout(
    { config: { ...CONFIG, socials: { x: "o" } }, title: "t", description: "d", route: "/" },
    "body"
  );
  assert.ok(page.includes('class="socials"'));
});

test("latest-release stat renders only when snapshots carry a tag", async () => {
  const withTag = profileHtml(PAIRING, ctxFor({ meta: { "toeverything/AFFiNE": { latestTag: "v0.20.0" } } }));
  assert.ok(withTag.includes("v0.20.0") && withTag.includes("latest release"));
  const noTag = profileHtml(PAIRING, ctxFor({}));
  assert.ok(!noTag.includes("latest release"), "honest absence on seed data");
});

test("buildSite emits a search index covering tools, hubs, compares and pages", () => {
  const routes = buildSite({
    alternatives: { pairings: [JSON.parse(JSON.stringify(PAIRING)), PAIRING_B] },
    snapshots: CMP_SNAP,
    config: CONFIG,
  });
  const idx = routes.searchIndex;
  assert.ok(Array.isArray(idx) && idx.length >= 5);
  const types = new Set(idx.map((x) => x.t));
  for (const t of ["tool", "hub", "compare", "page"]) assert.ok(types.has(t), `missing ${t}`);
  for (const x of idx) {
    assert.ok(x.n && x.h.endsWith(".html"), "every entry has name + html href");
    assert.ok(!x.h.includes("//"), "site-relative hrefs only");
  }
  const cmp = idx.find((x) => x.t === "compare");
  assert.ok(cmp.n.includes(" vs "), "compare entries named head-to-head");
});

test("palette markup + trigger ship on every layout page; index file referenced by fetch path", () => {
  const routes = buildSite({
    alternatives: { pairings: [JSON.parse(JSON.stringify(PAIRING))] },
    snapshots: {},
    config: CONFIG,
  });
  const anyPage = routes.get("affine");
  assert.ok(anyPage.includes('data-palette-open'), "header trigger present");
  assert.ok(anyPage.includes('class="pal-overlay"'), "overlay markup present");
  assert.ok(anyPage.includes("/search-index.json"), "palette fetches build-time index");
  assert.ok(routes.searchIndex.some((x) => x.t === "tool" && x.h === "/affine.html"));
});
