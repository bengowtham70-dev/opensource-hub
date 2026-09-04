import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createReviewStore } from "../src/server/reviews.js";

test("Review store: returns empty structure for unreviewed repo", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "osh-rev-test-"));
  try {
    const store = createReviewStore({ dir: tmpDir });
    const result = store.getReviews("toeverything/AFFiNE");
    assert.equal(result.total, 0);
    assert.equal(result.averageRating, 0);
    assert.deepEqual(result.reviews, []);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("Review store: adds and aggregates reviews with average rating & distribution", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "osh-rev-test-"));
  try {
    const store = createReviewStore({ dir: tmpDir });

    store.addReview("toeverything/AFFiNE", {
      rating: 5,
      author: "Alex",
      role: "Lead Architect",
      switchedFrom: "Notion",
      summary: "Incredible local-first speed",
      content: "Migrated 20 people seamlessly.",
      pros: ["Fast", "Privacy"],
      cons: ["Setup required"],
    });

    store.addReview("toeverything/AFFiNE", {
      rating: 4,
      author: "Sam",
      role: "Developer",
      switchedFrom: "Notion",
      summary: "Great alternative",
      content: "Very satisfied.",
    });

    const result = store.getReviews("toeverything/AFFiNE");
    assert.equal(result.total, 2);
    assert.equal(result.averageRating, 4.5);
    assert.equal(result.distribution[5], 1);
    assert.equal(result.distribution[4], 1);
    assert.equal(result.distribution[1], 0);

    assert.equal(result.reviews[0].author, "Sam");
    assert.equal(result.reviews[1].author, "Alex");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("Review store: sanitizes input and enforces rating boundaries (1 to 5)", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "osh-rev-test-"));
  try {
    const store = createReviewStore({ dir: tmpDir });

    store.addReview("usebruno/bruno", {
      rating: 10, // should clamp to 5
      author: "<script>alert(1)</script>Bob",
      summary: "Dangerous <b>tag</b>",
      content: "Safe content",
    });

    const result = store.getReviews("usebruno/bruno");
    assert.equal(result.total, 1);
    assert.equal(result.reviews[0].rating, 5);
    assert.ok(!result.reviews[0].author.includes("<script>"));
    assert.ok(result.reviews[0].author.includes("&lt;script&gt;"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("Review store: voteHelpful increments review helpful count", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "osh-rev-test-"));
  try {
    const store = createReviewStore({ dir: tmpDir });
    const added = store.addReview("usebruno/bruno", {
      rating: 5,
      author: "Alex",
      summary: "Excellent",
      content: "Very satisfied.",
    });
    const revId = added.reviews[0].id;
    const voteRes = store.voteHelpful("usebruno/bruno", revId);
    assert.equal(voteRes.success, true);
    assert.equal(voteRes.helpful, 1);

    const check = store.getReviews("usebruno/bruno");
    assert.equal(check.reviews[0].helpful, 1);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

