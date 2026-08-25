# Spreadsheet Export Skill

> Teach your AI agent to generate CSV, Excel, and PDF exports that handle large datasets, proper formatting, and secure downloads

## Install

```bash
npx skills add YepAPI/skills --skill spreadsheet-export
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

This skill teaches your AI coding agent how to build robust data export features — CSV generation with papaparse, Excel files with exceljs (styling, multiple sheets, formulas), and PDF reports with React PDF or pdfkit. Your agent knows to stream large datasets instead of loading everything into memory, set proper response headers, and trigger clean client-side downloads from API routes.

## Key Features

- **Multi-Format Export** — CSV via papaparse for universal compatibility, Excel via exceljs for styled multi-sheet workbooks with formulas, and PDF via `@react-pdf/renderer` or pdfkit for formatted reports
- **Streaming Large Datasets** — Row-by-row CSV generation and exceljs streaming writer so exports with hundreds of thousands of rows never blow up server memory
- **Human-Readable Formatting** — Database column names mapped to readable labels (`created_at` becomes `Created Date`), dates in ISO 8601 or locale-aware formats, and explicit Excel column types to prevent auto-formatting mishaps
- **Secure Download Pipeline** — Server-side API route generation with proper `Content-Type` and `Content-Disposition` headers, client-side download via fetch + blob + `URL.createObjectURL`, and automatic filtering of sensitive fields like passwords and tokens
- **Progress and Limits** — Progress indicators for large exports using streaming responses, configurable row count caps (50K-100K), and background job delivery via email for datasets that exceed the limit

## Use Cases

- Building a GDPR-compliant user data export feature that lets users download all their personal data as CSV or Excel
- Generating monthly financial reports as formatted Excel workbooks with multiple sheets for revenue, expenses, and projections
- Creating bulk invoice downloads as PDFs for accounting teams that need to archive or forward receipts
- Exporting CRM contact lists with filtered columns and proper formatting for import into other tools

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
