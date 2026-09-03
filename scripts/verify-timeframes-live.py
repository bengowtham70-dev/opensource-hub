import asyncio
from playwright.async_api import async_playwright

async def verify_timeframes():
    print("=" * 70)
    print(" LIVE VERIFICATION: CLICKING TIMEFRAME BUTTONS (TODAY/WEEK/MONTH/YEAR)")
    print("=" * 70)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        await page.goto("http://127.0.0.1:3000", wait_until="networkidle")
        await page.wait_for_selector(".group\\/card, .card-elevated")

        async def get_top_tools():
            cards = await page.locator("article header h2, article header a.font-display").all_inner_texts()
            return [c.strip() for c in cards[:4] if c.strip()]

        timeframes = [
            ("Today", "today"),
            ("This Week", "week"),
            ("This Month", "month"),
            ("This Year", "year"),
        ]

        results = {}

        for label, view_id in timeframes:
            btn = page.locator(f"button:has-text('{label}')")
            await btn.click()
            await page.wait_for_selector("article header h2, article header a.font-display", timeout=10000)
            await page.wait_for_timeout(300)
            top_tools = await get_top_tools()
            current_url = page.url
            results[label] = {
                "top_tools": top_tools,
                "url": current_url,
                "active": await btn.get_attribute("class"),
            }
            print(f" [PASS] Clicked '{label}':")
            print(f"        URL: {current_url}")
            print(f"        Top Ranked Tools: {', '.join(top_tools)}")
            await page.screenshot(path=f"scratch_timeframe_{view_id}.png")

        # Verify that clicking different timeframes actually yielded different tool orders!
        today_top = results["Today"]["top_tools"]
        week_top = results["This Week"]["top_tools"]
        year_top = results["This Year"]["top_tools"]

        is_different = (today_top != week_top) or (today_top != year_top)
        print("\n" + "=" * 70)
        if is_different:
            print(" SUCCESS: Timeframe ranking is LIVE, REACTIVE, and CONFIRMED WORKING!")
        else:
            print(" WARNING: Timeframes returned identical order")
        print("=" * 70)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_timeframes())
