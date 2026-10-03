---
description: "Use when writing or updating Jest and Testing Library tests in LudoMaths. Covers Red-Green-Refactor, probability test design, manual expectation comments, and focused validation."
name: "Testing"
applyTo: ["src/**/*.test.ts", "src/**/*.test.tsx", "__tests__/**/*.ts", "__tests__/**/*.tsx", "web/src/**/*.test.ts", "web/src/**/*.test.tsx"]
---

# Testing Guidelines

- New domain logic and use cases follow Red, Green, Refactor.
- Keep test files next to the source inside `src/`; use the root `__tests__/` folder only for app-level entry tests already established by the project.
- Probability tests should include manual expectations or a short derivation when the result is not obvious.
- Verify exact values where feasible; otherwise assert with a tolerance that reflects floating-point behavior.
- Cover boundary inputs, representative nominal cases, and invalid inputs.
- Prefer narrow test execution before broad suite runs.

## Focused commands

- `npx jest --testPathPattern=<file>` for the touched slice
- `npx jest --coverage --testPathPattern=<file>` when coverage is part of the task
- `npx tsc --noEmit` after changes that alter shared types or public contracts