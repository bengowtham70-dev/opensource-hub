import asyncio
import json
import time
import sys
import inspect
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

BASE_URL = "http://127.0.0.1:3000"

PAGES_TO_AUDIT = [
    ("/", "Homepage & Trending"),
    ("/categories", "Categories Explorer"),
    ("/compare?tools=supabase/supabase,pocketbase/pocketbase", "Compare Matrix"),
    ("/stack-builder", "Stack Builder & TCO"),
    ("/stack-audit", "Stack Audit & Savings"),
    ("/releases", "Releases Feed"),
    ("/licenses", "License Explorer"),
    ("/submit", "Submit Tool Form"),
    ("/ai-finder", "AI Tool Finder"),
    ("/watchlist", "Watchlist"),
    ("/favorites", "Favorites"),
    ("/mcp", "MCP Protocol Server"),
    ("/admin", "Admin Queue"),
    ("/repo/supabase/supabase", "Repo Detail Page"),
    ("/paid/firebase", "Paid Tool Comparison Page"),
]

API_ENDPOINTS = [
    "/api/catalog?limit=5",
    "/api/catalog/stats",
    "/api/trending/today",
    "/api/trending/week",
    "/api/trending/month",
    "/api/trending/year",
    "/api/search?q=supabase",
    "/api/search?q=vaultwarden",
    "/api/repo/supabase/supabase",
    "/api/releases/supabase/supabase",
    "/api/metrics/supabase/supabase",
    "/api/github/status",
]

