# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-24

### Added
- Initial release
- `CLAUDE.md` project overview template
- `.claude/rules/` — code-style, testing, api-conventions
- `.claude/commands/` — review and fix-issue slash commands
- `.claude/skills/deploy/` — deploy workflow skill
- `.claude/agents/` — code-reviewer and security-auditor sub-agents
- `.claude/hooks/validate-bash.sh` — pre-tool-use safety hook
- `.mcp.json` — MCP integration scaffold (GitHub, Jira, Slack)
- CLI: `npx claude-code-structure [target-dir]`
