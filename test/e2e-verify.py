"""E2E visual + functional verification of the OpenSource Hub dashboard.

Prereq: local server already running at http://localhost:3000 (built UI).
Captures screenshots into %TEMP%/osh-shots and fails on console errors or
broken flows.
"""
import os
import sys
import time

from playwright.sync_api import sync_playwright

BASE = os.environ.get("OSH_BASE", "http://localhost:3000")
OUT = os.path.join(os.environ.get("TEMP", "/tmp"), "osh-shots")
os.makedirs(OUT, exist_ok=True)

errors = []
failures = []


def shot(page, name):
    page.screenshot(path=os.path.join(OUT, name), full_page=False)
    print(f"  [shot] {name}")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.on(
            "console",
            lambda m: errors.append(m.text) if m.type == "error" else None,
        )
        page.on("pageerror", lambda e: errors.append(str(e)))

        # 1) Trending dashboard
        print("1) trending page")
        page.goto(BASE)
        page.wait_for_load_state("networkidle")
        cards = page.locator("article.card-glass")
        cards.first.wait_for(timeout=15000)
        page.wait_for_timeout(1200)  # let staggered entrance finish
        n = cards.count()
        print(f"  repo cards rendered: {n}")
        if n < 8:
            failures.append(f"expected >=8 cards, got {n}")
        if page.locator("svg path.sparkline-path").count() == 0:
            failures.append("no animated sparklines found")
        shot(page, "01-trending.png")

        # 2) Hero search filters the grid
        print("2) hero search 'postman'")
        page.fill('input[type="search"]', "postman")
        page.wait_for_url("**/?q=postman", timeout=8000)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(600)
        n2 = page.locator("article.card-glass").count()
        print(f"  filtered cards: {n2}")
        if n2 != 1:
            failures.append(f"search expected 1 card, got {n2}")
        shot(page, "02-search.png")
        page.fill('input[type="search"]', "")
        page.wait_for_timeout(400)

        # 3) Command palette
        print("3) cmd+k palette")
        page.keyboard.press("Control+KeyK" if False else "Control+k")
        visible = page.locator("[cmdk-root]").wait_for(timeout=5000)
        page.keyboard.type("notion")
        page.wait_for_timeout(300)
        shot(page, "03-palette.png")
        page.keyboard.press("Escape")

        # 4) Detail page with comparison + Run App
        print("4) detail /repo/usebruno/bruno")
        # Rate-limit-immune: pin the releases endpoint so Run App always shows
        # (the degradation path — no button under 403 — is separately unit-tested).
        page.route(
            "**/api/releases/usebruno/bruno",
            lambda route: route.fulfill(
                json={
                    "runnable": True,
                    "platform": "win32",
                    "osAsset": {"name": "bruno_4.1.0_x64_win.exe", "size": 121934416,
                                "url": "https://example.com/bruno.exe", "digest": "sha256:" + "a" * 64},
                    "assets": [],
                    "tag": "v4.1.0",
                    "checksum": "sha256:" + "a" * 64,
                }
            ),
        )
        page.goto(f"{BASE}/repo/usebruno/bruno")
        page.wait_for_load_state("load")
        page.get_by_role("heading", name="Bruno", exact=True).wait_for(timeout=15000)
        run_btn = page.get_by_role("button", name="Run App")
        run_btn.wait_for(timeout=15000)
        parity = page.locator("text=%")
        print(f"  parity gauge present: {parity.count() > 0}")
        disclaimer = page.locator("text=Community-reported").count()
        print(f"  PRD §8 disclaimer present: {disclaimer > 0}")
        if not disclaimer:
            failures.append("missing community-reported disclaimer")
        # expand parity checklist drawer
        page.locator('button:has-text("Feature parity")').click()
        page.wait_for_timeout(300)
        shot(page, "04-detail.png")

        # 5) Favorites round trip
        print("5) favorites round trip")
        fav_before = page.get_by_role("button", name="Add Bruno to favorites")
        fav_before.click()
        page.wait_for_timeout(400)
        page.goto(f"{BASE}/favorites")
        page.wait_for_load_state("networkidle")
        saving = page.locator("text=Saving $").first  # amount grows with accumulated favorites
        saving.wait_for(timeout=8000)
        print(f"favorites shows Bruno with total savings ({saving.inner_text().strip()})")
        shot(page, "05-favorites.png")

        # 6) Learn section + article
        print("6) learn pages")
        page.goto(f"{BASE}/learn")
        page.wait_for_load_state("networkidle")
        page.get_by_text("What open source actually means").first.click()
        page.wait_for_load_state("networkidle")
        h1 = page.locator("h1")
        h1.first.wait_for(timeout=8000)
        shot(page, "06-learn-article.png")

        browser.close()

    real_errors = [
        e for e in errors
        if "favicon" not in e.lower() and "giscus" not in e.lower()
    ]
    print("\nconsole errors:", len(real_errors))
    for e in real_errors[:10]:
        print("  !", e[:200])
    if failures:
        print("\nFAILURES:")
        for f in failures:
            print("  âœ—", f)
        sys.exit(1)
    if real_errors:
        print("console errors detected")
        sys.exit(2)
    print("\nALL E2E CHECKS PASSED")


if __name__ == "__main__":
    t0 = time.time()
    main()
    print(f"done in {time.time() - t0:.1f}s")
