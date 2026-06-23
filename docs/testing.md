# Testing Guide

AutoDrive ReactLab uses Vitest for unit tests.

## Test goals

Unit tests should verify small, deterministic pieces of logic:

- time utilities
- math utilities
- state transitions
- simulation rules
- sensor calculations
- collision helpers
- AI decision helpers

## Commands

```bash
npm test
npm run test:watch
npm run test:coverage
```

## Test file naming

Use:
```
*.test.ts
*.test.tsx
*.spec.ts
*.spec.tsx
```

## Testing rules
- Prefer pure functions where possible.
- Test behavior, not implementation details.
- Keep tests deterministic.
- Avoid arbitrary timers unless explicitly testing time behavior.
- Do not depend on real network calls.
- Do not test third-party library internals.

## Coverage

Coverage reports are written to:
```
coverage/
```
The HTML report can be opened locally after running:
```bash
npm run test:coverage
```

## Component testing rules
- Test behavior from the user’s perspective.
- Prefer `getByRole`, `getByLabelText`, and visible text queries.
- Avoid testing implementation details.
- Avoid testing Tailwind class names unless visual class behavior is the actual contract.
- Use `userEvent.setup()` inside each interaction test.
- Import render from src/tests/test-utils.

## Example
```ts
const user = userEvent.setup();

render(<ToggleButton label="Sensors" isEnabled={false} onToggle={onToggle} />);

await user.click(screen.getByRole("button", { name: /sensors: off/i }));
```