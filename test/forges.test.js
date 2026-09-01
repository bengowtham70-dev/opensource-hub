import test from "node:test";
import assert from "node:assert/strict";
import { createForgeClient } from "../src/server/forges.js";

test("forge client exposes gitlab and codeberg fetch methods", () => {
  const forges = createForgeClient();
  assert.equal(typeof forges.getGitLabRepo, "function");
  assert.equal(typeof forges.getCodebergRepo, "function");
});
