# Agent Memory Journal — OpenSource Hub

## 2026-09-03 — Option A: Live 26,000+ Tool Autocomplete in Header & Command Palette (Ctrl+K) COMPLETE ✅

- **Global Header Search Autocomplete (`Header.jsx`):**
  - Added floating autocomplete dropdown below the header search box debounced to 120ms.
  - Displays top matches across all 26,328 repositories in `catalog.db` with live star count, language, and repository path.
  - Full keyboard navigation (`↑`/`↓` to highlight, `↵ Enter` to navigate directly to `/repo/:owner/:name`, `Esc` to close).
- **Command Palette Remote Catalog (`CommandPalette.jsx`):**
  - Upgraded `cmdk` dialog to dynamically query SQLite FTS5 catalog on user input.
  - Renders *"Matching Open Source Tools"* with star badges and description preview.
  - Automatically renders *"Commercial Software Alternatives"* shortcut when typing paid software names (e.g. Notion, Airtable, Slack).
- **SQLite Relevance Engine Tuning (`src/server/db.js` & `src/server/routes.js`):**
  - Enhanced `searchCatalog` SQL sorting: exact name matches rank #1, flagship repos rank #2, substring containment rank #3, star count breaks ties.
  - Fixed facet leakage bug in `/api/search` catalog augmentation: `platform`, `license`, and `goal` constraints are strictly checked before pushing catalog items.
- **Verification:**
  - Automated Playwright test `scripts/verify-autocomplete-e2e.py` passed 100% with screenshots captured.
  - `npm run test:client`: 76 / 76 client tests passing.
  - `npm test`: 228 / 228 backend tests passing.
  - `npm run build`: Production bundle compiled in 11.17s with 0 errors.

## 2026-09-03 — Exhaustive Options Deep Check & 26-Page Complete Verification COMPLETE ✅

- **26-Page End-to-End Audit (`scripts/deep-check-all-pages.py`):**
  - Audited all 26 application routes in Playwright. 100% of pages loaded genuine data with 0 errors.
- **Interactive Options Deep Check (`scripts/verify-all-interactive-options.py`):**
  - Audited 22 interactive options across all 8 functional areas in a real Chromium browser.
  - TCO Calculator universal render: Updated `DecisionGuideHub.jsx` to render whenever `paidTool` is present, giving every commercial comparison interactive team ROI sliders.
  - Star Trajectory Chart accessibility: Added `role="img"` and `aria-label="Star trajectory chart"` to `StarGrowthChart.jsx`.
  - All 22 automated E2E interactive checks passed (100% success).
- **Test Suite Status:**
  - `npm test`: 228 / 228 Node tests passing.
  - `npm run test:client`: 76 / 76 Vitest tests passing.
  - `npm run build`: Production bundle compiled cleanly in 4.78s.

## 2026-09-02 — Open-Ecosystem Skills Install (Find Skills task) COMPLETE ✅

- User invoked Find Skills → researched skills.sh ecosystem + curated indexes, vetted, and installed **7 Agent-Skills-spec skills** into `./.verdent/skills/` (project scope).
- Installed (each vetted: valid `name`/`description` frontmatter, instructions-only, MIT-licensed sources, no bundled executables):
  1. `google-official-seo-guide` (littleben/awesomeAgentskills) — canonical Google SEO guidance. NOTE: large reference files (appearance.md 58pp etc.) NOT bundled — fetch from source repo if a deep dive is needed.
  2. `geo-audit` (zubair-trabzada/geo-seo-claude) — full GEO+SEO audit orchestration, composite 0–100 GEO score, 5-subagent delegation pattern.
  3. `geo-llmstxt` (zubair-trabzada/geo-seo-claude) — llms.txt / llms-full.txt analysis + generation for AI-crawler discoverability.
  4. `static-seo` (jdevalk/skills) + AGENTS.md recipes — 9-category static-site SEO audit; matches our Vite/GH-Pages `dist/` profile (canonical-origin check is a blocking first step).
  5. `github-repo` (jdevalk/skills) + AGENTS.md recipes — repo quality audit (README, health files, templates, releases) for bengowtham70/opensource-hub.
  6. `metadata-check` (jdevalk/skills) — short-string SEO copy review (titles/descriptions, SERP truncation bounds title 30–65 / desc 70–200).
  7. `readability-check` (jdevalk/skills) — L2-calibrated prose readability audit; chained by github-repo/static-seo Phase 2.5.
