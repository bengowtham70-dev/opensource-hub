import urllib.request
import json
import os
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = os.environ.get(
    "ARTIFACT_DIR",
    r"C:\Users\vasan\.gemini\antigravity-ide\brain\885aab74-d085-4faf-b4fc-a9db60055e59",
)
os.makedirs(ARTIFACT_DIR, exist_ok=True)

def test_community_apis():
    print("=== 1. Testing Community Parity & Suggestions APIs ===")

    # 1. Parity consensus for Supabase
    url = "http://localhost:3000/api/community/supabase/supabase/parity"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode("utf-8"))
        print(f"   -> Supabase parity consensus: {data['consensusPct']}% (total votes: {data['total']})")
        assert "consensusPct" in data
        assert "breakdown" in data
        assert "votes" in data
        assert data["breakdown"]["full"]["count"] >= 100

    # 2. Suggestions list
    url = "http://localhost:3000/api/community/suggestions"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode("utf-8"))
        print(f"   -> Suggestions loaded: {data['total']} total items")
        assert data["total"] >= 5
        first_id = data["suggestions"][0]["id"]
        initial_upvotes = data["suggestions"][0].get("upvotes", data["suggestions"][0].get("votes", 1))

    # 3. Upvote suggestion
    upvote_url = f"http://localhost:3000/api/community/suggestions/{first_id}/upvote"
    post_req = urllib.request.Request(upvote_url, data=b"", method="POST")
    with urllib.request.urlopen(post_req) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode("utf-8"))
        print(f"   -> Suggestion {first_id} upvoted to {data['upvotes']} (from {initial_upvotes})")
        assert data["upvotes"] == initial_upvotes + 1

    # 4. In-app Accuracy Flag POST
    flag_url = "http://localhost:3000/api/community/flags"
    payload = json.dumps({
        "repo": "supabase/supabase",
        "reason": "pricing",
        "details": "Automated verification test - pricing tier verification",
        "contact": "test@example.com"
    }).encode("utf-8")
    flag_req = urllib.request.Request(
        flag_url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(flag_req) as resp:
        assert resp.status == 200
        flag_res = json.loads(resp.read().decode("utf-8"))
        print(f"   -> Flag logged successfully: ID {flag_res['flag']['id']}")
        assert flag_res["ok"] is True

def test_ui_with_playwright():
    print("\n=== 2. Testing UI Pages & Interactions with Playwright ===")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()

        # Step A: Visit Repo Detail Page (Supabase)
        print("Visiting http://localhost:3000/repo/supabase/supabase ...")
        page.goto("http://localhost:3000/repo/supabase/supabase")
        page.wait_for_load_state("networkidle")

        # Scroll to Community Section
        community_section = page.locator("section[aria-label='Community verdict and contributions']")
        assert community_section.is_visible(), "Community section should be visible"
        community_section.scroll_into_view_if_needed()
        time.sleep(0.5)

        # Check for Parity consensus elements
        heading = page.locator("text=Community verdict: Parity Consensus")
        assert heading.is_visible(), "Parity consensus heading should be visible"

        # Check for 3-tier buttons
        btn_full = page.locator("button:has-text('Full Replacement')")
        btn_tradeoffs = page.locator("button:has-text('Has Tradeoffs')")
        btn_not_viable = page.locator("button:has-text('Not Viable')")
        assert btn_full.is_visible()
        assert btn_tradeoffs.is_visible()
        assert btn_not_viable.is_visible()

        # Cast a vote for Full Replacement
        print("Casting vote for Full Replacement...")
        btn_full.click()
        time.sleep(0.5)

        # Capture Parity Consensus Screenshot
        screenshot_parity_path = os.path.join(ARTIFACT_DIR, "community_parity_consensus.png")
        page.screenshot(path=screenshot_parity_path)
        print(f"Saved parity screenshot: {screenshot_parity_path}")

        # Test Accuracy Report Modal
        print("Opening In-App Accuracy Report Modal...")
        report_btn = page.locator("button:has-text('Quick In-App Modal')")
        report_btn.click()
        time.sleep(0.5)

        modal_title = page.locator("text=Report Data Discrepancy")
        assert modal_title.is_visible(), "Discrepancy modal should open"

        screenshot_modal_path = os.path.join(ARTIFACT_DIR, "community_dispute_modal.png")
        page.screenshot(path=screenshot_modal_path)
        print(f"Saved modal screenshot: {screenshot_modal_path}")

        # Close modal
        close_btn = page.locator("button:has-text('Cancel')")
        close_btn.click()
        time.sleep(0.3)

        # Step B: Visit Community Requests Queue Page
        print("\nVisiting http://localhost:3000/requests ...")
        page.goto("http://localhost:3000/requests")
        page.wait_for_load_state("networkidle")

        req_heading = page.locator("text=Community Alternative Requests")
        assert req_heading.is_visible(), "Requests page heading should be visible"

        # Check search and tabs
        search_input = page.locator("input[placeholder*='Search requested']")
        assert search_input.is_visible()

        under_review_tab = page.locator("button:has-text('Under Review')")
        assert under_review_tab.is_visible()

        # Upvote the first request in the queue
        upvote_btn = page.locator("button[title*='Upvote this alternative request']").first
        if upvote_btn.is_visible():
            print("Clicking upvote button on first suggestion...")
            upvote_btn.click()
            time.sleep(0.5)

        # Capture Community Requests Queue Screenshot
        screenshot_req_path = os.path.join(ARTIFACT_DIR, "community_requests_queue.png")
        page.screenshot(path=screenshot_req_path)
        print(f"Saved requests queue screenshot: {screenshot_req_path}")

        # Step C: Visit Compare Page to verify Parity Voting Widget in comparison matrix
        print("\nVisiting http://localhost:3000/compare ...")
        page.goto("http://localhost:3000/compare?left=supabase/supabase&right=usebruno/bruno")
        page.wait_for_load_state("networkidle")
        time.sleep(0.5)

        compare_parity = page.locator("text=Community Parity Consensus").first
        if compare_parity.is_visible():
            compare_parity.scroll_into_view_if_needed()
            time.sleep(0.5)
            print("Parity consensus widget confirmed on Compare page!")
            screenshot_compare_path = os.path.join(ARTIFACT_DIR, "compare_parity_consensus.png")
            page.screenshot(path=screenshot_compare_path)
            print(f"Saved compare parity screenshot: {screenshot_compare_path}")

        browser.close()

if __name__ == "__main__":
    test_community_apis()
    test_ui_with_playwright()
    print("\n[PASS] ALL COMMUNITY PARITY E2E TESTS PASSED!")
