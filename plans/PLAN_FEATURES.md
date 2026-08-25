# OpenSource Hub — Feature Expansion Plan (8 features, all PRD-validated)

> Status: **DEEP-CHECKED 2026-08-24** against `PRD_final.md` §3, §3a, §17, §21, §22, §6.2 and the
> live schema (alternatives.json v2: platforms/license/ecosystems/screenshots confirmed; paidTool
> pricePerYearUsd+planName confirmed; snapshots.history empty until first Actions cron run).
>
> Execution order: quick wins first, paid-tier surfaces last. Every feature: unit tests + build
> gate + Playwright visual/interaction check before the next starts. DESIGN.md tokens verbatim.

## Global design decisions (apply to all 8)
- Tokens: base `#07090E` · surface `#0D111A` · indigo `#6366F1` · trust `#10B981` · caution `#F59E0B` · tech `#06B6D4`
- Motion: spring `cubic-bezier(0.16, 1, 0.3, 1)` · `active:scale-[0.97]` · stagger Ã—40ms · reduced-motion collapse
- Icons: Lucide only. Mono: JetBrains Mono for all numbers/paths.
- Honesty rules (PRD §8/§38): every estimate labeled, every heuristic carries a disclaimer,
  nothing pretends to be guaranteed or security-audited.

---

## F1 — Data Export (PRD §17) · quick win
**What:** "Export my data" button â†’ downloads `opensource-hub-export.json` containing favorites,
community votes/tags, and usage stats. Import not in v1 (PRD asks export only).
**Files:** `src/server/export.js` (new) · route `GET /api/export` in routes.js · button in Header
overflow or Favorites page · `test/export.test.js`
**Shape:** `{ exportedAt, schema: 1, favorites[], community: {votes, tags}, usage }`
**Gate:** unit test (shape + round-trip from seeded stores) + Playwright download event fires.

## F2 — License Compliance Flags (PRD §3/§3a) · quick win
**What:** per-listing commercial-use badge derived from `license.type`:
- `permissive` â†’ emerald "Commercial use OK"
- `copyleft` â†’ indigo "Copyleft — share changes if you distribute"
- `network-copyleft` â†’ amber "Network copyleft — hosting counts as distribution (AGPL)"
Plus detail-drawer explainer line linking the Learn license article.
**Files:** `dashboard/src/components/LicenseBadge.jsx` (new) · mount in RepoCard + RepoDetailPage
stats strip · no schema change (type already exists) · copy follows `legal` + Learn article tone.
**Gate:** build + visual check on one listing per type + copy-tell sweep.

## F3 — Team-size Fit + Trial-sprint Guidance (PRD §3a) · quick win
**What:** "Will it fit my team?" block on the detail page — static, honest guidance table:
under 10 people / 10â€“50 (need access controls) / 50+ (self-hosting infrastructure decides).
Plus a "Trial sprint" tip card: run it on a real project for 2 weeks before migrating.
**Files:** `dashboard/src/components/TeamFit.jsx` (new) · mount in RepoDetailPage after parity ·
content derived from existing `platforms` (self-host present â†’ stronger 50+ caveat).
**Gate:** build + visual + keyboard walkthrough of the block.

## F4 — Self-host Badges + One-click Deploy (PRD §3)
**What:**
- Difficulty badge from `platforms` + `ecosystems.docker`: `docker` eco â†’ "Needs Docker" (tech);
  only `web` platform â†’ "Hosted app" (indigo); `self-host` without docker â†’ "Needs a sysadmin" (caution).
- Deploy buttons when `ecosystems.docker` exists: Railway / Render / Vercel deploy-template links
  (official button URL patterns, open in new tab). PRD §3: these platforms host the buttons natively.
**Files:** `dashboard/src/components/DeployButtons.jsx` + `SelfHostBadge.jsx` (new) · RepoCard +
RepoDetailPage mounts · affiliate note: IDs get injected later (PRD §6.1a, Phase 3 wiring).
**Gate:** unit test for badge derivation logic + visual on 3 listing types.

## F5 — Total Cost of Ownership Calculator (PRD §3, §3a specificity rule)
**What:** interactive card on detail page: paid-tool annual price (from schema) vs self-host real
cost = `hostingMonthly Ã— 12 + 0 license`. Sliders/presets for hosting tier ($0 local · $5 VPS ·
$20 small cloud). Output: honest yearly delta + "breaks even if" line. Estimates labeled.
**Data:** add optional `tco: { hostingMonthlyEstimateUsd }` to alternatives.json v2 for self-host
listings (seeded with realistic VPS-class numbers, clearly estimates).
**Files:** `scripts/migrate-tco.mjs` · schema test update · `dashboard/src/components/TcoCalculator.jsx`
· route passthrough via enrichPairing · `test/schema.test.js` extension.
**Gate:** schema tests + interaction test (slider changes output) + disclaimer present.

