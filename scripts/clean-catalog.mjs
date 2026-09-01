import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.join(__dirname, "..", "src", "data", "alternatives.json");

const raw = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const validPlatforms = new Set(["win", "mac", "linux", "web", "self-host", "ios", "android"]);

// Map custom categories to existing official groups
const categoryMap = {
  "AI & Machine Learning": "Developer Tools",
  "Databases & Search": "Databases",
  "DevOps & Cloud": "Deployment",
  "Monitoring & Observability": "Monitoring",
  "Security & Identity": "Identity",
  "Security & Infrastructure": "Security",
  "Creative & Design": "Creative",
  "3D & Animation": "Creative",
  "Photos & Cloud Storage": "Photos",
  "Analytics & Business Intelligence": "Analytics",
  "Analytics & Privacy": "Analytics",
  "Video & Streaming": "Video",
};

// Track seen to ensure uniqueness
const seenPaidNames = new Map();
const seenPaidSlugs = new Map();
const seenRepos = new Map();

const cleanedPairings = [];

for (const p of raw.pairings) {
  const a = p.alternative;
  const paid = p.paidTool;

  // 1. Clean platforms
  if (Array.isArray(a.platforms)) {
    a.platforms = a.platforms.filter((plat) => validPlatforms.has(plat));
    if (a.platforms.length === 0) a.platforms = ["self-host", "linux"];
  }

  // 2. Clean category
  if (categoryMap[paid.category]) {
    paid.category = categoryMap[paid.category];
  }

  // 3. Clean TCO (must be positive number if present)
  if (a.tco) {
    if (!a.tco.hostingMonthlyEstimateUsd || a.tco.hostingMonthlyEstimateUsd <= 0) {
      delete a.tco;
    }
  }

  // 4. Clean goalTags
  if (Array.isArray(p.goalTags)) {
    p.goalTags = p.goalTags.map((t) => (t.startsWith("replace-") ? t : `replace-${t}`));
  }

  // 5. Deduplicate
  const repoKey = a.repo.toLowerCase();
  const slugKey = paid.slug.toLowerCase();
  const nameKey = paid.name.toLowerCase();

  if (seenRepos.has(repoKey)) {
    console.log(`Skipping duplicate repo: ${a.repo}`);
    continue;
  }
  if (seenPaidSlugs.has(slugKey)) {
    paid.slug = `${paid.slug}-${a.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  }
  if (seenPaidNames.has(nameKey)) {
    paid.name = `${paid.name} (${a.name} Alt)`;
  }

  seenRepos.set(repoKey, true);
  seenPaidSlugs.set(paid.slug.toLowerCase(), true);
  seenPaidNames.set(paid.name.toLowerCase(), true);

  cleanedPairings.push(p);
}

raw.pairings = cleanedPairings;
fs.writeFileSync(catalogPath, JSON.stringify(raw, null, 2), "utf8");
console.log(`✓ Cleaned catalog: ${cleanedPairings.length} valid, unique pairings written.`);
