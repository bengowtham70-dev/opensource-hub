// plans/web-directory/PLAN.md W7 â€” build-time OG social cards (deviation #6:
// static PNGs instead of a runtime /api/og edge function, keeping the $0 promise).
// Card spec follows skills/claude/programmatic-seo-engine Â§3 (1200Ã—630, Obsidian
// Sentinel light palette (#F6F5F3) adapted to deterministic text-first content â€” no remote logo
// fetches, no fabricated metrics: the 30-day delta renders ONLY from genuine
// collected history (same honesty rule as every public surface).
//
// @resvg/resvg-js is a devDependency used ONLY here (CI); it can
// never ship in the npm package (package.json "files" excludes node_modules). Rendering is a pure SVG template rasterized by resvg - no satori/WASM fragility.
// If either module or the font is unavailable, generation skips with a warning
// and exits 0 â€” the HTML artifact is never blocked by social cards.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const OUT = path.join(root, "web-dist", "og");
const FONT_DIR = path.join(root, ".og-fonts"); // gitignored cache
// Static WOFF (satori's opentype fork cannot parse VARIABLE font fvar tables â€”
// the google/fonts Inter[opsz,wght].ttf crashes it; learned live).
const FONT_URL =
  "https://cdn.jsdelivr.net/npm/@expo-google-fonts/inter@0.4.2/400Regular/Inter_400Regular.ttf";

const { ogImagePath, esc } = await import("./build-web-directory.mjs");

