// F5 (plans/PLAN_FEATURES.md) — adds optional tco.hostingMonthlyEstimateUsd to
// self-hostable listings. Idempotent: existing values are never overwritten.
// Estimates anchored to verified 2026 list prices: $5 budget VPS (DO entry $4 /
// Hetzner cx23 ~$5.93), $10 capable VPS (Hetzner CPX22 ~$8.55-9.49), $24 managed
// cloud (DO 2vCPU/4GB). Docker-heavy stacks get the higher class.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "../src/data/alternatives.json");

const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
let added = 0;

for (const p of data.pairings) {
  const a = p.alternative;
  if (!a.platforms?.includes("self-host")) continue;
  if (a.tco?.hostingMonthlyEstimateUsd) continue; // idempotent
  const heavy = Boolean(a.ecosystems?.docker);
  a.tco = { hostingMonthlyEstimateUsd: heavy ? 10 : 5 };
  added += 1;
}

fs.writeFileSync(FILE, `${JSON.stringify(data, null, 2)}\n`);
console.log(`tco estimates added to ${added} listings (skipped those already set)`);
