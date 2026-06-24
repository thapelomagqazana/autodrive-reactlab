# AutoDrive Lab

Retro-inspired autonomous driving simulation lab built with React, TypeScript, Vite, Tailwind CSS, Zustand, Vitest, and Playwright.

## Purpose

AutoDrive Lab is a learning-first engineering project for building a browser-based autonomous driving simulator step by step.

The project is structured to grow from a professional UI foundation into a full simulation system with:

- canvas rendering
- game loop timing
- simulation state
- controls
- telemetry dashboard
- vehicle movement
- sensors
- AI decisions
- replay and diagnostics

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Vitest
- Testing Library
- Playwright
- ESLint
- Prettier
- GitHub Actions
- Husky

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run typecheck
npm run format:check
npm run lint
npm test
npm run build
npm run test:e2e
npm run verify
npm run verify:full
```

## Project Structure

```text
src/
  app/
  components/
  hooks/
  simulation/
    engine/
  store/
  styles/
  types/
  utils/
tests/
docs/
.github/
  workflows/
```

## Current Features

- AppShell layout
- Header
- SimulationCanvas
- ControlsPanel
- DashboardPanel
- Zustand simulation store
- Start / Pause / Reset lifecycle controls
- Elapsed time display
- FPS display
- Canvas diagnostics support
- Vehicle telemetry placeholders
- GitHub Actions CI
- Husky quality hooks

## Quality Gates

Local verification:

```bash
npm run verify
```

Full verification:

```bash
npm run verify:full
```

CI runs on pull requests and pushes to `main`.

## Design Principles

- Keep UI components presentational where possible.
- Keep Zustand as lightweight shared state only.
- Keep game loop logic outside React components.
- Keep dashboard read-only.
- Keep canvas rendering separate from layout.
- Prefer small, testable modules.
- Avoid premature coupling between physics, AI, rendering, and UI.

## Documentation

See `docs/` for implementation notes and phase-specific architecture decisions.

## License

MIT
