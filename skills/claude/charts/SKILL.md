---
name: charts
description: "Recharts/Chart.js data visualization — bar, line, area, pie charts."
homepage: https://yepapi.com/skills/charts
metadata:
  tags: [charts, data-viz, recharts, visualization]
---

# Charts & Data Visualization

## Rules

- Use Recharts for React projects — composable, responsive, well-typed
- Wrap charts in `<ResponsiveContainer width="100%" height={300}>` — never fixed pixel widths
- Accessible colors: use a color-blind safe palette (don't rely on red/green distinction)
- Axis labels: always label both axes, use readable number formatting (1.2K not 1200)
- Tooltips: show exact values on hover — format with units and locale-aware numbers
- Loading states: skeleton chart shape while data loads
- Choose chart type by data: line (trends over time), bar (comparisons), area (volume), pie (parts of whole — max 5 slices)
- `key` prop on dynamic data — Recharts re-renders correctly when data changes

## Avoid

- 3D charts — they distort perception, always use flat/2D
- Pie charts with more than 5-6 slices — use horizontal bar chart instead
- Charts without axis labels or legends — always provide context
- Fetching data inside chart components — fetch in parent, pass as props
