# Canvas Sizing

## Overview

Canvas sizing defines how the AutoDrive ReactLab simulation canvas maps its visible browser size to its internal drawing buffer size.

This matters because an HTML `<canvas>` has two different sizes:

1. **CSS size** — how large the canvas appears on screen.
2. **Drawing buffer size** — how many actual pixels the canvas uses internally for rendering.

A production-quality simulator must manage both.

---

# Purpose

The purpose of canvas sizing is to keep the simulation rendering surface:

* sharp
* responsive
* distortion-free
* predictable for future renderer systems

Without correct sizing, future roads, vehicles, sensors, and overlays may appear blurry, stretched, clipped, or positioned incorrectly.

---

# Core Rule

Do not rely on CSS dimensions alone.

The canvas must separate:

```text id="6tbwto"
Visible layout size
≠
Internal drawing buffer size
```

Example:

```text id="lt189b"
CSS size: 800 × 400
devicePixelRatio: 2
drawing buffer: 1600 × 800
```

The browser displays the canvas as `800 × 400`, but the drawing buffer contains enough pixels to render sharply on a high-DPI screen.

---

# Responsibilities

Canvas sizing owns:

* visible CSS width
* visible CSS height
* drawing buffer width
* drawing buffer height
* device pixel ratio normalization
* safe dimension calculation
* prevention of blurry rendering caused by low-resolution buffers

---

# Non-Responsibilities

Canvas sizing must not contain:

* rendering logic
* road drawing
* vehicle drawing
* sensor ray drawing
* frame clearing
* game loop scheduling
* physics simulation
* AI decision logic
* resize observer lifecycle
* telemetry calculation

Those responsibilities belong to separate modules.

---

# Key Concepts

## CSS Dimensions

CSS dimensions determine how large the canvas appears in the page layout.

Example:

```css id="sehx1o"
canvas {
  width: 800px;
  height: 400px;
}
```

This controls visual size only.

It does not guarantee sharp rendering.

---

## Drawing Buffer Dimensions

The drawing buffer dimensions are controlled by the canvas element attributes:

```tsx id="waq9y2"
canvas.width = 1600;
canvas.height = 800;
```

These values determine the real pixel area used by the renderer.

---

## Device Pixel Ratio

`devicePixelRatio` describes the relationship between CSS pixels and physical screen pixels.

Common examples:

```text id="vzbbzv"
Standard display: devicePixelRatio = 1
Retina / HiDPI display: devicePixelRatio = 2
Some devices: devicePixelRatio = 1.25, 1.5, 2.5, or 3
```

Higher ratios require larger drawing buffers to avoid blur.

---

# Sizing Formula

```text id="vh5kvp"
drawingBufferWidth = cssWidth × devicePixelRatio
drawingBufferHeight = cssHeight × devicePixelRatio
```

Example:

```text id="4bwl7k"
cssWidth = 1024
cssHeight = 576
devicePixelRatio = 2

drawingBufferWidth = 2048
drawingBufferHeight = 1152
```

---

# Pixel Ratio Normalization

The implementation should normalize unsafe pixel ratio values.

Invalid values should fall back to:

```text id="x5e78v"
1
```

Very large values should be capped to avoid unnecessary memory use.

Recommended cap:

```text id="s43ysq"
3
```

This prevents extremely large canvas buffers on unusual devices.

---

# Example Utility

```ts id="b2y3w8"
export interface CanvasCssSize {
  width: number;
  height: number;
}

export interface CanvasBufferSize {
  width: number;
  height: number;
  pixelRatio: number;
}

export function calculateCanvasBufferSize(
  cssSize: CanvasCssSize,
  devicePixelRatio = 1,
): CanvasBufferSize {
  const pixelRatio = normalizePixelRatio(devicePixelRatio);

  return {
    width: Math.floor(Math.max(0, cssSize.width) * pixelRatio),
    height: Math.floor(Math.max(0, cssSize.height) * pixelRatio),
    pixelRatio,
  };
}
```

---

# Implementation Guidelines

When applying canvas size:

1. Measure the visible container.
2. Set the canvas CSS width and height.
3. Calculate drawing buffer size using device pixel ratio.
4. Set `canvas.width`.
5. Set `canvas.height`.
6. Allow future renderer code to draw using accurate buffer dimensions.

Example:

```ts id="lr3g6w"
canvas.style.width = `${cssWidth}px`;
canvas.style.height = `${cssHeight}px`;

canvas.width = cssWidth * devicePixelRatio;
canvas.height = cssHeight * devicePixelRatio;
```

---

# Why This Matters

If CSS size and buffer size are mismatched, the browser scales the canvas image.

That causes:

* blur
* stretching
* incorrect coordinates
* poor sensor ray alignment
* inaccurate overlays
* confusing debugging

For a self-driving simulator, coordinate accuracy is part of correctness.

---

# Testing Strategy

## Positive Tests

Verify:

* valid CSS size calculates expected buffer size
* `devicePixelRatio = 1` works
* `devicePixelRatio = 2` doubles dimensions
* fractional pixel ratios are supported
* large pixel ratios are capped
* returned dimensions are non-negative

---

## Negative Tests

Verify:

* invalid pixel ratio falls back to `1`
* zero width returns zero buffer width
* zero height returns zero buffer height
* negative dimensions do not produce negative buffer sizes
* `NaN` pixel ratio does not break calculations

---

## Edge Cases

Verify:

* very small canvas
* very large canvas
* fractional CSS dimensions
* fractional device pixel ratio
* constrained parent container
* layout measurement unavailable during tests

---

# Future Integration

Canvas sizing may later be used by:

* `useCanvas`
* `useCanvasResize`
* renderer initialization
* high-DPI scaling
* background grid renderer
* road renderer
* sensor overlay renderer
* debug overlay renderer

Recommended future structure:

```text id="j85qyy"
SimulationCanvas
│
├── useCanvas
│   ├── canvas ref
│   └── context lookup
│
├── canvasSizing
│   ├── calculateCanvasBufferSize
│   └── applyCanvasSize
│
└── useCanvasResize
    ├── ResizeObserver
    ├── buffer updates
    └── redraw trigger
```

---

# Anti-Patterns

Avoid:

```text id="9a2lh5"
using CSS size only
hardcoding canvas width and height forever
ignoring devicePixelRatio
mixing physics with sizing
mixing drawing with sizing
starting the game loop from sizing code
creating resize listeners inside sizing utilities
allowing negative buffer dimensions
```

---

# Performance Considerations

Large drawing buffers consume memory and processing power.

Example:

```text id="tjxk4q"
CSS size: 1920 × 1080
devicePixelRatio: 3

drawing buffer: 5760 × 3240
```

That is expensive.

This is why pixel ratio should be capped.

---

# Definition of Done

Canvas sizing is complete when:

* CSS dimensions and drawing buffer dimensions are separated
* device pixel ratio is applied safely
* invalid inputs are handled safely
* dimensions never become negative
* sizing utilities are unit-tested
* the canvas remains sharp on high-DPI displays
* future rendering code can rely on accurate dimensions

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
* `docs/canvas-rendering.md`
* `docs/app-shell.md`

---

# Key Lesson

Canvas has two sizes.

CSS size controls layout.

Drawing buffer size controls rendering quality.

A simulator that ignores this will look correct on one screen and blurry or inaccurate on another.
