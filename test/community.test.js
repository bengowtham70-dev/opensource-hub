import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.OSH_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "osh-community-"));

const { createCommunityStore } = await import("../src/server/community.js");

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "osh-community-unit-"));
}

// --- Store level: votes -----------------------------------------------------

test("vote rejects anything that is not exactly yes/no", () => {
  const c = createCommunityStore({ dir: tempDir() });
  assert.throws(() => c.vote("a/b", "maybe"), /invalid choice/);
  assert.throws(() => c.vote("a/b", ""), /invalid choice/);
  assert.throws(() => c.vote("a/b", undefined), /invalid choice/);
});

test("vote toggles off when clicking your own choice again", () => {
  const c = createCommunityStore({ dir: tempDir() });
  c.vote("excalidraw/excalidraw", "yes");
  const off = c.vote("excalidraw/excalidraw", "yes");
  assert.deepEqual(off.votes, { yes: 0, no: 0 });
  assert.equal(off.myVote, null);
});

test("switching sides moves the count instead of duplicating it", () => {
  const c = createCommunityStore({ dir: tempDir() });
  c.vote("wekan/wekan", "yes");
  const switched = c.vote("wekan/wekan", "no");
  assert.deepEqual(switched.votes, { yes: 0, no: 1 });
  assert.equal(switched.myVote, "no");
});

test("getRepo returns an honest empty shape for unseen repos", () => {
  const c = createCommunityStore({ dir: tempDir() });
  assert.deepEqual(c.getRepo("nobody/nothing"), {
    votes: { yes: 0, no: 0 },
    myVote: null,
    tags: {},
  });
});

test("repo keys are case-insensitive across all operations", () => {
  const c = createCommunityStore({ dir: tempDir() });
  c.vote("Zulip/Zulip", "yes");
  assert.equal(c.getRepo("zulip/zulip").votes.yes, 1);
});

// --- Store level: crowd tags ------------------------------------------------

test("tags normalize case/spacing and duplicates increment a count", () => {
  const c = createCommunityStore({ dir: tempDir() });
  c.addTag("joplin/joplin", "Self Hosted");
  const again = c.addTag("joplin/joplin", "  self   hosted  ");
  assert.deepEqual(again.tags, { "self-hosted": 2 });
});

test("invalid tags are rejected with the shared validation rule", () => {
  const c = createCommunityStore({ dir: tempDir() });
  // Note: dashes anywhere after char one ARE legal per TAG_RE ("trail-", "a b"
  // → "a-b" both normalize/validate as acceptable).
  for (const bad of ["a", "-lead", "with!bang", "café", "a".repeat(25)]) {
    assert.throws(() => c.addTag("joplin/joplin", bad), /invalid tag/, `should reject ${bad}`);
  }
});

test("tag cap blocks the 25th DISTINCT tag but not re-voting an existing one", () => {
  const c = createCommunityStore({ dir: tempDir() });
  for (let i = 0; i < 24; i += 1) c.addTag("r/repo", `tag-${String(i).padStart(2, "0")}`);
  assert.throws(() => c.addTag("r/repo", "brand-new-tag"), /tag limit reached/);
  const bumped = c.addTag("r/repo", "tag-00");
  assert.equal(bumped.tags["tag-00"], 2);
});

// --- Store level: suggestions & flags ----------------------------------------

test("suggestions validate name and truncate long url/note fields", () => {
  const c = createCommunityStore({ dir: tempDir() });
  assert.throws(() => c.addSuggestion({ name: "" }), /invalid suggestion/);
  assert.throws(() => c.addSuggestion({ name: "x".repeat(121) }), /invalid suggestion/);

  c.addSuggestion({ name: "Linear alt", url: `https://e.com/${"u".repeat(400)}`, note: "n".repeat(600) });
  const [s] = c.list().suggestions;
  assert.equal(s.name, "Linear alt");
  assert.equal(s.url.length, 300);
  assert.equal(s.note.length, 500);
});

