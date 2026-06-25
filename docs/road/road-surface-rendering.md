# Road Surface Rendering

## Purpose

Road surface rendering draws the main visible drivable area of the MVP road.

The surface is the dark asphalt/slate rectangle that sits underneath:

- Road boundary lines
- Lane divider lines
- Vehicle rendering
- Sensor rays
- Debug overlays

The renderer must derive the road surface directly from the Road Domain Model.

It must not hardcode road bounds.

---

# File Location

```txt
src/simulation/engine/roadRenderer.ts
```

---

# Public Helpers

```ts
getRoadSurfaceRect(
  road: Road,
): RoadSurfaceRect;
```

```ts
drawRoadSurface(
  context: CanvasRenderingContext2D,
  road: Road,
  options: Pick<Required<DrawRoadOptions>, "surfaceColor">,
): void;
```

---

# RoadSurfaceRect

```ts
export interface RoadSurfaceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

This rectangle represents the exact canvas area filled by the road surface.

---

# Geometry Source

The road surface must be calculated from:

```txt
road.centerX
road.width
road.topY
road.bottomY
```

These values come from the Road Domain Model.

The renderer must not invent road geometry.

---

# Derived Values

The road surface uses derived geometry.

```txt
leftEdgeX = road.centerX - road.width / 2

height = road.bottomY - road.topY
```

The canvas rectangle becomes:

```txt
x = leftEdgeX

y = road.topY

width = road.width

height = road.bottomY - road.topY
```

---

# Example

Given road model:

```txt
centerX = 400
width = 360
topY = -2000
bottomY = 900
```

Derived values:

```txt
leftEdgeX = 400 - 360 / 2

leftEdgeX = 220

height = 900 - (-2000)

height = 2900
```

Canvas draw call:

```ts
context.fillRect(220, -2000, 360, 2900);
```

---

# Theme Direction

Road surface styling should follow the Tesla FSD + Mission Control Hybrid theme.

Recommended visual style:

```txt
Dark asphalt
Slate tone
Professional dashboard feel
Subtle technical depth
Clean and readable
```

Avoid:

```txt
Arcade neon
Pixel-art road surfaces
Overly bright gradients
Distracting visual noise
```

Recommended default:

```ts
surfaceColor: "rgb(15 23 42)";
```

---

# Renderer Contract

The road surface renderer is responsible for:

```txt
Setting fill style.
Drawing the road surface rectangle.
Saving canvas state.
Restoring canvas state.
```

It must not:

```txt
Create road state.
Mutate road state.
Resize canvas.
Start a game loop.
Read Zustand.
Read React state.
Draw vehicles.
Draw sensors.
Draw UI.
```

---

# Canvas State Safety

Canvas is stateful.

Road surface rendering must use:

```ts
context.save();
```

before applying style and:

```ts
context.restore();
```

after drawing.

This prevents `fillStyle` or future surface-specific styles from leaking into:

```txt
Road boundary rendering
Lane divider rendering
Car rendering
Sensor rendering
Debug overlays
HUD rendering
```

---

# Correct Implementation Flow

```txt
Road
 ↓
getRoadSurfaceRect()
 ↓
drawRoadSurface()
 ↓
Canvas fillRect()
```

Example:

```ts
const surface = getRoadSurfaceRect(road);

context.fillRect(surface.x, surface.y, surface.width, surface.height);
```

---

# Incorrect Implementation

Do not hardcode:

```ts
context.fillRect(220, -2000, 360, 2900);
```

Do not duplicate:

```ts
const roadLeft = 220;
const roadWidth = 360;
```

Do not derive geometry from unrelated UI layout values.

---

# Relationship to Road Model

The Road model owns geometry.

The renderer owns visual style.

Correct separation:

```txt
Road Model:
centerX
width
topY
bottomY

Road Renderer:
surfaceColor
fillStyle
fillRect
```

---

# Relationship to Boundary Lines

The road surface is drawn before boundary lines.

Render order:

```txt
1. Surface
2. Boundaries
3. Dividers
4. Optional debug guide
```

This ensures boundary lines remain visible above the surface.

---

# Relationship to Lane Dividers

Lane dividers are drawn after the surface.

The surface must not obscure dividers.

The divider renderer should use:

```txt
getLaneDividerLines(road)
```

while the surface renderer uses:

```txt
getRoadSurfaceRect(road)
```

---

# Testing Expectations

## Positive Tests

Verify:

```txt
Default road creates expected surface rectangle.
drawRoadSurface() calls fillRect().
fillRect() uses model-derived values.
Custom surface color is applied.
Canvas state is saved.
Canvas state is restored.
Custom road dimensions work.
Fractional road dimensions work.
```

---

## Negative Tests

Verify rejection of:

```txt
Invalid road width.
Invalid lane count.
Invalid topY.
Invalid bottomY.
bottomY <= topY.
NaN coordinates.
Infinity coordinates.
```

---

## Edge Cases

Verify:

```txt
Very wide road.
Very narrow road.
Negative topY.
Fractional centerX.
Fractional width.
Fractional topY and bottomY.
```

Expected:

```txt
Deterministic surface rectangle.
No NaN propagation.
No hardcoded bounds.
```

---

# Acceptance Criteria

This task is complete when:

```txt
Road background is visible.
Road width matches Road.width.
Road position matches Road.centerX.
Road surface uses Road.topY and Road.bottomY.
No hardcoded road bounds exist inside draw logic.
Road fill style is centralized in renderer options.
Road remains readable on dark app background.
Unit tests verify exact surface dimensions.
```

---

# Traceability KPI

```txt
Road surface dimensions match the road model exactly.
```

Success means:

```txt
100% of road surface geometry comes from:

Road.centerX
Road.width
Road.topY
Road.bottomY
```

and nowhere else.

---

# Engineering Lessons Learned

## Rendering Should Project Domain Geometry

The road surface is not a manually drawn rectangle.

It is the visual projection of the Road model.

Correct mental model:

```txt
Domain geometry
      ↓
Canvas projection
```

---

## Avoid Magic Numbers

Magic numbers such as:

```txt
220
360
580
2900
```

may be correct today, but they break when:

```txt
Road width changes.
Road center changes.
Canvas size changes.
Scenario changes.
Camera system is added.
```

Use helpers instead.

---

## Style and Geometry Must Stay Separate

The road model should not know about colors.

The renderer should not invent dimensions.

This separation keeps the system:

```txt
Maintainable
Testable
Themeable
Futureproof
```

---

## Why This Reduces Technical Debt

A clean surface renderer means future features can evolve safely:

```txt
Night mode
Weather mode
Road shoulders
Construction zones
Parking lanes
Highways
Roundabouts
Camera follow
Scenario editor
```

Because geometry is model-driven and style is option-driven, the renderer remains simple and extensible.
