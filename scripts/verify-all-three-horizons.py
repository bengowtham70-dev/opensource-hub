import asyncio
import os
import sys
from playwright.async_api import async_playwright

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

OUT_DIR = r"C:\Users\vasan\.gemini\antigravity-ide\brain\885aab74-d085-4faf-b4fc-a9db60055e59"

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1380, "height": 900})
        page.on("console", lambda msg: print(f"[CONSOLE {msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: print(f"[PAGE ERROR] {err}"))

        print("--> Testing Option 1: /subscriptions (Paste-Your-Subscriptions & Savings Studio)")
        await page.goto("http://127.0.0.1:3000/subscriptions", wait_until="domcontentloaded")
        await page.wait_for_selector("h1", timeout=10000)

        # Check title
        h1 = await page.locator("h1").first.text_content()
        print(f"Subscriptions page H1: {h1}")
        assert "Subscriptions & Stack Matcher" in h1, f"Unexpected H1: {h1}"

        # Click preset button "Freelance Creator"
        creator_chip = page.locator("button:has-text('Freelance Creator')").first
        if await creator_chip.count() > 0:
            await creator_chip.click()
            await page.wait_for_timeout(500)
            print("Clicked 'Freelance Creator' preset chip")

        await page.screenshot(path=os.path.join(OUT_DIR, "subscriptions_savings_studio.png"), full_page=False)
        print("Captured subscriptions_savings_studio.png")

        print("--> Testing Option 2: /app-stores (Self-Hosting Community App Stores)")
        await page.goto("http://127.0.0.1:3000/app-stores", wait_until="domcontentloaded")
        await page.wait_for_selector("h1", timeout=10000)

        # Check title
        h1 = await page.locator("h1").first.text_content()
        print(f"App Stores page H1: {h1}")
        assert "Self-Hosting & Home-Server App Stores" in h1, f"Unexpected H1: {h1}"

        # Test platform switching to CasaOS
        casa_tab = page.locator("button:has-text('CasaOS')").first
        if await casa_tab.count() > 0:
            await casa_tab.click()
            await page.wait_for_timeout(500)
            print("Switched to CasaOS tab")

        await page.screenshot(path=os.path.join(OUT_DIR, "app_stores_distribution_hub.png"), full_page=False)
        print("Captured app_stores_distribution_hub.png")

        print("--> Testing Option 4: Homepage Multi-Channel Install Tabs")
        await page.goto("http://127.0.0.1:3000/", wait_until="domcontentloaded")
        await page.wait_for_selector("button:has-text('Homebrew')", timeout=10000)

        # Look for Homebrew or Curl tab
        brew_tab = page.locator("button:has-text('Homebrew')").first
        if await brew_tab.count() > 0:
            await brew_tab.click()
            await page.wait_for_timeout(300)
            print("Clicked Homebrew tab in hero install box")

        await page.screenshot(path=os.path.join(OUT_DIR, "multichannel_install_pill.png"), full_page=False)
        print("Captured multichannel_install_pill.png")

        await browser.close()
        print("ALL THREE EXPANDED HORIZONS E2E VERIFIED SUCCESSFULLY!")

asyncio.run(run())