test("suggestion queue caps at 100 and evicts oldest first (FIFO)", () => {
  const c = createCommunityStore({ dir: tempDir() });
  for (let i = 0; i < 101; i += 1) c.addSuggestion({ name: `alt-${i}` });
  const { suggestions } = c.list();
  assert.equal(suggestions.length, 100);
  assert.equal(suggestions[0].name, "alt-1");
  assert.equal(suggestions.at(-1).name, "alt-100");
});

test("flags require owner/name shape and persist trimmed payloads", () => {
  const c = createCommunityStore({ dir: tempDir() });
  assert.throws(() => c.addFlag({ repo: "not-a-repo" }), /invalid repo/);
  assert.throws(() => c.addFlag({ repo: "" }), /invalid repo/);

  c.addFlag({ repo: "penpot/penpot", field: "demoUrl", note: "dead link".repeat(100) });
  const [f] = c.list().flags;
  assert.equal(f.repo, "penpot/penpot");
  assert.equal(f.field, "demoUrl");
  assert.equal(f.note.length, 500);
});

test("state survives a restart: a second store instance sees prior writes", () => {
  const dir = tempDir();
  const a = createCommunityStore({ dir });
  a.vote("o/r", "yes");
  a.addTag("o/r", "privacy-focused");

  const b = createCommunityStore({ dir });
  const state = b.getRepo("o/r");
  assert.equal(state.votes.yes, 1);
  assert.equal(state.tags["privacy-focused"], 1);
});

test("corrupted community.json recovers to a fresh schema instead of crashing", () => {
  const dir = tempDir();
  fs.writeFileSync(path.join(dir, "community.json"), "{not json");
  const c = createCommunityStore({ dir });
  assert.deepEqual(c.getRepo("any/thing").votes, { yes: 0, no: 0 });
  // And the recovered store keeps working end-to-end.
  assert.equal(c.vote("any/thing", "no").votes.no, 1);
});

// --- Route level --------------------------------------------------------------

const { createApp } = await import("../src/server/app.js");

async function startServer() {
  const { app } = createApp();
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      resolve({ server, base: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

test("GET /api/community/:owner/:name serves aggregate state; non-catalog 404s", async () => {
  const { server, base } = await startServer();
  const hit = await (await fetch(`${base}/api/community/usebruno/bruno`)).json();
  assert.deepEqual(Object.keys(hit).sort(), ["myVote", "tags", "votes"]);

  const miss = await fetch(`${base}/api/community/not/in-catalog`);
  assert.equal(miss.status, 404);
  server.close();
});

test("vote route: 400 on invalid choice, 404 off-catalog, aggregate round-trip", async () => {
  const { server, base } = await startServer();

  const bad = await fetch(`${base}/api/community/usebruno/bruno/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ choice: "maybe" }),
  });
  assert.equal(bad.status, 400);

  const off = await fetch(`${base}/api/community/not/in-catalog/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ choice: "yes" }),
  });
  assert.equal(off.status, 404);

  const vote = await (
    await fetch(`${base}/api/community/zulip/zulip/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choice: "yes" }),
    })
  ).json();
  assert.deepEqual(vote.votes, { yes: 1, no: 0 });

  const retract = await (
    await fetch(`${base}/api/community/zulip/zulip/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choice: "yes" }),
    })
  ).json();
  assert.deepEqual(retract.votes, { yes: 0, no: 0 });
  server.close();
});

