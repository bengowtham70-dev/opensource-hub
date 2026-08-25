---
name: onboarding-flow
description: "Multi-step wizards, progress indicators, activation checklists, and welcome sequences."
homepage: https://yepapi.com/skills/onboarding-flow
metadata:
  tags: [onboarding, wizard, steps, activation]
---

# Onboarding Flow

## Rules

- Multi-step wizard: define steps as an array — track `currentStep` in state, show progress bar with step count
- Progress indicator: step numbers or progress bar at top — show completed, current, and upcoming steps — never hide how many steps remain
- Persist progress: save completed steps to database — user can leave and resume where they left off
- Activation checklist: define key actions (e.g., "Create first project", "Invite a teammate", "Connect integration") — show completion percentage on dashboard
- Welcome email sequence: send immediately after signup, then at day 1, 3, 7 — content matches checklist items they haven't completed
- Skip option: let users skip non-critical steps — mark as skipped, not completed — offer to complete later
- Data collection: only ask for what's needed — split personal info, workspace setup, and preferences into separate steps
- Completion celebration: confetti or success animation on final step — redirect to the main product view

## Wizard Pattern

```typescript
const ONBOARDING_STEPS = [
  { id: "profile", title: "Your Profile", required: true },
  { id: "workspace", title: "Create Workspace", required: true },
  { id: "invite", title: "Invite Team", required: false },
  { id: "integrations", title: "Connect Tools", required: false },
] as const;

// Track in database
interface OnboardingState {
  userId: string;
  currentStep: number;
  completedSteps: string[];
  skippedSteps: string[];
  completedAt: Date | null;
}
```

## Activation Checklist Pattern

Display on dashboard until all items complete or user dismisses:

```typescript
const ACTIVATION_ITEMS = [
  { key: "first_project", label: "Create your first project", check: (user) => user.projectCount > 0 },
  { key: "invite_member", label: "Invite a teammate", check: (user) => user.teamSize > 1 },
  { key: "first_deploy", label: "Deploy to production", check: (user) => user.deployCount > 0 },
];
```

## Avoid

- Asking too much upfront — 3-5 steps max in the wizard, defer the rest
- No progress persistence — users abandon if they lose progress on page refresh
- Forcing all steps — let users skip optional steps
- No activation tracking — you need to measure onboarding completion rate
