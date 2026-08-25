# Real-Time Data Skill

> Teach your AI agent to build live-updating features with WebSockets, Server-Sent Events, and smart polling with automatic reconnection

## Install

```bash
npx skills add YepAPI/skills --skill real-time-data
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

This skill teaches your AI coding agent how to implement real-time data delivery — choosing the right transport (WebSocket for bidirectional, SSE for server-to-client, polling for simple low-frequency), handling reconnection with exponential backoff and jitter, building optimistic UI updates with rollback, and securing connections with authentication and rate limiting. Your agent picks the simplest approach that works and degrades gracefully when connections fail.

## Key Features

- **Right Transport for the Job** — WebSocket for bidirectional flows like chat and collaboration, SSE via `ReadableStream` or `EventSource` for one-way feeds like notifications, and polling with ETags for simple low-frequency updates
- **Resilient Reconnection** — Exponential backoff (1s, 2s, 4s, 8s up to 30s) with random jitter to prevent thundering herd on server recovery, plus heartbeat ping/pong every 30 seconds to detect dead connections
- **Optimistic UI Updates** — Immediate UI changes on user action with pending state indicators, automatic rollback on server error, so the app feels instant even over slow connections
- **Secure and Rate-Limited** — JWT authentication via WebSocket query params or first message, cookie-based auth for SSE, per-client message rate limiting on bidirectional connections, and bounded message queues that drop oldest messages when clients fall behind
- **Graceful Degradation** — Automatic fallback chain from WebSocket to SSE to polling if a transport fails, with typed JSON messages using discriminated unions for type safety

## Use Cases

- Building a live dashboard that shows real-time metrics, server status, or user activity without manual page refreshes
- Adding chat or messaging functionality to your app with typing indicators and instant message delivery
- Creating a notification feed that pushes alerts, updates, and activity events to users as they happen
- Implementing collaborative editing where multiple users see each other's changes in real time, like a shared document or whiteboard

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
