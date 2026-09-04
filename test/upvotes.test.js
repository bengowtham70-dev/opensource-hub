import test from "node:test";
import assert from "node:assert/strict";
import { getUpvotes, addUpvote } from "../src/server/db.js";

test("Upvotes: retrieves initial upvote counts", () => {
  const map = getUpvotes();
  assert.ok(typeof map === "object");
  assert.ok(typeof map["supabase/supabase"] === "number");
  assert.ok(map["supabase/supabase"] >= 140);
});

test("Upvotes: addUpvote increments count for repo", () => {
  const testRepo = "test-owner/test-upvote-repo";
  const initial = getUpvotes()[testRepo] || 0;

  const res1 = addUpvote(testRepo);
  assert.equal(res1.repo, testRepo);
  assert.equal(res1.count, initial + 1);

  const res2 = addUpvote(testRepo);
  assert.equal(res2.count, initial + 2);

  const finalMap = getUpvotes();
  assert.equal(finalMap[testRepo], initial + 2);
});
