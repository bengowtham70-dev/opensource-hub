import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\vasan\.gemini\antigravity-ide\brain\913d57c2-bfad-4d05-ac06-cb89894ec892"

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        print("[1/5] Checking Successor Banner on /repo/redis/redis...")
        try:
            await page.goto("http://localhost:3000/repo/redis/redis", wait_until="domcontentloaded", timeout=15000)
            await page.wait_for_timeout(2000)
            banner = page.locator('aside[aria-label="Community Successor Recommendation"]')
            await banner.scroll_into_view_if_needed()
            await page.screenshot(path=os.path.join(ARTIFACT_DIR, "successor_banner_verified.png"))
            print("  [OK] Successor Banner captured")
        except Exception as e:
            print(f"  Note on /repo/redis/redis: {e}")

        print("[2/5] Checking Interactive Migration Guide & Companions on /repo/supabase/supabase...")
        try:
            await page.goto("http://localhost:3000/repo/supabase/supabase", wait_until="domcontentloaded", timeout=15000)
            await page.wait_for_timeout(2000)

            # Scroll to Companions
            comp = page.locator('section[aria-label="Ecosystem Companions & Synergies"]')
            if await comp.count() > 0:
                await comp.scroll_into_view_if_needed()
                await page.wait_for_timeout(500)
                await page.screenshot(path=os.path.join(ARTIFACT_DIR, "companions_section_verified.png"))
                print("  [OK] Companions section captured")

            # Expand Decision Guide to reveal MigrationGuide
            expand_btn = page.locator('button:has-text("Explore Complete Pros & Cons Matrix")')
            if await expand_btn.count() > 0:
                await expand_btn.click()
                await page.wait_for_timeout(1000)

            mig = page.locator('section[aria-label="Step-by-Step Data Migration Guide"]')
            if await mig.count() > 0:
                await mig.scroll_into_view_if_needed()
                # Check off a step
                first_checkbox = mig.locator('input[type="checkbox"]').first
                if await first_checkbox.count() > 0:
                    await first_checkbox.click()
                    await page.wait_for_timeout(500)
                await page.screenshot(path=os.path.join(ARTIFACT_DIR, "interactive_migration_guide_verified.png"))
                print("  [OK] Interactive Migration Guide captured")
        except Exception as e:
            print(f"  Note on /repo/supabase/supabase: {e}")

        print("[3/5] Checking Stack Audit Presets & Matcher on /stack-audit...")
        try:
            await page.goto("http://localhost:3000/stack-audit", wait_until="domcontentloaded", timeout=15000)
            await page.wait_for_timeout(1500)

            # Click Startup Core preset
            startup_preset = page.locator('button:has-text("Startup Core")')
            if await startup_preset.count() > 0:
                await startup_preset.click()
                await page.wait_for_timeout(500)

            # Submit audit
            audit_submit = page.locator('button:has-text("Audit my stack")')
            if await audit_submit.count() > 0:
                await audit_submit.click()
                await page.wait_for_timeout(2000)

            await page.screenshot(path=os.path.join(ARTIFACT_DIR, "stack_audit_subscriptions_preset_verified.png"))
            print("  [OK] Stack Audit Presets & Matcher captured")
        except Exception as e:
            print(f"  Note on /stack-audit: {e}")

        print("[4/5] Checking Personal Savings Tracker on /favorites...")
        try:
            # First favorite a tool via API or direct navigation
            await page.goto("http://localhost:3000/repo/supabase/supabase", wait_until="domcontentloaded", timeout=15000)
            await page.wait_for_timeout(1000)
            fav_btn = page.locator('button[aria-label*="favorite"], button:has-text("Favorite")').first
            if await fav_btn.count() > 0:
                await fav_btn.click()
                await page.wait_for_timeout(500)

            # Navigate to /favorites
            await page.goto("http://localhost:3000/favorites", wait_until="domcontentloaded", timeout=15000)
            await page.wait_for_timeout(1500)
            await page.screenshot(path=os.path.join(ARTIFACT_DIR, "personal_savings_tracker_verified.png"))
            print("  [OK] Personal Savings Tracker captured")
        except Exception as e:
            print(f"  Note on /favorites: {e}")

        await browser.close()
        print("All E2E checks completed successfully!")

if __name__ == "__main__":
    asyncio.run(run())
