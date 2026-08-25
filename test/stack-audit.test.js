import { test } from "node:test";
import assert from "node:assert/strict";
import { matchTool, auditStack, stackAuditToCsv } from "../src/server/stack-audit.js";
import { getPairings } from "../src/server/data.js";

const pairings = getPairings();

test("matchTool: exact slug, exact name, containment, word overlap", () => {
  assert.equal(matchTool("notion", pairings).confidence, "exact");
  assert.equal(matchTool("Notion", pairings).confidence, "exact");
  assert.equal(matchTool("my notion subscription", pairings).confidence, "likely");
  assert.ok(matchTool("microsft 365", pairings)?.pairing.paidTool.name.includes("Microsoft")); // word overlap
  assert.equal(matchTool("zzzz-nothing", pairings), null);
  assert.equal(matchTool("", pairings), null);
});

test("auditStack: matches, dedupes, and reports unmatched honestly", () => {
  const r = auditStack("Notion\nfigma\nNotion again\nSomeRandomCRM\npostman", pairings);
  assert.equal(r.matched.length, 3); // duplicate Notion deduped
  assert.deepEqual(r.unmatched, ["SomeRandomCRM"]);
  assert.ok(r.totals.savingsPerYearUsd > 100);
  assert.equal(r.totals.tools, 3);
  assert.match(r.totals.disclaimer, /Estimates/);
});

test("auditStack handles comma/semicolon separated input", () => {
  const r = auditStack("notion, figma; joplin-replacer?? no — slack", pairings);
  const names = r.matched.map((m) => m.paidTool.name);
  assert.ok(names.includes("Notion") && names.includes("Figma") && names.includes("Slack"));
});

test("CSV: header, rows, totals, formula-injection guard, CRLF", () => {
  const report = auditStack("Notion\n=cmd()\nSlack", pairings);
  const csv = stackAuditToCsv(report);
  const lines = csv.split("\r\n");
  assert.equal(lines[0], '"paid_tool","plan","paid_per_year_usd","free_alternative","repo","license","match"');
  assert.ok(csv.includes('"total_savings_per_year_usd"'));
  assert.ok(!csv.includes('"=cmd()"')); // unmatched line never becomes a cell anyway; guard covers future fields
  assert.ok(csv.includes('"disclaimer"'));
});
