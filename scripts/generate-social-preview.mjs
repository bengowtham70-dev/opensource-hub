// .github/social-preview.png generator — the 1280×640 card GitHub shows when
// the repo is shared anywhere (Settings → Social preview → upload this PNG).
// Reuses the proven generate-og-images.mjs pattern: pure SVG rasterized by
// @resvg/resvg-js with the cached Inter font, Sentinel Paper & Ember tokens
// only, zero fabricated metrics, graceful skip when the font cache is cold.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const OUT = path.join(root, ".github", "social-preview.png");
const FONT = path.join(root, ".og-fonts", "Inter_400Regular.ttf");

const W = 1280;
const H = 640;
const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Sentinel tokens (AGENTS.md §3) — never regress.
const INK = "#18181B";
const DIM = "#52525B";
const FAINT = "#A1A1AA";
const EMBER = "#C2410C";
const HAIRLINE = "#E6E4E1";
const CANVAS = "#F6F5F3";
const PRIMARY = "#121212";

function chip(text, x, y) {
  const w = Math.round(text.length * 13.2 + 52);
  return {
    nextX: x + w + 16,
    svg:
      `<rect x="${x}" y="${y}" width="${w}" height="48" rx="24" fill="#FFFFFF" ` +
      `stroke="${HAIRLINE}" stroke-width="1"/>` +
      `<text x="${x + w / 2}" y="${y + 31}" text-anchor="middle" ` +
      `font-size="21" fill="${DIM}">${esc(text)}</text>`,
  };
}

function chipRow(labels, x, y) {
  let out = "";
  let cx = x;
  for (const label of labels) {
    const c = chip(label, cx, y);
    out += c.svg;
    cx = c.nextX;
  }
  return out;
}

function buildSvg() {
  // Gradient-dot shell motif (AGENTS.md §3 hero edge treatment) — restrained.
  const dots = [
    [1150, 90, 130, 0.5],
    [1210, 210, 90, 0.35],
    [1060, 40, 70, 0.25],
  ]
    .map(
      ([cx, cy, r, o]) =>
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${EMBER}" fill-opacity="${o * 0.12}" ` +
        `stroke="${HAIRLINE}" stroke-opacity="${o}" stroke-width="1"/>`,
    )
    .join("");

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${CANVAS}"/>
  <rect width="${W}" height="4" fill="none"/>
  ${dots}
  <!-- logo tile: ◆ on #121212 -->
  <rect x="80" y="84" width="96" height="96" rx="24" fill="${PRIMARY}"/>
  <polygon points="128,106 158,132 128,158 98,132" fill="#FFFFFF"/>
  <!-- title + tagline -->
  <text x="78" y="292" font-size="78" fill="${INK}" letter-spacing="-1.5">OpenSource Hub</text>
  <text x="80" y="348" font-size="30" fill="${DIM}">Free open-source alternatives to the paid software you already use.</text>
  <text x="80" y="392" font-size="25" fill="${FAINT}">One command. Local dashboard. Zero accounts. Honest trust scores.</text>
  <!-- feature chips -->
  ${chipRow(["Zero accounts", "Local-first", "Trust Scores", "sha256 verified"], 80, 452)}
  <!-- install pill -->
  <rect x="80" y="536" width="560" height="60" rx="12" fill="${PRIMARY}"/>
  <text x="104" y="574" font-size="24" fill="${EMBER}">$</text>
  <text x="126" y="574" font-size="24" fill="#FFFFFF">npm install -g opensource-hub</text>
</svg>`;
}

async function main() {
  if (!fs.existsSync(FONT)) {
    console.warn(
      "⚠ social preview skipped — font cache cold (.og-fonts/Inter_400Regular.ttf missing). " +
        "Run `npm run build:web` once (generate-og-images.mjs warms the cache), then rerun.",
    );
    process.exit(0);
  }
  const { Resvg } = await import("@resvg/resvg-js");
  const resvg = new Resvg(buildSvg(), {
    fitTo: { mode: "width", value: W },
    font: {
      fontFiles: [FONT],
      loadSystemFonts: false,
      defaultFontFamily: "Inter",
    },
  });
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, resvg.render().asPng());
  console.log(`✓ social preview written: ${OUT} (${W}×${H})`);
}

await main();
