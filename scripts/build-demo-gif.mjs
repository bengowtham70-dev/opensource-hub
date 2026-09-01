// Assemble output/playwright/demo-frames/*.png (from capture-demo.py) into
// docs/demo.gif — pure JS: pngjs decodes, gifenc quantizes + encodes. Longer
// dwell on the detail frames so the trust-ring fill reads. Usage:
//   node scripts/build-demo-gif.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import gifenc from "gifenc"; // CJS module — destructure from default import
const { GIFEncoder, quantize, applyPalette } = gifenc;
import { PNG } from "pngjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const FRAMES = path.join(root, "output", "playwright", "demo-frames");
const OUT = path.join(root, "docs", "demo.gif");

const files = fs
  .readdirSync(FRAMES)
  .filter((f) => f.endsWith(".png"))
  .sort();
if (!files.length) {
  console.error("✗ no frames — run `python scripts/capture-demo.py` first");
  process.exit(1);
}

const gif = GIFEncoder();
for (const file of files) {
  const { data, width, height } = PNG.sync.read(
    fs.readFileSync(path.join(FRAMES, file)),
  );
  const palette = quantize(data, 256);
  const index = applyPalette(data, palette);
  // Dwell longer on the detail frames so the trust-ring fill is readable.
  const dwell = /^f(10|11)/.test(file) ? 1800 : 380;
  gif.writeFrame(index, width, height, { palette, delay: dwell });
  console.log(`  + ${file} (${dwell}ms)`);
}
gif.finish();
fs.writeFileSync(OUT, gif.bytes());
const kb = Math.round(fs.statSync(OUT).size / 1024);
console.log(`✓ docs/demo.gif written (${files.length} frames, ${kb} KB)`);
