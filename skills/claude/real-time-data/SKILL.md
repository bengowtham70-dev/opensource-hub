---
name: real-time-data
description: "WebSocket setup, Server-Sent Events, polling patterns, reconnection, and optimistic updates."
homepage: https://yepapi.com/skills/real-time-data
metadata:
  tags: [websocket, sse, realtime, streaming]
---

# Real-Time Data

## Rules

- Choose the right transport: WebSocket for bidirectional (chat, collaboration), SSE for server-to-client (notifications, feeds), polling for simple low-frequency updates
- WebSocket: use `ws` on Node.js, native `WebSocket` on client — wrap in a reconnecting class with exponential backoff
- SSE: use `ReadableStream` in API routes or `EventSource` on client — auto-reconnects, simpler than WebSocket for one-way data
- Polling: use `setInterval` + `fetch` with `If-None-Match` / ETag for efficiency — interval of 5-30s depending on freshness needs
- Reconnection: implement exponential backoff (1s, 2s, 4s, 8s... max 30s) with jitter — avoid thundering herd on server recovery
- Heartbeat: send ping/pong every 30s on WebSocket — detect dead connections and clean up server-side resources
- Optimistic updates: update UI immediately on user action, revert on server error — use a pending state to show unconfirmed changes
- Message format: JSON with `{ type, payload, timestamp }` — use discriminated unions for type safety
- Authentication: pass JWT in WebSocket connection URL query param or first message — SSE uses cookies automatically
- Rate limit incoming WebSocket messages per client — prevent abuse on bidirectional connections
- Graceful degradation: fall back from WebSocket to SSE to polling if connection fails

## Avoid

- WebSocket for simple notification feeds — SSE is simpler and auto-reconnects
- Polling intervals under 3 seconds — use SSE or WebSocket instead
- Storing WebSocket state in component state — use a singleton connection manager or context
- Unbounded message queues — cap buffer size and drop oldest messages if client falls behind
