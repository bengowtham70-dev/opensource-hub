# Charts Skill

> Add beautiful, accessible data visualizations to your app with Recharts — bar, line, area, and pie charts that just work

## Install

```bash
npx skills add YepAPI/skills --skill charts
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

Teaches your AI agent to build data visualizations using Recharts with proper responsive containers, accessible color palettes, labeled axes, formatted tooltips, and loading states. Your agent will pick the right chart type for the data (line for trends, bar for comparisons, area for volume, pie for composition) and follow best practices like color-blind safe palettes, readable number formatting, and skeleton placeholders while data loads.

## Key Features

- **Responsive Containers** — Every chart wrapped in `<ResponsiveContainer>` with percentage widths instead of fixed pixels, so charts adapt to any screen size
- **Accessible Color Palettes** — Color-blind safe color schemes that avoid relying on red/green distinction, making your charts usable by everyone
- **Smart Axis Labels and Tooltips** — Both axes always labeled with readable number formatting (1.2K instead of 1200), plus hover tooltips showing exact values with units and locale-aware numbers
- **Right Chart for the Data** — Your agent picks line charts for trends over time, bar charts for comparisons, area charts for volume, and pie charts for parts of a whole (capped at 5 slices)
- **Loading States** — Skeleton chart shapes displayed while data fetches, so the UI never jumps or shows blank space

## Use Cases

- Adding an analytics dashboard with line charts for traffic trends and bar charts for top pages
- Building financial reports with area charts showing revenue over time and pie charts for expense breakdowns
- Creating a usage graph that shows API calls, storage, or bandwidth over the past 30 days
- Displaying comparison charts for A/B test results, product performance, or team metrics

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
