import sys
from playwright.sync_api import sync_playwright

def verify_options_3_and_4():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1366, "height": 960},
            permissions=["clipboard-read", "clipboard-write"]
        )
        page = context.new_page()

        print("=== 1. VERIFYING OPTION 3: ARCHITECTURE & BENCHMARK MATRIX ===")
        page.goto("http://localhost:3000/compare/supabase/vs/pocketbase", wait_until="networkidle")

        # Check title & memory difference callout
        assert page.locator("h1:has-text('Supabase vs PocketBase')").is_visible(), "Comparison title missing"
        assert page.locator("text=less RAM").is_visible(), "RAM savings callout missing"
        print("Comparison header and memory savings callout verified.")

        # Tab 2: Architecture & Resources
        print("Switching to Architecture & Resources tab...")
        page.locator("button:has-text('Architecture & Resources')").click()
        page.wait_for_timeout(600)

        assert page.locator("text=Minimum Idle RAM").is_visible(), "Idle RAM row missing"
        assert page.locator("text=Container Image Size").is_visible(), "Container size row missing"
        assert page.locator("text=Embedded SQLite").is_visible(), "SQLite engine spec missing"
        assert page.locator("text=PostgreSQL").is_visible(), "Postgres engine spec missing"
        print("Architecture benchmarks (RAM, image sizes, database engines) verified.")

        page.screenshot(path="C:/Users/vasan/.gemini/antigravity-ide/brain/913d57c2-bfad-4d05-ac06-cb89894ec892/compare_architecture_benchmarks_verified.png")

        # Tab 3: Protocols & Auth
        print("Switching to Protocols & Auth tab...")
        page.locator("button:has-text('Protocols & Auth')").click()
        page.wait_for_timeout(600)

        assert page.locator("text=Supported Protocols").is_visible(), "Protocols row missing"
        assert page.locator("text=Authentication Matrix").is_visible(), "Auth matrix row missing"
        assert page.locator("text=Full Offline First").is_visible(), "Offline-first indicator missing"
        print("Protocols and auth matrix verified.")

        page.screenshot(path="C:/Users/vasan/.gemini/antigravity-ide/brain/913d57c2-bfad-4d05-ac06-cb89894ec892/compare_protocols_matrix_verified.png")

        # Tab 4: Deployment & Fit Guide
        print("Switching to Deployment & Fit Guide tab...")
        page.locator("button:has-text('Deployment & Fit Guide')").click()
        page.wait_for_timeout(600)

        assert page.locator("text=Self-Hosting Complexity").is_visible(), "Complexity row missing"
        assert page.locator("h2:has-text('Architectural Fit & Recommendation')").is_visible(), "Fit section missing"
        print("Fit guide and self-hosting complexity verified.")

        page.screenshot(path="C:/Users/vasan/.gemini/antigravity-ide/brain/913d57c2-bfad-4d05-ac06-cb89894ec892/compare_fit_guide_verified.png")

        print("\n=== 2. VERIFYING OPTION 4: MAINTAINER CLAIM & VERIFIED BADGE ===")
        page.goto("http://localhost:3000/repo/usebruno/bruno", wait_until="networkidle")

        # Check repository header
        assert page.locator("h1:has-text('Bruno')").is_visible(), "Repo title missing"

        # Open Claim Modal
        print("Opening Claim modal...")
        claim_btn = page.locator("button:has-text('Claim')").first
        claim_btn.click()
        page.wait_for_timeout(500)

        assert page.locator("h3:has-text('Claim Repository Verification')").is_visible(), "Claim modal missing"
        print("Claim modal opened.")

        # Switch to Tab 2: Maintainer Showcase & Sandbox
        print("Switching to Maintainer Showcase tab...")
        page.locator("button:has-text('2. Maintainer Showcase & Sandbox')").click()
        page.wait_for_timeout(300)

        # Fill profile
        name_input = page.locator("input[placeholder='e.g. Anoop M D']")
        name_input.fill("Anoop M D")

        role_input = page.locator("input[placeholder='e.g. Founder & Core Lead']")
        role_input.fill("Creator & Lead Architect")

        tagline_input = page.locator("input[placeholder='e.g. Fast, git-friendly, offline-first API client']")
        tagline_input.fill("Fast, git-friendly, offline-first API client storing collections in git.")

        stack_input = page.locator("input[placeholder='e.g. Docker Compose / Single Binary']")
        stack_input.fill("Desktop Native / Local Git Repositories")

        page.screenshot(path="C:/Users/vasan/.gemini/antigravity-ide/brain/913d57c2-bfad-4d05-ac06-cb89894ec892/claim_modal_customizer_verified.png")

        # Click Activate Verified Mode
        print("Activating verified mode in sandbox...")
        page.locator("button:has-text('Activate Verified Mode')").click()
        page.wait_for_timeout(1000)

        assert page.locator("text=Verified Successfully!").is_visible(), "Verification feedback missing"
        print("Maintainer verification applied.")

        # Close dialog
        page.locator("button:has-text('Close')").click()
        page.wait_for_timeout(800)

        # Verify Verified Maintainer badge in header
        assert page.locator("span:has-text('Verified Maintainer')").first.is_visible(), "Verified Maintainer badge missing in header"
        print("Verified Maintainer badge verified in hero header.")

        # Verify Maintainer Showcase Card
        assert page.locator("section[aria-label='Verified Maintainer Note']").is_visible(), "Maintainer showcase card missing"
        assert page.locator("text=Anoop M D").is_visible(), "Maintainer name missing on page"
        assert page.locator("text=Fast, git-friendly, offline-first API client storing collections in git.").is_visible(), "Maintainer tagline missing"
        assert page.locator("text=Desktop Native / Local Git Repositories").is_visible(), "Recommended stack missing"
        print("Maintainer showcase card verified on repo page.")

        # Capture final showcase screenshot
        page.screenshot(path="C:/Users/vasan/.gemini/antigravity-ide/brain/913d57c2-bfad-4d05-ac06-cb89894ec892/repo_verified_maintainer_showcase.png")

        browser.close()
        print("\nALL OPTION 3 & 4 PLAYWRIGHT CHECKS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    verify_options_3_and_4()
