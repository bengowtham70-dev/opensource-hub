# Command Palette Skill

> Cmd+K power-user navigation — fuzzy search, grouped actions, keyboard navigation, and recent items with cmdk

## Install

```bash
npx skills add YepAPI/skills --skill command-palette
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

Teaches your AI agent to build a command palette using the cmdk library with `Cmd+K` / `Ctrl+K` keyboard trigger, built-in fuzzy search with match ranking, grouped actions (navigation, commands, recent items), full keyboard navigation, recent item persistence in localStorage, and dynamic action registration from different parts of the app. It prevents the unnecessary complexity of building custom fuzzy search, the missing `preventDefault` that opens the browser search bar, and static-only palettes that don't adapt to page context.

## Key Features

- **cmdk integration** — Uses the composable `Command.Dialog`, `Command.Input`, `Command.List`, and `Command.Item` components with built-in fuzzy filtering and accessible keyboard navigation
- **Global keyboard shortcut** — Registers `Cmd+K` (Mac) and `Ctrl+K` (Windows/Linux) with proper `preventDefault` to toggle the palette without triggering the browser's default behavior
- **Grouped actions** — Organizes items into Recent, Navigation, and Commands groups with headings so users can scan by category instead of scrolling a flat list
- **Recent items persistence** — Stores the last 5-10 selected items in localStorage and shows them at the top when the search input is empty for quick repeat access
- **Dynamic action registration** — Registers page-specific actions (like "Edit this post" on a post page) so the palette adapts to the current context instead of showing the same static list everywhere

## Use Cases

- You ask your AI to add keyboard navigation and it builds a command palette with Cmd+K, fuzzy search across all pages, and grouped navigation/command actions
- You prompt for a quick-search feature and it uses cmdk with a dialog that shows recent items on open, filters as you type, and navigates on Enter
- You ask for page-specific actions and it dynamically registers "Edit post", "Delete post", "View analytics" actions that only appear when you're on a post page
- You request dark mode toggle and it adds it as a command palette action alongside navigation items, accessible from anywhere with Cmd+K

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
