# OpenSource Hub — Engineering, Memory & Design Mandate (AGENTS.md)

This document establishes the **binding engineering protocols, persistent memory management, anti-vibe-coding quality bars, and visual animation mandates** for all AI agents, engineers, and contributors working on **OpenSource Hub**.

**Design source of truth:** [`Sentinel---Better-Business-Decisions-DESIGN.md`](file:///c:/Users/vasan/Music/opensourse/Sentinel---Better-Business-Decisions-DESIGN.md) — light-first palette with a derived dark mode. The former "Tactile Dark Luxe" spec is retired; never reintroduce its tokens.

---

## 0. Mandatory Pre-Execution Protocol: "Research → Plan → Verify → Execute"

Before writing code, modifying files, or taking action on any user request, every agent **MUST strictly follow this 4-step sequence**:

1. **Deep Multi-Source Research:**
   - **Real-Time Internet Verification:** Search the web to verify latest package APIs, breaking changes, security advisories, and competitor UX benchmarks (primary competitor: openalternative.co). Never guess or rely on outdated training memory.
   - **Codebase & Schema Inspection:** Inspect existing code, configurations, and schemas before assuming file locations or patterns.
   - **PRD Cross-Referencing:** Always align strictly with [`PRD_final.md`](file:///c:/Users/vasan/Music/opensourse/PRD_final.md).

2. **Structured & Atomic Planning:**
   - Write an actionable, phased plan covering dependencies, component architecture, and exact files to modify.

3. **Pre-Execution Verification:**
   - Verify plans against performance budgets (60 FPS fluidity), Windows/macOS/Linux cross-compatibility, and error boundaries.

4. **Skill-Guided Execution:**
   - Execute using domain-specific skills, testing each milestone with unit tests or browser inspection.

---

## 1. Persistent Agent Memory & Context Retention Engine

To eliminate context loss, hallucinations, and repeated mistakes across long-running sessions:

1. **Persistent Memory Logging:**
   - All major architectural decisions, schema changes, and discovered bug fixes must be recorded in the persistent memory system (`.agents/memory/` and Knowledge Items).
2. **Context Restoration Before Work:**
   - At the beginning of every task, the agent must check active memory files and recent transcript history to restore full architectural state.
3. **Self-Correcting Mistake Journal:**
   - When a bug or build failure occurs and is resolved, record the root cause and solution in memory so future prompts avoid the same pitfall.

---

## 2. Compulsory Skill Integration & Dynamic GitHub Skill Fetching

Agents must operate with **expert domain precision** by utilizing specialized agent skills:

1. **Skills-First Mandate:**
   - For every task (e.g., UI/UX design, Node.js CLI servers, Playwright testing, security auditing, SEO optimization), the agent **MUST proactively identify and invoke relevant agent skills**.
2. **Missing Skill Acquisition from GitHub:**
   - If a required skill or specialized knowledge pattern is missing from the local environment, the agent **MUST search for, fetch, and download the necessary skill definition directly from GitHub or verified open repositories** into the project's skills directory before proceeding.
3. **Zero Guesswork / No Boilerplate Amateurs:**
   - Never write critical logic based on guesses. Always load domain skill patterns (e.g., `tailwind-patterns`, `react-patterns`, `powershell-windows`, `security-auditor`).

---

## 3. Strict "Anti-Vibe-Coding / Zero-AI-Slop" Quality Mandate

This application MUST NEVER look or feel like a generic AI-generated "vibe-code" template. Every screen, component, and interaction must evoke an immediate **"wow" factor** on par with **Linear, Raycast, Apple HIG, and Vercel**:

1. **Strictly Forbidden "Vibe-Code" Tropes:**
   - NO generic washed-out gray cards or flat un-styled HTML inputs, checkboxes, or plain select dropdowns.
   - NO static, lifeless layouts with zero micro-interactions or missing hover states.
   - NO unhandled empty/loading states — all loading must use shimmering skeletons; all empty states must have custom illustration and actionable recovery buttons.
   - NO generic lorem ipsum or fake placeholder data.

2. **Required High-Craft Engineering Standards (Sentinel tokens — mandatory):**
   - **Elevated Light Surfaces:** Page bg `#9CA3AF`; cards pure `#FFFFFF` with `0.8px #F3F4F6` hairline borders, radius 16px, padding 20px, soft shadow `rgba(0,0,0,0.1) 0 15px 35px -5px`. Gradient-dot border shell (radial dots, 32px outer radius) as the hero edge treatment.
   - **Semantic States:** Trust green `#059669` light / `#34D399` dark · Caution amber `#D97706` light / `#FBBF24` dark · Emphasis accent `#FF5722` · Primary buttons `#121212` bg, white text, radius 4px, 10px padding.
   - **Dark Mode Parity:** Charcoal-neutral dark ramp (`#14161A` base, `#1C1F26` surface, `#242830` elevated, text `#E5E7EB`/`#9CA3AF`) toggled via `html.dark` variable swap with localStorage + `prefers-color-scheme`.
   - **Tailored High-End Typography:** Newsreader (72px / weight 400 / -0.025em) for display headlines; Inter (14px / weight 500) for body copy. NO third font — JetBrains Mono and all mono usage are retired; metrics use Inter tabular numerals.

---

## 4. Motion Graphics, Animations & Animated Mascot IP

Motion stays **restrained and interface-led** per the Sentinel spec: minimal intensity, 150ms timing cluster, easing `ease` / `cubic-bezier(0.4, 0, 0.2, 1)`, hover behavior limited to text and color changes.

### 4.1 Motion Tokens
- **Interface Transition:** `transition: all 150ms ease` (or `cubic-bezier(0.4, 0, 0.2, 1)`).
- **Hover Behavior:** Text/color shifts only — no transform lifts, no glow shadows, no mouse-tracking light sweeps, no staggered spring reveals.
- **Permitted Signature Feedback (retimed to ≤150–200ms):** sparkline stroke draw, trust-ring fill, copy-button checkmark confirmation, subtle mascot idle float.

### 4.2 Micro-Interactions
- **Animated SVG Sparklines:** 30-day star trajectory draws once on load; include 30-day delta badge next to star counts.
- **Circular Trust Score Meter:** Radial SVG ring fills smoothly to the target score.
- **Copy-Command Pill:** Instant confirmation badge with animated checkmark on click.
- **Theme Toggle:** Animated sun/moon swap in the header; preference persists.

### 4.3 Animated Mascot IP ("Byte the Guardian")
Following the ip-as-logo design doctrine:
- **Character Design:** A compact, lovable neo-skeuomorphic mascot ("Byte") crafted with thick rounded geometric curves and soft ambient lighting, recolored to the Sentinel light/dark palettes.
- **Mascot Micro-Animations:**
  - **Idle Breathing:** Gentle, slow floating animation in the hero and dashboard header.
  - **State Reactions:**
    - *Star Surge State:* Celebrates when viewing fast-rising repos.
    - *Deep Scan State:* Scanner pose during GitHub sync.
    - *Shield Guardian State:* Protective shield alongside the Trust Score drawer (shield uses semantic trust green).

---

## 5. Component Design Standards

### 5.1 Hero Section
- **Clean Light Backdrop:** Soft top-down gradient (`from-white to-transparent`) over the `#9CA3AF` field — no mesh glows.
- **Command Install Box:** White elevated card with the install command in Inter tabular numerals, pulsing cursor, and one-click copy with checkmark feedback.
- **Interactive Search Bar:** Command-palette search (`Cmd+K` / `Ctrl+K`), quick-filter tags, instant debounced results.

### 5.2 Alternative Comparison Cards
- **Side-by-Side Brand Badge:** Paid tool icon (strikethrough price tag) transitioning into the open-source alternative logo.
- **Savings Banner:** Accent pill showing estimated yearly savings (e.g., "Save $240/yr") in `#FF5722`.
- **Feature-Parity Checklist Bar:** Coverage gauge (e.g., `92% Parity`) expanding into an interactive comparison drawer.
- **Action Buttons:** Primary "Run App" (`#121212` bg, white text, radius 4px) and secondary "Source" link-style button.

### 5.3 Trust & Health Radar
- **Trust Badge:** Multi-signal radar pill (Commit Recency, Security Audit, Contributor Velocity, License Safety) using semantic trust green.
- **Red-Flag Caution Banner:** Soft amber warning banner with expandable details for suspicious star spikes or abandoned repos.

### 5.4 Tech Stack & Architecture Tags
- **Authentic Brand Badges:** Crisp micro-icons for Docker, Rust, TypeScript, Electron, SQLite, CRDT, etc., styled as subtle neutral pills (`#FFFFFF` bg, hairline border) with gentle hover highlights.

---

## 6. Cross-Platform & OS Safety Standards

- **Cross-Platform Path Hygiene:** Never hardcode forward or backward slashes; always use standard path normalization (`path.join`, `path.resolve`).
- **Windows PowerShell Safety:** Handle Windows path escaping, process execution without hanging shell sessions, and verify binary execution on Windows (`.exe`/`.msi`), macOS (`.dmg`), and Linux (`.AppImage`/`.deb`).
- **Zero-Crash Port Handling:** Automatically handle local port conflicts (`localhost:3000` -> `3001`) with user-friendly console messaging.

---

## 7. Uncompromising Rules for Agents

1. **NO Cheap Browser Defaults:** Never use generic HTML checkboxes, plain gray borders, default form inputs, or unstyled tables. Everything must use custom tokens.
2. **NO Static Walls of Text:** Break down information with clear visual hierarchy, iconography, pill badges, interactive counters, and cards.
3. **Always Mobile-Responsive & Ultra-Fast:** The dashboard and web surface must render with 60 FPS fluidity on both 4K monitors and mobile phones.
4. **Maintainer & Developer Delight:** Make everything copy-able in one click, support full keyboard shortcuts, and preserve clean light/dark contrast via the theme toggle.
5. **Always Research, Plan, Verify, and Use Skills First:** Never write code blindly. Follow the mandatory 4-step sequence on every single prompt.
6. **Never Regress Tokens:** All colors, radii, spacing, shadows, fonts, and motion timings MUST come from the Sentinel design tokens. Introducing indigo `#6366F1`, cosmic-dark bases, glassmorphism blur, spring easings, or any mono font is a regression.