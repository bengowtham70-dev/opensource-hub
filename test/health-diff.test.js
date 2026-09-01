import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

process.env.OSH_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "osh-hd-"));

const { computeHealthDiff } = await import("../scripts/build-health-diff.mjs");
const { createApp } = await import("../src/server/app.js");

const { fileURLToPath } = await import("node:url");
const DIFF_FILE = fileURLToPath(new URL("../src/data/health-diff.json", import.meta.url));

const NOW = new Date("2026-08-24T12:00:00Z").getTime();
const day = (n) => new Date(NOW - n * 86400000).toISOString().slice(0, 10);

function fakeSnapshot() {
  return {
    stars: { "excalidraw/excalidraw": 99500, "wekan/wekan": 20100, "GNOME/gimp": 15600 },
    history: {
      // 30d window: baseline at ~day 30 exists → delta = last − that sample.
      "excalidraw/excalidraw": [
        { date: day(31), stars: 98000 },
        { date: day(1), stars: 99500 },
      ],
      // Only one star sample → honest null (never a fabricated +0).
      "wekan/wekan": [{ date: day(0), stars: 20100 }],
    },
    downloadsHistory: {
      "excalidraw/excalidraw": [
        { date: day(32), npm: 100000 },
        { date: day(2), npm: 112000 },
      ],
    },
    meta: {
      "excalidraw/excalidraw": { pushedAt: "2026-08-20T00:00:00Z", archived: false },
      "wekan/wekan": { pushedAt: "2025-01-15T00:00:00Z", archived: false },
      "GNOME/gimp": { pushedAt: "2026-05-01T00:00:00Z", archived: false },
    },
  };
}

test("computeHealthDiff: stars/downloads deltas over the window", () => {
  const diff = computeHealthDiff(fakeSnapshot(), { now: NOW });
  const ex = diff.repos["excalidraw/excalidraw"];
  assert.equal(diff.windowDays, 30);
  assert.equal(ex.starsDelta, 1500);
  assert.deepEqual(ex.downloadsDelta, { npm: 12000 });
});

test("computeHealthDiff: fewer than 2 samples → no delta key at all", () => {
  const diff = computeHealthDiff(fakeSnapshot(), { now: NOW });
  assert.ok(!("starsDelta" in diff.repos["wekan/wekan"]));
});

test("computeHealthDiff: freshness bands match the UI pill thresholds", () => {
  const diff = computeHealthDiff(fakeSnapshot(), { now: NOW });
  assert.equal(diff.repos["excalidraw/excalidraw"].freshness, "fresh"); // 4d < 90d
  assert.equal(diff.repos["GNOME/gimp"].freshness, "aging"); // ~115d
  assert.equal(diff.repos["wekan/wekan"].freshness, "stale"); // >180d
});

test("computeHealthDiff: repos without meta get freshness 'unknown' (never fabricated)", () => {
  const snap = fakeSnapshot();
  delete snap.meta["GNOME/gimp"];
  const diff = computeHealthDiff(snap, { now: NOW });
  assert.equal(diff.repos["GNOME/gimp"].freshness, "unknown");
  assert.ok(!("daysSincePush" in diff.repos["GNOME/gimp"]));
});

test("GET /api/health-diff serves the committed public diff; per-repo entry resolves", async () => {
  // Seed the file the monthly cron would commit.
  fs.writeFileSync(DIFF_FILE, JSON.stringify(computeHealthDiff(fakeSnapshot(), { now: Date.now() })));
  try {
    const { app } = createApp();
    const server = app.listen(0, "127.0.0.1");
    await new Promise((r) => server.on("listening", r));
    const base = `http://127.0.0.1:${server.address().port}`;

    const all = await (await fetch(`${base}/api/health-diff`)).json();
    assert.equal(all.available, true);
    assert.ok(all.repos["excalidraw/excalidraw"]);

    const one = await (await fetch(`${base}/api/health-diff/excalidraw/excalidraw`)).json();
    assert.equal(one.freshness, "fresh");

    const unknown = await fetch(`${base}/api/health-diff/not/in-catalog`);
    assert.equal(unknown.status, 404);
    server.close();
    await new Promise((r) => setTimeout(r, 250));
  } finally {
    fs.rmSync(DIFF_FILE, { force: true });
  }
});

test("GET /api/health-diff returns an honest empty shape before the first cron run", async () => {
  const { app } = createApp();
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.on("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const json = await (await fetch(`${base}/api/health-diff`)).json();
  assert.equal(json.available, false);
  assert.deepEqual(json.repos, {});
  server.close();
    await new Promise((r) => setTimeout(r, 250));
});
