"""Observe homepage network activity: what keeps flying after load?"""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    page = b.new_page(viewport={"width": 1440, "height": 900})
    reqs = []
    page.on("request", lambda r: reqs.append(r.url))
    page.goto("http://localhost:3000/", wait_until="domcontentloaded", timeout=20000)
    for i in range(4):
        n = len(reqs)
        page.wait_for_timeout(5000)
        new = reqs[n:]
        print(f"t+{(i+1)*5}s: {len(new)} new requests")
        for u in new[:12]:
            print("   ", u[:130])
        if not new:
            print("   (network settled)")
            break
    b.close()
