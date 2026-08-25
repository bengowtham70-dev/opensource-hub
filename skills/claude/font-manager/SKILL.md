---
name: font-manager
description: Typography and font management for presentations, documents, and web. Use when selecting fonts, pairing typefaces, setting up typography systems, or optimizing text readability.
---

# Font Manager

## Overview

Typography guidance for creating readable, professional designs across presentations, documents, and web interfaces.

## When to Use

- Selecting fonts for presentations
- Pairing typefaces
- Setting up typography hierarchies
- Optimizing text readability
- Creating consistent design systems

## Typography Principles

### Vertical Rhythm
Line-height is the base unit for ALL vertical spacing. If body text has `line-height: 1.5` on 16px type (= 24px), spacing values should be multiples of 24px.

### Modular Scale & Hierarchy
Use fewer sizes with more contrast. A 5-size system covers most needs:

| Role | Typical Ratio | Use Case |
|------|---------------|----------|
| xs | 0.75rem | Captions, legal |
| sm | 0.875rem | Secondary UI, metadata |
| base | 1rem | Body text |
| lg | 1.25-1.5rem | Subheadings, lead text |
| xl+ | 2-4rem | Headlines, hero text |

Popular ratios: 1.25 (major third), 1.333 (perfect fourth), 1.5 (perfect fifth).

### Readability & Measure
- Use `ch` units for character-based measure (`max-width: 65ch`)
- Line-height scales inversely with line length
- Increase line-height for light text on dark backgrounds (+0.05-0.1)

## Font Selection

### Avoid Generic Defaults
These are overused: Inter, Roboto, Open Sans, Lato, Montserrat

### Better Alternatives

| Instead of | Use |
|------------|-----|
| Inter | Instrument Sans, Plus Jakarta Sans, Outfit |
| Roboto | Onest, Figtree, Urbanist |
| Open Sans | Source Sans 3, Nunito Sans, DM Sans |
| Editorial feel | Fraunces, Newsreader, Lora |

### System Fonts
`-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui` - native look, instant load, highly readable.

## Font Pairing

### Principles
1. One well-chosen font family in multiple weights often beats two fonts
2. Only add a second font for genuine contrast
3. Contrast on multiple axes: Serif + Sans, Geometric + Humanist, Condensed + Wide
4. **Never pair similar fonts** (e.g., two geometric sans-serifs)

### Presentation Font Pairing Examples

| Headings | Body | Style |
|----------|------|-------|
| Arial Bold | Arial | Clean, professional |
| Georgia | Verdana | Classic, readable |
| Trebuchet MS |Tahoma | Modern, friendly |
| Helvetica | Times New Roman | Traditional, formal |

## Web-Safe Fonts for Presentations

| Font | Type | Best For |
|------|------|----------|
| Arial | Sans-serif | Universal, clean |
| Helvetica | Sans-serif | Professional, modern |
| Times New Roman | Serif | Formal, traditional |
| Georgia | Serif | Elegant, readable |
| Courier New | Monospace | Code, technical |
| Verdana | Sans-serif | Screen, small text |
| Tahoma | Sans-serif | Compact layouts |
| Trebuchet MS | Sans-serif | Creative, friendly |
| Impact | Sans-serif | Bold headlines |

## OpenType Features

```css
/* Tabular numbers for data alignment */
.data-table { font-variant-numeric: tabular-nums; }

/* Proper fractions */
.recipe-amount { font-variant-numeric: diagonal-fractions; }

/* Small caps for abbreviations */
abbr { font-variant-caps: all-small-caps; }

/* Disable ligatures in code */
code { font-variant-ligatures: none; }
```

## Accessibility

- Never disable zoom
- Use rem/em for font sizes (not px for body text)
- Minimum 16px body text
- Ensure adequate contrast ratios (4.5:1 minimum)
- Create 44px+ touch targets for text links

## Presentation Typography Guidelines

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Slide Title | 36-44pt | Bold | Primary color |
| Section Header | 28-32pt | Bold | Dark/Primary |
| Body Text | 18-24pt | Regular | Dark gray |
| Bullet Points | 18-22pt | Regular | Dark gray |
| Captions | 12-14pt | Regular | Medium gray |
| Data/Stats | 48-72pt | Bold | Accent color |
