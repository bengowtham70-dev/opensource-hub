# Architecture Guide

## Overview

`claude-code-structure` is a monorepo that publishes two packages:
- **npm** (`packages/npm/`) — for Node.js / JavaScript users
- **pip** (`packages/python/`) — for Python users

Both packages share the same `template/` scaffold and provide identical output.

## How It Works

```
┌─────────────────┐     ┌──────────────────┐
│  npx / pip CLI  │────▶│  Copy template/  │────▶  Your project/
│  or init() API  │     │  into target dir  │      ├── CLAUDE.md
└─────────────────┘     └──────────────────┘      ├── .claude/
                                                   └── .mcp.json
```

1. User runs CLI or calls `init()` programmatically
2. The bundled `template/` directory is recursively copied into the target directory
3. User customizes the generated files for their project

## Template Structure

The template is the core deliverable. It contains:

| Directory | Purpose |
|---|---|
| `CLAUDE.md` | Main context file loaded every session |
| `.claude/rules/` | Modular rules for code style, testing, API design |
| `.claude/commands/` | Custom slash commands (`/project:review`, `/project:fix-issue`) |
| `.claude/skills/` | Lightweight, auto-triggered skill workflows |
| `.claude/agents/` | Specialized sub-agents with isolated context |
| `.claude/hooks/` | Event-driven scripts for safety guardrails |
| `.mcp.json` | MCP server integrations (GitHub, Jira, Slack) |

## Build & Publish

### npm
```bash
cd packages/npm
npm publish --access public
```

### PyPI
```bash
cd packages/python
python -m build
twine upload dist/*
```

Both are automated via GitHub Actions (`.github/workflows/publish.yml`).
