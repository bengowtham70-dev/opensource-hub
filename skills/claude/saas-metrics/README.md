# SaaS Metrics Skill

> Teach your AI agent to build dashboards that calculate churn, LTV, CAC, NRR, and cohort retention — the metrics investors and founders care about

## Install

```bash
npx skills add YepAPI/skills --skill saas-metrics
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

This skill teaches your AI coding agent how to implement the core SaaS metrics that drive business decisions — churn rate (logo and revenue), lifetime value, customer acquisition cost, net revenue retention, MRR waterfall charts, and cohort analysis with retention heatmaps. Your agent builds these calculations correctly from event-level data, distinguishes between logo churn and revenue churn, and stores everything in a schema that supports recomputation when you need to re-slice by new dimensions.

## Key Features

- **Churn, LTV, and CAC Calculations** — Monthly churn rate (customers lost / customers at start), LTV as ARPU divided by monthly churn rate, and CAC as total acquisition spend divided by new customers, with a target LTV:CAC ratio of 3:1 or higher
- **Net Revenue Retention (NRR)** — Tracks (starting MRR + expansion - contraction - churn) / starting MRR, targeting above 100% as the signal that expansion revenue outpaces losses, which is the path to compounding growth
- **MRR Waterfall Charts** — Stacked bar chart data structure breaking down monthly MRR movement into new, expansion, contraction, churn, and net change, so you see exactly where revenue is growing and where it is leaking
- **Cohort Analysis** — Groups customers by signup month with retention and revenue tracked per cohort over time, displayed as a heatmap, with a dedicated SQL schema for efficient cohort queries
- **Expansion Revenue Tracking** — Upgrades, add-ons, and seat additions tracked separately from new MRR, with healthy benchmarks (expansion greater than 30% of new MRR) built into the agent's guidance

## Use Cases

- Building an investor reporting dashboard that shows MRR growth, churn trends, LTV:CAC ratio, and cohort retention in a clean, shareable format
- Creating a growth dashboard for your product team that tracks which features drive expansion revenue and which correlate with churn
- Designing retention analysis views that show month-over-month cohort survival rates as a heatmap so you can spot when retention is improving or degrading
- Adding revenue forecasting to an internal tool that projects MRR based on current growth rate, churn rate, and expansion trends

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
