# Agent Memory Journal — OpenSource Hub

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

**Shipped:** PRD §3d audit section (+§19 phase tags, §7 data model fields); compare engine (comparePageHtml/compareDimensions/compareRouteSlug in build-web-directory.mjs) generating 8 pairwise pages from category+hub groups; about/methodology page; E-E-A-T bylines on hubs; share bar on tool/hub/compare; repo age stat on profiles; /api/repo now returns epoAgeYears + latestRelease; OG generator emits compare cards.

**Root causes logged (avoid repeats):**
1. Seed catalog is strictly 1:1 (28 hubs × 1 pairing) — per-hub pairwise compares yield ZERO pages. Compare engine must fall back to same-category grouping (Creative ×3, Project Mgmt ×3, Security ×1, Notes&Docs ×1).
2. epoSlug map populates during profileCtxs building; any code needing slugs must run AFTER that loop but BEFORE profile rendering (pre-register route=null pattern keeps cross-links live).
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
