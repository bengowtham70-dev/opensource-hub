# OpenSource Hub — Phase 2 Build Plan (PRD §19 Phase-2 Scope)

> Status: **DEEP-CHECKED** against `PRD_final.md` §19 Phase-2 — all 17 items mapped (17/17),
> §§29/30/34/35/38 sequencing notes verified, Phase-3 exclusions confirmed correct.
> Live API research baked in (Aug 2026): OSV.dev keyless, deps.dev Scorecard keyless,
> PyPI JSON downloads deprecated â†’ pypistats.org, npm bulk â‰¤128, GitHub release `digest`.
>
> Stack: React 19 + Vite + Tailwind v4 dashboard served by local Express daemon. Zero central infrastructure — $0 architecture holds.

**Design lock:** `DESIGN.md` v1.1.0 "Tactile Dark Luxe" — tokens used verbatim, no new colors/radii/easings anywhere in this plan.
2026 UI-research rules applied *on top of* DESIGN.md tokens: keyboard-first, high density, one accent focal point per viewport, motion = feedback only, glass reserved for overlays (per DESIGN §4), WCAG AA contrast on dark.

## Architecture

```
src/data/alternatives.json   schema v2 (platforms, license, relationship, demoUrl, screenshots, goalTags, ecosystems)
src/data/lists.json          NEW: curated public lists {slug,title,criteria,repoSlugs[]}
src/server/routes.js         extended search params; new /api/security + /api/rss routes
src/server/osv.js            NEW: OSV.dev querybatch client with (id,modified) cache
src/server/metrics.js        NEW: npm/pypistats/Docker Hub metric normalization
src/server/trust.js          Trust Score v2 inputs (bus factor, backing, Scorecard)
bin/cli.js                   update-check notification (24h TTL, opt-out env)
scripts/migrate-alternatives-v2.mjs   idempotent schema migration
.github/workflows/release.yml         binary matrix + tap/bucket SHA automation
test/                        schema.test.js + extended trust/security/metric tests
```

## Global Constraints

- Colors: `#07090E` base · `#0D111A` surface · `#151B28` elevated · `#6366F1` primary · `#10B981` trust · `#F59E0B` caution · `#06B6D4` tech
- Type: Outfit display / Inter body / JetBrains Mono metrics + terminal (tabular numerals)
- Motion: spring `cubic-bezier(0.16, 1, 0.3, 1)` · stagger Ã—40ms · `active:scale-[0.97]` · transform/opacity only · `prefers-reduced-motion` collapse
- Radius lock 6-10-16-24-full · spacing scale 4/8/16/24/32/48/64
- Zero backend: local-first or GitHub-hosted only. No servers, no keys, no cost.
- Cross-platform path hygiene (`path.join`/`path.resolve`); port-fallback rules apply to any new local service.
- Every phase: unit tests green before gate; milestone commit after gate passes.
- PRD cross-reference comments where behavior encodes a PRD requirement.

## The 10 Phases

### Phase 1 — Catalog Schema v2 âœ¦ foundation for everything else
**Gate:** schema validation tests green
- [x] alternatives.json v2 per pairing:
  - `platforms: ["win","mac","linux","web","self-host"]`
  - `license: { spdx, type: "permissive|copyleft|network-copyleft" }`
  - `relationship: "direct|partial|fork"` (PRD §38)
  - `demoUrl?` (official hosted demos only, PRD §35)
  - `screenshots: [{ src, alt }]`
  - `goalTags: ["replace-google-photos", …]` (PRD §38 goal-first browsing)
  - `ecosystems: { npm?, pypi?, docker? }` package coordinates for metrics/security
- [x] `src/data/lists.json`: curated public lists with stated inclusion criteria (PRD §19 item 3, selfh.st pattern)
- [x] `scripts/migrate-alternatives-v2.mjs` — idempotent, preserves all v1 fields
- [x] `test/schema.test.js` — validates every pairing + list against v2 shape
- Skills: data-engineering patterns

### Phase 2 — Filter Rail & Search v2
**Gate:** filter route tests green + visual review vs DESIGN §2/§4
- [x] Server: `searchPairings({ q, language, platform, license })` — AND-combined chips (PRD §19 item 1)
- [x] UI filter rail on TrendingPage: glass pill chips (`surface-elevated`, `border-white/8`, active = primary fill), per-chip counts in JetBrains Mono tabular numerals
- [x] CommandPalette gains "filter by platform / license" commands (keyboard-first rule)
- [x] Empty-result state keeps illustrated Byte recovery CTA (anti-vibe-coding rule)
- Skills: command-palette

### Phase 3 — Trust Score v2 (+appeals, +bus factor, +Scorecard)
**Gate:** trust tests green incl. new input bounds
- [x] Extend `trust.js` inputs: contributor count (bus factor), org/foundation backing flag, deps.dev OpenSSF Scorecard overall score via `GET api.deps.dev/v3alpha/systems/github/{owner}/repos/{name}` — free, keyless (research-verified). New band table documented in-file. (PRD §38 bus-factor; §20 Scorecard shortcut)
- [x] Appeals flow "built in from the start" (PRD §19 item 4): "Dispute this score" â†’ prefilled GitHub issue-template deep link from the Trust drawer; zero backend
- [x] Red-flag banner polish: star-spike + abandoned signals on amber `accent-caution` glass banner (PRD §5.3)
- [x] Byte mascot Shield state accompanies Trust drawer (DESIGN §8)
- [x] Extend `test/trust.test.js`: new inputs, band bounds, appeal-link generation
- Skills: rating-system

