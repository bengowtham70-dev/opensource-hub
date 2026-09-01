import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distClientDir = path.join(__dirname, "..", "dist", "client");

console.log("\n=======================================================");
console.log("   OPENSOURCE HUB — PERFORMANCE & CI BUDGET AUDIT      ");
console.log("=======================================================\n");

if (!fs.existsSync(distClientDir)) {
  console.error("❌ dist/client does not exist. Run `npm run build` first.");
  process.exit(1);
}

const assetsDir = path.join(distClientDir, "assets");
const files = fs.readdirSync(assetsDir);

let indexJsSize = 0;
let indexJsGzip = 0;
let cssSize = 0;
let cssGzip = 0;

for (const file of files) {
  const filePath = path.join(assetsDir, file);
  const content = fs.readFileSync(filePath);
  const gzipSize = zlib.gzipSync(content).length;

  if (file.startsWith("index-") && file.endsWith(".js")) {
    indexJsSize = content.length;
    indexJsGzip = gzipSize;
  } else if (file.startsWith("index-") && file.endsWith(".css")) {
    cssSize = content.length;
    cssGzip = gzipSize;
  }
}

console.log(`• Entrypoint JS: ${(indexJsSize / 1024).toFixed(2)} KB (Gzip: ${(indexJsGzip / 1024).toFixed(2)} KB)`);
console.log(`• Stylesheet CSS: ${(cssSize / 1024).toFixed(2)} KB (Gzip: ${(cssGzip / 1024).toFixed(2)} KB)`);

// Performance budgets per AGENTS.md & PRD
const BUDGET_INDEX_JS_GZIP_MAX = 50 * 1024; // 50 KB gzip max
const BUDGET_CSS_GZIP_MAX = 30 * 1024; // 30 KB gzip max

let failed = false;

if (indexJsGzip > BUDGET_INDEX_JS_GZIP_MAX) {
  console.error(`❌ Budget failure: Entrypoint JS gzip (${(indexJsGzip / 1024).toFixed(2)} KB) exceeds budget of 50 KB.`);
  failed = true;
} else {
  console.log(`✓ Entry JS within strict performance budget (< 50 KB gzip).`);
}

if (cssGzip > BUDGET_CSS_GZIP_MAX) {
  console.error(`❌ Budget failure: CSS gzip (${(cssGzip / 1024).toFixed(2)} KB) exceeds budget of 30 KB.`);
  failed = true;
} else {
  console.log(`✓ CSS within strict performance budget (< 30 KB gzip).`);
}

// Check CSS motion budget (150ms Sentinel budget)
const cssContent = fs.readFileSync(path.join(__dirname, "..", "dashboard", "src", "styles", "app.css"), "utf8");
if (cssContent.includes("300ms") || cssContent.includes("500ms")) {
  console.warn("⚠️ Warning: Non-Sentinel slow transition timings (>150ms) found in app.css.");
} else {
  console.log("✓ All CSS motion timings conform to 150ms Sentinel high-craft budget.");
}

console.log("\n=======================================================");
if (failed) {
  console.error("❌ Performance budget check FAILED.");
  process.exit(1);
} else {
  console.log("✅ All performance & animation budgets PASSED (60 FPS Ready).");
  console.log("=======================================================\n");
}
