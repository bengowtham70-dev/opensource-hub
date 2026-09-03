// Sitemap parity check: every generated .html page must have a <loc>.
const fs = require("fs");
const path = require("path");
const root = "web-dist";
const files = [];
const walk = (d) => {
  for (const n of fs.readdirSync(d)) {
    const p = path.join(d, n);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p);
    else if (n.endsWith(".html")) files.push(p);
  }
};
walk(root);
const sm = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const routes = files.map((f) =>
  f.slice(root.length + 1).replace(/\\/g, "/").replace(/\.html$/, "").replace(/\/index$/, "")
);
const misses = routes.filter((r) => r && r !== "index" && !sm.includes("/" + r));
console.log(
  JSON.stringify(
    {
      htmlPages: files.length,
      sitemapLocs: (sm.match(/<loc>/g) || []).length,
      stillMissing: misses,
    },
    null,
    1
  )
);
