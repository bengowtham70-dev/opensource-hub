---
name: notification-system
description: "Push notifications, in-app alerts, toast patterns, digest emails, and webhook dispatching."
homepage: https://yepapi.com/skills/notification-system
metadata:
  tags: [notifications, push, alerts, webhooks]
---

# Notification System

## Rules

- Channel abstraction: define notification channels (in-app, email, push, webhook) — each notification type specifies which channels it uses
- In-app notifications: store in database with `userId`, `type`, `title`, `body`, `readAt`, `createdAt` — poll or use WebSocket/SSE for real-time
- Toast patterns: use a toast library (sonner, react-hot-toast) — auto-dismiss after 5s, stack max 3, action button for undo
- Push notifications: Web Push API with service worker — request permission only after user action, never on page load
- Digest emails: batch notifications into daily/weekly digests — run via cron, group by type, include unsubscribe link
- Webhook dispatching: POST to subscriber URLs with HMAC signature, retry with exponential backoff (3 attempts), log delivery status
- Preference center: let users choose channels per notification type — store as `user_notification_preferences` table
- Idempotency: deduplicate notifications with a unique key (e.g., `{type}:{entityId}:{userId}`) — prevent duplicates on retry

## Database Schema

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
```

## Webhook Dispatch Pattern

```typescript
async function dispatchWebhook(url: string, payload: object, secret: string) {
  const body = JSON.stringify(payload);
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Signature": signature },
    body,
  });
}
```

## Avoid

- Requesting push permission on page load — users decline, and you can't ask again
- Missing retry logic for webhooks — network failures are common
- No read/unread tracking — users need to see what's new
- Sending every notification to every channel — respect user preferences
