import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.join(__dirname, "..", "src", "data", "alternatives.json");

const raw = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
for (const p of raw.pairings) {
  if (p.goalTags) {
    p.goalTags = p.goalTags.map((tag) => {
      if (tag.startsWith("replace-")) return tag;
      return `replace-${tag}`;
    });
  }
}

fs.writeFileSync(catalogPath, JSON.stringify(raw, null, 2), "utf8");
console.log(`✓ Normalized goalTags for ${raw.pairings.length} pairings.`);
