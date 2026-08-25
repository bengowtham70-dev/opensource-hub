// plans/web-directory/PLAN.md — P10-style QA auditor for web-dist.
// Machine-verifies the built static site: internal links resolve, og:image
// references exist, JSON-LD parses everywhere, sitemap covers every page,
// robots.txt keeps its AI-bot allows. Exits 1 on any failure so CI can gate.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const DIST = path.join(root, "web-dist");

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.error(`  ✖ ${msg}`);
};
const ok = (msg) => console.log(`  ✔ ${msg}`);

// ---------- collect ----------
const htmlFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".html")) htmlFiles.push(path.relative(DIST, p).replace(/\\/g, "/"));
  }
})(DIST);

const routeToFile = new Map(); // "/affine" -> "affine.html" style resolution
for (const f of htmlFiles) {
  const route = "/" + f.replace(/\.html$/, "").replace(/(^|\/)index$/, "");
  routeToFile.set(route.replace(/\/$/, "") || "/", f);
}

function resolves(href) {
  if (href.startsWith("/#")) return true; // landing anchors
  let h = href.split("#")[0].split("?")[0].replace(/\/$/, "");
  if (!h || h === "/") return fs.existsSync(path.join(DIST, "index.html"));
  if (routeToFile.has(h)) return true;
  // GitHub Pages clean URLs: /x -> x.html ; /a/b -> a/b.html ; also /x/ dir index
  if (fs.existsSync(path.join(DIST, `${h}.html`))) {
    routeToFile.set(h, `${h}.html`);
    return true;
  }
  if (fs.existsSync(path.join(DIST, h, "index.html"))) return true;
  if (fs.existsSync(path.join(DIST, h))) return true; // asset files (png/xml/txt/woff)
  return false;
}

console.log(`auditing ${htmlFiles.length} html pages in web-dist…`);

// ---------- 1. internal link integrity ----------
let brokenLinks = 0;
const hrefRe = /(?:href|src)="(\/[^"]*)"/g;
for (const f of htmlFiles) {
  const html = fs.readFileSync(path.join(DIST, f), "utf8");
  for (const m of html.matchAll(hrefRe)) {
    const href = m[1];
    if (!resolves(href)) {
      brokenLinks += 1;
      fail(`${f}: dead link ${href}`);
      if (brokenLinks > 20) process.exit(1);
    }
  }
}
brokenLinks === 0 ? ok("all internal links/assets resolve") : null;

// ---------- 2. og:image references exist ----------
let ogRefs = 0;
for (const f of htmlFiles) {
  const html = fs.readFileSync(path.join(DIST, f), "utf8");
  const m = /property="og:image" content="([^"]*)"/.exec(html);
  if (!m) continue;
  ogRefs += 1;
  const imgPath = m[1].replace(/^https?:\/\/[^/]+/, "");
  if (!fs.existsSync(path.join(DIST, imgPath.replace(/^\//, "")))) fail(`${f}: og:image missing on disk (${imgPath})`);
}
ok(`og:image references verified (${ogRefs} pages carry cards)`);

// ---------- 3. JSON-LD parses everywhere ----------
let jsonLdCount = 0;
for (const f of htmlFiles) {
  const html = fs.readFileSync(path.join(DIST, f), "utf8");
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
      jsonLdCount += 1;
    } catch {
      fail(`${f}: invalid JSON-LD`);
    }
  }
}
jsonLdCount === 0 ? fail("no JSON-LD found at all") : ok(`JSON-LD valid (${jsonLdCount} blocks)`);

// ---------- 4. sitemap covers every page ----------
const sm = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
const locs = new Set([...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
  m[1].replace(/^https?:\/\/[^/]+/, "").replace(/\.html$/, "") || "/"
));
for (const f of htmlFiles) {
  const r = ("/" + f.replace(/\.html$/, "")).replace(/\/index$/, "") || "/";
  if (!locs.has(r)) fail(`sitemap missing page ${r}`);
}
ok(`sitemap covers ${locs.size} urls`);

// ---------- 5. feeds + robots ----------
for (const feed of ["rss/tools.xml", "rss/alternatives.xml", "rss/posts.xml"]) {
  const p = path.join(DIST, feed);
  if (!fs.existsSync(p)) {
    fail(`missing feed ${feed}`);
    continue;
  }
  const xml = fs.readFileSync(p, "utf8");
  if (!xml.startsWith("<?xml") || !xml.includes("<channel>")) fail(`malformed feed ${feed}`);
}
const robots = fs.readFileSync(path.join(DIST, "robots.txt"), "utf8");
for (const bot of ["GPTBot", "ClaudeBot", "PerplexityBot"]) {
  if (!robots.includes(`User-agent: ${bot}`)) fail(`robots.txt missing AI allow for ${bot}`);
}
ok("feeds well-formed; robots keeps AI-bot allows");

// ---------- verdict ----------
if (failures) {
  console.error(`\nAUDIT FAILED: ${failures} issue(s)`);
  process.exit(1);
}
console.log("\nWEB-DIST AUDIT PASSED ✅");
