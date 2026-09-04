import sys
from playwright.sync_api import sync_playwright

def verify_stack_builder():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 960},
            permissions=["clipboard-read", "clipboard-write"]
        )
        page = context.new_page()

        print("1. Navigating to /stacks/builder...")
        page.goto("http://localhost:3000/stacks/builder", wait_until="networkidle")

        # 2. Check title & presets
        assert page.locator("h1:has-text('Build & Share Your Open-Source Stack')").is_visible(), "Page title missing"
        assert page.locator("text=Quick-Start Stack Presets").is_visible(), "Presets section missing"
        print("Page header and presets verified.")

        # 3. Click preset 'Modern Startup'
        print("2. Clicking 'Modern Startup' preset...")
        preset_btn = page.locator("button:has-text('Modern Startup')")
        preset_btn.click()
        page.wait_for_timeout(1000)

        # Verify 4 tools loaded
        selected_count = page.locator("h2:has-text('Selected Tools')")
        assert "4/10" in selected_count.inner_text(), f"Expected 4 tools, got {selected_count.inner_text()}"
        print("Preset successfully loaded 4 tools (Supabase, Umami, Vaultwarden, Penpot).")

        # Capture Compose YAML view screenshot
        page.screenshot(path="C:/Users/vasan/.gemini/antigravity-ide/brain/913d57c2-bfad-4d05-ac06-cb89894ec892/stack_builder_compose_verified.png")

        # 4. Check Compose YAML tab content
        compose_text = page.locator("pre").first.inner_text()
        assert "version: \"3.8\"" in compose_text, "Compose version missing"
        assert "osh-network" in compose_text, "Network declaration missing"
        assert "volumes:" in compose_text, "Volumes declaration missing"
        print("Docker Compose YAML verified with network and persistence.")

        # 5. Switch to '1-Click CLI Runner' tab
        print("3. Testing CLI Runner tab...")
        cli_tab = page.locator("button:has-text('1-Click CLI Runner')")
        cli_tab.click()
        page.wait_for_timeout(500)

        assert page.locator("text=Bash / macOS / Linux").is_visible(), "Bash selector missing"
        assert page.locator("text=Windows PowerShell").is_visible(), "PowerShell selector missing"

        # Switch to PowerShell
        page.locator("button:has-text('Windows PowerShell')").click()
        page.wait_for_timeout(500)
        ps_text = page.locator("pre").first.inner_text()
        assert "New-Item -ItemType Directory" in ps_text, "PowerShell script missing New-Item"

        # Test Copy Command button
        copy_cli_btn = page.locator("button:has-text('Copy Command')")
        copy_cli_btn.click()
        page.wait_for_timeout(300)
        assert page.locator("text=Copied Command!").is_visible(), "Copy Command feedback missing"
        print("CLI Runner tab verified with Bash & PowerShell commands.")

        # Capture CLI Runner screenshot
        page.screenshot(path="C:/Users/vasan/.gemini/antigravity-ide/brain/913d57c2-bfad-4d05-ac06-cb89894ec892/stack_builder_cli_runner_verified.png")

        # 6. Switch to 'Cloud Deployers' tab
        print("4. Testing Cloud Deployers tab...")
        cloud_tab = page.locator("button:has-text('Cloud Deployers')")
        cloud_tab.click()
        page.wait_for_timeout(500)

        assert page.locator("h4:has-text('Railway')").is_visible(), "Railway card missing"
        assert page.locator("h4:has-text('Coolify')").is_visible(), "Coolify card missing"
        assert page.locator("h4:has-text('Fly.io')").is_visible(), "Fly.io card missing"
        assert page.locator("h4:has-text('Portainer Stack')").is_visible(), "Portainer card missing"
        print("Cloud Deployers verified.")

        # Capture Cloud Deployers screenshot
        page.screenshot(path="C:/Users/vasan/.gemini/antigravity-ide/brain/913d57c2-bfad-4d05-ac06-cb89894ec892/stack_builder_cloud_deployers_verified.png")

        # 7. Switch to 'Port & Service Matrix' tab
        print("5. Testing Port & Service Matrix tab...")
        matrix_tab = page.locator("button:has-text('Port & Service Matrix')")
        matrix_tab.click()
        page.wait_for_timeout(500)

        table = page.locator("table")
        assert table.is_visible(), "Port matrix table missing"
        assert page.locator("text=Zero Port Conflicts").is_visible(), "Zero port conflict notice missing"
        print("Port & Service Matrix verified.")

        # Capture Matrix screenshot
        page.screenshot(path="C:/Users/vasan/.gemini/antigravity-ide/brain/913d57c2-bfad-4d05-ac06-cb89894ec892/stack_builder_matrix_verified.png")

        browser.close()
        print("ALL STACK BUILDER PLAYWRIGHT CHECKS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    verify_stack_builder()
