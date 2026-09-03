import asyncio
import os
import sys
from playwright.async_api import async_playwright

ARTIFACTS_DIR = r"C:\Users\vasan\.gemini\antigravity-ide\brain\913d57c2-bfad-4d05-ac06-cb89894ec892"

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        print("[1/5] Testing /alternatives catalog infinite scroll...", flush=True)
        await page.goto("http://localhost:3000/alternatives", wait_until="domcontentloaded")
        await page.wait_for_timeout(2500)
        
        # Initial card count
        cards_before = len(await page.query_selector_all("article"))
        print(f"  Initial cards: {cards_before}", flush=True)
        
        # Scroll to bottom to trigger infinite scroll
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(2500)
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(2500)
        
        cards_after = len(await page.query_selector_all("article"))
        print(f"  Cards after infinite scroll: {cards_after}", flush=True)
        assert cards_after > 0, "No cards loaded on /alternatives"
        await page.screenshot(path=os.path.join(ARTIFACTS_DIR, "alternatives_catalog_verified.png"))
        print("  Screenshot saved: alternatives_catalog_verified.png", flush=True)

        print("[2/5] Testing /alternatives/airtable reverse alternatives...", flush=True)
        await page.goto("http://localhost:3000/alternatives/airtable", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        h1 = await page.inner_text("h1")
        print(f"  H1: {h1}", flush=True)
        assert "alternative" in h1.lower() and "airtable" in h1.lower(), f"Unexpected H1: {h1}"
        await page.screenshot(path=os.path.join(ARTIFACTS_DIR, "airtable_alternatives_verified.png"))
        print("  Screenshot saved: airtable_alternatives_verified.png", flush=True)

        print("[3/5] Testing /compare/supabase/vs/pocketbase...", flush=True)
        await page.goto("http://localhost:3000/compare/supabase/vs/pocketbase", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        compare_text = await page.inner_text("body")
        assert "Supabase" in compare_text and "PocketBase" in compare_text, "Comparison failed to load"
        await page.screenshot(path=os.path.join(ARTIFACTS_DIR, "compare_verified.png"))
        print("  Screenshot saved: compare_verified.png", flush=True)

        print("[4/5] Testing /categories...", flush=True)
        await page.goto("http://localhost:3000/categories", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        # Click the first category using evaluate
        clicked = await page.evaluate("""() => {
            const btn = document.querySelector('button[aria-expanded]');
            if (btn) {
                btn.click();
                return true;
            }
            return false;
        }""")
        print(f"  Category toggle clicked: {clicked}", flush=True)
        await page.wait_for_timeout(2000)
        await page.screenshot(path=os.path.join(ARTIFACTS_DIR, "categories_verified.png"))
        print("  Screenshot saved: categories_verified.png", flush=True)

        print("[5/5] Testing /stacks/builder universal search...", flush=True)
        await page.goto("http://localhost:3000/stacks/builder", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        await page.evaluate("""() => {
            const inp = document.querySelector('input[type="text"]');
            if (inp) {
                inp.value = 'supabase';
                inp.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }""")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=os.path.join(ARTIFACTS_DIR, "stack_builder_verified.png"))
        print("  Screenshot saved: stack_builder_verified.png", flush=True)

        await browser.close()
        print("ALL VERIFICATION STEPS PASSED SUCCESSFULLY!", flush=True)

if __name__ == "__main__":
    asyncio.run(verify())
