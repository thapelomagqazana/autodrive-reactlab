# Road Renderer

## Purpose

`drawRoad()` renders the MVP road onto an existing HTML Canvas 2D rendering context.

The renderer consumes the Road Domain Model and turns road geometry into pixels.

It is responsible for visual output only.

It does not own road data.

It does not create road data.

It does not mutate road data.

---

# File Location

```txt
src/simulation/engine/roadRenderer.ts
```

---

# Public API

```ts
drawRoad(
  context: CanvasRenderingContext2D,
  road: Road,
  options?: DrawRoadOptions,
): void;
```

---

# Responsibilities

`drawRoad()` is responsible for:

```txt
Drawing the road surface.
Drawing road boundary lines.
Drawing lane divider lines.
Drawing optional debug center guide.
Applying road visual style.
Restoring canvas state after drawing.
```

---

# Non-Responsibilities

`drawRoad()` must not:

```txt
Create road state.
Mutate road state.
Resize canvas.
Start the game loop.
Read Zustand directly.
Import React.
Run physics.
Calculate FPS.
Handle keyboard input.
```

---

# Render Order

The recommended render order is:

```txt
1. Road surface
2. Road boundary lines
3. Lane divider lines
4. Optional debug center guide
```

This ensures that markings appear above the road surface.

---

# Geometry Ownership

Road geometry belongs to the Road Domain Model.

The renderer must consume geometry helpers.

Correct:

```ts
const boundaries = getRoadBoundaryLines(road);
const dividers = getLaneDividerLines(road);
```

Incorrect:

```ts
const leftBoundaryX = 220;
const rightBoundaryX = 580;

const dividerA = 340;
const dividerB = 460;
```

Hardcoded road geometry creates technical debt.

---

# Styling Ownership

The renderer owns visual style.

The Road Domain Model owns geometry.

Correct separation:

```txt
Road model:
centerX
width
laneCount
topY
bottomY

Road renderer:
surfaceColor
boundaryColor
dividerColor
lineWidth
dash pattern
```

---

# DrawRoadOptions

```ts
export interface DrawRoadOptions {
  surfaceColor?: string;
  boundaryColor?: string;
  dividerColor?: string;
  boundaryLineWidth?: number;
  dividerLineWidth?: number;
  dividerDash?: number[];
  showCenterGuide?: boolean;
  centerGuideColor?: string;
  centerGuideLineWidth?: number;
}
```

---

# Default Theme

The default road renderer style follows the Tesla FSD + Mission Control direction.

Recommended defaults:

```txt
Dark slate road surface
Light road boundaries
Subtle slate lane dividers
Optional cyan debug guide
```

Example:

```ts
export const DEFAULT_DRAW_ROAD_OPTIONS = {
  surfaceColor: "rgb(15 23 42)",
  boundaryColor: "rgb(226 232 240)",
  dividerColor: "rgb(148 163 184)",
  boundaryLineWidth: 3,
  dividerLineWidth: 2,
  dividerDash: [18, 18],
  showCenterGuide: false,
  centerGuideColor: "rgb(56 189 248)",
  centerGuideLineWidth: 1,
};
```

---

# Canvas State Safety

`drawRoad()` should use:

```ts
context.save();
```

before drawing and:

```ts
context.restore();
```

after drawing.

This prevents road styles from leaking into later renderers such as:

```txt
Car renderer
Sensor renderer
Debug overlays
Traffic renderer
HUD renderer
```

---

# Road Surface Rendering

The road surface should be drawn from derived geometry.

```ts
const leftEdgeX = getRoadLeftEdgeX(road);
const height = road.bottomY - road.topY;

context.fillRect(leftEdgeX, road.topY, road.width, height);
```

The renderer should not calculate unrelated simulation state.

---

# Boundary Rendering

Boundary lines should come from:

```ts
getRoadBoundaryLines(road);
```

Boundary lines represent:

```txt
Left road edge
Right road edge
```

They are shared with future:

```txt
Sensor detection
Collision logic
Road departure checks
```

---

# Divider Rendering

Lane divider lines should come from:

```ts
getLaneDividerLines(road);
```

Divider lines represent:

```txt
Visual lane markings
```

They are not hard collision boundaries in the MVP.

---

# Debug Center Guide

`showCenterGuide` is optional.

Default:

```txt
false
```

The center guide is useful for:

```txt
Road alignment debugging
Camera testing
Car spawn verification
Lane center validation
```

It should not be visible in normal MVP presentation mode unless explicitly enabled.

---

# Testing Expectations

Unit tests should verify:

```txt
drawRoad() accepts context and road.
drawRoad() returns void.
Road surface is drawn.
Boundary lines are drawn.
Divider lines are drawn.
Boundary lines draw before dividers.
Optional center guide can be enabled.
Canvas state is saved and restored.
Road model is not mutated.
Custom style options work.
No React or Zustand dependency exists.
```

---

# Positive Tests

Verify:

```txt
Default road draws one road surface.
Default road draws two boundaries.
Default road draws two dividers.
Custom colors are applied.
Center guide draws when enabled.
```

---

# Negative Tests

Verify:

```txt
Invalid road geometry throws before drawing.
Invalid lane count throws before drawing.
Invalid vertical bounds throws before drawing.
```

---

# Edge Cases

Verify:

```txt
One-lane road draws no dividers.
Very wide road draws correctly.
Fractional road geometry draws correctly.
Debug guide does not draw by default.
```

---

# Traceability KPI

```txt
100% of MVP road visuals are rendered through drawRoad().
```

Success means:

```txt
No component draws road visuals directly.
No canvas module hardcodes road boundaries.
No duplicated road rendering paths exist.
```

---

# Engineering Lessons Learned

## Rendering Is a Consumer

Rendering should consume world geometry.

It should not invent world geometry.

Correct architecture:

```txt
Road Domain Model
        ↓
Road Geometry Helpers
        ↓
Road Renderer
        ↓
Canvas
```

---

## Geometry and Style Are Different Concerns

A common mistake is mixing geometry with style.

Bad:

```txt
Road model stores colors.
Renderer stores lane positions.
```

Good:

```txt
Road model stores geometry.
Renderer stores style.
```

This separation keeps the system maintainable.

---

## Canvas State Must Be Contained

Canvas is stateful.

If one renderer changes:

```txt
strokeStyle
lineWidth
lineDash
fillStyle
transform
```

those changes can affect later renderers.

That is why `save()` and `restore()` are essential.

---

## Why This Reduces Technical Debt

A clean `drawRoad()` function means future systems can be added without rewriting the road renderer.

Future additions may include:

```txt
Curved roads
Road shoulders
Construction zones
Parking lanes
Traffic signs
Crosswalks
Intersections
Roundabouts
Highways
Night mode
Weather effects
```

Because geometry comes from the model and style comes from options, the renderer remains flexible and testable.
