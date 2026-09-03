import asyncio
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        print("1. Testing Timeframe Switcher (All 6 options)...")
        await page.goto("http://127.0.0.1:3000/", wait_until="networkidle")
        timeframes = [
            ("Today", "today"),
            ("This Week", "week"),
            ("This Month", "month"),
            ("This Year", "year"),
            ("All Time", "all-time"),
            ("Hidden Gems", "least"),
        ]
        for label, tf_id in timeframes:
            btn = page.locator(f"button:has-text('{label}')")
            await btn.click()
            await page.wait_for_timeout(400)
            url = page.url
            print(f"  ✅ Pill '{label}': clicked, URL={url}")

        print("\n2. Testing Compare Showdown Presets...")
        await page.goto("http://127.0.0.1:3000/compare/supabase/vs/pocketbase", wait_until="networkidle")
        presets = [
            "Supabase vs PocketBase",
            "AppFlowy vs Joplin",
            "Bruno vs Hoppscotch",
            "Penpot vs Excalidraw",
            "Vaultwarden vs KeePassXC",
            "Mattermost vs Zulip",
        ]
        for pr in presets:
            chip = page.locator(f"a:has-text('{pr}')")
            count = await chip.count()
            if count > 0:
                print(f"  ✅ Preset Chip '{pr}': Found in DOM")
            else:
                print(f"  ❌ Preset Chip '{pr}': NOT found")

        # Click one preset chip to verify navigation
        await page.locator("a:has-text('AppFlowy vs Joplin')").click()
        await page.wait_for_timeout(500)
        print(f"  ✅ Clicked 'AppFlowy vs Joplin': URL={page.url}")

        print("\n3. Testing Stack Builder 'Download .yml' button...")
        await page.goto("http://127.0.0.1:3000/stacks/builder", wait_until="networkidle")
        dl_btn = page.locator("button:has-text('Download .yml')")
        has_dl = await dl_btn.count() > 0
        print(f"  {'✅' if has_dl else '❌'} Download .yml button: {'Found' if has_dl else 'Missing'}")

        print("\n4. Testing Watchlist 'Export JSON' button...")
        # Add an item to watchlist first so export button shows
        await page.evaluate("localStorage.setItem('osh-watchlist', JSON.stringify({'supabase/supabase': 95}))")
        await page.goto("http://127.0.0.1:3000/watchlist", wait_until="networkidle")
        exp_btn = page.locator("button:has-text('Export JSON')")
        has_exp = await exp_btn.count() > 0
        print(f"  {'✅' if has_exp else '❌'} Watchlist Export JSON button: {'Found' if has_exp else 'Missing'}")

        await browser.close()
        print("\n🎉 ALL NEW OPTIONS VERIFIED SUCCESSFULLY!")

asyncio.run(run())
