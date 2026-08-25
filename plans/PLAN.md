# OpenSource Hub â€” Master Build Plan (PRD Phase 1 Scope)

> Status: **VERIFIED** against `PRD_final.md` (525 lines) â€” all Â§19 Phase-1 items mapped, gaps patched (language filter, snapshot workflow, troubleshooting section, comparison disclaimers, human-action checklist). Update-check notification correctly excluded (PRD Phase 2).
>
> Stack: **React 19 + Vite + Tailwind v4** dashboard, prebuilt and served by the local Express daemon. Zero central infrastructure.

**Design Read:** Developer-tool local dashboard for GitHub-native users Â· "Tactile Dark Luxe" per `DESIGN.md` v1.1.0 Â· indigo `#6366F1`, glass elevation, spring easing `cubic-bezier(0.16, 1, 0.3, 1)` Â· Dials `VARIANCE 6 / MOTION 7 / DENSITY 6`.

## Architecture

```
bin/cli.js                 npm bin entry (commander, shebang, port fallback, auto-open)
src/server/                Express daemon (APIs, ETag cache, favorites store)
src/data/                  seed alternatives.json, repos catalog, bundled snapshots
content/learn/             starter markdown articles
dashboard/                 Vite + React app â†’ builds to dist/client (served statically)
scripts/build-snapshots.mjs   GH Actions cron script producing snapshots.json
.github/workflows/snapshot.yml  daily GraphQL batch snapshot cron (~10 calls/day per 1k repos)
landing-page/index.html    GitHub Pages marketing surface
test/                      node:test server units + vitest client units
```

Dependencies: express, open, commander, chalk (runtime â€” already in lockfile); react, react-dom, react-router-dom, vite, @vitejs/plugin-react, tailwindcss@4, @tailwindcss/vite, motion, cmdk, zustand, lucide-react, simple-icons (@icons-pack/react-simple-icons), @fontsource-variable/outfit, @fontsource-variable/inter, @fontsource/jetbrains-mono (build-time).

## The 10 Phases

### Phase 1 â€” Foundation & Scaffold âœ… gate: `opensource-hub --help` boots
- [x] `package.json` (name/bin/scripts/engines â‰¥18, files ships prebuilt dist)
- [x] Folder tree: bin/, src/server/, src/data/, content/learn/, dashboard/, test/
- [x] Port-conflict fallback 3000â†’3001+ with friendly console messaging
- [x] OS-correct user-data paths (%LOCALAPPDATA% / Library/Application Support / ~/.config)
- Skills: `node-cli-tool`

### Phase 2 â€” Data Layer & Seed Content âœ… gate: schema validation test green
- [x] 25 toolâ†’alternative pairings with real price anchors (Notionâ†’AFFiNE, Postmanâ†’Bruno, Figmaâ†’Penpotâ€¦)
- [x] Snapshot consumer: jsDelivr/Pages URL â†’ bundled fallback; sparkline points [{date, stars}]
- [x] Learn-article seeds (GitHub, open source, licenses, build steps)
- Skills: `github-api-sync-engine`

### Phase 3 â€” Server Core & Rate-Limit-Proof API âœ… gate: endpoint tests green; mocked 403 degrades silently
- [x] `/api/trending/:view` today|yesterday|least|all-time from snapshots
- [x] `/api/search?q=` (+ language filter param)
- [x] `/api/repo/:owner/:repo` live lookup â€” ETag If-None-Match, HTTP 403 â†’ cached payload + `cached:true` flag
- [x] `/api/releases/:owner/:repo` OS-matched binary detection (.exe|.msi|.dmg|.pkg|.AppImage|.deb)
- [x] `/api/favorites` CRUD persisted in user-data dir
- [x] `.github/workflows/snapshot.yml` daily GraphQL batch cron committing snapshots.json
- Skills: `github-api-sync-engine`, `node-cli-tool`

