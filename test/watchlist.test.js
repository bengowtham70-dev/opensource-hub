import { test } from "node:test";
import assert from "node:assert/strict";
import { computeAlerts, WATCHLIST_CAP } from "../src/server/watchlist.js";

test("alerts fire on trust drops >= threshold with from/to", () => {
  const trust = new Map([
    ["a/good", 85],
    ["b/fine", 70],
  ]);
  const alerts = computeAlerts(
    [
      { repo: "a/good", lastScore: 95 },
      { repo: "b/fine", lastScore: 68 },
    ],
    trust
  );
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].repo, "a/good");
  assert.equal(alerts[0].type, "trust-drop");
  assert.equal(alerts[0].from, 95);
  assert.equal(alerts[0].to, 85);
});

test("improvements and small dips never alert; unknown scores skipped", () => {
  const trust = new Map([
    ["a/up", 90],
    ["b/flat", 60],
    ["c/gone", null],
  ]);
  const alerts = computeAlerts(
    [
      { repo: "a/up", lastScore: 70 },
      { repo: "b/flat", lastScore: 65 },
      { repo: "c/gone", lastScore: 80 },
      { repo: "d/unknown", lastScore: 80 },
    ],
    trust
  );
  assert.equal(alerts.length, 0);
});

test("custom threshold respected", () => {
  const trust = new Map([["a/x", 74]]);
  assert.equal(computeAlerts([{ repo: "a/x", lastScore: 80 }], trust, { dropThreshold: 5 }).length, 1);
  assert.equal(computeAlerts([{ repo: "a/x", lastScore: 80 }], trust, { dropThreshold: 10 }).length, 0);
});

test("cap constant is sane", () => {
  assert.ok(WATCHLIST_CAP >= 5 && WATCHLIST_CAP <= 25);
});
