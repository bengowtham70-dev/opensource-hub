---
name: toast-notifications
description: "Sonner toast library, promise toasts, action buttons, stacking, rich content, and swipe to dismiss."
homepage: https://yepapi.com/skills/toast-notifications
metadata:
  tags: [toast, notifications, sonner, feedback]
---

# Toast Notifications

## Rules

- Use `sonner` — lightweight, beautiful, great defaults, works with React Server Components
- Setup: add `<Toaster />` to root layout once — configure position, theme, and duration globally
- Promise toasts: `toast.promise(asyncFn, { loading, success, error })` — shows loading → success/error automatically
- Action buttons: `toast('Deleted', { action: { label: 'Undo', onClick: undoDelete } })` — for reversible actions
- Duration: 4 seconds default — use longer (8s) for important messages, `Infinity` for required actions
- Position: `top-right` for desktop, `bottom-center` for mobile — or use `top-center` for both
- Rich content: icons, descriptions, custom JSX — but keep toasts short, not paragraphs
- Dismiss: auto-dismiss after duration, swipe to dismiss on touch, close button for persistent toasts
- Types: `toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()` — use semantic types

## Patterns

```tsx
// Root layout setup
import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}

// Usage patterns
import { toast } from "sonner";

// Simple notifications
toast.success("Profile updated");
toast.error("Failed to save changes");

// Promise toast — loading → success/error
toast.promise(updateProfile(data), {
  loading: "Saving...",
  success: "Profile updated!",
  error: "Failed to save. Try again.",
});

// Action button for undo
function deleteItem(id: string) {
  const item = items.find((i) => i.id === id);
  removeItem(id); // optimistic remove
  toast("Item deleted", {
    action: {
      label: "Undo",
      onClick: () => restoreItem(item),
    },
  });
}

// Custom content
toast("New message", {
  description: "Sarah sent you a message",
  duration: 6000,
});
```

## Avoid

- Multiple toast libraries — pick Sonner and use it everywhere for consistency
- Long text in toasts — keep to one sentence; use a notification center for detailed messages
- Toasts for validation errors — show inline errors on forms, not toasts
- Silent failures — if an async action fails, always show an error toast
- Toasts without semantic types — use `toast.error()` not `toast()` for errors so screen readers announce severity
