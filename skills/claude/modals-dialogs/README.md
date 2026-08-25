# Modals & Dialogs Skill

> Accessible modals that trap focus, lock scroll, and close on Escape — confirmation dialogs, bottom sheets for mobile, and forms that don't dismiss on error

## Install

```bash
npx skills add YepAPI/skills --skill modals-dialogs
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

Teaches your AI agent to build modals and dialogs with Radix/shadcn that are accessible out of the box: focus trapping, scroll locking, Escape to close, click outside to dismiss. It covers confirmation dialogs for destructive actions, bottom sheets and drawers for mobile-friendly interactions, controlled modal state for external triggers, and forms inside dialogs that stay open on validation failure. It prevents the DIY modal disasters: `position: fixed` overlays with no focus management, body scroll leaking behind the modal, no Escape key handling, and dialogs that close when a form has errors.

## Key Features

- **Radix/shadcn Dialog** — Uses `<Dialog>` or `<AlertDialog>` with built-in focus trapping (first focusable element on open, return on close), scroll lock, Escape key, and click-outside dismiss
- **Confirmation dialogs** — Uses `<AlertDialog>` for destructive actions with clear title, description, Cancel and Delete buttons, and loading state during async operations
- **Bottom sheets for mobile** — Uses `<Sheet>` with `side="bottom"` for action menus and forms on mobile screens where centered modals are hard to reach with thumbs
- **Forms in dialogs** — Keeps the dialog open on validation failure with inline errors, submits on Enter, and only closes on successful submission
- **Controlled state** — Uses `open` + `onOpenChange` props for modals triggered by external events (URL params, keyboard shortcuts, API responses) instead of relying on internal trigger state

## Use Cases

- You ask your AI to add a delete confirmation and it builds an `<AlertDialog>` with a clear warning message, Cancel and Delete buttons, loading state during the API call, and proper focus return on close
- You prompt for a mobile action menu and it uses a `<Sheet side="bottom">` that slides up from the bottom instead of a centered modal that's hard to reach on phone screens
- You ask for an edit form in a modal and it keeps the dialog open when validation fails, shows inline errors, and only closes after a successful save
- You request a modal triggered by a URL parameter and it uses controlled `open` state synced with the route instead of an internal trigger button

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
