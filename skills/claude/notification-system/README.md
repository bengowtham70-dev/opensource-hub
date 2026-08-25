# Notification System Skill

> Build multi-channel notifications — in-app alerts, push notifications, digest emails, and webhook dispatching with user preferences

## Install

```bash
npx skills add YepAPI/skills --skill notification-system
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

Teaches your AI agent to architect a complete notification system across multiple channels. It covers a channel abstraction layer (in-app, email, push, webhook), database-backed in-app notifications with real-time delivery via WebSocket or SSE, toast UI patterns with stacking and auto-dismiss, Web Push API setup with service workers, digest email batching via cron, HMAC-signed webhook dispatching with retries, a user preference center for per-channel opt-in/out, and idempotency keys to prevent duplicate notifications.

## Key Features

- **Multi-Channel Architecture** — Define notification types that specify which channels they use (in-app, email, push, webhook), with a clean abstraction layer that makes adding new channels easy
- **In-App Notifications** — Database-stored notifications with `userId`, `type`, `title`, `body`, and `readAt` fields, delivered in real-time via WebSocket/SSE with poll fallback
- **Toast UI Patterns** — Sonner or react-hot-toast with auto-dismiss after 5 seconds, max 3 stacked toasts, and action buttons for undo — polished notifications users actually notice
- **Web Push Notifications** — Web Push API with service worker registration, permission requests triggered by user action (never on page load), and cross-browser support
- **User Preference Center** — A `user_notification_preferences` table that lets users choose which channels receive which notification types, so you respect their choices

## Use Cases

- Building activity feeds for social apps with real-time in-app alerts and optional push notifications
- Adding notification infrastructure to a SaaS product with email digests, in-app toasts, and webhook integrations
- Shipping order update notifications that reach customers via push, email, and in-app depending on preferences
- Creating team collaboration notifications with @mentions, real-time alerts, and daily digest summaries

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
