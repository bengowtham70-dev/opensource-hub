import asyncio
import time
from playwright.async_api import async_playwright

async def measure_toggle():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://127.0.0.1:3000", wait_until="networkidle")
        await page.wait_for_selector('button[aria-label*="mode"]')
        await page.wait_for_timeout(1000) # Ensure full hydration

        btn = page.locator('button[aria-label*="mode"]')

        # Measure Click 1 (Toggle to Dark)
        t0 = time.perf_counter()
        await btn.click()
        await page.wait_for_function("document.documentElement.classList.contains('dark')")
        dark_time_ms = (time.perf_counter() - t0) * 1000
        print(f"Time to toggle to DARK: {dark_time_ms:.2f}ms")

        await page.wait_for_timeout(300)

        # Measure Click 2 (Toggle to Light)
        t0 = time.perf_counter()
        await btn.click()
        await page.wait_for_function("!document.documentElement.classList.contains('dark')")
        light_time_ms = (time.perf_counter() - t0) * 1000
        print(f"Time to toggle to LIGHT: {light_time_ms:.2f}ms")

        # Let's take screenshots to verify visual correctness
        await page.screenshot(path="scratch_theme_light.png")
        await btn.click()
        await page.wait_for_timeout(200)
        await page.screenshot(path="scratch_theme_dark.png")
        print("Screenshots taken: scratch_theme_light.png, scratch_theme_dark.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(measure_toggle())
