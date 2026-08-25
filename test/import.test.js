import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.OSH_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "osh-import-"));

const { createApp } = await import("../src/server/app.js");
const { buildExport } = await import("../src/server/export.js");
const { createFavoritesStore } = await import("../src/server/store.js");
const { createCommunityStore } = await import("../src/server/community.js");

test("POST /api/import merges favorites, votes and tags from an export payload", async () => {
  const { app } = createApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  const payload = {
    data: {
      app: "opensource-hub",
      schema: 1,
      exportedAt: "2026-01-01T00:00:00Z",
      favorites: [{ repo: "usebruno/bruno", addedAt: "2026-01-01T00:00:00Z" }],
      community: {
        votes: { "penpot/penpot": { yes: 7, no: 1, my: "yes" } },
        tags: { "usebruno/bruno": { api: 3 } },
        suggestions: [{ name: "SomeTool", url: "", note: "" }],
      },
    },
  };
  const res = await fetch(`${base}/api/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  assert.equal(res.status, 200);
  assert.equal(json.importedFavorites, 1);
  assert.equal(json.community.votes, 1);
  assert.equal(json.community.tags, 1);

  // Round-trip: export now contains what we imported.
  const back = await (await fetch(`${base}/api/export`)).json();
  assert.equal(back.favorites[0].repo, "usebruno/bruno");
  assert.equal(back.community.votes["penpot/penpot"].yes, 7);
  assert.equal(back.community.votes["penpot/penpot"].my, "yes");
  assert.equal(back.community.tags["usebruno/bruno"].api, 3);
  server.close();
  await new Promise((r) => server.on("close", r));
});

test("import rejects non-OpenSource-Hub files", async () => {
  const { app } = createApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const res = await fetch(`${base}/api/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { app: "other-app", schema: 9 } }),
  });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /Not an OpenSource Hub export/);
  server.close();
  await new Promise((r) => server.on("close", r));
});

test("import merge never lowers existing counts", async () => {
  const community = createCommunityStore();
  community.vote("a/b", "yes");
  const before = community.exportData().votes["a/b"];
  community.importData({ votes: { "a/b": { yes: 0, no: 0, my: null } } });
  const after = community.exportData().votes["a/b"];
  assert.equal(after.yes, before.yes);
  assert.equal(after.my, before.my);
});
