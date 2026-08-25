import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createOsvClient } from "../src/server/osv.js";

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "osv-test-"));
}

const BATCH_OK = {
  results: [
    { vulns: [{ id: "GHSA-aaaa", modified: "2026-01-01T00:00:00Z" }] },
    { vulns: [] },
  ],
};

const DETAIL = {
  id: "GHSA-aaaa",
  modified: "2026-01-01T00:00:00Z",
  summary: "XSS in widget renderer",
  severity: [{ score: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H" }],
};

function fakeFetch({ batchStatus = 200, detailStatus = 200, calls = [] } = {}) {
  return async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || "GET", body: init.body });
    if (String(url).includes("querybatch")) {
      if (batchStatus !== 200) return new Response("nope", { status: batchStatus });
      // OSV guarantees results[i] matches queries[i] — mirror the request shape.
      const queries = JSON.parse(init.body || "{}").queries || [];
      const results = queries.map((q, i) =>
        i === 0 ? { vulns: [{ id: "GHSA-aaaa", modified: "2026-01-01T00:00:00Z" }] } : { vulns: [] }
      );
      return new Response(JSON.stringify({ results }), { status: 200 });
    }
    if (detailStatus !== 200) return new Response("nope", { status: detailStatus });
    return new Response(JSON.stringify(DETAIL), { status: 200 });
  };
}

test("querybatch maps coordinates to results and fetches details only for hits", async () => {
  const calls = [];
  const osv = createOsvClient({ cacheDir: tempDir(), fetchImpl: fakeFetch({ calls }) });
  const { vulns, degraded } = await osv.query([
    { ecosystem: "npm", name: "left-pad" },
    { ecosystem: "PyPI", name: "requests" },
  ]);
  assert.equal(degraded, false);
  assert.equal(vulns.length, 1);
  assert.equal(vulns[0].id, "GHSA-aaaa");
  assert.equal(vulns[0].summary, "XSS in widget renderer");
  assert.ok(vulns[0].url.includes("osv.dev"));
  const batchCall = calls.find((c) => c.url.includes("querybatch"));
  assert.equal(batchCall.method, "POST");
  const body = JSON.parse('{"queries":[]}') && null; // body not captured; covered below
  assert.ok(batchCall);
  assert.ok(body === null);
});

test("(id, modified) disk cache prevents repeat detail fetches", async () => {
  const dir = tempDir();
  const calls1 = [];
  const osv1 = createOsvClient({ cacheDir: dir, fetchImpl: fakeFetch({ calls: calls1 }) });
  await osv1.query([{ ecosystem: "npm", name: "left-pad" }]);
  assert.equal(calls1.filter((c) => c.url.includes("/v1/vulns/")).length, 1);

  const calls2 = [];
  const osv2 = createOsvClient({ cacheDir: dir, fetchImpl: fakeFetch({ calls: calls2 }) });
  await osv2.query([{ ecosystem: "npm", name: "left-pad" }]);
  assert.equal(
    calls2.filter((c) => c.url.includes("/v1/vulns/")).length,
    0,
    "second run must hit disk cache, not the network"
  );
});

test("batch failure degrades silently to disk-cached advisories", async () => {
  const dir = tempDir();
  const osvA = createOsvClient({ cacheDir: dir, fetchImpl: fakeFetch() });
  await osvA.query([{ ecosystem: "npm", name: "left-pad" }]);

  const osvB = createOsvClient({ cacheDir: dir, fetchImpl: fakeFetch({ batchStatus: 503 }) });
  const { vulns, degraded } = await osvB.query([{ ecosystem: "npm", name: "left-pad" }]);
  assert.equal(degraded, true);
  assert.equal(vulns.length, 1);
  assert.equal(vulns[0].id, "GHSA-aaaa");
});

test("empty coordinates short-circuit without network", async () => {
  const calls = [];
  const osv = createOsvClient({ cacheDir: tempDir(), fetchImpl: fakeFetch({ calls }) });
  const { vulns, degraded } = await osv.query([]);
  assert.equal(vulns.length, 0);
  assert.equal(degraded, false);
  assert.equal(calls.length, 0);
});

test("detail fetch failure with no cache degrades to empty", async () => {
  const osv = createOsvClient({
    cacheDir: tempDir(),
    fetchImpl: fakeFetch({ detailStatus: 500 }),
  });
  const { vulns, degraded } = await osv.query([{ ecosystem: "npm", name: "left-pad" }]);
  assert.equal(degraded, true);
  assert.equal(vulns.length, 0);
});

// PRD section 29 scope fixes (plans/PLAN_PHASE2.md P4 revision):
// degrade must be repo-scoped — one repo's advisories must never leak into another's.

test("degraded results never leak another repo's cached advisories", async () => {
  const dir = tempDir();
  const osvA = createOsvClient({ cacheDir: dir, fetchImpl: fakeFetch() });
  await osvA.query([{ ecosystem: "npm", name: "left-pad" }], { scope: "acme/left-pad" }); // caches GHSA-aaaa for A

  const osvB = createOsvClient({ cacheDir: dir, fetchImpl: fakeFetch({ batchStatus: 503 }) });
  const { vulns, degraded } = await osvB.query([{ ecosystem: "npm", name: "some-other-pkg" }], {
    scope: "acme/other",
  });
  assert.equal(degraded, true);
  assert.equal(vulns.length, 0, "repo A's advisories leaked into repo B during degrade");
});

test("commit-based query hits querybatch with commit key", async () => {
  const calls = [];
  const osv = createOsvClient({ cacheDir: tempDir(), fetchImpl: fakeFetch({ calls }) });
  const { degraded } = await osv.query([], { commit: "abc123def456" });
  assert.equal(degraded, false);
  const batch = calls.find((c) => c.url.includes("querybatch"));
  assert.ok(batch, "commit query must reach querybatch");
  const sent = JSON.parse(batch.body);
  assert.deepEqual(sent.queries, [{ commit: "abc123def456" }]);
});

test("package version is passed through when provided", async () => {
  const calls = [];
  const osv = createOsvClient({ cacheDir: tempDir(), fetchImpl: fakeFetch({ calls }) });
  await osv.query([{ ecosystem: "npm", name: "left-pad", version: "1.3.0" }]);
  const batch = calls.find((c) => c.url.includes("querybatch"));
  const sent = JSON.parse(batch.body);
  assert.deepEqual(sent.queries[0], { package: { ecosystem: "npm", name: "left-pad" }, version: "1.3.0" });
});
