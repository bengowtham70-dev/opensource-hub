import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        page = await b.new_page()
        await page.goto("http://127.0.0.1:3000", wait_until="networkidle")
        await page.wait_for_selector('button[aria-label*="mode"]')

        res1 = await page.evaluate("""() => {
            const btn = document.querySelector('button[aria-label*="mode"]');
            const t0 = performance.now();
            btn.click();
            const t1 = performance.now();
            return {
                duration_ms: (t1 - t0).toFixed(2),
                isDark: document.documentElement.classList.contains('dark')
            };
        }""")
        print("Click 1 (Toggle to Dark):", res1)

        res2 = await page.evaluate("""() => {
            const btn = document.querySelector('button[aria-label*="mode"]');
            const t0 = performance.now();
            btn.click();
            const t1 = performance.now();
            return {
                duration_ms: (t1 - t0).toFixed(2),
                isDark: document.documentElement.classList.contains('dark')
            };
        }""")
        print("Click 2 (Toggle to Light):", res2)
        await b.close()

if __name__ == "__main__":
    asyncio.run(main())
