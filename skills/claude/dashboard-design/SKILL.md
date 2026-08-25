---
name: dashboard-design
description: "Layout grids, KPI cards, data tables with sorting/filtering, sidebar navigation, and responsive breakpoints."
homepage: https://yepapi.com/skills/dashboard-design
metadata:
  tags: [dashboard, layout, kpi, tables]
---

# Dashboard Design

## Rules

- Sidebar + main content layout: fixed sidebar (w-64), fluid main area with padding
- Sidebar navigation: icon + label links, active state highlight, collapsible on mobile
- KPI cards row at top: 3-4 cards in a responsive grid — metric name, value, trend (up/down %), sparkline optional
- Data tables: sortable columns, filterable by search/status, paginated (10-25 rows default)
- Use `@tanstack/react-table` for headless table logic — pair with shadcn/ui Table components
- Responsive: sidebar collapses to hamburger menu at `md` breakpoint, cards stack to 1-2 columns
- Loading states: skeleton placeholders matching card/table shapes — never layout shift
- Date range picker for filtering dashboard data — default to last 30 days

## Layout Structure

```
┌──────────┬────────────────────────────┐
│ Sidebar  │  Header / Breadcrumbs      │
│          ├────────────────────────────┤
│ Nav      │  KPI Cards (3-4 grid)      │
│ Links    ├────────────────────────────┤
│          │  Charts / Graphs           │
│          ├────────────────────────────┤
│          │  Data Table                │
└──────────┴────────────────────────────┘
```

## Patterns

```tsx
// KPI Card
function KPICard({ title, value, change }: { title: string; value: string; change: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={cn("text-xs", change >= 0 ? "text-green-600" : "text-red-600")}>
          {change >= 0 ? "+" : ""}{change}% from last period
        </p>
      </CardContent>
    </Card>
  );
}
```

## Avoid

- Fixed-width main content — always use fluid layout that fills available space
- Tables without pagination — large datasets kill performance and usability
- Missing loading/empty states — always show skeletons or "No data" messaging
- Sidebar that cannot collapse — mobile users need the full viewport width
- Loading spinners for partial page updates — use skeletons for specific sections
- Cramming too many KPIs — highlight 3-5 critical metrics, put rest in expandable sections
- Custom sidebar from scratch — use shadcn's sidebar component
- Empty states without actions — always include a CTA ("No campaigns yet. Create your first →")
