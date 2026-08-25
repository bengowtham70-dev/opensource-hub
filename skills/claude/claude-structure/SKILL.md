---
name: claude-structure
description: Claude Code project scaffolding with rules, commands, skills, agents, and hooks. Use when setting up a new project structure for Claude Code, applying structured CLAUDE.md conventions, or deploying projects via the bundled deploy skill.
---

# Claude Structure

Ready-to-use Claude Code project scaffold with rules, commands, skills, agents, and hooks.

## Workflow

1. Use the `template/` folder as the canonical project scaffold.
2. Apply `.claude/rules/` conventions (api-conventions, code-style, testing).
3. Reference `template/.claude/skills/deploy/SKILL.md` for the deploy workflow.

## Key Rules

- Follow the rules defined in the template's `.claude/rules/` directory.
- Keep CLAUDE.local.md for local, uncommitted overrides.
- Use the bundled deploy skill for staging/production deploys and CI/CD.

## Reference

- `template/` — the full project scaffold
- `template/.claude/skills/deploy/SKILL.md` — deploy workflow
- `docs/` — additional documentation