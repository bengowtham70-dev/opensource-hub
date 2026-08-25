# Forms Skill

> Build forms that validate properly and do not make users want to leave.

## Install

```bash
npx skills add YepAPI/skills --skill forms
```

Works with Claude Code, Cursor, Gemini CLI, Copilot, and [45+ more agents](https://github.com/vercel-labs/skills).

## What This Skill Does

Teaches your AI agent to build production-quality forms using React Hook Form for performant state management, Zod schemas for validation shared between client and server, inline error display with proper accessibility attributes, multi-step wizard flows with per-step validation, and UX patterns like autosave, drag-and-drop file uploads, and double-submit prevention.

## Key Features

- **React Hook Form Integration** — uses `useForm()` with `register()` or `Controller` for performant form state that does not re-render the entire form on every keystroke
- **Zod Schema Validation** — defines validation rules as Zod schemas that are shared between client and server, so you write validation logic once and get type-safe parsing everywhere
- **Accessible Error Display** — shows inline errors under each field in red text, linked via `aria-describedby`, with focus management that moves the cursor to the first invalid field on submission
- **Multi-Step Wizard Flows** — breaks long forms into steps with independent validation per step, progress indicators, and state preservation so users do not lose work navigating between steps
- **Autosave & Submit Protection** — debounces saves to server or localStorage for long forms, disables the submit button during loading, and shows a spinner to prevent double submissions

## Use Cases

- Building a signup form with email validation, password strength requirements, and inline error messages
- Creating a multi-step checkout flow that validates shipping info, payment details, and order review independently
- Adding a settings page with autosave that persists changes as the user types without a save button
- Implementing a survey builder where users create dynamic forms with drag-and-drop question ordering

## How It Works

Once installed, your AI coding agent automatically follows these patterns when relevant tasks come up. No configuration needed — just describe what you want to build and the agent applies the right patterns and best practices.

## All Skills

Want all 110 skills? `npx skills add YepAPI/skills --all`

Browse the full collection at [yepapi.com/skills](https://yepapi.com/skills).

---

Part of [YepAPI Skills](https://github.com/YepAPI/skills) — 110 free agent skills for vibe coders.
