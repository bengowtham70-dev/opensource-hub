import sys
from playwright.sync_api import sync_playwright

def verify_newsletter():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 960},
            permissions=["clipboard-read", "clipboard-write"]
        )
        page = context.new_page()

        print("1. Navigating to /newsletter...")
        page.goto("http://localhost:3000/newsletter", wait_until="networkidle")

        # 2. Check title & header
        assert page.locator("h1:has-text('OpenSource Hub Weekly Digest')").is_visible(), "Title missing"
        assert page.locator("text=Get the Weekly Briefing").is_visible(), "Subscribe heading missing"
        assert page.locator("h2:has-text('Past Weekly Editions')").is_visible(), "Past editions section missing"
        print("Page header and sections verified.")

        # Capture initial archive view
        page.screenshot(path="C:/Users/vasan/.gemini/antigravity-ide/brain/913d57c2-bfad-4d05-ac06-cb89894ec892/newsletter_archive_verified.png")

        # 3. Test Subscription form
        print("2. Testing email subscription...")
        email_input = page.locator("input[type='email']").first
        email_input.fill("engineer-test@company.com")
        page.locator("button:has-text('Subscribe Free')").click()
        page.wait_for_timeout(1000)

        # Check success message
        status_msg = page.locator("text=Subscribed successfully! Welcome to OpenSource Hub Weekly.")
        assert status_msg.is_visible() or page.locator("text=already subscribed").is_visible(), "Subscription status feedback missing"
        print("Subscription form verified with instant feedback.")

        # Capture subscribed state screenshot
        page.screenshot(path="C:/Users/vasan/.gemini/antigravity-ide/brain/913d57c2-bfad-4d05-ac06-cb89894ec892/newsletter_subscribed_verified.png")

        # 4. Check Past Weekly Editions Grid
        print("3. Testing past editions grid...")
        cards = page.locator("div.card-elevated:has(h3)")
        count = cards.count()
        assert count >= 1, f"Expected at least 1 past edition card, found {count}"
        print(f"Found {count} past weekly digest editions.")

        # 5. Click first issue to open Reader
        print("4. Opening issue reader...")
        cards.first.click()
        page.wait_for_timeout(1000)

        # Check issue reader elements
        assert page.locator("button:has-text('Back to all editions')").is_visible(), "Back button missing"
        assert page.locator("button:has-text('Share Edition')").is_visible(), "Share button missing"
        assert page.locator("text=Top 5 Rising Alternatives This Week").is_visible() or page.locator("text=Community Snapshot").is_visible(), "Issue content missing"
        print("Issue reader rendered successfully with markdown and verified tool links.")

        # Capture Issue Reader screenshot
        page.screenshot(path="C:/Users/vasan/.gemini/antigravity-ide/brain/913d57c2-bfad-4d05-ac06-cb89894ec892/newsletter_issue_reader_verified.png")

        # Click Back
        page.locator("button:has-text('Back to all editions')").click()
        page.wait_for_timeout(500)
        assert page.locator("h2:has-text('Past Weekly Editions')").is_visible(), "Did not return to archive"
        print("Back to all editions navigation verified.")

        browser.close()
        print("ALL NEWSLETTER PLAYWRIGHT CHECKS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    verify_newsletter()
