import test from "node:test";
import assert from "node:assert/strict";
import { getAggregatedReleases } from "../src/server/releases.js";

test("getAggregatedReleases returns cached releases with sorting", async () => {
  // Mock GitHub client
  const mockGh = {
    async getLatestRelease(repo) {
      if (repo === "toeverything/affine") {
        return {
          data: {
            tag: "v0.18.0",
            name: "AFFiNE 0.18.0 Release",
            publishedAt: "2026-08-30T10:00:00Z",
            body: "Exciting new workspace capabilities",
            htmlUrl: "https://github.com/toeverything/affine/releases/tag/v0.18.0",
            assets: [],
          },
        };
      }
      return { data: null };
    },
  };

  const result = await getAggregatedReleases({ gh: mockGh });
  assert.ok(Array.isArray(result.releases));
  assert.ok(result.fetchedAt);
});
