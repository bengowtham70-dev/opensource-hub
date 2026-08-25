import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.OSH_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "osh-audit-"));

const { createAuditStore, auditToCsv } = await import("../src/server/audit.js");

const SAMPLE = {
  repo: "usebruno/bruno",
  score: 87,
  band: "strong",
  signals: [
    { key: "recency", label: "Commit recency", points: 25, detail: "within a week" },
    { key: "busFactor", label: "Bus factor", points: 15, detail: "475+ contributors" },
  ],
};

test("audit save → get → list round-trips with latest-per-repo semantics", () => {
  const store = createAuditStore();
  store.save(SAMPLE);
  store.save({ ...SAMPLE, score: 90, repo: "penpot/penpot" });
  store.save({ ...SAMPLE, score: 89 }); // same repo → replaces older audit
  const list = store.list();
  assert.equal(list.length, 2);
  assert.equal(list[0].repo, "usebruno/bruno");
  assert.equal(list[0].score, 89); // most recent first
  assert.equal(store.get("penpot/penpot").score, 90);
  assert.equal(store.get("nope/nope"), null);
});

test("invalid repo rejected", () => {
  const store = createAuditStore();
  assert.throws(() => store.save({ repo: "../evil", score: 1 }), /invalid repo/);
});

test("remove works (scoped to the removed repo)", () => {
  const store = createAuditStore();
  store.save(SAMPLE);
  store.save({ ...SAMPLE, repo: "penpot/penpot" });
  store.remove("usebruno/bruno");
  assert.equal(store.get("usebruno/bruno"), null); // removed
  assert.equal(store.get("penpot/penpot").score, SAMPLE.score); // untouched
});

test("CSV export: header rows, quoted values, CRLF", () => {
  const csv = auditToCsv(SAMPLE);
  const lines = csv.split("\r\n");
  assert.equal(lines[0], '"field","value"');
  assert.ok(csv.includes('"repository","usebruno/bruno"'));
  assert.ok(csv.includes('"signal","points","detail"'));
  assert.ok(csv.includes('"Commit recency","25","within a week"'));
  assert.ok(csv.endsWith('"Bus factor","15","475+ contributors"'));
});

test("CSV escapes embedded quotes", () => {
  const csv = auditToCsv({ ...SAMPLE, signals: [{ key: "x", label: 'say "hi"', points: 1, detail: 'a "b" c' }] });
  assert.ok(csv.includes('"say ""hi"""'));
});

test("CSV formula-injection guard neutralizes = + - @ prefixed cells (OWASP)", () => {
  const csv = auditToCsv({
    ...SAMPLE,
    signals: [{ key: "x", label: "=cmd()", points: 1, detail: "@SUM(1)" }],
  });
  assert.ok(!csv.includes('"=cmd()"'), "raw formula must be prefixed");
  assert.ok(csv.includes('"\'=cmd()"'));
  assert.ok(csv.includes('"\'@SUM(1)"'));
});
