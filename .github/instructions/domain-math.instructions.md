---
description: "Use when editing domain or application probability logic, mathematical distributions, combinatorics, combat calculations, or new use cases. Covers Clean Architecture boundaries, purity, formula comments, and TDD expectations."
name: "Domain And Math"
applyTo: ["src/domain/**/*.ts", "src/application/**/*.ts"]
---

# Domain And Math Guidelines

- Keep `src/domain/` framework-free and side-effect free.
- Place reusable mathematical primitives in `src/domain/math/`; game-specific rules belong in their module.
- `src/application/` orchestrates domain objects and repositories but must not absorb UI logic.
- Write identifiers, types, comments, and test names in English.
- Use standard mathematical names when they exist: `n`, `k`, `p`, `i`. Use descriptive names for derived values.
- Add a formula comment above every non-trivial equation.
- Prefer total functions with explicit input validation over hidden assumptions.

## TDD expectations

- Start with the failing test next to the source file.
- Cover boundary cases, known values, and invalid inputs.
- Refactor only after the focused test turns green.

## Placement shortcuts

- Generic math: `src/domain/math/`
- Game rules: `src/domain/<module>/`
- Use cases: `src/application/<module>/`

## Validation

- Run the narrowest Jest target for the touched file first.
- Run `npx tsc --noEmit` when the change affects exported types or multiple layers.