"""Launch QA: targeted interactive E2E (palette, theme persistence, favorites,
AI finder offline + bad-key degradation, mobile nav)."""
import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
results = []

def check(name, fn):
    try:
        fn()
        results.append((True, name, ""))
    except Exception as e:
        results.append((False, name, str(e)[:220]))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # ---- desktop context ----
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)[:200]))

    def t1_palette():
        page.goto(BASE + "/", wait_until="domcontentloaded")
        page.wait_for_timeout(4000)
        page.keyboard.press("Control+k")
        page.wait_for_selector("[cmdk-input]", timeout=5000)
        page.keyboard.type("notion", delay=40)
        page.wait_for_selector("[cmdk-item]", timeout=5000)
        page.keyboard.press("Enter")
        page.wait_for_url("**/?q=Notion", timeout=8000)
        page.wait_for_timeout(4000)
        assert "AFFiNE" in page.content(), "search results for Notion missing after palette navigation"
    check("Command palette: Ctrl+K -> search -> navigate", t1_palette)

    def t2_theme():
        page.goto(BASE + "/", wait_until="domcontentloaded")
        page.wait_for_timeout(3000)
        btn = page.locator("button[aria-label='Switch to dark mode']")
        btn.click()
        page.wait_for_timeout(400)
        assert page.evaluate("document.documentElement.classList.contains('dark')"), "dark class not set"
        page.reload(wait_until="domcontentloaded")
        page.wait_for_timeout(3000)
        assert page.evaluate("document.documentElement.classList.contains('dark')"), "theme not persisted after reload"
        assert page.locator("button[aria-label='Switch to light mode']").count() == 1, "toggle label wrong"
        page.locator("button[aria-label='Switch to light mode']").click()  # restore light
    check("Theme toggle + persistence across reload", t2_theme)

    def t3_favorites():
        page.goto(BASE + "/alternatives", wait_until="domcontentloaded")
        page.wait_for_timeout(4000)
        fav = page.locator("button[aria-label^='Add']").first
        label = fav.get_attribute("aria-label")
        fav.click()
        page.wait_for_timeout(600)
        page.goto(BASE + "/favorites", wait_until="domcontentloaded")
        page.wait_for_timeout(3000)
        content = page.content()
        assert "No favorites" not in content and len(content) > 5000, "favorites page empty after add"
        added_name = label.replace("Add ", "").replace(" to favorites", "")
        assert added_name.lower() in content.lower(), f"added '{added_name}' not found on favorites page"
        # cleanup: remove it again
        rm = page.locator("button[aria-label^='Remove']").first
        if rm.count():
            rm.click()
            page.wait_for_timeout(500)
    check("Favorites: add on card -> visible on /favorites -> cleanup", t3_favorites)

    def t4_ai_offline():
        page.goto(BASE + "/find", wait_until="domcontentloaded")
        page.wait_for_timeout(2500)
        submit = page.locator("button.shimmer-button")
        assert submit.is_disabled(), "submit should be disabled with empty task"
        page.locator("textarea").fill("I need a free open source alternative to Airtable for client records")
        assert submit.is_enabled(), "submit not enabled after fill"
        submit.click()
        page.wait_for_selector("text=replaces", timeout=15000)
        assert "offline" in page.content().lower(), "offline mode pill missing (no key set)"
    check("AI finder: disabled empty submit -> offline results + honest pill", t4_ai_offline)

    def t5_ai_badkey():
        page.goto(BASE + "/find", wait_until="domcontentloaded")
        page.wait_for_timeout(2500)
        page.locator("text=Add API key").click()
        page.wait_for_timeout(400)
        page.locator("input[placeholder='sk-…']").fill("sk-invalid-key-launch-qa")
        page.locator("textarea").fill("team chat for a small startup")
        page.locator("button.shimmer-button").click()
        page.wait_for_timeout(12000)
        content = page.content()
        assert not errors, f"page errors during bad-key run: {errors}"
        assert ("offline" in content.lower()) or ("alert" in content.lower()) or ("replaces" in content), \
            "no graceful offline fallback or error message after invalid key"
        page.locator("input[placeholder='sk-…']").fill("")  # cleanup key
    check("AI finder: invalid key degrades gracefully, no crash", t5_ai_badkey)

    ctx.close()

    # ---- mobile context ----
    mctx = browser.new_context(viewport={"width": 390, "height": 844})
    mpage = mctx.new_page()
    def t6_mobile():
        mpage.goto(BASE + "/", wait_until="domcontentloaded")
        mpage.wait_for_timeout(4000)
        mpage.locator("button[aria-label='Open menu']").click()
        mpage.wait_for_timeout(600)
        assert mpage.locator("nav[aria-label='Mobile']").is_visible(), "mobile nav not visible"
        mpage.locator("nav[aria-label='Mobile'] a", has_text="Alternatives").first.click()
        mpage.wait_for_url("**/alternatives", timeout=8000)
    check("Mobile: hamburger nav opens and navigates", t6_mobile)
    mctx.close()
    browser.close()

fails = [r for r in results if not r[0]]
for ok, name, detail in results:
    print(("PASS " if ok else "FAIL ") + name + (f"  -> {detail}" if detail else ""))
print(f"\n{len(results) - len(fails)}/{len(results)} interactive checks passed")
sys.exit(1 if fails else 0)
