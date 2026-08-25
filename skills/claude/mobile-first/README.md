# Mobile-First Skill

> Design for the phone in your pocket first, then scale up to desktop.

## Install

```bash
npx skills add YepAPI/skills --skill mobile-first
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

Teaches your AI agent to build mobile-first responsive interfaces that feel native on phones and scale up gracefully to tablets and desktops. It covers `min-width` breakpoints, 44x44px touch targets, `dvh` viewport units for mobile browser chrome, safe area insets for notched devices, PWA configuration, mobile performance budgets, and input types that trigger the correct keyboard.

## Key Features

- **Mobile-First Breakpoints** — styles the mobile layout first and uses `min-width` media queries to enhance for larger screens, ensuring the smallest screen always gets a complete experience
- **Touch-Friendly Targets** — enforces minimum 44x44px tap targets for buttons and links so users can interact accurately with their fingers instead of struggling with tiny hit areas
- **Modern Viewport Units** — uses `dvh` instead of `vh` for full-screen layouts to account for mobile browser chrome (address bar, navigation bar) that changes the actual visible height
- **Safe Area & Notch Support** — applies `env(safe-area-inset-*)` padding for devices with notches, Dynamic Island, or rounded corners so content is never hidden behind hardware
- **PWA Patterns** — configures `manifest.json`, service workers, and `<meta name="theme-color">` so your web app can be installed on the home screen and works offline

## Use Cases

- Building any public-facing web app that needs to work well on phones, tablets, and desktops
- Converting an existing desktop-first layout to mobile-first responsive design
- Adding PWA capabilities (install prompt, offline support, home screen icon) to an existing web app
- Building a responsive dashboard with tables and charts that reflow properly on small screens

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
