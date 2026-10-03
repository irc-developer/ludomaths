---
name: code-review
description: "Review or audit LudoMaths changes inside the current coding session. Use when the user asks for a code review, cleanup, inspection, or risk-focused audit of architecture violations, TDD regressions, duplicated probability logic, repository boundaries, React Native anti-patterns, or missing i18n."
argument-hint: "Describe the review target, e.g. 'review the combat calculators' or 'audit recent form hooks'"
---

# Code Review — LudoMaths

Use this skill for a risk-focused review. The shared coding rules already live in the
workspace instructions; this skill defines the review sequence and the highest-value
checks for this repository.

If the user wants a dedicated read-only reviewer persona from the agent picker, use the
`LudoMaths Reviewer` agent instead.

## Review sequence

1. Run the smallest meaningful executable check first.
2. Inspect the owning layer before commenting on style.
3. Prioritize findings by behavioral risk: incorrect math, boundary leaks, broken dependency flow, then maintainability.

## Fast validation

```bash
npx tsc --noEmit
npx jest --no-coverage
```

If one of these is red, treat it as the first finding.

## What to look for

### Architecture

- `domain` importing outer layers is a critical violation.
- `application` should depend on repository interfaces, not concrete storage classes.
- Screens should not absorb business rules or direct domain math.

### Probability and combat logic

- Duplicated math helpers belong in `src/domain/math/`.
- Manual probability expectations in tests must match the implemented formula.
- WH40K critical-roll logic must preserve unmodified 6 behavior.

### React Native and hooks

- Heavy hook files often hide conversion or validation helpers that should be extracted.
- Module-level use case instances reduce testability.
- JSX with literal user-facing strings is a defect, not a style preference.

### Persistence and repositories

- AsyncStorage repositories should reuse the shared base abstractions when available.
- Repository contracts must remain substitutable in tests.

## Output format

- Findings first, ordered by severity.
- Each finding includes file, risk, and why it matters.
- Keep the summary short and only after the findings.
