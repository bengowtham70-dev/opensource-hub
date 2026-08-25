---
name: performance
description: "Core Web Vitals, lazy loading, code splitting, and bundle analysis."
homepage: https://yepapi.com/skills/performance
metadata:
  tags: [performance, web-vitals, optimization, bundle]
---

# Performance

## Rules

- Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1
- Lazy load below-fold images and heavy components: `React.lazy()`, `next/dynamic`
- Code split routes — each page loads only its own code
- Optimize images: WebP/AVIF format, proper sizing, `next/image` with `sizes`
- Bundle analysis: `@next/bundle-analyzer` — identify large dependencies
- Caching: HTTP cache headers, service worker for repeat visits, stale-while-revalidate
- Database: index frequently queried columns, use `EXPLAIN ANALYZE` to find slow queries
- Avoid layout shifts: set explicit dimensions on images, videos, embeds
