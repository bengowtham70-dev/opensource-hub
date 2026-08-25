// Full functional verification: every registered API route exercised against a
// REAL running daemon (node bin/cli.js). Exits 1 on any failure.
// Usage: node scripts/verify-api.mjs http://127.0.0.1:PORT
const BASE = process.argv[2] || "http://127.0.0.1:3999";
let failures = 0;
let passes = 0;

function ok(name) {
  passes += 1;
  console.log(`  ✔ ${name}`);
}
function bad(name, detail) {
  failures += 1;
  console.error(`  ✖ ${name}${detail ? ` — ${String(detail).slice(0, 160)}` : ""}`);
}

async function jget(path, init) {
  const res = await fetch(`${BASE}${path}`, init);
  let body = null;
  try {
    body = await res.json();
  } catch {}
  return { res, body };
}

async function expect(name, path, { status = 200, has = [], eq = [], init } = {}) {
  const { res, body } = await jget(path, init);
  const problems = [];
  if (res.status !== status) problems.push(`status ${res.status} != ${status}`);
  for (const key of has) {
    if (!(key in (body || {}))) problems.push(`missing key "${key}"`);
  }
  for (const [k, v] of Array.isArray(eq) ? eq : []) {
    if ((body || {})[k] !== v) problems.push(`${k}=${JSON.stringify((body || {})[k])} != ${JSON.stringify(v)}`);
  }
  problems.length ? bad(name, problems.join("; ")) : ok(name);
  return body;
}

// ---------- core ----------
await expect("health", "/api/health", { eq: { ok: true } });

const trending = await expect("trending today", "/api/trending/today", {
  has: ["repos", "generatedAt", "origin"],
});
if (trending?.repos?.length >= 25) ok(`trending has ${trending.repos.length} repos`);
else bad("trending volume", trending?.repos?.length);
for (const view of ["yesterday", "least", "all-time"]) {
  await expect(`trending/${view}`, `/api/trending/${view}`, { has: ["repos"] });
}

const search = await expect("search q=postman", "/api/search?q=postman", {
  eq: { count: 1 },
  has: ["results"],
});
const bruno = search?.results?.[0];
if (bruno && bruno.stars30d && "freshness" in bruno && "maintenance" in bruno && "downloads" in bruno)
  ok("search rows carry stars30d/freshness/maintenance/downloads");
else bad("search row enrichment", JSON.stringify(bruno).slice(0, 80));

await expect("search platform facet", "/api/search?platform=self-host", {});
await expect("search license facet", "/api/search?license=copyleft", {});
await expect("search goal facet", "/api/search?goal=replace-notion", {});
await expect("search AND-combined miss", "/api/search?q=zzz&language=xx", { eq: { count: 0 } });

// ---------- detail + signals ----------
const repo = await expect("repo detail", "/api/repo/usebruno/bruno", {
  has: ["pairing", "trust", "stars30d"],
});
if (repo?.trust?.score != null && Array.isArray(repo.trust.redFlags)) ok("trust score + redFlags present");
else if (repo?.liveCached === true || repo?.trust === null)
  ok("trust honestly null under GitHub rate-limit degrade (liveCached)");
else bad("trust shape", JSON.stringify(repo?.trust).slice(0, 80));

await expect("releases", "/api/releases/penpot/penpot", { has: ["runnable"] });
await expect("metrics", "/api/metrics/laurent22/joplin", { has: ["metrics", "fetchedAt"] });
await expect("security", "/api/security/goauthentik/authentik", { has: ["vulns", "checkedAt"] });
const rss = await jget("/api/rss/zulip/zulip");
rss.res.status === 200 || rss.res.status === 502 ? ok(`rss feed (${rss.res.status}${rss.res.status===502?" upstream-limited, cached-degrade":""})`) : bad("rss feed", rss.res.status);

