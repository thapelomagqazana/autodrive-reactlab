# Canvas Background Grid

## Overview

The canvas background grid is a lightweight development renderer for **AutoDrive ReactLab**.

It draws a simple coordinate grid directly onto the simulation canvas to prove that the rendering pipeline is working before roads, vehicles, sensors, traffic systems, and debug overlays are implemented.

The grid is not the simulation world. It is a diagnostic layer.

---

# Purpose

The background grid exists to answer one question:

> Can the application draw predictable visual output onto the canvas?

It helps verify:

* canvas context access
* drawing-buffer sizing
* coordinate spacing
* rendering origin behavior
* future redraw readiness

---

# Responsibilities

The grid renderer owns:

* vertical grid line calculation
* horizontal grid line calculation
* lightweight grid drawing
* optional origin marker
* safe no-op behavior when disabled
* safe no-op behavior for invalid dimensions

---

# Non-Responsibilities

The grid renderer must not contain:

* road rendering
* vehicle rendering
* sensor ray rendering
* traffic light rendering
* pedestrian rendering
* physics simulation
* AI decision logic
* game-loop scheduling
* frame clearing responsibility
* React component layout

Those responsibilities belong to separate renderer or simulation modules.

---

# Architectural Position

```text id="6e7k69"
SimulationCanvas
│
├── useCanvas
│   ├── canvas ref
│   └── context lookup
│
├── useCanvasResize
│   ├── container measurement
│   └── buffer updates
│
└── gridRenderer
    ├── calculateGridLines
    └── renderBackgroundGrid
```

The `SimulationCanvas` decides whether to call the grid renderer.

The `gridRenderer` only knows how to calculate and draw grid lines.

---

# Public API

## `calculateGridLines`

```ts id="j8s47h"
calculateGridLines(options: GridRenderOptions): GridLine[]
```

Pure function that calculates the grid line coordinates.

This function is easy to test because it does not require a real canvas.

---

## `renderBackgroundGrid`

```ts id="bw9elj"
renderBackgroundGrid(
  context: CanvasRenderingContext2D,
  options: GridRenderOptions,
): void
```

Draws the calculated grid lines onto the canvas context.

---

# Types

```ts id="n9fdcx"
interface GridRenderOptions {
  width: number;
  height: number;
  spacing?: number;
  lineColor?: string;
  originColor?: string;
  enabled?: boolean;
}

interface GridLine {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}
```

---

# Default Behavior

Recommended defaults:

```text id="gyj1mq"
spacing = 40
lineColor = rgba(0, 234, 255, 0.18)
originColor = rgba(255, 230, 0, 0.85)
enabled = true
```

The grid should be visible enough to debug coordinates but subtle enough not to overpower future road and vehicle rendering.

---

# Disable Strategy

The grid renderer supports an `enabled` flag.

Example:

```ts id="9819o9"
renderBackgroundGrid(context, {
  width: dimensions.width,
  height: dimensions.height,
  spacing: 40,
  enabled: isGridEnabled,
});
```

When `enabled` is false, no lines should be calculated or drawn.

This allows future debug settings or production builds to turn the grid off without changing renderer internals.

---

# Rendering Rules

The grid should:

* cover the full canvas drawing buffer
* use uniform spacing
* avoid unnecessary allocations beyond line calculation
* call `context.save()` before drawing
* call `context.restore()` after drawing
* not clear the canvas itself
* not start animation loops
* not mutate simulation state

---

# Origin Marker

An optional origin marker may be drawn at:

```text id="p9za98"
x = 0
y = 0
```

This helps developers understand the current coordinate origin.

Later camera/world-coordinate work may change how origin markers are displayed.

---

# Testing Strategy

## Positive Tests

Verify:

* vertical grid lines are calculated
* horizontal grid lines are calculated
* grid spacing is uniform
* grid lines cover canvas bounds
* renderer calls canvas drawing methods
* renderer saves and restores context state

---

## Negative Tests

Verify:

* disabled grid returns no lines
* zero width returns no lines
* zero height returns no lines
* invalid spacing uses safe fallback behavior
* renderer does not throw on safe empty input

---

## Edge Cases

Verify:

* spacing larger than canvas width
* spacing larger than canvas height
* fractional dimensions
* small canvas dimensions
* large canvas dimensions
* device pixel ratio adjusted spacing

---

# Anti-Patterns

Avoid adding:

```text id="aid01e"
requestAnimationFrame
clearRect
road drawing
vehicle drawing
sensor ray drawing
physics updates
AI decisions
Zustand mutations
React component state
ResizeObserver
```

These responsibilities do not belong in the grid renderer.

---

# Relationship to Frame Clearing

The grid renderer does not clear the canvas.

Frame clearing belongs to a separate renderer lifecycle utility.

Expected future order:

```text id="ho9t15"
beginFrame
clearFrame
drawGrid
drawRoad
drawVehicle
drawSensors
endFrame
```

This keeps each rendering concern separate and testable.

---

# Performance Notes

The grid should remain lightweight.

Recommended practices:

* use simple line drawing
* avoid complex gradients inside the grid renderer
* calculate only necessary lines
* keep default spacing reasonable
* avoid repeated work unless dimensions change or frame redraw is needed

---

# Future Enhancements

Possible future additions:

* major/minor grid lines
* axis labels
* world-coordinate markers
* camera-aware grid
* zoom-aware spacing
* toggle through debug mode
* origin crosshair
* lane-aligned debug grid
* grid opacity control

These enhancements should remain optional and not turn the grid into the road renderer.

---

# Definition of Done

The background grid is complete when:

* grid lines are calculated consistently
* grid renders onto the canvas
* grid covers the visible drawing buffer
* grid can be disabled
* invalid dimensions are handled safely
* tests cover line calculation behavior
* tests cover draw calls
* linting passes
* build passes
* no physics, AI, or game-loop logic is introduced

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
* `docs/use-canvas.md`
* `docs/canvas-sizing.md`
* `docs/canvas-resize.md`
* `docs/canvas-rendering.md`

---

# Key Lesson

A grid is not decoration.

It is an inexpensive diagnostic tool that proves the canvas rendering pipeline works.

It helps confirm that context access, sizing, coordinate spacing, and future redraw behavior are ready before the actual simulation world is drawn.
