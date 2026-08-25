---
name: programmatic-seo-engine
description: Architecture and implementation patterns for programmatic SEO comparison directories, dynamic OpenGraph image rendering (/api/og), and Schema.org SoftwareApplication structured data.
---

# Programmatic SEO & OpenGraph Generation Engine

## 1. Dynamic URL & Routing Hierarchy
- **Alternative Target Pages:** `/alternatives/[paid-tool]` (e.g. `/alternatives/notion`, `/alternatives/figma`).
  - Title Tag: `Top [N] Open Source Alternatives to [Paid Tool] in 2026 (Free & Self-Hosted)`
  - Meta Description: `Discover the best free, open-source alternatives to [Paid Tool]. Compare features, calculate annual savings, view Trust Scores, and 1-click download.`
- **Individual Tool Pages:** `/[tool-slug]` (e.g. `/affine`, `/penpot`, `/bruno`).
  - Title Tag: `[Tool Name] — Open Source Alternative to [Paid Tool]`
- **Tech Stack Taxonomy:** `/stacks/[tech-slug]` (e.g. `/stacks/docker`, `/stacks/rust`, `/stacks/sqlite`).
- **License Taxonomy:** `/licenses/[license-slug]` (e.g. `/licenses/mit`, `/licenses/agpl-3.0`).

## 2. Schema.org Structured Data (JSON-LD)
Every tool page must output valid `SoftwareApplication` JSON-LD:
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AFFiNE",
  "operatingSystem": "Windows, macOS, Linux, Web",
  "applicationCategory": "ProductivityApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "1420"
  }
}
```

## 3. Dynamic OpenGraph (`/api/og`) Card Generation
- Edge function using `@vercel/og` or SVG canvas rendering.
- Layout: 1200x630px card in Obsidian Dark (`#07090E`).
- Elements: Paid tool icon on left, transition arrow with savings badge in center, open-source alternative logo on right, live GitHub star badge, and Trust Score badge.
