# Advanced Tables Skill

> Data tables that handle 10k+ rows — TanStack Table with server-side sorting, row selection, inline editing, virtualization, and CSV export

## Install

```bash
npx skills add YepAPI/skills --skill tables-advanced
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

Teaches your AI agent to build production data tables with `@tanstack/react-table` and shadcn: typed column definitions, server-side sorting/filtering/pagination via URL search params, row selection with bulk actions, column visibility toggles, inline cell editing, virtualized rows for 10,000+ item datasets, column resizing with persisted widths, and CSV/Excel export of the current filtered view. It prevents the table anti-patterns: client-side sorting on full datasets that freezes the browser, rendering thousands of DOM rows without virtualization, and exporting raw data instead of what the user is actually looking at.

## Key Features

- **TanStack Table with shadcn** — Typed `ColumnDef<T>` with custom cell renderers, sortable headers, and a clean shadcn UI that's fully controlled and infinitely customizable
- **Server-side operations** — Sends sorting, filtering, and pagination to the API via URL search params with `manualSorting` and `manualPagination` so the server handles the heavy lifting, not the browser
- **Row selection with bulk actions** — Checkbox column with select-all, a bulk actions toolbar that appears when rows are selected, and operations like bulk delete, status change, and export
- **Virtualized rows** — Integrates `@tanstack/react-virtual` for datasets with 10,000+ rows, rendering only visible rows in the DOM while maintaining smooth scrolling
- **CSV/Excel export** — Exports the current filtered, sorted, and visible columns as CSV or Excel using the `xlsx` library, so users get exactly what they see on screen

## Use Cases

- You ask your AI to build a users table and it creates typed column definitions with sortable headers, server-side pagination via URL params, and a bulk actions toolbar for row selection
- You prompt for an admin data view with 50,000 records and it uses virtualized rows with `@tanstack/react-virtual` instead of rendering all rows and crashing the browser tab
- You ask for inline editing and it makes cells editable on double-click with Enter to save and Escape to cancel, persisting changes to the API
- You request data export and it generates a CSV from the current filtered and sorted view instead of dumping the entire raw dataset

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
