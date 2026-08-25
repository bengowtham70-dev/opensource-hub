# State Management Skill

> Use the right state tool for each job instead of putting everything in Redux.

## Install

```bash
npx skills add YepAPI/skills --skill state-management
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

Teaches your AI agent to separate server state from client state and pick the right tool for each. React Query / TanStack Query handles server data with caching and revalidation. Zustand or Jotai manages lightweight client state without boilerplate. URL search params hold filter, sort, and pagination state. And derived state is computed during render instead of being synced with `useEffect`.

## Key Features

- **Server vs Client State Separation** — uses React Query for data that lives on the server (fetching, caching, revalidating) and Zustand/Jotai for state that only exists in the browser, preventing the tangled mess of mixing both
- **React Query for Server State** — fetches, caches, and revalidates server data with built-in stale time, garbage collection, and automatic background refetching so your UI always shows fresh data
- **Zustand/Jotai for Client State** — manages UI-only state like modals, sidebars, and theme preferences with minimal boilerplate and no provider wrapping, keeping components lean
- **URL State for Filters** — stores filter, sort, search, and pagination state in URL search params via `useSearchParams()` so users can bookmark, share, and navigate back to any filtered view
- **Optimistic Updates** — updates the UI immediately on user action and reverts on server error, making the app feel instant while keeping data consistent

## Use Cases

- Building a dashboard with server-fetched data, client-side sidebar state, and URL-driven filters that all stay in sync
- Replacing a bloated Redux store with React Query for API data and Zustand for the remaining UI state
- Implementing a product listing page where filter and sort selections persist in the URL for shareability
- Adding optimistic updates to a shopping cart so items appear instantly without waiting for the server response

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