### Phase 4 — Security Badges (OSV.dev + release checksums)
**Gate:** mocked OSV endpoint tests green (incl. pagination + empty results)
- [x] `src/server/osv.js`: `POST api.osv.dev/v1/querybatch` (â‰¤1000/batch, no key, no rate limit); ecosystem map npm/pypi/go from pairing ecosystems; cache by `(id, modified)` in user-data dir; fetch `/v1/vulns/{id}` details only for hits; silent degrade on 5xx using cached:true pattern
- [x] Route: `GET /api/security/:owner/:name` â†’ `{ vulns[], checkedAt }` (PRD §29)
- [x] Checksums: read release asset `digest` (sha256) already returned by existing `/releases` handler; fallback = hash-on-download inside `/install` stream proxy when digest missing
- [x] UI detail drawer: vuln pill (emerald clean / amber advisories), mono checksum row
- Skills: security-compliance basics

### Phase 5 — Popularity Metrics + Freshness Diffs âœ¦ COMPLETE
**Gate:** metric normalization tests green; snapshot job dry-run passes
- [x] `src/server/metrics.js` normalizers:
  - npm: bulk point downloads â‰¤128/batch, scoped packages fetched individually
  - PyPI: **pypistats.org** `/api/recent/{pkg}` (PyPI JSON `downloads` is dead — research correction vs PRD letter, documented here)
  - Docker Hub: `pull_count` via hub.docker.com/v2/repositories/{ns}/{name}
- [x] Snapshot cron extends `snapshots-seed.json` with weekly `{downloads:{npm,pypi,docker}, date}` samples (`downloadsHistory`, â‰¥6d spacing) in scripts/build-snapshots.mjs (rides existing sync work, PRD §35)
- [x] Monthly cron commits public health-diff JSON: scripts/build-health-diff.mjs (pure computeHealthDiff + CLI) â†’ src/data/health-diff.json via .github/workflows/health-diff.yml; stars/downloads deltas + freshness flags (PRD §38 monthly public diff); served by GET /api/health-diff (+ per-repo route)
- [x] UI: freshness pill on cards (green <90d / amber >180d, omitted on seed data); metrics row in mono on detail page AND comparison cards (`downloads` prop from weekly snapshot sample — npm/pypi/docker via formatCompact, hidden until first cron run)
- Skills: data-visualization
- Note (2026-08-24): gate verified — 82/82 node:test suites green (metrics normalizers via injected fetch; computeHealthDiff windowed deltas + freshness bands), 13/13 vitest client tests green (RepoCard pill/row render + formatCompact), offline dry-run of build-health-diff.mjs passes over bundled seed (28 repos; freshness honestly `unknown`, no fabricated zeros until Actions populates `meta`/`downloadsHistory`). Card metrics ride the weekly snapshot (zero live API cost); live lookups stay detail-page-only via `/api/metrics`.

### Phase 6 — Screenshot Galleries & Live Demos
**Gate:** build passes + Playwright gallery screenshots reviewed
- [x] Gallery modal in RepoDetailPage: glass overlay (`backdrop-blur-xl` over `surface-elevated`), arrow-key nav, ESC close, focus trap, staggered thumb reveal Ã—40ms (DESIGN §5)
- [x] `demoUrl` pill in accent-tech cyan, external-link icon, `rel="noopener"` (PRD §19 item 7)
- [x] "Community-reported, not guaranteed" microcopy under gallery (PRD §8 honesty rule)
- Skills: modals-dialogs, interaction-design
- Note (2026-08-24): modal ships schema-ready; catalog now has 19/28 populated `screenshots` entries (updated from 0). Playwright visual pass rolls into P10 QA.

### Phase 7 — Goal-First Browsing, Public Lists & Relationship Typing âœ¦ COMPLETE
**Gate:** routing + list rendering units green; full keyboard walkthrough
- [x] Home entry grid "I want to replace…" built from top goalTags; each opens pre-filtered search view (PRD §38 goal-first browsing) — GET /api/goals + searchPairings goal facet (AND-combined); client seed.js getGoals() mirror renders instantly; active-goal banner w/ clear pill; tiles are native <button>s (tab-navigable); full Playwright pass rolls into P10 QA sweep
- [x] ListsPage `/lists/:slug`: title, stated criteria blockquote, reused repo cards; illustrated empty state w/ Byte (PRD §19 item 3) — index grid at `/lists` + header nav entry included
- [x] Relationship pills on comparison card: Direct=emerald / Partial=indigo / Fork=cyan (PRD §38 relationship typing) âœ… DONE — RepoCard pill w/ per-relationship title tooltips, tones locked to DESIGN.md tokens (trust/primary/tech)
- Skills: landing-pages patterns, dashboard-design