test("tag route validates input; suggestion and flag routes enforce shapes", async () => {
  const { server, base } = await startServer();

  const badTag = await fetch(`${base}/api/community/usebruno/bruno/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tag: "!bad" }),
  });
  assert.equal(badTag.status, 400);

  const goodTag = await (
    await fetch(`${base}/api/community/usebruno/bruno/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag: "lightweight" }),
    })
  ).json();
  assert.ok(goodTag.tags["lightweight"] >= 1);

  const emptySuggestion = await fetch(`${base}/api/community/suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "" }),
  });
  assert.equal(emptySuggestion.status, 400);

  const suggestion = await (
    await fetch(`${base}/api/community/suggestions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Some tool", url: "https://example.com" }),
    })
  ).json();
  assert.equal(suggestion.ok, true);

  const badFlag = await fetch(`${base}/api/community/flags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo: "nope" }),
  });
  assert.equal(badFlag.status, 400);

  const flag = await (
    await fetch(`${base}/api/community/flags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo: "navidrome/navidrome", field: "pricePerYearUsd" }),
    })
  ).json();
  assert.equal(flag.ok, true);

  // Test GET /community/flags
  const flagsRes = await (await fetch(`${base}/api/community/flags`)).json();
  assert.equal(flagsRes.ok, true);
  assert.ok(flagsRes.flags.length >= 1);

  // Test GET /community/:owner/:name/parity
  const parity = await (await fetch(`${base}/api/community/supabase/supabase/parity`)).json();
  assert.equal(parity.repo, "supabase/supabase");
  assert.ok(parity.total > 0);
  assert.ok(parity.consensusPct >= 80);
  assert.ok("breakdown" in parity);
  assert.equal(typeof parity.breakdown.full.pct, "number");

  // Test suggestions queue list, filter, and upvote
  const suggs = await (await fetch(`${base}/api/community/suggestions?sort=votes`)).json();
  assert.equal(suggs.ok, true);
  assert.ok(Array.isArray(suggs.suggestions));

  const targetSugg = suggs.suggestions[0];
  if (targetSugg) {
    const priorVotes = targetSugg.votes || 1;
    const upvoted = await (
      await fetch(`${base}/api/community/suggestions/${targetSugg.id}/upvote`, { method: "POST" })
    ).json();
    assert.equal(upvoted.ok, true);
    assert.equal(upvoted.votes, priorVotes + 1);
  }

  server.close();
});

test("3-tier voting (yes, partial, no) and consensus calculation", () => {
  const c = createCommunityStore({ dir: tempDir() });

  // Test partial vote
  const voted = c.vote("my-org/my-tool", "partial");
  assert.equal(voted.myVote, "partial");

  const parity1 = c.getParityConsensus("my-org/my-tool");
  assert.equal(parity1.myVote, "partial");
  assert.equal(parity1.votes.partial, 1);
  assert.equal(parity1.total, 1);
  assert.equal(parity1.consensusPct, 50); // partial gets 50% weight

  // Retract partial vote
  const retracted = c.vote("my-org/my-tool", "partial");
  assert.equal(retracted.myVote, null);
  const parity2 = c.getParityConsensus("my-org/my-tool");
  assert.equal(parity2.votes.partial, 0);

  // Test caution threshold: if >= 8 votes and >= 35% are 'no'
  for (let i = 0; i < 5; i++) c.vote(`mock-${i}/tool`, "yes");
  const testRepo = "caution-test/tool";
  // Add 5 no votes and 5 yes votes
  const storeData = c.exportData();
  storeData.votes[testRepo] = { yes: 5, partial: 0, no: 5, my: null };
  c.importData(storeData);

  const cautionParity = c.getParityConsensus(testRepo);
  assert.equal(cautionParity.total, 10);
  assert.equal(cautionParity.breakdown.notViable.pct, 50);
  assert.equal(cautionParity.caution, true);
});

test("listSuggestions supports status filtering and search", () => {
  const c = createCommunityStore({ dir: tempDir() });
  c.addSuggestion({ name: "Tool Alpha", replaces: "Notion", category: "Notes" });
  c.addSuggestion({ name: "Tool Beta", replaces: "Linear", category: "Project Management" });

  const all = c.listSuggestions();
  assert.equal(all.length, 2);

  const searchHit = c.listSuggestions({ search: "linear" });
  assert.equal(searchHit.length, 1);
  assert.equal(searchHit[0].name, "Tool Beta");

  const upvoted = c.upvoteSuggestion(searchHit[0].id);
  assert.equal(upvoted.ok, true);
  assert.equal(upvoted.votes, 2);
});

