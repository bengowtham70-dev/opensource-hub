---
name: mobile-first
description: "Mobile-first responsive design, touch targets, and PWA patterns."
homepage: https://yepapi.com/skills/mobile-first
metadata:
  tags: [mobile, responsive, pwa, touch]
---

# Mobile-First Design

## Rules

- Design for mobile first, enhance for desktop — `min-width` breakpoints
- Touch targets: minimum 44x44px for buttons and links
- Viewport units: `dvh` for full-screen layouts (accounts for mobile browser chrome)
- Safe areas: `env(safe-area-inset-*)` for notch/island devices
- PWA basics: `manifest.json`, service worker, `<meta name="theme-color">`
- Performance budgets: < 200KB JS on first load for mobile
- Input types: `type="email"`, `type="tel"`, `type="number"` — trigger correct keyboard
- No hover-only interactions — everything must work with tap
- Test on real devices — emulators miss performance issues and touch quirks
