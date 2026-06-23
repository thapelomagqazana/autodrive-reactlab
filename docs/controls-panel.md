# ControlsPanel Component

## Overview

The `ControlsPanel` component provides the primary user control surface for **AutoDrive ReactLab**.

It centralizes simulator controls such as start, pause, reset, sensor visibility, debug mode, and scenario selection into one reusable component.

The component is intentionally presentation-focused. It communicates user intent through callback props, but it does not directly control the simulation engine.

---

# Purpose

The ControlsPanel exists to answer one question:

> What actions can the user perform on the simulator?

It gives users a predictable place to interact with the simulation while keeping control UI separate from engine logic, canvas rendering, and telemetry display.

---

# Responsibilities

The ControlsPanel owns:

* Start control
* Pause control
* Reset control
* Sensor visibility toggle
* Debug mode toggle
* Scenario selector placeholder
* Accessible button labels
* Safe optional event handlers
* Basic control grouping
* Keyboard-accessible interaction surface

---

# Non-Responsibilities

The ControlsPanel must not contain:

* game loop implementation
* physics logic
* AI behavior
* canvas drawing
* collision detection
* scenario loading logic
* pathfinding logic
* telemetry calculations
* direct engine mutation

Those responsibilities belong to dedicated simulation modules, hooks, stores, or controllers.

---

# Architectural Position

```text
App
│
└── AppShell
    │
    ├── Header
    ├── SimulationCanvas
    ├── ControlsPanel
    └── DashboardPanel
```

The AppShell determines where the ControlsPanel appears.

The ControlsPanel determines what user controls are available.

Simulation behavior is executed elsewhere.

---

# Design Rule

The ControlsPanel should emit **intent**, not execute simulator internals.

Example:

```text
Good:
User clicks Start → ControlsPanel calls onStart()

Bad:
User clicks Start → ControlsPanel starts requestAnimationFrame directly
```

This keeps the component reusable, testable, and safe to evolve.

---

# Public API

```tsx
interface ControlsPanelProps {
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onToggleSensors?: () => void;
  onToggleDebugMode?: () => void;
  onSelectScenario?: () => void;
  isSensorsVisible?: boolean;
  isDebugModeEnabled?: boolean;
  selectedScenarioLabel?: string;
}
```

All handler props are optional.

If a handler is not supplied, the component should still render and interactions should not crash the app.

---

# Props

## `onStart`

Called when the user activates the Start button.

Expected future behavior:

* start simulation lifecycle
* resume from paused state
* eventually trigger game loop coordination elsewhere

---

## `onPause`

Called when the user activates the Pause button.

Expected future behavior:

* pause simulation lifecycle
* preserve current simulation state
* stop time progression elsewhere

---

## `onReset`

Called when the user activates the Reset button.

Expected future behavior:

* restore simulation baseline
* clear runtime telemetry
* reset vehicle state elsewhere

---

## `onToggleSensors`

Called when the user toggles sensor visibility.

Expected future behavior:

* show or hide sensor rays
* update debug rendering preferences elsewhere

---

## `onToggleDebugMode`

Called when the user toggles debug mode.

Expected future behavior:

* show or hide debug overlays
* expose development diagnostics elsewhere

---

## `onSelectScenario`

Called when the user activates the scenario selector placeholder.

Expected future behavior:

* open scenario selector
* switch between road scenarios
* reset simulation for selected scenario elsewhere

---

## `isSensorsVisible`

Controls the displayed state of the sensor toggle.

Default:

```text
true
```

---

## `isDebugModeEnabled`

Controls the displayed state of the debug toggle.

Default:

```text
false
```

---

## `selectedScenarioLabel`

Text displayed for the current scenario placeholder.

Default:

```text
Scenario selector pending
```

---

# Accessibility Requirements

Controls must be accessible through:

* keyboard navigation
* readable button names
* semantic `<button>` elements
* visible focus state
* `aria-pressed` for toggle buttons

Toggle controls should expose state clearly.

Example:

```tsx
<button aria-pressed={isSensorsVisible}>
  Sensors: On
</button>
```

---

# Styling

The component uses the Arcade design system.

Recommended classes:

```text
arcade-panel
arcade-button
arcade-accent
arcade-badge
```

Styling should remain declarative and Tailwind-based.

---

# Testing Strategy

## Positive Tests

Verify:

* Start button renders.
* Pause button renders.
* Reset button renders.
* Sensor toggle renders.
* Debug toggle renders.
* Scenario selector placeholder renders.
* Provided callbacks are called.

---

## Negative Tests

Verify:

* Component renders without handlers.
* Clicking buttons without handlers does not crash.
* Component does not import engine modules.
* Component does not mutate canvas state directly.

---

## Edge Cases

Verify:

* Buttons wrap correctly in narrow containers.
* Long scenario labels do not break layout.
* Toggle state displays correctly.
* Disabled or future loading states can be added without redesign.

---

# Future Enhancements

Later phases may add:

* disabled state based on simulation status
* loading state while scenario loads
* keyboard shortcuts
* speed multiplier control
* scenario dropdown
* add obstacle button
* add traffic car button
* reset confirmation for active runs
* grouped control sections
* telemetry recording controls
* replay controls

---

# Future Integration

The component may later receive values from Zustand through a container component.

Recommended direction:

```text
ControlsPanelContainer
│
├── reads Zustand state
├── maps actions to props
└── renders ControlsPanel
```

This keeps `ControlsPanel` presentational and easy to test.

---

# Anti-Patterns

Avoid adding:

```text
requestAnimationFrame
physics updates
AI decisions
direct canvas access
scenario parsing
telemetry calculations
network calls
large state objects
```

These responsibilities do not belong inside the control surface.

---

# Definition of Done

The ControlsPanel is complete for this phase when:

* the component exists
* all required controls render
* buttons have accessible names
* toggles expose `aria-pressed`
* optional handlers are safe
* component tests pass
* linting passes
* production build passes
* the component is integrated into AppShell

---

# Related WBS Items

* 0.4.1 — Create AppShell Component
* 0.4.4 — Create ControlsPanel Component
* 0.7 — Zustand Store Setup
* 0.8 — Controls Panel
* Phase 6 — Scenario Selector
* Phase 13 — Replay and Telemetry

---

# Related Documentation

* `docs/app-shell.md`
* `docs/state-management.md`
* `docs/testing.md`
* `docs/simulation-canvas.md`

---

# Key Lesson

Controls should express user intent.

They should not own simulator execution.

A clean ControlsPanel says:

> The user clicked Start.

A simulation controller decides:

> What does starting mean right now?
