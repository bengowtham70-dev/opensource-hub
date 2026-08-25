---
name: spreadsheet-export
description: "CSV/Excel/PDF generation from app data, streaming large datasets, and formatting."
homepage: https://yepapi.com/skills/spreadsheet-export
metadata:
  tags: [export, csv, excel, pdf]
---

# Spreadsheet Export

## Rules

- CSV: use `papaparse` for generation — handles escaping, delimiters, and unicode correctly
- Excel: use `exceljs` for .xlsx — supports styling, multiple sheets, formulas, and streaming
- PDF: use `@react-pdf/renderer` for React-based PDF or `pdfkit` for server-side generation
- Stream large datasets: use `exceljs` streaming writer or generate CSV row-by-row — never load entire dataset into memory
- Set proper response headers: `Content-Type: text/csv`, `Content-Disposition: attachment; filename="export.csv"`
- Date formatting: export dates in ISO 8601 or locale-aware format — never raw timestamps
- Number formatting: preserve precision, use explicit column types in Excel — avoid Excel auto-formatting numbers as dates
- Column headers: human-readable labels, not database column names — map `created_at` to `Created Date`
- Implement export as a server-side API route — client triggers download via `fetch` + `blob` + `URL.createObjectURL`
- Add progress indicator for large exports — use streaming response or background job with polling
- Limit export size: cap at a reasonable row count (50K-100K), offer background email delivery for larger datasets

## Avoid

- Building CSV by string concatenation — breaks on commas, quotes, and newlines in data
- Loading millions of rows into memory — stream from database cursor
- Synchronous PDF generation for large reports — use background jobs
- Exporting sensitive fields (passwords, tokens) — filter columns before export
