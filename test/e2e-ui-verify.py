# Full-app browser verification: trending, filters, detail, favorites, learn.
# Captures console errors + screenshots into test/screenshots/.
import json
import os
import sys

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3001"
OUT = os.path.join("test", "screenshots")
os.makedirs(OUT, exist_ok=True)

report = {"consoleErrors": [], "checks": []}


def check(name, ok, detail=""):
    report["checks"].append({"name": name, "ok": bool(ok), "detail": str(detail)[:200]})
    print(("PASS " if ok else "FAIL ") + name + (f" | {detail}" if detail else ""))


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.on(
        "console",
        lambda msg: report["consoleErrors"].append(msg.text) if msg.type == "error" else None,
    )
    page.on("pageerror", lambda err: report["consoleErrors"].append(str(err)))

    # 1. Trending page loads with repo cards
    page.goto(BASE)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1200)
    cards = page.locator("[class*='card'] a, .grid > *").count()
    check("trending renders cards", cards >= 8, f"{cards} card nodes")
    page.screenshot(path=os.path.join(OUT, "01-trending.png"), full_page=False)

    # 2. Filter rail exists and platform filter works
    rail = page.get_by_role("group", name="Filter by Platform")
    check("filter rail visible", rail.count() == 1)
    page.get_by_role("button", name="Self-host").first.click()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(900)
    url_has_filter = "platform=self-host" in page.url
    check("platform filter applies via URL", url_has_filter, page.url)
    count_chips = page.locator("[aria-pressed='true']").count()
    check("active chip state set", count_chips >= 1, f"{count_chips} pressed chips")
    page.screenshot(path=os.path.join(OUT, "02-filtered-selfhost.png"))

    # 3. License filter combines (AND) — pick Permissive while self-host active
    page.get_by_role("button", name="Permissive").first.click()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(900)
    both = "license=permissive" in page.url and "platform=self-host" in page.url
    check("AND combination in URL", both, page.url)
    page.screenshot(path=os.path.join(OUT, "03-and-combined.png"))
    page.get_by_role("button", name="Clear filters").first.click()
    page.wait_for_timeout(600)

    # 4. Command palette opens with Filters group
    page.keyboard.press("Control+k")
    page.wait_for_timeout(500)
    palette_visible = page.locator("[cmdk-root]").count() >= 1
    check("Cmd+K palette opens", palette_visible)
    has_filters_group = page.get_by_text("Filters").count() >= 1
    check("palette has Filters group", has_filters_group)
    page.screenshot(path=os.path.join(OUT, "04-palette.png"))
    page.keyboard.press("Escape")

    # 5. Open first repo card -> detail page
    page.wait_for_timeout(400)
    first_card = page.locator("a[href^='/repo/']").first
    href = first_card.get_attribute("href")
    check("repo link present", href is not None, str(href))
    page.goto(BASE + href)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)
    body_text = page.inner_text("body")
    # PRD 2.2: full meter normally; under GitHub rate-limit exhaustion the page
    # degrades to the Cached pill + snapshot pills (honest nulls, never fabricated).
    trust_seen = (
        ("Trust" in body_text)
        or ("trust" in body_text)
        or ("Cached" in body_text and "maintenance" not in body_text)
    )
    check("detail page shows Trust section (or honest cached degrade)", trust_seen)
    page.screenshot(path=os.path.join(OUT, "05-repo-detail.png"), full_page=True)

    # 6. Learn page
    page.goto(BASE + "/learn")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(800)
    articles = page.locator("a[href^='/learn/']").count()
    check("learn lists articles", articles >= 3, f"{articles} article links")
    page.screenshot(path=os.path.join(OUT, "06-learn.png"))

    # 7. Favorites empty state
    page.goto(BASE + "/favorites")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(800)
    fav_text = page.inner_text("body")
    check("favorites page renders", len(fav_text) > 50)
    page.screenshot(path=os.path.join(OUT, "07-favorites.png"))

    browser.close()

errs = [e for e in report["consoleErrors"] if "favicon" not in e.lower()]
check("no console/page errors", len(errs) == 0, "; ".join(errs[:3]))

passed = sum(1 for c in report["checks"] if c["ok"])
print(f"\n=== {passed}/{len(report['checks'])} checks passed ===")
with open(os.path.join(OUT, "report.json"), "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2)
sys.exit(0 if passed == len(report["checks"]) else 1)
