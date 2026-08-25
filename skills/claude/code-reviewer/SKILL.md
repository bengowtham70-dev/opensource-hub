---
name: code-reviewer
description: Review code for bugs, security issues, performance problems, and best practices. Use when you need to check code quality, find bugs, suggest improvements, or ensure code follows standards. USE FOR: code review, bug detection, security audit, performance optimization, refactoring suggestions.
---

# Code Reviewer

Review code systematically for issues and improvements.

## When to Use

- Before committing code
- After implementing a feature
- When debugging issues
- For security audits
- For performance optimization

## How to Use

### Step 1: Read Context
Before reviewing, understand:
- What the code is supposed to do
- The surrounding codebase patterns
- Any related tests

### Step 2: Systematic Review
Check code against these categories:

#### 1. Correctness
- Does it do what it's supposed to?
- Are edge cases handled?
- Are there off-by-one errors?
- Is error handling complete?

#### 2. Security
- Input validation present?
- SQL injection risks?
- XSS vulnerabilities?
- Secrets exposed?
- Authentication/authorization correct?

#### 3. Performance
- Unnecessary re-renders?
- N+1 query problems?
- Missing indexes?
- Large bundle impacts?
- Memory leaks?

#### 4. Maintainability
- Code is readable?
- Functions are focused?
- No code duplication?
- Proper naming?
- Comments where needed?

#### 5. Testing
- Edge cases covered?
- Error scenarios tested?
- Mocks appropriate?

### Step 3: Provide Feedback
Organize feedback by severity:

```
🔴 Critical: Must fix (bugs, security issues)
🟡 Warning: Should fix (performance, maintainability)  
🟢 Suggestion: Consider (style, improvements)
```

## Common Issues to Check

### TypeScript/JavaScript
```typescript
// ❌ Bad: Any type
function processData(data: any) { }

// ✅ Good: Proper typing
function processData(data: UserData) { }

// ❌ Bad: Missing error handling
const result = await fetch(url);

// ✅ Good: Proper error handling
try {
  const result = await fetch(url);
  if (!result.ok) throw new Error('Failed');
} catch (error) {
  console.error('Fetch failed:', error);
  throw error;
}
```

### React
```tsx
// ❌ Bad: Missing key
{items.map(item => <Item />)}

// ✅ Good: Proper key
{items.map(item => <Item key={item.id} />)}

// ❌ Bad: Inline function in render
<Button onClick={() => handleClick(id)} />

// ✅ Good: Memoized callback
const handleClick = useCallback(() => handleClick(id), [id]);
```

### SQL
```sql
-- ❌ Bad: SQL injection risk
query = `SELECT * FROM users WHERE id = ${userId}`;

-- ✅ Good: Parameterized query
query = 'SELECT * FROM users WHERE id = $1';
```

## Review Checklist

- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] Error handling complete
- [ ] Types are correct
- [ ] No unused imports/variables
- [ ] Functions are focused
- [ ] Tests cover edge cases
- [ ] Performance acceptable
- [ ] Accessibility considered
- [ ] Documentation updated

## Providing Feedback

Be constructive and specific:

```
// Instead of: "This is bad"
// Say: "Consider using a parameterized query here to prevent SQL injection"

// Instead of: "Fix this"
// Say: "This could throw if the API is down. Consider adding try/catch with a retry mechanism"
```
