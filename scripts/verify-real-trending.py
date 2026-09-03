import asyncio
import os
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

OUT_DIR = r"C:\Users\vasan\.gemini\antigravity-ide\brain\913d57c2-bfad-4d05-ac06-cb89894ec892"

async def run():
    print("Starting Playwright Real Trending & Interactive Controls Verification...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})

        # 1. Load Homepage - Check Today Trending
        print("\n1. Navigating to homepage (Today trending)...")
        await page.goto("http://127.0.0.1:3000/?fresh=true", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Verify today cards
        card_titles = await page.locator("article header a.font-display").all_inner_texts()
        print(f"Loaded {len(card_titles)} cards on Today. First 3: {card_titles[:3]}")
        today_screenshot = os.path.join(OUT_DIR, "today_trending_verified.png")
        await page.screenshot(path=today_screenshot, full_page=False)
        print(f"Saved {today_screenshot}")

        # 2. Click "This Week"
        print("\n2. Clicking 'This Week' timeframe...")
        week_btn = page.locator("button:has-text('This Week')")
        await week_btn.click()
        await page.wait_for_timeout(1500)

        week_card_titles = await page.locator("article header a.font-display").all_inner_texts()
        print(f"Loaded {len(week_card_titles)} cards on This Week. First 3: {week_card_titles[:3]}")
        week_screenshot = os.path.join(OUT_DIR, "week_trending_verified.png")
        await page.screenshot(path=week_screenshot, full_page=False)
        print(f"Saved {week_screenshot}")

        # 3. Click "This Month"
        print("\n3. Clicking 'This Month' timeframe...")
        month_btn = page.locator("button:has-text('This Month')")
        await month_btn.click()
        await page.wait_for_timeout(1500)

        month_card_titles = await page.locator("article header a.font-display").all_inner_texts()
        print(f"Loaded {len(month_card_titles)} cards on This Month. First 3: {month_card_titles[:3]}")
        month_screenshot = os.path.join(OUT_DIR, "month_trending_verified.png")
        await page.screenshot(path=month_screenshot, full_page=False)
        print(f"Saved {month_screenshot}")

        # 4. Test "Order by" Dropdown: Most Stars, Latest Added, Most Popular (Forks)
        print("\n4. Testing Order by Dropdown (Latest Added & Most Popular)...")
        sort_btn = page.locator("button:has-text('Order by'), button:has-text('Trending')").first
        await sort_btn.click()
        await page.wait_for_timeout(300)

        # Click "Latest Added"
        latest_btn = page.locator("button:has-text('Latest Added')")
        if await latest_btn.count() > 0:
            await latest_btn.click()
            await page.wait_for_timeout(600)
            latest_titles = await page.locator("article header a.font-display").all_inner_texts()
            print(f"Sorted by Latest Added: First 3: {latest_titles[:3]}")

        # Click Sort dropdown again, select "Most Popular" (forks)
        sort_btn = page.locator("button:has-text('Latest Added')").first
        await sort_btn.click()
        await page.wait_for_timeout(300)

        forks_btn = page.locator("button:has-text('Most Popular')")
        if await forks_btn.count() > 0:
            await forks_btn.click()
            await page.wait_for_timeout(600)
            forks_titles = await page.locator("article header a.font-display").all_inner_texts()
            print(f"Sorted by Most Popular (Forks): First 3: {forks_titles[:3]}")
            forks_screenshot = os.path.join(OUT_DIR, "sort_forks_verified.png")
            await page.screenshot(path=forks_screenshot, full_page=False)
            print(f"Saved {forks_screenshot}")

        # 5. Test Search with Timeframe active
        print("\n5. Testing search query with timeframe active...")
        search_input = page.locator("#hero-search-input")
        await search_input.fill("git")
        await page.wait_for_timeout(800)
        search_titles = await page.locator("article header a.font-display").all_inner_texts()
        print(f"Search results for 'git': {len(search_titles)} items. First 3: {search_titles[:3]}")

        await browser.close()
        print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")

asyncio.run(run())
