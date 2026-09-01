// One-off anti-slop codemod: strip emoji glyphs, kill text glows, fix mojibake logic.
// Icons live in lucide where needed; colored text + role=alert carry the rest.
import fs from "node:fs";

const edits = {
  "dashboard/src/pages/AiFinderPage.jsx": [
    ['role="alert">⚠ {error}', 'role="alert">{error}'],
  ],
  "dashboard/src/pages/LearnPages.jsx": [
    ['mb-4">⚠ {error}', 'mb-4">{error}'],
  ],
  "dashboard/src/pages/ListsPage.jsx": [
    ['mb-4">⚠ {error}', 'mb-4">{error}'],
  ],
  "dashboard/src/pages/StackAuditPage.jsx": [
    ['role="alert">⚠ {error}', 'role="alert">{error}'],
    ['{savedAt ? "Saved ✓" : "Save this audit"}', '{savedAt ? "Saved" : "Save this audit"}'],
    ['style={{ textShadow: "0 0 22px rgba(16,185,129,0.35)" }} ', ""],
    ['style={{ textShadow: "0 0 18px rgba(16,185,129,0.35)" }} ', ""],
  ],
  "dashboard/src/pages/TrendingPage.jsx": [
    ["Clear goal ✕", "Clear goal"],
    ["Clear filters ✕", "Clear filters"],
  ],
  "dashboard/src/pages/ComparePage.jsx": [
    ["Side-by-side on the signals we can measure. ✓ marks the leading value per row where an",
     "Side-by-side on the signals we can measure. A check mark leads a row where an"],
  ],
  "dashboard/src/components/CommunitySection.jsx": [
    ["⚠ {tagError}", "{tagError}"],
  ],
  "dashboard/src/components/GiscusComments.jsx": [
    ["drop a 👍", "drop a reaction"],
  ],
  "dashboard/src/components/states.jsx": [
    ['>⚠ {message}', '>{message}'],
  ],
  "dashboard/src/components/TcoCalculator.jsx": [
    ["⚠ At ${monthly}/mo hosting", "At ${monthly}/mo hosting"],
  ],
  "dashboard/src/components/TeamFit.jsx": [
    ['<span aria-hidden="true">⚠</span>', ""],
  ],
};

for (const [file, pairs] of Object.entries(edits)) {
  let t = fs.readFileSync(file, "utf8");
  let n = 0;
  for (const [from, to] of pairs) {
    if (t.includes(from)) { t = t.split(from).join(to); n++; }
  }
  fs.writeFileSync(file, t);
  console.log(`${file}: ${n} swaps`);
}

// FavoritesPage — mojibake-prefixed message + broken startsWith check.
let fav = fs.readFileSync("dashboard/src/pages/FavoritesPage.jsx", "utf8");
fav = fav.replace(/setImportMsg\(`[^`]*Import failed: \$\{err\.message\}`\);/, 'setImportMsg(`Import failed: ${err.message}`);');
fav = fav.replace('importMsg.startsWith("?")', 'importMsg.startsWith("Import failed")');
fs.writeFileSync("dashboard/src/pages/FavoritesPage.jsx", fav);
console.log("FavoritesPage: mojibake logic fixed");

// app.css — remove the unused infinite shimmer animation + keyframes.
let css = fs.readFileSync("dashboard/src/styles/app.css", "utf8");
css = css.replace(/\s*--animate-shimmer: shimmer 1\.4s linear infinite;/, "");
css = css.replace(/@keyframes shimmer \{[^}]*\}\s*/s, "");
fs.writeFileSync("dashboard/src/styles/app.css", css);
console.log("app.css: shimmer var + keyframes removed");
