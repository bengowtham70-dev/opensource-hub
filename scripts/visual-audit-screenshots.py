import asyncio
from playwright.async_api import async_playwright

BASE = "http://127.0.0.1:3000"

async def capture_visuals():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 1080})
        page = await context.new_page()

        # 1. Capture Repo Detail Page Top
        await page.goto(f"{BASE}/repo/toeverything/affine", wait_until="domcontentloaded")
        await page.wait_for_selector("h1", timeout=15000)
        await page.wait_for_timeout(1000)
        await page.screenshot(path="scratch_repo_top.png", full_page=False)

        # 2. Capture Repo Detail Full Page
        await page.screenshot(path="scratch_repo_full.png", full_page=True)

        # 3. Capture Homepage
        await page.goto(BASE, wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        await page.screenshot(path="scratch_home.png", full_page=False)

        await browser.close()
        print("Screenshots captured successfully.")

if __name__ == "__main__":
    asyncio.run(capture_visuals())