### Phase 8 — Community Layer (local-first, zero backend) âœ¦ COMPLETE
**Gate:** CRUD + validation unit tests green
- [x] Local stores for suggestions / Yes-No votes / crowd tags / report flags — zustand persist (`myVotes` only; aggregates are server state per state-management skill rule) + full CRUD in src/server/community.js (schemaVersion'd JSON, caps 100/200/24, FIFO eviction) mirrored by /api/community/* routes (PRD §34); UI: CommunitySection.jsx mounted on RepoDetailPage
- [x] Vote buttons tactile: emerald "Works for me" / amber "Didn't work", aria-pressed, tabular-num counts, press feedback via global `.btn-tactile:active scale(0.97)`; optimistic flip with revert-on-error
- [x] Export flows: "Send suggestion" and "Report wrong data" compose GitHub issue-template deep links (FEEDBACK_REPO, same TODO as trust appeals); copy-to-clipboard buttons with check-mark confirmation always available
- Skills: state-management, unit-testing
- Note (2026-08-24): gate verified — 16 new node:test cases green (vote toggle/side-switch/case-insensitivity, tag normalization+regex+cap semantics incl. duplicate-at-cap allowance, suggestion/flag validation + truncation + FIFO caps, restart persistence, corrupted-file recovery, route 400/404/happy-path matrix) + SSR smoke in vitest (14/14 client total; 98/98 server total). Test-only phase — zero production code changes needed.

### Phase 9 — CLI Update Notice + Distribution Channels
**Gate:** update-check units green; install smoke passes on Windows
- [x] Update-check in bin/cli.js: compare installed vs registry latest, 24h TTL cache, silent failure, `OPENSOURCE_HUB_NO_UPDATE_NOTIFIER=1` opt-out (item deliberately deferred out of v1 — lands now, PRD §19 item 6) — shipped as src/server/update-check.js + fire-and-forget banner in run(); registry 404 (unpublished) handled silently; 8 unit tests incl. numeric semver compare + TTL short-circuit
- [x] Single-file binaries via **Bun compile** (decision: stable + cross-compiles win/mac/linux Ã— x64/arm64 from one CI job, ~60â€“100MB; Node SEA rejected as experimental/no-cross-compile) attached to GH releases with SHA256SUMS.txt (PRD §30)
- [x] Homebrew tap automation: `homebrew-*` repo, Formula template + tarball-SHA CI job; Scoop bucket manifest + autoupdate block (research-verified pattern; cross-repo PAT required)
- [x] Landing page gains three install paths: brew / scoop / npm
- Skills: cicd, powershell-windows safety
- Note (2026-08-24): binaries are REAL, not skeletons — full local Windows chain proven (vite build → payload 38 files → bun-windows-x64 compile → live exe smoke: --version 0.1.0, health built:true, trending/search/learn, hashed JS asset 200 text/javascript 512KB, SPA fallback). Payload embedding via src/server/repo-files.js + scripts/make-bun-payload.mjs (see .agents/memory/journal.md for root causes). update-homebrew/scoop.mjs skeletons deleted; superseded by scripts/build-packaging.mjs (real tarball sha + autoupdate manifest) wired into .github/workflows/release.yml with SHA256SUMS.txt + graceful PAT gating on tap/bucket push jobs. Suites: 98/98 node:test · 14/14 vitest. First real tag still needs: npm publish + tap/bucket repos + PATs.

### Phase 10 — Analytics (opt-out), RSS & Launch QA
**Gate:** PRD §19 Phase-2 checklist pass; all suites green
- [x] Usage counters strictly local + opt-out: zero network unless `OPENSOURCE_HUB_TELEMETRY=1`; privacy-policy section added regardless (PRD §19 item 5; protects the no-tracking promise)
- [x] RSS: daemon caches/proxies GitHub's native `releases.atom` per tool â†’ `/api/rss/:owner/:name` (no XML generation; rides sync work per PRD §35) (PRD §19 item 17)
- [x] QA sweep: node:test + vitest suites, Playwright pass across every new surface, budgets LCP<2.5s / INP<200ms / CLS<0.1, AI-copy-tell sweep, WCAG AA contrast audit
- [x] Memory writeback: decisions + gotchas â†’ `.agents/memory/journal.md`
- Skills: verification-before-completion, code-reviewer

## Research Corrections vs PRD Letter (documented deviations)

1. **PyPI stats**: pypistats.org instead of PyPI JSON API (`downloads` field returns -1, officially dead).
2. **RSS**: cache/proxy native atom feeds instead of generating XML (§35 says "ride along with existing sync work").
3. **Checksums**: prefer GitHub release-asset `digest`; local hash fallback only.
4. **Scorecard**: deps.dev precomputed results (free/keyless) instead of running OSSF Scorecard ourselves.
5. **Binaries**: Bun compile chosen over Node SEA (experimental, no cross-compile).

## Execution Rules
- Strictly sequential P1â†’P10; each gate blocks the next phase.
- Milestone commit per phase (git init happens at user request).
- All UI binds DESIGN.md tokens verbatim — zero vibe-coding drift.
