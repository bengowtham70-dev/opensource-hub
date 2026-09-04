import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createClaimStore } from "../src/server/claim.js";
import { createApp } from "../src/server/app.js";

test("claim store supports rich maintainer profiles and simulated verification", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "osh-claim-test-"));
  try {
    const store = createClaimStore({ dir: tempDir });
    
    // Initial state
    assert.equal(store.isVerified("usebruno/bruno"), false);
    assert.equal(store.getClaim("usebruno/bruno"), null);

    // Generate snippet
    const snippet = store.generateSnippet("usebruno/bruno", {
      name: "Anoop M D",
      role: "Founder & Lead",
      tagline: "Offline-first API client",
    });
    const parsed = JSON.parse(snippet);
    assert.equal(parsed.repo, "usebruno/bruno");
    assert.equal(parsed.maintainer.name, "Anoop M D");

    // Simulated verification
    const res = await store.verify("usebruno/bruno", {
      simulate: true,
      maintainer: {
        name: "Anoop M D",
        role: "Founder & Lead",
        tagline: "Offline-first API client",
        recommendedStack: "Desktop Native",
        supportUrl: "https://github.com/usebruno/bruno/discussions",
      },
    });

    assert.equal(res.verified, true);
    assert.equal(store.isVerified("usebruno/bruno"), true);
    const claim = store.getClaim("usebruno/bruno");
    assert.equal(claim.maintainer.name, "Anoop M D");
    assert.equal(claim.maintainer.role, "Founder & Lead");

    // Unclaim
    const unclaimOk = store.unclaim("usebruno/bruno");
    assert.equal(unclaimOk, true);
    assert.equal(store.isVerified("usebruno/bruno"), false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test("repo endpoint returns maintainer claim status and details", async () => {
  const { app } = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://localhost:${port}`;

  try {
    // 1. Initial repo check
    const initial = await (await fetch(`${base}/api/repo/usebruno/bruno`)).json();
    assert.equal(typeof initial.isClaimed, "boolean");

    // 2. Verify with maintainer payload
    const claimRes = await (
      await fetch(`${base}/api/claim/usebruno/bruno/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simulate: true,
          maintainer: {
            name: "Anoop M D",
            role: "Creator",
            tagline: "Offline-first API client with git sync",
            recommendedStack: "Desktop App",
            supportUrl: "https://github.com/usebruno/bruno/discussions",
          },
        }),
      })
    ).json();
    assert.equal(claimRes.verified, true);

    // 3. Fetch repo details again and verify claim attributes
    const after = await (await fetch(`${base}/api/repo/usebruno/bruno`)).json();
    assert.equal(after.isClaimed, true);
    assert.equal(after.claim.maintainer.name, "Anoop M D");

    // 4. Reset claim
    const unclaimRes = await (
      await fetch(`${base}/api/claim/usebruno/bruno/unclaim`, { method: "POST" })
    ).json();
    assert.equal(unclaimRes.unclaimed, true);

    const reset = await (await fetch(`${base}/api/repo/usebruno/bruno`)).json();
    assert.equal(reset.isClaimed, false);
  } finally {
    server.close();
  }
});
