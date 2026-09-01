import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.OSH_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "osh-test-"));

const { createApp } = await import("../src/server/app.js");
const { createFavoritesStore } = await import("../src/server/store.js");
const { createGithubClient, pickOsAsset } = await import("../src/server/github.js");

async function startServer() {
  const { app } = createApp();
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      resolve({ server, base: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

test("GET /api/health responds ok", async () => {
  const { server, base } = await startServer();
  const res = await fetch(`${base}/api/health`);
  const json = await res.json();
  assert.equal(res.status, 200);
  assert.equal(json.ok, true);
  server.close();
});

test("GET /api/trending/today returns repos sorted by momentum", async () => {
  const { server, base } = await startServer();
  const json = await (await fetch(`${base}/api/trending/today`)).json();
  assert.equal(json.view, "today");
  assert.ok(json.repos.length >= 25);
  for (let i = 1; i < json.repos.length; i += 1) {
    assert.ok(json.repos[i - 1].changePct >= json.repos[i].changePct, "not sorted by changePct");
    assert.ok(Array.isArray(json.repos[i].history) && json.repos[i].history.length === 30);
  }
  server.close();
});

test("GET /api/trending/least shows only established repos, smallest 7-day growth first (PRD section 2.3)", async () => {
  const { server, base } = await startServer();
  const json = await (await fetch(`${base}/api/trending/least`)).json();
  assert.equal(json.view, "least");
  for (const r of json.repos) {
    assert.ok(r.stars >= 1000, `non-established repo leaked: ${r.repo} (${r.stars})`);
  }
  const week = (r) => r.history[29].stars - r.history[22].stars;
  for (let i = 1; i < json.repos.length; i += 1) {
    assert.ok(week(json.repos[i - 1]) <= week(json.repos[i]), "not sorted by 7-day growth ascending");
  }
  server.close();
});

test("GET /api/search honors query + language filter", async () => {
  const { server, base } = await startServer();
  const hit = await (await fetch(`${base}/api/search?q=postman`)).json();
  assert.ok(hit.count >= 1);
  assert.ok(hit.results.some((r) => r.alternative.name === "Bruno"));
  const lang = await (await fetch(`${base}/api/search?language=Rust`)).json();
  assert.ok(lang.count >= 1); // Revolt is in the seed
  const cobol = await (await fetch(`${base}/api/search?language=Cobol`)).json();
  assert.equal(cobol.count, 0); // No Cobol repos in seed
  const go = await (await fetch(`${base}/api/search?language=Go`)).json();
  assert.ok(go.count >= 2);
  server.close();
});

// PRD Phase 2 item 1 — platform + license-type filters (plans/PLAN_PHASE2.md Phase 2).
test("GET /api/search filters by platform facet", async () => {
  const { server, base } = await startServer();
  const json = await (await fetch(`${base}/api/search?platform=self-host`)).json();
  assert.ok(json.count >= 5, "expected a healthy self-hostable subset");
  for (const r of json.results) {
    assert.ok(
      r.alternative.platforms.includes("self-host"),
      `${r.alternative.repo} does not support self-host`
    );
  }
  const desktop = await (await fetch(`${base}/api/search?platform=linux`)).json();
  assert.ok(desktop.count >= 3);
  assert.ok(desktop.results.every((r) => r.alternative.platforms.includes("linux")));
  server.close();
});

test("GET /api/search filters by license-type facet", async () => {
  const { server, base } = await startServer();
  const permissive = await (await fetch(`${base}/api/search?license=permissive`)).json();
  assert.ok(permissive.count >= 3, "expected several permissive-license alternatives");
  for (const r of permissive.results) {
    assert.equal(r.alternative.license.type, "permissive", `${r.alternative.repo} license type mismatch`);
  }
  const network = await (await fetch(`${base}/api/search?license=network-copyleft`)).json();
  assert.ok(network.count >= 3);
  for (const r of network.results) {
    assert.equal(r.alternative.license.type, "network-copyleft");
  }
  server.close();
});

test("GET /api/search AND-combines q + platform + license facets", async () => {
  const { server, base } = await startServer();
  const all = await (await fetch(`${base}/api/search?q=password&platform=linux&license=permissive`)).json();
  // Bitwarden is GPL (copyleft) so must drop out under license=permissive.
  assert.ok(!all.results.some((r) => r.alternative.name === "Bitwarden"), "AND semantics broken: copyleft leaked through");
  const broad = await (await fetch(`${base}/api/search?q=password`)).json();
  assert.ok(broad.count > all.count, "facet combination must narrow the result set");
  server.close();
});

test("GET /api/search returns zero results for unknown facet values", async () => {
  const { server, base } = await startServer();
  const bad = await (await fetch(`${base}/api/search?platform=gameboy`)).json();
  assert.equal(bad.count, 0);
  const badLicense = await (await fetch(`${base}/api/search?license=shareware`)).json();
  assert.equal(badLicense.count, 0);
  server.close();
});

test("GET /api/repo/:owner/:name merges pairing + snapshot sparkline", async () => {
  const { server, base } = await startServer();
  const json = await (await fetch(`${base}/api/repo/usebruno/bruno`)).json();
  assert.equal(json.pairing.alternative.name, "Bruno");
  assert.equal(json.stars30d.history.length, 30);
  assert.equal(json.stars30d.history.at(-1).stars, json.stars30d.stars);
  const missing = await fetch(`${base}/api/repo/foo/bar`);
  assert.equal(missing.status, 404);
  server.close();
});

test("favorites CRUD round-trips and persists to disk", async () => {
  const store = createFavoritesStore();
  store.add("usebruno/bruno");
  store.add("penpot/penpot");
  store.add("usebruno/bruno"); // dedupe
  let list = store.list();
  assert.equal(list.length, 2);
  // penpot was added last (bruno re-add is deduped) — most recent first.
  assert.equal(list[0].repo, "penpot/penpot");
  assert.equal(list[1].repo, "usebruno/bruno");
  assert.ok(fs.existsSync(path.join(process.env.OSH_DATA_DIR, "favorites.json")));
  store.remove("usebruno/bruno");
  list = store.list();
  assert.equal(list.length, 1);
  assert.equal(list[0].repo, "penpot/penpot");
});

test("learn endpoints list and serve articles", async () => {
  const { server, base } = await startServer();
  const articles = await (await fetch(`${base}/api/learn`)).json();
  assert.ok(articles.length === 4);
  assert.equal(articles[0].slug, "what-is-open-source");
  const article = await (await fetch(`${base}/api/learn/${articles[0].slug}`)).json();
  assert.match(article.body, /^# /m);
  const nf = await fetch(`${base}/api/learn/nope`);
  assert.equal(nf.status, 404);
  server.close();
});

test("blog endpoints list and serve editorial posts", async () => {
  const { server, base } = await startServer();
  const posts = await (await fetch(`${base}/api/blog`)).json();
  assert.ok(posts.length >= 3);
  assert.ok(posts[0].slug);
  assert.ok(posts[0].title);
  const post = await (await fetch(`${base}/api/blog/${posts[0].slug}`)).json();
  assert.ok(post.title);
  assert.ok(post.body);
  const nf = await fetch(`${base}/api/blog/nope`);
  assert.equal(nf.status, 404);
  server.close();
});

test("source zip redirects honor explicit branch and sanitize bad input", async () => {
  const { server, base } = await startServer();
  const r1 = await fetch(`${base}/api/source/wekan/wekan?branch=master`, { redirect: "manual" });
  assert.equal(r1.status, 302);
  assert.ok(
    r1.headers.get("location").endsWith("/archive/refs/heads/master.zip"),
    `unexpected location ${r1.headers.get("location")}`
  );
  const r2 = await fetch(`${base}/api/source/foo/bar?branch=../evil`, { redirect: "manual" });
  assert.equal(r2.status, 302);
  const loc = r2.headers.get("location") || "";
  assert.ok(loc.startsWith("https://github.com/foo/bar"), `unexpected location ${loc}`);
  assert.ok(!loc.includes("evil"), "path traversal leaked into redirect");
  server.close();
});

// --- github client logic (injected fetch, zero network) ---

beforeEach(() => {
  // cache is module-level; tests below construct fresh clients per scenario
});

test("ETag 304 path serves cached body without consuming quota semantics", async () => {
  const etag = 'W/"abc123"';
  const repoBody = { full_name: "a/b", stargazers_count: 10 };
  let calls = 0;
  const fakeFetch = async (_url, init = {}) => {
    calls += 1;
    if (calls === 1) {
      return new Response(JSON.stringify(repoBody), {
        status: 200,
        headers: { etag, "content-type": "application/json" },
      });
    }
    assert.equal(init.headers["If-None-Match"], etag, "must send If-None-Match on re-poll");
    return new Response(null, { status: 304 });
  };
  const gh = createGithubClient({ fetchImpl: fakeFetch });
  const first = await gh.getRepo("a/b");
  assert.equal(first.data.stars, 10);
  assert.equal(first.cached, false);
  const second = await gh.getRepo("a/b");
  assert.equal(second.data.stars, 10);
  assert.equal(second.cached, true);
  assert.equal(calls, 2);
});

test("HTTP 403 rate limit degrades to cached data with cached flag", async () => {
  const etag = 'W/"xyz"';
  let calls = 0;
  const fakeFetch = async () => {
    calls += 1;
    if (calls === 1) {
      return new Response(JSON.stringify({ full_name: "c/d", stargazers_count: 5 }), {
        status: 200,
        headers: { etag },
      });
    }
    return new Response(null, { status: 403 });
  };
  const gh = createGithubClient({ fetchImpl: fakeFetch });
  await gh.getRepo("c/d");
  const degraded = await gh.getRepo("c/d");
  assert.equal(degraded.cached, true);
  assert.equal(degraded.data.stars, 5);
});

test("pickOsAsset matches platform-specific installers (PRD section 2.6a)", () => {
  const assets = [
    { name: "app-1.0-linux.tar.gz" },
    { name: "app-1.0.msi" },
    { name: "App-1.0.DMG" },
    { name: "app.AppImage" },
  ];
  assert.equal(pickOsAsset(assets, "win32").name, "app-1.0.msi");
  assert.equal(pickOsAsset(assets, "darwin").name, "App-1.0.DMG");
  assert.equal(pickOsAsset(assets, "linux").name, "app.AppImage");
  assert.equal(pickOsAsset([{ name: "source.zip" }], "win32"), null);
});

// PRD section 2.2 surfacing mandate - comparison payloads carry maintenance
// status for the card pill (null on bundled seed: never fabricated).
test("GET /api/search includes maintenance status from snapshot meta", async () => {
  const { server, base } = await startServer();
  const json = await (await fetch(`${base}/api/search?q=postman`)).json();
  assert.ok("maintenance" in json.results[0]);
  const trending = await (await fetch(`${base}/api/trending/today`)).json();
  assert.ok("maintenance" in trending.repos[0]);
  server.close();
});
