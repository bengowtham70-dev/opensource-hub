import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

process.env.OSH_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "osh-goals-"));

const { searchPairings } = await import("../src/server/data.js");
const { createApp } = await import("../src/server/app.js");

async function startServer() {
  const { app } = createApp();
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      resolve({ server, base: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

// PRD §38 goal-first browsing (plans/PLAN_PHASE2.md Phase 7).
test("searchPairings goal facet matches goalTags exactly", () => {
  const notion = searchPairings({ goal: "replace-notion" });
  assert.equal(notion.length, 1);
  assert.equal(notion[0].alternative.name, "AFFiNE");
});

test("searchPairings unknown goal matches nothing (facet semantics)", () => {
  assert.equal(searchPairings({ goal: "replace-irc-client" }).length, 0);
});

test("searchPairings goal AND-combines with q and platform", () => {
  const both = searchPairings({ goal: "replace-password-manager", q: "bitwarden" });
  assert.equal(both.length, 1);
  assert.equal(both[0].alternative.name, "Bitwarden");
  const narrowed = searchPairings({ goal: "replace-password-manager", q: "notion" });
  assert.equal(narrowed.length, 0);
});

test("GET /api/goals returns counted, labeled goals sorted by popularity", async () => {
  const { server, base } = await startServer();
  const json = await (await fetch(`${base}/api/goals`)).json();
  assert.ok(Array.isArray(json.goals) && json.goals.length >= 20);
  let prevCount = Infinity;
  for (const g of json.goals) {
    assert.ok(g.count >= 1);
    assert.match(g.tag, /^replace-/);
    assert.ok(g.label.length > 0 && !g.label.includes("-"), `bad label: ${g.tag} → ${g.label}`);
    assert.ok(g.count <= prevCount, "not sorted by count desc");
    prevCount = g.count;
  }
  // Label derivation strips the prefix and title-cases each word.
  const office = json.goals.find((g) => g.tag === "replace-microsoft-office");
  assert.equal(office.label, "Microsoft Office");
  server.close();
});

test("GET /api/search?goal= serves the pre-filtered entry-grid view end-to-end", async () => {
  const { server, base } = await startServer();
  const hit = await (await fetch(`${base}/api/search?goal=replace-postman`)).json();
  assert.equal(hit.count, 1);
  assert.equal(hit.results[0].alternative.name, "Bruno");
  // Enriched card payload intact through the goal path (relationship pill data).
  assert.ok(["direct", "partial", "fork"].includes(hit.results[0].relationship));
  const none = await (await fetch(`${base}/api/search?goal=replace-nothing-real`)).json();
  assert.equal(none.count, 0);
  server.close();
});