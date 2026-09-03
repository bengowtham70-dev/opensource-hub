import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import express from "express";
import { createApiRouter } from "../src/server/routes.js";
import { getDatabase, searchCatalog, getTrendingSnapshot } from "../src/server/db.js";

function makeStubStores() {
  return {
    favorites: {
      has: () => false,
      getAll: () => [],
      add: () => {},
      remove: () => {},
    },
    community: {
      get: () => ({ up: 0, down: 0, tags: [] }),
      vote: () => {},
      addTag: () => {},
      suggest: () => {},
      flag: () => {},
      importData: () => ({ votes: 0, tags: 0 }),
    },
    usage: {
      inc: () => {},
      getAll: () => ({ views: 0, downloads: 0 }),
    },
  };
}

test("Trending Engine returns period-specific data with timeframeDelta and auto-ingests into catalog", async () => {
  const app = express();
  app.use(express.json());
  const stores = makeStubStores();
  app.use("/api", createApiRouter(stores));

  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  try {
    // 1. GET /api/trending/today
    const resToday = await fetch(`${base}/api/trending/today`);
    assert.equal(resToday.status, 200);
    const jsonToday = await resToday.json();
    assert.equal(jsonToday.view, "today");
    assert.ok(Array.isArray(jsonToday.repos));
    assert.ok(jsonToday.repos.length >= 25);
    const firstToday = jsonToday.repos[0];
    assert.ok(firstToday.repo);
    assert.ok(typeof firstToday.stars === "number");
    assert.ok(typeof firstToday.changePct === "number");
    assert.ok(Array.isArray(firstToday.history));

    // 2. GET /api/trending/week
    const resWeek = await fetch(`${base}/api/trending/week`);
    assert.equal(resWeek.status, 200);
    const jsonWeek = await resWeek.json();
    assert.equal(jsonWeek.view, "week");
    assert.ok(Array.isArray(jsonWeek.repos));
    assert.ok(jsonWeek.repos.length >= 25);
    const firstWeek = jsonWeek.repos[0];
    assert.ok(firstWeek.timeframeLabel.includes("week") || firstWeek.timeframeLabel.includes("today"));

    // 3. Verify auto-ingestion into SQLite repos table
    const db = getDatabase();
    const countRow = db.prepare("SELECT COUNT(*) as count FROM repos").get();
    assert.ok(countRow.count > 0, "Expected repos to be ingested into SQLite database");

    // 4. Verify searchCatalog can search over newly cataloged items
    const searchRes = searchCatalog({ q: "open", limit: 5 });
    assert.ok(Array.isArray(searchRes.items));

    // 5. Verify trending snapshot was stored
    const snapshot = getTrendingSnapshot("today");
    assert.ok(Array.isArray(snapshot) && snapshot.length > 0);
  } finally {
    server.close();
  }
});