export function flatten(route) {
  return ogImagePath(route).replace(/^\/og\//, "").replace(/\.png$/, "");
}

// Pure card-spec builder â€” unit-tested without satori/resvg.
export function buildCardSpec(pairing, snapshots) {
  const a = pairing.alternative;
  const stars = snapshots.stars?.[a.repo] ?? null;
  let delta = null;
  const history = snapshots.history?.[a.repo];
  if (Array.isArray(history) && history.length >= 8) {
    const pts = history.slice(-30);
    const first = pts[0].stars;
    const last = pts[pts.length - 1].stars;
    delta = first > 0 ? Number((((last - first) / first) * 100).toFixed(1)) : null;
  }
  return {
    name: a.name,
    paidTool: pairing.paidTool.name,
    pricePerYearUsd: pairing.paidTool.pricePerYearUsd,
    stars,
    delta,
    license: a.license?.spdx || null,
  };
}

function chip(text, color) {
  return {
    type: "div",
    style: {
      display: "flex",
      padding: "10px 22px",
      borderRadius: 999,
      border: `1px solid ${color}`,
      color,
      fontSize: 26,
      fontFamily: "Inter",
    },
    children: text,
  };
}

function chipSvg(text, color, x, y) {
  const w = Math.round(text.length * 14 + 44);
  const escaped = esc(text);
  return {
    rect: `<rect x="${x}" y="${y}" width="${w}" height="46" rx="23" fill="none" stroke="${color}" stroke-opacity="0.55" stroke-width="1.5"/>`,
    text: `<text x="${x + w / 2}" y="${y + 31}" text-anchor="middle" font-size="22" fill="${color}">${escaped}</text>`,
    nextX: x + w + 18,
  };
}

// Pure SVG card (1200×630) — rasterized by @resvg/resvg-js with the cached
// Inter font. No satori: its bundled opentype/WASM stack failed on this
// environment even with satori's own README example (see journal).
export function buildCardSvg(spec, { siteName = "OpenSource Hub", baseUrl = "" } = {}) {
  const escT = (s) => esc(s);
  let x = 64;
  let chips = "";
  if (spec.license) {
    const c = chipSvg(spec.license, "#18181B", x, 452);
    chips += c.rect + c.text;
    x = c.nextX;
  }
  if (spec.stars != null) {
    const label = `★ ${spec.stars >= 1000 ? `${(spec.stars / 1000).toFixed(1)}k` : spec.stars}`;
    const c = chipSvg(label, "#D97706", x, 452);
    chips += c.rect + c.text;
    x = c.nextX;
  }
  if (spec.delta != null) {
    const color = spec.delta >= 0 ? "#059669" : "#DC2626";
    const arrow = spec.delta >= 0 ? "▲" : "▼";
    const c = chipSvg(`${arrow} ${Math.abs(spec.delta)}% 30d`, color, x, 452);
    chips += c.rect + c.text;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#F6F5F3"/>
<text x="64" y="96" font-size="28" fill="#C2410C">◆</text>
<text x="92" y="96" font-size="28" fill="#52525B">${escT(siteName)}</text>
<text x="64" y="300" font-size="86" font-weight="700" fill="#18181B">${escT(spec.name)}</text>
<text x="64" y="372" font-size="32" fill="#52525B">${escT(`Free open-source alternative to ${spec.paidTool}`)}</text>
<text x="64" y="418" font-size="26" fill="#52525B">${escT(`$${spec.pricePerYearUsd}/yr kept in your pocket`)}</text>
${chips}
<text x="64" y="576" font-size="24" fill="#A1A1AA">${escT("Run it locally · npm i -g opensource-hub")}</text>
</svg>`;
}

async function loadFont() {
  fs.mkdirSync(FONT_DIR, { recursive: true });
  const cached = path.join(FONT_DIR, "Inter_400Regular.ttf");
  if (fs.existsSync(cached)) return fs.readFileSync(cached);
  try {
    const res = await fetch(FONT_URL);
    if (!res.ok) throw new Error(`font fetch ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(cached, buf);
    return buf;
  } catch (err) {
    console.warn(`warn: could not load font (${err.message})`);
    return null;
  }
}

async function main() {
  const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  const alternatives = readJson("src/data/alternatives.json");
  let snapshots = {};
  try {
    snapshots = readJson("src/data/snapshots-seed.json");
  } catch {}
  const config = readJson("site.config.json");

  // Enumerate card targets: tool profiles + SaaS hubs (PLAN W7 gate scope).
  const targets = [];
  const slugs = new Set();
  const repoToSlug = new Map();
  for (const pairing of alternatives.pairings) {
    const slug = (() => {
      const [owner, name] = pairing.alternative.repo.split("/");
      const base = name.toLowerCase();
      if (slugs.has(base)) return `${owner}-${base}`.toLowerCase();
      slugs.add(base);
      return base;
    })();
    repoToSlug.set(pairing.alternative.repo, slug);
    targets.push({ route: slug, spec: buildCardSpec(pairing, snapshots) });
  }
  const hubSlugs = new Set();
  for (const pairing of alternatives.pairings) {
    const hubSlug = pairing.paidTool?.slug;
    if (!hubSlug || hubSlugs.has(hubSlug)) continue;
    hubSlugs.add(hubSlug);
    targets.push({ route: `alternatives/${hubSlug}`, spec: buildCardSpec(pairing, snapshots) });
  }
  // §3d compare cards — mirrors buildSite grouping (top-3 per hub, then per
  // category) so ogImagePath references in generated HTML always resolve.
  const CMP_PER_GROUP = 3;
  const cmpGroups = [];
  const byHub = new Map();
  const byCat = new Map();
  for (const pairing of alternatives.pairings) {
    const hs = pairing.paidTool?.slug;
    if (hs) {
      if (!byHub.has(hs)) byHub.set(hs, []);
      byHub.get(hs).push(pairing);
    }
    const cat = pairing.paidTool.category;
    if (cat) {
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat).push(pairing);
    }
  }
  for (const list of [...byHub.values(), ...byCat.values()]) {
    if (list.length > 1) cmpGroups.push(list.slice(0, CMP_PER_GROUP));
  }
  const cmpSeen = new Set();
  for (const list of cmpGroups) {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const pA = list[i];
        const pB = list[j];
        const sA = repoToSlug.get(pA.alternative.repo);
        const sB = repoToSlug.get(pB.alternative.repo);
        if (!sA || !sB) continue;
        const flat = [sA, sB].sort().join("-vs-");
        if (cmpSeen.has(flat)) continue;
        cmpSeen.add(flat);
        const stars = snapshots.stars?.[pA.alternative.repo] ?? null;
        targets.push({
          route: `compare/${flat}`,
          spec: {
            name: `${pA.alternative.name} vs ${pB.alternative.name}`,
            paidTool: pA.paidTool.category || pA.paidTool.name,
            pricePerYearUsd: pA.paidTool.pricePerYearUsd,
            stars,
            delta: null,
            license: pA.alternative.license?.spdx ?? null,
          },
        });
      }
    }
  }

  // Master index gets its own card (site-level, no fake metrics).
  targets.push({
    route: "alternatives",
    spec: {
      name: config.siteName,
      paidTool: "the software you rent",
      pricePerYearUsd: 0,
      stars: null,
      delta: null,
      license: null,
    },
  });

  let resvgMod;
  try {
    resvgMod = await import("@resvg/resvg-js");
  } catch {
    console.warn("warn: @resvg/resvg-js not installed - skipping OG cards (npm i to enable)");
    process.exit(0);
  }
  const fontPath = await loadFont();
  if (!fontPath) {
    console.warn("warn: no font available - skipping OG cards");
    process.exit(0);
  }

  fs.mkdirSync(OUT, { recursive: true });
  let written = 0;
  for (const t of targets) {
    const svg = buildCardSvg(t.spec, config);
    const png = new resvgMod.Resvg(svg, {
      fitTo: { mode: "width", value: 1200 },
      font: { fontFiles: [fontPath], loadSystemFonts: false, defaultFontFamily: "Inter" },
    })
      .render()
      .asPng();
    fs.writeFileSync(path.join(OUT, `${flatten(t.route)}.png`), png);
    written += 1;
  }
  console.log(`og images written: ${written}/${targets.length} â†’ ${path.relative(root, OUT)}`);
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) main().catch((err) => {
  console.error(err);
  process.exit(1);
});