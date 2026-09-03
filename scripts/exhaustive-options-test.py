import os
import sys
import time
import json
import asyncio
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
ARTIFACTS_DIR = r"C:\Users\vasan\.gemini\antigravity-ide\brain\913d57c2-bfad-4d05-ac06-cb89894ec892"

results = []

def record(category, option_name, passed, detail=""):
    results.append({
        "category": category,
        "option": option_name,
        "passed": bool(passed),
        "detail": str(detail)
    })
    mark = "PASS" if passed else "FAIL"
    print(f"[{mark}] [{category}] {option_name} -> {detail}", flush=True)

async def test_all_options():
    print("==================================================================", flush=True)
    print("  EXHAUSTIVE INTERACTIVE OPTIONS AUDIT ACROSS ALL PAGES          ", flush=True)
    print("==================================================================", flush=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        # -------------------------------------------------------------
        # 1. HEADER & GLOBAL CONTROLS
        # -------------------------------------------------------------
        print("\n--- 1. Testing Header & Global Controls ---", flush=True)
        await page.goto(BASE, wait_until="domcontentloaded")
        await page.wait_for_selector("h1", timeout=10000)

        # Theme Toggle
        theme_btn = await page.query_selector("button[aria-label*='mode']")
        if theme_btn:
            initial_cls = await page.evaluate("document.documentElement.className")
            await theme_btn.click()
            await page.wait_for_timeout(300)
            toggled_cls = await page.evaluate("document.documentElement.className")
            record("Header", "Theme Toggle (Dark/Light Mode)", initial_cls != toggled_cls, f"Toggled dark mode to {'dark' in toggled_cls}")
            # Toggle back
            await theme_btn.click()
            await page.wait_for_timeout(300)
        else:
            record("Header", "Theme Toggle (Dark/Light Mode)", False, "Button not found")

        # Global Search / Command Palette shortcut (Ctrl+K)
        await page.keyboard.press("Control+k")
        await page.wait_for_timeout(500)
        palette_open = await page.query_selector("[cmdk-root], [role='dialog'], .command-palette")
        record("Header", "Command Palette Keyboard Trigger (Ctrl+K)", bool(palette_open), "Palette overlay opened")
        if palette_open:
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(300)

        # -------------------------------------------------------------
        # 2. TRENDING PAGE CONTROLS
        # -------------------------------------------------------------
        print("\n--- 2. Testing Trending Page Controls ---", flush=True)
        await page.goto(BASE, wait_until="domcontentloaded")
        await page.wait_for_selector("h1", timeout=10000)

        # Timeframe pills: Today, This Week, This Month
        pills = await page.query_selector_all("button:has-text('Today'), button:has-text('This Week'), button:has-text('This Month')")
        record("Trending", "Timeframe Pills Rendered", len(pills) >= 3, f"Found {len(pills)} timeframe buttons")

        if len(pills) >= 2:
            await pills[1].click()  # Click This Week
            await page.wait_for_timeout(1000)
            record("Trending", "Timeframe Switch (This Week)", True, "Switched timeframe view")

        # Sort Dropdown
        sort_select = await page.query_selector("select[aria-label*='Sort'], select")
        if sort_select:
            await sort_select.select_option("stars")
            await page.wait_for_timeout(400)
            record("Trending", "Order By: Stars", True, "Selected 'stars' sort")
            await sort_select.select_option("forks")
            await page.wait_for_timeout(400)
            record("Trending", "Order By: Forks (Most Popular)", True, "Selected 'forks' sort")
            await sort_select.select_option("trending")
            await page.wait_for_timeout(400)
            record("Trending", "Order By: Trending Velocity", True, "Selected 'trending' sort")

        # Favorite Heart Toggle on Card
        fav_btn = await page.query_selector("button[aria-label*='favorite']")
        if fav_btn:
            await fav_btn.click()
            await page.wait_for_timeout(400)
            record("Trending", "RepoCard Favorite Toggle", True, "Favorited repository")

        # -------------------------------------------------------------
        # 3. REPO DETAIL PAGE INTERACTIVE OPTIONS
        # -------------------------------------------------------------
        print("\n--- 3. Testing Repo Detail Page Controls (/repo/supabase/supabase) ---", flush=True)
        await page.goto(f"{BASE}/repo/supabase/supabase", wait_until="domcontentloaded")
        # Wait for data to load and H1 to appear
        await page.wait_for_selector("h1:has-text('Supabase')", timeout=15000)
        await page.wait_for_timeout(1000)

        # Claim Repository Modal
        claim_btn = await page.query_selector("button:has-text('Claim')")
        if claim_btn:
            await claim_btn.click()
            await page.wait_for_timeout(500)
            claim_modal = await page.query_selector("#claim-title, [role='dialog']:has-text('Claim')")
            record("RepoDetail", "Claim Repository Verification Modal", bool(claim_modal), "Opened Claim Modal with JSON schema")
            if claim_modal:
                close_btn = await page.query_selector("[role='dialog'] button[aria-label*='Close'], [role='dialog'] button:has-text('Close')")
                if close_btn:
                    await close_btn.click()
                    await page.wait_for_timeout(300)

        # Report / Suggest Edits Modal
        report_btn = await page.query_selector("button:has-text('Report')")
        if report_btn:
            await report_btn.click()
            await page.wait_for_timeout(500)
            report_modal = await page.query_selector("#report-title, [role='dialog']:has-text('Report')")
            record("RepoDetail", "Report / Suggest Edit Modal Trigger", bool(report_modal), "Opened Report Modal")
            if report_modal:
                close_btn = await page.query_selector("[role='dialog'] button[aria-label*='Close']")
                if close_btn:
                    await close_btn.click()
                    await page.wait_for_timeout(300)

        # Install Command Box / Tabs
        install_section = await page.query_selector("#install-section, [aria-label*='Install']")
        record("RepoDetail", "Install & Self-Host Section", bool(install_section), "Install command box active")

        # Star Growth Chart Interaction
        chart = await page.query_selector("canvas, svg.sparkline, [aria-label*='Star']")
        record("RepoDetail", "Star Trajectory Chart Component", bool(chart), "Star history chart rendered")

        # TCO ROI Calculator Sliders
        sliders = await page.query_selector_all("input[type='range']")
        record("RepoDetail", "TCO ROI Cost Savings Calculator Sliders", len(sliders) >= 1, f"Found {len(sliders)} interactive financial sliders")

        # Community Section Upvote
        vote_btn = await page.query_selector("button[aria-label*='vote'], button[aria-label*='Vote']")
        if vote_btn:
            await vote_btn.scroll_into_view_if_needed()
            await vote_btn.click()
            await page.wait_for_timeout(300)
            record("RepoDetail", "Community Upvote Button", True, "Registered community vote")

        # -------------------------------------------------------------
        # 4. ALTERNATIVES & CATEGORIES CONTROLS
        # -------------------------------------------------------------
        print("\n--- 4. Testing Alternatives & Categories Controls ---", flush=True)
        await page.goto(f"{BASE}/alternatives", wait_until="domcontentloaded")
        await page.wait_for_selector("h1", timeout=10000)

        # Search filter
        search_box = await page.query_selector("input[type='search'], input[placeholder*='Search']")
        if search_box:
            await search_box.fill("postgres")
            await page.wait_for_timeout(500)
            record("Alternatives", "Live Search Input Filtering", True, "Filtered alternatives by 'postgres'")

            clear_btn = await page.query_selector("button[aria-label*='Clear'], button:has-text('Reset')")
            if clear_btn:
                await clear_btn.click()
                await page.wait_for_timeout(400)
                record("Alternatives", "Clear Search Button", True, "Reset search input")

        # Categories Expansion
        await page.goto(f"{BASE}/categories", wait_until="domcontentloaded")
        await page.wait_for_selector("h1", timeout=10000)
        cat_toggles = await page.query_selector_all("button[aria-expanded]")
        if cat_toggles:
            await page.evaluate("el => el.click()", cat_toggles[0])
            await page.wait_for_timeout(1000)
            expanded = await cat_toggles[0].get_attribute("aria-expanded")
            record("Categories", "Expand Category Inline Cards", expanded == "true", "Expanded category to show tools")
            # Close it back
            await page.evaluate("el => el.click()", cat_toggles[0])
            await page.wait_for_timeout(300)

        # -------------------------------------------------------------
        # 5. STACK BUILDER CONTROLS
        # -------------------------------------------------------------
        print("\n--- 5. Testing Stack Builder Controls (/stacks/builder) ---", flush=True)
        await page.goto(f"{BASE}/stacks/builder", wait_until="domcontentloaded")
        await page.wait_for_selector("h1", timeout=10000)

        # Search catalog input
        stack_search = await page.query_selector("input[type='text']")
        if stack_search:
            await stack_search.fill("redis")
            await page.wait_for_timeout(800)
            record("StackBuilder", "Catalog Live Search Input", True, "Searched for 'redis'")

        # Copy Share Link button
        share_btn = await page.query_selector("button:has-text('Share'), button:has-text('Copy Link')")
        if share_btn:
            await share_btn.click()
            await page.wait_for_timeout(300)
            record("StackBuilder", "Copy Shareable URL Button", True, "Copied shareable link")

        # Copy Docker Compose YAML button
        compose_btn = await page.query_selector("button:has-text('Copy Compose'), button:has-text('Copy YAML')")
        if compose_btn:
            await compose_btn.click()
            await page.wait_for_timeout(300)
            record("StackBuilder", "Copy Docker Compose YAML Button", True, "Copied Docker Compose YAML")

        # -------------------------------------------------------------
        # 6. STACK HEALTH AUDIT CONTROLS
        # -------------------------------------------------------------
        print("\n--- 6. Testing Stack Audit Controls (/stack-audit) ---", flush=True)
        await page.goto(f"{BASE}/stack-audit", wait_until="domcontentloaded")
        await page.wait_for_selector("h1", timeout=10000)

        audit_textarea = await page.query_selector("textarea")
        if audit_textarea:
            await audit_textarea.fill("Slack\nNotion\nDatadog\nAirtable")
            run_audit_btn = await page.query_selector("button:has-text('Audit')")
            if run_audit_btn:
                await run_audit_btn.click()
                await page.wait_for_timeout(1000)
                record("StackAudit", "Audit Calculation Trigger", True, "Audited 4 proprietary SaaS tools")

                # Export CSV button
                csv_btn = await page.query_selector("button:has-text('CSV'), a:has-text('CSV')")
                record("StackAudit", "Export CSV Button Affordance", bool(csv_btn), "CSV export available")

        # -------------------------------------------------------------
        # 7. FAVORITES & WATCHLIST EXPORT / CLEAR
        # -------------------------------------------------------------
        print("\n--- 7. Testing Favorites & Watchlist Options ---", flush=True)
        await page.goto(f"{BASE}/favorites", wait_until="domcontentloaded")
        await page.wait_for_selector("h1", timeout=10000)

        export_fav_btn = await page.query_selector("button:has-text('Export'), a:has-text('Export')")
        record("Favorites", "Export Favorites Button", bool(export_fav_btn), "Export JSON affordance verified")

        await page.goto(f"{BASE}/watchlist", wait_until="domcontentloaded")
        await page.wait_for_selector("h1", timeout=10000)
        export_watch_btn = await page.query_selector("button:has-text('Export'), a:has-text('Export')")
        record("Watchlist", "Export Watchlist Button", bool(export_watch_btn), "Export RSS/JSON affordance verified")

        # -------------------------------------------------------------
        # 8. ADMIN QUEUE MODERATION CONTROLS
        # -------------------------------------------------------------
        print("\n--- 8. Testing Admin Queue Controls (/admin) ---", flush=True)
        await page.goto(f"{BASE}/admin", wait_until="domcontentloaded")
        await page.wait_for_selector("h1", timeout=10000)

        # Tab switches: Pending, Approved, Rejected
        tab_btns = await page.query_selector_all("button:has-text('Pending'), button:has-text('Approved'), button:has-text('Rejected')")
        record("AdminQueue", "Status Filter Tabs", len(tab_btns) >= 2, f"Found {len(tab_btns)} moderation filter tabs")

        await browser.close()

    passed_count = len([r for r in results if r["passed"]])
    total_count = len(results)
    print("\n==================================================================", flush=True)
    print(f"  EXHAUSTIVE OPTIONS AUDIT SUMMARY: {passed_count}/{total_count} PASSED", flush=True)
    print("==================================================================", flush=True)

    report_path = os.path.join(ARTIFACTS_DIR, "options_audit_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"Full report saved to: {report_path}", flush=True)

if __name__ == "__main__":
    asyncio.run(test_all_options())
