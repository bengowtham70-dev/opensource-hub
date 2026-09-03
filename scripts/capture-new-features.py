import asyncio
import os
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

OUT_DIR = r"C:\Users\vasan\.gemini\antigravity-ide\brain\c200472a-0fa8-4c5d-a340-b9638ff14ac1"

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 800})

        # 1. Homepage with all 6 timeframe pills
        await page.goto("http://127.0.0.1:3000/", wait_until="networkidle")
        await page.screenshot(path=os.path.join(OUT_DIR, "homepage_all_timeframes.png"), full_page=False)
        print("Captured homepage_all_timeframes.png")

        # 2. Compare page with Popular Showdown Chips
        await page.goto("http://127.0.0.1:3000/compare/supabase/vs/pocketbase", wait_until="networkidle")
        await page.screenshot(path=os.path.join(OUT_DIR, "compare_showdown_presets.png"), full_page=False)
        print("Captured compare_showdown_presets.png")

        # 3. Stack Builder with Download .yml button
        await page.goto("http://127.0.0.1:3000/stacks/builder", wait_until="networkidle")
        await page.screenshot(path=os.path.join(OUT_DIR, "stack_builder_download_yml.png"), full_page=False)
        print("Captured stack_builder_download_yml.png")

        # 4. Watchlist with Export JSON button
        await page.goto("http://127.0.0.1:3000/watchlist", wait_until="networkidle")
        await page.screenshot(path=os.path.join(OUT_DIR, "watchlist_export_json.png"), full_page=False)
        print("Captured watchlist_export_json.png")

        await browser.close()

asyncio.run(run())
