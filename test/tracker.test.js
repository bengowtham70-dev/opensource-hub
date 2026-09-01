import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createClickTracker } from "../src/server/tracker.js";

test("click tracker records and reports analytics", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "osh-tracker-test-"));
  const tracker = createClickTracker({ dir: tmpDir });

  tracker.track({ target: "railway", repo: "penpot/penpot", type: "deploy" });
  tracker.track({ target: "railway", repo: "penpot/penpot", type: "deploy" });
  tracker.track({ target: "digitalocean", repo: "nocodb/nocodb", type: "deploy" });

  const stats = tracker.getAnalytics();
  assert.equal(stats.total, 3);
  assert.equal(stats.byType.deploy, 3);
  assert.equal(stats.byTarget.railway, 2);
  assert.equal(stats.byTarget.digitalocean, 1);
  assert.equal(stats.byRepo["penpot/penpot"], 2);

  // Test affiliate query injection
  const rawUrl = "https://railway.app/template/penpot";
  const affUrl = tracker.buildAffiliateUrl(rawUrl, "railway");
  assert.ok(affUrl.includes("referralCode=opensourcehub"));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
