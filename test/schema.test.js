// PRD section 19 Phase 2 item coverage — Catalog Schema v2 (plans/PLAN_PHASE2.md Phase 1).
// Validates alternatives.json v2 fields (platforms/license/relationship/goalTags/
// screenshots/ecosystems/demoUrl) and the curated public lists seed file.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "../src/data");
const catalog = JSON.parse(fs.readFileSync(path.join(dataDir, "alternatives.json"), "utf8"));
const listsPath = path.join(dataDir, "lists.json");

const ALLOWED_PLATFORMS = new Set(["win", "mac", "linux", "web", "self-host"]);
const RELATIONSHIPS = new Set(["direct", "partial", "fork"]);
const LICENSE_TYPES = new Set(["permissive", "copyleft", "network-copyleft"]);
const ECOSYSTEM_KEYS = new Set(["npm", "pypi", "docker"]);
const SPDX_RE = /^[A-Za-z0-9.+-]+( OR [A-Za-z0-9.+-]+)*$/;

test("catalog declares schema version 2", () => {
  assert.equal(catalog.version, 2);
});

test("every pairing has a valid relationship type", () => {
  for (const p of catalog.pairings) {
    assert.ok(
      RELATIONSHIPS.has(p.relationship),
      `${p.paidTool.slug}: relationship must be one of ${[...RELATIONSHIPS]} (got ${p.relationship})`
    );
  }
});

test("every pairing has at least one well-formed goalTag", () => {
  for (const p of catalog.pairings) {
    assert.ok(Array.isArray(p.goalTags) && p.goalTags.length >= 1, `${p.paidTool.slug}: needs goalTags`);
    for (const tag of p.goalTags) {
      assert.match(tag, /^replace-[a-z0-9]+(-[a-z0-9]+)*$/, `${p.paidTool.slug}: bad goalTag ${tag}`);
    }
  }
});

test("every alternative supports at least one known platform", () => {
  for (const p of catalog.pairings) {
    const { platforms } = p.alternative;
    assert.ok(Array.isArray(platforms) && platforms.length >= 1, `${p.alternative.repo}: needs platforms`);
    for (const plat of platforms) {
      assert.ok(ALLOWED_PLATFORMS.has(plat), `${p.alternative.repo}: unknown platform ${plat}`);
    }
  }
});

test("every alternative carries an SPDX license with a safety class", () => {
  for (const p of catalog.pairings) {
    const { license } = p.alternative;
    assert.ok(license, `${p.alternative.repo}: missing license`);
    assert.match(license.spdx, SPDX_RE, `${p.alternative.repo}: malformed SPDX id ${license.spdx}`);
    assert.ok(
      LICENSE_TYPES.has(license.type),
      `${p.alternative.repo}: license.type must be one of ${[...LICENSE_TYPES]}`
    );
  }
});

test("optional demoUrl is always https", () => {
  for (const p of catalog.pairings) {
    const url = p.alternative.demoUrl;
    if (url !== undefined) {
      assert.match(url, /^https:\/\/[\w.-]+/, `${p.alternative.repo}: demoUrl must be https`);
    }
  }
});

test("screenshots entries always carry src and alt text", () => {
  for (const p of catalog.pairings) {
    const shots = p.alternative.screenshots ?? [];
    assert.ok(Array.isArray(shots), `${p.alternative.repo}: screenshots must be an array`);
    for (const s of shots) {
      assert.equal(typeof s.src, "string", `${p.alternative.repo}: screenshot.src`);
      assert.equal(typeof s.alt, "string", `${p.alternative.repo}: screenshot.alt`);
      assert.ok(s.alt.length > 0, `${p.alternative.repo}: empty screenshot alt`);
    }
  }
});

test("ecosystems coordinates only use known keys and non-empty names", () => {
  for (const p of catalog.pairings) {
    const eco = p.alternative.ecosystems;
    if (eco === undefined) continue;
    for (const [key, value] of Object.entries(eco)) {
      assert.ok(ECOSYSTEM_KEYS.has(key), `${p.alternative.repo}: unknown ecosystem key ${key}`);
      assert.equal(typeof value, "string", `${p.alternative.repo}: ecosystem ${key} value`);
      assert.ok(value.trim().length > 0, `${p.alternative.repo}: ecosystem ${key} empty`);
    }
  }
});

test("slugs and repos stay unique across the catalog", () => {
  const slugs = new Set();
  const repos = new Set();
  for (const p of catalog.pairings) {
    assert.ok(!slugs.has(p.paidTool.slug), `duplicate paid tool slug ${p.paidTool.slug}`);
    assert.ok(!repos.has(p.alternative.repo.toLowerCase()), `duplicate alternative repo ${p.alternative.repo}`);
    slugs.add(p.paidTool.slug);
    repos.add(p.alternative.repo.toLowerCase());
  }
});

test("curated lists reference valid pairing repos with stated criteria", () => {
  assert.ok(fs.existsSync(listsPath), "src/data/lists.json must exist");
  const lists = JSON.parse(fs.readFileSync(listsPath, "utf8"));
  assert.ok(Array.isArray(lists) && lists.length >= 1, "at least one curated list");
  const knownRepos = new Set(catalog.pairings.map((p) => p.alternative.repo.toLowerCase()));
  const seenSlugs = new Set();
  for (const list of lists) {
    assert.match(list.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, `bad list slug ${list.slug}`);
    assert.ok(!seenSlugs.has(list.slug), `duplicate list slug ${list.slug}`);
    seenSlugs.add(list.slug);
    assert.equal(typeof list.title, "string");
    assert.ok(list.criteria && list.criteria.length >= 40, `${list.slug}: inclusion criteria required (PRD: stated criteria pattern)`);
    assert.ok(Array.isArray(list.repoSlugs) && list.repoSlugs.length >= 2, `${list.slug}: needs >= 2 repos`);
    for (const repo of list.repoSlugs) {
      assert.ok(knownRepos.has(repo.toLowerCase()), `${list.slug}: unknown repo ${repo}`);
    }
  }
});

test("optional tco estimate is a positive number on self-host listings only (F5)", () => {
  let count = 0;
  for (const p of catalog.pairings) {
    const a = p.alternative;
    if (a.tco != null) {
      count += 1;
      assert.ok(
        Number.isFinite(a.tco.hostingMonthlyEstimateUsd) && a.tco.hostingMonthlyEstimateUsd > 0,
        `${a.name}: tco.hostingMonthlyEstimateUsd must be a positive number`
      );
      assert.ok(
        a.platforms.includes("self-host"),
        `${a.name}: tco on a non-self-host listing is meaningless`
      );
    }
  }
  assert.ok(count >= 15, `expected >=15 tco estimates, got ${count}`);
});
