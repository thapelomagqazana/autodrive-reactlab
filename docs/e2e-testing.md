# End-to-End Testing Guide

AutoDrive ReactLab uses Playwright for browser-level testing.

## Purpose

E2E tests verify that the application works from the user's perspective.

Use Playwright for:

- application startup
- core layout rendering
- controls behavior
- dashboard visibility
- future simulation workflows

## Commands

```bash
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:ui
npm run test:e2e:report
```

## Browser coverage

The project runs E2E tests against:

- Chromium
- Firefox
- WebKit

## Artifacts

On failure, Playwright may capture:

- screenshots
- videos
- traces

Reports are written to:

```
playwright-report/
test-results/
```

## Locator rules

Prefer stable, user-facing locators:

```ts
page.getByRole("button", { name: /start/i });
page.getByRole("heading", { name: /AutoDrive ReactLab/i });
```

Avoid brittle CSS selectors unless the element has no semantic role.

## Quality rule

No pull request should be merged if the smoke test fails.
