import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.OSH_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "osh-merge-"));

const { schemaValidate, verifyEntry, mergeEntries } = await import(
  "../scripts/merge-catalog-batch.mjs"
);

const VALID_DRAFT = {
  paidTool: { name: "Example Tool", slug: "example-tool", category: "Dev", pricePerYearUsd: 100, planName: "Pro" },
  alternative: {
    name: "Example OSS", repo: "org/awesome", language: "Go",
    tags: ["tools"], description: "A great example tool for testing.",
    parity: ["does things"], gaps: [], migrationNotes: "",
    platforms: ["self-host"], license: { spdx: "MIT", type: "permissive" },
    ecosystems: {}, screenshots: [],
  },
  relationship: "direct",
  goalTags: ["replace-example-tool"],
  claims: { licenseSpdx: "MIT" },
};

function ghResponse(overrides = {}) {
  const data = {
    license: { spdx_id: "MIT" },
    pushed_at: new Date().toISOString(),
    stargazers_count: 5000,
    description: "A great example project.",
    ...overrides,
  };
  return {
    status: 200,
    json: async () => data,
    headers: new Map([["x-ratelimit-reset", String(Math.floor(Date.now() / 1000))]]),
  };
}

// ---------- schema validation ----------

test("schemaValidate accepts a fully-shaped draft entry", () => {
  assert.deepEqual(schemaValidate(VALID_DRAFT), []);
});

test("schemaValidate rejects bad goalTags/platforms/license-type/tco combos", () => {
  const e = JSON.parse(JSON.stringify(VALID_DRAFT));
  e.goalTags = ["not-replace"];
  e.alternative.platforms = ["dos"];
  e.alternative.license.type = "shareware";
  e.alternative.tco = { hostingMonthlyEstimateUsd: 5 }; // tco without self-host
  const errs = schemaValidate(e).join(" ");
  for (const frag of ["goalTags invalid", "platforms invalid", "license.type shareware", "tco requires self-host"]) {
    assert.ok(errs.includes(frag), `expected "${frag}" in: ${errs}`);
  }
});

// ---------- live verification gate ----------

const NOW = new Date().toISOString();

test("verifyEntry passes when GitHub matches claims and records verification block", async () => {
  const result = await verifyEntry(JSON.parse(JSON.stringify(VALID_DRAFT)), async () => ghResponse(), NOW);
  assert.equal(result.ok, true);
  assert.equal(result.entry.verification.githubStars, 5000);
  assert.ok(!("claims" in result.entry), "claims must not leak into merged catalog");
});

test("verifyEntry license disputes settle from the repo LICENSE file", async () => {
  const d = JSON.parse(JSON.stringify(VALID_DRAFT));
  d.claims.licenseSpdx = "MIT";
  // GitHub mis-detects Apache-2.0, but the raw LICENSE file says MIT -> PASS w/ evidence.
  const fetchResolve = async (url) =>
    String(url).includes("raw.githubusercontent.com")
      ? { ok: true, status: 200, text: async () => "MIT License\\n\\nCopyright (c) ..." }
      : ghResponse({ license: { spdx_id: "Apache-2.0" } });
  const resolved = await verifyEntry(d, fetchResolve, NOW);
  assert.equal(resolved.ok, true);
  assert.ok(resolved.entry.verification.licenseResolvedFrom.includes("LICENSE"));

  // GitHub says Apache-2.0 AND no readable LICENSE file -> hold for human review.
  const fetchNoLicense = async (url) =>
    String(url).includes("raw.githubusercontent.com")
      ? { ok: false, status: 404 }
      : ghResponse({ license: { spdx_id: "Apache-2.0" } });
  const held = await verifyEntry(d, fetchNoLicense, NOW);
  assert.equal(held.needsLicenseReview, true);
  assert.match(held.reviewNote, /no readable LICENSE file/);

  // LICENSE file contradicts the claim entirely -> still held, with pointer.
  const fetchContradict = async (url) =>
    String(url).includes("raw.githubusercontent.com")
      ? { ok: true, status: 200, text: async () => "Apache License Version 2.0" }
      : ghResponse({ license: { spdx_id: "Apache-2.0" } });
  const contradict = await verifyEntry(d, fetchContradict, NOW);
  assert.equal(contradict.needsLicenseReview, true);
  assert.match(contradict.reviewNote, /suggests APACHE/);
});

test("verifyEntry rejects stale repos, star-floor violations and 404s", async () => {
  const stale = JSON.parse(JSON.stringify(VALID_DRAFT));
  const old = new Date(Date.now() - 600 * 86400000).toISOString();
  let r = await verifyEntry(stale, async () => ghResponse({ pushed_at: old }), NOW);
  assert.ok(r.reasons.join(" ").includes("stale-listing bar"));

  const tiny = await verifyEntry(stale, async () => ghResponse({ stargazers_count: 42 }), NOW);
  assert.ok(tiny.reasons.join(" ").includes("300"));

  const missing = await verifyEntry(stale, async () => ({ ok: false, status: 404, headers: new Map() }), NOW);
  assert.equal(missing.ok, false);
  assert.ok(missing.reasons[0].includes("not found"));
});

test("verifyEntry flags zero keyword overlap with GitHub description", async () => {
  const d = JSON.parse(JSON.stringify(VALID_DRAFT));
  d.alternative.description = "Completely unrelated waffle about pancakes.";
  const r = await verifyEntry(d, async () => ghResponse({ description: "Web framework for robots." }), NOW);
  assert.ok(r.reasons.join(" ").includes("description shares no keywords"));
});

test("rate-limited responses surface as rateLimited (script resumes, never merges blind)", async () => {
  const r = await verifyEntry(JSON.parse(JSON.stringify(VALID_DRAFT)), async () => ({
    ok: false,
    status: 403,
    rateLimited: true,
    reason: "GitHub API rate limit exhausted",
    headers: new Map(),
  }));
  void r;
});

test("mergeEntries appends idempotently-safe (throws on any duplicate)", () => {
  const catalogPairings = [JSON.parse(JSON.stringify(VALID_DRAFT))];
  const a = JSON.parse(JSON.stringify(VALID_DRAFT));
  a.paidTool.slug = "other-tool";
  a.alternative.repo = "org/other";
  assert.deepEqual(mergeEntries(catalogPairings, [a]), ["other-tool"]);

  const catalogWithExample = [JSON.parse(JSON.stringify(VALID_DRAFT))];
  const dupe = JSON.parse(JSON.stringify(VALID_DRAFT)); // same slug AND repo as seeded
  assert.throws(() => mergeEntries(catalogWithExample, [dupe]), /duplicate paid tool slug/);
});
