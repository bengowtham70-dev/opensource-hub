import test from "node:test";
import assert from "node:assert/strict";
import { getSuccessor, hasSuccessor } from "../src/server/successors.js";

test("getSuccessor finds Valkey for redis/redis", () => {
  assert.equal(hasSuccessor("redis/redis"), true);
  const s = getSuccessor("redis/redis");
  assert.equal(s.successorName, "Valkey");
  assert.equal(s.successorRepo, "valkey-io/valkey");
  assert.ok(s.reason.includes("SSPL"));
});

test("getSuccessor finds OpenTofu for hashicorp/terraform", () => {
  assert.equal(hasSuccessor("hashicorp/terraform"), true);
  const s = getSuccessor("hashicorp/terraform");
  assert.equal(s.successorName, "OpenTofu");
  assert.equal(s.successorRepo, "opentofu/opentofu");
});

test("hasSuccessor returns false for standard non-stale repos", () => {
  assert.equal(hasSuccessor("supabase/supabase"), false);
  assert.equal(getSuccessor("supabase/supabase"), null);
});
