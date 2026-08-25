# Testing Standards

## Test Structure
- Place tests alongside source files or in a `__tests__/` directory
- Test file naming: `*.test.ts` / `*_test.py`

## Coverage Requirements
- Minimum 80% code coverage for all modules
- 100% coverage required for utility functions

## Unit Tests
- Test one behavior per test case
- Use descriptive test names: `should return 400 when email is invalid`
- Mock external dependencies (DB, HTTP calls)

## Integration Tests
- Test full request/response cycles
- Use a dedicated test database; never run against production

## Tools
- JS/TS: Jest + Testing Library
- Python: pytest + pytest-cov

## Best Practices
- Arrange / Act / Assert pattern
- Avoid testing implementation details; test behavior
- Clean up side effects in `afterEach` / teardown