## F6 — Watchlist + Local Alerts (PRD §3, §22)
**What:** "Watch" toggle per listing (bell icon). Watched repos get checked on dashboard load:
trust score drop â‰¥10 since last check, or 30-day star change crossing negative â†’ amber alert
banner on the trending page + bell badge in header. All local (community-store pattern), zero network.
**Files:** `dashboard/src/stores/watchlist.js` (new, zustand persist) ·
`src/server/watchlist-check.js` (new: computes diffs from snapshots + live trust) ·
`GET /api/watchlist-check` route · `AlertsBanner.jsx` + header bell · `test/watchlist.test.js`.
**Gate:** unit tests (drop detection math) + Playwright: watch â†’ simulate drop â†’ banner shows.

## F7 — AI Tool Finder (PRD §21) — local-key architecture
**What:** "Describe your task" search: plain language â†’ ranked shortlist with reasoning.
**Architecture decision (differs from PRD §21.6 letter, documented):** the LOCAL app can hold the
user's OWN API key in env/settings — no central serverless needed until the paid tier exists.
- Settings modal: API key (OpenAI-compatible base URL + key), stored locally only
- `src/server/ai-finder.js`: prompt = task description + compact catalog JSON â†’ strict JSON
  shortlist â†’ merged with Trust Score/license data â†’ rendered cards with "why this one"
- Graceful no-key state: falls back to local heuristic scorer (keyword Ã— tag Ã— category overlap)
  clearly labeled "offline matching — add an API key for AI ranking"
**Files:** settings store + modal · `ai-finder.js` + `/api/ai-find` route · `AiFinderPage.jsx`
(` /find`) + hero entry · palette command · `test/ai-finder.test.js` (mocked fetch: valid JSON,
malformed JSON fallback, offline fallback).
**Gate:** mocked tests + Playwright with fake key against local mock server.

## F8 — Trust Score Pro surfaces (PRD §6.2/§22) — feature-complete, payment later
**What:** the Pro DATA surfaces built now, unlocked free locally; checkout wiring deferred until
payment processor exists (documented in code + plan):
- 90-day trust trend sparkline (from snapshots history; synthetic-seed until cron data lands)
- Saved audits list (snapshot of trust breakdown per repo, stored locally, revisitable)
- Export audit as PDF-ready print view + CSV (PRD §20 exportable report)
**Files:** `src/server/audit.js` (save/list/export CSV) + routes · `TrustTrend.jsx` ·
`SavedAudits.jsx` · `dashboard/src/stores/audits.js` · `test/audit.test.js`.
**Gate:** unit tests (CSV shape, audit round-trip) + Playwright saveâ†’listâ†’export.

---

## Execution order & session budget
F1 â†’ F2 â†’ F3 (one batch, quick wins) â†’ F4 â†’ F5 â†’ F6 â†’ F7 â†’ F8.
Each feature: implement â†’ tests â†’ build â†’ Playwright gate â†’ journal line. No feature starts
before the previous gate passes. Cross-session rule: re-read files before every edit.

## Explicitly out of scope here
Payment processing/checkout (needs processor account) · serverless AI proxy (paid-tier infra) ·
email digest (Phase 3 P6). These slots are pre-wired but dormant, honestly labeled in UI.

## Amendments — internet-verified 2026-08-25 (applied before execution)
1. **F4 Deploy buttons:** Railway = https://railway.com/new/template?template=<repo-url> (any repo,
   supports utm_campaign/referral for PRD 6.1a affiliate wiring later). Vercel =
   https://vercel.com/new/clone?repository-url=<repo-url>. **Render CUT** - deploy button requires
   render.yaml at repo ROOT; generic button fails on most repos (verified via live GitHub PR
   calling the pattern misleading). Shipping broken buttons violates PRD 2.6a honesty.
2. **F7 AI Finder:** use Structured Outputs (response_format json_schema strict:true) - OpenAI's
   official 2026 recommendation; legacy JSON mode deprecated. Schema rules: top-level object
   (wrap {items:[...]}), all fields required, additionalProperties:false, <=5 nesting. Handle
   efusal field. Default model gpt-5.4-mini (env-overridable), OpenAI-compatible baseURL for
   OpenRouter/local. Local validation stays (defense-in-depth).
3. **F5 TCO presets (2026 list prices, post-Hetzner April hike):** \ local - \ budget VPS
   (DO entry \ / Hetzner cx23 ~\.93) - \ capable VPS (Hetzner CPX22 ~\.55-9.49) -
   \ managed cloud (DO 2vCPU/4GB). All labeled estimates.
