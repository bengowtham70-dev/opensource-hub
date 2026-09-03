import asyncio
import os
import sys
import json
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:3000"
ARTIFACTS_DIR = r"C:\Users\vasan\.gemini\antigravity-ide\brain\913d57c2-bfad-4d05-ac06-cb89894ec892\pages"
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

PAGES_TO_TEST = [
    {"name": "Home / Trending", "path": "/"},
    {"name": "AI Tool Finder", "path": "/find"},
    {"name": "Security Audits", "path": "/audits"},
    {"name": "Stack Health Audit", "path": "/stack-audit"},
    {"name": "Curated Collections", "path": "/lists"},
    {"name": "Collection Detail", "path": "/lists/self-hosted-starter-pack"},
    {"name": "Release Watchlist", "path": "/watchlist"},
    {"name": "My Favorites", "path": "/favorites"},
    {"name": "Learn Articles", "path": "/learn"},
    {"name": "Learn Article Detail", "path": "/learn/what-is-open-source"},
    {"name": "Engineering Blog", "path": "/blog"},
    {"name": "Blog Post Detail", "path": "/blog/best-notion-alternatives-2026"},
    {"name": "MCP Server Registry", "path": "/mcp"},
    {"name": "Live Releases Feed", "path": "/releases"},
    {"name": "Preset Stacks", "path": "/stacks"},
    {"name": "Stack Architect / Builder", "path": "/stacks/builder"},
    {"name": "Open Source Licenses", "path": "/licenses"},
    {"name": "Alternatives Directory", "path": "/alternatives"},
    {"name": "Reverse Alternatives (Airtable)", "path": "/alternatives/airtable"},
    {"name": "Reverse Alternatives (Slack)", "path": "/alternatives/slack"},
    {"name": "Compare Tools", "path": "/compare/supabase/vs/pocketbase"},
    {"name": "Software Categories", "path": "/categories"},
    {"name": "Repository Detail (Supabase)", "path": "/repo/supabase/supabase"},
    {"name": "Submit Project", "path": "/submit"},
    {"name": "Advertise / Sponsor", "path": "/advertise"},
    {"name": "Admin / Governance Queue", "path": "/admin"},
]

async def check_all():
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        for idx, item in enumerate(PAGES_TO_TEST, 1):
            name = item["name"]
            path = item["path"]
            url = f"{BASE_URL}{path}"
            print(f"[{idx}/{len(PAGES_TO_TEST)}] Checking {name} ({path})...", flush=True)

            console_errors = []
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
            page_errors = []
            page.on("pageerror", lambda err: page_errors.append(str(err)))

            status = "OK"
            h1_text = ""
            body_length = 0
            card_count = 0
            error_details = []

            try:
                response = await page.goto(url, wait_until="domcontentloaded", timeout=15000)
                await page.wait_for_timeout(2000)
                
                # Check HTTP status
                http_status = response.status if response else 0
                if http_status >= 400:
                    status = "HTTP_ERROR"
                    error_details.append(f"HTTP status {http_status}")

                # Extract H1
                h1_el = await page.query_selector("h1")
                if h1_el:
                    h1_text = (await h1_el.inner_text()).strip().replace("\n", " ")
                else:
                    h1_text = "(No H1 found)"

                # Extract text content length
                text = await page.inner_text("body")
                body_length = len(text.strip())

                # Count cards/rows
                cards = await page.query_selector_all("article, .card-elevated, div[role='article']")
                card_count = len(cards)

                # Check for "Lost in space" 404 fallback
                if "lost in space" in text.lower():
                    status = "404_NOT_FOUND"
                    error_details.append("Route rendered 404 fallback")

                # Check for white screen / completely empty body
                if body_length < 50:
                    status = "EMPTY_PAGE"
                    error_details.append("Page body is virtually empty (<50 chars)")

                # Filter benign console errors
                real_console_errors = [
                    e for e in console_errors 
                    if not any(ign in e for ign in ["favicon.ico", "DevTools", "warning", "Warning"])
                ]
                if real_console_errors:
                    error_details.extend(real_console_errors[:3])

                if page_errors:
                    status = "JS_CRASH"
                    error_details.extend(page_errors)

                # Capture screenshot
                safe_slug = path.strip("/").replace("/", "_").replace(":", "_") or "home"
                ss_filename = f"{safe_slug}.png"
                ss_path = os.path.join(ARTIFACTS_DIR, ss_filename)
                await page.screenshot(path=ss_path)

            except Exception as e:
                status = "FAILED"
                error_details.append(str(e))

            result_entry = {
                "name": name,
                "path": path,
                "status": status,
                "h1": h1_text,
                "card_count": card_count,
                "body_chars": body_length,
                "errors": error_details,
            }
            results.append(result_entry)
            print(f"    Status: {status} | H1: '{h1_text[:40]}' | Cards/Items: {card_count} | Chars: {body_length}", flush=True)
            if error_details:
                print(f"    Errors: {error_details}", flush=True)

        await browser.close()

    report_path = os.path.join(ARTIFACTS_DIR, "page_audit_results.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nAll {len(PAGES_TO_TEST)} pages audited. Results saved to {report_path}", flush=True)

if __name__ == "__main__":
    asyncio.run(check_all())
