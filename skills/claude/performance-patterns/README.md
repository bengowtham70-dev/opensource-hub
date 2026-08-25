# Performance Skill

> Hit green Core Web Vitals scores without spending a week on optimization.

## Install

```bash
npx skills add YepAPI/skills --skill performance
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

Teaches your AI agent to build fast web apps from the start by targeting Core Web Vitals thresholds (LCP < 2.5s, INP < 200ms, CLS < 0.1). It covers lazy loading, code splitting by route, image optimization with WebP/AVIF and `next/image`, bundle analysis to find bloated dependencies, and database query optimization with `EXPLAIN ANALYZE`.

## Key Features

- **Core Web Vitals Targets** — builds toward specific thresholds (LCP < 2.5s, INP < 200ms, CLS < 0.1) so every performance decision is grounded in measurable metrics
- **Lazy Loading & Code Splitting** — loads below-fold images and heavy components with `React.lazy()` and `next/dynamic`, and splits code by route so each page only downloads what it needs
- **Image Optimization** — uses WebP/AVIF formats, proper `sizes` attributes, and `next/image` to serve correctly sized images that load fast on any device
- **Bundle Analysis** — uses `@next/bundle-analyzer` to identify oversized dependencies and tree-shake unused code before it reaches your users
- **Layout Shift Prevention** — sets explicit dimensions on images, videos, and embeds so content does not jump around as the page loads, keeping CLS below 0.1

## Use Cases

- Improving a Lighthouse score from orange to green by fixing the specific metrics that are failing
- Reducing JavaScript bundle size by finding and replacing heavy dependencies with lighter alternatives
- Optimizing a product listing page that loads 50 images by adding lazy loading and proper sizing
- Diagnosing slow database queries with `EXPLAIN ANALYZE` and adding the right indexes

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
