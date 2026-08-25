# Pricing Pages Skill

> Teach your AI agent to build high-converting pricing pages with tier comparisons, monthly/annual toggles, and feature gating logic

## Install

```bash
npx skills add YepAPI/skills --skill pricing-pages
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

This skill teaches your AI coding agent how to build pricing pages that actually convert — 3-tier card layouts with "Most Popular" badges, monthly/annual toggles showing savings, feature comparison tables grouped by category, and runtime feature gating tied to user plans. Your agent also handles usage-based pricing calculators, social proof placement, and FAQ sections that address common objections like cancellation and refunds.

## Key Features

- **3-Tier Card Layout** — Free/Starter, Pro, and Enterprise tiers with the recommended plan highlighted, large price display with small period labels ("/mo"), and annual prices shown as monthly equivalents so users can compare easily
- **Monthly/Annual Toggle** — Clean toggle defaulting to annual billing with savings callout ("Save 20%"), because annual plans reduce churn and improve cash flow for your business
- **Feature Comparison Table** — Checkmarks and dashes organized by feature category, keeping the table scannable even with 10+ features, so users immediately see what they get at each tier
- **Feature Gate System** — Config-driven plan permissions (`PLAN_FEATURES` object) checked at runtime with a `hasFeature(plan, feature)` helper, enforced server-side so users cannot bypass limits through the client
- **Usage-Based Pricing UI** — Interactive calculator with sliders that dynamically update the displayed price as users adjust usage tiers, showing exactly what they will pay at their expected volume

## Use Cases

- Building a SaaS pricing page that clearly shows the difference between free, pro, and enterprise plans with an annual discount toggle
- Creating plan comparison tables for a product with many features that need to be organized by category for readability
- Adding upgrade prompts inside your app that show the user what they are missing and how much it costs to unlock
- Designing usage-based pricing displays where customers can estimate their monthly cost based on expected API calls, storage, or seats

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