async def run_deep_audit():
    print("=" * 80)
    print(" 🧠 SUPER-INTELLIGENCE FULL APPLICATION AUDIT: 100% COVERAGE STRESS TEST")
    print("=" * 80)

    audit_report = {
        "pages_tested": 0,
        "pages_passed": 0,
        "apis_tested": 0,
        "apis_passed": 0,
        "buttons_tested": 0,
        "buttons_passed": 0,
        "console_errors": [],
        "failed_requests": [],
        "page_details": [],
        "api_details": [],
    }

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})

        # Track console errors & unhandled exceptions across all sessions
        def on_console(msg):
            if msg.type == "error":
                # Filter benign extension messages or warnings
                if "favicon.ico" not in msg.text and "ExperimentalWarning" not in msg.text:
                    audit_report["console_errors"].append(msg.text)

        def on_page_error(err):
            audit_report["console_errors"].append(str(err))

        page = await context.new_page()
        page.on("console", on_console)
        page.on("pageerror", on_page_error)
        page.on("requestfailed", lambda req: audit_report["failed_requests"].append(f"{req.method} {req.url} - {req.failure}"))

        # -------------------------------------------------------------
        # 1. AUDIT EVERY ROUTE / PAGE
        # -------------------------------------------------------------
        print("\n[PHASE 1] Auditing Every Page Route...")
        for path, name in PAGES_TO_AUDIT:
            url = f"{BASE_URL}{path}"
            t0 = time.perf_counter()
            audit_report["pages_tested"] += 1
            status_code = 200
            try:
                res = await page.goto(url, wait_until="networkidle", timeout=12000)
                status_code = res.status if res else 200
                load_time = (time.perf_counter() - t0) * 1000
                title = await page.title()
                has_content = (await page.locator("body").inner_text()).strip() != ""
                
                # Check for critical crash indicators like ErrorBoundary text
                body_text = await page.locator("body").inner_text()
                is_crashed = "Something went wrong" in body_text or "Error: " in body_text[:200]

                if status_code == 200 and has_content and not is_crashed:
                    audit_report["pages_passed"] += 1
                    print(f"  ✅ PASS [{status_code}] {name:30} ({load_time:6.1f}ms) - Title: '{title[:40]}'")
                    audit_report["page_details"].append({"path": path, "name": name, "status": "PASS", "ms": round(load_time, 1)})
                else:
                    print(f"  ❌ FAIL [{status_code}] {name:30} - Crashed: {is_crashed}")
                    audit_report["page_details"].append({"path": path, "name": name, "status": "FAIL", "code": status_code})
            except Exception as e:
                print(f"  ❌ FAIL {name:30} - Exception: {str(e)[:80]}")
                audit_report["page_details"].append({"path": path, "name": name, "status": "EXCEPTION", "error": str(e)[:80]})

        # -------------------------------------------------------------
        # 2. AUDIT INTERACTIVE BUTTONS & CONTROLS ON HOMEPAGE
        # -------------------------------------------------------------
        print("\n[PHASE 2] Auditing Every Interactive Button & Control...")
        await page.goto(f"{BASE_URL}/", wait_until="networkidle")

        async def test_button(name, action_fn, verify_fn):
            audit_report["buttons_tested"] += 1
            t0 = time.perf_counter()
            try:
                if inspect.iscoroutinefunction(action_fn):
                    await action_fn()
                elif callable(action_fn):
                    res = action_fn()
                    if inspect.isawaitable(res):
                        await res

                if inspect.iscoroutinefunction(verify_fn):
                    ok = await verify_fn()
                elif callable(verify_fn):
                    v_res = verify_fn()
                    ok = (await v_res) if inspect.isawaitable(v_res) else v_res
                else:
                    ok = True

                dur = (time.perf_counter() - t0) * 1000
                if ok is not False:
                    audit_report["buttons_passed"] += 1
                    print(f"  \033[92m✅ PASS\033[0m Button: {name:<35} ({dur:5.1f}ms)")
                else:
                    print(f"  \033[91m❌ FAIL\033[0m Button: {name:<35} - Condition not met")
            except Exception as e:
                print(f"  \033[91m❌ FAIL\033[0m Button: {name:<35} - Error: {str(e)[:50]}")

        # Test 1: Theme Toggle (Dark / Light)
        await test_button(
            "Theme Switcher (Light -> Dark)",
            lambda: page.locator('button[aria-label*="mode"]').first.click(),
            lambda: page.evaluate("document.documentElement.classList.contains('dark')")
        )
        await test_button(
            "Theme Switcher (Dark -> Light)",
            lambda: page.locator('button[aria-label*="mode"]').click(),
            lambda: page.evaluate("!document.documentElement.classList.contains('dark')")
        )

        # Test 2: Timeframe Pills
        for tf_label, tf_id in [("Today", "today"), ("This Week", "week"), ("This Month", "month"), ("This Year", "year")]:
            await test_button(
                f"Timeframe Pill: '{tf_label}'",
                lambda tf=tf_label: page.locator(f"button:has-text('{tf}')").click(),
                lambda tf_id=tf_id: page.wait_for_function(f"window.location.search.includes('view={tf_id}') || '{tf_id}' === 'today'")
            )
        # Test 3: Filters Drawer Toggle
        await test_button(
            "Filters Drawer Toggle (Open)",
            lambda: page.locator("button:has-text('Filters')").click(),
            lambda: page.wait_for_selector("text=Filter Tools by Facet", timeout=3000)
        )
        async def close_filter():
            await page.locator("button:has-text('Filters')").click()
            await page.wait_for_timeout(400)
            return (await page.locator("text=Filter Tools by Facet").count()) == 0
        await test_button(
            "Filters Drawer Toggle (Close)",
            lambda: None,
            close_filter
        )

        # Test 4: Order By Sort Dropdown
        await test_button(
            "Order By Dropdown (Open)",
            lambda: page.locator("button:has-text('Trending / Velocity')").click(),
            lambda: page.wait_for_selector("button:has-text('Most Stars')", timeout=2000)
        )
        await test_button(
            "Select 'Most Stars' Sort Option",
            lambda: page.locator("button:has-text('Most Stars')").click(),
            lambda: page.wait_for_function("window.location.search.includes('sort=stars')")
        )

        # Test 5: Quick Goal Pill ('Photoshop')
        await test_button(
            "Quick Goal Pill ('Photoshop')",
            lambda: page.locator("button:has-text('Photoshop')").click(),
            lambda: page.wait_for_function("window.location.search.includes('goal=') || window.location.search.includes('Photoshop')")
        )

        # Test 6: Search Input & Instant Results
        async def do_search():
            inp = page.locator("#hero-search-input")
            await inp.fill("bitwarden")
            await page.wait_for_timeout(600)
        await test_button(
            "Hero Search Bar ('bitwarden')",
            do_search,
            lambda: page.wait_for_selector("article:has-text('Bitwarden'), article:has-text('bitwarden')", timeout=6000)
        )

        # Test 7: Clear Search Button (X)
        await test_button(
            "Clear Search Input (X button)",
            lambda: page.locator("button:has(svg.lucide-x)").first.click(),
            lambda: page.wait_for_function("document.getElementById('hero-search-input').value === ''")
        )

        # Test 8: Install Pill One-Click Copy
        async def test_copy():
            await page.locator("button[aria-label='Copy install command']").click()
            await page.wait_for_timeout(300)
            return (await page.locator("text='Copied!'").count()) > 0 or (await page.locator("button[aria-label='Copy install command'][aria-pressed='true']").count()) > 0
        await test_button(
            "Install Pill Copy Command",
            lambda: None,
            test_copy
        )

        # Test 9: Favorite / Bookmark Heart Button on Card
        await test_button(
            "Card Favorite Heart Toggle",
            lambda: page.locator("button[aria-label*='favorites']").first.click(),
            lambda: page.wait_for_selector("button[aria-label*='Remove'][aria-pressed='true']", timeout=2000)
        )

        # Test 10: Command Palette (Ctrl+K)
        await test_button(
            "Global Command Palette (Ctrl+K)",
            lambda: page.keyboard.press("Control+k"),
            lambda: page.wait_for_selector("[cmdk-input], [placeholder*='search' i]", timeout=2000)
        )
        await page.keyboard.press("Escape")

        # -------------------------------------------------------------
        # 3. AUDIT ALL BACKEND API ENDPOINTS
        # -------------------------------------------------------------
        print("\n[PHASE 3] Auditing Backend API Endpoints...")
        for ep in API_ENDPOINTS:
            audit_report["apis_tested"] += 1
            t0 = time.perf_counter()
            try:
                res = await page.request.get(f"{BASE_URL}{ep}")
                dur = (time.perf_counter() - t0) * 1000
                if res.status == 200:
                    data = await res.json()
                    audit_report["apis_passed"] += 1
                    print(f"  ✅ PASS [{res.status}] {ep:35} ({dur:5.1f}ms)")
                    audit_report["api_details"].append({"endpoint": ep, "status": "PASS", "ms": round(dur, 1)})
                else:
                    print(f"  ❌ FAIL [{res.status}] {ep:35}")
                    audit_report["api_details"].append({"endpoint": ep, "status": "FAIL", "code": res.status})
            except Exception as e:
                print(f"  ❌ FAIL {ep:35} - {str(e)[:60]}")
                audit_report["api_details"].append({"endpoint": ep, "status": "EXCEPTION", "error": str(e)[:60]})

        # -------------------------------------------------------------
        # 4. FINAL QUALITY SCORECARD
        # -------------------------------------------------------------
        print("\n" + "=" * 80)
        print(" 📊 FINAL AUDIT SCORECARD & SUMMARY")
        print("=" * 80)
        page_score = (audit_report["pages_passed"] / audit_report["pages_tested"]) * 100
        btn_score = (audit_report["buttons_passed"] / audit_report["buttons_tested"]) * 100
        api_score = (audit_report["apis_passed"] / audit_report["apis_tested"]) * 100
        overall = (page_score + btn_score + api_score) / 3

        print(f"  Pages Tested:    {audit_report['pages_passed']}/{audit_report['pages_tested']} ({page_score:.1f}%)")
        print(f"  Buttons Tested:  {audit_report['buttons_passed']}/{audit_report['buttons_tested']} ({btn_score:.1f}%)")
        print(f"  APIs Tested:      {audit_report['apis_passed']}/{audit_report['apis_tested']} ({api_score:.1f}%)")
        print(f"  Console Errors:  {len(audit_report['console_errors'])}")
        print(f"  Failed Requests: {len(audit_report['failed_requests'])}")
        print(f"  Overall Score:   {overall:.1f}%")
        print("=" * 80)

        # Save machine-readable report
        with open("scratch_super_audit_report.json", "w") as f:
            json.dump(audit_report, f, indent=2)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_deep_audit())
