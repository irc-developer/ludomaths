---
name: "Plan Probability Distribution"
description: "Plan a new probability distribution, mathematical primitive, dice rule, or card rule for LudoMaths. Use when you want a file-by-file TDD scaffold before implementation."
argument-hint: "Describe the distribution or calculation to add"
agent: "LudoMaths Math Planner"
model: "GPT-5 (copilot)"
---

Plan the requested probability feature for LudoMaths using the user's request as the feature brief.

Return exactly these sections:

1. Goal
2. Layer placement
3. Files to create or modify
4. First failing tests
5. Minimum green implementation
6. Refactor checkpoints
7. Validation commands
8. Risks or open questions

Requirements:

- Follow Red, Green, Refactor.
- Reuse nearby patterns already present in the repository.
- Distinguish clearly between generic math and game-specific rules.
- Mention i18n or UI work only if the feature reaches those layers.