import assert from "node:assert/strict";
import { test } from "node:test";
import { computeTrust, computeMaintenance, appealUrl } from "../src/server/trust.js";

const DAY = 86400000;
const iso = (daysAgo) => new Date(Date.now() - daysAgo * DAY).toISOString();

const healthyRepo = {
  fullName: "acme/healthy",
  description: "A well-maintained tool",
  stars: 12000,
  openIssues: 180,
  pushedAt: iso(3),
  createdAt: iso(1500),
  license: { spdx: "MIT", name: "MIT License" },
  archived: false,
  contributors: 28,
};

test("healthy repo scores strong with no red flags", () => {
  const t = computeTrust(healthyRepo);
  assert.equal(t.band, "strong");
  assert.ok(t.score >= 80, `expected >= 80, got ${t.score}`);
  assert.equal(t.redFlags.length, 0);
  assert.equal(t.maintenance.status, "active");
});

test("archived repo is flagged abandoned with a red flag", () => {
  const t = computeTrust({ ...healthyRepo, archived: true });
  assert.equal(t.maintenance.status, "abandoned");
  assert.ok(t.redFlags.some((f) => f.toLowerCase().includes("archived")));
  assert.equal(t.signals.find((s) => s.key === "archived").points, 0);
});

test("stale repo (>210 days) gets abandoned status and red flag", () => {
  const t = computeTrust({ ...healthyRepo, pushedAt: iso(300) });
  assert.equal(t.maintenance.status, "abandoned");
  assert.ok(t.redFlags.some((f) => f.includes("months")));
});

test("missing license produces a red flag and zero points", () => {
  const t = computeTrust({ ...healthyRepo, license: null });
  assert.equal(t.signals.find((s) => s.key === "license").points, 0);
  assert.ok(t.redFlags.some((f) => f.toLowerCase().includes("license")));
});

test("score stays within bounds and every signal carries detail text", () => {
  const t = computeTrust(healthyRepo);
  assert.ok(t.score >= 0 && t.score <= 100);
  for (const s of t.signals) {
    assert.ok(s.points >= 0 && typeof s.detail === "string" && s.detail.length > 0);
  }
});

test("computeMaintenance thresholds", () => {
  assert.equal(computeMaintenance({ archived: false, pushedAt: iso(10) }).status, "active");
  assert.equal(computeMaintenance({ archived: false, pushedAt: iso(100) }).status, "slowing");
  assert.equal(computeMaintenance({ archived: true, pushedAt: iso(1) }).status, "abandoned");
});

// --- v2 inputs (plans/PLAN_PHASE2.md P3): bus factor, backing, scorecard, appeals ---

test("bus factor: solo maintainer scores 0 with red flag; team scores full", () => {
  const solo = computeTrust({ ...healthyRepo, contributors: 1 });
  assert.equal(solo.signals.find((s) => s.key === "busFactor").points, 0);
  assert.ok(solo.redFlags.some((f) => f.toLowerCase().includes("one contributor")));

  const team = computeTrust({ ...healthyRepo, contributors: 28 });
  assert.equal(team.signals.find((s) => s.key === "busFactor").points, 15);
  assert.equal(team.redFlags.length, 0);
});

test("unknown contributors get neutral midpoint, not zero", () => {
  const t = computeTrust({ ...healthyRepo, contributors: null });
  assert.equal(t.signals.find((s) => s.key === "busFactor").points, 5);
  assert.equal(t.redFlags.length, 0);
});

test("foundation backing awards points from owner slug", () => {
  const kde = computeTrust({ ...healthyRepo, fullName: "kde/kdenlive" });
  assert.equal(kde.signals.find((s) => s.key === "backing").points, 5);
  const indie = computeTrust({ ...healthyRepo, fullName: "solo/dev-tool" });
  assert.equal(indie.signals.find((s) => s.key === "backing").points, 0);
});

test("OpenSSF Scorecard bands: strong/weak/unscored", () => {
  const strong = computeTrust({ ...healthyRepo, scorecard: 8.2 });
  assert.equal(strong.signals.find((s) => s.key === "scorecard").points, 5);
  const weak = computeTrust({ ...healthyRepo, scorecard: 2.1 });
  assert.equal(weak.signals.find((s) => s.key === "scorecard").points, 0);
  const unscored = computeTrust({ ...healthyRepo, scorecard: null });
  assert.equal(unscored.signals.find((s) => s.key === "scorecard").points, 0);
});

test("perfect repo never exceeds 100", () => {
  const perfect = computeTrust({
    ...healthyRepo,
    stars: 90000,
    openIssues: 10,
    pushedAt: iso(0),
    contributors: 500,
    fullName: "kde/thing",
    scorecard: 10,
  });
  assert.ok(perfect.score <= 100, `score overflow: ${perfect.score}`);
  assert.equal(perfect.band, "strong");
});

test("appeal deep-link is prefilled and points at the appeals repo (PRD section 13)", () => {
  const t = computeTrust({ ...healthyRepo, license: null, contributors: 1 });
  assert.ok(t.appeal.startsWith("https://github.com/opensource-hub/opensource-hub/issues/new?"));
  const url = new URL(t.appeal);
  assert.match(url.searchParams.get("title"), /\[Trust appeal\] acme\/healthy/);
  assert.match(url.searchParams.get("body"), /Trust score dispute/);
  assert.match(decodeURIComponent(url.searchParams.get("body")), /acme\/healthy/);
});

test("appealUrl helper encodes repo and reasons", () => {
  const url = appealUrl("a/b", { score: 42, band: "caution", reasons: ["no clear license"] });
  assert.ok(url.includes("a%2Fb") || decodeURIComponent(url).includes("a/b"));
  assert.ok(decodeURIComponent(url).includes("no clear license"));
});
