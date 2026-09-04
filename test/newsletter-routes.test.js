import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createApp } from "../src/server/app.js";

function withServer(fn) {
  return new Promise((resolve, reject) => {
    const { app } = createApp();
    const s = createServer(app);
    s.listen(0, "127.0.0.1", async () => {
      const port = s.address().port;
      const base = `http://127.0.0.1:${port}`;
      try {
        await fn(base);
        s.close(resolve);
      } catch (err) {
        s.close(() => reject(err));
      }
    });
  });
}

test("POST /api/newsletter/subscribe accepts valid emails and rejects invalid ones", () =>
  withServer(async (base) => {
    const uniqueEmail = `test-user-${Date.now()}@example.com`;

    // 1. Valid subscription
    const res1 = await fetch(`${base}/api/newsletter/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: uniqueEmail, source: "test" }),
    });
    assert.equal(res1.status, 200);
    const body1 = await res1.json();
    assert.equal(body1.ok, true);
    assert.ok(body1.message.includes("Subscribed successfully"));

    // 2. Duplicate subscription
    const res2 = await fetch(`${base}/api/newsletter/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: uniqueEmail }),
    });
    assert.equal(res2.status, 200);
    const body2 = await res2.json();
    assert.equal(body2.ok, true);
    assert.ok(body2.message.includes("already subscribed"));

    // 3. Invalid email rejection
    const res3 = await fetch(`${base}/api/newsletter/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    assert.equal(res3.status, 400);
    const body3 = await res3.json();
    assert.ok(body3.error);
  }));

test("GET /api/newsletter/issues and /issues/:id serve weekly digest editions", () =>
  withServer(async (base) => {
    const listRes = await fetch(`${base}/api/newsletter/issues`);
    assert.equal(listRes.status, 200);
    const listBody = await listRes.json();
    assert.equal(listBody.ok, true);
    assert.ok(Array.isArray(listBody.issues));
    assert.ok(listBody.issues.length >= 1, "At least one issue returned");

    const first = listBody.issues[0];
    assert.ok(first.id);
    assert.ok(first.title);

    // Detail fetch
    const detailRes = await fetch(`${base}/api/newsletter/issues/${first.id}`);
    assert.equal(detailRes.status, 200);
    const detailBody = await detailRes.json();
    assert.equal(detailBody.ok, true);
    assert.equal(detailBody.issue.id, first.id);
    assert.ok(detailBody.issue.markdown.includes("OpenSource Hub Weekly Digest"));

    // 404 for unknown issue
    const notFoundRes = await fetch(`${base}/api/newsletter/issues/nonexistent-week-999`);
    assert.equal(notFoundRes.status, 404);
  }));
