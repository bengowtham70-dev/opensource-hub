// Launch QA deep sweep: all 25 routes x (light,dark) x (desktop,mobile)
// Checks: console errors, failed network requests (4xx/5xx), broken images,
// blank screens, and the 404 route. Screenshots key pages for design audit.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const SHOTS = "test/screenshots/launch-qa";
mkdirSync(SHOTS, { recursive: true });

const ROUTES = [
  "/", "/alternatives", "/alternatives/slack", "/categories",
  "/repo/toeverything/affine", "/compare/mattermost/vs/zulip", "/find",
  "/stack-audit", "/audits", "/stacks", "/stacks/builder", "/releases",
  "/lists", "/lists/self-hosted-starter-pack", "/favorites", "/watchlist",
  "/licenses", "/learn", "/learn/what-is-open-source", "/blog",
  "/blog/why-we-built-opensource-hub", "/mcp", "/submit", "/advertise",
  "/admin", "/this-route-does-not-exist",
];

const SHOT_ROUTES = new Set(["/", "/repo/toeverything/affine", "/find", "/compare/mattermost/vs/zulip"]);
const EXPECTED_404 = [/\/api\/osv/, /\/api\/audits\/repo\//, /\/api\/releases\/repo\//, /\/api\/metrics\/repo\//];
const isExpectedMiss = (u) => EXPECTED_404.some((re) => re.test(u));

const problems = [];
let loads = 0;

const browser = await chromium.launch({ headless: true });
for (const theme of ["light", "dark"]) {
  for (const vp of [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, colorScheme: theme });
    const page = await ctx.newPage();
    await page.addInitScript((t) => localStorage.setItem("osh-theme", t), theme);

    const consoleErrors = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200)); });
    page.on("pageerror", (e) => consoleErrors.push(`PAGEERROR ${String(e).slice(0, 200)}`));
    page.on("response", (r) => {
      if (r.status() >= 400 && !isExpectedMiss(r.url()) && !r.url().includes("/this-route-does-not-exist")) {
        problems.push(`[${theme}/${vp.name}] ${r.status()} ${r.url().slice(0, 120)}`);
      }
    });

    for (const route of ROUTES) {
      consoleErrors.length = 0;
      try {
        const resp = await page.goto(BASE + route, { wait_until: "networkidle", timeout: 20000 });
        loads += 1;
        const rootLen = (await page.locator("#root").innerHTML().catch(() => "")) .length;
        const want404 = route === "/this-route-does-not-exist";
        if (want404 && !/Lost in space/.test(await page.content())) {
          problems.push(`[${theme}/${vp.name}] 404 route lacks custom 404 UI`);
        }
        if (!want404) {
          if (rootLen < 50) problems.push(`[${theme}/${vp.name}] ${route} near-empty root (${rootLen} chars)`);
          const brokenImgs = await page.evaluate(() =>
            [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.src).map((i) => i.src.slice(0, 120))
          );
          for (const src of brokenImgs) problems.push(`[${theme}/${vp.name}] ${route} broken img ${src}`);
          for (const err of consoleErrors) problems.push(`[${theme}/${vp.name}] ${route} console: ${err}`);
          if (SHOT_ROUTES.has(route) && vp.name === "desktop") {
            await page.screenshot({ path: `${SHOTS}/${theme}-${route.replaceAll("/", "_")}.png`, fullPage: false });
          }
          if (route === "/" && vp.name === "mobile" && theme === "light") {
            await page.screenshot({ path: `${SHOTS}/mobile-home.png`, fullPage: false });
          }
        }
      } catch (e) {
        problems.push(`[${theme}/${vp.name}] ${route} LOAD FAIL ${String(e).slice(0, 150)}`);
      }
    }
    await ctx.close();
  }
}
await browser.close();

console.log(`Sweep complete: ${loads} page loads across 4 viewport/theme combos`);
if (problems.length) {
  console.log(`\n${problems.length} PROBLEM(S):`);
  for (const p of [...new Set(problems)].slice(0, 80)) console.log("  ✖ " + p);
  process.exit(1);
} else {
  console.log("ALL CLEAN — no console errors, broken images, unexpected 4xx/5xx, or blank pages");
}
