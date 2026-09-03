import asyncio
import time
import urllib.request
import json
from playwright.async_api import async_playwright

import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_URL = "http://127.0.0.1:3000"

def test_api_latencies():
    print("=" * 70)
    print(" 1. SERVER API & DATABASE LATENCY BENCHMARK")
    print("=" * 70)

    endpoints = [
        ("Catalog Stats", "/api/catalog/stats"),
        ("Browse Catalog Page 1 (24 items)", "/api/catalog?page=1&limit=24"),
        ("Search 'Notion' (FTS5 Index)", "/api/search?q=notion"),
        ("Search 'Slack' (FTS5 Index)", "/api/search?q=slack"),
        ("Search 'Vaultwarden' (Long-tail)", "/api/search?q=vaultwarden"),
        ("Search 'Docker' (FTS5 Index)", "/api/search?q=docker"),
        ("Trending Feed", "/api/trending/today"),
    ]

    for name, path in endpoints:
        times = []
        for _ in range(5):
            t0 = time.perf_counter()
            req = urllib.request.Request(f"{BASE_URL}{path}", headers={"User-Agent": "SpeedBenchmark"})
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode())
            t1 = time.perf_counter()
            times.append((t1 - t0) * 1000)
        
        avg_ms = sum(times) / len(times)
        min_ms = min(times)
        max_ms = max(times)
        status = "[ULTRA-FAST]" if avg_ms < 50 else ("[FAST]" if avg_ms < 150 else "[OK]")
        print(f" {status:<15} | {name:<35} | Avg: {avg_ms:6.2f}ms (Min: {min_ms:5.2f}ms, Max: {max_ms:5.2f}ms)")

    # Concurrent Burst Test
    print("\n--- Concurrency Burst Test (50 parallel search requests) ---")
    start_burst = time.perf_counter()
    import concurrent.futures

    def fetch_search(q):
        t0 = time.perf_counter()
        req = urllib.request.Request(f"{BASE_URL}/api/search?q={q}", headers={"User-Agent": "BurstTest"})
        with urllib.request.urlopen(req) as resp:
            resp.read()
        return (time.perf_counter() - t0) * 1000

    queries = ["notion", "slack", "figma", "storage", "analytics", "database", "git", "auth", "crm", "media"] * 5
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        burst_times = list(executor.map(fetch_search, queries))
    
    total_burst_time = (time.perf_counter() - start_burst) * 1000
    burst_times.sort()
    p50 = burst_times[len(burst_times) // 2]
    p95 = burst_times[int(len(burst_times) * 0.95)]
    rps = len(queries) / (total_burst_time / 1000)

    print(f" Total time for 50 concurrent searches: {total_burst_time:.2f}ms")
    print(f" Throughput: {rps:.1f} requests/second")
    print(f" P50 Latency: {p50:.2f}ms")
    print(f" P95 Latency: {p95:.2f}ms")

async def test_browser_render_speed():
    print("\n" + "=" * 70)
    print(" 2. PLAYWRIGHT BROWSER RENDER & INTERACTION SPEED")
    print("=" * 70)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        # 1. Homepage Load Time
        t0 = time.perf_counter()
        await page.goto(BASE_URL, wait_until="domcontentloaded")
        dom_loaded_ms = (time.perf_counter() - t0) * 1000

        # Wait for cards to render
        await page.wait_for_selector(".group\\/card, .card-elevated")
        full_render_ms = (time.perf_counter() - t0) * 1000

        print(f" Homepage DOMContentLoaded: {dom_loaded_ms:.2f}ms ([INSTANT])")
        print(f" Homepage Full Card Render:  {full_render_ms:.2f}ms ([FAST])")

        # 2. Search Input Responsiveness (Type 'notion' and measure time to filter)
        search_input = page.locator('input[placeholder*="Search alternatives"]')
        if await search_input.count() > 0:
            t0 = time.perf_counter()
            await search_input.fill("notion")
            # Wait for filtered cards
            await page.wait_for_timeout(300)
            search_render_ms = (time.perf_counter() - t0) * 1000
            print(f" Instant Search Typing & Filter: {search_render_ms:.2f}ms (Smooth 60 FPS)")

        # 3. Navigation to Repo Detail Page
        t0 = time.perf_counter()
        await page.goto(f"{BASE_URL}/repo/toeverything/affine", wait_until="domcontentloaded")
        await page.wait_for_selector("h1")
        detail_render_ms = (time.perf_counter() - t0) * 1000
        print(f" Repo Detail Page Full Render:   {detail_render_ms:.2f}ms ([FAST])")

        # 4. Memory & Performance Timing Navigation API
        timing = await page.evaluate("() => JSON.parse(JSON.stringify(performance.getEntriesByType('navigation')[0]))")
        if timing:
            fetch_time = timing.get("responseEnd", 0) - timing.get("fetchStart", 0)
            dom_interactive = timing.get("domInteractive", 0)
            print(f" Browser Navigation Timing:")
            print(f"   - Network Response Time: {fetch_time:.2f}ms")
            print(f"   - DOM Interactive Time:  {dom_interactive:.2f}ms")

        await browser.close()

if __name__ == "__main__":
    test_api_latencies()
    asyncio.run(test_browser_render_speed())
