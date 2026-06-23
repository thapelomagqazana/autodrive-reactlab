# useCanvas Hook

## Overview

The `useCanvas` hook manages the lifecycle of an HTML canvas reference and its 2D rendering context for **AutoDrive ReactLab**.

It exists to keep canvas setup concerns separate from presentation components such as `SimulationCanvas`.

The hook is intentionally small and infrastructure-focused. It does not draw, resize, animate, simulate, or calculate anything.

---

# Purpose

The `useCanvas` hook answers one question:

> How does the application safely access the canvas element and its 2D rendering context?

It provides a reusable foundation for future rendering systems without mixing lifecycle management with simulation behavior.

---

# Responsibilities

The hook owns:

* typed canvas reference
* safe 2D context lookup
* context readiness state
* null-safe access
* cleanup on component unmount

---

# Non-Responsibilities

The hook must not contain:

* road drawing
* vehicle drawing
* sensor ray rendering
* background grid rendering
* frame clearing
* game-loop scheduling
* physics simulation
* AI decisions
* telemetry calculations
* scenario loading
* resize handling
* high-DPI scaling

Those responsibilities belong to later hooks, renderer utilities, or simulation modules.

---

# Public API

```tsx
const {
  canvasRef,
  context,
  isContextReady,
  initializeContext,
} = useCanvas();
```

---

## `canvasRef`

A stable React ref that should be attached to the `<canvas>` element.

Example:

```tsx
<canvas ref={canvasRef} />
```

---

## `context`

The current `CanvasRenderingContext2D`, or `null` when unavailable.

Possible reasons for `null`:

* canvas is not mounted yet
* browser does not support 2D canvas context
* test environment does not implement canvas context
* context initialization has not completed yet

---

## `isContextReady`

Boolean convenience value.

```tsx
isContextReady === context !== null
```

Use this to decide whether future rendering setup can safely proceed.

---

## `initializeContext`

A safe function that attempts to retrieve the 2D rendering context.

It returns:

```tsx
CanvasRenderingContext2D | null
```

It should never throw because the canvas ref is missing.

---

# Design Rule

`useCanvas` provides access to the rendering surface.

It does **not** render the simulation.

Good:

```tsx
const { canvasRef, context } = useCanvas();
```

Bad:

```tsx
useCanvas starts requestAnimationFrame
useCanvas draws roads
useCanvas calculates car physics
useCanvas mutates telemetry
```

---

# Example Usage

```tsx
import { useCanvas } from "../hooks";

export function SimulationCanvas() {
  const { canvasRef } = useCanvas();

  return (
    <canvas ref={canvasRef}>
      Your browser does not support the HTML canvas element.
    </canvas>
  );
}
```

---

# Lifecycle Behavior

The hook should behave safely across the full React lifecycle.

## Before mount

```text
canvasRef.current === null
context === null
isContextReady === false
```

## After mount

The hook attempts to initialize the 2D context.

If successful:

```text
context !== null
isContextReady === true
```

If unavailable:

```text
context === null
isContextReady === false
```

## On unmount

The hook clears local context state.

No renderer, animation loop, or external resource should remain active.

---

# Testing Strategy

## Positive Tests

Verify:

* hook returns a ref
* ref can attach to a canvas element
* context initialization can be requested
* component renders without crashing
* unmount completes safely

---

## Negative Tests

Verify:

* hook behaves safely without an attached canvas
* missing 2D context does not crash
* hook does not import simulation modules
* hook does not start animation loops

---

## Edge Cases

Verify:

* canvas ref starts as `null`
* test environment lacks canvas context support
* component unmounts immediately after mount
* repeated `initializeContext` calls do not throw

---

# Future Integration

Future phases may layer additional systems on top of `useCanvas`.

Possible future structure:

```text
SimulationCanvas
│
├── useCanvas
│   ├── canvas ref
│   ├── context lookup
│   └── context readiness
│
├── useCanvasSize
│   ├── container measurement
│   ├── drawing buffer sizing
│   └── devicePixelRatio support
│
├── renderer
│   ├── clearFrame
│   ├── drawGrid
│   ├── drawRoad
│   ├── drawVehicle
│   └── drawSensors
│
└── gameLoop
    ├── update
    └── render
```

This keeps each concern small, reusable, and testable.

---

# Anti-Patterns

Avoid adding:

```text
requestAnimationFrame
setInterval
canvas resize observer
road drawing
vehicle drawing
sensor ray drawing
physics simulation
AI decisions
Zustand mutations
scenario loading
telemetry calculations
```

These do not belong in `useCanvas`.

---

# Definition of Done

`useCanvas` is complete for this phase when:

* `src/hooks/useCanvas.ts` exists
* hook returns a stable `canvasRef`
* hook attempts safe 2D context retrieval
* hook exposes context readiness
* hook handles missing canvas safely
* hook cleans up on unmount
* hook tests pass
* linting passes
* build passes
* SimulationCanvas can reuse the hook

---

# Related WBS Items

* 0.5.1 — Create Simulation Canvas Surface
* 0.5.2 — Create Canvas Hook
* 0.5.3 — Configure Responsive Canvas Dimensions
* 0.5.4 — Implement Canvas Resize Management
* 0.5.5 — Render Background Grid
* 0.5.6 — Establish Render Loop Clearing

---

# Related Documentation

* `docs/simulation-canvas.md`
* `docs/app-shell.md`
* `docs/testing.md`
* `docs/canvas-rendering.md`

---

# Key Lesson

Canvas lifecycle management is infrastructure.

It should give future rendering systems safe access to the canvas, but it should not become the renderer, simulator, or game loop.

Keeping `useCanvas` small prevents early coupling and makes future rendering work easier to test.
