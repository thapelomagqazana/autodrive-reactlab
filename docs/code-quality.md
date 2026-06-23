# Code Quality Guide

AutoDrive ReactLab uses ESLint for code quality and Prettier for formatting.

## Purpose

Code quality tooling exists to keep the project consistent, readable, and safe to change.

ESLint checks code correctness and maintainability.

Prettier handles formatting.

They should not compete with each other.

## Commands

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

## When to use each command

Use this before opening a pull request:
```bash
npm run lint
npm run format:check
```
Use this when you want to automatically format files:
```bash
npm run format
```
Use this when you want ESLint to fix safe issues:
```bash
npm run lint:fix
```

## Rules
- ESLint owns code-quality checks.
- Prettier owns formatting.
- Do not add formatting rules to ESLint.
- Do not manually format large files if Prettier can do it.
- Keep generated files out of linting and formatting.
- Fix warnings early before they become noisy technical debt.

## Ignored outputs

The following generated folders should not be linted or formatted:
```
dist
coverage
playwright-report
test-results
node_modules
```

## Pull request checklist

Before creating a PR, run:
```bash
npm run format:check
npm run lint
npm test
npm run build
```

For browser validation, also run:
``bash
npm run test:e2e
```

## Common failures
### Formatting check fails

Run:
```bash
npm run format
```
Then rerun:
```bash
npm run format:check
```

## ESLint fails on unused variables

Remove the unused variable.

If the value is intentionally unused, prefix it with `_`.

Example:
```ts
function handleEvent(_event: Event) {
  return true;
}
```

## Fast Refresh export warning in test files

Test utility files may export helpers that are not React components.

The ESLint config disables the Fast Refresh export rule for test files.

## Engineering rule

Code quality is not decoration.

It is a safety system that keeps future development fast, reviewable, and less error-prone.