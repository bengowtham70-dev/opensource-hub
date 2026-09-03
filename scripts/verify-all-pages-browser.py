import sys
import time
from playwright.sync_api import sync_playwright

PAGES = [
    {"name": "1. Homepage (Trending & Discovery)", "path": "/"},
    {"name": "2. Alternatives Directory", "path": "/alternatives"},
    {"name": "3. Reverse Alternative (Paid Tool: Slack)", "path": "/alternatives/slack"},
    {"name": "4. Categories Overview", "path": "/categories"},
    {"name": "5. Repo Detail (AFFiNE)", "path": "/repo/toeverything/affine"},
    {"name": "6. Head-to-Head Compare (Mattermost vs Zulip)", "path": "/compare/mattermost/vs/zulip"},
    {"name": "7. AI Alternative Finder", "path": "/find"},
    {"name": "8. Stack Cost Audit", "path": "/stack-audit"},
    {"name": "9. Security Audits Index", "path": "/audits"},
    {"name": "10. Tech Stacks Directory", "path": "/stacks"},
    {"name": "11. Interactive Stack Builder", "path": "/stacks/builder"},
    {"name": "12. Global Releases Feed", "path": "/releases"},
    {"name": "13. Curated Collections & Lists Index", "path": "/lists"},
    {"name": "14. Curated List Detail (Self-Hosted)", "path": "/lists/self-hosted-starter-pack"},
    {"name": "15. User Favorites & Saved Tools", "path": "/favorites"},
    {"name": "16. Watchlist & RSS Feed", "path": "/watchlist"},
    {"name": "17. Open Source Licenses Guide", "path": "/licenses"},
    {"name": "18. Learn Center Index", "path": "/learn"},
    {"name": "19. Learn Article (What is Open Source)", "path": "/learn/what-is-open-source"},
    {"name": "20. Blog Index", "path": "/blog"},
    {"name": "21. Blog Post (Why We Built OpenSource Hub)", "path": "/blog/why-we-built-opensource-hub"},
    {"name": "22. MCP Servers & Tooling", "path": "/mcp"},
    {"name": "23. Submit Tool Form", "path": "/submit"},
    {"name": "24. Advertise & Sponsorship", "path": "/advertise"},
    {"name": "25. Admin Queue", "path": "/admin"},
]

def main():
    base_url = "http://localhost:3000"
    print("=" * 60)
    print("  OPENSOURCE HUB: EXHAUSTIVE 25-PAGE BROWSER AUDIT")
    print("=" * 60)
    
    passed_count = 0
    failed_count = 0
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()
        
        # Capture console errors
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        
        for idx, item in enumerate(PAGES, 1):
            url = f"{base_url}{item['path']}"
            console_errors.clear()
            
            try:
                response = page.goto(url, wait_until="domcontentloaded", timeout=10000)
                page.wait_for_timeout(300)
                status = response.status if response else 0
                
                # Verify page rendered root content and did not crash
                root_html = page.locator("#root").inner_html()
                has_content = len(root_html.strip()) > 50
                has_heading = page.locator("h1, h2, h3").count() > 0
                
                # Check for fatal unhandled React errors
                react_crashed = "Something went wrong" in root_html or "Uncaught Error" in str(console_errors)
                
                if status == 200 and has_content and has_heading and not react_crashed:
                    print(f"[{idx:02d}/25] [PASS] {item['name']} ({item['path']}) -> HTTP {status} (Rendered OK)")
                    passed_count += 1
                else:
                    print(f"[{idx:02d}/25] [FAIL] {item['name']} ({item['path']}) -> status={status}, content_len={len(root_html)}, errors={console_errors}")
                    failed_count += 1
            except Exception as e:
                print(f"[{idx:02d}/25] [ERROR] {item['name']} ({item['path']}) -> {e}")
                failed_count += 1
                
        browser.close()
        
    print("=" * 60)
    print(f"AUDIT SUMMARY: {passed_count}/{len(PAGES)} PAGES PASSED ({failed_count} failed)")
    print("=" * 60)
    
    if failed_count > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
