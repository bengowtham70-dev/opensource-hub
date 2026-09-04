import { test } from "node:test";
import assert from "node:assert/strict";
import { detectTyposquat } from "../src/server/typosquat.js";

test("detects transposed letters in lookalike repo names (supabse -> supabase)", () => {
  const result = detectTyposquat("fake-org/supabse", { stars: 12 });
  assert.ok(result.isSuspicious);
  assert.equal(result.canonicalTarget, "supabase/supabase");
  assert.match(result.reason, /Supabase/i);
});

test("detects character duplication lookalikes (excalidraww -> excalidraw)", () => {
  const result = detectTyposquat("unknown-dev/excalidraww", { stars: 5 });
  assert.ok(result.isSuspicious);
  assert.equal(result.canonicalTarget, "excalidraw/excalidraw");
  assert.ok(result.confidence >= 0.8);
});

test("detects deceptive prefix or suffix on non-official owner (official-penpot)", () => {
  const result = detectTyposquat("scammer/official-penpot", { stars: 3 });
  assert.ok(result.isSuspicious);
  assert.equal(result.canonicalTarget, "penpot/penpot");
  assert.match(result.reason, /deceptive prefix\/suffix/i);
});

test("does NOT flag the canonical official repository", () => {
  const result = detectTyposquat("supabase/supabase", { stars: 75000 });
  assert.equal(result.isSuspicious, false);
});

test("does NOT flag legitimate popular projects with distinct names", () => {
  const result = detectTyposquat("huggingface/smolagents", { stars: 29000 });
  assert.equal(result.isSuspicious, false);

  const result2 = detectTyposquat("usebruno/bruno", { stars: 31000 });
  assert.equal(result2.isSuspicious, false);
});

test("flags unverified low-star clone with exact name under random user (random-guy/supabase)", () => {
  const result = detectTyposquat("random-guy/supabase", { stars: 4 });
  assert.ok(result.isSuspicious);
  assert.equal(result.canonicalTarget, "supabase/supabase");
  assert.equal(result.severity, "critical");
});
