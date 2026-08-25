---
name: tdd-workflows
description: Test-driven development methodology with red-green-refactor cycles and code review. Use when following TDD, writing failing tests first, implementing to pass tests, refactoring safely, or enforcing TDD discipline.
---

# TDD Workflows

Test-driven development methodology with disciplined red-green-refactor cycles.

## Workflow

1. Read `agents/tdd-orchestrator.md` for the TDD orchestrator agent prompt.
2. Read `agents/code-reviewer.md` for the code review agent prompt.
3. Use the TDD cycle commands in order:
   - `commands/tdd-red.md` — write a failing test first
   - `commands/tdd-green.md` — implement minimal code to pass
   - `commands/tdd-refactor.md` — refactor with tests green
   - `commands/tdd-cycle.md` — run the full cycle

## Key Rules

- Red: write one failing test.
- Green: write the minimal implementation to make it pass.
- Refactor: clean up while keeping tests green.
- Never skip steps. Enforce test-first discipline.

## Reference

- `agents/tdd-orchestrator.md` — full TDD orchestration capabilities
- `agents/code-reviewer.md` — code review agent
- `commands/` — red, green, refactor, and cycle commands