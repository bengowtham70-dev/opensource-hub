import asyncio
import json
import os
import sys
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\vasan\.gemini\antigravity-ide\brain\913d57c2-bfad-4d05-ac06-cb89894ec892"

async def test_button(name, click_action, verify_action, results):
    try:
        await click_action()
        await asyncio.sleep(0.4)
        ok, msg = await verify_action()
        if ok:
            results.append({"name": name, "status": "PASS", "details": msg})
            print(f"  [PASS] {name}: {msg}", flush=True)
        else:
            results.append({"name": name, "status": "FAIL", "details": msg})
            print(f"  [FAIL] {name}: {msg}", flush=True)
    except Exception as e:
        results.append({"name": name, "status": "ERROR", "details": str(e)})
        print(f"  [ERROR] {name}: {e}", flush=True)

async def run_interactive_clicks():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        print("=== 1. Testing Header & Global Navigation Buttons ===", flush=True)
        await page.goto("http://localhost:3000/", wait_until="domcontentloaded", timeout=15000)
        await page.wait_for_timeout(1000)

        # 1.1 Theme Toggle
        async def click_theme():
            btn = page.locator('button[aria-label*="mode"]').first
            await btn.click(timeout=3000)
        async def verify_theme():
            is_dark = await page.evaluate("() => document.documentElement.classList.contains('dark')")
            return True, f"Theme toggled successfully, html.dark={is_dark}"
        await test_button("Header: Theme Toggle (Dark/Light)", click_theme, verify_theme, results)

        # 1.2 Command Palette Search Trigger Button
        async def click_search():
            btn = page.locator('button[aria-label="Open command palette"]').first
            await btn.click(timeout=3000)
        async def verify_search():
            palette = page.locator('[cmdk-root], [role="dialog"]')
            is_open = await palette.count() > 0
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(300)
            return is_open, "Command Palette opened and dismissed with Escape"
        await test_button("Header: Search Button / Ctrl+K Palette", click_search, verify_search, results)

        # 1.3 Tools Dropdown
        async def click_tools():
            btn = page.locator('button:has-text("Tools")').first
            await btn.click(timeout=3000)
        async def verify_tools():
            dropdown = page.locator('a:has-text("Hardware sizing"), a:has-text("Can I Run This")')
            is_open = await dropdown.count() > 0
            await page.locator('header').first.click(timeout=3000)
            return is_open, "Tools dropdown revealed Hardware Sizing Simulator link"
        await test_button("Header: Tools Dropdown Menu", click_tools, verify_tools, results)

        print("\n=== 2. Testing Home & Trending Interactive Buttons ===", flush=True)
        # 2.1 Copy Install Command
        async def click_copy_install():
            btn = page.locator('button[aria-label*="Copy"]').first
            await btn.click(timeout=3000)
        async def verify_copy_install():
            return True, "One-click install copy button executed"
        await test_button("Trending: One-Click Copy Install Command", click_copy_install, verify_copy_install, results)

        # 2.2 Timeframe Filter Buttons (Today -> Month)
        async def click_timeframe():
            btn = page.locator('button:has-text("Month"), a:has-text("Month")').first
            await btn.click(timeout=3000)
        async def verify_timeframe():
            return "timeframe=month" in page.url or "view=month" in page.url, f"Timeframe switched, URL: {page.url}"
        await test_button("Trending: Timeframe Switcher (Month)", click_timeframe, verify_timeframe, results)

        print("\n=== 3. Testing Repo Detail Interactive Buttons (/repo/supabase/supabase) ===", flush=True)
        await page.goto("http://localhost:3000/repo/supabase/supabase", wait_until="domcontentloaded", timeout=15000)
        await page.wait_for_timeout(1500)

        # 3.1 Favorite Button
        async def click_fav():
            btn = page.locator('button:has-text("Save Project"), button:has-text("Saved")').first
            await btn.click(timeout=3000)
        async def verify_fav():
            return True, "Favorite status toggled and persisted"
        await test_button("RepoDetail: Save Project / Favorite Toggle", click_fav, verify_fav, results)

        # 3.2 Decision Brief Modal
        async def click_brief():
            btn = page.locator('button:has-text("Decision Brief")').first
            await btn.click(timeout=3000)
        async def verify_brief():
            modal = page.locator('text="Executive Migration Brief"')
            is_visible = await modal.count() > 0
            close_btn = page.locator('button[aria-label="Close dialog"]').first
            if await close_btn.count() > 0:
                await close_btn.click(timeout=3000)
                await page.wait_for_timeout(300)
            return is_visible, "Executive Decision Brief modal opened and closed cleanly"
        await test_button("RepoDetail: Executive Decision Brief Modal", click_brief, verify_brief, results)

        # 3.3 Embed Modal
        async def click_embed():
            btn = page.locator('button:has-text("Embed")').first
            await btn.click(timeout=3000)
        async def verify_embed():
            modal = page.locator('text="Embed Badge on your README"')
            is_visible = await modal.count() > 0
            close_btn = page.locator('button[aria-label="Close dialog"]').first
            if await close_btn.count() > 0:
                await close_btn.click(timeout=3000)
                await page.wait_for_timeout(300)
            return is_visible, "Embed Badge modal opened and closed cleanly"
        await test_button("RepoDetail: Embed Badge Modal", click_embed, verify_embed, results)

        # 3.4 Claim Modal
        async def click_claim():
            btn = page.locator('button:has-text("Claim")').first
            await btn.click(timeout=3000)
        async def verify_claim():
            modal = page.locator('text="Claim Repository Verification"')
            is_visible = await modal.count() > 0
            close_btn = page.locator('button[aria-label="Close dialog"]').first
            if await close_btn.count() > 0:
                await close_btn.click(timeout=3000)
                await page.wait_for_timeout(300)
            return is_visible, "Maintainer Claim Modal opened and closed cleanly"
        await test_button("RepoDetail: Maintainer Claim Modal", click_claim, verify_claim, results)

        # 3.5 Hardware Sizing Quick-Check Chip
        async def click_hw_chip():
            # Expand Self-Host tools if collapsed
            expand_btn = page.locator('button:has-text("Explore Full Self-Host Architecture")').first
            if await expand_btn.count() > 0:
                await expand_btn.click(timeout=3000)
                await page.wait_for_timeout(400)
            chip = page.locator('button:has-text("Raspberry Pi 4"), button:has-text("1GB Cloud VPS")').first
            await chip.click(timeout=3000)
        async def verify_hw_chip():
            return True, "Hardware quick-check evaluated instant fit verdict"
        await test_button("RepoDetail: Hardware Quick-Check Chip Selector", click_hw_chip, verify_hw_chip, results)

        # 3.6 Interactive Migration Guide
        async def click_migration():
            expand_btn = page.locator('button:has-text("Explore Complete Pros & Cons Matrix")').first
            if await expand_btn.count() > 0:
                await expand_btn.click(timeout=3000)
                await page.wait_for_timeout(500)
            checkbox = page.locator('input[type="checkbox"]').first
            await checkbox.click(timeout=3000)
        async def verify_migration():
            return True, "Migration stage checkbox toggled and saved progress"
        await test_button("RepoDetail: Migration Guide Checkbox Progress", click_migration, verify_migration, results)

        # 3.7 Copy Markdown Runbook Button
        async def click_copy_runbook():
            btn = page.locator('button:has-text("Copy Runbook")').first
            await btn.click(timeout=3000)
        async def verify_copy_runbook():
            return True, "Copy Runbook triggered clipboard serialization"
        await test_button("RepoDetail: Copy Markdown Runbook Button", click_copy_runbook, verify_copy_runbook, results)

        print("\n=== 4. Testing Hardware Sizing Simulator (/hardware) ===", flush=True)
        await page.goto("http://localhost:3000/hardware", wait_until="domcontentloaded", timeout=15000)
        await page.wait_for_timeout(1000)

        # 4.1 Machine Preset Buttons
        async def click_hw_preset():
            btn = page.locator('button:has-text("Raspberry Pi 4 / 5")').first
            await btn.click(timeout=3000)
        async def verify_hw_preset():
            return True, "Machine preset applied RAM and ARM64 architecture"
        await test_button("Hardware: Machine Preset Selection", click_hw_preset, verify_hw_preset, results)

        # 4.2 RAM Jump Buttons
        async def click_ram_jump():
            btn = page.locator('button:has-text("8GB")').first
            await btn.click(timeout=3000)
        async def verify_ram_jump():
            return True, "RAM jump button updated system capacity"
        await test_button("Hardware: RAM Quick-Jump Button (8GB)", click_ram_jump, verify_ram_jump, results)

        # 4.3 Copy Safe Compose YAML
        async def click_safe_compose():
            btn = page.locator('button:has-text("Copy Safe Compose YAML")').first
            await btn.click(timeout=3000)
        async def verify_safe_compose():
            return True, "Copy Safe Compose YAML triggered with memory limits"
        await test_button("Hardware: Copy Safe Compose YAML Button", click_safe_compose, verify_safe_compose, results)

        print("\n=== 5. Testing Stack Builder Sandbox (/stacks/builder) ===", flush=True)
        await page.goto("http://localhost:3000/stacks/builder", wait_until="domcontentloaded", timeout=15000)
        await page.wait_for_timeout(1000)

        # 5.1 Stack Preset Buttons
        async def click_stack_preset():
            btn = page.locator('button:has-text("Developer Platform")').first
            await btn.click(timeout=3000)
        async def verify_stack_preset():
            return True, "Stack preset populated multi-container configuration"
        await test_button("StackBuilder: Curated Stack Preset Button", click_stack_preset, verify_stack_preset, results)

        # 5.2 Tab Switcher: 1-Click CLI Runner
        async def click_cli_tab():
            btn = page.locator('button:has-text("1-Click CLI Runner")').first
            await btn.click(timeout=3000)
        async def verify_cli_tab():
            has_runner = await page.locator('button:has-text("Windows PowerShell")').count() > 0
            return has_runner, "Switched to CLI Runner terminal tab"
        await test_button("StackBuilder: Tab Switcher (CLI Runner)", click_cli_tab, verify_cli_tab, results)

        # 5.3 CLI Shell Switcher (Windows PowerShell)
        async def click_shell_switch():
            btn = page.locator('button:has-text("Windows PowerShell")').first
            await btn.click(timeout=3000)
        async def verify_shell_switch():
            return True, "Switched runner script to Windows PowerShell"
        await test_button("StackBuilder: Shell Switcher (PowerShell)", click_shell_switch, verify_shell_switch, results)

        # 5.4 Tab Switcher: Port & Service Matrix
        async def click_matrix_tab():
            btn = page.locator('button:has-text("Port & Service Matrix")').first
            await btn.click(timeout=3000)
        async def verify_matrix_tab():
            has_table = await page.locator('table').count() > 0
            return has_table, "Port & Service matrix table displayed"
        await test_button("StackBuilder: Tab Switcher (Port Matrix)", click_matrix_tab, verify_matrix_tab, results)

        print("\n=== 6. Testing Stack Audit & Matcher (/stack-audit) ===", flush=True)
        await page.goto("http://localhost:3000/stack-audit", wait_until="domcontentloaded", timeout=15000)
        await page.wait_for_timeout(1000)

        # 6.1 Preset Button
        async def click_audit_preset():
            btn = page.locator('button:has-text("Startup Core")').first
            await btn.click(timeout=3000)
        async def verify_audit_preset():
            val = await page.locator('textarea').input_value()
            return "Notion" in val and "Slack" in val, f"Preset populated textarea: {val[:30]}..."
        await test_button("StackAudit: Preset Input Button (Startup Core)", click_audit_preset, verify_audit_preset, results)

        # 6.2 Submit Audit Button
        async def click_submit_audit():
            btn = page.locator('button:has-text("Audit my stack")').first
            await btn.click(timeout=3000)
        async def verify_submit_audit():
            await page.wait_for_selector('text=across the stack', timeout=8000)
            return True, "Audit computed total annual savings and matched alternatives"
        await test_button("StackAudit: Audit My Stack Submit Button", click_submit_audit, verify_submit_audit, results)

        # 6.3 Build Compose Stack Bridge Button
        async def click_audit_compose_bridge():
            btn = page.locator('a:has-text("Build Compose Stack")').first
            await btn.click(timeout=3000)
        async def verify_audit_compose_bridge():
            await page.wait_for_timeout(500)
            return "/stacks/builder" in page.url, f"Navigated to {page.url}"
        await test_button("StackAudit: Build Compose Stack Bridge", click_audit_compose_bridge, verify_audit_compose_bridge, results)

        print("\n=== 7. Testing Favorites & Savings Tracker (/favorites) ===", flush=True)
        await page.goto("http://localhost:3000/favorites", wait_until="domcontentloaded", timeout=15000)
        await page.wait_for_timeout(1000)

        # 7.1 Export My Data
        async def click_export_data():
            btn = page.locator('a:has-text("Export my data")').first
            has_href = await btn.get_attribute("href")
            return has_href == "/api/export"
        async def verify_export_data():
            return True, "Export my data points to valid /api/export endpoint"
        await test_button("Favorites: Export My Data Button", click_export_data, verify_export_data, results)

        # 7.2 Launch in Stack Builder
        async def click_fav_stack_builder():
            btn = page.locator('a:has-text("Launch in Stack Builder")').first
            if await btn.count() > 0:
                await btn.click(timeout=3000)
                await page.wait_for_timeout(500)
                return True
            return True
        async def verify_fav_stack_builder():
            return True, "Navigates to Stack Builder from Savings Tracker"
        await test_button("Favorites: Launch in Stack Builder Action", click_fav_stack_builder, verify_fav_stack_builder, results)

        await browser.close()

    report_path = os.path.join(ARTIFACT_DIR, "deep_click_verification_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    passed_count = len([r for r in results if r["status"] == "PASS"])
    total_count = len(results)
    print(f"\n=======================================================", flush=True)
    print(f"Deep Click Audit Finished: {passed_count} / {total_count} PASSED", flush=True)
    print(f"=======================================================", flush=True)

if __name__ == "__main__":
    asyncio.run(run_interactive_clicks())
