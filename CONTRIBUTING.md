# Contributing to AutoDrive Lab

Thank you for your interest in contributing to AutoDrive Lab.

AutoDrive Lab is a React + TypeScript simulation project focused on learning, clean architecture, deterministic physics, canvas rendering, testing, and autonomous driving concepts.

This guide explains how to contribute safely, consistently, and professionally.

---

## Project Goals

AutoDrive Lab aims to be:

- Educational
- Well-tested
- Maintainable
- Beginner-friendly
- Portfolio-ready
- Architecture-focused
- Simulation-oriented
- Incrementally extensible

Contributions should support these goals.

---

## Code of Conduct

All contributors must follow the project Code of Conduct.

Please read:

```text
CODE_OF_CONDUCT.md
```

Be respectful, constructive, and professional.

---

## Security

Do not open public issues for security vulnerabilities.

Please read:

```text
SECURITY.md
```

Never commit secrets, tokens, passwords, API keys, or `.env` files.

---

## Getting Started

### 1. Fork the repository

Create your own fork on GitHub.

### 2. Clone your fork

```bash
git clone https://github.com/YOUR_USERNAME/autodrive-reactlab.git
cd autodrive-reactlab
```

### 3. Install dependencies

```bash
npm ci
```

### 4. Start the development server

```bash
npm run dev
```

### 5. Run tests

```bash
npm test
npm run test:e2e
npm run build
```

---

## Branch Naming

Use descriptive branch names.

Recommended format:

```text
feature/<short-description>
fix/<short-description>
test/<short-description>
docs/<short-description>
refactor/<short-description>
chore/<short-description>
```

Examples:

```text
feature/sensor-raycasting
fix/steering-input-reset
test/playwright-road-warning
docs/phase-2-sensors
refactor/camera-follow-state
chore/dependabot-config
```

---

## Commit Messages

Use clear conventional-style commit messages.

Recommended format:

```text
type(scope): short description
```

Examples:

```text
feat(physics): add off-road speed penalty
fix(camera): prevent follow offset jitter
test(e2e): verify keyboard steering
docs(readme): document phase 1 controls
refactor(store): use focused selectors
chore(ci): add codeql workflow
```

Common types:

| Type       | Meaning                                     |
| ---------- | ------------------------------------------- |
| `feat`     | New feature                                 |
| `fix`      | Bug fix                                     |
| `test`     | Tests only                                  |
| `docs`     | Documentation only                          |
| `refactor` | Code restructuring without behaviour change |
| `chore`    | Maintenance task                            |
| `style`    | Formatting only                             |
| `perf`     | Performance improvement                     |

---

## Pull Request Checklist

Before opening a pull request, verify:

- Code builds successfully.
- Unit tests pass.
- Playwright E2E tests pass.
- No secrets are committed.
- New behaviour has tests.
- Documentation is updated where useful.
- The change is focused and not overly broad.
- The PR description clearly explains the purpose.

Run:

```bash
npm test
npm run test:e2e
npm run build
```

---

## Pull Request Description Template

Use a clear PR description.

```markdown
## Summary

Explain what this PR changes.

## Why

Explain the reason for the change.

## Changes

- Change 1
- Change 2
- Change 3

## Testing

- [ ] `npm test`
- [ ] `npm run test:e2e`
- [ ] `npm run build`

## Screenshots / GIFs

Add screenshots or GIFs if UI changed.

## Notes

Mention trade-offs, known limitations, or follow-up work.
```

---

## Development Principles

### Keep Physics Pure

Physics functions should be deterministic and testable.

Prefer:

```ts
const nextCar = updateCarPhysics(car, input, deltaTimeSeconds);
```

Avoid hidden mutation.

### Keep Canvas Drawing Imperative

React should create the canvas element.

Canvas should draw pixels.

Do not represent every car, road, or sensor ray as React DOM during simulation frames.

### Use Focused Zustand Selectors

Prefer narrow selectors:

```ts
useSimulationCarSpeed();
useSimulationFps();
useRoadDepartureWarning();
```

Avoid subscribing components to large state objects unless necessary.

### Keep Renderer Logic Separate

Renderers should draw.

They should not decide gameplay rules.

Boundary detection, physics, and warnings should live in engine/domain helpers.

### Write Tests for Behaviour

Prefer testing user-visible or domain behaviour.

Avoid tests that rely too heavily on internal implementation details unless testing pure helpers.

---

## Testing Guidelines

### Unit Tests

Use Vitest for pure helpers and components.

Recommended targets:

- Physics helpers
- Camera helpers
- Road helpers
- Store actions
- Formatting helpers
- Component rendering

Run:

```bash
npm test
```

### End-to-End Tests

Use Playwright for browser behaviour.

Recommended targets:

- App loads
- Start works
- Pause works
- Reset works
- Keyboard acceleration works
- Keyboard steering works
- Telemetry updates
- Camera toggle works

Run:

```bash
npm run test:e2e
```

### UI Tests

When dashboard layout changes:

