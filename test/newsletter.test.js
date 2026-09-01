import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createNewsletterStore } from "../src/server/newsletter.js";

test("newsletter store validates, stores, deduplicates and exports subscribers to CSV", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "osh-news-test-"));
  const store = createNewsletterStore({ dir: tmpDir });

  // Invalid email throws
  assert.throws(() => store.subscribe("invalid-email"), /valid email/);

  // Valid subscriber
  const res1 = store.subscribe("dev@example.com", "hero");
  assert.equal(res1.ok, true);
  assert.equal(store.list().length, 1);

  // Duplicate email handled gracefully
  const res2 = store.subscribe("DEV@EXAMPLE.COM", "footer");
  assert.equal(res2.ok, true);
  assert.equal(store.list().length, 1);

  // CSV export
  const csv = store.toCsv();
  assert.ok(csv.startsWith("Email,SubscribedAt,Source"));
  assert.ok(csv.includes("dev@example.com"));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
