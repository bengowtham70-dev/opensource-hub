# Toast Notifications Skill

> User feedback that just works — promise toasts, undo actions, rich content, and swipe-to-dismiss with Sonner

## Install

```bash
npx skills add YepAPI/skills --skill toast-notifications
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

Teaches your AI agent to implement toast notifications with Sonner: one-time root layout setup, semantic types (success, error, warning, info), promise toasts that show loading then success/error, action buttons for undo flows, configurable duration and position, rich content with descriptions and icons, and swipe-to-dismiss on touch devices. It prevents the common toast mistakes: using toasts for form validation errors (which should be inline), silent failures with no error feedback, and inconsistent notification patterns from mixing multiple libraries.

## Key Features

- **Promise toasts** — Uses `toast.promise(asyncFn, { loading, success, error })` to automatically transition from a loading spinner to a success or error message based on the promise result
- **Undo action buttons** — Attaches an "Undo" button to destructive actions with `toast('Deleted', { action: { label: 'Undo', onClick } })` so users can reverse mistakes within the toast duration
- **Semantic types** — Uses `toast.success()`, `toast.error()`, `toast.warning()`, and `toast.info()` with distinct colors and icons so users instantly understand severity and screen readers announce it correctly
- **Rich content** — Supports descriptions, custom duration, and JSX content while keeping messages concise and scannable instead of cramming paragraphs into a small popup
- **Smart positioning and dismiss** — Configures `top-right` for desktop and `bottom-center` for mobile, with auto-dismiss after duration, close button for persistent toasts, and swipe-to-dismiss on touch

## Use Cases

- You ask your AI to save a form and it wraps the API call in `toast.promise()` so the user sees "Saving..." then "Saved!" or an error message without any manual loading state management
- You prompt for a delete action and it removes the item optimistically then shows a toast with an "Undo" button that restores the item if clicked within the toast duration
- You ask for error handling and it adds `toast.error()` calls in every catch block so users always know when something fails instead of staring at a page that looks like nothing happened
- You request notification setup and it adds a single `<Toaster />` component to the root layout with `richColors` and `closeButton` configured once for the entire app

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
