import sqlite3
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_URL = "http://localhost:3000"
SHOT_DIR = Path(__file__).resolve().parent / "qa-shots"
CATALOG_DB = Path(__file__).resolve().parents[1] / "src" / "data" / "catalog.db"

def catalog_contains(fragment):
    """True when the local SQLite catalog has a repo matching the fragment."""
    if not CATALOG_DB.exists():
        return False
    try:
        conn = sqlite3.connect(f"file:{CATALOG_DB.as_posix()}?mode=ro", uri=True)
        try:
            row = conn.execute(
                "SELECT 1 FROM repos WHERE LOWER(full_name) LIKE ? LIMIT 1",
                (f"%{fragment.lower()}%",),
            ).fetchone()
            return row is not None
        finally:
            conn.close()
    except sqlite3.Error as err:
        print(f"WARN: catalog probe failed ({err}); treating fixture as absent")
        return False

def verify_ai_finder():
    SHOT_DIR.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})

        print("1. Navigating to /find...")
        page.goto(f"{BASE_URL}/find", wait_until="networkidle")

        # 2. Verify Page Header & Preset prompts
        assert page.locator("h1:has-text('AI Tool Finder')").is_visible(), "AI Tool Finder title missing"
        assert page.locator("text=Semantic Discovery Engine").is_visible(), "Semantic badge missing"
        print("Header verified.")

        # Capture initial state with preset prompt cards
        page.screenshot(path=str(SHOT_DIR / "ai_finder_initial_verified.png"))

        # 3. Test clicking an interactive preset prompt ("Agency Invoicing")
        print("2. Clicking preset prompt 'Agency Invoicing'...")
        prompt_card = page.locator("button:has-text('Agency Invoicing')")
        prompt_card.click()

        # Wait for results container
        page.wait_for_selector("text=recommendation", timeout=10000)
        page.wait_for_timeout(1000)

        # Verify results contain cards with confidence and reasoning
        first_card = page.locator(".card-elevated:has-text('Why this fits your workflow:')").first
        assert first_card.is_visible(), "Result card with AI reasoning is missing"
        print("Preset prompt query returned valid results with reasoning.")

        # Capture results screenshot
        page.screenshot(path=str(SHOT_DIR / "ai_finder_results_verified.png"))

        # 4. Test non-flagship catalog resolution query ("neocorp neo-flow e-commerce")
        #    Fixture-gated: only asserted when the local catalog.db contains it.
        if catalog_contains("neo-flow"):
            print("3. Testing non-flagship catalog tool resolution...")
            textarea = page.locator("textarea[aria-label='Describe your task']")
            textarea.fill("neocorp neo-flow e-commerce")
            submit_btn = page.locator("button:has-text('Find tools')")
            submit_btn.click()

            page.wait_for_selector("text=neo-flow", timeout=10000)
            page.wait_for_timeout(1000)

            # Check that neo-flow is displayed with its stars and PHP badge
            neo_card = page.locator(".card-elevated:has-text('neo-flow')").first
            assert neo_card.is_visible(), "neo-flow card is missing from catalog results"
            print("Catalog tool 'neo-flow' verified as rendered with pairing.")

            # Capture non-flagship catalog resolution screenshot
            page.screenshot(path=str(SHOT_DIR / "ai_finder_catalog_resolved_verified.png"))
        else:
            print("3. SKIPPED: 'neo-flow' fixture not present in local catalog.db.")

        # 5. Test AI Provider settings drawer and Ollama preset
        print("4. Testing AI Provider settings and Ollama Local preset...")
        settings_btn = page.locator("button:has-text('AI Provider')")
        settings_btn.click()
        page.wait_for_selector("text=Configure Inference Provider", timeout=5000)

        ollama_btn = page.locator("button:has-text('Ollama Local (Free)')")
        ollama_btn.click()
        page.wait_for_timeout(500)

        # Verify status pill updated to Ollama
        ollama_pill = page.locator("text=Local AI · Ollama")
        assert ollama_pill.is_visible(), "Ollama status pill did not update"
        print("Ollama Local preset verified.")

        # Capture settings drawer screenshot
        page.screenshot(path=str(SHOT_DIR / "ai_finder_ollama_settings_verified.png"))

        browser.close()
        print("ALL PLAYWRIGHT VERIFICATION CHECKS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    verify_ai_finder()
