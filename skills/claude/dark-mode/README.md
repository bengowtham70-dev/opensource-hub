# Dark Mode Skill

> Add dark mode to your Next.js app with CSS variables, system preference detection, and zero flash of wrong theme

## Install

```bash
npx skills add YepAPI/skills --skill dark-mode
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

Teaches your AI agent to implement dark mode using `next-themes` with CSS variables and Tailwind's `dark:` class prefix. It covers the `ThemeProvider` setup with `suppressHydrationWarning` to prevent hydration mismatches, system preference detection via `prefers-color-scheme`, a light/dark/system toggle component that only mounts after hydration, localStorage persistence, and smooth color transitions. Your agent will define all colors as CSS variables in `:root` and `.dark` so theming works everywhere.

## Key Features

- **next-themes Integration** — Wraps your app in `<ThemeProvider attribute="class" defaultTheme="system">` with automatic localStorage persistence and `<html>` class management
- **CSS Variable Theming** — All colors defined as CSS variables in `:root` (light) and `.dark` (dark), referenced as `var(--background)`, making every component theme-aware automatically
- **System Preference Detection** — Respects the user's OS `prefers-color-scheme` setting out of the box, with manual override for users who want to choose
- **Hydration-Safe Toggle** — Theme toggle component mounts only after `useEffect` to prevent the hydration mismatch that plagues most dark mode implementations
- **Smooth Transitions** — `transition-colors duration-200` on body for a polished theme switch that does not flash or jump

## Use Cases

- Adding dark mode to any user-facing app so users can choose their preferred theme
- Building developer tools or code editors where dark mode is the expected default
- Creating a reading app or media platform where dark mode reduces eye strain
- Shipping any modern web app — users expect dark mode support in 2025

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