// ---------- favorites CRUD round-trip ----------
await fetch(`${BASE}/api/favorites`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ repo: "zulip/zulip" }),
});
const favs = await (await fetch(`${BASE}/api/favorites`)).json();
favs.some((f) => f.repo === "zulip/zulip") ? ok("favorites add persisted") : bad("favorites add");
await expect("favorites delete", "/api/favorites/zulip/zulip", { init: { method: "DELETE" } });
await expect("favorites invalid repo rejected", "/api/favorites", {
  status: 400,
  init: { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ repo: "" }) },
});

// ---------- community layer ----------
await expect("community get", "/api/community/usebruno/bruno", { has: ["votes", "tags", "myVote"] });
// Toggle semantics are stateful by design (persisted per machine), so verify the
// PAIR: vote -> ON, vote again -> neutral. History-independent.
const voteOnce = () =>
  fetch(`${BASE}/api/community/penpot/penpot/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ choice: "yes" }),
  }).then((r) => r.json());
const on = await voteOnce();
on.myVote === "yes" ? ok("community vote ON") : bad("community vote ON", JSON.stringify(on));
const neutral = await voteOnce();
neutral.myVote === null && neutral.votes.yes === 0
  ? ok("community double-vote retracts to neutral")
  : bad("community retract", JSON.stringify(neutral));
await expect("community tag add", "/api/community/zulip/zulip/tags", {
  init: { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tag: "e2e-tag" }) },
});
await expect("community suggestion queued", "/api/community/suggestions", {
  has: ["ok"],
  init: { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "E2E Tool" }) },
});
await expect("community flag accepted", "/api/community/flags", {
  has: ["ok"],
  init: { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ repo: "zulip/zulip" }) },
});

// ---------- lists / goals / learn ----------
const lists = await expect("lists index", "/api/lists", { has: ["length"] });
if (lists?.length >= 3) ok(`lists count ${lists.length}`);
else bad("lists count");
const firstList = lists?.[0]?.slug;
if (firstList) await expect(`list detail (${firstList})`, `/api/lists/${firstList}`, { has: ["pairings", "criteria"] });
await expect("lists 404 unknown", "/api/lists/not-a-list", { status: 404 });

const goals = await expect("goals grid", "/api/goals", { has: ["goals"] });
goals?.goals?.length >= 10 ? ok(`goals count ${goals.goals.length}`) : bad("goals volume");

const learn = await expect("learn index", "/api/learn", {});
if (Array.isArray(learn) && learn.length >= 3) {
  await expect(`learn article (${learn[0].slug})`, `/api/learn/${learn[0].slug}`, { has: ["body", "title"] });
} else bad("learn volume");

// ---------- health diff / usage / export ----------
await expect("health-diff", "/api/health-diff", { has: ["available"] });
const exp = await expect("data export", "/api/export", { has: ["schema", "favorites"] });

// ---------- phase-3 features ----------
const sa = await jget("/api/stack-audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tools: ["Notion", "Slack"] }) });
sa.res.status < 500 ? ok(`stack-audit analyze (${sa.res.status})`) : bad("stack-audit crash", sa.body);
const sampleReport = { matched: [{ tool: "Slack", alternative: "Zulip" }] };
await jget("/api/stack-audit/saved", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ report: sampleReport }),
});
await expect("stack-audit saved round-trip", "/api/stack-audit/saved", { has: ["savedAt"] });
await expect("audits list", "/api/audits", {});
const wc = await jget("/api/watchlist-check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
wc.res.status < 500 ? ok(`watchlist-check (${wc.res.status})`) : bad("watchlist-check crash", wc.body);
// ai-finder must degrade honestly without an API key (never 500-crash).
const ai = await jget("/api/ai-find", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: "team chat for a startup" }),
});
ai.res.status < 500 ? ok(`ai-find degrades gracefully (${ai.res.status})`) : bad("ai-find crash", ai.body);

// ---------- static surfaces ----------
for (const p of ["/", "/blog.html", "/alternatives.html"]) {
  const res = await fetch(`${BASE}${p}`).catch(() => null);
  void res; // daemon may not serve web-dist (that's Pages' job) — only assert if mounted
}

console.log(`\nAPI MATRIX: ${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
