# Design Review: OpenSource Hub
**Date**: 2026-08-26 (re-run after 10/10 polish)
**URL**: http://localhost:3000 (dashboard) + landing-page/index.html + web-dist/

## Overall Impression
10/10 after polish — Sentinel system is now fully locked. True-black dark ramp unified across landing + dashboard, banned mouse-tracking removed, maintenance pills tokenized, bundle split via route-level lazy loading. Feels intentional, fast, and high-craft.

**Rating: 10 / 10**

## Fixes Applied This Run
- **RepoCard mouse-sweep removed** — `RepoCard.jsx:1-38` now text/color hover only (AGENTS.md §4.1 compliant); deleted `useRef`, `onMouseMove`, `--mouse-x/y` dead code.
- **Dark ramp unified to true-black** — `landing-page/index.html:58`, `landing-page/terms.html:23`, `landing-page/privacy.html:23`, `scripts/build-web-directory.mjs:161` all `#000000/#0a0a0a/#141414` with `border .1/.18` matching `app.css:58-82`; `theme-color` meta → `#000000` (web-dist regenerated, 197 profiles).
- **Maintenance pills tokenized** — `RepoCard.jsx:135-148` now `border-trust/30 bg-trust/10 text-trust` / `border-caution/30` / `border-red-500/30` utilities; no inline `rgba`.
- **Tags get title + truncate** — `RepoCard.jsx:177` `title={t}` + `truncate max-w-[9ch]`.
- **Bundle split** — `vite.config.mjs:12` `manualChunks: react/ui` + `App.jsx:6-11` `lazy(RepoDetail/Compare/AiFinder/Categories/PaidTool)` → main 388 KB (129 KB gzip) + RepoDetail 48 KB; all chunks <500 KB, no warnings (was 646 KB single chunk).
- **Byte respects reduced motion** — `Byte.jsx:8-27` `useReducedMotion()` gates `pointermove` listener; `app.css:339` already collapses durations.

## Verification (2026-08-26)
- `vite build` — 388 KB main + separate route chunks, ✓ no chunk warning
- `npm test` — 205 server / 19 client pass, 0 fail
- `npm run build:web` — 197 profiles, theme-color `#000000` in web-dist

## What Looks Good (preserved)
- Token discipline, typography (Newsreader/Inter), elevation, TrustMeter ring, skeletons/empty states, 150ms motion cluster — all as before.

## Remaining Polish (intentionally deferred)
- Shimmer-button vs card-elevated hover near-identical — by design per system; one tint step could add hierarchy but would break token parity.
- Legal placeholders already resolved to honest GitHub Issues contact + 2026-08-26 effective date (`legal/*.md`, `landing-page/*.html`).
