from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    page.on("console", lambda msg: print(f"[CONSOLE {msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: print(f"[PAGE ERROR] {err}"))
    
    resp = page.goto("http://localhost:3000/repo/toeverything/affine", timeout=15000)
    print("HTTP Status:", resp.status if resp else "no resp")
    page.wait_for_timeout(2000)
    
    print("Page Title:", page.title())
    print("Root content length:", len(page.locator("#root").inner_html()))
    print("Root text snippet:", page.locator("#root").inner_text()[:300])
    
    browser.close()
