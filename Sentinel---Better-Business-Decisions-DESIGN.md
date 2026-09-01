---
version: "alpha"
name: "Sentinel - Better Business Decisions"
description: "Sentinel Better Login Section is designed for authenticating users through a focused access flow. Key features include reusable structure, responsive behavior, and production-ready presentation. It is suitable for authentication screens in web products."
colors:
  primary: "#121212"
  secondary: "#FF5722"
  tertiary: "#3F3F46"
  neutral: "#FFFFFF"
  background: "#F6F5F3"
  surface: "#FFFFFF"
  text-primary: "#18181B"
  text-secondary: "#52525B"
  border: "#E6E4E1"
  accent: "#FF5722"
  link: "#C2410C"
typography:
  display-lg:
    fontFamily: "Newsreader"
    fontSize: "72px"
    fontWeight: 400
    lineHeight: "72px"
    letterSpacing: "-0.025em"
  body-md:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "20px"
rounded:
  md: "4px"
spacing:
  base: "4px"
  sm: "4px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  gap: "6px"
  card-padding: "20px"
  section-padding: "32px"
components:
  button-primary:
    backgroundColor: "#121212"
    textColor: "{colors.neutral}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "10px"
  button-link:
    textColor: "{colors.tertiary}"
    typography: "{typography.body-md}"
    rounded: "0px"
    padding: "0px"
  card:
    backgroundColor: "{colors.neutral}"
    rounded: "16px"
    padding: "20px"
---

## Overview

- **Composition cues:**
  - Layout: Grid
  - Content Width: Full Bleed
  - Framing: Open
  - Grid: Strong

## Colors

The color system ("Paper & Ember") pairs a warm neutral canvas with ink actions and a single ember accent; #FFFFFF remains the surface foundation.

