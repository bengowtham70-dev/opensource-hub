# Infinite Scroll Skill

> Scroll forever without dropping frames — cursor-based pagination, IntersectionObserver prefetching, and virtualized rendering for 10k+ items

## Install

```bash
npx skills add YepAPI/skills --skill infinite-scroll
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

Teaches your AI agent to build infinite scrolling lists with cursor-based pagination that handles insertions and deletions correctly, IntersectionObserver with prefetching margin for seamless loading, `@tanstack/react-virtual` for rendering 10,000+ items without DOM bloat, loading skeletons, "load more" fallback buttons, scroll position restoration on back navigation, and proper empty and end-of-list states. It prevents the classic infinite scroll failures: offset pagination that skips or duplicates items, rendering thousands of DOM nodes that freeze the browser, and no indication when the list ends.

## Key Features

- **Cursor-based pagination** — Uses the last item's ID or timestamp as the cursor instead of offset, so insertions and deletions in the list don't cause duplicate or missing items
- **IntersectionObserver prefetching** — Attaches an observer to a sentinel element with 200px root margin to start fetching the next page before the user reaches the bottom, keeping scrolling seamless
- **Virtualized rendering** — Uses `@tanstack/react-virtual` to render only visible rows in the DOM, handling 10,000+ items without performance degradation or memory issues
- **Loading skeletons and end state** — Shows placeholder skeleton items while fetching the next page and a clear "You've reached the end" message when there's nothing more to load
- **Scroll position restoration** — Saves scroll position before navigation and restores it on back, so users don't lose their place in a long list

## Use Cases

- You ask your AI to build a feed and it creates cursor-based infinite scroll with React Query's `useInfiniteQuery`, IntersectionObserver, and loading skeletons instead of offset pagination with a spinner
- You prompt for a product listing with 50,000 items and it uses `@tanstack/react-virtual` to render only the visible rows instead of mounting all 50,000 DOM nodes
- You ask for a comments section and it uses cursor pagination so new comments posted by other users don't cause duplicates or gaps when loading the next page
- You request a "load more" button as a fallback and it provides both auto-load via IntersectionObserver and manual load for users on slow connections

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
