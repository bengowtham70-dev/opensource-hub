import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createClaimStore } from "../src/server/claim.js";

test("claim store generates snippet and verifies repository status", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "osh-claim-test-"));
  const store = createClaimStore({ dir: tmpDir });

  const snippet = store.generateSnippet("penpot/penpot", "penpot-team");
  assert.ok(snippet.includes("penpot/penpot"));
  assert.ok(snippet.includes("maintainer-v1.json"));

  assert.equal(store.isVerified("penpot/penpot"), false);

  const res = await store.verify("penpot/penpot");
  assert.equal(res.verified, false); // No GitHub mock or live file yet

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
