# claude-code-structure

> A ready-to-use **Claude Code** project scaffold — rules, commands, skills, agents, and hooks.  
> Available as both an **npm package** and a **pip package**.

[![npm version](https://img.shields.io/npm/v/claude-code-structure.svg)](https://www.npmjs.com/package/claude-code-structure)
[![PyPI version](https://img.shields.io/pypi/v/claude-code-structure.svg)](https://pypi.org/project/claude-code-structure/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/KhaiTrang1995/claude-code-structure/actions/workflows/ci.yml/badge.svg)](https://github.com/KhaiTrang1995/claude-code-structure/actions/workflows/ci.yml)

---

## What is Claude Code?

[Claude Code](https://docs.anthropic.com/claude/docs/claude-code) is Anthropic's agentic coding tool. It reads a set of structured Markdown files from your project to understand context, enforce conventions, and automate workflows.

This package provides a **production-ready scaffold** that you can drop into any project in seconds.

---

## Quick Start

### npm / Node.js
```bash
npx claude-code-structure            # scaffold into current directory
npx claude-code-structure ./my-app   # scaffold into a specific directory
```

### pip / Python
```bash
pip install claude-code-structure
claude-init                          # scaffold into current directory
claude-init ./my-app                 # scaffold into a specific directory
```

---

## Generated Structure

```
your-project/
├── CLAUDE.md                        ← Loaded at every session start
├── CLAUDE.local.md                  ← Local overrides (gitignored)
├── .mcp.json                        ← MCP integrations (GitHub, Jira, Slack)
└── .claude/
    ├── settings.json                ← Permissions, model selection, hooks
    ├── settings.local.json          ← Local settings overrides
    ├── rules/
    │   ├── code-style.md            ← Naming, indentation, TS/Python conventions
    │   ├── testing.md               ← Coverage targets, tools, best practices
    │   └── api-conventions.md       ← REST design, status codes, error format
    ├── commands/
    │   ├── review.md                ← /project:review slash command
    │   └── fix-issue.md             ← /project:fix-issue slash command
    ├── skills/
    │   └── deploy/
    │       ├── SKILL.md             ← Auto-triggered deploy workflow
    │       └── deploy-config.md     ← Env vars, Docker, CI/CD config
    ├── agents/
    │   ├── code-reviewer.md         ← Isolated code review sub-agent
    │   └── security-auditor.md      ← OWASP security scan sub-agent
    └── hooks/
        └── validate-bash.sh         ← Pre-tool-use: blocks unsafe commands
```

---

## File Descriptions

| File | Purpose |
|---|---|
| `CLAUDE.md` | Project overview, tech stack, build commands — loaded at every session |
| `CLAUDE.local.md` | Personal overrides; **never commit this file** |
| `.mcp.json` | Shared MCP server configs (GitHub, Jira, Slack, DBs) |
| `.claude/settings.json` | Tool permissions, model selection, hook paths |
| `.claude/rules/*.md` | Modular rule files — can target specific file paths |
| `.claude/commands/*.md` | Custom `/project:<name>` slash commands |
| `.claude/skills/deploy/` | Context-lightweight skill, auto-loaded when deploying |
| `.claude/agents/*.md` | Specialized sub-agents with isolated context |
| `.claude/hooks/validate-bash.sh` | Event-driven script that blocks unsafe operations |

---

## Monorepo Structure

```
claude-code-structure/
├── packages/
│   ├── npm/                         ← npm package (Node.js ≥18)
│   └── python/                      ← pip package (Python ≥3.9)
├── template/                        ← shared scaffold (used by both packages)
├── docs/
├── .github/workflows/
│   ├── ci.yml                       ← test on push/PR
│   └── publish.yml                  ← publish on GitHub Release
├── README.md
├── CHANGELOG.md
└── LICENSE
```

---

## Programmatic Usage

### Node.js
```js
const { init } = require('claude-code-structure');
init('/path/to/my-project');
```

### Python
```python
from claude_code_structure import init
init('/path/to/my-project')
```

---

## Customization

After scaffolding, update the files to match your project:

1. **`CLAUDE.md`** — Set your tech stack, package manager, and build commands.
2. **`.claude/rules/`** — Adjust code style, testing standards, and API conventions.
3. **`.mcp.json`** — Add your actual GitHub token, Jira URL, etc. via environment variables.
4. **`.claude/settings.json`** — Configure which tools Claude is allowed to use.
5. **`CLAUDE.local.md`** — Add personal API keys and local path overrides (gitignored).

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/)
4. Push and open a Pull Request

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

---

## License

[MIT](LICENSE) © TechSphereX TA
