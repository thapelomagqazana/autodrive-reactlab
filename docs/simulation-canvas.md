# SimulationCanvas Component

## Overview

The `SimulationCanvas` component provides the initial browser rendering surface for **AutoDrive ReactLab**.

It is responsible for owning the HTML `<canvas>` element and preparing the visual area where future roads, vehicles, sensor rays, debug overlays, and simulation scenes will be rendered.

This component is intentionally simple in Phase 0. It prepares the rendering surface without introducing physics, AI, game-loop, or sensor logic too early.

---

# Purpose

The SimulationCanvas exists to establish a clear boundary between:

- application layout
- rendering surface ownership
- future canvas rendering logic
- simulation engine behavior

The component answers one question:

> Where will the simulation be visually rendered?

---

# Responsibilities

The SimulationCanvas owns:

- HTML `<canvas>` element
- local canvas reference
- accessible canvas label
- placeholder rendering surface
- fallback canvas text
- visual canvas container
- responsive canvas area

---

# Non-Responsibilities

The SimulationCanvas must not contain:

- vehicle physics
- AI decisions
- pathfinding
- collision detection
- sensor raycasting
- traffic light behavior
- animation loop scheduling
- Zustand state mutation
- telemetry calculations
- scenario loading

Those responsibilities belong to dedicated simulation modules.

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

The AppShell determines where the SimulationCanvas appears.

The SimulationCanvas owns the browser rendering surface.

The simulation engine will later provide what gets drawn.

---

# Public API

```tsx
interface SimulationCanvasProps {
  label?: string;
}
```

## `label`

Accessible label for the canvas element.

Default:

```text
AutoDrive simulation canvas
```

This helps tests and assistive technologies identify the canvas.

---

# Current Phase Behavior

During Phase 0, the component renders:

- a visible canvas area
- placeholder text
- arcade-themed visual frame
- canvas fallback text
- local canvas ref

It does not yet render real simulation objects.

---

# Future Integration Points

Future phases may extend this component or connect it with:

- `useCanvas`
- high-DPI canvas scaling
- resize observer
- renderer module
- `requestAnimationFrame` game loop
- road rendering
- car rendering
- sensor ray overlays
- debug overlays
- camera transforms
- world-to-screen coordinate mapping

---

# Design Principles

## 1. Canvas Ownership

The component owns the `<canvas>` element.

Other modules should not create duplicate canvas elements.

---

## 2. No Engine Logic

The component may expose a canvas ref internally, but it should not calculate physics or AI decisions.

Rendering infrastructure and simulation behavior must remain separate.

---

## 3. Responsive Surface

The canvas must stay inside its layout container.

It should not cause horizontal overflow.

---

## 4. Accessibility

The canvas should include:

- an accessible label
- fallback text
- stable test identifier

---

# Testing Strategy

## Positive Tests

Verify:

- SimulationCanvas renders.
- Canvas element exists.
- Accessible label exists.
- Placeholder text appears.
- Component renders without crashing.

---

## Negative Tests

Verify:

- Component does not import physics modules.
- Component does not import AI modules.
- Component does not mutate Zustand state.
- Component does not start a game loop.

---

## Edge Cases

Verify:

- Component renders in a constrained parent.
- Placeholder remains visible.
- Canvas fallback text exists.
- Small viewport does not produce horizontal overflow.

---

# Recommended Component Contract

The component should remain presentation-focused during early phases.

Recommended shape:

```tsx
<SimulationCanvas label="AutoDrive simulation canvas" />
```

Future rendering systems should be introduced through dedicated hooks or renderer modules rather than directly adding simulation logic into the component.

---

# Anti-Patterns

Avoid adding:

```text
setInterval
requestAnimationFrame
car physics
AI decisions
sensor calculations
collision checks
traffic light rules
large telemetry history
direct Zustand mutations
```

These are not canvas surface responsibilities.

---

# Future Architecture Direction

A future canvas architecture may look like:

```text
SimulationCanvas
│
├── useCanvas
│   ├── canvas ref
│   ├── context lookup
│   └── resize handling
│
├── renderer
│   ├── clear frame
│   ├── draw road
│   ├── draw vehicle
│   ├── draw sensors
│   └── draw overlays
│
└── gameLoop
    ├── update
    └── render
```

This keeps responsibilities separate and testable.

---

# Definition of Done

The SimulationCanvas is complete for this phase when:

- the component exists
- a canvas element renders
- the component owns a canvas ref
- the canvas has an accessible label
- fallback text exists
- the canvas area is visually distinct
- the canvas does not overflow the layout
- tests verify the component renders
- linting passes
- build passes

---

# Related WBS Items

- 0.4.1 — Create AppShell Component
- 0.4.3 — Create SimulationCanvas Component
- 0.5 — Canvas Foundation
- 0.6 — Game Loop Foundation
- Phase 1 — MVP: Moving Car on Road

---

# Related Documentation

- `docs/app-shell.md`
- `docs/header.md`
- `docs/testing.md`
- `docs/state-management.md`

---

# Key Lesson

The canvas is infrastructure.

It should provide a stable place to render the simulation, but it should not become the simulation engine itself.

Keeping this boundary clean early prevents physics, AI, rendering, and layout concerns from becoming tightly coupled later.
