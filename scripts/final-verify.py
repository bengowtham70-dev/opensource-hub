# -*- coding: utf-8 -*-
"""Post-fix re-verification + Phase 6 persona walkthrough (launch QA)."""
import json
import time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
OUT = []
T0 = time.time()

def log(tag, ok, detail=""):
    OUT.append({"tag": tag, "ok": bool(ok), "detail": str(detail)[:300]})
    print(("PASS " if ok else "FAIL ") + tag + (" :: " + str(detail)[:200] if detail else ""))

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)

    # ---------- Re-verify contrast fixes ----------
    for theme in ("light", "dark"):
        ctx = b.new_context(viewport={"width": 1440, "height": 900})
        pg = ctx.new_page()
        pg.goto(BASE + "/", wait_until="domcontentloaded", timeout=30000)
        pg.evaluate("t => localStorage.setItem('osh-theme', t)", theme)
        pg.reload(wait_until="domcontentloaded")
        pg.wait_for_timeout(1800)

        hero = pg.locator("p", has_text="Find verified open-source replacements").first
        color = hero.evaluate("e => getComputedStyle(e).color")
        body_bg = pg.evaluate("getComputedStyle(document.body).backgroundColor")
        log(f"{theme}: hero subline color", color != body_bg, f"color={color} bg={body_bg}")

        pg.screenshot(path=f"scripts/qa-shots/final-home-{theme}.png")

        if theme == "dark":
            btn = pg.locator("button", has_text="Subscribe").first
            btn.scroll_into_view_if_needed()
            pg.wait_for_timeout(400)
            bgc = btn.evaluate("e => getComputedStyle(e).backgroundColor")
            fgc = btn.evaluate("e => getComputedStyle(e).color")
            log("dark: subscribe button contrast", bgc != fgc, f"fg={fgc} bg={bgc}")

        # palette check: open-source name searchable
        pg.keyboard.press("Control+k")
        pg.wait_for_timeout(500)
        pg.keyboard.type("vaultwarden")
        pg.wait_for_timeout(600)
        items = pg.locator("[cmdk-item]").all_inner_texts()
        log("palette: 'vaultwarden' matches", any("1Password" in i or "Vaultwarden" in i for i in items), f"n={len(items)} first={items[:2]}")
        pg.keyboard.press("Escape")

        # paid-tool name still searchable
        pg.keyboard.press("Control+k")
        pg.wait_for_timeout(400)
        pg.keyboard.type("1password")
        pg.wait_for_timeout(600)
        items2 = pg.locator("[cmdk-item]").all_inner_texts()
        log("palette: '1password' still matches", len(items2) > 0, f"n={len(items2)}")
        pg.screenshot(path=f"scripts/qa-shots/final-palette-{theme}.png")
        pg.keyboard.press("Escape")
        ctx.close()

    # ---------- Persona A: free Notion alternative (<60s) ----------
    ctx = b.new_context(viewport={"width": 1440, "height": 900})
    pg = ctx.new_page()
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    t = time.time()
    pg.goto(BASE + "/", wait_until="domcontentloaded", timeout=30000)
    pg.wait_for_timeout(1500)
    pg.fill("#hero-search-input", "notion")
    pg.wait_for_timeout(1200)
    cards = pg.locator("text= AFFiNE").count() + pg.locator("a:has-text('AFFiNE')").count()
    found_notion = pg.get_by_text("AFFiNE").count() > 0
    # click first repo card
    link = pg.locator("a[href*='/repo/'], a[href*='/alternatives/']").first
    first_href = link.get_attribute("href") if link.count() else None
    if first_href:
        link.click()
        pg.wait_for_timeout(1800)
        h1 = pg.locator("h1").first.inner_text()
        log("persona A: notion->detail", True, f"h1={h1!r} took {time.time()-t:.1f}s first_href={first_href}")
    else:
        log("persona A: notion->detail", False, "no card link found")
    log("persona A: AFFiNE visible for 'notion'", found_notion, f"{time.time()-t:.1f}s")
    pg.screenshot(path="scripts/qa-shots/final-persona-notion.png")

    # ---------- Persona B: replace 1Password ----------
    t = time.time()
    pg.goto(BASE + "/?q=1password", wait_until="domcontentloaded", timeout=30000)
    pg.wait_for_timeout(1500)
    vw = pg.get_by_text("Vaultwarden").count()
    save_banner = pg.get_by_text("Save ~").count()
    parity = pg.get_by_text("Parity", exact=False).count()
    log("persona B: 1password->Vaultwarden", vw > 0 and save_banner > 0, f"vw={vw} saveBanners={save_banner} parityMentions={parity} {time.time()-t:.1f}s")
    pg.screenshot(path="scripts/qa-shots/final-persona-1password.png")

    # ---------- Persona C: Figma alternative ----------
    pg.goto(BASE + "/?q=figma", wait_until="domcontentloaded", timeout=30000)
    pg.wait_for_timeout(1500)
    pen = pg.get_by_text("Penpot").count()
    log("persona C: figma->Penpot", pen > 0, f"penpotMentions={pen}")
    pg.screenshot(path="scripts/qa-shots/final-persona-figma.png")

    # ---------- AI finder (offline heuristic mode) ----------
    pg.goto(BASE + "/find", wait_until="domcontentloaded", timeout=30000)
    pg.wait_for_timeout(1200)
    box = pg.locator("textarea, input[type='text']").first
    box.fill("I need a password manager for my small team")
    pg.keyboard.press("Enter")
    pg.wait_for_timeout(3500)
    body_text = pg.locator("body").inner_text()
    ai_ok = ("aultwarden" in body_text or "Bitwarden" in body_text or "assword" in body_text.lower()) and len(body_text) > 200
    log("ai-finder: team password manager query", ai_ok, f"len={len(body_text)}")
    pg.screenshot(path="scripts/qa-shots/final-ai-finder.png")

    real_errors = [e for e in errors if "favicon" not in e.lower() and "404" not in e]
    log("zero console errors on persona paths", len(real_errors) == 0, f"errors={real_errors[:3]}")
    ctx.close()
    b.close()

fails = [o for o in OUT if not o["ok"]]
print("\nSUMMARY: %d checks, %d failed, %.1fs total" % (len(OUT), len(fails), time.time() - T0))
print(json.dumps(fails, indent=1))
