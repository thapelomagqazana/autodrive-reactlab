# Road Lane Divider Rendering

## Purpose

`drawLaneDividers()` renders dashed lane markings between road lanes.

Lane dividers are visual guidance lines. They help the user understand the lane layout, and they prepare the project for future lane-following, traffic, and autonomous-driving features.

In the MVP, lane dividers are **not collision boundaries**.

---

# File Location

```txt
src/simulation/engine/roadRenderer.ts
```

---

# Public API

```ts
drawLaneDividers(
  context: CanvasRenderingContext2D,
  road: Road,
  options: DividerStyleOptions,
): void;
```

---

# Inputs

```txt
CanvasRenderingContext2D
Road model
getLaneDividerLines()
Divider style options
```

---

# Responsibilities

`drawLaneDividers()` is responsible for:

```txt
Requesting generated divider data.
Drawing divider lines.
Applying dashed line styling.
Keeping divider styling visually distinct from road boundaries.
Resetting canvas line dash state after drawing.
```

---

# Non-Responsibilities

`drawLaneDividers()` must not:

```txt
Create road state.
Mutate road state.
Calculate lane count manually.
Hardcode divider X positions.
Treat dividers as collision boundaries.
Resize canvas.
Start a game loop.
Read Zustand.
Import React.
```

---

# Divider Geometry Source

Divider geometry must come from:

```ts
getLaneDividerLines(road);
```

Correct:

```ts
const dividerLines = getLaneDividerLines(road);
```

Incorrect:

```ts
const dividerLines = [340, 460];
```

---

# Divider Count Rule

Divider count is always:

```txt
laneCount - 1
```

Examples:

| Lane Count | Divider Count |
| ---------: | ------------: |
|          1 |             0 |
|          2 |             1 |
|          3 |             2 |
|          4 |             3 |
|          5 |             4 |

---

# One-Lane Road Rule

When:

```txt
laneCount = 1
```

Expected result:

```txt
No divider lines are drawn.
```

Reason:

```txt
A single lane has no adjacent lane to divide from.
```

---

# Default MVP Example

Given:

```txt
centerX = 400
width = 360
laneCount = 3
topY = -2000
bottomY = 900
```

Generated divider lines:

```ts
[
  {
    startX: 340,
    startY: -2000,
    endX: 340,
    endY: 900,
    kind: "divider",
  },
  {
    startX: 460,
    startY: -2000,
    endX: 460,
    endY: 900,
    kind: "divider",
  },
];
```

---

# Visual Theme

Divider styling should follow the Tesla FSD + Mission Control direction.

Recommended style:

```txt
Thin dashed slate/white lines.
Subtle technical dashboard look.
Readable but not visually dominant.
Different from solid boundary lines.
```

Avoid:

```txt
Thick arcade borders.
Neon pixel-road styling.
Overly bright visual noise.
```

---

# Recommended Defaults

```ts
dividerColor: "rgb(148 163 184)";
dividerLineWidth: 2;
dividerDash: [18, 18];
```

---

# Dash Rendering

Divider lines should be dashed.

Canvas API:

```ts
context.setLineDash([18, 18]);
```

After drawing, the dash state must be reset:

```ts
context.setLineDash([]);
```

---

# Why Dash Reset Matters

Canvas context is stateful.

If line dash is not reset, later renderers may accidentally draw dashed:

```txt
Road boundaries
Car outline
Sensor rays
Debug overlays
HUD lines
```

Dash reset prevents style leakage.

---

# Render Order

Inside full road rendering:

```txt
1. Road surface
2. Road boundaries
3. Lane dividers
4. Optional center guide
```

This keeps dividers visible above the road surface but less dominant than road boundaries.

---

# Boundary vs Divider

Boundary:

```txt
Road edge
Solid line
Potential future collision / departure reference
```

Divider:

```txt
Lane marking
Dashed line
Visual guidance
Not a hard collision boundary in MVP
```

Both can use `RoadLine`, but their `kind` and style must remain different.

---

# Testing Expectations

## Positive Tests

Verify:

```txt
3-lane road draws 2 dividers.
4-lane road draws 3 dividers.
Divider lines are drawn from generated data.
Divider lines use dashed styling.
Divider lines have kind = "divider".
Divider styling differs from boundary styling.
Dash state is reset after drawing.
Road model is not mutated.
```

---

## Negative Tests

Verify:

```txt
Invalid lane count throws.
Invalid road width throws.
Invalid vertical bounds throw.
NaN values throw.
Infinity values throw.
```

---

## Edge Cases

Verify:

```txt
1-lane road draws 0 dividers.
2-lane road draws 1 divider.
Fractional road width creates stable divider positions.
Very wide road remains deterministic.
Very narrow road remains deterministic.
```

---

# Acceptance Criteria

This task is complete when:

```txt
Divider lines are drawn from generated divider data.
Number of divider lines equals laneCount - 1.
laneCount = 1 produces no divider rendering.
Dividers are visually different from road boundaries.
Divider lines are dashed.
Line dash state is reset after drawing.
Tests verify divider count for 1-lane and 3-lane roads.
```

---

# Traceability KPI

```txt
Lane divider visuals are generated from lane count, not hardcoded.
```

Success means:

```txt
No hardcoded divider X positions exist in renderer code.
No hardcoded divider count exists in renderer code.
Renderer consumes getLaneDividerLines().
```

---

# Engineering Lessons Learned

## Dividers Are Visual Geometry

Lane divider lines describe the road visually.

They should not be treated as walls or collision barriers in the MVP.

This distinction keeps physics clean.

---

## Renderer Consumes, Domain Calculates

Correct flow:

```txt
Road model
   ↓
getLaneDividerLines()
   ↓
drawLaneDividers()
   ↓
Canvas
```

Wrong flow:

```txt
Renderer calculates lane count.
Renderer invents divider X positions.
Renderer duplicates lane geometry.
```

---

## Canvas State Must Be Reset

Canvas drawing state leaks unless reset.

A clean renderer must protect later rendering steps from previous styling.

That is why `setLineDash([])` matters.

---

# Future Extensions

This design can support:

```txt
Dashed lane markings
Solid lane markings
Double divider lines
Road shoulders
Bus lanes
Bike lanes
Construction lane closures
Dynamic lane markings
Scenario-specific lane styles
```

Because divider geometry comes from the model and divider style comes from renderer options, future changes can be made without rewriting core road logic.
