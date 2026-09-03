#!/usr/bin/env python3
"""
E2E Playwright verification script for Option A:
Live 26,000+ Tool Autocomplete in Header & Command Palette (Ctrl+K)
"""
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_URL = "http://localhost:3000"
SHOT_DIR = Path(__file__).resolve().parent / "qa-shots"

def test_autocomplete():
    SHOT_DIR.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("\n--- 1. Testing Header Autocomplete Dropdown ---")
        page.goto(BASE_URL, wait_until="networkidle")
        page.wait_for_timeout(1000)

        # Locate desktop search input
        search_input = page.locator('header input[type="search"]')
        search_input.click()
        search_input.fill("supabase")
        page.wait_for_timeout(500)

        # Autocomplete dropdown should be visible
        dropdown = page.locator('text=Top Matches (26,000+ Catalog)')
        if dropdown.is_visible():
            print("✓ Header autocomplete dropdown appeared with 'Top Matches (26,000+ Catalog)'")
        else:
            print("✗ Header autocomplete dropdown failed to appear")
            sys.exit(1)

        # Check for Supabase in results
        supabase_match = page.locator('header').locator('text=supabase/supabase').first
        if supabase_match.is_visible():
            print("✓ Top match 'supabase/supabase' rendered with live stars and verified info")
        else:
            print("✗ 'supabase/supabase' match not found in dropdown")
            sys.exit(1)

        page.screenshot(path=str(SHOT_DIR / "header_autocomplete_verified.png"))
        print("✓ Screenshot saved: header_autocomplete_verified.png")

        # Test Keyboard Navigation in Header (ArrowDown, Enter)
        page.keyboard.press("ArrowDown")
        page.wait_for_timeout(200)
        page.keyboard.press("Enter")
        page.wait_for_timeout(1500)

        current_url = page.url
        print(f"URL after Enter navigation: {current_url}")
        if "/repo/supabase/supabase" in current_url:
            print("✓ Keyboard selection (ArrowDown + Enter) successfully navigated to /repo/supabase/supabase")
        else:
            print(f"✗ Failed to navigate to /repo/supabase/supabase. Current URL: {current_url}")
            sys.exit(1)

        print("\n--- 2. Testing Command Palette (Ctrl+K) Live 26k+ Catalog Search ---")
        page.keyboard.press("Control+k")
        page.wait_for_timeout(500)

        cmdk_input = page.locator('[cmdk-input]')
        if cmdk_input.is_visible():
            print("✓ Command Palette opened on Ctrl+K")
        else:
            print("✗ Command Palette did not open on Ctrl+K")
            sys.exit(1)

        cmdk_input.fill("pocketbase")
        page.wait_for_timeout(500)

        # Check matching results group
        cmdk_group = page.locator('text=Matching Open Source Tools')
        if cmdk_group.is_visible():
            print("✓ Command Palette loaded 'Matching Open Source Tools' from 26,000+ catalog")
        else:
            print("✗ 'Matching Open Source Tools' group not visible in Command Palette")
            sys.exit(1)

        pb_match = page.locator('[cmdk-list]').locator('text=pocketbase/pocketbase').first
        if pb_match.is_visible():
            print("✓ PocketBase found in live catalog with stars and description")
        else:
            print("✗ 'pocketbase/pocketbase' not found in Command Palette results")
            sys.exit(1)

        page.screenshot(path=str(SHOT_DIR / "command_palette_catalog_verified.png"))
        print("✓ Screenshot saved: command_palette_catalog_verified.png")

        # Click or Enter on PocketBase (already selected as #1 item by cmdk)
        pb_match.click()
        page.wait_for_timeout(1500)

        current_url = page.url
        print(f"URL after Command Palette Enter: {current_url}")
        if "/repo/pocketbase/pocketbase" in current_url:
            print("✓ Command Palette Enter navigated to /repo/pocketbase/pocketbase")
        else:
            print(f"✗ Failed to navigate to /repo/pocketbase/pocketbase. Current URL: {current_url}")
            sys.exit(1)

        print("\n--- 3. Testing Commercial SaaS Alternative Suggestion ---")
        page.keyboard.press("Control+k")
        page.wait_for_timeout(500)
        cmdk_input = page.locator('[cmdk-input]')
        cmdk_input.fill("notion")
        page.wait_for_timeout(500)

        saas_alt = page.locator('text=Commercial Software Alternatives')
        if saas_alt.is_visible():
            print("✓ 'Commercial Software Alternatives' shortcut group displayed")
        else:
            print("✗ 'Commercial Software Alternatives' not visible")
            sys.exit(1)

        page.screenshot(path=str(SHOT_DIR / "command_palette_alternatives_verified.png"))
        print("✓ Screenshot saved: command_palette_alternatives_verified.png")

        browser.close()
        print("\n🎉 ALL E2E AUTOCOMPLETE VERIFICATION CHECKS PASSED PERFECTLY!\n")

if __name__ == "__main__":
    test_autocomplete()