- **Primary (#121212):** Ink — carries primary buttons, active washes, and quiet-chrome selected states.
- **Link (#C2410C light / #FF8A5C dark):** Ember-link reserved for text links and hover affordance so ink never loses its interactive signal.
- **Secondary (#FF5722):** The brand accent (savings pills, Byte's antenna, selection tint) — used sparingly.
- **Tertiary (#3F3F46):** Tech/neutral contrast moments.
- **Neutral (#FFFFFF):** Surface foundation on the #F6F5F3 warm-neutral canvas.

- **Usage:** Background: #F6F5F3; Surface: #FFFFFF; Text Primary: #18181B; Text Secondary: #52525B; Border: #E6E4E1; Accent: #FF5722

- **Gradients:** bg-gradient-to-t from-white to-transparent

## Typography

Typography pairs Newsreader for display hierarchy with Inter for supporting content and interface copy.

- **Display (`display-lg`):** Newsreader, 72px, weight 400, line-height 72px, letter-spacing -0.025em.
- **Body (`body-md`):** Inter, 14px, weight 500, line-height 20px.

## Layout

Layout follows a grid composition with reusable spacing tokens. Preserve the grid, full bleed structural frame before changing ornament or component styling. Use 4px as the base rhythm and let larger gaps step up from that cadence instead of introducing unrelated spacing values.

Treat the page as a grid / full bleed composition, and keep that framing stable when adding or remixing sections.

- **Layout type:** Grid
- **Content width:** Full Bleed
- **Base unit:** 4px
- **Scale:** 4px, 8px, 10px, 12px, 14px, 16px, 20px, 24px
- **Section padding:** 32px
- **Card padding:** 20px
- **Gaps:** 6px, 8px, 12px, 16px

## Elevation & Depth

Depth is communicated through elevated, border contrast, and reusable shadow or blur treatments. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.

Surfaces should read as elevated first, with borders, shadows, and blur only reinforcing that material choice.

- **Surface style:** Elevated
- **Borders:** 0.8px #E6E4E1; 0.8px #D4D2CF
- **Shadows:** rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 15px 35px -5px; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 20px 60px -15px

### Techniques
- **Gradient border shell:** Use a thin gradient border shell around the main card. Wrap the surface in an outer shell with 0px padding and a 32px radius. Drive the shell with radial-gradient(circle at 1px 1px, rgb(229, 231, 235) 1px, rgba(0, 0, 0, 0) 0px) so the edge reads like premium depth instead of a flat stroke. Keep the actual stroke understated so the gradient shell remains the hero edge treatment. Inset the real content surface inside the wrapper with a slightly smaller radius so the gradient only appears as a hairline frame.

## Shapes

Shapes rely on a tight radius system anchored by 2px and scaled across cards, buttons, and supporting surfaces. Icon geometry should stay compatible with that soft-to-controlled silhouette.

Use the radius family intentionally: larger surfaces can open up, but controls and badges should stay within the same rounded DNA instead of inventing sharper or pill-only exceptions.

- **Corner radii:** 2px, 4px, 8px, 16px, 32px, 9999px
- **Icon treatment:** Linear
- **Icon sets:** Solar

## Components

Anchor interactions to the detected button styles. Reuse the existing card surface recipe for content blocks.

### Buttons
- **Primary:** background #121212, text #FFFFFF, radius 4px, padding 10px, border 0px solid rgb(229, 231, 235).
- **Links:** text #4B5563, radius 0px, padding 0px, border 0px solid rgb(229, 231, 235).

### Cards and Surfaces
- **Card surface:** background #FFFFFF, border 0.8px solid rgb(243, 244, 246), radius 16px, padding 20px, shadow rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 15px 35px -5px.

### Iconography
- **Treatment:** Linear.
- **Sets:** Solar.

## Do's and Don'ts

Use these constraints to keep future generations aligned with the current system instead of drifting into adjacent styles.

### Do
- Do use the primary palette as the main accent for emphasis and action states.
- Do keep spacing aligned to the detected 4px rhythm.
- Do reuse the Elevated surface treatment consistently across cards and controls.
- Do keep corner radii within the detected 2px, 4px, 8px, 16px, 32px, 9999px family.

### Don't
- Don't introduce extra accent colors outside the core palette roles unless the page needs a new semantic state.
- Don't mix unrelated shadow or blur recipes that break the current depth system.
- Don't exceed the detected minimal motion intensity without a deliberate reason.

## Motion

Motion stays restrained and interface-led across text, layout, and scroll transitions. Timing clusters around 150ms. Easing favors ease and cubic-bezier(0.4. Hover behavior focuses on text and color changes.

**Motion Level:** minimal

**Durations:** 150ms

**Easings:** ease, cubic-bezier(0.4, 0, 0.2, 1)

**Hover Patterns:** text, color

## WebGL

Reconstruct the graphics as a inset canvas accent using webgl, custom shaders. The effect should read as technical, meditative, and atmospheric: noise haze with charcoal and sparse spacing. Build it from shader field so the effect reads clearly. Animate it as slow breathing pulse. Interaction can react to the pointer, but only as a subtle drift. Preserve dom fallback.

**Id:** webgl

**Label:** WebGL

**Stack:** WebGL

**Insights:**
  - **Scene:**
    - **Value:** Inset canvas accent
  - **Effect:**
    - **Value:** Noise haze
  - **Primitives:**
    - **Value:** Shader field
  - **Motion:**
    - **Value:** Slow breathing pulse
  - **Interaction:**
    - **Value:** Pointer-reactive drift
  - **Render:**
    - **Value:** WebGL, custom shaders

**Techniques:** Breathing pulse, Pointer parallax, Shader gradients, Noise fields, DOM fallback

**Code Evidence:**
  - **HTML reference:**
    - **Language:** html
    - **Snippet:**
      ```html
      <div class="relative w-[210px] h-[210px] sm:w-[280px] sm:h-[280px] rounded-full bg-[#18181b] overflow-hidden shadow-[inset_0_10px_20px_rgba(0,0,0,0.5)] z-10 ring-4 ring-gray-100">
          <!-- WebGL Canvas for Radar Animation -->
          <canvas id="radar-webgl" class="absolute inset-0 w-full h-full"></canvas>

          <!-- Physical Crosshairs overlay -->
      ```
  - **JS reference:**
    - **Language:** js
    - **Snippet:**
      ```
      const canvas = document.getElementById('radar-webgl');
      const gl = canvas.getContext('webgl');

      if (gl) {
          // Resize canvas to match display size
          const resize = () => {
              const displayWidth  = canvas.clientWidth;
      ```
  - **Renderer setup:**
    - **Language:** js
    - **Snippet:**
      ```
      const canvas = document.getElementById('radar-webgl');
      const gl = canvas.getContext('webgl');

      if (gl) {
          // Resize canvas to match display size
          const resize = () => {
      ```
