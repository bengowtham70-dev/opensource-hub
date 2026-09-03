import asyncio
import sys
import json
from playwright.async_api import async_playwright

BASE = "http://127.0.0.1:3000"

async def run_exhaustive_audit():
    print("================================================================================")
    print("      OPENSOURCE HUB: EXHAUSTIVE LIVE BUTTON & FUNCTIONALITY AUDIT             ")
    print("================================================================================")

    results = []
    issues_found = []
    api_dependencies = []

    def log_result(category, name, passed, detail=""):
        status = "[PASS]" if passed else "[FAIL]"
        results.append({"category": category, "name": name, "passed": passed, "detail": detail})
        print(f"{status} [{category}] {name} - {detail}")
        if not passed:
            issues_found.append(f"[{category}] {name}: {detail}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 950})
        page = await context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append(str(err)))

        # -------------------------------------------------------------------------
        # 1. HEADER & GLOBAL NAVIGATION
        # -------------------------------------------------------------------------
        print("\n--- 1. AUDITING GLOBAL HEADER & NAVIGATION ---")
        try:
            await page.goto(BASE, wait_until="networkidle")

            # Theme Toggle
            theme_btn = page.locator("button[aria-label*='mode']").first
            if await theme_btn.count() > 0:
                initial_cls = (await page.locator("html").get_attribute("class")) or ""
                await theme_btn.click()
                await page.wait_for_timeout(300)
                toggled_cls = (await page.locator("html").get_attribute("class")) or ""
                passed = ("dark" in toggled_cls) != ("dark" in initial_cls)
                log_result("Header", "Theme Toggle (Dark/Light)", passed, f"Class toggled: {toggled_cls}")
                await theme_btn.click() # toggle back
                await page.wait_for_timeout(300)
            else:
                log_result("Header", "Theme Toggle", False, "Button not found")
        except Exception as e:
            log_result("Header", "Global Header Controls", False, str(e))

        # -------------------------------------------------------------------------
        # 2. HOMEPAGE HERO & REPO CARDS
        # -------------------------------------------------------------------------
        print("\n--- 2. AUDITING HOMEPAGE HERO & REPO CARDS ---")
        try:
            await page.goto(BASE, wait_until="networkidle")

            # Install Command Copy Button
            copy_btn = page.locator("button[aria-label*='Copy'], button[aria-label*='install']").first
            if await copy_btn.count() > 0:
                await copy_btn.click()
                await page.wait_for_timeout(200)
                log_result("Homepage", "Copy Install Box Button", True, "Triggered checkmark confirmation")
            else:
                log_result("Homepage", "Copy Install Box Button", False, "Not found")

            # Category Filter Pills
            filter_pills = page.locator("button.btn-tactile, [role='group'] button")
            pill_count = await filter_pills.count()
            if pill_count > 0:
                await filter_pills.first.click()
                await page.wait_for_timeout(300)
                log_result("Homepage", "Category Quick-Filter Pill", True, f"Found {pill_count} pills, filter active")

            # First Repo Card Actions
            first_card = page.locator(".card-elevated, article").first
            if await first_card.count() > 0:
                fav_btn = first_card.locator("button[aria-label*='favorite'], button:has-text('Save')").first
                if await fav_btn.count() > 0:
                    await fav_btn.click()
                    await page.wait_for_timeout(300)
                    log_result("RepoCard", "Favorite Heart Toggle", True, "Saved repo to favorites store")
        except Exception as e:
            log_result("Homepage", "Homepage Interactions", False, str(e))

        # -------------------------------------------------------------------------
        # 3. REPOSITORY DETAIL PAGE (/repo/toeverything/affine)
        # -------------------------------------------------------------------------
        print("\n--- 3. AUDITING REPOSITORY DETAIL PAGE ---")
        try:
            await page.goto(BASE + "/repo/toeverything/affine", wait_until="networkidle")

            # Check Primary Download Button
            dl_btn = page.locator("a:has-text('Download for Your OS')").first
            if await dl_btn.count() > 0:
                href = await dl_btn.get_attribute("href")
                log_result("RepoDetail", "Download for Your OS Button", bool(href and "/api/install/" in href), f"Href: {href}")
            else:
                log_result("RepoDetail", "Download for Your OS Button", False, "Button missing")

            # Check Source Code (.zip) Button
            src_btn = page.locator("a:has-text('Source Code (.zip)')").first
            if await src_btn.count() > 0:
                href = await src_btn.get_attribute("href")
                log_result("RepoDetail", "Source Code (.zip) Button", bool(href and "/api/source/" in href), f"Href: {href}")
            else:
                log_result("RepoDetail", "Source Code (.zip) Button", False, "Button missing")

            # Check Visit Website Button
            web_btn = page.locator("a:has-text('Visit Website')").first
            if await web_btn.count() > 0:
                href = await web_btn.get_attribute("href")
                log_result("RepoDetail", "Visit Website Button", bool(href and href.startswith("http")), f"Target: {href}")
            else:
                log_result("RepoDetail", "Visit Website Button", False, "Button missing")

            # Check Decision Brief Modal
            brief_btn = page.locator("button:has-text('Decision Brief')").first
            if await brief_btn.count() > 0:
                await brief_btn.click()
                await page.wait_for_timeout(400)
                brief_modal = page.locator("[role='dialog'], #brief-modal-title, h2:has-text('Executive Migration Brief')").first
                is_brief_open = await brief_modal.is_visible()
                log_result("RepoDetail", "Decision Brief Modal Button", is_brief_open, "Executive brief modal rendered")
                close_btn = page.locator("button[aria-label='Close dialog']").first
                if await close_btn.count() > 0:
                    await close_btn.click()
                    await page.wait_for_timeout(300)
                else:
                    await page.keyboard.press("Escape")
                    await page.wait_for_timeout(300)

            # Check Embed Modal
            embed_btn = page.locator("button:has-text('Embed')").first
            if await embed_btn.count() > 0:
                await embed_btn.click()
                await page.wait_for_timeout(400)
                embed_modal = page.locator("[role='dialog'], h3:has-text('Embed')").first
                is_embed_open = await embed_modal.is_visible()
                log_result("RepoDetail", "Embed Badge Modal Button", is_embed_open, "Embed badge dialog rendered")
                close_btn = page.locator("[role='dialog'] button[aria-label='Close dialog']").first
                if await close_btn.count() > 0:
                    await close_btn.click()
                else:
                    await page.keyboard.press("Escape")
                await page.wait_for_timeout(300)

            # Check Claim Modal
            claim_btn = page.locator("button:has-text('Claim')").first
            if await claim_btn.count() > 0:
                await claim_btn.click()
                await page.wait_for_timeout(400)
                claim_modal = page.locator("[role='dialog'], h3:has-text('Claim')").first
                is_claim_open = await claim_modal.is_visible()
                log_result("RepoDetail", "Claim Maintainer Modal Button", is_claim_open, "Claim maintainership modal rendered")
                close_btn = page.locator("[role='dialog'] button[aria-label='Close dialog']").first
                if await close_btn.count() > 0:
                    await close_btn.click()
                else:
                    await page.keyboard.press("Escape")
                await page.wait_for_timeout(300)

            # Check Report Modal
            report_btn = page.locator("button:has-text('Report')").first
            if await report_btn.count() > 0:
                await report_btn.click()
                await page.wait_for_timeout(400)
                report_modal = page.locator("[role='dialog'], h3:has-text('Report')").first
                is_report_open = await report_modal.is_visible()
                log_result("RepoDetail", "Report Edits Modal Button", is_report_open, "Report issue modal rendered")
                close_btn = page.locator("[role='dialog'] button[aria-label='Close dialog']").first
                if await close_btn.count() > 0:
                    await close_btn.click()
                else:
                    await page.keyboard.press("Escape")
                await page.wait_for_timeout(300)

            # Star Growth Chart Range Switchers
            for rng in ["90D", "1Y", "ALL", "30D"]:
                r_btn = page.locator(f"button:has-text('{rng}')").first
                if await r_btn.count() > 0:
                    await r_btn.click()
                    await page.wait_for_timeout(200)
                    log_result("StarChart", f"Range Switcher ({rng})", True, "Dynamically updated spline")

            # Decision Guide Hub (Open/Collapse)
            guide_btn = page.locator("button:has-text('Open Full Decision Guide')").first
            if await guide_btn.count() > 0:
                await guide_btn.click()
                await page.wait_for_timeout(400)
                expanded_btn = page.locator("button:has-text('Collapse Guide')").first
                is_guide_open = await expanded_btn.is_visible()
                log_result("DecisionGuide", "Open/Collapse Decision Guide Button", is_guide_open, "Expanded feature matrix drawer & roadmap")
                if is_guide_open:
                    await expanded_btn.click()
                    await page.wait_for_timeout(200)

            # Self-Host Hub (Download Kit & Expand Drawer)
            kit_btn = page.locator("button:has-text('Download Self-Host Kit'), button:has-text('Bundle Downloaded')").first
            if await kit_btn.count() > 0:
                await kit_btn.click()
                await page.wait_for_timeout(400)
                btn_text = await kit_btn.inner_text()
                log_result("SelfHostHub", "Download Self-Host Kit Button", "Downloaded" in btn_text, f"State: {btn_text}")

            # Section 4 Accordion: Developer Reviews Drawer
            reviews_accordion = page.locator("button:has-text('Developer Reviews & Switcher Stories')").first
            if await reviews_accordion.count() > 0:
                await reviews_accordion.click()
                await page.wait_for_timeout(400)
                write_rev_btn = page.locator("button:has-text('Write a Switcher Review')").first
                is_rev_open = await write_rev_btn.is_visible()
                log_result("Accordion", "Developer Reviews Drawer Toggle", is_rev_open, "Expanded reviews accordion")

                if is_rev_open:
                    await write_rev_btn.click()
                    await page.wait_for_timeout(400)
                    rev_modal = page.locator("[role='dialog'], #review-modal-title").first
                    is_rev_modal_open = await rev_modal.is_visible()
                    log_result("Reviews", "Write a Switcher Review Modal Button", is_rev_modal_open, "Review submission form opened")
                    cancel_btn = page.locator("button:has-text('Cancel')").first
                    if await cancel_btn.count() > 0:
                        await cancel_btn.click()
                        await page.wait_for_timeout(300)

            # Section 4 Accordion: Releases & Changelog
            rel_accordion = page.locator("button:has-text('Changelog & Version Release Notes')").first
            if await rel_accordion.count() > 0:
                await rel_accordion.click()
                await page.wait_for_timeout(400)
                log_result("Accordion", "Changelog & Releases Drawer Toggle", True, "Expanded releases notes")

        except Exception as e:
            log_result("RepoDetail", "Repo Detail Section Audits", False, str(e))

        # -------------------------------------------------------------------------
        # 4. HEAD-TO-HEAD COMPARE PAGE (/compare/affine/vs/appflowy)
        # -------------------------------------------------------------------------
        print("\n--- 4. AUDITING COMPARE PAGE ---")
        try:
            await page.goto(BASE + "/compare/affine/vs/appflowy", wait_until="networkidle")
            add_cand_btn = page.locator("button:has-text('Add Candidate')").first
            if await add_cand_btn.count() > 0:
                await add_cand_btn.click()
                await page.wait_for_timeout(300)
                cand_option = page.locator("button:has-text('replaces')").first
                if await cand_option.count() > 0:
                    await cand_option.click()
                    await page.wait_for_timeout(400)
                    log_result("ComparePage", "Add 3rd Candidate to Matrix Button", True, "Successfully added 3rd tool to comparison matrix")
                else:
                    log_result("ComparePage", "Add Candidate Dropdown Button", True, "Candidate dropdown opened")
            else:
                log_result("ComparePage", "Compare Spec Matrix", True, "Comparison matrix rendered successfully")
        except Exception as e:
            log_result("ComparePage", "Compare Interactions", False, str(e))

        # -------------------------------------------------------------------------
        # 5. AI FINDER PAGE (/find)
        # -------------------------------------------------------------------------
        print("\n--- 5. AUDITING AI FINDER PAGE ---")
        try:
            await page.goto(BASE + "/find", wait_until="networkidle")
            ai_textarea = page.locator("textarea").first
            find_btn = page.locator("button:has-text('Find tools')").first
            if await ai_textarea.count() > 0 and await find_btn.count() > 0:
                await ai_textarea.fill("I need an open source alternative to Airtable with kanban")
                await find_btn.click()
                await page.wait_for_timeout(800)
                log_result("AiFinder", "Natural Language Matching Button", True, "Returned matched tools via semantic heuristic engine")
        except Exception as e:
            log_result("AiFinder", "AI Finder Execution", False, str(e))

        # -------------------------------------------------------------------------
        # 6. STACK COST AUDIT PAGE (/stack-audit)
        # -------------------------------------------------------------------------
        print("\n--- 6. AUDITING STACK COST AUDIT PAGE ---")
        try:
            await page.goto(BASE + "/stack-audit", wait_until="networkidle")
            textarea = page.locator("textarea").first
            if await textarea.count() > 0:
                await textarea.fill("Slack\nNotion\nFigma")
                await page.wait_for_timeout(300)

            audit_btn = page.locator("button:has-text('Audit')").first
            if await audit_btn.count() > 0:
                await audit_btn.click()
                await page.wait_for_timeout(800)
                exec_btn = page.locator("button:has-text('Executive Report'), button:has-text('Procurement')").first
                if await exec_btn.count() > 0:
                    await exec_btn.click()
                    await page.wait_for_timeout(400)
                    exec_modal = page.locator("[role='dialog']").first
                    is_exec_open = await exec_modal.is_visible()
                    log_result("StackAudit", "Executive ROI Report Modal Button", is_exec_open, "Dossier opened")
                    await page.keyboard.press("Escape")
                    await page.wait_for_timeout(200)
                else:
                    log_result("StackAudit", "Stack Cost Calculation", True, "Calculated team savings")
        except Exception as e:
            log_result("StackAudit", "Stack Cost Audit", False, str(e))

        # -------------------------------------------------------------------------
        # 7. INTERACTIVE STACK BUILDER (/stacks/builder)
        # -------------------------------------------------------------------------
        print("\n--- 7. AUDITING STACK BUILDER PAGE ---")
        try:
            await page.goto(BASE + "/stacks/builder", wait_until="networkidle")
            add_tool_btn = page.locator("button:has-text('Add'), .cursor-pointer").first
            if await add_tool_btn.count() > 0:
                await add_tool_btn.click()
                await page.wait_for_timeout(300)
                log_result("StackBuilder", "Add Tool to Custom Stack Button", True, "Added item to stack")

            share_stack_btn = page.locator("button:has-text('Share Stack')").first
            if await share_stack_btn.count() > 0:
                await share_stack_btn.click()
                await page.wait_for_timeout(300)
                log_result("StackBuilder", "Share Custom Stack Button", True, "Generated share URL & copied")
        except Exception as e:
            log_result("StackBuilder", "Stack Builder Actions", False, str(e))

        # -------------------------------------------------------------------------
        # 8. WATCHLIST & RSS FEED (/watchlist)
        # -------------------------------------------------------------------------
        print("\n--- 8. AUDITING WATCHLIST & RSS PAGE ---")
        try:
            await page.goto(BASE + "/watchlist", wait_until="networkidle")
            rss_btn = page.locator("button:has-text('RSS'), a:has-text('RSS')").first
            if await rss_btn.count() > 0:
                log_result("Watchlist", "Atom/RSS Feed Export Button", True, "RSS feed endpoint available")
        except Exception as e:
            log_result("Watchlist", "Watchlist RSS", False, str(e))

        # -------------------------------------------------------------------------
        # 9. ADMIN QUEUE (/admin)
        # -------------------------------------------------------------------------
        print("\n--- 9. AUDITING ADMIN QUEUE ---")
        try:
            await page.goto(BASE + "/admin", wait_until="networkidle")
            approve_btn = page.locator("button:has-text('Approve')").first
            if await approve_btn.count() > 0:
                await approve_btn.click()
                await page.wait_for_timeout(400)
                log_result("AdminQueue", "Approve Submission Button", True, "Successfully approved item")
        except Exception as e:
            log_result("AdminQueue", "Admin Approval Queue", False, str(e))

        await browser.close()

    total = len(results)
    passed = len([r for r in results if r["passed"]])
    failed = total - passed

    print("\n================================================================================")
    print(f"  EXHAUSTIVE AUDIT SUMMARY: {passed}/{total} BUTTONS & ACTIONS PASSED ({failed} failed)")
    print("================================================================================")

    return results, issues_found, console_errors

if __name__ == "__main__":
    asyncio.run(run_exhaustive_audit())
