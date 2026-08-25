# Feature Flags Skill

> Ship code behind flags and roll out features to 1% of users before everyone.

## Install

```bash
npx skills add YepAPI/skills --skill feature-flags
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

Teaches your AI agent to implement feature flags using LaunchDarkly, Flagsmith, or Vercel Flags. It covers boolean toggles, percentage-based rollouts with consistent user bucketing, A/B testing with conversion tracking, server-side evaluation, safe defaults, and flag lifecycle management so you never ship a feature you cannot turn off.

## Key Features

- **Multiple Flag Providers** — integrates with LaunchDarkly for enterprise, Flagsmith for open-source, and `@vercel/flags` for Next.js with a consistent evaluation pattern
- **Percentage-Based Rollouts** — hashes user IDs for consistent bucketing so the same user always sees the same variant, enabling safe gradual rollouts from 1% to 100%
- **Server-Side Evaluation** — evaluates flags on the server and sends only the result to the client, keeping targeting rules and segment logic private
- **A/B Testing Support** — defines variants, tracks conversion events, and measures statistical significance so you can make data-driven feature decisions
- **Flag Lifecycle Management** — enforces naming conventions (`enable-new-checkout`, kebab-case), expiration dates, and cleanup after full rollout to prevent stale flag debt

## Use Cases

- Gradually launching a new checkout flow to 10% of users while monitoring error rates
- Giving beta testers early access to features by targeting specific user segments
- Adding a kill switch to instantly disable a feature if it causes problems in production
- Running an A/B test on a new pricing page to measure conversion impact

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
