# OpenSource Hub — Competitor Parity Plan (vs openalternative.co)

> Status: DEEP-CHECKED Aug 2026 — openalternative.co crawled page-by-page (home, tool detail,
> categories, compare, collections) with rendered-size measurements. Every gap mapped.
> Design lock: AGENTS.md Sentinel tokens. Architecture lock: local-first, $0, zero backend.

## Their moat (measured facts)
- 500+ tools / 19 pages, Inter 16px flat white, 50px nav, H1 48px/500/1.0 centered
- Detail page: stats sidebar (stars+30d delta, last commit, repo age, version, license link,
  self-hosted flag, repo link, sponsor button), long-form editorial description with internal
  links, 19 tags, "Built with" stack (75 items), 7 share buttons, similar projects
- **/compare/a/vs/b** head-to-head engine · **/alternatives/:tool** reverse pages with counts
- Hierarchical taxonomy: 8 top groups → ~70 subcategories, breadcrumbs everywhere
- Collections: latest/trending/self-hosted/AI-native/coming-soon/**graveyard**/**discounts**
- Freshness as content: "last commit 4h ago" on every card · category growth %
- Monetization: ad strip, sponsor grid, in-feed ads, managed-hosting affiliate

## What we already beat them on (do NOT regress)
Trust Score ring + appeals · OSV advisories · SHA256 checksums · savings pills (#FF5722)
· goal-first browsing · local-first CLI + Run App downloads · Learn section · giscus.

## Gap matrix → 8 build phases

### P1 — Card freshness (1-2h) ✦ cheapest, highest perceived-aliveness
- [ ] RepoCard: "commit Xh ago" relative chip next to stars (data already in snapshot meta)
- [ ] Detail stats strip: add repo age + version tag (both already fetched)
- Gate: build + screenshot · Files: RepoCard.jsx, RepoDetailPage.jsx

### P2 — Compare engine `/compare/:a/vs/:b` (3-4h)
- [ ] Route + ComparePage: side-by-side stat table (stars, delta, license, trust, security,
      freshness, savings) reusing TrustMeter + LicenseBadge + BrandLogo
- [ ] "Compare with" buttons from detail + cards; winner hints per row (no fake verdicts)
- Gate: route test + visual review · Files: ComparePage.jsx (new), routes (client-side only)

### P3 — Reverse alternatives pages `/alternatives/:paid` (2h)
- [ ] PaidToolPage: "N free alternatives to X" — count + cards + goal chips
- [ ] Home "People are looking for…" strip driven by pairing counts (replaces nothing —
      complements goal grid)
- Gate: units + screenshot · Files: PaidToolPage.jsx (new), data.js (countByPaid)

### P4 — Category hierarchy + breadcrumbs (3-4h)
- [ ] categories v2 in alternatives.json: 8 groups → subcategories (map from OA's taxonomy,
      pruned to our catalog)
- [ ] Breadcrumbs on detail/category pages; category pages with tool counts + growth %
      (growth from existing health-diff samples)
- Gate: schema test + nav walkthrough · Files: data.js, CategoriesPage.jsx, breadcrumbs.jsx

### P5 — Collections: graveyard + coming-soon + self-hosted (2h)
- [ ] lists.json: add graveyard (archived/stale) + coming-soon (pre-1.0) collections,
      auto-derived from trust/meta — honest labeling
- [ ] CollectionsPage listing all lists incl. existing 5 curated
- Gate: derivation tests · Files: lists.json, CollectionsPage.jsx

### P6 — Detail editorial + similar projects (content, ongoing)
- [ ] `editorial` field per pairing: 2-3 paragraph hand-written review with internal links
      (start with top 10 pairings; template for the rest)
- [ ] "Similar open source projects" block: same-category, same-license, ±star-band
- Gate: render test · Files: alternatives.json, RepoDetailPage.jsx

### P7 — Share + copy (1h)
- [ ] Copy Link + X/Reddit/HN share intents on detail (local app: share the GitHub repo URL)
- Gate: build · Files: RepoDetailPage.jsx

### P8 — Monetization hooks (DEFERRED to PRD Phase 3)
- Sponsored slots, discounts collection, managed-hosting affiliate: PRD explicitly gates
  these behind traffic. Do NOT build now. Placeholder: none (honest absence).

## Coordination
- web-dist static builder (other agent, in flight) = their SEO surface. P2-P5 must ALSO
  emit static routes there — coordinate before touching scripts/build-web-directory.mjs.
- No email capture / sign-in: requires backend — violates $0 architecture. Revisit Phase 3.

## Execution order
P1 → P7 → P3 → P2 → P5 → P4 → P6 (cheapest-alive first; compare engine before hierarchy).
Every phase: tests + build + Playwright screenshot + journal writeback.