### Phase 4 â€” Tailwind v4 Theme Layer âœ… gate: token audit vs DESIGN.md table
- [x] `@theme inline` mapping every DESIGN.md token (colors/type/spacing/shadows/radius lock 6-10-16-24-full)
- [x] Self-hosted fonts via @fontsource (Outfit display / Inter body / JetBrains Mono metrics)
- [x] Utilities: `.card-glass`, `.light-sweep` mouse mask, `.mesh-glow-bg`, border-beam, shimmer-button
- [x] prefers-reduced-motion collapse; transform/opacity-only animation rule
- Skills: `tailwind-v4-shadcn`, `animated-component-libraries`, `design-taste-frontend`

### Phase 5 â€” Dashboard Shell & Trending Views âœ… gate: production build + visual review
- [x] Sticky glass header â‰¤72px + Byte mascot (idle breath, useMotionValue cursor tracking â€” never useState for pointer)
- [x] Hero search + Cmd/Ctrl+K command palette (cmdk, fuzzy, arrow-key nav) + language filter chips
- [x] 4 trending tabs; repo cards: staggered reveal (--index Ã— 40ms), animated sparkline stroke-draw, mono momentum badges
- [x] Shimmer skeleton loading, illustrated empty states with recovery CTA
- Skills: `command-palette`, `motion-dev-animations`, `ip-as-logo`, `dashboard-design`

### Phase 6 â€” Detail, Comparison & Download Engine âœ… gate: build passes; real download flow verified
- [x] Detail drawer: description, Simple Icons tech-stack pills, savings pill, side-by-side comparison card + parity gauge, migration notes
- [x] "Community-reported, not guaranteed" disclaimer baked into comparisons (PRD Â§8)
- [x] "âš¡ Run App" (OS-matched release binary, streamed progress ring + live speed) vs "ðŸ“¦ Source" zip â€” honest binary-only framing (PRD Â§2.6a)
- [x] giscus comments embed placeholder config
- Skills: `modals-dialogs`, `github-api-sync-engine`

### Phase 7 â€” Favorites, Learn & Interaction Polish âœ… gate: build + keyboard walkthrough
- [x] Favorites view (zustand persist + server mirror), recent-first, empty state
- [x] Learn routes + article renderer
- [x] Copy-pill rippleâ†’green-check morph, active:scale-[0.97], full keyboard nav, ARIA/WCAG AA contrast, AI-copy-tell sweep
- Skills: `animate-skill`, `interaction-design`, `stop-slop`

### Phase 8 â€” Testing & QA âœ… gate: full suite green on Windows
- [x] node:test units: port fallback, ETag logic, release regexes, trending math, favorites persistence
- [x] vitest client smoke tests
- [x] Browser verification session (Playwright skill): load/search/favorite/download states screenshot review
- [x] Budgets: LCP<2.5s Â· INP<200ms Â· CLS<0.1; only transform/opacity animations
- Skills: `unit-testing`, `webapp-testing`, `verification-before-completion`

### Phase 9 â€” Landing Page & SEO âœ… gate: design-review checklist pass
- [x] Static index.html: install box (`npm i -g opensource-hub`) + uninstall line + Node prerequisite link + troubleshooting block (sudo/PATH/port fixes)
- [x] Dashboard screenshot slot, JSON-LD SoftwareApplication, OG tags â€” same Dark Luxe tokens
- Skills: `design-taste-frontend` (hero-fit, max-4 hero elements, one CTA intent), `landing-pages`

### Phase 10 â€” Launch Readiness & Memory Writeback âœ… gate: PRD Â§13/Â§19 checklist
- [x] README (install/uninstall/troubleshoot), LICENSE MIT, files field ships dist/
- [x] legal/ ToS + Privacy Policy drafts with bracketed placeholders (PRD Â§13 item already checked as drafted)
- [x] Human-action checklist: apply DigitalOcean/Vercel/Railway/Supabase affiliates now; draft NLnet application (window Sep 3â€“Nov 3, 2026)
- [x] New ADRs + decisions â†’ `.agents/memory/journal.md`
- Skills: `code-reviewer`, `requesting-code-review`

## Execution Rules
- Strictly sequential; each gate must pass before next phase.
- Milestone commit per phase (when git repo is initialized by user request).
- PRD cross-reference comments in code where behavior encodes a PRD requirement.
- Update-check notification deliberately EXCLUDED (PRD defers to Phase 2).
