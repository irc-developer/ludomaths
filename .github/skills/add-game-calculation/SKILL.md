---
name: add-game-calculation
description: "Add a new probability calculation or distribution to LudoMaths. Use when: adding a new mathematical operation (binomial, hypergeometric, Poisson, etc.), adding a new game module (dice variant, card game, custom roll), or extending an existing domain with new use cases. Follows TDD + Clean Architecture layer rules."
argument-hint: "Describe the calculation to add, e.g. 'Poisson distribution for event frequency'"
---

# Add a New Game Calculation

## Architecture rule (non-negotiable)

```
domain/math/     ← pure math primitives, no game knowledge
domain/<module>/ ← game rules that COMPOSE math primitives
application/     ← use cases that orchestrate domain
presentation/    ← React Native UI that calls use cases
```

Dependencies flow **inward only**: presentation → application → domain.
`domain/math` must never import from `domain/dice`, `domain/cards`, or any outer layer.

## When to use this skill

- Adding a new mathematical primitive (factorial, PMF, CDF…)
- Adding a new game module (new dice variant, new card rule)
- Adding a new use case (new calculation screen)

## Step-by-step procedure

### 1. Identify the layer

Ask: "Does this function know about dice, cards, or any game?"
- **No** → it belongs in `src/domain/math/`
- **Yes** → it belongs in `src/domain/<module>/`

### 2. Write the failing test first (Red)

Create `<file>.test.ts` next to the source file **before** creating the source file.

```ts
// src/domain/math/combinatorics.test.ts
import { choose } from './combinatorics';

describe('choose', () => {
  it('returns 1 for choose(n, 0)', () => {
    expect(choose(5, 0)).toBe(1);
  });
});
```

Run `npx jest --testPathPattern=<file>` — it must **fail** (Red).

### 3. Write minimum code to pass (Green)

Create the source file with the minimum implementation.
Add a math comment for non-trivial formulas:

```ts
// C(n, k) = n! / (k! * (n - k)!)
export function choose(n: number, k: number): number {
  ...
}
```

Run Jest again — it must **pass** (Green).

### 4. Refactor

Remove duplication. Do not change public API. Tests must still pass.

### 5. Wire up (if new module)

- Add use case in `src/application/<module>/`
- Add translations keys to `src/infrastructure/i18n/locales/en.ts` and `es.ts`
- Add screen/component in `src/presentation/screens/`

## File naming conventions

| Type | Pattern | Example |
|---|---|---|
| Math primitive | `src/domain/math/<name>.ts` | `distributions.ts` |
| Module entity | `src/domain/<module>/<name>.ts` | `dice/dice.ts` |
| Use case | `src/application/<module>/Calculate<Name>UseCase.ts` | `CalculateDiceProbabilityUseCase.ts` |
| Test | `<source>.test.ts` (next to source) | `distributions.test.ts` |

## Math comment format

Non-trivial formulas must include the equation above the function:

```ts
// Binomial PMF: P(X = k) = C(n,k) * p^k * (1-p)^(n-k)
export function binomialPMF(n: number, k: number, p: number): number { ... }

// Hypergeometric PMF: P(X = k) = C(K,k) * C(N-K, n-k) / C(N, n)
export function hypergeometricPMF(N: number, K: number, n: number, k: number): number { ... }
```

## Test coverage requirements

- Every exported function needs at least: boundary values (0, 1, max), known results, and invalid input handling.
- Target ≥ 90% coverage per file.
- Run `npx jest --coverage --testPathPattern=<file>` to check.
