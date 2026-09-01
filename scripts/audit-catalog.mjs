import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const alternativesPath = path.join(__dirname, "..", "src", "data", "alternatives.json");
const raw = JSON.parse(fs.readFileSync(alternativesPath, "utf8"));
const data = raw.pairings || raw;

console.log("\n=======================================================");
console.log("   OPENSOURCE HUB — CATALOG COVERAGE & AUDIT MATRIX    ");
console.log("=======================================================\n");

const totalPairings = data.length;
const totalSavings = data.reduce((acc, p) => acc + (p.paidTool.pricePerYearUsd || 0), 0);

const categories = {};
const platforms = {};
const licenses = {};
const languages = {};

for (const p of data) {
  const cat = p.paidTool.category || "Uncategorized";
  categories[cat] = (categories[cat] || 0) + 1;

  for (const plat of p.alternative.platforms || []) {
    platforms[plat] = (platforms[plat] || 0) + 1;
  }

  const licType = p.alternative.license?.type || "permissive";
  licenses[licType] = (licenses[licType] || 0) + 1;

  const lang = p.alternative.primaryLanguage || "Other";
  languages[lang] = (languages[lang] || 0) + 1;
}

console.log(`✓ Total Verified Pairings: ${totalPairings} pairs`);
console.log(`✓ Total Tracked Annual Savings: $${totalSavings.toLocaleString()}/year`);
console.log(`✓ Categories Covered: ${Object.keys(categories).length} unique categories`);
console.log(`✓ Languages Supported: ${Object.keys(languages).length} distinct programming languages`);

console.log("\n--- Category Breakdown ---");
Object.entries(categories)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cat, count]) => {
    console.log(`  • ${cat.padEnd(28)} : ${count} tools`);
  });

console.log("\n--- Platform Availability ---");
Object.entries(platforms)
  .sort((a, b) => b[1] - a[1])
  .forEach(([plat, count]) => {
    console.log(`  • ${plat.padEnd(16)} : ${count} tools`);
  });

console.log("\n--- License Classification ---");
Object.entries(licenses)
  .sort((a, b) => b[1] - a[1])
  .forEach(([lic, count]) => {
    console.log(`  • ${lic.padEnd(20)} : ${count} tools`);
  });

console.log("\n=======================================================\n");
