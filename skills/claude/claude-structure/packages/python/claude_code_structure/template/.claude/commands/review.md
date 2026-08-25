# /project:review – Code Review Command

## Usage
```
/project:review [file or diff]
```

## Description
Performs a structured code review covering:
1. **Correctness** – Logic errors, edge cases, off-by-one errors
2. **Security** – OWASP Top 10 issues, injection risks, exposed secrets
3. **Performance** – N+1 queries, unnecessary re-renders, large payloads
4. **Style** – Adherence to `.claude/rules/code-style.md`
5. **Tests** – Adequate coverage per `.claude/rules/testing.md`

## Output Format
Provide feedback grouped by severity:
- 🔴 **Critical** – Must fix before merge
- 🟡 **Warning** – Should fix
- 🟢 **Suggestion** – Nice to have

## Shell Step
```bash
git diff HEAD~1 HEAD
```
