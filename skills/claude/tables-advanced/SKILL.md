---
name: tables-advanced
description: "@tanstack/react-table with shadcn, column resizing, row selection, inline editing, virtualization, and server-side operations."
homepage: https://yepapi.com/skills/tables-advanced
metadata:
  tags: [tables, data-grid, tanstack, virtualization]
---

# Advanced Tables

## Rules

- `@tanstack/react-table` + shadcn `<DataTable>` — headless, type-safe, full control over rendering
- Column definitions: typed with `ColumnDef<T>` — accessors, headers, cells with custom renderers
- Server-side operations: sorting, filtering, pagination via URL search params — send to API, not client-side on full dataset
- Row selection: checkbox column with `enableRowSelection` — bulk actions toolbar appears when rows selected
- Column visibility: toggle columns with dropdown menu — persist preferences in localStorage
- Inline editing: double-click cell to edit, Enter to save, Escape to cancel — update via API on save
- Virtualized rows: `@tanstack/react-virtual` for 10k+ rows — only render visible rows in the DOM
- Column resizing: `enableColumnResizing` — drag column borders, persist widths in localStorage
- CSV/Excel export: export current filtered/sorted view — use `xlsx` library for Excel, manual CSV for lightweight

## Patterns

```tsx
import { ColumnDef, useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";

const columns: ColumnDef<User>[] = [
  { id: "select", header: ({ table }) => (
    <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)} />
  ), cell: ({ row }) => (
    <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} />
  ), enableSorting: false },
  { accessorKey: "name", header: ({ column }) => (
    <Button variant="ghost" onClick={() => column.toggleSorting()}>
      Name <SortIcon direction={column.getIsSorted()} />
    </Button>
  )},
  { accessorKey: "email", header: "Email" },
  { accessorKey: "role", header: "Role", cell: ({ row }) => <Badge>{row.getValue("role")}</Badge> },
  { id: "actions", cell: ({ row }) => <RowActions user={row.original} /> },
];

// Server-side pagination with URL params
function UsersTable() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? 1);
  const sort = searchParams.get("sort") ?? "name";
  const order = searchParams.get("order") ?? "asc";

  const { data } = useQuery({
    queryKey: ["users", { page, sort, order }],
    queryFn: () => fetchUsers({ page, sort, order, limit: 50 }),
  });

  const table = useReactTable({
    data: data?.users ?? [],
    columns,
    pageCount: data?.totalPages ?? -1,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  // Bulk actions
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  return (
    <div>
      {selectedRows.length > 0 && (
        <div>
          <span>{selectedRows.length} selected</span>
          <Button onClick={() => bulkDelete(selectedRows.map((r) => r.original.id))}>Delete</Button>
          <Button onClick={() => exportCsv(selectedRows.map((r) => r.original))}>Export</Button>
        </div>
      )}
      <Table>...</Table>
      <Pagination page={page} totalPages={data?.totalPages} />
    </div>
  );
}
```

## Avoid

- Client-side sorting/filtering on large datasets — use server-side operations with URL search params
- Rendering all rows without virtualization for 1,000+ items — use `@tanstack/react-virtual`
- Building custom table logic from scratch — TanStack Table handles sorting, filtering, selection, pagination
- Exporting from raw data instead of current view — export what the user sees (filtered + sorted)
- Losing column preferences on page reload — persist visibility and width in localStorage
