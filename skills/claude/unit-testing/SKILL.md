---
name: unit-testing
description: Unit and integration test automation for Python and JavaScript with debugging support. Use when generating tests, writing test suites, mocking dependencies, fixing failing tests, or debugging test failures.
---

# Unit Testing

Automate unit and integration test creation and maintenance across Python and JavaScript.

## Workflow

1. Read `agents/test-automator.md` for the expert test automation agent prompt.
2. Read `agents/debugger.md` for the debugging agent prompt.
3. For automatic test generation, follow `commands/test-generate.md`.

## Key Rules

- Generate pytest tests for Python, Jest tests for JavaScript/TypeScript.
- Maximize edge-case coverage with proper mocking and clear assertions.
- Keep test suites maintainable and framework-specific.
- Use `commands/test-generate.md` with `$ARGUMENTS` describing the target files or behavior.

## Reference

- `agents/test-automator.md` — full test-automation engineer capabilities
- `agents/debugger.md` — debugging and failure analysis agent
- `commands/test-generate.md` — automated unit test generation workflow