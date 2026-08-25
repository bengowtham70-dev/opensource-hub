# Dashboard Design Skill

> Design polished dashboards with KPI cards, sortable data tables, sidebar navigation, and responsive grid layouts

## Install

```bash
npx skills add YepAPI/skills --skill dashboard-design
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

Teaches your AI agent to build professional dashboard layouts that look and work like production SaaS products. It covers the sidebar-plus-main-content layout pattern, KPI card rows with trend indicators and sparklines, sortable and filterable data tables using `@tanstack/react-table` with shadcn/ui, responsive breakpoints that collapse the sidebar to a hamburger menu, and proper loading states with skeleton placeholders that prevent layout shift.

## Key Features

- **Sidebar + Main Content Layout** — Fixed-width sidebar (w-64) with icon/label navigation links, active state highlighting, and collapsible behavior at the `md` breakpoint for mobile
- **KPI Cards with Trends** — 3-4 metric cards in a responsive grid showing metric name, current value, percentage change with up/down indicators, and optional sparkline charts
- **Sortable, Filterable Data Tables** — Headless table logic via `@tanstack/react-table` paired with shadcn/ui Table components, with search, status filters, and pagination (10-25 rows)
- **Skeleton Loading States** — Placeholder skeletons that match card and table shapes during data loads, preventing layout shift and blank-screen moments
- **Date Range Filtering** — Built-in date range picker pattern for filtering dashboard data, defaulting to the last 30 days

## Use Cases

- Building an analytics dashboard that shows traffic, revenue, and conversion KPIs at a glance
- Creating an admin panel for managing users, orders, or content with sortable data tables
- Designing a CRM interface with pipeline metrics, contact lists, and activity feeds
- Shipping a monitoring tool that displays system health, error rates, and performance trends

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
