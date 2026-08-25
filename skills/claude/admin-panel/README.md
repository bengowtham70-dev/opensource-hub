# Admin Panel Skill

> Teach your AI agent to build internal admin tools with data tables, CRUD generators, role-based access, and audit logging

## Install

```bash
npx skills add YepAPI/skills --skill admin-panel
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

This skill teaches your AI coding agent how to build admin panels that work for real teams — server-side paginated data tables with sorting and filtering, consistent CRUD layouts for any resource, role-based permissions enforced on the server, bulk operations with confirmation dialogs, and audit logging that tracks who changed what and when. Your agent builds admin tools with a sidebar layout, breadcrumbs, and debounced search that are desktop-optimized but responsive.

## Key Features

- **Server-Side Data Tables** — Paginated tables with sorting, filtering, and debounced text search (300ms) using query parameters like `?page=1&limit=25&sort=createdAt&order=desc`, so you never load all rows into the browser
- **CRUD Layout System** — Consistent patterns for list (table), create (form/modal), read (detail view), update (edit form), and delete (confirm dialog) that stay uniform across every resource in your admin panel
- **Role-Based Access Control** — Roles (admin, editor, viewer) with a permission matrix checked server-side on every API route, not just in the UI, using a clean `can(role, permission)` pattern with `resource:action` permission strings
- **Bulk Operations** — Multi-row selection with batch actions (delete, export, status change), confirmation dialogs for destructive actions, and background processing for large batches so the UI stays responsive
- **Audit Logging** — Every change recorded with `userId`, `action`, `resource`, `resourceId`, `changes`, and `timestamp`, plus user management features including impersonation with mandatory audit trail

## Use Cases

- Building an internal tool for your team to manage users, view account details, change roles, and disable accounts with full audit history
- Creating a customer support dashboard where agents can look up users, view their activity, and resolve issues without touching the database
- Adding a content management interface for non-technical team members to create, edit, publish, and archive content with role-based permissions
- Designing a user moderation panel with bulk actions for reviewing flagged content, banning accounts, and exporting reports

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
