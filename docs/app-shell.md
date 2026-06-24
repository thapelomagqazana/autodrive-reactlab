# AppShell Architecture

## Purpose

The `AppShell` is the root layout component of **AutoDrive ReactLab**.

Its responsibility is to organize the application's high-level user interface into stable, predictable regions while remaining completely independent of the simulation engine.

The AppShell establishes the visual structure that future features build upon.

---

# Design Philosophy

The AppShell follows the **Single Responsibility Principle (SRP)**.

It is responsible only for layout composition.

It must **never** become responsible for:

- simulation logic
- vehicle physics
- AI decision making
- canvas rendering
- sensor processing
- telemetry calculations
- Zustand mutations
- networking

Those concerns belong to dedicated modules.

---

# Architectural Position

```
App
 │
 ▼
AppShell
 ├── Header
 ├── SimulationCanvas
 ├── ControlsPanel
 └── DashboardPanel
```

The App component composes the application.

The AppShell arranges the page.

Child components own their own responsibilities.

---

# Responsibilities

The AppShell owns:

- page-level layout
- responsive grid
- semantic page regions
- spacing
- component composition

The AppShell does **not** own application state.

---

# Layout Regions

The AppShell exposes four primary regions.

## Header

Displays project identity.

Examples:

- project title
- project subtitle
- release badge
- phase indicator

---

## Simulation Region

Contains the browser rendering surface.

Initially this hosts:

- SimulationCanvas

Future versions may contain:

- overlays
- minimap
- debug layers

---

## Controls Region

Contains user interaction controls.

Examples:

- Start
- Pause
- Reset
- Toggle Sensors
- Toggle Debug
- Scenario Selector

---

## Dashboard Region

Displays runtime telemetry.

Examples:

- Speed
- FPS
- Simulation Time
- Collision Count
- Current AI Decision
- Traffic Light State
- AI Confidence

---

# Design Principles

## Separation of Concerns

The AppShell never performs business logic.

Instead it composes components.

```
GOOD

AppShell
    Header
    SimulationCanvas
    ControlsPanel
    DashboardPanel

BAD

AppShell
    startSimulation()
    updatePhysics()
    calculateSensors()
```

---

## Composition over Inheritance

The AppShell receives child components rather than creating specialized subclasses.

This makes the layout reusable and easy to test.

---

## Responsive First

The layout should adapt naturally.

Desktop

```
+--------------------------------------+
| Header                               |
+----------------------+---------------+
| Simulation Canvas    | Dashboard     |
|                      | Controls      |
+----------------------+---------------+
```

Tablet

```
Header

Simulation Canvas

Controls

Dashboard
```

Future mobile support can extend this layout without changing component responsibilities.

---

# Accessibility

The AppShell should use semantic HTML.

Recommended landmarks:

- `<main>`
- `<header>`
- `<section>`
- `<aside>`

Each region should expose an accessible label where appropriate.

Example:

```
Application header

Simulation workspace

Simulation controls

Simulation dashboard
```

---

# Dependency Rules

The AppShell may import:

- Header
- SimulationCanvas
- ControlsPanel
- DashboardPanel

The AppShell must **not** import:

- simulation engine
- physics
- AI
- sensors
- collision detection
- renderer
- telemetry calculators

Keeping dependencies one-directional reduces coupling.

---

# Performance Considerations

The AppShell should remain lightweight.

Avoid:

- unnecessary React state
- expensive calculations
- subscriptions to frequently changing stores

Only compose child components.

---

# Testing Strategy

Unit tests should verify:

- AppShell renders
- semantic regions exist
- layout accepts child components
- layout renders without runtime errors

Tests should **not** verify simulation behavior.

Simulation behavior belongs elsewhere.

---

# Future Evolution

The AppShell should remain stable even as the simulator grows.

Future additions may include:

- command palette
- notifications
- toast system
- modal host
- loading overlays
- global keyboard shortcuts
- theme provider
- error boundary
- suspense boundaries

These additions should remain layout infrastructure rather than simulation logic.

---

# Engineering Rules

The AppShell should always:

- compose rather than calculate
- arrange rather than simulate
- contain no business logic
- remain reusable
- remain framework idiomatic
- remain easy to test
- remain accessible

---

# Anti-Patterns

Avoid introducing:

- physics calculations
- AI decision trees
- canvas drawing
- sensor updates
- Zustand mutations
- API calls
- timers
- animation loops

These belong to specialized modules.

---

# Directory Structure

```
src/
└── app/
    ├── AppShell.tsx
    └── index.ts
```

---

# Related Components

- Header
- SimulationCanvas
- ControlsPanel
- DashboardPanel

---

# Related WBS Items

- 0.4.1 — Create AppShell Component
- 0.4.2 — Create Header Component
- 0.4.3 — Create SimulationCanvas Component
- 0.4.4 — Create ControlsPanel Component
- 0.4.5 — Create DashboardPanel Component
- 0.4.6 — Create Responsive Layout

---

# Definition of Done

The AppShell is considered complete when:

- it renders the application through a single layout component
- semantic regions are clearly defined
- no simulation logic exists inside the component
- responsive behavior works on desktop and tablet
- component tests pass
- linting passes
- production build succeeds

---

# Key Lesson

A common source of technical debt in interactive applications is allowing the root layout to accumulate business logic.

The AppShell should remain an architectural boundary—not an implementation layer.

Its purpose is to organize the application, not to operate the simulator.
