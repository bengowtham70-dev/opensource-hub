// Parity P5 (plans/PLAN_PARITY.md) — auto-derived collections from snapshot meta.
// Honest-empty until the snapshot cron populates meta; never fabricated, never
// live-API-derived (quota discipline).
import assert from "node:assert/strict";
import { test } from "node:test";
import { deriveCollections } from "../src/server/collections.js";

const NOW = Date.parse("2026-08-24T12:00:00Z");
const DAY = 86400000;
const iso = (daysAgo) => new Date(NOW - daysAgo * DAY).toISOString();

const PAIRINGS = [
  { alternative: { repo: "acme/dead" } },
  { alternative: { repo: "acme/archived" } },
  { alternative: { repo: "acme/young" } },
  { alternative: { repo: "acme/healthy" } },
  { alternative: { repo: "acme/unknown" } },
];

test("archived or abandoned repos land in graveyard with honest labels", () => {
  const meta = {
    "acme/archived": { archived: true, pushedAt: iso(3) },
    "acme/dead": { archived: false, pushedAt: iso(300) },
    "acme/healthy": { archived: false, pushedAt: iso(2) },
  };
  const { graveyard } = deriveCollections(PAIRINGS, meta, { now: NOW });
  const slugs = graveyard.map((g) => g.repo);
  assert.ok(slugs.includes("acme/archived"), "archived missing from graveyard");
  assert.ok(slugs.includes("acme/dead"), "abandoned missing from graveyard");
  assert.ok(!slugs.includes("acme/healthy"), "healthy repo wrongly graveyarded");
  const archived = graveyard.find((g) => g.repo === "acme/archived");
  assert.equal(archived.reason, "archived by maintainers");
});

test("repos younger than 18 months land in coming-soon", () => {
  const meta = {
    "acme/young": { archived: false, pushedAt: iso(5), createdAt: iso(300) },
    "acme/healthy": { archived: false, pushedAt: iso(2), createdAt: iso(1500) },
  };
  const { comingSoon } = deriveCollections(PAIRINGS, meta, { now: NOW });
  const slugs = comingSoon.map((g) => g.repo);
  assert.ok(slugs.includes("acme/young"), "young repo missing from coming-soon");
  assert.ok(!slugs.includes("acme/healthy"), "mature repo wrongly in coming-soon");
});

test("a repo can be young AND dead — graveyard wins, never both", () => {
  const meta = {
    "acme/dead": { archived: false, pushedAt: iso(300), createdAt: iso(300) },
  };
  const { graveyard, comingSoon } = deriveCollections(PAIRINGS, meta, { now: NOW });
  assert.equal(graveyard.some((g) => g.repo === "acme/dead"), true);
  assert.equal(comingSoon.some((g) => g.repo === "acme/dead"), false, "dead repo also in coming-soon");
});

test("no meta at all → both collections honest-empty", () => {
  const { graveyard, comingSoon } = deriveCollections(PAIRINGS, {}, { now: NOW });
  assert.equal(graveyard.length, 0);
  assert.equal(comingSoon.length, 0);
});

test("repos without meta are never fabricated into a collection", () => {
  const meta = { "acme/healthy": { archived: false, pushedAt: iso(2) } };
  const { graveyard, comingSoon } = deriveCollections(PAIRINGS, meta, { now: NOW });
  assert.equal(graveyard.length, 0);
  assert.equal(comingSoon.length, 0);
});
