import { test } from "node:test";
import assert from "node:assert/strict";
import { getBenchmarksData, getRepoBenchmark } from "../src/server/benchmarks.js";

test("getBenchmarksData returns verified benchmark metrics", () => {
  const data = getBenchmarksData();
  assert.ok(data["supabase/supabase"], "Supabase benchmark exists");
  assert.ok(data["pocketbase/pocketbase"], "PocketBase benchmark exists");
  assert.ok(data["usebruno/bruno"], "Bruno benchmark exists");

  const supabase = data["supabase/supabase"];
  assert.equal(supabase.idleRamMb, 1536);
  assert.equal(supabase.architecture, "Microservices Network");
  assert.ok(Array.isArray(supabase.protocols));

  const pb = data["pocketbase/pocketbase"];
  assert.equal(pb.idleRamMb, 25);
  assert.equal(pb.architecture, "Single Static Binary");
  assert.equal(pb.databaseEngine.includes("SQLite"), true);
});

test("getRepoBenchmark resolves by full repo or short name", () => {
  const full = getRepoBenchmark("supabase/supabase");
  assert.ok(full);
  assert.equal(full.isVerifiedSpec, true);

  const short = getRepoBenchmark("pocketbase");
  assert.ok(short);
  assert.equal(short.idleRamMb, 25);

  const nonExistent = getRepoBenchmark("nonexistent/tool");
  assert.equal(nonExistent, null);
});
