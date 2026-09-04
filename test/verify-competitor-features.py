import urllib.request
import json
import os
import sys
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = os.environ.get(
    "ARTIFACT_DIR",
    r"C:\Users\vasan\.gemini\antigravity-ide\brain\885aab74-d085-4faf-b4fc-a9db60055e59",
)
os.makedirs(ARTIFACT_DIR, exist_ok=True)

def test_api_endpoints():
    print("=== Testing API Endpoints ===")

    # 1. RSS Feed
    print("1. Testing GET /feed.xml...")
    req = urllib.request.Request("http://localhost:3000/feed.xml")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        ctype = resp.headers.get("Content-Type", "")
        assert "xml" in ctype, f"Expected xml content type, got {ctype}"
        xml_data = resp.read().decode("utf-8")
        assert "<rss version=\"2.0\"" in xml_data, "Missing RSS 2.0 tag"
        assert "<channel>" in xml_data, "Missing channel tag"
        assert "<item>" in xml_data, "Missing item tag"
        print("   -> /feed.xml PASS (length: %d bytes)" % len(xml_data))

    # 2. Releases Feed
    print("2. Testing GET /releases.xml...")
    req = urllib.request.Request("http://localhost:3000/releases.xml")
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        xml_data = resp.read().decode("utf-8")
        assert "<rss version=\"2.0\"" in xml_data
        print("   -> /releases.xml PASS (length: %d bytes)" % len(xml_data))

    # 3. Upvotes GET & POST
    print("3. Testing Upvotes API...")
    req = urllib.request.Request("http://localhost:3000/api/upvotes")
    with urllib.request.urlopen(req) as resp:
        upvotes = json.loads(resp.read().decode("utf-8"))
        assert "supabase/supabase" in upvotes, "Missing supabase in upvotes"
        initial_count = upvotes["supabase/supabase"]
        print(f"   -> Current upvotes for supabase/supabase: {initial_count}")

    req = urllib.request.Request("http://localhost:3000/api/upvotes/supabase/supabase", method="POST")
    with urllib.request.urlopen(req) as resp:
        post_res = json.loads(resp.read().decode("utf-8"))
        assert post_res["count"] == initial_count + 1, f"Expected {initial_count + 1}, got {post_res['count']}"
        print(f"   -> Upvoted successfully, new count: {post_res['count']}")

    # 4. Reviews GET & Helpful vote
    print("4. Testing Reviews API...")
    req = urllib.request.Request("http://localhost:3000/api/reviews/supabase/supabase")
    with urllib.request.urlopen(req) as resp:
        rev_data = json.loads(resp.read().decode("utf-8"))
        assert rev_data["total"] >= 1, "Expected at least 1 review"
        print(f"   -> Found {rev_data['total']} reviews for supabase/supabase, average rating: {rev_data['averageRating']}")

    first_rev_id = rev_data["reviews"][0]["id"]
    req = urllib.request.Request(f"http://localhost:3000/api/reviews/supabase/supabase/{first_rev_id}/helpful", method="POST")
    with urllib.request.urlopen(req) as resp:
        help_res = json.loads(resp.read().decode("utf-8"))
        assert help_res["success"] is True
        print(f"   -> Voted review '{first_rev_id}' helpful! New count: {help_res['helpful']}")

def test_browser_ui():
    print("\n=== Testing Browser UI via Playwright ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()
        page.on("console", lambda msg: print(f"   [BROWSER CONSOLE {msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: print(f"   [BROWSER PAGE ERROR] {err}"))

        # 1. Stack Builder - Homelab NAS Tab
        print("1. Visiting Stack Builder to test Homelab NAS...")
        page.goto("http://localhost:3000/stacks/builder", wait_until="networkidle")
        page.wait_for_selector("button:has-text('Homelab NAS')", timeout=15000)

        # Click the Homelab NAS tab
        nas_tab = page.locator("button:has-text('Homelab NAS')")
        nas_tab.click()
        page.wait_for_timeout(500)

        # Verify CasaOS manifest is displayed
        assert "OpenSource Hub Stack" in page.content(), "CasaOS title missing"
        assert "services" in page.content(), "services JSON missing"

        # Screenshot CasaOS JSON
        shot1 = os.path.join(ARTIFACT_DIR, "homelab_nas_casaos_verified.png")
        page.screenshot(path=shot1, full_page=False)
        print(f"   -> Screenshot saved: {shot1}")

        # Switch to Unraid Template (XML)
        unraid_btn = page.locator("button:has-text('Unraid Template (XML)')")
        unraid_btn.click()
        page.wait_for_timeout(500)

        assert "Container version" in page.locator("pre").inner_text(), "Unraid XML missing"
        shot2 = os.path.join(ARTIFACT_DIR, "homelab_nas_unraid_verified.png")
        page.screenshot(path=shot2, full_page=False)
        print(f"   -> Screenshot saved: {shot2}")

        # 2. Repo Detail Page - Upvote button & Community Reviews
        print("2. Visiting /repo/supabase/supabase for Upvote & Reviews...")
        page.goto("http://localhost:3000/repo/supabase/supabase", wait_until="networkidle")
        page.wait_for_selector("button:has-text('Upvote')", timeout=15000)

        # Verify Upvote button
        upvote_btn = page.locator("button:has-text('Upvote')").first
        assert upvote_btn.count() > 0, "Upvote button not found"
        print("   -> Found Upvote button, clicking...")
        upvote_btn.click()
        page.wait_for_timeout(500)

        shot3 = os.path.join(ARTIFACT_DIR, "repo_upvoted_header_verified.png")
        page.screenshot(path=shot3, full_page=False)
        print(f"   -> Screenshot saved: {shot3}")

        # Scroll to Community Reviews
        print("3. Scrolling to Community Reviews...")
        page.wait_for_selector("text=Community Reviews", timeout=15000)
        reviews_section = page.locator("text=Community Reviews").first
        reviews_section.scroll_into_view_if_needed()
        page.wait_for_timeout(800)

        shot4 = os.path.join(ARTIFACT_DIR, "community_reviews_section_verified.png")
        page.screenshot(path=shot4, full_page=False)
        print(f"   -> Screenshot saved: {shot4}")

        # 4. Check Footer RSS link
        print("4. Checking Footer RSS link...")
        rss_link = page.locator("a:has-text('RSS')")
        assert rss_link.count() > 0, "Footer RSS link missing"
        rss_link.scroll_into_view_if_needed()
        page.wait_for_timeout(400)

        shot5 = os.path.join(ARTIFACT_DIR, "footer_rss_feed_verified.png")
        page.screenshot(path=shot5, full_page=False)
        print(f"   -> Screenshot saved: {shot5}")

        browser.close()
        print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_api_endpoints()
    test_browser_ui()
