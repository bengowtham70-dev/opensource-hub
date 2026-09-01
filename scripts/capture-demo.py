# Demo capture for docs/demo.gif — drives the real local dashboard through the
# hero flow: open → Ctrl+K palette → type "notion" → results → repo detail with
# trust ring. Frames land in output/playwright/demo-frames/ and are assembled
# into the GIF by scripts/build-demo-gif.mjs (gifenc). Requires the server to
# be running (node bin/cli.js --no-open). Usage: python scripts/capture-demo.py
import os
import pathlib
import re
import sys

from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")  # Windows consoles default to cp1252

OUT = pathlib.Path("output/playwright/demo-frames")
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.environ.get("DEMO_BASE_URL", "http://localhost:3000")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(1200)
    page.screenshot(path=str(OUT / "f01-home.png"))

    page.keyboard.press("Control+k")
    page.wait_for_timeout(500)
    page.screenshot(path=str(OUT / "f02-palette.png"))

    # Typing effect: one frame per keystroke of "notion".
    for i, ch in enumerate("notion", start=3):
        page.keyboard.type(ch, delay=40)
        page.wait_for_timeout(450)
        page.screenshot(path=str(OUT / f"f{i:02d}-typing.png"))

    # Enter selects the top palette suggestion ("Free alternatives to Notion").
    page.keyboard.press("Enter")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(800)
    page.screenshot(path=str(OUT / "f09-results.png"))
    page.wait_for_timeout(400)

    # Open the AFFiNE repo detail page (trust ring + security strip).
    try:
        page.get_by_role("link", name=re.compile("affine", re.I)).first.click(
            timeout=4000
        )
    except Exception as exc:  # noqa: BLE001 — fall back to plain text click
        print("link click fallback (text):", exc)
        page.get_by_text("AFFiNE").first.click(timeout=4000)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(800)
    page.screenshot(path=str(OUT / "f10-detail.png"))
    page.wait_for_timeout(2500)  # trust ring fill + live-data settle
    page.screenshot(path=str(OUT / "f11-detail-settled.png"))
    browser.close()

frames = len(list(OUT.glob("*.png")))
print(f"✓ captured {frames} frames → {OUT}")
