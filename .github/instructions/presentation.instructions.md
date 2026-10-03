---
description: "Use when editing React Native screens, components, hooks, or translation files. Covers thin screens, hook boundaries, dependency injection into use cases, and i18n rules for user-facing text."
name: "Presentation And I18n"
applyTo: ["src/presentation/**/*.ts", "src/presentation/**/*.tsx", "src/infrastructure/i18n/locales/*.ts"]
---

# Presentation And I18n Guidelines

- Screens stay thin: compose components and hooks, but do not embed domain calculations.
- Move validation, conversion, and orchestration into hooks or use cases when JSX starts carrying business logic.
- Prefer dependency injection for use cases and repositories so tests can replace implementations.
- Every user-facing string in JSX must use `t('key')`.
- When adding a translation key, update both locale files in the same change.
- Follow the `screen.element` key shape unless a feature already uses a consistent alternative namespace.

## Review triggers

- A screen with heavy non-UI branching is a refactor target.
- Repeated form conversion code should move into dedicated helpers.
- Module-level use case instances are suspicious unless there is a clear lifecycle reason.