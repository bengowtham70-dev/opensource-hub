import test from "node:test";
import assert from "node:assert/strict";
import { getCompanions, hasCompanions } from "../src/server/companions.js";

test("getCompanions finds Umami and Bruno for supabase/supabase", () => {
  assert.equal(hasCompanions("supabase/supabase"), true);
  const comps = getCompanions("supabase/supabase");
  assert.equal(comps.length, 2);
  assert.ok(comps.some((c) => c.name === "Umami"));
  assert.ok(comps.some((c) => c.name === "Bruno"));
});

test("getCompanions finds Bruno and Vaultwarden for pocketbase/pocketbase", () => {
  assert.equal(hasCompanions("pocketbase/pocketbase"), true);
  const comps = getCompanions("pocketbase/pocketbase");
  assert.equal(comps.length, 2);
  assert.ok(comps.some((c) => c.name === "Vaultwarden"));
});

test("hasCompanions returns false for non-configured repo", () => {
  assert.equal(hasCompanions("nonexistent/repo"), false);
  assert.deepEqual(getCompanions("nonexistent/repo"), []);
});
