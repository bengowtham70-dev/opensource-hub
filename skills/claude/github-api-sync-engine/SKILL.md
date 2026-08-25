---
name: github-api-sync-engine
description: Best practices for high-performance GitHub REST & GraphQL API data synchronization, unauthenticated rate-limit protection (60 req/hr), release asset detection, and 30-day star trajectory generation.
---

# GitHub API Sync Engine & Rate Limit Architecture

## 1. Rate Limit Safeguards (Unauthenticated 60 req/hr)
- Never make continuous polling loops against GitHub's public REST API.
- Use ETag / `If-None-Match` caching to avoid consuming rate limit quota on unchanged data.
- Cache API responses in local JSON/SQLite with a 1-hour TTL.
- Graceful degradation: If rate-limited (HTTP 403), seamlessly serve local snapshot cache with a subtle "Cached" badge.

## 2. GitHub Release Asset Detection
- Fetch `https://api.github.com/repos/{owner}/{repo}/releases/latest`.
- Parse `assets[]` array matching file extensions:
  - Windows: `/\.(exe|msi)$/i`
  - macOS: `/\.(dmg|pkg)$/i`
  - Linux: `/\.(AppImage|deb)$/i`
- If a binary asset exists, mark tool as `"executable: true"` and extract `browser_download_url` and `size`.
- If only source code exists, mark tool as `"executable: false"`.

## 3. 30-Day Star Momentum & Sparkline Calculation
- Store rolling 30-day star count points: `[{ date: "2026-08-01", stars: 12000 }, ...]`.
- Normalize points to SVG path: `M 0,Y0 L 10,Y1 ...` scaled to `100x24` viewBox.
- Compute percentage change: `((currentStars - stars30DaysAgo) / stars30DaysAgo) * 100`.
