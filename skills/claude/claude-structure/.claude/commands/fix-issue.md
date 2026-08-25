# /project:fix-issue – Fix Issue Command

## Usage
```
/project:fix-issue <issue-id or description>
```

## Description
Automated workflow to diagnose and fix a reported issue:

1. **Reproduce** – Understand the bug from the issue description or test case
2. **Locate** – Find the relevant file(s) and line(s) causing the problem
3. **Fix** – Apply the minimal change needed; do not refactor unrelated code
4. **Verify** – Run existing tests; add a regression test if none covers the bug
5. **Summarize** – Provide a concise explanation of root cause and fix

## Shell Steps
```bash
# Run tests after fix
npm test

# Check for lint errors
npm run lint
```

## Notes
- Follow coding conventions in `.claude/rules/code-style.md`
- New tests must follow `.claude/rules/testing.md`
