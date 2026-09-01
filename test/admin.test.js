import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createAdminStore } from "../src/server/admin.js";

test("Admin store: lists pending and processed submissions", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "osh-admin-test-"));
  try {
    const store = createAdminStore({ dir: tmpDir });
    const queue = store.getQueue();
    assert.ok(queue.totalPending >= 2);
    assert.equal(queue.totalProcessed, 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("Admin store: approves and moves item from pending to processed", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "osh-admin-test-"));
  try {
    const store = createAdminStore({ dir: tmpDir });
    const initial = store.getQueue();
    const itemToApprove = initial.pending[0];

    const result = store.approve(itemToApprove.id);
    assert.equal(result.ok, true);
    assert.equal(result.approved.status, "approved");

    const after = store.getQueue();
    assert.equal(after.totalPending, initial.totalPending - 1);
    assert.equal(after.totalProcessed, 1);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("Admin store: rejects item with custom reason", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "osh-admin-test-"));
  try {
    const store = createAdminStore({ dir: tmpDir });
    const initial = store.getQueue();
    const itemToReject = initial.pending[0];

    const result = store.reject(itemToReject.id, "Proprietary license detected");
    assert.equal(result.ok, true);
    assert.equal(result.rejected.status, "rejected");
    assert.equal(result.rejected.reason, "Proprietary license detected");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
