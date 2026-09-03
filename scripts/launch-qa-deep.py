"""Launch QA deep sweep: all 26 routes x (light,dark) x (desktop,mobile).
Checks: console errors, failed network requests (4xx/5xx), broken images,
blank roots, custom 404 UI. Screenshots key pages for the design audit."""
import re
import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
SHOTS = "test/screenshots/launch-qa"

ROUTES = [
    "/", "/alternatives", "/alternatives/slack", "/categories",
    "/repo/toeverything/affine", "/compare/mattermost/vs/zulip", "/find",
    "/stack-audit", "/audits", "/stacks", "/stacks/builder", "/releases",
    "/lists", "/lists/self-hosted-starter-pack", "/favorites", "/watchlist",
    "/licenses", "/learn", "/learn/what-is-open-source", "/blog",
    "/blog/best-notion-alternatives-2026", "/mcp", "/submit", "/advertise",
    "/admin", "/this-route-does-not-exist",
]

SHOT_ROUTES = {"/", "/repo/toeverything/affine", "/find", "/compare/mattermost/vs/zulip"}
EXPECTED_MISS = [re.compile(p) for p in (r"/api/osv", r"/api/audits/repo/", r"/api/releases/repo/", r"/api/metrics/repo/")]

problems, loads = [], 0

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for theme in ("light", "dark"):
        for vp_name, w, h in (("desktop", 1440, 900), ("mobile", 390, 844)):
            ctx = browser.new_context(viewport={"width": w, "height": h}, color_scheme=theme)
            page = ctx.new_page()
            page.add_init_script(f"localStorage.setItem('osh-theme', '{theme}')")

            console_errors = []
            page.on("console", lambda m: console_errors.append(m.text[:200]) if m.type == "error" else None)
            page.on("pageerror", lambda e: console_errors.append(f"PAGEERROR {str(e)[:200]}"))
            page.on("response", lambda r: problems.append(
                f"[{theme}/{vp_name}] {r.status} {r.url[:120]}")
                if r.status >= 400 and not any(rx.search(r.url) for rx in EXPECTED_MISS)
                and "this-route-does-not-exist" not in r.url else None)

            for route in ROUTES:
                console_errors.clear()
                try:
                    page.goto(BASE + route, wait_until="domcontentloaded", timeout=20000)
                    page.wait_for_timeout(3500)
                    loads += 1
                    root_len = len(page.locator("#root").inner_html())
                    want_404 = route == "/this-route-does-not-exist"
                    if want_404 and "Lost in space" not in page.content():
                        problems.append(f"[{theme}/{vp_name}] 404 route lacks custom 404 UI")
                    if not want_404:
                        if root_len < 50:
                            problems.append(f"[{theme}/{vp_name}] {route} near-empty root ({root_len} chars)")
                        for src in page.evaluate(
                            "[...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.src).map(i => i.src.slice(0,120))"
                        ):
                            problems.append(f"[{theme}/{vp_name}] {route} broken img {src}")
                        for err in console_errors:
                            problems.append(f"[{theme}/{vp_name}] {route} console: {err}")
                        if route in SHOT_ROUTES and vp_name == "desktop":
                            page.screenshot(path=f"{SHOTS}/{theme}-{route.replace('/', '_')}.png")
                        if route == "/" and vp_name == "mobile" and theme == "light":
                            page.screenshot(path=f"{SHOTS}/mobile-home.png")
                except Exception as e:
                    problems.append(f"[{theme}/{vp_name}] {route} LOAD FAIL {str(e)[:150]}")
            ctx.close()
    browser.close()

print(f"Sweep complete: {loads} page loads across 4 viewport/theme combos")
if problems:
    print(f"\n{len(problems)} PROBLEM(S):")
    for line in list(dict.fromkeys(problems))[:80]:
        print("  x " + line)
    sys.exit(1)
print("ALL CLEAN - no console errors, broken images, unexpected 4xx/5xx, or blank pages")
