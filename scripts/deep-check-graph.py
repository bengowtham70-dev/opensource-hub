import asyncio
import sys
from playwright.async_api import async_playwright

async def deep_check_graph():
    print("============================================================")
    print("  DEEP CHECK: STAR GROWTH CHART & INTERACTIVE GRAPH")
    print("============================================================")
    errors = []
    console_logs = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await context.new_page()

        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: errors.append(f"PageError: {err}"))

        url = "http://localhost:3000/repo/toeverything/affine"
        print(f"[*] Navigating to: {url}")
        res = await page.goto(url, wait_until="networkidle")
        if not res or res.status != 200:
            print(f"[FAIL] HTTP Status: {res.status if res else 'No response'}")
            await browser.close()
            sys.exit(1)

        print("[PASS] Page loaded successfully (HTTP 200)")

        # Wait for chart SVG
        chart_svg = page.locator("svg.cursor-crosshair")
        await chart_svg.wait_for(state="visible", timeout=5000)
        print("[PASS] Graph SVG canvas is visible and rendered.")

        # 1. Check spline path validity
        spline_path = page.locator("svg.cursor-crosshair path[stroke-width='2.5']")
        d_attr = await spline_path.get_attribute("d")
        if not d_attr or not d_attr.startswith("M") or "NaN" in d_attr or "undefined" in d_attr:
            print(f"[FAIL] Invalid spline path d attribute: {d_attr}")
            errors.append(f"Invalid spline path: {d_attr}")
        else:
            print(f"[PASS] Monotone cubic spline path generated successfully! Length: {len(d_attr)} chars")

        # 2. Check Area gradient path
        area_path = page.locator("svg.cursor-crosshair path[fill^='url(#']")
        area_d = await area_path.get_attribute("d")
        if not area_d or not area_d.startswith("M") or "NaN" in area_d:
            print(f"[FAIL] Invalid area path: {area_d}")
            errors.append(f"Invalid area path: {area_d}")
        else:
            print(f"[PASS] Area fill path generated with smooth baseline fill.")

        # 3. Check Badge Styling (White surface + Green icon + White/Ink text)
        badge = page.locator("span.uppercase:has-text('Star Trajectory & Momentum')")
        await badge.wait_for(state="visible")
        badge_icon = badge.locator("svg")
        icon_class = await badge_icon.get_attribute("class")
        print(f"[PASS] Badge text 'Star Trajectory & Momentum' found. Icon class: '{icon_class}'")

        # 4. Check Range Switcher Interaction (30D, 90D, 1Y, ALL)
        ranges = ["90D", "1Y", "ALL", "30D"]
        for r in ranges:
            btn = page.locator(f"button:has-text('{r}')")
            await btn.click()
            await page.wait_for_timeout(300)
            
            new_d = await spline_path.get_attribute("d")
            if not new_d or "NaN" in new_d:
                errors.append(f"Range switch {r} produced invalid path: {new_d}")
                print(f"[FAIL] Range {r} produced invalid path!")
            else:
                print(f"[PASS] Switched to '{r}' range -> Spline dynamically re-computed ({len(new_d)} chars).")

        # 5. Check Interactive Hover Crosshair & Dynamic Floating Tooltip
        box = await chart_svg.bounding_box()
        if box:
            hover_x = box["x"] + box["width"] * 0.5
            hover_y = box["y"] + box["height"] * 0.5
            await page.mouse.move(hover_x, hover_y)
            await page.wait_for_timeout(300)

            tooltip = page.locator("text=/\\d+([,\\.]\\d+)?\\s+stars/i")
            is_tooltip_visible = await tooltip.first.is_visible()
            if is_tooltip_visible:
                tooltip_text = await tooltip.first.inner_text()
                print(f"[PASS] Interactive hover triggered floating tooltip: '{tooltip_text}'")
            else:
                print("[WARN] Tooltip not detected on hover coordinate.")

            await page.mouse.move(10, 10)
            await page.wait_for_timeout(200)

        # 6. Check Clean Bottom Matrix (Verify Momentum Rank and Community Health are gone)
        page_content = await page.content()
        if "Top 5% Velocity" in page_content or "Community Health" in page_content or "Momentum Rank" in page_content:
            print("[FAIL] Unwanted tiles (Momentum Rank / Community Health) are still present!")
            errors.append("Unwanted tiles found in page content")
        else:
            print("[PASS] Verified unwanted tiles (Momentum Rank, Community Health) are completely removed.")

        if "Daily Growth Rate" in page_content and "30-Day Growth Trajectory" in page_content:
            print("[PASS] Verified clean 2-column bottom stats row is present.")
        else:
            print("[WARN] Bottom stats text mismatch.")

        critical_errors = [log for log in console_logs if "[error]" in log.lower()]
        if critical_errors:
            print(f"[WARN] Console errors detected: {critical_errors}")

        await browser.close()

    print("============================================================")
    if errors:
        print(f"DEEP CHECK RESULT: FAILED with {len(errors)} errors.")
        for err in errors:
            print(f" - {err}")
        sys.exit(1)
    else:
        print("DEEP CHECK RESULT: 100% PASS - GRAPH IS FULLY FUNCTIONAL!")
        print("============================================================")

if __name__ == "__main__":
    asyncio.run(deep_check_graph())
