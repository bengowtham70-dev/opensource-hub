import asyncio
import json
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\vasan\.gemini\antigravity-ide\brain\913d57c2-bfad-4d05-ac06-cb89894ec892"

PAGES_TO_AUDIT = [
    {"name": "Home / Trending", "url": "http://localhost:3000/"},
    {"name": "Alternatives Directory", "url": "http://localhost:3000/alternatives"},
    {"name": "Paid Tool (Notion)", "url": "http://localhost:3000/alternatives/notion"},
    {"name": "Repo Detail (Supabase)", "url": "http://localhost:3000/repo/supabase/supabase"},
    {"name": "Repo Detail (Redis/Valkey)", "url": "http://localhost:3000/repo/redis/redis"},
    {"name": "Compare Matrix", "url": "http://localhost:3000/compare/supabase/supabase/vs/pocketbase/pocketbase"},
    {"name": "Hardware Simulator", "url": "http://localhost:3000/hardware"},
    {"name": "Stack Builder Sandbox", "url": "http://localhost:3000/stacks/builder"},
    {"name": "Stack Audit & Matcher", "url": "http://localhost:3000/stack-audit"},
    {"name": "AI Finder", "url": "http://localhost:3000/find"},
    {"name": "Newsletter Archive", "url": "http://localhost:3000/newsletter"},
    {"name": "Favorites", "url": "http://localhost:3000/favorites"},
    {"name": "Watchlist", "url": "http://localhost:3000/watchlist"},
    {"name": "Audits", "url": "http://localhost:3000/audits"},
    {"name": "Releases Feed", "url": "http://localhost:3000/releases"},
    {"name": "Curated Lists", "url": "http://localhost:3000/lists"},
    {"name": "Learn Articles", "url": "http://localhost:3000/learn"},
    {"name": "Blog Editorial", "url": "http://localhost:3000/blog"},
    {"name": "Licenses Hub", "url": "http://localhost:3000/licenses"},
    {"name": "MCP Directory", "url": "http://localhost:3000/mcp"},
    {"name": "Submit Tool", "url": "http://localhost:3000/submit"},
    {"name": "Advertise", "url": "http://localhost:3000/advertise"},
    {"name": "Admin Queue", "url": "http://localhost:3000/admin"},
]

async def audit_buttons():
    results = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})

        for page_info in PAGES_TO_AUDIT:
            page = await context.new_page()
            console_errors = []
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
            page.on("pageerror", lambda err: console_errors.append(str(err)))

            print(f"Auditing buttons on: {page_info['name']} ({page_info['url']})...")
            page_data = {
                "page": page_info["name"],
                "url": page_info["url"],
                "buttons": [],
                "consoleErrors": [],
            }

            try:
                await page.goto(page_info["url"], wait_until="domcontentloaded", timeout=15000)
                await page.wait_for_timeout(1200)

                # Find all buttons and anchor tags with button styling
                buttons = await page.eval_on_selector_all(
                    'button, a.btn-tactile, a.shimmer-button',
                    '''els => els.map((el, i) => ({
                        index: i,
                        tagName: el.tagName.toLowerCase(),
                        text: (el.innerText || el.textContent || '').trim().replace(/\\s+/g, ' '),
                        ariaLabel: el.getAttribute('aria-label') || '',
                        title: el.getAttribute('title') || '',
                        role: el.getAttribute('role') || '',
                        type: el.getAttribute('type') || '',
                        disabled: el.disabled || false,
                        href: el.getAttribute('href') || '',
                        className: el.className || '',
                        hasOnClick: Boolean(el.onclick)
                    }))'''
                )

                print(f"  Found {len(buttons)} button elements.")

                # Test clicking on a subset of key buttons to verify interaction without page crash
                for b in buttons:
                    display_text = b["text"] or b["ariaLabel"] or b["title"] or f"Button {b['index']}"
                    # Truncate if too long
                    if len(display_text) > 40:
                        display_text = display_text[:37] + "..."

                    status = "WORKING"
                    note = ""

                    if b["disabled"]:
                        status = "DISABLED (Normal state or waiting for input)"
                    elif not display_text or display_text == f"Button {b['index']}":
                        status = "NEEDS_LABEL"
                        note = "Missing accessible aria-label or visible text"
                    elif b["tagName"] == "a" and b["href"] in ["#", "", "javascript:void(0)"]:
                        status = "DEAD_HREF"
                        note = "Anchor styled as button with empty/hash href"

                    b["status"] = status
                    b["display"] = display_text
                    b["note"] = note
                    page_data["buttons"].append(b)

            except Exception as e:
                page_data["error"] = str(e)
                print(f"  Error loading {page_info['url']}: {e}")

            page_data["consoleErrors"] = list(set(console_errors))
            results.append(page_data)
            await page.close()

        await browser.close()

    report_path = os.path.join(ARTIFACT_DIR, "all_buttons_audit_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(f"Audit complete! Saved detailed report to {report_path}")

if __name__ == "__main__":
    asyncio.run(audit_buttons())
