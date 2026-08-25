---
name: mattpocock-engineering-suite
description: Professional software engineering discipline suite from Matt Pocock (Total TypeScript). Enforces strict Test-Driven Development (TDD Red-Green-Refactor), Seam-based interface testing, relentless design grilling, and anti-vibe-coding architecture standards.
---

# Matt Pocock Engineering & TDD Suite

## 1. Test-Driven Development (The Red -> Green -> Refactor Loop)
- **Seams Before Tests:** A seam is the public boundary you test at (where you observe behavior without reaching into internals). Agree on seams before writing any test.
- **Never Test Implementation Details:** Tests verify behavior through public interfaces. Code can change completely; tests shouldn't break unless the public contract changes.
- **Strict Cycle:**
  1. **RED:** Write a failing test for the next smallest piece of behavior.
  2. **GREEN:** Write the minimal code to make the test pass.
  3. **REFACTOR:** Clean up code, remove duplication, improve types without breaking tests.

## 2. Architecture & Domain Modeling
- Model domains with explicit discriminated unions, Zod schemas, and immutable data flow.
- Maintain a single source of truth for all types and state.
- Separate core business logic from I/O and side effects.

## 3. Relentless Design Grilling
- When evaluating architectural decisions, stress-test requirements using Socratic questions formatted as a decision tree.
- Identify the "frontier" of unresolved prerequisites before choosing frameworks or schemas.
