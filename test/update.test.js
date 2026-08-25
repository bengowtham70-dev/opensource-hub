import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkForUpdate, isNewer, parseVersion } from "../src/server/update-check.js";

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "osh-update-"));
}

function fakeFetch({ status = 200, version = "9.9.9", calls = [] } = {}) {
  return async (url) => {
    calls.push(String(url));
    if (status !== 200) return new Response("nope", { status });
    return new Response(JSON.stringify({ version }), { status: 200 });
  };
}

test("parseVersion handles v-prefixes, prerelease suffixes and junk", () => {
  assert.deepEqual(parseVersion("v1.2.3"), [1, 2, 3]);
  assert.deepEqual(parseVersion("0.10.2-beta.1"), [0, 10, 2]);
  assert.equal(parseVersion("junk"), null);
  assert.equal(parseVersion(undefined), null);
});

test("isNewer compares numerically (no string-sort bugs)", () => {
  assert.equal(isNewer("0.1.0", "0.2.0"), true);
  assert.equal(isNewer("0.9.0", "0.10.0"), true, "0.10 > 0.9 numerically");
  assert.equal(isNewer("0.1.0", "0.1.0"), false);
  assert.equal(isNewer("0.2.0", "0.1.9"), false);
});

test("detects a newer registry version and writes the TTL cache", async () => {
  const dir = tempDir();
  const update = await checkForUpdate({
    currentVersion: "0.1.0",
    cacheDir: dir,
    fetchImpl: fakeFetch({ version: "0.2.0" }),
  });
  assert.deepEqual(update, { currentVersion: "0.1.0", latest: "0.2.0" });
  const cached = JSON.parse(fs.readFileSync(path.join(dir, "update-check.json"), "utf8"));
  assert.equal(cached.latest, "0.2.0");
  assert.ok(typeof cached.checkedAt === "number");
});

test("same or older registry version returns null", async () => {
  const update = await checkForUpdate({
    currentVersion: "0.2.0",
    cacheDir: tempDir(),
    fetchImpl: fakeFetch({ version: "0.1.0" }),
  });
  assert.equal(update, null);
});

test("fresh cache short-circuits without touching the network", async () => {
  const dir = tempDir();
  fs.writeFileSync(
    path.join(dir, "update-check.json"),
    JSON.stringify({ checkedAt: Date.now() - 60 * 1000, latest: "5.0.0" })
  );
  const calls = [];
  const update = await checkForUpdate({
    currentVersion: "0.1.0",
    cacheDir: dir,
    fetchImpl: fakeFetch({ calls }),
  });
  assert.deepEqual(update, { currentVersion: "0.1.0", latest: "5.0.0" });
  assert.equal(calls.length, 0, "TTL cache must prevent the registry call");
});

test("expired cache triggers exactly one registry call", async () => {
  const dir = tempDir();
  fs.writeFileSync(
    path.join(dir, "update-check.json"),
    JSON.stringify({ checkedAt: Date.now() - 25 * 60 * 60 * 1000, latest: "0.1.0" })
  );
  const calls = [];
  await checkForUpdate({
    currentVersion: "0.1.0",
    cacheDir: dir,
    fetchImpl: fakeFetch({ version: "0.3.0", calls }),
  });
  assert.equal(calls.length, 1);
  assert.ok(calls[0].includes("registry.npmjs.org/opensource-hub/latest"));
});

test("network failure with no cache degrades silently to null", async () => {
  const update = await checkForUpdate({
    currentVersion: "0.1.0",
    cacheDir: tempDir(),
    fetchImpl: async () => {
      throw new Error("offline");
    },
  });
  assert.equal(update, null);
});

test("unpublished package (404) returns null instead of throwing", async () => {
  // Live reality right now: opensource-hub is not on the npm registry yet.
  const update = await checkForUpdate({
    currentVersion: "0.1.0",
    cacheDir: tempDir(),
    fetchImpl: fakeFetch({ status: 404 }),
  });
  assert.equal(update, null);
});
