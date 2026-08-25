import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.OSH_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "osh-export-"));

const { buildExport } = await import("../src/server/export.js");
const { createFavoritesStore } = await import("../src/server/store.js");
const { createCommunityStore } = await import("../src/server/community.js");
const { createUsageStore } = await import("../src/server/usage.js");

test("export bundles favorites, community data and usage in schema shape", () => {
  const favorites = createFavoritesStore();
  const community = createCommunityStore();
  const usage = createUsageStore();

  favorites.add("usebruno/bruno");
  community.vote("usebruno/bruno", "yes");
  community.addTag("usebruno/bruno", "api");
  usage.increment();

  const data = buildExport({ favorites, community, usage });

  assert.equal(data.app, "opensource-hub");
  assert.equal(data.schema, 1);
  assert.ok(data.exportedAt);
  assert.equal(data.favorites.length, 1);
  assert.equal(data.favorites[0].repo, "usebruno/bruno");
  assert.ok(data.community.votes["usebruno/bruno"]);
  assert.ok(data.community.tags["usebruno/bruno"].api);
  assert.ok(typeof data.usage.runs === "number" && data.usage.runs >= 1);
});

test("export JSON round-trips through JSON.stringify", () => {
  const data = buildExport({
    favorites: createFavoritesStore(),
    community: createCommunityStore(),
    usage: createUsageStore(),
  });
  const parsed = JSON.parse(JSON.stringify(data));
  assert.deepEqual(parsed.favorites, data.favorites);
});

test("GET /api/export serves attachment with correct filename", async () => {
  const { createApp } = await import("../src/server/app.js");
  const { app } = createApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const res = await fetch(`${base}/api/export`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-disposition"), /opensource-hub-export\.json/);
  const json = await res.json();
  assert.equal(json.app, "opensource-hub");
  assert.ok(Array.isArray(json.favorites));
  server.close();
  await new Promise((r) => server.on("close", r));
});
