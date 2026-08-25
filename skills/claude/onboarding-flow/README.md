# Onboarding Flow Skill

> Teach your AI agent to build multi-step onboarding wizards with progress persistence, activation checklists, and welcome sequences

## Install

```bash
npx skills add YepAPI/skills --skill onboarding-flow
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

This skill teaches your AI coding agent how to build onboarding experiences that get users to their "aha moment" — multi-step wizards with progress bars, database-persisted state so users can leave and resume, activation checklists that track key milestones, and timed welcome email sequences. Your agent knows to keep wizards under 5 steps, let users skip optional steps, and celebrate completion with a success animation before redirecting to the main product.

## Key Features

- **Multi-Step Wizard** — Steps defined as a configurable array with required/optional flags, progress bar showing completed, current, and upcoming steps, and `currentStep` tracking in state so users always know how far they have to go
- **Progress Persistence** — Completed and skipped steps saved to the database so users can close the browser and resume exactly where they left off, with a clean data model tracking `completedSteps`, `skippedSteps`, and `completedAt`
- **Activation Checklist** — Dashboard widget showing key actions like "Create first project", "Invite a teammate", and "Connect integration" with completion percentage, displayed until all items are done or the user dismisses it
- **Welcome Email Sequence** — Timed email delivery at signup, day 1, 3, and 7, with content that matches the specific checklist items each user has not completed yet, so emails stay relevant instead of generic
- **Smart Step Design** — Only asks for what is needed, splits personal info, workspace setup, and preferences into separate steps, offers skip for non-critical steps (marked as skipped, not completed), and shows a confetti celebration on the final step

## Use Cases

- Building a SaaS signup flow that collects profile info, creates a workspace, invites team members, and connects integrations across 3-5 clean steps
- Creating an account setup wizard for a new product where users configure preferences, set up billing, and take a guided tour
- Designing a team invitation sequence where an admin onboards their organization by adding members, assigning roles, and setting permissions
- Adding an interactive product tour that guides new users through core features with tooltips and an activation checklist on the dashboard

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
