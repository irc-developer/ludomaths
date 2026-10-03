---
name: "Plan Use Case TDD"
description: "Plan a new LudoMaths use case with Red-Green-Refactor scaffolding. Use when adding a Calculate*UseCase, repository-backed workflow, application service, or hook-facing orchestration step."
argument-hint: "Describe the use case, inputs, and expected output"
agent: "LudoMaths Math Planner"
model: "GPT-5 (copilot)"
---

Create a concrete TDD scaffold for the requested LudoMaths use case.

Return exactly these sections:

1. Goal
2. Inputs and outputs
3. Dependencies and interfaces
4. Files to create or modify
5. First failing tests
6. Minimum implementation path
7. Refactor checkpoints
8. Validation commands

Requirements:

- Keep the use case inside the application layer and push business rules into the domain when appropriate.
- Prefer dependency injection over concrete infrastructure imports.
- Mention translations, hooks, or screens only if they are legitimate follow-up work.