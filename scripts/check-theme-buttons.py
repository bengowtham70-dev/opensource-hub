import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        page = await b.new_page()
        await page.goto('http://127.0.0.1:3000')
        btns = await page.locator('button[aria-label*="mode"]').all()
        print('Number of buttons matching mode:', len(btns))
        for i, b_el in enumerate(btns):
            print(f'Button {i}: aria-label={await b_el.get_attribute("aria-label")}, visible={await b_el.is_visible()}')
        await b.close()

if __name__ == "__main__":
    asyncio.run(main())
