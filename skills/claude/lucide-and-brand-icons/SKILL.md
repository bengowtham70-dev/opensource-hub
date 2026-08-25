---
name: lucide-and-brand-icons
description: Standard icon system using Lucide Icons for UI controls (search, terminal, shield, sparklines, downloads) and Simple Icons for verified brand logos (Docker, TypeScript, Rust, Linear, Figma, Notion).
---

# Lucide & Brand Icons Standard

## 1. UI Control Icons: Lucide Icons
Always use Lucide Icons for system controls, navigation, buttons, and state indicators:
- **CDN Integration:** `<script src="https://unpkg.com/lucide@latest"></script>`
- **Rendering:** `<i data-lucide="zap" class="w-4 h-4 text-emerald-400"></i>` followed by `lucide.createIcons()`.
- **Key Icons Mapped:**
  - Search: `search`
  - Download / Run: `download`, `play-circle`, `zap`
  - Trust / Security: `shield-check`, `shield-alert`, `lock`
  - Copy: `copy`, `check`
  - Trajectory: `trending-up`, `star`, `git-branch`, `activity`
  - Code / Terminal: `terminal`, `code`, `external-link`

## 2. Tech Stack & Brand Logos: Simple Icons
Always use Simple Icons for authentic brand SVGs:
- **CDN Base:** `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/[name].svg`
- **Standard Brand Slugs:**
  - `docker`, `typescript`, `rust`, `postgresql`, `sqlite`, `gnubash`, `python`, `go`
  - `github`, `linear`, `figma`, `notion`, `slack`, `jira`, `posthog`, `supabase`

## 3. Micro-Interaction Animations for Icons
- Hover spin / tilt: `transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110`
- Active pulse: `active:scale-90`
