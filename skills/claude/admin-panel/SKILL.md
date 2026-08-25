---
name: admin-panel
description: "CRUD generators, data tables, user management, role-based access, and bulk operations."
homepage: https://yepapi.com/skills/admin-panel
metadata:
  tags: [admin, crud, dashboard, management]
---

# Admin Panel

## Rules

- Data tables: server-side pagination, sorting, and filtering — never load all rows client-side — use `?page=1&limit=25&sort=createdAt&order=desc`
- CRUD pattern: list (table), create (form/modal), read (detail view), update (edit form), delete (confirm dialog) — consistent layout across all resources
- Role-based access: define roles (admin, editor, viewer) with permission matrix — check permissions server-side on every API route, not just UI
- Bulk operations: select multiple rows, batch action (delete, export, status change) — confirm destructive actions, process in background for large batches
- Search: debounced text search (300ms) across key fields — combine with column filters for precise queries
- User management: list users, view details, change roles, disable/enable accounts, impersonate (admin only with audit log)
- Audit log: record who changed what and when — `{ userId, action, resource, resourceId, changes, timestamp }`
- Layout: sidebar navigation (collapsible), breadcrumbs, page title with action buttons — responsive but desktop-optimized

## Permission Check Pattern

```typescript
const PERMISSIONS = {
  admin: ["users:read", "users:write", "users:delete", "data:read", "data:write", "data:delete"],
  editor: ["data:read", "data:write"],
  viewer: ["data:read"],
} as const;

function can(role: string, permission: string): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

// Middleware
if (!can(user.role, "users:write")) return Response.json({ error: "Forbidden" }, { status: 403 });
```

## Data Table API Pattern

```
GET /api/admin/users?page=1&limit=25&sort=createdAt&order=desc&search=john&role=admin
```

Return: `{ data: [...], total: 150, page: 1, limit: 25, totalPages: 6 }`

## Avoid

- Client-side-only permission checks — always enforce on the server
- Loading all data then paginating in the browser — use server-side pagination
- No confirmation for destructive actions — always confirm deletes and bulk operations
- Missing audit trail — you need to know who changed what
