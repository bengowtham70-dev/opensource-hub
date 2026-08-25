---
name: state-management
description: "Zustand/Jotai for client state, React Query for server, URL for filters."
homepage: https://yepapi.com/skills/state-management
metadata:
  tags: [state, zustand, react-query, url-state]
---

# State Management

## Rules

- Server state vs client state — don't mix them
- React Query / TanStack Query for server state: fetch, cache, revalidate
- Zustand or Jotai for client state — lightweight, no boilerplate
- URL state for filters, pagination, search: `useSearchParams()` in Next.js
- Form state: React Hook Form — controlled, performant, Zod validation
- Optimistic updates: update UI immediately, revert on server error
- Avoid global state for things that should be component-local
- Derived state: compute during render — don't sync with useEffect
