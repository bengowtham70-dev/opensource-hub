# -*- coding: utf-8 -*-
"""Phase 5 contrast + typography audit for OpenSource Hub (:3000). Fast single-pass JS walker."""
import json
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
PAGES = ["/", "/alternatives", "/trending", "/alternatives/bruno", "/compare?tools=bruno,umami"]

COLLECT = """() => {
  const parse = (c) => {
    if (!c) return null;
    const m = c.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(',').map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const out = { pairs: {}, fonts: {}, sampled: 0 };
  const bodyBg = parse(getComputedStyle(document.body).backgroundColor);
  const bgOf = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0.5) return c;
      n = n.parentElement;
    }
    return bodyBg;
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  let node;
  while ((node = walker.nextNode())) {
    if (!node.textContent.trim()) continue;
    const el = node.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    const st = window.getComputedStyle(el);
    if (st.visibility === 'hidden' || st.display === 'none') continue;
    const fg = parse(cs.color);
    const bg = bgOf(el);
    if (!fg || !bg || bg.a < 0.5) continue;
    const fs = parseFloat(cs.fontSize);
    const fw = parseInt(cs.fontWeight) || 400;
    const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '');
    out.fonts[fam] = (out.fonts[fam] || 0) + 1;
    const key = [fg.r, fg.g, fg.b, bg.r, bg.g, bg.b, fs].join(',');
    if (!out.pairs[key]) {
      out.pairs[key] = {
        fg: [fg.r, fg.g, fg.b], bg: [bg.r, bg.g, bg.b],
        size: fs, weight: fw, font: fam,
        sample: node.textContent.trim().slice(0, 40)
      };
    }
    out.sampled++;
  }
  return out;
}"""

def lum(c):
    def f(v):
        v = v / 255.0
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2])

def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

results = []
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    for theme in ("light", "dark"):
        ctx = b.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()
        page.goto(BASE + "/", wait_until="domcontentloaded", timeout=30000)
        page.evaluate("t => localStorage.setItem('osh-theme', t)", theme)
        for route in PAGES:
            page.goto(BASE + route, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(1800)
            data = page.evaluate(COLLECT)
            fails = []
            for k, v in data["pairs"].items():
                r = ratio(v["fg"], v["bg"])
                large = v["size"] >= 24 or (v["size"] >= 18.66 and v["weight"] >= 700)
                v["ratio"] = round(r, 2)
                v["large"] = large
                v["pass"] = r >= (3.0 if large else 4.5)
                if not v["pass"]:
                    fails.append(v)
            fails.sort(key=lambda f: f["ratio"])
            results.append({"theme": theme, "route": route, "sampled": data["sampled"],
                            "pairs": len(data["pairs"]), "failures": fails[:8],
                            "failCount": len(fails), "fonts": data["fonts"]})
            slug = route.replace("/", "_").replace("?", "-").replace("=", "-").replace(",", "+") or "home"
            page.screenshot(path="scripts/qa-shots/contrast-%s-%s.png" % (theme, slug))
        ctx.close()
    b.close()

total = sum(r["failCount"] for r in results)
for r in results:
    print("%-5s %-36s pairs=%-4d sampled=%-5d FAILS=%d fonts=%s" % (
        r["theme"], r["route"], r["pairs"], r["sampled"], r["failCount"], sorted(r["fonts"])))
    for f in r["failures"][:5]:
        print("    FAIL #%02x%02x%02x on #%02x%02x%02x ratio=%.2f %spx w%d %s :: %r" % (
            f["fg"][0], f["fg"][1], f["fg"][2], f["bg"][0], f["bg"][1], f["bg"][2],
            f["ratio"], f["size"], f["weight"], f["font"], f["sample"]))
print("\nTOTAL FAILURES:", total)
