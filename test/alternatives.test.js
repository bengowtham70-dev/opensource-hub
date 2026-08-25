import { test } from "node:test";
import assert from "node:assert/strict";
import { getPairings, getCatalog, searchPairings } from "../src/server/data.js";

test("seed contains 20-30 pairings per PRD section 19 Phase 1", () => {
  const pairings = getPairings();
  assert.ok(pairings.length >= 20 && pairings.length <= 30, `got ${pairings.length}`);
});

test("every pairing has the full required schema", () => {
  for (const p of getPairings()) {
    assert.ok(p.paidTool?.name, "paidTool.name missing");
    assert.ok(p.paidTool.slug, "paidTool.slug missing");
    assert.ok(p.paidTool.category, "paidTool.category missing");
    assert.ok(Number.isFinite(p.paidTool.pricePerYearUsd) && p.paidTool.pricePerYearUsd > 0);
    const a = p.alternative;
    assert.match(a.repo, /^[\w.-]+\/[\w.-]+$/, `bad repo slug ${a.repo}`);
    assert.ok(a.description.length > 20, `${a.name}: description too thin`);
    assert.ok(Array.isArray(a.tags) && a.tags.length >= 2, `${a.name}: needs tags`);
    assert.ok(Array.isArray(a.parity) && a.parity.length >= 2, `${a.name}: parity checklist required`);
    assert.ok(Array.isArray(a.gaps), `${a.name}: gaps array required (honesty rule, PRD section 4)`);
    assert.ok(typeof a.migrationNotes === "string" && a.migrationNotes.length > 10);
  }
});

test("no duplicate repos or paid tools in seed", () => {
  const repos = new Set(getPairings().map((p) => p.alternative.repo.toLowerCase()));
  const paid = new Set(getPairings().map((p) => p.paidTool.slug));
  assert.equal(repos.size, getPairings().length, "duplicate repo found");
  assert.equal(paid.size, getPairings().length, "duplicate paid tool found");
});

test("catalog dedupes to unique repos", () => {
  const catalog = getCatalog();
  const unique = new Set(catalog.map((c) => c.repo));
  assert.equal(catalog.length, unique.size);
});

test("search matches by paid tool name and keyword", () => {
  assert.equal(searchPairings({ q: "notion" })[0].alternative.name, "AFFiNE");
  assert.ok(searchPairings({ q: "passwords" }).length >= 2);
  assert.equal(searchPairings({ q: "zzz-no-match" }).length, 0);
});

test("language filter narrows results and composes with query", () => {
  const rustOnly = searchPairings({ language: "Go" });
  assert.ok(rustOnly.length > 0);
  for (const p of rustOnly) assert.equal(p.alternative.language, "Go");
});
