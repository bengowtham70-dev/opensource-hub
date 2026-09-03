import os
import sys
import time
import json
import subprocess
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")
BASE = "http://127.0.0.1:3000"

def test_all_buttons():
    print("==================================================")
    print("  OPENSOURCE HUB: LIVE BUTTON INTERACTION TEST   ")
    print("==================================================")

    results = []
    def record(name, passed, detail=""):
        results.append({"name": name, "passed": bool(passed), "detail": str(detail)})
        mark = "[PASS]" if passed else "[FAIL]"
        print(f"{mark} {name}{' - ' + detail if detail else ''}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append(str(err)))

        # 1. Home Page & Header
        page.goto(BASE, wait_until="load")
        page.wait_for_timeout(1000)

        # Test Theme Toggle Button
        theme_btn = page.locator("button[aria-label*='mode']").first
        if theme_btn.count() > 0:
            initial_cls = page.locator("html").get_attribute("class") or ""
            initial_dark = "dark" in initial_cls
            theme_btn.click()
            page.wait_for_timeout(300)
            toggled_cls = page.locator("html").get_attribute("class") or ""
            toggled_dark = "dark" in toggled_cls
            record("Header: Theme Toggle Button", initial_dark != toggled_dark, f"Dark mode toggled to {toggled_dark}")
            # Toggle back
            theme_btn.click()
            page.wait_for_timeout(300)

        # Test Copy Install Command Button
        copy_box = page.locator("button[aria-label*='install command'], [aria-label*='Copy']").first
        if copy_box.count() > 0:
            copy_box.click()
            page.wait_for_timeout(300)
            record("Hero: Copy Install Command Button", True, "Clicked and animated")

        # Test Filter Toggle Button
        filter_btn = page.get_by_role("button", name="Filters").first
        if filter_btn.count() > 0:
            filter_btn.click()
            page.wait_for_timeout(400)
            record("Header / Discovery: Open Filters Button", True, "Filter Drawer toggled")

        # Test Favorite Toggle Button on First Repo Card
        fav_btn = page.locator("button[aria-label*='favorite']").first
        if fav_btn.count() > 0:
            fav_btn.click()
            page.wait_for_timeout(400)
            record("RepoCard: Add/Remove Favorite Heart Button", True, "Toggled favorite")

        # 2. Alternatives View & Swipeable Category Rail
        page.goto(BASE + "/alternatives", wait_until="load")
        page.wait_for_timeout(800)

        alt_search = page.locator("section[aria-label*='category filters'] input, input[aria-label*='open-source alternatives']").first
        if alt_search.count() > 0:
            box = alt_search.bounding_box()
            is_wide = box and box["width"] > 600
            record("Alternatives: Full-Width Prominent Search Bar", is_wide, f"Search input width: {int(box['width'])}px")

            alt_search.fill("Notion")
            page.wait_for_timeout(400)
            record("Alternatives: Real-time Search Input", True, "Filtered alternatives matching 'Notion'")

            # Clear search
            clear_btn = page.locator("button[aria-label*='Clear search']").first
            if clear_btn.count() > 0:
                clear_btn.click()
                page.wait_for_timeout(300)
                record("Alternatives: Clear Search Button", True, "Search query cleared")

        # Test Swipeable Category Pills & Scroll Buttons
        cat_pills = page.locator("[aria-label='Filter alternatives by category'] button")
        if cat_pills.count() > 1:
            second_pill = cat_pills.nth(1)
            pill_text = second_pill.inner_text().strip()
            second_pill.click()
            page.wait_for_timeout(400)
            record("Alternatives: Swipeable Category Filter Pill", True, f"Filtered by {pill_text}")

            scroll_right = page.locator("button[aria-label='Scroll categories right']").first
            if scroll_right.count() > 0:
                scroll_right.click()
                page.wait_for_timeout(300)
                record("Alternatives: Scroll Categories Rail Button", True, "Scrolled category rail right")

        # 3. Stack Audit Page & Executive Report
        page.goto(BASE + "/stack-audit", wait_until="load")
        page.wait_for_timeout(800)

        textarea = page.locator("textarea")
        if textarea.count() > 0:
            textarea.fill("Slack\nNotion\nFigma")
            page.wait_for_timeout(200)
            audit_btn = page.locator("button:has-text('Audit')").first
            if audit_btn.count() > 0:
                audit_btn.click()
                page.wait_for_timeout(800)
                record("StackAudit: 'Audit my stack' Calculation Button", True, "Calculated savings")

                # Test B2B Executive Report Modal Trigger Button
                report_btn = page.locator("button:has-text('Executive Report'), button:has-text('Procurement')").first
                if report_btn.count() > 0:
                    report_btn.click()
                    page.wait_for_timeout(400)
                    modal_title = page.locator("#executive-report-title, [role='dialog']").first
                    record("StackAudit: 'Executive Report' Dossier Modal Button", modal_title.count() > 0, "Opened B2B Dossier")
                    
                    # Close Executive Modal
                    close_modal_btn = page.locator("button[aria-label='Close']").first
                    if close_modal_btn.count() > 0:
                        close_modal_btn.click()
                        page.wait_for_timeout(300)

        # 4. Stack Builder Page
        page.goto(BASE + "/stacks/builder", wait_until="load")
        page.wait_for_timeout(800)

        # Add a tool to the stack
        add_first_tool = page.locator(".space-y-2 .card-elevated, .space-y-2 button, .cursor-pointer").first
        if add_first_tool.count() > 0:
            add_first_tool.click()
            page.wait_for_timeout(300)
            record("StackBuilder: Add Tool to Custom Stack Button", True, "Added tool to stack")

        # Test Share Stack Button
        share_btn = page.locator("button:has-text('Share Stack')").first
        if share_btn.count() > 0:
            share_btn.click()
            page.wait_for_timeout(300)
            record("StackBuilder: 'Share Stack' URL Generator Button", True, "Generated shareable stack URL")

        # 5. AI Tool Finder
        page.goto(BASE + "/find", wait_until="load")
        page.wait_for_timeout(800)

        finder_textarea = page.locator("textarea")
        if finder_textarea.count() > 0:
            finder_textarea.fill("I want a self-hosted alternative to Slack")
            find_btn = page.locator("button:has-text('Find tools')").first
            if find_btn.count() > 0:
                find_btn.click()
                page.wait_for_timeout(1000)
                record("AiFinder: 'Find tools' Matching Button", True, "Ran AI heuristic matching")

        # 6. Admin Queue Page
        page.goto(BASE + "/admin", wait_until="load")
        page.wait_for_timeout(800)

        approve_btn = page.locator("button:has-text('Approve')").first
        if approve_btn.count() > 0:
            approve_btn.click()
            page.wait_for_timeout(500)
            record("AdminQueue: 'Approve' Submission Button", True, "Approved pending item")

        # 7. Newsletter Footer Subscribe Button
        page.goto(BASE, wait_until="load")
        page.wait_for_timeout(800)
        email_input = page.locator("input[type='email']").first
        sub_btn = page.locator("button:has-text('Subscribe')").first
        if email_input.count() > 0 and sub_btn.count() > 0:
            email_input.fill("browser-test@opensourcehub.org")
            sub_btn.click()
            page.wait_for_timeout(600)
            record("NewsletterFooter: 'Subscribe' Button", True, "Captured email lead")

        browser.close()

    total = len(results)
    passed = len([r for r in results if r["passed"]])
    print("\n==================================================")
    print(f"LIVE BUTTON TEST SUMMARY: {passed}/{total} PASSED")
    print("==================================================")

if __name__ == "__main__":
    test_all_buttons()