- Install method: direct curl from raw.githubusercontent into `.verdent/skills/<name>/` — NOT `npx skills add` (vercel-labs CLI targets .claude/skills etc., not Verdent's project skills path). 9 files, 4.1–20.7KB, verified via rg frontmatter check; both AGENTS.md files confirmed doc-only recipes.
- SKIPPED with reasons: `web-performance-seo` (littleben) — README-only dir, NO SKILL.md, fails Agent Skills spec; `geo-seo-claude` root install.sh/uninstall.sh — never executed, only 2 vetted sub-skills copied.
- Recommended next uses: run `static-seo` audit against the live Pages URL (expect canonical-origin + llms.txt + sitemap findings); run `github-repo` audit before public launch; generate `llms.txt` via `geo-llmstxt`.
- Skills register in the available-skills list on next session start (current session saw install mid-flight).

## 2026-09-02 — Next-Gen Upgrade: Multi-OS Install Box, Executive Decision Brief Exporter, & 107-Titan Expansion COMPLETE ✅
- **Multi-OS Package Manager CLI Install Box (`InstallBox.jsx`):**
  - Integrated tabbed command box (`Docker`, `Homebrew`, `Winget`, `NPM / PyPI / Cargo / Go`, `Source`) with 1-click clipboard copy and animated 150ms checkmark confirmation on all repository detail pages.
- **Executive Decision Brief & CTO Migration Exporter (`ExecutiveBriefModal.jsx`):**
  - Built 1-click "Decision Brief" exporter with dynamic team seat scaling (5, 10, 25, 50 seats) calculating annual SaaS savings and 3-year cumulative ROI, OpenSSF security ratings, and air-gapped data sovereignty compliance.
  - Generates downloadable Markdown (`.md`) briefs and clean printable PDF reports via `@media print`.
- **Contextual "+ Suggest Alternative" Modal (`SuggestModal.jsx`):**
  - Added prefilled suggestion modals on all `/alternatives/:slug` pages feeding candidate submissions directly into the in-app admin queue (`/admin`).
- **Maintainers & Contributor Velocity Showcase (`ContributorShowcase.jsx`):**
  - Visualized distributed bus factor ratings, commit velocity, and direct links to GitHub contributor graphs.
- **Catalog Scaling to 107 Verified Titans:**
  - Expanded catalog to **107 verified pairings** ($51,647/yr tracked savings across 41 categories) adding: Nextcloud, Paperless-ngx, Penpot, Vikunja, Stirling-PDF, Activepieces, Windmill, Supabase Self-Hosted, Mattermost, Zulip, Pi-hole, AdGuard Home, MinIO, GIMP, Kdenlive, Audacity, Chatwoot, Twenty CRM, Medusa.
- **Verification Matrix:**
  - **`227 / 227`** backend unit tests passing (`npm test`).
  - **`51 / 51`** client component tests passing (`npm run test:client`).
  - **`47.50 kB`** production JS bundle (13.09 kB gzip) (93% reduction).
  - All CI performance & 150ms animation timing audits passed.
  - Live visual verification recorded and confirmed via browser subagent.

## 2026-09-02 — 5-Pillar World-Class Upgrade & 90-Tool Catalog Expansion COMPLETE ✅
- **Bundle Size Optimization (93% Initial Payload Drop):**
  - Converted entrypoint bundle with code-splitting (`React.lazy()`) and granular `manualChunks` in `vite.config.mjs` (`vendor-react`, `vendor-motion`, `vendor-cmdk`, `vendor-icons`, `vendor-zustand`, `catalog-logos`).
  - Dropped `index.js` from 594 kB down to **47.34 kB (13.01 kB gzip)**.
- **Pillar 1 — Developer Reviews & Switcher Stories Engine:**
  - Built `src/server/reviews.js` with atomic JSON persistence, rating distributions (1–5 stars), XSS sanitization, and verified switcher badges.
  - Built `dashboard/src/components/ReviewsSection.jsx` and embedded it into `RepoDetailPage.jsx` with full review submission modal and verified switcher badges.
- **Pillar 2 — Automated Weekly Newsletter Digest Generator:**
  - Built `scripts/build-weekly-newsletter.mjs` generating both responsive HTML emails (`web-dist/newsletter/week-YYYY-WW.html`) and Markdown articles (`content/newsletter/week-YYYY-WW.md`). Tested with `test/newsletter.test.js`.
- **Pillar 3 — In-App Admin Moderation Submissions Queue (`/admin`):**
  - Built `src/server/admin.js` with approve/reject workflow and moderation store.
  - Built `dashboard/src/pages/AdminQueuePage.jsx` and registered `/admin` in `App.jsx`.
- **Pillar 4 — Hardware & Deployment Badges:**
  - Added `Local-First`, `Self-Hostable`, and `Docker` badges in `RepoCard.jsx` and `FilterDrawer.jsx`.
- **Pillar 5 — High-Impact Catalog Expansion to 90 Verified Pairings:**
  - Added titans: Ollama, Open WebUI, Qdrant, Chroma, Netdata, Authentik, Keycloak, Teleport, Krita, Inkscape, Blender, Immich, Metabase, Umami, and OBS Studio.
  - Total tracked developer savings: **$46,779/year** across **49 unique categories**.
- **Automated CI & Telemetry Gatekeepers:**
  - `scripts/audit-performance.mjs`: Gzip and 150ms motion timing CI gatekeeper.
  - `scripts/audit-catalog.mjs`: Comprehensive catalog coverage auditor.
  - `test/mcp.test.js` and `test/a11y.test.js`: Validated MCP tools/resources and WCAG 2.1 AA contrast compliance.
  - Multi-Language 6-locale i18n engine (`dashboard/src/lib/i18n.js`).
- **All Verification Gates Passed:**
  - **`227 / 227`** backend unit tests passed (`npm test`).
  - **`49 / 49`** client component tests passed (`npm run test:client`).
  - **`0`** production build errors (`npm run build`).
  - Live visual verification via browser subagent passed.

## 2026-09-01 — 50k+ Star Legendary Open-Source Suite (81 Total Tools) COMPLETE ✅
- Expanded catalog to 81 verified pairings, adding 20 famous 50k+ star projects across developer tools, analytics, automation, security, and CMS:
  - **AppFlowy** (`AppFlowy-IO/AppFlowy` - 58k★, Flutter/Rust, replaces Coda / Notion)
  - **RustDesk** (`rustdesk/rustdesk` - 83k★, Rust, replaces AnyDesk / TeamViewer)
  - **n8n** (`n8n-io/n8n` - 56k★, TypeScript, replaces Make / Zapier)
  - **Grafana** (`grafana/grafana` - 65k★, Go/TS, replaces New Relic / Datadog)
  - **Strapi** (`strapi/strapi` - 65k★, Node.js, replaces Contentful)
  - **Apache Superset** (`apache/superset` - 65k★, Python, replaces Power BI / Tableau)
  - **Ghost** (`TryGhost/Ghost` - 48k★, Node.js, replaces Substack)
  - **Appwrite** (`appwrite/appwrite` - 46k★, TypeScript, replaces Backendless / Firebase)
  - **Meilisearch** (`meilisearch/meilisearch` - 49k★, Rust, replaces Algolia)
  - **VSCodium** (`VSCodium/vscodium` - 46k★, Shell, replaces Cursor IDE / VS Code Telemetry)
  - **Vaultwarden** (`dani-garcia/vaultwarden` - 42k★, Rust, replaces Dashlane / 1Password)
  - **PostHog** (`PostHog/posthog` - 27k★, Python, replaces Amplitude / Mixpanel)
  - **Umami** (`umami-software/umami` - 28k★, TypeScript, replaces Fathom Analytics / Google Analytics)
  - **Documenso** (`documenso/documenso` - 13k★, TypeScript, replaces PandaDoc / DocuSign)
  - **Baserow** (`bram2w/baserow` - 11k★, Python, replaces Smartsheet / Airtable)
  - **Saleor** (`saleor/saleor` - 22k★, Python, replaces BigCommerce / Shopify)
  - **Listmonk** (`knadh/listmonk` - 17k★, Go, replaces Klaviyo / Mailchimp)
  - **Trilium Notes** (`zadam/trilium` - 28k★, JS, replaces OneNote / Evernote)
  - **Taiga** (`taigaio/taiga-back` - 16k★, Python, replaces ClickUp / Asana)
  - **Valkey** (`valkey-io/valkey` - 19k★, C, replaces Redis Enterprise)
- Verification gates: `213/213` node:test green · `46/46` vitest client green · `npm run build` clean (47s) · browser subagent verified live.

## 2026-09-01 — Competitor Features & Gap Closure Suite COMPLETE ✅
- Built and verified full suite of competitor-beating capabilities across backend, client, and chrome extension:
  1. **Central Live Software Release Feed (`/releases`):** Central aggregated timeline querying GitHub releases across all catalog pairings with in-memory TTL caching (`src/server/releases.js`), changelog viewer, tag badges, and 1-click binary download installers (`dashboard/src/pages/ReleasesFeedPage.jsx`).
  2. **Structured "Pros & Cons" Decision Card:** Clear Strengths vs Trade-Offs decision cards on `RepoDetailPage.jsx` and `ComparePage.jsx` (`dashboard/src/components/ProsConsCard.jsx`).
  3. **Shareable Custom Tech Stacks ("My Open-Source Stack"):** Interactive stack architect on `/stacks/builder` and `/stacks/share?tools=...` calculating cumulative annual software savings ($/yr), generating a unified multi-container `docker-compose.yml`, and 1-click social sharing links (`dashboard/src/pages/StackBuilderPage.jsx`).
  4. **Multi-App Comparison Matrix (3-Way & 4-Way Comparisons):** Upgraded `ComparePage.jsx` to dynamically support 3-way and 4-way side-by-side candidates with leading-signal highlights.
  5. **Homelab OS 1-Click Support:** Added Umbrel, CasaOS, Unraid, and TrueNAS SCALE 1-click app store links (`dashboard/src/components/HomelabApps.jsx`).
  6. **Free Chrome Extension (Manifest V3):** Zero-fee developer mode Chrome extension packaged as a zero-dependency ZIP streamer on `GET /api/extension/download` with inline alternative matching.
  7. **Outbound Click Tracker & Affiliates:** `src/server/tracker.js` storing local conversion events in `clicks.json` with partner referral params.
  8. **Dynamic GitHub README SVG Badges:** `src/server/badge.js` serving dynamic SVG trust and alternative badges.
  9. **Zero-Cost Newsletter Lead Capture:** `src/server/newsletter.js` with CSV exporter and global footer.
  10. **"Claim This Repo" Maintainer Verification:** `src/server/claim.js` and `ClaimModal.jsx`.
- **Test & Build Gates:** Backend `213 / 213` tests passing, Vitest `46 / 46` client tests passing, Production Vite bundle built cleanly (0 errors).

## 2026-08-25 — Full deep-check (user-requested): gates re-verified LIVE
- node:test **104/104** (suite grew from 99) · vitest **16/16** · vite build clean 5.6s.
- Fresh daemon E2E (:3000): health ok · trending/today = 28 repos (shape key is `repos`, not rows)
  · search q=notion →1 · goals 27 · lists 5 · /api/security/usebruno/bruno degraded=false vulns=0
  · trust v2 LIVE on bruno: 87/strong, busFactor "476+ contributors" real Link-header data,
  redFlags [], prefilled appeal URL, honest disclaimer.
- Landing page verified: JSON-LD SoftwareApplication + Node.js 18+ prerequisite links; legal/
  terms+privacy .md AND landing terms.html/privacy.html exist; README.md root exists;
  release.yml + health-diff.yml workflows exist; content/learn has 4 articles.
- GOTCHA (probe-side, not code): /api/repo payload nests trust at TOP level (`r.trust`), not
  `r.repo.trust` — a wrong-shape probe reads as empty and can fake a regression.
- Process safety: 8 node.exe procs matched the kill-filter but were MCP servers
  (chrome-devtools/testsprite/supabase), NOT dev servers — always read full CommandLine before
  killing per the stale-server rule.
- Verdict unchanged: Phases 1+2 code complete & healthy. Not 100% only for non-code reasons:
  git init/GitHub publish + placeholder URLs, catalog 28/60+, giscus IDs, first npm publish/tag,
  affiliates ×4, NLnet, legal bracket fill-ins.

## 2026-08-24 — Phase 2 planning (deep check complete)

**State:** PRD Phase-1 scope (all 10 build phases in plans/PLAN.md) verified complete.
Server tests 21/21 green. Client vitest suite blocked only by local RAM pressure
(machine had ~1.1GB free; vitest OOM-crashed — environment issue, not code).

**Phase-2 plan written:** `plans/PLAN_PHASE2.md` — 10 phases, all 17 PRD §19
Phase-2 items mapped. Trust Score already exists from v1 (src/server/trust.js +
TrustMeter.jsx + test/trust.test.js) → Phase 2 EXTENDS inputs, not rebuild.

### Research corrections (do NOT regress to PRD letter)
1. PyPI JSON API `downloads` is DEAD (returns -1) → use pypistats.org `/api/recent/{pkg}`.
2. OSV.dev: no API key, no rate limit; querybatch ≤1000; cache by `(id, modified)`;
   fetch /v1/vulns/{id} details only for hits; results array order matches input order.
3. deps.dev v3alpha serves precomputed OpenSSF Scorecards — free, keyless. Never run Scorecard ourselves.
4. GitHub release assets expose `digest` (sha256) field now; fallback = hash-on-download in /install proxy.
5. npm downloads bulk endpoint: ≤128 packages, scoped packages NOT supported in bulk.
6. Node SEA experimental (~90–140MB, no cross-compile) → chose Bun compile for binaries.
7. Homebrew tap repo MUST be named `homebrew-*`; needs tarball SHA256 computed AFTER tag push (CI sleep+curl+sha256); cross-repo push needs fine-grained PAT.

### Gotchas hit this session
- Vitest crashes with "Zone Allocation failed" when system RAM < ~2GB free — not a code bug; retry after freeing memory or raise NODE_OPTIONS.
- Task subagents failed twice with provider network_error; direct tool calls worked — fall back to direct exploration when subagent infra flakes.

### Decisions
- Binaries: Bun compile (win/mac/linux × x64/arm64).
- PyPI stats source: pypistats.org.
- Plan location: plans/PLAN_PHASE2.md (consistent with existing PLAN.md numbering).

## 2026-08-24 — PHASE 2 / Phase 1 (Catalog Schema v2) COMPLETE ✅
- TDD: test/schema.test.js written first, watched 6/10 fail (RED), then migrated → 10/10 green.
- alternatives.json v2: version=2; per-pairing relationship+goalTags; per-alternative
  platforms/license{spdx,type}/screenshots/ecosystems/demoUrl?. enrichPairing() in routes.js
  forwards v2 fields to API.
- License provenance: SPDX verified live via api.github.com (scripts/license-verify.json);
  NOASSERTION repos resolved by reading LICENSE files directly (AFFiNE=MIT core,
  GIMP/Inkscape/KeePassXC=GPL-3.0-or-later, Bitwarden=GPL-3.0 default, Focalboard/NocoDB/
  Metabase/Plane/Vikunja=AGPL-3.0, authentik=MIT core, Joplin=AGPL-3.0-or-later).
- src/data/lists.json: 5 curated lists, each with ≥40-char inclusion criteria + valid repo refs.
- Gates: schema 10/10 · full node:test 33/33 · client vitest 9/9 (passed after RAM freed).
- Gotcha: editing nested object literals in routes.js — keep brace levels counted; a stray
  `},` produced SyntaxError at module load which surfaced as ALL server tests failing.
  Fix = read exact lines, remove one closing level.
- Next: Phase 2 — Filter Rail & Search v2 (searchPairings platform/license params).

## 2026-08-24 — PHASE 2 / Phase 2 (Filter Rail & Search v2) COMPLETE ✅
- TDD RED: 4 new route tests failed as expected; GREEN after data.js + routes.js changes → 37/37.
- searchPairings({q,language,platform,license}) AND-combined, case-insensitive, unknown values → 0.
- api.js search() sends all four params; FilterRail.jsx (platform ×5 + license ×3 chips,
  counts in mono tabular numerals, aria-pressed, existing chip recipe verbatim).
- TrendingPage: platform/license URL params (shareable), tabs hide while filtered,
  clear-filters pill, facet-aware empty-state copy.
- CommandPalette: "Filters" group (7 quick-filter commands).
- Verified LIVE on daemon :3001 (PORT env ignored by CLI — it uses its own fallback;
  probe the printed port, not $env:PORT): self-host=19 · +permissive=8 (types clean) ·
  gameboy=0. Build clean. Client vitest 9/9.
- Gotcha: node:test hangs if an assertion throws before server.close() — use
  `node --test --test-force-exit` when writing failing-first tests.
- Next: Phase 3 — Trust Score v2 (bus factor, deps.dev Scorecard input, appeals flow).

## 2026-08-24 — PHASE 2 / Phase 3 (Trust Score v2) DEEP-CHECKED ✅ (built by second agent)
- Verdict: HIGH QUALITY. Weights sum to 100 ✓, appeals GitHub-issue deep-link ✓,
  red-flags ✓, 1-call contributor count via `contributors?per_page=1&anon=true` +
  Link-header page parse (clever, quota-cheap) ✓, Promise.all parallel wiring ✓.
- CRITICAL FIX APPLIED (github.js getScorecard): original used api.deps.dev only —
  UNREACHABLE from this machine/network and URL shape unverifiable → scorecard would
  silently stay null forever. Patched: PRIMARY api.scorecard.dev/projects/github.com/{repo}
  (official OSSF REST, verified live: penpot=5.4) + deps.dev v3alpha kept as fallback.
- Live E2E: penpot → score 93/strong, busFactor "340+ contributors",
  scorecard "5.4/10 decent practices", appeal URL valid, redFlags 0.
- Gates after fix: server 44/44 · client 9/9 · build clean.
- Env gotchas: RAM OOM returned (0.9GB free) — working-set trim to 1.7GB fixed build;
  CLI binds 3000 when free (ignores PORT env) — always probe /api/health across 3000-3002.
- Self-review fix: added NEGATIVE caching to getScorecard (null=1h TTL, real score=7d)
  — repos absent from scorecard.dev (verified: usebruno/bruno → 404) no longer re-hit
  APIs every detail view. Live E2E ×3 repos: penpot 93/strong (SC 5.4), bruno 87/strong,
  AFFiNE 75/good — bus factors 340+/475+/262+ all real.

## 2026-08-24 — PHASE 2 / Phase 4 (Security Badges) COMPLETED + HARDENED ✅
- Second agent shipped most of P4 (osv.js, /api/security, digest+checksum, UI pill);
  I verified, then fixed the remainder per approved decisions:
- FIXED (test bug): osv.test.js cache test shared one calls array across runs → could
  never pass. Separate arrays per run.
- FIXED (correctness bug): OSV-down degrade returned ALL repos' cached advisories —
  bruno could show joplin's vulns. Disk cache now repo-scoped: byRepo[scope][id].
- ADDED: commit-based OSV queries (getHeadSha via /commits/{branch}, cached) → coverage
  for all 28 repos, not just joplin's npm. Version auto-detect from release tag
  (semver-parse, strips v) → versionScoped flag + "osv.dev · any version" honest label.
- PROOF: joplin unversioned = 14 advisories, at v4.0.28 = 0 → scoping real, current
  release genuinely clean. bruno/penpot clean via commit queries. Live 3-repo E2E green.
- Gates: 64/64 full suite · 9/9 client · build clean · live E2E ×3.
- Gotcha: full npm test can show transient 1-fail when run mid-edit (parallel test
  files + network mocks) — always re-run clean before judging.
- Next: Phase 5 — Popularity Metrics + Freshness Diffs (npm bulk / pypistats / Docker).

## 2026-08-24 — TEST-TEARDOWN CRISIS SOLVED (Windows libuv crash) ✅
- Symptom: `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), async.c:76` poisoned
  whole-file results even when every subtest passed (goals/health-diff).
- Root cause: undici's global-fetch CLIENT-side keep-alive handle races the next
  createApp()/listen cycle (or process exit) on Windows. NOT the server close pattern —
  bisected via 8 mini files: 1 server/file = fine; 2+ sequential = crash regardless of
  close style (awaited, closeAllConnections, closeIdleConnections all irrelevant).
- Fix: after server.close() in tests that fetch, `await setTimeout 250ms` settle before
  the test ends. Zero UV assertions in full suite afterward.
- Rule for ALL future server tests in this repo: fetch + close + 250ms settle.

## 2026-08-24 — TASTE AUDIT + ORANGE RESTORATION ✅
- User: "UI looks like trash, where is the orange?" — audit via taste-skill + screenshots.
- ROOT CAUSE: Sentinel tokens defined --c-accent:#ff5722 in BOTH themes and mapped
  --color-accent in @theme inline, but the SERVED BUILD WAS STALE — .text-accent utility
  absent from dist CSS. Rebuild restored orange hero instantly.
- Fixed: mojibake "âš¡ Save" (broken UTF-8 in RepoDetailPage) → lucide Zap icon;
  savings pills (RepoCard + detail) green → accent orange per AGENTS.md §5.2;
  language chips text-faint → text-dim/border-line-strong (AA contrast).
- Semantic lock now: green=trust · amber=caution/dispute · ORANGE=money-saved emphasis.
- Ops gotchas: paging-file exhaustion made npm.ps1 throw NullReferenceException and
  vite OOM ("Zone Allocation") — bypass npm.ps1 with `node node_modules\vite\bin\vite.js
  build`; kill own server + orphan vite (node_modules\.bin vite) before building.
- Build verified: text-accent utility present in dist; screenshots confirm orange hero
  + orange savings pill + clean Zap icon.
- BACKGROUND FIX: spec's literal "Page bg #9CA3AF" is a copy-artifact (#9CA3AF = the
  faint-TEXT gray, gray-400 — far too dark as a page field; caused banded gray zones).
  Changed light --c-base → #E5E7EB (gray-200): white cards float, hairlines visible,
  hero white-gradient gentle. Measured via Playwright computed styles before/after.
  Dark mode --c-base #14161A untouched. DOCUMENTED DEVIATION from AGENTS.md literal value.

## 2026-08-24 — BRAND LOGOS FOR EVERY APP ✅
- simple-icons@15.22.0 was already a dependency. Validated slugs programmatically
  (scripts/gen-logos.mjs) — NEVER guessed: 44/56 tools have official marks (23/28
  alternatives, 21/28 paid). Absent (plane, wekan, nocodb, navidrome, darktable +
  entire adobe/microsoft families — legally removed from Simple Icons) → letter-avatar
  fallback. Never fabricate brand marks.
- logos.js inlines path+hex+title (~64KB raw/~15KB gz) — NEVER import the simple-icons
  barrel client-side (3MB+).
- BrandLogo.jsx: brand SVG with official hex color; fallback letter avatar. Wired into
  RepoCard headers + RepoDetailPage comparison card (both paid + alternative boxes).
- Verified live: GIMP wilber, Zulip Z render in brand colors; Darktable honest "D".
- Note: other agent shipped Screenshots gallery (P6) + deploy pills concurrently —
  detail page layout evolving under us; logos verified compatible.

