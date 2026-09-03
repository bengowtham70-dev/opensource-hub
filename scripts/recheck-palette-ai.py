# -*- coding: utf-8 -*-
"""Focused re-check: palette open-source search + AI finder Ctrl+Enter flow."""
import json
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
res = []

def log(tag, ok, detail=""):
    res.append((tag, ok, str(detail)[:200]))
    print(("PASS " if ok else "FAIL ") + tag + " :: " + str(detail)[:160])

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_context(viewport={"width": 1440, "height": 900}).new_page()
    pg.goto(BASE + "/", wait_until="domcontentloaded", timeout=30000)
    pg.wait_for_timeout(2500)

    # Palette: wait for pairings data to be indexed before typing
    pg.keyboard.press("Control+k")
    pg.wait_for_timeout(2500)  # allow getPairings to resolve
    pg.keyboard.type("vaultwarden")
    pg.wait_for_timeout(800)
    items = pg.locator("[cmdk-item]").all_inner_texts()
    log("palette 'vaultwarden'", len(items) > 0, f"n={len(items)} first={items[:2]}")
    pg.screenshot(path="scripts/qa-shots/final-palette-vaultwarden.png")
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(300)

    pg.keyboard.press("Control+k")
    pg.wait_for_timeout(600)
    pg.keyboard.type("penpot")
    pg.wait_for_timeout(800)
    items = pg.locator("[cmdk-item]").all_inner_texts()
    log("palette 'penpot' (open-source name)", len(items) > 0, f"n={len(items)} first={items[:2]}")
    pg.keyboard.press("Escape")

    # AI finder: Ctrl+Enter submit
    pg.goto(BASE + "/find", wait_until="domcontentloaded", timeout=30000)
    pg.wait_for_timeout(1500)
    pg.locator("textarea").first.fill("I need a password manager for my small team")
    pg.keyboard.press("Control+Enter")
    pg.wait_for_timeout(4000)
    body = pg.locator("body").inner_text()
    ok = "aultwarden" in body or "Bitwarden" in body or "Vaultwarden" in body
    has_results = ("Trust" in body or "confidence" in body or "Matched" in body)
    log("ai-finder Ctrl+Enter query", ok and has_results, f"len={len(body)} vaultwarden={ok} signals={has_results}")
    pg.screenshot(path="scripts/qa-shots/final-ai-finder-2.png")

    # AI finder edge: gibberish input must not crash
    pg.locator("textarea").first.fill("asdkjhqwekjhxyz")
    pg.keyboard.press("Control+Enter")
    pg.wait_for_timeout(3000)
    body2 = pg.locator("body").inner_text()
    crashed = pg.locator("text=Application error").count() > 0 or pg.locator("text=Something went wrong").count() > 0
    log("ai-finder gibberish graceful", not crashed and len(body2) > 400, f"len={len(body2)} crashed={crashed}")

    b.close()

fails = [r for r in res if not r[1]]
print("\n%d/%d passed" % (len(res) - len(fails), len(res)))
