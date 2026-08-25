import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.OSH_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "osh-lists-test-"));

const { createApp } = await import("../src/server/app.js");

async function startServer() {
  const { app } = createApp();
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      resolve({ server, base: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

test("GET /api/lists returns every curated list with a repoCount", async () => {
  const { server, base } = await startServer();
  const res = await fetch(`${base}/api/lists`);
  const json = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(json) && json.length >= 5, "expected the five starter lists");
  for (const l of json) {
    assert.ok(l.slug && l.title && l.criteria, `list missing metadata: ${l.slug}`);
    assert.ok(typeof l.repoCount === "number" && l.repoCount > 0, `${l.slug} has no repos`);
    // Raw repoSlugs stay internal — the index exposes counts only.
    assert.equal(l.repoSlugs, undefined, "index must not leak raw repoSlugs");
  }
  server.close();
});

test("GET /api/lists/:slug returns criteria blockquote data + enriched pairings (PRD section 2.10)", async () => {
  const { server, base } = await startServer();
  const res = await fetch(`${base}/api/lists/self-hosted-starter-pack`);
  const json = await res.json();
  assert.equal(res.status, 200);
  assert.equal(json.title, "Self-Hosted Starter Pack");
  assert.ok(json.criteria.length >= 40, "criteria must be substantive");
  assert.ok(json.pairings.length >= 4);
  for (const p of json.pairings) {
    assert.ok(p.alternative.repo, "pairing not enriched via enrichPairing()");
    assert.ok(p.alternative.platforms, "schema v2 fields must be forwarded");
    assert.ok(p.stars30d, "sparkline snapshot data must ride along");
  }
  server.close();
});

test("GET /api/lists/:slug 404s cleanly for unknown slugs", async () => {
  const { server, base } = await startServer();
  const res = await fetch(`${base}/api/lists/does-not-exist`);
  assert.equal(res.status, 404);
  const json = await res.json();
  assert.equal(json.error, "list not found");
  server.close();
});

test("every list's repoSlugs resolve against the catalog", async () => {
  const { server, base } = await startServer();
  const lists = await (await fetch(`${base}/api/lists`)).json();
  for (const l of lists) {
    const detail = await (await fetch(`${base}/api/lists/${l.slug}`)).json();
    assert.equal(
      detail.pairings.length,
      l.repoCount,
      `${l.slug}: catalog misses silently dropped pairings`
    );
  }
  server.close();
});
