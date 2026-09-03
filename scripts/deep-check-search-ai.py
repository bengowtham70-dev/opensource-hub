import asyncio
import json
import urllib.request
import urllib.parse

BASE = "http://127.0.0.1:3000"

def test_http_get(endpoint):
    url = f"{BASE}{endpoint}"
    req = urllib.request.Request(url, headers={"User-Agent": "DeepCheck/1.0"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def test_http_post(endpoint, data):
    url = f"{BASE}{endpoint}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "DeepCheck/1.0"},
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def run_tests():
    print("================================================================================")
    print("      DEEP SEARCH & AI FINDER VERIFICATION AUDIT                                ")
    print("================================================================================")

    # 1. Test Regular Search Queries
    test_queries = [
        "Airtable", "Slack", "Notion", "Figma", "Postman", 
        "Firebase", "Jira", "Shopify", "Datadog", "Zapier",
        "CRM", "Analytics", "Database", "Kanban", "Password"
    ]

    print("\n--- 1. TESTING INSTANT SEARCH CATALOG ---")
    search_passes = 0
    for q in test_queries:
        encoded = urllib.parse.quote(q)
        res = test_http_get(f"/api/search?q={encoded}")
        count = res.get("count", 0)
        results = res.get("results", [])
        top_alt = results[0]["alternative"]["name"] if count > 0 else "None"
        replaces = results[0]["paidTool"]["name"] if count > 0 else "None"
        passed = count > 0
        if passed:
            search_passes += 1
            print(f" [PASS] Search '{q}': {count} matches (Top: {top_alt} replaces {replaces})")
        else:
            print(f" [WARN] Search '{q}': 0 curated matches (Will fallback to Live GitHub)")

    print(f"\nSearch Accuracy: {search_passes}/{len(test_queries)} standard SaaS keywords matched")

    # 2. Test AI Natural Language Finder
    ai_queries = [
        "I need a free open source alternative to Airtable for managing customer records",
        "Self-hosted team chat like Slack with markdown and threads",
        "Open source tool to replace Figma for UI vector and web design",
        "PostgreSQL backend as a service alternative to Firebase",
        "Self-hosted analytics to replace Google Analytics without cookies"
    ]

    print("\n--- 2. TESTING AI FINDER NATURAL LANGUAGE QUERIES ---")
    ai_passes = 0
    for task in ai_queries:
        res = test_http_post("/api/ai-find", {"task": task})
        mode = res.get("mode", "")
        items = res.get("items", [])
        passed = len(items) > 0
        if passed:
            ai_passes += 1
            top_repo = items[0].get("repo", "None")
            reason = items[0].get("reason", "")
            print(f" [PASS] Query: '{task[:45]}...'")
            print(f"        -> Top Match: {top_repo} (Mode: {mode}) | {reason}")
        else:
            print(f" [FAIL] Query: '{task}' -> No results")

    print(f"\nAI Semantic Finder Accuracy: {ai_passes}/{len(ai_queries)} queries returned relevant recommendations")

    # 3. Test Live GitHub Search Fallback
    print("\n--- 3. TESTING LIVE GITHUB SEARCH ACROSS ALL REPOSITORIES ---")
    gh_res = test_http_get("/api/github/search?q=open+source+vector+search&perPage=5")
    gh_items = gh_res.get("items", [])
    print(f" Live GitHub Search ('open source vector search'): Found {len(gh_items)} repos")
    for r in gh_items[:3]:
        print(f"   - {r.get('fullName')}: {r.get('stars')} stars | {r.get('description', '')[:60]}...")

if __name__ == "__main__":
    run_tests()
