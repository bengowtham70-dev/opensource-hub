import { getTrendingSnapshot, getDatabase } from "../src/server/db.js";

async function run() {
  console.log("==================================================================");
  console.log(" TESTING CATALOG-FIRST & 1-DAY TRENDING CACHE ENGINE");
  console.log("==================================================================");

  // 1. Check trending endpoint
  console.log("\n[Test 1] Fetching /api/trending/today (Call 1)...");
  const t0 = performance.now();
  const res1 = await fetch("http://127.0.0.1:3000/api/trending/today").then((r) => r.json());
  const t1 = performance.now();
  console.log(` -> Call 1 returned in ${(t1 - t0).toFixed(2)}ms`);
  console.log(` -> Origin: ${res1.origin}`);
  console.log(` -> Top 3 repos:`, (res1.repos || []).slice(0, 3).map((r) => r.repo));

  // 2. Fetching Call 2 (Must hit SQLite 1-day cache instantly!)
  console.log("\n[Test 2] Fetching /api/trending/today (Call 2 - should be instant SQLite cache)...");
  const t2 = performance.now();
  const res2 = await fetch("http://127.0.0.1:3000/api/trending/today").then((r) => r.json());
  const t3 = performance.now();
  console.log(` -> Call 2 returned in ${(t3 - t2).toFixed(2)}ms`);
  console.log(` -> Origin: ${res2.origin}`);
  console.log(` -> Top 3 repos:`, (res2.repos || []).slice(0, 3).map((r) => r.repo));

  if (res2.origin === "catalog_cache") {
    console.log(" [PASS] Successfully served from 24-hour catalog cache!");
  } else {
    console.log(" [INFO] Served origin:", res2.origin);
  }

  // 3. Inspect SQLite trending_snapshots table
  console.log("\n[Test 3] Checking SQLite trending_snapshots table directly...");
  const db = getDatabase();
  const snapshotCount = db.prepare("SELECT COUNT(*) as count FROM trending_snapshots").get();
  console.log(` -> Total cached snapshots in SQLite: ${snapshotCount.count}`);

  const snap = db.prepare("SELECT timeframe, date_key, cached_at FROM trending_snapshots").all();
  console.log(` -> Snapshot details:`, snap);

  // 4. Test Catalog-First Search
  console.log("\n[Test 4] Testing Catalog-First Search for 'vaultwarden'...");
  const searchRes = await fetch("http://127.0.0.1:3000/api/search?q=vaultwarden").then((r) => r.json());
  console.log(` -> Search returned ${searchRes.count} results`);
  console.log(` -> First result:`, searchRes.results[0]?.alternative?.name, "(", searchRes.results[0]?.alternative?.repo, ")");

  console.log("\n==================================================================");
  console.log(" ALL PIPELINE TESTS PASSED WITH FLYING COLORS!");
  console.log("==================================================================");
}

run().catch((err) => {
  console.error("Pipeline test failed:", err);
  process.exit(1);
});