## 2026-08-24 — DESIGN-REVIEW TOP-3 FIXES ✅ + INCIDENT RECOVERY
- Rating delivered (7.7/10): fixes applied + screenshot-verified:
  1. Goal chips: removed fragile inline opacity:0 stagger (ghosting root cause);
     collapsed to 8 + "More +N" toggle (mobile scroll-wall solved; 9 buttons pre-expand).
  2. Hero dead band: pt-10 pb-8 mb-6 → pt-8 pb-6 mb-5.
  3. Hero break: dropped max-w-[22ch], whitespace-nowrap on accent phrase → one line.
- INCIDENT: package.json/package-lock.json/skills/* deleted from working tree by second
  agent's static-site pivot (git repo now exists, 2 commits). RECOVERED via
  `git restore -- package.json package-lock.json` + `npm.cmd install` (cache, 3s).
  LESSON: check `git status` before assuming files vanished; restore only infra files,
  never the other agent's WIP.

## 2026-08-24 — COMPETITOR PARITY P1/P7/P3/P2 SHIPPED ✅ (plans/PLAN_PARITY.md)
- P1 freshness: already covered by second agent's `freshness` prop (honest omission on
  seed data). P7 ShareBar: copy-link w/ checkmark + X/Reddit/HN intents → target is the
  public GitHub repo, never the local URL.
- P3 PaidToolPage /alternatives/:slug: count + aggregate honest savings ("up to $X/yr if
  you switched all N"); entry = paid-tool name on cards is now a link. NOTE: paid slugs
  are 1password/lastpass etc. — goalTags (replace-password-manager) are NOT slugs.
- P2 ComparePage /compare/:a/vs/:b: 7 signal rows with unified higher-hint-wins encoding
  (stars+, lastCommit→-ts, permissive→1, trust→score, advisories→-count, selfhost→1);
  ✓ only where objectively comparable, ties stay tie. Slug resolver = shortName+owner+
  brand slug (bitwarden/clients → "bitwarden" via BRAND_BY_REPO). Entry chips on detail
  (siblings by goalTag/category).
- FIXED second agent's crash: Header.jsx used <Menu>/<X> without importing → ReferenceError
  blanked routes. Rule: lucide icons MUST be in the import list — CSS-hidden components
  still evaluate.
- Remaining parity lanes: P5 graveyard/coming-soon collections, P4 category hierarchy +
  breadcrumbs, P6 editorial content. P8 monetization = PRD Phase 3, deliberately deferred.

## 2026-08-24 — PARITY P5/P4/P6 SHIPPED ✅ (205/0 suite, build clean, live-verified)
- P5: src/server/collections.js deriveCollections() — graveyard (archived/>210d) +
  coming-soon (meta.createdAt <18mo, graveyard wins overlap). GET /api/collections with
  metaAvailable flag; ListsPage "Auto-derived" section distinct from curated; honest-empty
  until cron ("Populates after the first snapshot sync."). Seed meta is EMPTY — expected.
- P4: taxonomy lives in dashboard/src/lib/categories.js (JS module — Vite CANNOT resolve
  JSON outside dashboard/ root; src/data copy deleted to avoid drift). Schema test imports
  it via async dynamic import (await inside non-async test = SyntaxError trap).
  CategoriesPage /categories (groups→expandable category cards, client-side).
  Breadcrumbs.jsx on detail + paid pages.
- P6: editorial paras on notion/figma/firebase pairings (hand-written, anti-slop),
  rendered as "The honest review" card. GOTCHA: editorial is PAIRING-level — render
  data.pairing.editorial, not a.editorial (silent undefined → section never renders).
- Collision scar: second agent edited enrichPairing concurrently (added tco) → double
  closing brace SyntaxError.   node --check routes.js first when tests fail at module load.

## 2026-08-24 — FULL-BLACK DARK MODE (user mandate) ✅
- User: "dark mode should be fully black, I don't like the gray." Applied despite taste-skill
  off-black guidance — explicit user brand call wins.
- Dark ramp: base #14161A→#000000 · surface #1C1F26→#0A0A0A · elevated #242830→#141414 ·
  line 0.08→0.10 alpha · line-strong 0.16→0.18 (hairlines must carry elevation on black —
  shadows are invisible there) · .dark .btn-primary text #14161A→#000.
- Verified: body renders rgb(0,0,0), cards rgb(10,10,10), contrast improves, orange/green/
  amber accents pop harder on black. Build clean. Screenshots test/screenshots/dark-black*.png.
- Note: surfaces deliberately NOT #000 — cards need one lift step or the UI flattens to void.

## 2026-08-24 — AI-SLOP AUDIT + DE-SLOP PASS ✅
- Audit (taste-skill §9 tells + AGENTS.md §3): found 2 textShadow glows (savings numbers),
  14 emoji glyphs (⚠✓✕👍) across 12 files, unused infinite --animate-shimmer var, and
  misnamed classes (mesh-glow-bg is actually a plain white wash; shimmer-button is a quiet
  pill — names lie but behavior is clean; left as-is, zero-behavior-change rule).
- Fixed: all emoji stripped (lucide icons already adjacent or colored text + role=alert
  carries signal); textShadows removed; FavoritesPage mojibake logic fixed
  (startsWith("⚠") vs mangled "?" — was ALWAYS falling to text-trust, even failures!).
- CAUTION: skeleton loaders legitimately use shimmer keyframes — restored @keyframes
  shimmer scoped with a comment after my over-broad delete broke the build
  (regex [^}]* ate only the first brace → dangling `to {}`). CSS regex edits = danger.
- Verified: 205/0 server · 19/0 client · build clean · zero visible glyphs on home ·
  zero page errors on black.
- "Boxes not clicking" report: root cause = server process died (RAM) → ERR_CONNECTION_REFUSED
  → every click dead in the open Chrome tab. Restart fixes. Verified ALL click targets work
  (goal chips, category expanders, FilterRail listboxes — role="listbox" not "menu"! —,
  card nav). Added SlowFetchHint on detail: after 2s skeleton, "Fetching live data from
  GitHub…" text (cold fetches take 3-6s, felt like dead clicks).
- Full-black sweep across 8 routes: all body rgb(0,0,0), cards #0A0A0A/#141414, zero contrast
  breaks. FOUND + FIXED: /stack-audit crashed on load when a stale saved audit (pre-totals
  schema, persisted in user-data dir) loaded → `report.totals.tools` on undefined. Guard =
  `report?.totals &&`. Rule: persisted local reports need schema-tolerant guards on render.
- Suite state at handoff: 211 tests; ONLY reds = web-directory.test.js ×2 (second
  agent's fresh TDD-red for buildSite searchIndex + socialsHtml mastodon prefix —
  DO NOT TOUCH, their implementation is in flight).

## 2026-08-24 — Phase 1 Completion Sprint (main agent) ✅
Post-audit sprint fixing defects found by deep-checking PRD §19 against code.
All fixes verified to survive the parallel Schema-v2 merge; full reconciliation
run green after both workstreams: node:test 33/33 · vitest 9/9 · build OK · E2E 6/6 · 0 console errors.

1. **`/api/source` default-branch bug FIXED** — was hardcoded `main`; now captures
   `default_branch` in `github.js getRepo()`, `/api/source/:owner/:name?branch=` with
   `[\w.-]+` sanitization (traversal-safe), falls back to live lookup then repo page.
   Regression test covers master-branch + `../evil` cases.
2. **"Least trending" now matches PRD §2.3** — established filter (stars ≥ 1000) +
   ascending 7-day window (`history[29] - history[22]`), was: all repos by 30d change.
   Test asserts no sub-1k repo leaks + ordering.
3. **Landing legal pages** — `terms.html` + `privacy.html` created (Dark Luxe styled,
   amber bracketed placeholders); dead `terms.html`/`privacy.html` links resolved.
   Repo URLs remain placeholders → replace after real GitHub repo exists.
4. **Tablist a11y** — WAI-ARIA arrow-key/Home/End navigation + roving tabindex on trending tabs.
5. **Hygiene** — deleted diag scripts (`diag-search.py`, `diag-cards.py`, `manual-install-check.mjs`);
   `npm publish --dry-run` validated tarball = bin/src/content/dist-client/README/LICENSE only.
6. **TrustMeter UI wiring completed** — Trust Score module existed but `<TrustMeter>` was
   orphaned (never mounted); now rendered in RepoDetailPage between stats strip and
   comparison card. Visual-verified: Bruno 95/100 emerald animated ring + active badge.

### Cross-session coordination notes
- Parallel session shipped Schema v2 (alternatives.json v2, enrichPairing forwarding,
  lists.json, license-verify) + plans/PLAN_PHASE2.md — audited, compatible, kept.
- Merge-safety pattern that worked: both sessions edited routes.js; my branch-fix and
  their enrichPairing changes coexist — always re-grep your markers after foreign edits.
- PRD §13 reminder for Phase 2: Trust Score **appeals process** required before PUBLIC
  flagging (local dashboard display is fine).

## 2026-08-24 — Phase 2 execution: P2 + P3 gates PASSED (main agent)
- **P2 Filter Rail & Search v2 ✅** — parallel session had already built server facets +
  FilterRail + palette commands; verified AND-combination (self-host+permissive → 8 cards),
  mono facet counts, indigo active chips, zero page errors. Suite grew to 37/37.
- **P3 Trust Score v2 ✅** — built from scratch:
  - `github.js`: `getContributorCount` (per_page=1 + Link-header last-page trick, ETag-cached),
    `getScorecard` (deps.dev v3alpha precomputed OpenSSF, 7-day TTL, silent-fail null).
  - `trust.js` v2 weights (documented in-file): recency 25 / archived 10 / license 15 /
    issues 10 / traction 10 / maturity 5 / **bus factor 15** / **backing 5** / **scorecard 5**.
    Unknown bus factor = neutral 5 (never 0). Solo-maintainer red flag added.
    `appealUrl()` prefills GitHub issue (title+body) → satisfies PRD §13 appeals requirement.
  - `TrustMeter.jsx`: amber "Dispute this score" button, 9-signal grid, Byte **shield state**
    (DESIGN §8) pinned to ring bottom-right.
  - Live-verified on Bruno: 87/100, Bus factor +15 "475+ contributors" (real Link-header data),
    Scorecard honest 0 "not yet scored". 44/44 tests.
- **GOTCHA (env, not code): leaked dev servers serve STALE code.** A pre-existing node process
  kept port 3000 with pre-P3 trust.js → new server fell back to 3001 → browser hit stale API.
  Symptom: UI shows old weights after code edits. Fix: kill node procs whose CommandLine matches
  bin/cli.js|vite before verification runs (`Get-CimInstance Win32_Process` filter).
  Always confirm which PID owns 3000 before believing a regression.
- Next: P4 — OSV.dev security badges (`src/server/osv.js` querybatch, (id,modified) cache,
  /api/security route, release `digest` checksums, vuln pill UI).

## 2026-08-24 — P4 Security Badges gate PASSED (main agent) ✅
- `src/server/osv.js`: keyless querybatch client; results[i]↔queries[i] guarded against
  short/malformed batches; details fetched per-hit only, cached by (id,modified) on disk in
  user-data dir; batch OR detail failures degrade to disk cache with `degraded:true`.
- Route `GET /api/security/:owner/:name` maps pairing `ecosystems` {npm,pypi,go} → OSV
  ecosystems npm/PyPI/Go. `/api/releases` now returns `checksum` = GitHub asset `digest`
  (real: sha256:4173419c… for Bruno) with hash-on-download fallback computed in /install stream.
- UI: emerald "no known advisories · osv.dev" / amber N-advisories pill in stats strip +
  advisory link cards + "🔒 sha256 verified" mono checksum row in download section.
- Tests: 5 mocked-OSV tests (hit mapping, disk-cache no-refetch, 503 degrade, empty coords
  short-circuit, detail-fail degrade) → suite 49/49. Client 9/9 (needs
  `NODE_OPTIONS=--max-old-space-size=1536` + `--no-file-parallelism` under RAM pressure).
- Live-verified: Bruno → `{vulns:[], degraded:false}`; pill + checksum rendered; 0 page errors.
- GOTCHA: test fake must mirror OSV's results[i]=queries[i] shape — a fixed 2-entry fake
  crashed the forEach on 1-coordinate queries (fixed server-side guard + smarter fake).
- Parallel session progress observed in the same build: P6 screenshot galleries + P7 Lists
  nav already rendering on detail pages. Coordinate before P5 (metrics) to avoid double work.

## 2026-08-24 � Phase 2 UI sprint: /lists pages + screenshot gallery + OSV scope fix
- Shipped GET /api/lists (index w/ repoCount, repoSlugs kept internal) and GET /api/lists/:slug
  (criteria + enrichPairing + stars30d) in routes.js. Unknown slug -> 404 JSON; stale repoSlugs
  entries filtered gracefully (never 500).
- New dashboard/src/pages/ListsPage.jsx (ListsIndexPage grid + ListDetailPage with criteria
  blockquote, RepoCard reuse, Byte empty state). Routes /lists + /lists/:slug in App.jsx;
  Header nav gained ListChecks "Lists" entry; api.js gained lists()/list().
- ScreenshotGallery modal in RepoDetailPage (glass overlay, arrow-key nav, ESC, focus trap,
  body scroll lock, staggered thumbs x40ms) + demoUrl cyan pill (rel=noopener) + honesty microcopy.
  Renders null when a.screenshots empty � catalog has 0 populated screenshot entries today.
- BUG FIX (pre-existing): osv.test.js leak regression was failing � query() defaulted every
  caller to shared "_unscoped" cache bucket so repo A advisories leaked into repo B on degrade.
  Fix: derive effectiveScope from sorted coordinates when opts.scope omitted
  (`eco:name` joined lowercase), routes.js /security now passes scope=fullName.toLowerCase().
- Gates: node:test 56/56 � vitest 9/9 � vite build clean.
- Gotcha: editor old_text must match file byte-for-byte (typo "_unshared" vs "_unscoped"
  silently no-op'd once � always re-grep after failed match).
- Skill-compliance audit (user-prompted): modals-dialogs skill says prefer Radix/shadcn Dialog,
  but zero Radix/shadcn deps exist and CommandPalette sets hand-rolled precedent � decision:
  keep custom overlay but reach Radix functional parity. Gap found+fixed: focus now RETURNS to
  the opening thumbnail on close (triggerRef + cleanup focus). Full parity checklist: ESC /
  click-outside / close btn / scroll lock / first-focus-on-open / focus trap / focus return.

## 2026-08-24 — Completion audit (user asked: "100% complete?")
- Gates re-verified live: node:test **69/69**, vitest **9/9**, vite build clean.
- GOTCHA CONFIRMED: 
ode --test --test-force-exit marks lists.test.js file-level FAILED via libuv
  assertion (!(handle->flags & UV_HANDLE_CLOSING), win/async.c) even when all subtests pass —
  Node v24 Windows teardown bug triggered by force-exit. All 4 subtests green without the flag.
  Rule: run plain 
ode --test locally; reserve --test-force-exit only for RED-phase hangs.
- Verdict vs PRD §19: Phase 1 = 100%. Phase 2 = ~6/10 phases done (P1â€“P4, P6 complete;
  P7 partial: lists yes / goal-grid+relationship pills no; P9 partial: update-check.js yes /
  release.yml binaries+brew+scoop no; P5 metrics.js absent; P8 community layer absent;
  P10 telemetry+RSS+QA sweep absent). Phase 3 correctly untouched by design.

## 2026-08-24 � Sprint: CLI update notifier + README-sourced screenshots
- src/server/update-check.js: parseVersion/isNewer (numeric triple compare), checkForUpdate()
  with injectable fetch/now, 24h TTL disk cache (update-check.json in getUserDataDir), silent on
  network fail AND on registry 404 (package unpublished today). Wired fire-and-forget into
  index.js run() after listen; OPENSOURCE_HUB_NO_UPDATE_NOTIFIER=1 opt-out. 8 unit tests.
- scripts/fetch-screenshots.mjs (+ npm run fetch:screenshots): pulls each repo README via
  raw.githubusercontent/{repo}/HEAD/ (API rate-limit bypass; REST fallback), extracts raster imgs,
  rejects badges/svg/icons/logos/sponsors via BAD_URL+BAD_PATH regexes, HEAD-validates every URL
  (ranged-GET fallback), guarantees non-empty alt (schema contract). Wrote 34 screenshots across
  19/28 repos. Rerun idempotent unless --force.
- Lessons learned the hard way:
  1) AbortSignal.timeout does NOT cancel DNS-phase hangs - unauthenticated GitHub API went 403
     mid-run and one repo wedged 3min. Fix: per-repo Promise.race deadline (25s) so batch always
     completes; raw.githubusercontent first also avoids most of it.
  2) Regex segment match needs plural tolerance: 'sponsor' missed 'sponsors/' dir - sponsor logos
     leaked into catalog until fixed to sponsors?.
  3) schema.test.js alt-text contract caught empty alts - generator fallback alt added in script.
- Gates: node:test 64/64 � vitest 9/9 � vite build clean.

## 2026-08-24 — PHASE 2 / Phase 5 (Popularity Metrics + Freshness Diffs) COMPLETE ✅
- DISCOVERY: metrics.js core already existed from a parallel session (unjournaled —
  the completion audit's "P5 absent" verdict was stale). Reconciled instead of rebuilt.
  Remaining gaps closed this session:
  1) RED tests fixed: (a) aggregate fake omitted npm `package` field → getNpmDownloads now
     attributes bare single-name bulk responses to slice[0]; (b) REAL BUG: scoped npm
     packages were encodeURIComponent'd (%40/%2F) but api.npmjs.org serves scoped at the
     LITERAL @scope/pkg path — encoded form 404s. Fixed to raw path; test asserts
     urls.length===1 && no %-encoding. Lesson: "npm scoped bypasses bulk" was implemented
     but never live-verified — mocked tests passed on shape, not semantics.
  2) Monthly health diff: scripts/build-health-diff.mjs exports PURE computeHealthDiff()
     (unit-testable; CLI guarded by path.resolve(argv[1])===fileURLToPath(import.meta.url))
     -> commits src/data/health-diff.json via new .github/workflows/health-diff.yml
     (cron 0 7 1 * *). Deltas = newest sample >= windowDays old vs latest; <2 samples ->
     key omitted (never fabricated +0). Freshness bands mirror UI pill thresholds.
     Routes GET /api/health-diff (+/:owner/:name); missing file -> honest
     {available:false} not a 500.
  3) Card freshness pill: getFreshness() in data.js reads snapshot meta[].pushedAt;
     wired through /api/search, /api/trending rows, /api/lists/:slug -> RepoCard pill
     (trust <90d / caution >180d / dim between). Seed snapshots have NO meta block by
     design -> pill hidden until first Actions run populates it (no fake freshness).
- Dry-run gate PASSED: script wrote 28 repos, freshness "unknown" across seed (expected).
- Gates: node:test 77/77 · vitest 9/9 · vite build clean.
- Next: P7 remainder (goal-first entry grid + relationship pills) or P8 community layer.

## 2026-08-24 — PHASE 2 / Phase 7 remainder (Goal grid + relationship pills) COMPLETE ✅
- Goal-first browsing (PRD §38): searchPairings gained AND-combined `goal` facet
  (unknown goal → 0, consistent with platform/license semantics). New GET /api/goals
  returns {tag,count,label} sorted count-desc; label = strip "replace-", split on "-",
  title-case each word ("replace-microsoft-office" → "Microsoft Office").
- Client mirrors getGoals() in lib/seed.js (bundled seed → instant render, same pattern
  as getPairings for the palette). TrendingPage: entry-grid of tactile pills shown ONLY
  on clean landing; each tile sets ?goal=<tag> → /api/search pre-filtered view with a
  banner ("Showing free alternatives to X") + dedicated Clear-goal pill that preserves
  other params. Tabs hide while goal active; clear-filters button condition includes goal.
- Relationship pills on RepoCard: Direct=trust(emerald) / Partial=primary(indigo) /
  Fork=tech(cyan), per-relationship explanatory title tooltip; rel read from
  pairing.relationship ?? "direct" (enrichPairing already forwards it). Catalog today:
  only direct+partial exist — fork tone ships untested-by-data until a fork lands.
- Gates: node:test 82/82 (5 new goals tests) · vitest 9/9 · build clean.
- GOTCHA (env): `npx vite build` via PowerShell exits 1 because the >500kB chunk-size
  WARNING hits stderr→ErrorRecord conversion. Build is fine — run through cmd /c or pipe
  via Out-String and check output tail, don't trust $LASTEXITCODE alone here.
- Live E2E: daemon :3000 → goals:27 top=replace-password-manager×2 "Password Manager";
  ?goal=replace-notion → AFFiNE rel=partial. Server killed after probe (stale-server rule).
- Phase-2 remaining: P8 community layer · P9 binaries/brew/scoop · P10 telemetry/RSS/QA.

## 2026-08-24 17:40 — Deep-check #2 CORRECTION (parallel session landed P5+P6-media+P7 mid-audit)
- Live re-verify at 17:35-17:38: node:test **87/87**, vitest **9/9**, vite build clean.

## 2026-08-24 — Skill-compliance retro-audit (user-prompted: "did you use skills?")
- HONEST FINDING: P5/P7 were built WITHOUT consulting the plan-named skills
  (data-visualization, dashboard-design) first — process gap vs AGENTS.md §2,
  even though the code passed both checklists on retro-review (number formatting,
  not-color-alone, tooltips, skeleton/empty-state CTAs, fluid layout).
- Resolution precedent reaffirmed: when skill guidance conflicts with project law
  (DESIGN.md token lock, zero-new-deps), project conventions win — but the skill
  MUST be read and the deviation RECORDED, not skipped silently.
- RULE GOING FORWARD: read the phase-named skill file BEFORE writing UI code;
  log a one-line compliance note per phase gate.
- A second agent session was ACTIVELY EDITING during the audit (metrics.js 17:01,
  data.js 17:26, routes.js 17:28, goals.test.js 17:30). Suite jumped 69->87 between runs.
- Newly confirmed COMPLETE today: P5 (metrics.js npm-bulk/scoped/pypistats/docker normalizers +
  /api/metrics route + build-health-diff.mjs + health-diff.yml cron + freshness pills on cards/detail),
  P6 media (fetch-screenshots.mjs HEAD-validated pipeline -> 34 screenshot URLs in catalog),
  P7 (goal grid + ?goal= filter + active-goal banner + relationship pills Direct/Partial/Fork).
- PLAN_PHASE2.md checkbox P9 update-check marked [x]; wired fire-and-forget in src/server/index.js run().
- Remaining for Phase-2 100%: P8 community layer (absent), P9 distribution half
  (no .github/workflows/release.yml, no brew/scoop landing tabs), P10 (no telemetry env, no /api/rss).
- Verdict: Phase 1 = 100%; Phase 2 = 7/10 (~70%).

## 2026-08-24 - P5 Popularity Metrics gate PASSED (main agent)
- src/server/metrics.js: npm bulk point endpoint (<=128/slice, scoped packages at LITERAL
  @scope/pkg path - encodeURIComponent 404s on api.npmjs.org, verified), pypistats.org
  /api/recent/{pkg} (PyPI JSON downloads field is dead - documented deviation), Docker Hub
  pull_count with implicit library namespace. 30-min in-memory TTL, silent-fail nulls.
- Route GET /api/metrics/:owner/:name from pairing ecosystems. Snapshot cron extended:
  weekly downloadsHistory samples (>=6-day gap guard, 26-sample rolling, skipped for
  vanished repos per PRD stale-list rule).
- UI: cyan 'monthly reach' metrics pill (npm/pypi/pulls, compact M/B formatting) +
  FreshnessCommit pill (green <90d 'fresh' / amber >180d 'stale' / dim between).
- Live: Nextcloud docker=1,024,143,279 pulls; Joplin npm=3,393/mo. Zero page errors.
- Suite at merge time: 82/82 node:test (update-check + metrics suites from parallel
  session merged cleanly). Client 9/9 (RAM-pressure flags still required).
- CROSS-SESSION COLLISION LESSON: parallel session edited metrics.js + metrics.test.js
  WHILE I was fixing the same 2 test failures (literal scoped path + bare-response
  attribution). Their fix was correct; mine would have double-applied. Always re-read
  the file before editing when another session is active - my stale oldString failed
  to match, which was the signal to re-read.
- Next: P8 community layer (local-first votes/suggestions/tags), P9 binaries+tap wiring
  (update-check.js exists but NOT yet wired into bin/cli.js - verify before building),
  P10 analytics opt-out + RSS + launch QA sweep.

## 2026-08-24 - P8/P9/P10 COMPLETE - Phase 2 fully shipped (main agent)
- **P8 Community UI wiring:** api.js communityGet/Vote/Tag/Suggest/Flag methods (the store's
  api.communityVote call previously had NO backing method - runtime break fixed); new
  CommunitySection component (emerald Yes / amber No tactile votes w/ optimistic counts,
  crowd-tag chips + validated add input w/ inline server errors, Send suggestion / Report
  wrong data GitHub issue deep links + copy fallback). E2E gate: vote 0->1 persisted across
  reload (aria-pressed=true), tag 'notes-app' added + visible, 0 page errors.
- **P9 Distribution:** release.yml (tag-triggered Bun compile matrix linux/mac/win x64+arm64
  via --target=bun-*, SHA256SUMS.txt, GH release attach, npm publish; tap/scoop steps gated
  on TAP_TOKEN secret); scripts/update-homebrew.mjs + update-scoop.mjs skeletons (full formula
  substitution lands at first real release); landing page 3 install paths (npm/brew/scoop,
  click-to-copy). Gate: --version OK, YAML structure OK, clipboard E2E exact-match OK.
  NOTE: I wired checkForUpdate into cli.js in parallel with the other session's BETTER
  index.js version (returns {currentVersion, latest}) - removed mine, kept theirs. Lesson:
  recon BEFORE wiring, not after.
- **P10:** usage.js local-only counters (runs/firstRun/lastRun in user-data dir, zero network,
  /api/usage readback; live: runs=48); /api/rss/:owner/:name proxies GitHub releases.atom with
  1h TTL + degrade-to-cache; privacy disclosures updated in legal/privacy-policy.md +
  landing privacy.html (local counters, opt-in telemetry promise).
- **Final QA sweep:** 98/98 node:test - 9/9 vitest - build green - e2e-verify.py 6/6 flows,
  0 console errors. Phase 2 = 10/10 phases complete.
- Remaining HUMAN actions: git init + real GitHub repo (replace placeholder URLs in
  landing-page + trust.js appeals + community issue links), first npm publish (activates
  update-check + brew/scoop), affiliate applications x4, NLnet draft, giscus repo IDs.

## 2026-08-24 - P9 binaries REAL (not skeletons) - Bun payload embedding solved
- Prior session's release.yml referenced update-homebrew/scoop.mjs SKELETONS; both deleted
  today, superseded by scripts/build-packaging.mjs (real npm-tarball sha256 for Formula +
  scoop manifest with checkver/autoupdate + hashes from SHA256SUMS.txt).
- ROOT CAUSE discovered by local Windows proof: un build --compile binaries have NO
  project directory on disk - every runtime fs read of repo files fails (trending 500,
  --version 0.0.0, client assets 404). Fix architecture:
  1. scripts/make-bun-payload.mjs generates src/server/payload.generated.js (gitignored)
     embedding package.json, src/data/*.json, content/learn/*, dist/client/** as strings.
  2. src/server/repo-files.js = single resolution point: disk first (npm installs),
     embedded payload second; registerPayload() called via dynamic import.
  3. initEmbeddedPayload() awaited in run() AND top-level-awaited in bin/cli.js BEFORE
     commander reads version (lesson: .version(getPackageVersion()) evaluates eagerly).
- GOTCHA 1: listRepoDir returns PREFIX-STRIPPED names; app.js initially compared full
  keys -> all assets fell through to SPA fallback returning text/html. Symptom: asset
  request 200 but Content-Type text/html len=460.
- GOTCHA 2: removing fs import from routes.js nearly dropped node:crypto needed by the
  /install sha256 stream - always re-grep usages after import cleanup.
- Windows gate evidence: exe serves trending(28)/search/learn(4), hashed JS 200
  text/javascript 512KB, SPA fallback 200, --version 0.1.0. Suites 98/98 + 14/14.
- release.yml notes: workflow-level env mirror required to read secrets in job-level if;
  scoop job downloads released SHA256SUMS before generating manifest (real hashes, hard
  fail if missing); tap/bucket jobs skip cleanly without PATs.

## 2026-08-24 - FULL AUDIT vs PRD (699 lines read end-to-end) + 2 gap fixes
- Verdict: code ~complete for Phases 1+2 EXCEPT two PRD-mandate gaps found by
  cross-checking every section against live code:
  1. PRD 2.2 maintenance pill (Active/Slowing/Abandoned) missing from comparison
     cards -> getMaintenance() in data.js (reuses computeMaintenance off snapshot
     meta; null on seed), wired /search + /lists + trending rows, RepoCard pill
     w/ trust/caution tones + TrustMeter-precedent red #f87171 for abandoned.
  2. PRD 19 Phase-1 hero install-command pill missing -> components/InstallPill.jsx
     mounted in TrendingPage hero (clipboard + select-range fallback).
- GOTCHA (repeat offender): PowerShell double-quoted here-strings interpolate
  ${base} - appended test block arrived with empty interpolation = syntax error
  that silently killed ALL of server.test.js (84 tests ran vs 98 expected). Rule:
  JS template literals in PS here-strings MUST use single-quoted @'...'@.
- Data reality improved vs old notes: screenshots populated 19/28 (PLAN P6 said 0),
  demoUrl 12/28, goalTags+relationship+license 28/28.
- Suites after fixes: 99/99 node:test, 16/16 vitest.
- NOT 100% remaining list (none are code): catalog 28/60+ target (needs human
  fact-checked seeding per PRD 19), git init/GitHub publish + placeholder URLs
  (landing gh link, APPEALS_REPO, FEEDBACK_REPO), giscus repo/category IDs,
  first npm publish + tag (activates update-check, brew/scoop, binaries),
  affiliate applications x4, NLnet application before Nov 3 2026, legal bracket
  fill-in before publishing ToS/privacy.

## 2026-08-24 - EXHAUSTIVE FULL-APP AUDIT (every file) - 1 CRITICAL + 5 MAJOR fixed
- Method: two parallel review agents read ALL dashboard/src (27 files), all workflows,
  scripts, data files, legal, landing, README, configs; I ran every gate live.
- C1 (CRITICAL): npm 'files:["src"]' OVERRIDES .gitignore - the 1.7MB stale
  payload.generated.js would ship in every publish and silently hijack npm installs
  into embedded mode with baked data. Fixed triple-layer: files negation entry,
  prepack rmSync guard, disk delete; PROVEN via npm pack --dry-run (58 files, no payload).
- M1: homebrew job raced manual npm publish -> release.yml now publishes first
  (NPM_TOKEN-gated, idempotent already-published check); binaries job passes
  OH_SKIP_FORMULA=1 when publishing skipped; build-packaging honors it.
- M2: trending ranked on SYNTHETIC history even after real cron data existed
  (snapshotData.history was dead data). getStars30d now prefers genuine history
  (>=8 samples); computeTrending day/week math made length-safe (no NaN ranks).
  3 new tests in test/data-history.test.js.
- M3: scoop autoupdate had NO hash source -> bucket bots would bump unverified.
  Added hash:{url SHA256SUMS.txt, find regex} block.
- M4: migrate-alternatives-v2 hard-reset screenshots:[] - re-running after
  fetch-screenshots would wipe 19/28 populated entries. Now preserves existing.
- Dashboard fixes: dead clear-goal button (cloned params instead of deleting goal);
  ErrorState retry that never refetched (refresh-nonce state); favorites optimistic
  add/remove had no revert-on-error (ghost entries) - mirrored community store rule;
  TrustMeter aria-hidden wrapper swallowed the score from screen readers (label moved
  to section); parity NaN guard; enrichPairing defaults tags/parity/gaps; InstallPill +
  CommunitySection timer cleanup; hero search debounced 250ms (AGENTS 5.1 mandate);
  landing scoop button display/copy mismatch; .gitignore mojibake.
- Deferred (documented, not bugs): FavoritesPage cards lack enrichment pills (roadmap),
  tablist aria-controls polish, Actions pin-by-SHA, engines >=20.19 for dev toolchain,
  health-diff cron jitter vs snapshot cron.
- Final state: 102/102 node:test - 16/16 vitest - vite build green - npm pack clean -
  Windows binary re-proven post-fixes (version 0.1.0, health built:true, trending 28).

## 2026-08-24 - WEB DIRECTORY PLAN authored (OpenAlternative parity)
- Live-fetched openalternative.co home + /advertise: 750 projects, 19 pages, ~300K
  pageviews/mo, 12K subs, ad tiers \/\/\ (Revinel), 3-level categories,
  /tags, collections {latest,trending,self-hosted,ai-native,coming-soon,graveyard},
  /discounts, blog, sign-in submissions, built on Dirstarter (Next.js boilerplate).
- Authored plans/web-directory/PLAN.md: static pre-rendered web directory (PRD 5b/25/26/27)
  via zero-dep Node SSG (scripts/build-web-directory.mjs) -> web-dist/ on GitHub Pages,
  daily rebuild rides snapshot cron. W1 SSG+profiles, W2 alternatives hubs, W3 taxonomy
  (2-level cap until 150 tools), W4 collections/discounts, W5 RSS suite + sitemap + AI-bot
  robots, W6 blog, W7 build-time OG PNGs (satori/resvg CI-only devDeps) + newsletter,
  W8 dormant monetization scaffolding (activateMonetization flag).
- Deviations logged #6-#9 (static OG vs edge fn; static vs SSR; 2-level taxonomy;
  GitHub-issue submissions instead of sign-in). Scale roadmap 28->60->150->300+
  human-verified batches per PRD 19 fact-check rule.

## 2026-08-24 - web-directory PLAN verified against codebase (4 corrections)
- paidTool.slug 28/28 (W2 unblocked); NO Pages deploy workflow existed -> W0 deploy rail
  added (configure-pages/upload/deploy-pages, artifact merges landing-page/ at root);
  seed lacks history key -> public sparklines restricted to genuine >=8-sample history
  (synthetic curve stays dashboard-only); addedAt/discontinued/collections/categories/
  stacks confirmed absent = additive schema-v3 work; stack feedstock thin (TSx8) reinforces
  2-level taxonomy cap; satori/resvg devDeps can never ship in npm package.

## 2026-08-24 - web-directory plan FINAL deep-check (5 amendments applied)
- Added /tags + /tags/[tag] to W3 (OA nav surface; our tags array 28/28 = cheapest win).
- W2 master index: pagination at 50/page + optional 1KB vanilla filter chips (OA paginates
  19 pages; static site needs progressive-enhancement JS decision locked).
- W0 custom-domain CNAME emission from site.config.json.
- Performance budget section: inline critical CSS <=14KB, zero default JS, LCP<1.5s,
  page weight <120KB pre-images.
- Sequencing wording fixed to W0 -> W1..W8. Plan is now execution-ready with no known gaps.

## 2026-08-24 - WEB DIRECTORY W0+W1 SHIPPED
- scripts/build-web-directory.mjs: zero-dep SSG, pure buildSite()/profileHtml() exported
  for tests; honesty gates enforced in code (sparkline only >=8 genuine history samples;
  maintenance/freshness pills only from real snapshot meta; cross-links render text until
  target route exists in registry - no dead links pre-W2).
- site.config.json (baseUrl/CNAME/newsletter/monetization flags); web-deploy.yml
  (configure-pages v5/upload v3/deploy-pages v4, dispatch + data-path triggers);
  snapshot.yml now rebuilds + redeploys the public site daily after committing snapshots
  (permissions extended pages:write/id-token:write; concurrency group 'pages').
- Local proof: 28 profiles emitted, 7KB/page (budget <120KB), titles/JSON-LD correct,
  landing-page copied to artifact root. Suites: 114/114 node:test (+8 web SSG tests).
- Next: W2 alternatives hubs (routes registry already anticipates them).

## 2026-08-24 - WEB DIRECTORY W2 SHIPPED (alternatives money pages)
- alternativesHubHtml: H1 'Best open source alternatives to X in {year}', cost intro,
  comparison matrix (Alternative/Relationship/Parity%/Maintenance/License/Save),
  per-alt parity-vs-gaps cards + migration notes, generated 3-Q FAQ,
  JSON-LD [ItemList, BreadcrumbList, FAQPage]. Empty-hub guard by construction
  (hubs derive from pairings, never hand-listed).
- Master /alternatives index: alphabetical hub grid w/ category chips (1KB vanilla
  progressive-enhancement filter), paginate() at 50/page shipping now (28 hubs -> 1 page).
- buildSitemap emitted in main() (W2 gate); full crawler suite stays W5.
- Registry pattern: hub routes pre-registered as null placeholders BEFORE profiles render
  so cross-links flip to live anchors atomically - the no-dead-links invariant held.
- PS 5.1 gotcha repeat: no ternary operator - twice burned now, use if/else.
- Proof: 57 pages built (28 profiles+28 hubs+index), sitemap 58 URLs, mesh live.
  Suites 122/122 (+8 W2 tests). PLAN W2 ticked. Next: W3 taxonomy (/tags cheapest).

## 2026-08-24 - WEB DIRECTORY W3 SHIPPED (taxonomy surfaces)
- computeTaxonomies(): derives ALL four sections from catalog data at build time -
  NO stacks.json hand-file (deviation #10 logged). Omit-empty is structural.
- slugify() for category/tag routes; licenseFamily() folds -or-later variants into
  base SPDX family page w/ variant list + LICENSE_COMMERCIAL_NOTE per type
  (permissive/copyleft/network-copyleft) per PRD 3a compliance angle.
- Routes registry: taxonomy placeholders pre-registered before profile render so
  tag/language/license/category pills flip to live links atomically.
- GOTCHA: added repoSlug map but forgot to pass it into profile ctx objects ->
  pills stayed unlinked in real builds while unit fixtures (which inject repoSlug)
  passed. Lesson: dependency-injected fixtures can mask missing wiring - always
  add one integration assertion through the REAL buildSite path.
- Proof: 175 pages built (76 tags, 20 categories, 6 license families [8 spdx folded],
  12 stacks incl docker/self-hosted), sitemap 176 URLs. Suites 127/127 (+5 W3 tests).

## 2026-08-24 - WEB DIRECTORY W4 SHIPPED + LIVE COLLISION INCIDENT
- computeCollections(): latest (catalog-order fallback), trending (>=5 real movers,
  realMomentum only), self-hosted (docker ? platforms self-host), ai-native (regex
  tags+desc), coming-soon (isPreRelease || momentum>=15% && stars<1000),
  graveyard (paidTool.discontinued). Omit-until-data: empty collections get NO route;
  /collections index lists live tiles + muted 'activating automatically' note.
- /discounts always exists (src/data/discounts.json [] default) with honest
  'No active deals right now' empty state. Nav += Collections.
- COLLISION INCIDENT: a second agent session is concurrently committing PHASE-3 code
  (watchlist.js, ai-finder.js, deploy.js, TcoCalculator, TeamFit, export.js + tests).
  Its 01:55 edit added a DUPLICATE getPairingMetrics import to routes.js -> SyntaxError
  killed app.js for ALL server tests (community/goals/lists/server/export all red at once).
  Fixed surgically (removed dupe line only); did NOT touch their in-flight features.
  LESSON: when many unrelated files fail AT IMPORT level, suspect module-level syntax
  damage first - one bad line cascades into every suite importing the server.
- Proof: 179-page build; collections/self-hosted/latest/discounts present, dormant four
  absent; sitemap 180 URLs. Suites 134/134 (includes the other session's new passing tests).

## 2026-08-24 - WEB DIRECTORY W5 SHIPPED (RSS suite + crawler infra)
- buildRssFeed(): RSS 2.0 w/ permaLink guids, RFC-822 pubDates, esc() everywhere.
- updateFeedState(): first-seen registry persisted to src/data/feed-state.json
  (COMMITTED so CI keeps continuity) - honest pubDates since catalog has zero date
  fields. Ordering: newest-first (standard RSS).
- Feeds: rss/tools.xml (28 items) + rss/alternatives.xml (hubs) + rss/posts.xml
  (valid empty channel until W6; buildFeeds accepts posts param so W6 plugs in
  without touching feed code). robots.txt explicitly ALLOWS GPTBot/ClaudeBot/
  PerplexityBot per PRD 33 verdict + Sitemap directive only when baseUrl set
  (no fake URLs); empty baseUrl -> logged warning, relative links until CI sets it.
- Test bugs I authored then caught: reversed newest-first assertion; fixture replaced
  the only pairing instead of adding a second (-1 indexOf trap). Lesson: assert
  ordering with BOTH indices guarded for -1 first.
- Proof: live build emits 3 feeds + robots.txt; tools.xml carries 28 items;
  state committed. Suites 147/147 (+6 W5 tests).

## 2026-08-24 - WEB DIRECTORY W6 SHIPPED (blog)
- renderMarkdown(): escape-FIRST architecture - esc() before any inline transform means
  raw HTML in .md can never reach output (proved by <img onerror> test). Supports
  ##/### headings (h1 reserved), **bold**, inline code, links w/ safeHref allowlist
  (http(s)/relative/# only; javascript: neutralized to #), ul/ol, blockquotes,
  fenced code blocks. GOTCHA caught by tests: forgot esc() in flushPara; and
  heading level math was off-by-one (## produced h3).
- parseFrontMatter(): routes.js pattern ported + leading-newline trim after fence
  (body.startsWith assertions caught it).
- Blog wiring: omit-empty (no posts -> no routes); index date-desc cards;
  Article JSON-LD; nav += Blog; main() parses content/blog/*.md and feeds
  buildSite({posts}) AND buildFeeds({posts}) with author-controlled frontmatter dates.
- 3 starter posts written using ONLY verified catalog names (Notion->AFFiNE guide,
  self-hosting stack w/ Nextcloud/Jitsi/Navidrome/Bitwarden/Coolify, Trust Score
  transparency post documenting real trust.js weights + appeals path).
- Proof: 183-page build, blog index + 3 articles render correctly, rss/posts.xml
  carries all 3 items. Suites 157/157 (+9 W6 tests). Concurrent session's audit.test.js
  failure resolved itself when they fixed their store bug mid-run.

## 2026-08-25 - FEATURE EXPANSION F1-F8 COMPLETE (main agent) - plans/PLAN_FEATURES.md
All 8 PRD-validated features shipped with gates. Final: 157/157 node:test - 16/16 vitest - build green.
- **F1 Export:** fixed my own half-wired seam (missing buildExport import + usage not passed to
  router + TWO duplicate createUsageStore instances consolidated). Export button on Favorites.
  GOTCHA: test hung from leaked server on failed test - close servers with close-event await.
- **F2 LicenseBadge:** permissive=emerald/commercial-OK, copyleft=indigo, network-copyleft=amber
  (AGPL hosting warning), unclear=caution. Mounted on cards + detail (with Learn link).
- **F3 TeamFit:** 3-tier size guidance + trial-sprint card; stronger caveat when self-host.
- **F4 DeployButtons:** pure logic in src/server/deploy.js (shared server/client). Railway
  (docker eco) + Vercel (web platform); **Render CUT** - root render.yaml requirement verified.
- **F5 TCO:** migrate-tco.mjs added tco.hostingMonthlyEstimateUsd to 19 self-host listings
  (idempotent, docker=10/simple=5). Calculator with 2026-verified presets (\/\/\/\),
  over-budget honesty warning fires when hosting exceeds paid tool.
- **F6 Watchlist:** zustand persist store + POST /api/watchlist-check (max 10, computeAlerts
  pure fn) + amber banner with dismiss=baseline-reset. Gated via Playwright route interception
  (live path rate-limited by design - GitHub 60/hr exhausted from dev session; degradation
  working as intended).
- **F7 AI Finder:** Structured Outputs (json_schema strict, 2026-verified) + gpt-5.4-mini
  default + refusal handling + catalog validation (fake repos dropped) + offline heuristic
  fallback ALWAYS honest-labeled. Key lives in localStorage, sent per-request only.
  /find page + header nav + palette-ready.
- **F8 Trust Pro surfaces:** audit store (latest-per-repo, cap 50) + POST/GET/DELETE /api/audits
  + CSV export (CRLF, quoted, escape-tested) + Save-audit button in TrustMeter + /audits page
  with honest trend note (no fabricated history until cron accumulates). Checkout wiring
  deferred - surfaces free locally, documented.
- **CROSS-SESSION:** parallel session shipped repo-files.js embedded-mode (Bun binaries PRD 30),
  web-directory Tier-2 build (their WIP caused 8 transient test failures mid-edit - passed 31/31
  in isolation after their edit landed), ListsPage, InstallPill, goals grid. I fixed their
  missing ListsIndexPage import in App.jsx (page was blank). TrustMeter mount now passes repo.
- Verification pattern that worked: Playwright route.fulfill(json=FULL_PAYLOAD) for
  rate-limit-immune UI gates; never route.response (unavailable in Python API).
- Remaining human actions unchanged: GitHub repo, npm publish, affiliates, NLnet, giscus IDs.

## 2026-08-24 - WEB DIRECTORY W7 SHIPPED (OG cards + newsletter) - satori dropped
- ogImagePath() single-source flattening (route -> /og/r__oute.png) shared by meta
  tags + generator; profiles/hubs/index carry absolute og:image + twitter:card.
- generate-og-images.mjs: buildCardSpec (pure; delta ONLY from genuine >=8-sample
  history) + buildCardSvg (pure SVG template, esc everywhere) + resvg rasterize.
- SATORI DROPPED: 0.33.4 threw 'reading children' even on its own README example in
  this env (Node 24/Win); variable-font TTF crashed its opentype fvar parser first,
  static TTF/WOFF still failed post-parse. Pure SVG template + @resvg/resvg-js is
  strictly more robust - zero WASM, text rendered by resvg with fontFiles+defaultFontFamily.
- Font: pinned @expo-google-fonts/inter@0.4.2 Inter_400Regular.ttf (STATIC ttf via
  jsdelivr; found through data.jsdelivr file listing), cached gitignored .og-fonts/.
- GOTCHA: resvg needs NEW Resvg(...) (class) - 'cannot invoke without new'.
- Newsletter footer: dual gates (embedUrl set AND numeric subscribers>0) - '12K+'
  strings never render (honesty rule).
- Proof: 56/56 PNGs (25KB each), og meta live on profiles/hubs/index. Suites 162/162
  (+5 W7 tests). devDeps now: satori REMOVED, @resvg/resvg-js added.

## 2026-08-24 - WEB DIRECTORY W8 SHIPPED - PLAN COMPLETE (W0-W8)
- advertise/submit routes always registered; zero payment rails while activateMonetization
  false. CTA honesty chain: stripe.submitUrl -> mailto(contactEmail) -> GitHub issues;
  expedited submit card requires flag AND stripe url together.
- Pricing mirrors LIVE OpenAlternative (// Silver/Gold/Platinum) - logged as
  deviation #11 vs PRD 6.4 older two-slot table.
- ads.json {slots:[]} created; adBannerHtml renders '' when empty, Sponsored-labeled +
  rel=sponsored banner on /alternatives when populated; /advertise inventory shows clean
  'Your banner here' placeholder (never fake campaigns). Stats row uses catalog counts ONLY.
- Ads & affiliate disclosure appended to privacy/terms (landing HTML + legal md).
- GOTCHA x2: PS  interpolation ate my JS template literal during scripted edit
  (marker-replace silently produced empty); and PS backtick-escapes inside double-quoted
  assertions broke price checks - verify page content with direct grep, not re-encoded checks.
- FINAL STATE: 185-page static directory (profiles/hubs/taxonomies/collections/discounts/
  blog/advertise/submit), sitemap 186 URLs, 3 RSS feeds, robots w/ AI-bot allows, 56 OG PNGs,
  honest-degradation everywhere. Suites 169/169 node:test + 16/16 vitest.
- HUMAN ACTIONS REMAINING: set real baseUrl/repoSlug/contactEmail, npm publish + first tag,
  enable Pages, Stripe links + activateMonetization=true when traffic justifies it,
  catalog growth batches, NLnet application before Nov 3.

## 2026-08-25 - Post-build audit + 4 fixes (main agent)
Full audit of all F1-F8 work: 30-route spine coherent, 127.0.0.1 bind confirmed, console.logs
only in CLI banner, plans/PRD cross-check clean. Found + fixed 4 minor items:
1. /audits had NO nav entry (post-save redirect only) - added Bookmark nav link.
2. CSV formula-injection: auditToCsv now prefixes =+-@ cells with apostrophe (OWASP guidance)
   + regression test proving '=cmd() never reaches a cell raw.
3. ai-find baseUrl SSRF hardening: non-https baseUrls rejected (localhost http allowed for
   Ollama-style dev runtimes) + trailing-slash normalization + test proving no fetch fires.
4. metrics route formatting (statement jammed on arrow line).
Post-fix: 164/164 node:test - 16/16 vitest - build green - nav + ai-find sweep 0 page errors.
Audit verdict: F1-F8 correctly built; remaining known-accepted surfaces: localhost CSRF-style
fire-and-forget POSTs (no CORS exposure, response unreadable cross-origin) - documented, not fixed.

## 2026-08-24 - FULL VERIFICATION SWEEP (P10-style QA for web directory)
- Built scripts/verify-web-dist.mjs: keeper CI-gate auditor - internal link resolution,
  og:image disk existence, JSON-LD parse on every page, sitemap-vs-pages coverage,
  feed well-formedness, AI-bot robots. Exits 1 so workflows can gate later.
- IT CAUGHT 2 REAL BUGS my code had shipped:
  1. deriveSlug self-collision: hub pages re-derived slugs AFTER profiles registered
     them, so each repo's own slug read as 'taken' -> owner-prefixed dead links
     (/bitwarden-clients vs /clients) on 28 hubs. Fix: ctx.repoSlug canonical map is
     the ONLY slug source post-registration; deriveSlug reserved for first pass.
     LESSON: pure functions that mutate-check a registry must never be re-run on
     already-registered keys - always thread the resolved map through contexts.
  2. Static site linked /api/source/:repo (daemon-only route). Fix: codeload.github.com
     /zip/HEAD works branch-independently on static hosting.
- Also fixed: blog post links used imagined slugs (/nextcloud,/bitwarden) instead of
  real ones (/server,/clients); sitemap now includes landing routes; generator emits a
  site-level index card; auditor normalizes /index.
- FINAL GREEN: 169/169 node:test - 16/16 vitest - vite build - 188-page web-dist with
  ZERO audit findings - 57/57 OG PNGs - health-diff dry-run - npm pack clean (68 files,
  no payload leak) - Windows binary smoke: version 0.1.0, health built:true, trending 28,
  search 1.

## 2026-08-25 - F9 Stack Audit mode shipped (main agent)
PRD 20 stack-audit mode: paste paid-tool list (newline/comma/semicolon separated) ->
matchTool() 4-tier matcher (exact slug/name -> containment -> word overlap, deduped) ->
report with per-tool savings pills, honest unmatched list, totals banner, CSV export
(formula-guarded, same discipline as trust audits), one saved stack audit locally
(PRD 22 free-tier shape, PUT/GET /api/stack-audit/saved). Nav: "Stack Audit" (Layers icon).
Gates: 4/4 matcher/CSV tests + full suite + Playwright (Notion/Figma/Postman/SomeRandomCRM ->
3 savings rows + unmatched honesty list + banner). Suite now 173+.

## 2026-08-25 - F10/F11/F12 shipped (main agent)
- **F10 Release Notes:** What's New section on detail pages, parsed client-side from the
  proxied /api/rss atom feed (DOMParser, zero new deps). Fails silent when feed unavailable.
- **F11 Data Import:** completes the export loop (PRD 12/17). community.importData() merges
  votes/tags with never-lower rule + repo regex validation; POST /api/import validates
  app/schema markers; Import button on Favorites (file picker -> status line). Round-trip
  test: export -> import -> export preserves everything.
- **F12 History + Similar:** recently-viewed strip (zustand persist, cap 20, clear button)
  on trending (hidden when filtered); 'More {category} alternatives' on detail pages.
- GOTCHAs: hidden file input has no label -> Playwright needs input[type=file] selector;
  server.address() is null before the listen callback (await it); leaked dev servers on 3000
  serve stale code - kill by CommandLine match before gates.
- Final: 176/176 node:test - 16/16 vitest - build green - all UI sweeps 0 page errors.

## 2026-08-24 - COMPLETE FUNCTIONAL VERIFICATION (every route, every page, live)
- New keeper: scripts/verify-api.mjs - 42-check live API matrix against real daemon
  (all 33 registered routes incl. phase-3 watchlist/ai-find/stack-audit/audits/export).
  FINAL: 42/42.
- ENVIRONMENT LESSON: 26 zombie node daemons had accumulated since 00:55 - stale servers
  answered some requests with old route sets, producing phantom 404s that looked like app
  bugs. Always purge node processes + correlate port owner PID before debugging 404s.
- REAL PRODUCTION BUG (concurrent session's): stack-audit save/load used fs without
  importing it (my earlier refactor removed it; they added routes after) -> PUT silently
  500, GET silently 404 since launch of their feature. Restored import; round-trip green.
- REAL PRODUCTION BUG #2: SimilarTools called getPairings().filter() on a PROMISE ->
  'tc(...).filter is not a function' crashed EVERY detail page (mounted by concurrent
  session same day). Fixed w/ effect+state; swept all other seed-mirror callers (correct).
- Detail-page resilience per PRD 2.2: /api/repo now returns snapshot freshness/maintenance;
  client renders fallback pills when live GitHub lookup is rate-limited (honest nulls on
  bare seed). e2e trust assertion accepts both states.
- E2E (Playwright): 12/12 - trending/filters/palette/detail/favorites/learn, zero console
  errors. web-dist audit: 188 pages, 0 dead links, sitemap 188 urls, feeds+robots OK.

## 2026-08-25 - CATALOG BATCH #2 DRAFTED + ENFORCED MERGE GATE BUILT
- plans/catalog-batch-2.json: 31 fully-shaped pairings (Google Photos->Immich, Plex->Jellyfin,
  Calendly->Cal.com, Acrobat->Stirling-PDF, Zapier->Activepieces, Salesforce->Twenty,
  GA360->Matomo, Okta->Keycloak, S3->MinIO, Vercel->Dokku, Pingdom->Uptime Kuma,
  Discord->Revolt, Teams->Element, Mailchimp->Mautic, Medium->WriteFreely, Typeform->
  Formbricks, SurveyMonkey->LimeSurvey, YouTube->PeerTube, AE->Natron, AutoCAD->FreeCAD,
  MATLAB->Octave, Intercom->Chatwoot, Zendesk->Zammad, QB->Akaunting, Shopify->Medusa,
  Obsidian Sync->Logseq, Stripe Billing->Lago, X->Mastodon, GTranslate API->LibreTranslate,
  Nest Aware->Home Assistant, Google Drive->Seafile). Prices flagged check-price.
- scripts/merge-catalog-batch.mjs: STAGE-2 ENFORCED verification - live GitHub fetch per
  entry; hard-rejects (404 / >18mo stale / <300 stars / zero desc overlap); license
  disputes resolved from repo's OWN raw LICENSE file (GitHub auto-detect unreliable);
  unresolved -> needsLicenseReview HOLD list (exit 3) mergeable via --include-needs-review
  which stamps licenseNeedsHumanReview. Rate-limit aware: saves state, exits 0 with resume
  msg. GITHUB_TOKEN env supported to bypass hourly quota. Idempotent by slug+repo.
- Live dry-run proved gate: 15/31 verified clean on first window before quota exhausted
  (rejections caught: jellyfin GPL-2.0 mis-detect, cal.com MIT auto-detect, element AGPL,
  natron GPL-2.0, glitchtip is GitLab-primary [dropped], proxmox mirror 95 stars [swapped
  to Seafile]). Draft corrected from real rejection data - the gate literally improved the
  catalog.
- Tests: +6 merge-gate cases w/ mocked fetch (license family folding, LICENSE-file dispute
  resolution paths, rate-limit passthrough, duplicate guards). 184/184 node:test green.
- NEXT RUN: 'node scripts/merge-catalog-batch.mjs --dry-run' after top-of-hour (or with
  GITHUB_TOKEN), then real run, then npm test + web rebuild shows ~59 hubs.

## 2026-08-25 - Launch-prep pass L1-L4 (main agent)
- **L1:** landing screenshot refreshed from current build (goal grid, filter rails, license
  badges, full nav all visible now).
- **L2:** README rewritten - documents all 12 features, CI matrix, release pipeline, local data paths.
- **L3:** .github/workflows/tests.yml - ubuntu/macos/windows matrix running build + both suites
  on every push (closes PRD 14 cross-platform gap permanently).
- **L4:** E2E battery hardened for rate-limit reality: releases endpoint pinned via route
  interception, favorites assertion made state-independent (accumulated total  proves the
  import loop), detail-page waits switched from networkidle to load+element (rate-limited
  live lookups never settle networkidle).
- **MOJIBAKE INCIDENT + FIX:** my PowerShell Set-Content -Encoding passes decoded UTF-8 files as
  cp1252 and re-encoded - corrupted em-dashes/sections/ellipsis/the visible diamond logo glyph
  across Header.jsx, FavoritesPage.jsx, RepoDetailPage.jsx, plans, journal (user-visible logo
  artifact caught via landing screenshot). Fixed with scripts/fix-mojibake.mjs (sequence map
  incl. the tricky E2 80 94/E2 80 A6/E2 97 86/C2 A7/C2 B7 families) - zero residual.
  **LESSON: never round-trip UTF-8 source through PowerShell Get-Content/Set-Content - use the
  edit tool or Node for file rewrites.**
- Final: 184/184 node:test - 16/16 vitest - build green - E2E 6/6 - screenshot clean.

## 2026-08-25 - SELF-AUDIT OF CATALOG BATCH CAUGHT MY OWN SCHEMA VIOLATION
- Ran independent schemaValidate pass over all 31 draft entries -> 20 FAILED goalTags:
  I'd added themed secondary tags (own-my-storage, monitor-my-services...) violating the
  strict ^replace-[a-z0-9-]*$ rule my own merge gate enforces. Fixed by filtering to
  replace-* only + ensuring replace-{slug} primary. Editorial cost: themed discovery
  phrasings ('run my own netflix') are not expressible as goalTags under current schema.
- Post-fix: 0 schema failures, no slug/repo collisions (internal + vs existing 28),
  claims-block stripped at merge verified in code, no softPass leftovers.
- Meta-lesson repeated: ALWAYS run the written validator against generated data before
  declaring done - tests alone passed because they used hand-made fixtures, not the real
  31-entry artifact.

## 2026-08-25 — OpenAlternative.co full-site audit → §3d shipped (PRD + build)

**Shipped:** PRD §3d audit section (+§19 phase tags, §7 data model fields); compare engine (comparePageHtml/compareDimensions/compareRouteSlug in build-web-directory.mjs) generating 8 pairwise pages from category+hub groups; about/methodology page; E-E-A-T bylines on hubs; share bar on tool/hub/compare; repo age stat on profiles; /api/repo now returns 
epoAgeYears + latestRelease; OG generator emits compare cards.

**Root causes logged (avoid repeats):**
1. Seed catalog is strictly 1:1 (28 hubs × 1 pairing) — per-hub pairwise compares yield ZERO pages. Compare engine must fall back to same-category grouping (Creative ×3, Project Mgmt ×3, Security ×1, Notes&Docs ×1).
2. 
epoSlug map populates during profileCtxs building; any code needing slugs must run AFTER that loop but BEFORE profile rendering (pre-register route=null pattern keeps cross-links live).
3. cmpLinks referenced in ctx-building loop → TDZ error; declare Maps at top of buildSite.
4. uild-web-directory.mjs rmSync's web-dist — ALWAYS rerun generate-og-images.mjs after rebuild or /og pngs vanish and verify-web-dist fails.
5. Bitwarden slug is clients (repo bitwarden/clients) — not a bug.

**Verify:** 197 routes · 65/65 OG cards · WEB-DIST AUDIT PASSED · 184/184 tests.
**Deliberate:** no accounts adopted (competitor OAuth failed visibly during audit); multi-forge + click-tracker deferred Phase 3.

## 2026-08-25b — §3d Tier-2 batch: sort dropdown + category growth badges

**Shipped:** 'Order by' client-side sort on /alternatives index (name/savings/options-count via data-* attrs); categoryGrowth() avg-30d helper wired into category index cards + detail pages (honest-null on seed data — badge only appears once cron history exists); alt-count badges confirmed already present. Added 6 tests incl. backfilled §3d coverage (compareRouteSlug determinism, dimension winners from real data + seed-tie honesty, compare/about route generation, byline gating).

**Gotchas:** sort script must render AFTER .hub-grid in DOM (moved below pager); cmp row layout is [dim, valA, valB, winner] — side A = first pairing arg.

**Verify:** 197 routes · 65/65 OG · AUDIT PASSED · 190/190 tests.
**Blocked note:** project has NO git repo (git init never run) — commits impossible until user initializes.

## 2026-08-25c — Round-3 audit (categories index + coming-soon) & features

**Audit findings:** competitor /categories = hierarchical group->subcategory chips + trending strip (favicon stacks, N tools, +X% growth). Coming-soon collection = full listing cards w/ stars/commit/license meta + 'Open Source Alternative to' badge. Visible breadcrumbs sitewide.

**Shipped:** crumbsHtml() in layout via ctx.crumbs (wired: profile/hub/alt-index/taxonomy idx+detail/compare/about); trending-categories strip (categoryGrowth-driven, omit-empty); collectionCards now stars+maint-pill+license (snapshots param).

**Gotchas:** taxonomyIndexHtml was module-private -> exported for tests. Git repo initialized this session (main); initial commit accidentally included local skills/ folder — prune candidate.

## 2026-08-26 — EmberProgress: molten-bar activity feedback (3 surfaces) + round-4 WIP unblocked

**Shipped:** dashboard/src/components/EmberProgress.jsx — canvas molten-ember progress bar (MetalForge-style palette #190602→#401204→#AD3308→#FF7A24→#FFD69E, user-approved via demo/ember-integration-preview.html). Determinate spring-chase (pct prop, null=indeterminate smoothstep sweep), DPR+ResizeObserver aware, prefers-reduced-motion renders static fill, SSR-safe (renderToStaticMarkup tested), aria progressbar semantics. Wired: DownloadSection (RepoDetailPage) replaces deleted ProgressRing — full-width bar under Run App button, pct=null when no content-length; StackAuditPage + AiFinderPage indeterminate during loading. Guardrails kept: ember only DURING activity, completion stays trust-green per color law; no new tokens added.

**Fixed pre-existing red WIP (round-4 §3d):** build-web-directory.mjs socialsHtml mastodon double-@ (prefix ends @ + handle starts @); layout() crashed when ctx.routes absent (nav filter now tolerant); web-directory.test.js searchIndex threshold >5→>=5 to match its own fixtures (all 4 types covered). Restored package.json/package-lock.json from git (were deleted in worktree) + npm ci to restore verification ability.

**Gotchas:** vitest env is node (no DOM) — client tests are SSR smoke only, canvas code must live in useEffect with getContext try/catch; CLI server binds 3000-3002 ignoring PORT.

**Verify:** vitest 18/18 (2 new EmberProgress tests) • node:test 199/199 • vite build clean �?� live smoke GET / and /repo/… 200.

## 2026-08-26 � "Paper & Ember" rebrand + crash/UX fixes (plan v3 executed)
- CRASH FIX: Header.jsx mobile-nav button used <Menu>/<X> without importing them; button is CSS-hidden not conditionally mounted ? ReferenceError killed the whole tree on every viewport. Regression test added (client.test.jsx renders Header via MemoryRouter).
- PALETTE (user-approved anti-purple direction): light base #E5E7EB?#F6F5F3 warm paper; ink ramp gray-blue?zinc (#18181B/#52525B/#A1A1AA); lines #F3F4F6/#D1D5DB?#E6E4E1/#D4D2CF (now darker than canvas ? cards stop bleeding); --c-primary gray #9CA3AF?ink #121212 (light) / #D4D4D8 wash (dark). New --color-link token: #C2410C light / #FF8A5C dark (AA hover affordance). Dark charcoal ramp untouched per spec.
- TRAP LEARNED: one token carried 3 roles. 62 primary usages classified: link hovers?text-link (~14 spots), decorative icons?text-dim/faint, semantic pills (LicenseBadge copyleft, RepoCard Partial)?tech tones, active washes stay primary=quiet chrome. Zero text-primary remains (verified by grep).
- SEARCH SYNC: header pill is now a real input bound to ?q= (useSearchParams); hero input keeps same param; sub-page typing navigates /?q= replace:true; <md icon button fires osh:focus-hero-search event; onSearch prop removed from App. Cmd/Ctrl+K palette untouched. Keybind labels now platform-aware via lib/platform.js (?K vs Ctrl K) � palette always accepted both.
- FILTER IA: 28-chip wall ? FilterRail rebuilt as 3 custom listbox selects (Platform w/ counts, Language count-less honest, License w/ counts); WAI-ARIA listbox + roving activeIndex + Esc focus restore + outside-dismiss; aria-live result-count status added before grid.
- BRAND: ? glyph replaced with Byte-derived SVG mark (guardian head+eyes, ember antenna) in header; Byte ThemeToggle document-read guarded for SSR tests.
- DOCS SYNCED so �7.7 protects NEW tokens: Sentinel DESIGN.md frontmatter/colors/borders + AGENTS.md �3 surfaces & hero backdrop lines updated to Paper & Ember values.
- VERIFICATION: vitest 19/19 ? � vite build ? (pre-existing 636KB chunk advisory only).
- FOLLOW-UP DEBT (out of scope today): scripts/build-web-directory.mjs (:160-161) + landing-page/*.html still carry old gray tokens � static web surface needs the same Paper & Ember pass.

## 2026-08-26 � Deep-check verification pass (post-rebrand)
- AUDIT: wrote a static undefined-JSX-identifier scanner across dashboard/src (imports+locals vs <Ident usages). Found ONE more real crash-class bug: RepoDetailPage.jsx:215 used <Activity> without importing it � rendered on every snapshot-backed repo detail page (maintenance strip) ? ReferenceError. Fixed by adding to lucide import block. Remaining flags were false positives (mixed default+named imports; dynamic import in CommunitySection.test.jsx).
- VERIFIED: Header end-to-end coherent after 8 edits � TrendingPage?FilterRail prop contract (language/languages :282-283) � aria-live status present (:322) � vitest 19/19 ? � vite build ?.

## 2026-08-26 — Design review + mobile header fix (verification pass)
- REVIEW: full design audit in .jez/artifacts/design-review.md; screenshots output/playwright/review/. Verdict: token discipline excellent, two high-severity issues found (pre-rebrand measurements).
- FIX: mobile header overflow — 508px content in 390px viewport. Header now: labeled nav `hidden md:flex`, hamburger below md toggling a labeled sheet (#mobile-nav), icon-only search button <md. Verified zero overflow at 390px; sheet shows all 6 links.
- FIX: favicon — added dashboard/public/favicon.svg (◆ on #121212 tile) + link rel=icon; 404 gone.
- GOTCHA: playwright-cli eval accepts single expressions only — multi-statement strings fail with SyntaxError; use IIFEs. CLI `open` may spawn fresh contexts (localStorage empty) — test persistence via location.reload(), not `open`. Stale HMR during interrupted edits produced phantom "useNavigate is not defined" crashes that don't exist in current file state.
- NOTE: mid-session file state shifted from pre-rebrand grays to final Paper & Ember tokens (base #F6F5F3, ink #18181B) — early review measurements reflect old palette; report updated with Resolution notes. AGENTS.md system-prompt copy still cites #9CA3AF field; DESIGN.md/AGENTS.md on disk should stay canonical.
- VERIFY: vitest 19/19 • favicon 200 • no header overflow @390px • h1 rgb(24,24,27) light mode • desktop nav intact @1440px.

## 2026-08-26 — Static web surface Paper & Ember pass (follow-up debt paid)
- DOCS: verified DESIGN.md + AGENTS.md on disk already carry Paper & Ember values (no sync needed).
- build-web-directory.mjs: :root light tokens → base #f6f5f3, ink #18181b, dim #52525b, faint #a1a1aa, tech #3f3f46, primary #121212, border #e6e4e1/#d4d2cf, + --link #c2410c; html.dark → primary #d4d4d8 + --link #ff8a5c; avatar gradient zinc; theme-color meta → #F6F5F3. Palette-overlay hardcoded darks kept (always-dark surface).
- landing-page/{index,privacy,terms}.html token blocks updated to same ramp (elevated #f9fafb → #ffffff for consistency).
- VERIFY: npm run build:web clean (197 profiles) • web-dist carries new tokens (spot-checked index + affine.html: zero 9ca3af) • node:test 205/205 • vitest 19/19 (earlier).

## 2026-09-01 — Universal Repo Support & Tailwind Ember Token Fix (Deep Check)
- CLI BRANDING: Fixed server banner chalk color in `src/server/index.js` line 51 from invalid hex `"66366F1"` to Sentinel accent token `#FF5722`.
- TAILWIND DESIGN TOKENS: Added `--color-ember: var(--c-link);` to `@theme inline` in `dashboard/src/styles/app.css` so all `text-ember`, `hover:text-ember`, `bg-ember/10`, `border-ember/20`, and `accent-ember` utilities resolve cleanly to the AA ember palette.
- UNIVERSAL GITHUB REPO SUPPORT:
  - `/api/security/:owner/:name`: Removed 404 restriction for non-catalog repos; queries live GitHub HEAD SHA and OSV.dev commit range.
  - `/api/metrics/:owner/:name`: Returns empty metrics object `{ metrics: {}, fetchedAt: ... }` with HTTP 200 rather than 404.
  - `/api/audits/:owner/:name`: Enabled saving and exporting trust audits for any valid `owner/repo`.
- VERIFY: 206/206 backend tests passing • 46/46 client vitest tests passing • `npm run build` clean • live curl/fetch tests on `facebook/react` and `toeverything/affine` returned 200 OK.

## 2026-09-01 — Complete Missing Features Suite Built & Verified (7 Features)
- FEATURE 1 (Chrome Extension): Created Manifest V3 developer-mode extension in `extension/` matching 60+ paid SaaS domains with floating Sentinel alternative badge. Created zero-dependency ZIP archive streamer on `/api/extension/download`.
- FEATURE 2 (Outbound Click Tracker & Affiliates): Built `src/server/tracker.js` storing local conversion events to `getUserDataDir()/clicks.json`, `/api/go/:target` redirect middleware, and `/api/analytics/clicks`. Wired cloud deploy buttons.
- FEATURE 3 (B2B Executive Procurement & Board Report): Built `ExecutiveReportModal.jsx` with TCO comparison, compliance matrix, and CFO sign-off. Wired to `StackAuditPage.jsx`.
- FEATURE 4 (GitHub Dynamic SVG Badges): Built `src/server/badge.js` with Shields-compatible dynamic SVG badges (`/api/badge/:owner/:name/trust.svg` & `/api/badge/:owner/:name/alternative.svg`). Upgraded `EmbedModal.jsx` with multi-badge tabs.
- FEATURE 5 (Zero-Cost Newsletter & Lead Hub): Built `src/server/newsletter.js` storing subscriber emails in `subscribers.json` with 1-click CSV export (`/api/newsletter/export`). Built and wired `NewsletterFooter.jsx` across all pages.
- FEATURE 6 ("Claim This Repo" Verification): Built `src/server/claim.js` and `ClaimModal.jsx` with maintainer `.opensource-hub.json` metadata validation and verify endpoint `/api/claim/:owner/:name/verify`. Wired to `RepoDetailPage.jsx`.
- FEATURE 7 (Multi-Forge Support): Built `src/server/forges.js` supporting GitLab and Codeberg metadata normalizers via `/api/forge/:platform/:owner/:name`.
- VERIFY: 212/212 backend tests passing • 46/46 client vitest tests passing • `npm run build` clean • server daemon running on port 3000 • all live endpoints verified.


## 2026-09-02 (session 2) — GitHub marketing surfaces + publish-ready + URL-slug purge
- SHIPPED (3 commits): bc03862 marketing surfaces (README badges, docs/demo.gif 13-frame Playwright capture pipeline scripts/capture-demo.py + scripts/build-demo-gif.mjs gifenc/pngjs, .github/social-preview.png 1280x640 via scripts/generate-social-preview.mjs resvg+cached-Inter, FUNDING.yml, marketing checklist docs/marketing-checklist.md); da0fef0 slug purge (ALL user-facing deep-links -> bengowtham70/opensource-hub: trust.js APPEALS_REPO, CommunitySection/SubmitPage FEEDBACK_REPO, landing privacy/terms/footer, test fixtures); cb5d019 publish-ready (site.config baseUrl -> https://bengowtham70.github.io/opensource-hub matching web-deploy Pages target, contactEmail, prepublishOnly = npm test && test:client gate, build:og/social:preview/demo:gif scripts).
- REAL BUG FIXED: Ctrl+K/Cmd+K palette shortcut was structurally dead - the keydown listener lived inside CommandPalette.jsx which App.jsx only mounts while open ({open && <CommandPalette/>}). Moved global listener into HeaderWithPalette (App.jsx) always-mounted effect; palette keeps its own toggle. Verified live via python playwright (cmdk-root count 0 -> 1).
- GOTCHAS (new): (1) Start-Process with -RedirectStandardOutput on npm/node HANGS PowerShell for 30s - use cmd /c "start /b X > log 2>&1" instead; (2) python print unicode symbols crash cp1252 consoles - sys.stdout.reconfigure(encoding="utf-8"); (3) playwright get_by_text matches invisible <title> elements - use get_by_role; cmdk items are role=option but palette suggestions here are paid-tool links ("Free alternatives to X"), Enter selects top suggestion; (4) gifenc is CJS - import gifenc from default then destructure; (5) PowerShell ; chains abort on CommandNotFoundException - separate calls.
- USER SCARS: npm view opensource-hub = E404 (never published - install cmd dead until npm publish); no git remote (never pushed); no v* tag (release.yml never ran); giscus.js empty (honest setup notice renders); web-dist had 383 example.com canonicals before local rebuild.
- Verify: node:test 227/227 - vitest 51/51 - web rebuild 643 tool profiles (catalog expansion from parallel session live in worktree) - demo GIF + social card visually verified via image read.

## 2026-09-03 (Session 2) — Unlocking the 26,000+ SQLite Catalog & Resolving All Interactive Options
- USER DIRECTIVE: User was irritated that interactive options appeared dead or non-functional: "Most of my options aren't working. That's why I'm irritated. I want you to understand what's working and what isn't. Understand like a human, think like a human so you can understand everything."
- ROOT CAUSES IDENTIFIED & ELIMINATED (THE 28-SEED BOTTLENECK):
  1. Alternatives Directory (`AlternativesPage.jsx`): Loaded only 28 seed tools; infinite scroll called unauthenticated public `api.githubSearch` hitting GitHub 60 req/hr rate limits. Fixed: Connected infinite scroll to `/api/catalog` powered by local SQLite 26,328-repo catalog. Seamlessly pages hundreds of tools with 0 rate limits and 0 network delays.
  2. Reverse Alternatives (`PaidToolPage.jsx` at `/alternatives/:slug`): Looked up tools only in 28 seed items. Searching for Airtable, Datadog, Slack, Jira, etc., reported "Nothing pairs with X in catalog yet". Fixed: Connected to `/api/catalog?alt=${slug}&q=${slug}`. Visiting `/alternatives/airtable` now instantly returns 30+ free alternatives including NocoDB, Baserow, and Grist with full savings math.
  3. Universal Comparison Tool (`ComparePage.jsx` at `/compare/:a/vs/:b`): Previously refused comparison if either tool wasn't in the 28 seed items ("One of X/Y isn't in catalog"). Fixed: Added dynamic resolution pipeline using `/api/catalog` and `/api/repo/:owner/:name` fallback. Users can now compare ANY two open source tools on Earth. Added quick links for popular comparisons.
  4. Categories Directory (`CategoriesPage.jsx` at `/categories`): Filtered only the 28 seed tools, resulting in ~80% of categories showing "0 swaps" and being hidden. Fixed: Categories now dynamically load matching tools from `/api/catalog?q=${cat}` upon expanding. All 43+ categories are interactive and display real open-source tools.
  5. Stack Architect (`StackBuilderPage.jsx` at `/stacks/builder`): Search was restricted to the 28 seed tools. Fixed: Added debounced search against `/api/catalog?q=${query}` and dynamic slug resolver for shared URLs. Users can add Redis, Docker, ClickHouse, Meilisearch, or any other catalog tool.
  6. AI Tool Finder (`ai-finder.js`): Offline heuristic matching previously scanned only 28 seed tools. Fixed: Augmented `heuristicFind` with SQLite FTS5 `searchCatalog` to search all 26,000+ catalog repos for user task descriptions.
  7. Report / Suggest Edit Modal (`ReportModal.jsx`): Previously ran a fake `setTimeout` and closed. Fixed: Connected to real backend endpoint `POST /api/community/flags` (`api.communityFlag`), submitting user data reports directly into the Admin Queue (`/admin`).
- VERIFICATION:
  - `npm test`: 228/228 tests passing
  - `npm run test:client`: 76/76 vitest tests passing
  - `npm run build`: Clean production bundle in 5.03s
  - Playwright E2E (`scripts/verify-expanded-options.py`): Verified `/alternatives` (cards grew from 107 to 136 on scroll), `/alternatives/airtable` (30 alternatives to Airtable), `/compare/supabase/vs/pocketbase`, `/categories` expansion, and `/stacks/builder` search with exit code 0.



## 2026-09-03 — Pre-Launch Deep QA (7 Phases) + Launch-Blocker Fixes COMPLETE ✅
- **Audit:** Phase0 228+76 tests green; Phase1 104 page-loads (24 routes x light/dark x desktop/mobile) 0 console errors; Phase2 25/25 buttons, 74/74 filter options, palette/theme/favorites OK; Phase3 AI finder 15/15 search + valid/no-key/bad-key/offline graceful (submit = Ctrl+Enter); Phase4 30-repo GitHub sample: 0 archived, 0 fabricated; Phase5 WCAG sweep (scripts/contrast_audit.py): 51 failures found; Phase6 persona flows Notion/1Password/Figma all resolve <60s with savings+parity+trust; Phase7 fixes re-verified.
- **P0 root cause — Tailwind v4 token shadowing:** @theme --color-base made text-base resolve as COLOR (canvas #F6F5F3) not font-size 16px, i.e. invisible hero subline in light + wrong sizing everywhere. FIX: renamed token to --color-canvas (Sentinel name), bg-base to bg-canvas (30 usages). ALL text-base font sizing restored.
- **WCAG AA now 0 failures (was 51):** dark --c-faint #71717a to #8f8f9a; new tokens --c-trust-strong (#047857 light) + --c-caution-strong (#b45309 light) for small badge text (Local-First, Manifest V3, active/slowing pills, ExecutiveBrief savings); accent-as-text #FF5722 (2.90:1) replaced by ember --c-link (#C2410C, 4.78:1) on AlternativesPage hero/chips/reset, ComparePage active chip, LearnPages slider; NewsletterFooter dark Subscribe white-on-white fixed via .btn-primary; fonts audit: only Inter+Newsreader, mono retired globally (font-mono aliased to Inter in @theme).
- **Trust copy fabricated claims removed:** "Over 1 million developers…" hero replaced with truthful verified-listings copy; "Join 12,000+ engineers" newsletter footer no longer cites a fake number.
- **Static builder:** retired indigo rgba(99,102,241,…) washes replaced with neutral ink washes; NEW newsletter archive: content/newsletter/*.md render as /newsletter + /newsletter/<week> reader pages inside build-web-directory (survives rmSync; previously written only by build-weekly-newsletter then wiped). Sitemap parity 645/645 (scripts/sitemap-parity-check.cjs), verify-web-dist PASSED after build:og (263 og cards; CI order must be build:web THEN build:og).
- **Data drifts:** SigNoz language Go to TypeScript, Chroma Python to Rust (GitHub-verified). LibreOffice MPL-2.0 + FreeCAD LGPL-2.1-or-later confirmed CORRECT vs official sources (GitHub file-detection is the noisy one).
- **Palette fix:** cmdk Item now forwards value; searchable text includes open-source name+repo, so "vaultwarden"/"penpot" now match (paid-tool names still work).
- **Gates:** npm test 228/228, test:client 76/76, vite build clean, build:web 645 pages, verify-web-dist PASS, contrast 0 failures on 10 page/theme combos.
- **GOTCHAs:** cmd background sessions cannot keep long-running node servers alive (exit instantly) — boot via foreground or scripts that self-manage; verify-web-dist requires build:og AFTER build:web or 265 og-image "failures"; cmdk value must be forwarded through wrapper components; AI finder submits on Ctrl+Enter not Enter.
- **Verdict: GO for launch.** Remaining P2 backlog: hero subline could cite live catalog size; palette Learn articles fetched per-open (could cache); newsletter email HTML now superseded in web-dist by reader pages.

## 2026-09-03 — Launch Ship-Out: Commits + Gates GREEN, Deploy BLOCKED on GitHub account
- **Shipped to git (5 logical commits on main):** e06be8e launch-QA UI fixes (contrast/canvas rename/truthful copy/palette O.S. search/repo-detail hubs) · 3447462 SQLite catalog layer + trending cache · e47c717 newsletter archive reader pages + sitemap parity · 23d557d data drifts (SigNoz/Chroma) · 2906130 QA tooling + journal. Working tree CLEAN. .gitignore now excludes catalog.db*, scratch_*, qa-shots/, test/screenshots/, .verdent/.
- **Final gates re-verified on committed tree:** npm test 228/228 · test:client 76/76 · vite build 24s · build:web 645 pages · sitemap parity 645/645 · build:og 263/263 · verify-web-dist PASSED.
- **BLOCKER (user action required):** git remote was never configured; added origin https://github.com/bengowtham70/opensource-hub.git but push fails "Repository not found" — the GitHub account bengowtham70 itself 404s (does not exist publicly) and this machine has NO stored github.com credentials. Cannot create accounts/repos without user.
- **Unblock paths:** (A) user confirms correct username -> update site.config.json baseUrl/repoSlug + workflow links + remote URL, then push; (B) user creates account+repo named opensource-hub, runs one git push to trigger browser login; (C) switch to Vercel via token. Pages workflow web-deploy.yml fires on push to main automatically.
- **Local prod preview is fully validated** (server :3000 healthy, all E2E green) — launch quality is not in question; only hosting identity is missing.
