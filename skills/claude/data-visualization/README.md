# Data Visualization Skill

> Teach your AI agent to build beautiful, accessible charts with Recharts, Nivo, and D3 that look great in light and dark mode

## Install

```bash
npx skills add YepAPI/skills --skill data-visualization
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

This skill teaches your AI coding agent how to build data visualizations the right way — choosing the correct chart library for the job, using responsive containers that work on any screen, applying color-blind safe palettes, and formatting axes and tooltips for humans. Your agent picks Recharts for standard charts, Nivo for rich interactives like heatmaps and sankeys, and D3 only when you need something truly custom.

## Key Features

- **Smart Chart Library Selection** — Recharts for standard React charts, Nivo for rich interactive visualizations (heatmaps, treemaps, sankeys), and D3 via refs for fully custom graphics, each used where it fits best
- **Responsive and Themeable** — Every chart wraps in `ResponsiveContainer` with no hardcoded pixel dimensions, plus a dark mode theme system that swaps background, grid, text, and series colors based on context
- **Accessible by Default** — Color-blind safe palettes (Tableau 10, ColorBrewer), human-readable axis formatting (1.2K, $3.4M), locale-aware tooltips with units, and clear legends placed outside the chart area
- **Chart Type Guide** — Built-in rules for when to use line (trends), bar (comparisons), area (cumulative volume), pie/donut (parts of whole, max 5 slices), heatmap (two-dimensional density), and funnel (conversion steps)
- **Production Patterns** — Skeleton loading states that match chart shapes, data fetched in parent components and passed as props, and animations only on initial load or data changes to avoid jank

## Use Cases

- Building an analytics dashboard with line charts for traffic trends, bar charts for page scores, and area charts for cumulative growth
- Creating financial reporting views with MRR waterfall charts, revenue breakdowns, and burn rate visualizations
- Displaying SEO metric charts showing keyword rankings over time, backlink growth, and audit score distributions
- Designing real-time monitoring dashboards with live-updating charts for server metrics, error rates, or user activity

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
