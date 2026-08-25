---
name: ui-ux-pro-max
description: Complete UI/UX design intelligence covering 79 styles, 192 color palettes, 74 typography pairings, 119 UX guidelines, glassmorphism, responsive layouts, accessibility WCAG 2.1 AA, micro-interactions, and 60 FPS motion graphics.
---

# UI/UX Pro Max — Design Intelligence

## 1. Core Rule Priority Hierarchy

| Priority | Category | Domain | Key Checks | Anti-Patterns (STRICTLY BANNED) |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Accessibility (WCAG AA)** | `ux` | 4.5:1 text contrast, visible focus rings, aria-labels on icon buttons | Removing focus rings, invisible links, icon-only buttons with no label |
| 2 | **Touch & Tactile Feedback** | `ux` | Min tap target 44×44px, `:active` scale down (0.97), optical ripple | 0ms instant state changes, reliance on desktop hover only |
| 3 | **Visual Depth & Glass** | `style` | Multi-elevation glass (`backdrop-blur-xl`, `border-white/10`), specular highlights | Flat gray boxes (`bg-gray-800`), washed-out borders |
| 4 | **Motion & Physics** | `motion` | Fluid spring curves `cubic-bezier(0.16, 1, 0.3, 1)`, staggered entrances | Linear transitions, animating layout `width`/`height` causing jank |
| 5 | **Typography Hierarchy** | `typography` | High-impact headlines (Outfit/Plus Jakarta), Inter body, JetBrains Mono stats | Text < 12px body, generic browser serif/sans, unstyled labels |
| 6 | **Empty & Loading States** | `ux` | Shimmering glass skeletons, custom recovery illustrations | Blank screens, raw spinning circles, unhandled errors |

## 2. Anti-AI-Slop & Craft Standards
- Every card must feel like physical glass resting on a dark cosmic canvas.
- Mouse-tracking radial light sweep highlights borders dynamically on hover.
- SVG sparklines dynamically animate their stroke on load with interactive tooltips.
