import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\vasan\.gemini\antigravity-ide\brain\885aab74-d085-4faf-b4fc-a9db60055e59"
os.makedirs(ARTIFACT_DIR, exist_ok=True)

def verify_both_options():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # =====================================================================
        # Verification 1: Landing Page Multi-Channel Switcher (Option 1)
        # =====================================================================
        landing_url = "file:///c:/Users/vasan/Music/opensourse/landing-page/index.html"
        print(f"--> Navigating to landing page: {landing_url}")
        page.goto(landing_url)
        page.wait_for_selector("#channel-tabs")

        # Test Windows selection
        print("Testing Windows OS tab...")
        win_tab = page.locator(".channel-tab[data-os='windows']")
        win_tab.click()
        page.wait_for_timeout(300)

        # Check sub-method buttons
        ps_btn = page.locator(".sub-method-btn", has_text="PowerShell")
        ps_btn.click()
        page.wait_for_timeout(200)
        cmd_text = page.locator("#install-cmd").inner_text()
        assert "install.ps1" in cmd_text, f"Expected install.ps1 in command, got {cmd_text}"
        print(f"   ✓ PowerShell command: {cmd_text}")

        winget_btn = page.locator(".sub-method-btn", has_text="Winget")
        winget_btn.click()
        page.wait_for_timeout(200)
        cmd_text = page.locator("#install-cmd").inner_text()
        assert "winget install" in cmd_text, f"Expected winget install, got {cmd_text}"
        print(f"   ✓ Winget command: {cmd_text}")

        # Test macOS selection
        mac_tab = page.locator(".channel-tab[data-os='macos']")
        mac_tab.click()
        page.wait_for_timeout(300)
        brew_btn = page.locator(".sub-method-btn", has_text="Homebrew")
        brew_btn.click()
        page.wait_for_timeout(200)
        cmd_text = page.locator("#install-cmd").inner_text()
        assert "brew install" in cmd_text, f"Expected brew install, got {cmd_text}"
        print(f"   ✓ macOS Homebrew command: {cmd_text}")

        # Test Linux selection
        linux_tab = page.locator(".channel-tab[data-os='linux']")
        linux_tab.click()
        page.wait_for_timeout(300)
        cmd_text = page.locator("#install-cmd").inner_text()
        assert "install.sh" in cmd_text, f"Expected install.sh, got {cmd_text}"
        print(f"   ✓ Linux Shell command: {cmd_text}")

        shot1_path = os.path.join(ARTIFACT_DIR, "options_1_landing_hero_multichannel.png")
        page.screenshot(path=shot1_path)
        print(f"   ✓ Option 1 Screenshot saved: {shot1_path}")

        # =====================================================================
        # Verification 2: Repo Detail Page Migration Guide Studio (Option 2)
        # =====================================================================
        repo_url = "http://localhost:3000/repo/supabase/supabase"
        print(f"--> Navigating to repo page: {repo_url}")
        page.goto(repo_url)
        page.wait_for_selector("text=Decision Guide & Migration", timeout=15000)

        # Expand Decision Guide if collapsed
        expand_btn = page.locator("button", has_text="Expand guide")
        if expand_btn.count() > 0:
            print("Expanding Decision Guide...")
            expand_btn.click()
            page.wait_for_timeout(500)

        page.wait_for_selector("text=Migration Assistant: Firebase → Supabase", timeout=10000)

        migration_section = page.locator("section[aria-label='Step-by-Step Data Migration Guide']")
        migration_section.scroll_into_view_if_needed()
        page.wait_for_timeout(500)

        # Toggle to Executable Scripts tab
        scripts_tab_btn = page.locator("button", has_text="Executable Scripts")
        scripts_tab_btn.click()
        page.wait_for_timeout(600)

        # Check script tabs
        transform_btn = page.locator("button", has_text="02-transform.js")
        transform_btn.click()
        page.wait_for_timeout(300)

        code_preview = page.locator("pre code").inner_text()
        assert "02-transform.js" in code_preview or "Translating" in code_preview, "Expected transform script code in preview"
        print("   ✓ Executable scripts preview loaded successfully")

        # Test volume parameter button
        ent_btn = page.locator("button", has_text=">20GB (Batch)")
        ent_btn.click()
        page.wait_for_timeout(400)

        shot2_path = os.path.join(ARTIFACT_DIR, "options_2_migration_scripts_studio.png")
        migration_section.screenshot(path=shot2_path)
        print(f"   ✓ Option 2 Screenshot saved: {shot2_path}")

        browser.close()
        print("All browser checks passed successfully!")

if __name__ == "__main__":
    verify_both_options()
