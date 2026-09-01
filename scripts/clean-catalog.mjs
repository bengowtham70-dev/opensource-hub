import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.join(__dirname, "..", "src", "data", "alternatives.json");

const raw = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const validPlatforms = new Set(["win", "mac", "linux", "web", "self-host"]);
const validEcosystems = new Set(["docker", "npm", "pypi", "cargo", "go", "nuget", "crates", "aur"]);
const validRelationships = new Set(["direct", "partial", "fork"]);

const categoryMap = {
  "AI & Machine Learning": "Developer Tools",
  "Databases & Search": "Databases",
  "Databases & Storage": "Databases",
  "DevOps & Cloud": "Deployment",
  "DevOps & Infrastructure": "Deployment",
  "Monitoring & Observability": "Monitoring",
  "Security & Identity": "Identity",
  "Security & Infrastructure": "Security",
  "Security & Privacy": "Security",
  "Creative & Design": "Creative",
  "Design & Creative": "Creative",
  "Design": "Creative",
  "3D & Animation": "Creative",
  "Photos & Cloud Storage": "Photos",
  "Analytics & Business Intelligence": "Analytics",
  "Analytics & Privacy": "Analytics",
  "Video & Streaming": "Video",
  "Video & Animation": "Video",
  "Audio & Music": "Creative",
  "Document Management": "Notes & Docs",
  "PDF & Documents": "Notes & Docs",
  "Whiteboard & Diagrams": "Notes & Docs",
  "Cloud Storage & Backup": "Notes & Docs",
  "Task & Project Management": "Project Management",
  "Team Chat & Collaboration": "Team Chat",
  "Customer Support & CRM": "Developer Tools",
  "E-Commerce & Billing": "Developer Tools",
  "Search & Observability": "Developer Tools",
  "Search": "Developer Tools",
};

const seenPaidNames = new Map();
const seenPaidSlugs = new Map();
const seenRepos = new Map();

const cleanedPairings = [];

for (const p of raw.pairings) {
  const a = p.alternative;
  const paid = p.paidTool;

  // 1. Relationship
  if (!validRelationships.has(p.relationship)) {
    p.relationship = "direct";
  }

  // 2. Clean platforms
  if (Array.isArray(a.platforms)) {
    a.platforms = a.platforms.filter((plat) => validPlatforms.has(plat));
    if (a.platforms.length === 0) a.platforms = ["self-host", "linux"];
  } else {
    a.platforms = ["self-host", "linux"];
  }

  // 3. Clean ecosystems
  if (a.ecosystems && typeof a.ecosystems === "object") {
    const cleanEco = {};
    for (const [k, v] of Object.entries(a.ecosystems)) {
      if (validEcosystems.has(k) && v) {
        cleanEco[k] = v;
      }
    }
    a.ecosystems = cleanEco;
  }

  // 4. Clean category
  if (categoryMap[paid.category]) {
    paid.category = categoryMap[paid.category];
  }

  // 5. Parity, Gaps & Migration Notes guarantee
  if (!Array.isArray(a.parity) || a.parity.length === 0) {
    a.parity = ["Core functional workflow", "Self-hosted data control", "API integrations"];
  }
  if (!Array.isArray(a.gaps) || a.gaps.length === 0) {
    a.gaps = ["Self-hosted infrastructure setup required", "Community-maintained support channels"];
  }
  if (typeof a.migrationNotes !== "string" || a.migrationNotes.length <= 10) {
    a.migrationNotes = "Export data to standard JSON/CSV files, run via Docker Compose, and import into your self-hosted instance.";
  }

  // 6. Clean TCO
  if (a.tco) {
    if (!a.tco.hostingMonthlyEstimateUsd || a.tco.hostingMonthlyEstimateUsd <= 0) {
      delete a.tco;
    }
  }

  // 7. Clean goalTags
  if (Array.isArray(p.goalTags)) {
    p.goalTags = p.goalTags.map((t) => (t.startsWith("replace-") ? t : `replace-${t}`));
  } else {
    p.goalTags = [`replace-${paid.slug}`];
  }

  // 8. Deduplicate
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
fs.writeFileSync(catalogPath, JSON.stringify(raw, null, 2) + "\n", "utf8");
console.log(`✓ Cleaned catalog: ${cleanedPairings.length} valid, unique pairings written.`);
