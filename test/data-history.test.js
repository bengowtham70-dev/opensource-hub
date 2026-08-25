import { test } from "node:test";
import assert from "node:assert/strict";

const { getStars30d, computeTrending } = await import("../src/server/data.js");

const NOW = Date.now();
const day = (n) => new Date(NOW - n * 86400000).toISOString().slice(0, 10);

function snap(historyFor) {
  return {
    stars: { "o/r": 1500 },
    history: historyFor ? { "o/r": historyFor } : undefined,
  };
}

// PRD section 28.2 / audit fix M2: REAL cron-collected history must win over
// the seeded pseudo-random demo curve once enough samples exist.
test("getStars30d prefers genuine snapshot history over seed synthesis", () => {
  const real = Array.from({ length: 12 }, (_, i) => ({
    date: day(11 - i),
    stars: 1000 + i * 10,
  }));
  const s = getStars30d(snap(real), "o/r");
  assert.equal(s.stars, 1110);
  assert.equal(s.change, 110);
  assert.equal(s.changePct, 11);
  // The returned curve is the collected data, not synthesized noise.
  assert.deepEqual(s.history.map((p) => p.stars), real.map((p) => p.stars));
});

test("short histories (<8 samples) still fall back to synthesis for livelier UI", () => {
  const short = [
    { date: day(1), stars: 1000 },
    { date: day(0), stars: 1010 },
  ];
  const s = getStars30d(snap(short), "o/r");
  assert.equal(s.history.length, 30);
});

test("trending math tolerates non-30-length histories (no NaN ranks)", async () => {
  const data = {
    stars: { "a/a": 2000, "b/b": 3000 },
    history: {
      "a/a": Array.from({ length: 9 }, (_, i) => ({ date: day(8 - i), stars: 1900 + i })),
      "b/b": [{ date: day(3), stars: 2950 }, { date: day(0), stars: 3000 }],
    },
    generatedAt: new Date(NOW).toISOString(),
    origin: "test",
  };
  const out = await computeTrending("today");
  void data;
  for (const r of out.repos) {
    assert.ok(Number.isFinite(r.changePct), `non-finite changePct for ${r.repo}`);
    assert.ok(Number.isFinite(r.change), `non-finite change for ${r.repo}`);
  }
});