- Prefer `data-testid` for stable telemetry cards.
- Prefer `getByRole` for buttons, tabs, headings, and regions.
- Avoid searching for ambiguous text like `0`, `0°`, or `Camera`.

---

## Documentation Guidelines

Update documentation when you add or change:

- User controls
- Physics behaviour
- Camera behaviour
- Dashboard telemetry
- Testing instructions
- Architecture
- Security setup
- Contribution workflow

Recommended docs location:

```text
docs/
```

Examples:

```text
docs/physics/off-road-speed-penalty.md
docs/camera/camera-view-state.md
docs/dashboard/tabbed-mission-telemetry.md
docs/performance/performance-checks.md
```

---

## UI Contribution Guidelines

When changing UI:

- Preserve accessibility.
- Use semantic HTML where possible.
- Keep keyboard navigation usable.
- Avoid hardcoded fake diagnostics.
- Prefer progressive disclosure over long panels.
- Use stable `data-testid` only for test-critical elements.
- Keep dashboard values readable and grouped logically.

For tabbed telemetry:

- Vehicle tab: driving state
- Performance tab: FPS, frame time, canvas
- AI tab: AI decision, sensors, destination
- Debug tab: collision, lane, camera, offsets

---

## Security Guidelines

Before committing, check for secrets:

```bash
git grep -n "API_KEY\|SECRET\|TOKEN\|PASSWORD\|PRIVATE_KEY\|DATABASE_URL"
```

Do not commit:

```text
.env
.env.local
.env.*.local
API keys
Tokens
Passwords
Private keys
Cloud credentials
```

Use GitHub security features:

- CodeQL
- Secret scanning
- Push protection
- Dependabot alerts
- Dependabot security updates
- Branch protection

---

## Accessibility Guidelines

Prefer accessible queries and components.

Good examples:

```tsx
<button type="button">Start</button>
<section aria-label="Mission Telemetry Tabs">
<div role="tablist" aria-label="Mission telemetry categories">
```

Tabs should use:

```text
role="tablist"
role="tab"
role="tabpanel"
aria-selected
aria-controls
aria-labelledby
```

Interactive elements should be keyboard accessible.

---

## Performance Guidelines

Performance-sensitive code should respect these rules:

- Do not draw canvas objects through React JSX.
- Do not create multiple `requestAnimationFrame` loops.
- Do not call Zustand setters inside uncontrolled render loops.
- Keep dashboard subscriptions focused.
- Track FPS from frame delta time.
- Stop or pause updates when simulation is paused or idle.

---

## File Organization

Current project structure:

```text
src/
  app/
  components/
  hooks/
  simulation/
    camera/
    engine/
    vehicle/
    world/
  store/
  types/
  utils/

tests/
  e2e/

docs/
```

Place code according to responsibility:

| Responsibility   | Location                  |
| ---------------- | ------------------------- |
| UI components    | `src/components/`         |
| Canvas and hooks | `src/hooks/`              |
| Physics helpers  | `src/simulation/engine/`  |
| Camera helpers   | `src/simulation/camera/`  |
| Vehicle model    | `src/simulation/vehicle/` |
| Road model       | `src/simulation/world/`   |
| Global state     | `src/store/`              |
| E2E tests        | `tests/e2e/`              |
| Documentation    | `docs/`                   |

---

## Issue Guidelines

When opening an issue, include:

- Clear title
- Description of the problem
- Expected behaviour
- Actual behaviour
- Steps to reproduce
- Screenshots or logs if helpful
- Browser and OS where relevant

Example:

```markdown
## Problem

Describe the issue.

## Steps to Reproduce

1. Open the app.
2. Click Start.
3. Hold ArrowUp.
4. Observe behaviour.

## Expected

What should happen?

## Actual

What happened instead?

## Environment

- Browser:
- OS:
- Node version:
```

---

## Feature Request Guidelines

When proposing a feature, include:

- User problem
- Proposed solution
- Alternatives considered
- Impact on architecture
- Test strategy
- Screenshots or sketches if UI-related

Good feature requests are specific and phase-aware.

---

## Review Guidelines

When reviewing code:

- Be constructive.
- Focus on behaviour and maintainability.
- Ask questions before assuming intent.
- Suggest tests where needed.
- Prefer small focused changes.
- Avoid personal criticism.

Helpful review language:

```text
Could this be extracted into a pure helper?
Can we add a test for the edge case?
This may belong in the simulation engine instead of the component.
Can we make this selector narrower?
```

---

## Maintainer Notes

Maintainers may request changes for:

- Missing tests
- Unclear architecture
- Large unfocused PRs
- Security concerns
- Accessibility regressions
- Performance regressions
- Documentation gaps
- Inconsistent coding style

This is normal and helps keep the project healthy.

---

## License

By contributing, you agree that your contributions will be licensed under the same license as this repository.

If no license is present yet, contributors should wait for the project owner to add one before assuming open-source reuse rights.

---

## Thank You

Thank you for helping improve AutoDrive Lab.

Every clear test, clean refactor, useful document, and thoughtful feature makes the project stronger.
