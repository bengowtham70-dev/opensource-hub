# Analytics Skill

> Add privacy-first web analytics with server-side tracking, custom events, UTM attribution, and GDPR-compliant consent

## Install

```bash
npx skills add YepAPI/skills --skill analytics
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

Teaches your AI agent to implement web analytics that respect user privacy while capturing the metrics that matter. It covers privacy-first tools like Plausible, Fathom, and Umami (or self-hosted PostHog), server-side tracking via Next.js middleware to avoid ad blocker data loss, meaningful custom event tracking with `snake_case` naming conventions, UTM parameter parsing for marketing attribution, consent banner patterns for GDPR compliance, and internal traffic filtering.

## Key Features

- **Privacy-First Analytics** — Plausible, Fathom, or Umami for cookieless, GDPR-compliant tracking out of the box, or self-hosted PostHog for full control
- **Server-Side Tracking** — Track events via Next.js middleware or API routes so ad blockers (which strip 20-40% of client-side data) never eat your metrics
- **Custom Event Tracking** — Track meaningful actions like `click_cta`, `submit_form`, and `view_pricing` using a consistent `snake_case` verb_noun naming convention
- **UTM Attribution** — Parse `utm_source`, `utm_medium`, and `utm_campaign` from URLs and store them with conversion events so you know which channels drive results
- **Consent Banner** — Required-in-EU consent pattern that only loads tracking scripts after the user opts in, keeping you compliant without losing data in privacy-friendly regions

## Use Cases

- Setting up marketing attribution to understand which campaigns, channels, and content drive signups
- Tracking user behavior across a SaaS product to identify drop-off points and optimize funnels
- Measuring A/B test results with custom event tracking and conversion metrics
- Building a product analytics dashboard that shows feature adoption, engagement, and retention

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
