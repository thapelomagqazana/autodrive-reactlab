# Road Boundary Lines

## Purpose

Road boundary lines define the left and right edges of the drivable road area.

They are shared road geometry data used by:

- Road rendering
- Future sensor detection
- Future road-departure checks
- Future collision rules
- Debug overlays
- Telemetry systems
- AI lane-safety logic

Boundary lines must come from the Road Domain Model, not from hardcoded renderer values.

---

# File Location

```txt
src/simulation/world/road.ts
```

---

# RoadLine Type

```ts
export type RoadLineKind = "boundary" | "divider";

export interface RoadLine {
  startX: number;
  startY: number;

  endX: number;
  endY: number;

  kind: RoadLineKind;
}
```

---

# Boundary Line Definition

For the Phase 1 MVP straight-road scenario, boundary lines are vertical line segments.

They represent:

```txt
Left road edge
Right road edge
```

Each boundary line runs from:

```txt
road.topY
```

to:

```txt
road.bottomY
```

The X coordinate stays the same from start to end.

---

# Coordinate System

Road boundary lines use canvas/world coordinates.

```txt
Origin = top-left
Positive X = right
Positive Y = down
Units = pixels
```

Example:

```txt
(0,0)
┌──────────────────────► X
│
│
│
▼
Y
```

---

# Boundary Derivation

Boundary X positions are derived from the road model.

```txt
leftEdgeX = road.centerX - road.width / 2

rightEdgeX = road.centerX + road.width / 2
```

No renderer should manually calculate or hardcode these values unless it is calling the road helper functions.

---

# Example

Given:

```txt
centerX = 400
width = 360
topY = -2000
bottomY = 900
```

Derived:

```txt
leftEdgeX = 220
rightEdgeX = 580
```

Boundary lines:

```ts
[
  {
    startX: 220,
    startY: -2000,
    endX: 220,
    endY: 900,
    kind: "boundary",
  },
  {
    startX: 580,
    startY: -2000,
    endX: 580,
    endY: 900,
    kind: "boundary",
  },
];
```

---

# Helper Functions

Recommended API:

```ts
export function createRoadBoundaryLine(
  edgeX: number,
  topY: number,
  bottomY: number,
): RoadLine;
```

```ts
export function getRoadBoundaryLines(road: Road): RoadLine[];
```

Expected order:

```txt
1. Left boundary
2. Right boundary
```

---

# Design Rules

## Rule 1: Boundary Lines Are Domain Data

Boundary lines are not merely visual strokes.

They are world geometry.

They should be consumed by:

```txt
Renderer
Sensors
Collision Detection
Road Departure Logic
AI Safety Rules
```

---

## Rule 2: Renderers Must Not Hardcode Boundaries

Correct:

```ts
const boundaryLines = getRoadBoundaryLines(road);
```

Incorrect:

```ts
const leftBoundaryX = 220;
const rightBoundaryX = 580;
```

---

## Rule 3: Boundaries Must Be Derived

Boundary lines must be derived from:

```txt
road.centerX
road.width
road.topY
road.bottomY
```

They must not be duplicated as independent state.

---

# Validation Rules

Boundary generation must reject invalid geometry.

Invalid inputs include:

```txt
NaN edge coordinates
Infinity edge coordinates
NaN topY
NaN bottomY
Infinity topY
Infinity bottomY
bottomY <= topY
road.width <= 0
road.laneCount <= 0
```

Expected failure type:

```txt
RangeError
```

---

# Rendering Contract

The road renderer should draw boundary lines from generated road data.

Example:

```ts
const boundaryLines = getRoadBoundaryLines(road);

for (const line of boundaryLines) {
  context.beginPath();
  context.moveTo(line.startX, line.startY);
  context.lineTo(line.endX, line.endY);
  context.stroke();
}
```

The renderer should care about visual style.

The road model should care about geometry.

---

# Sensor Contract

Future sensor systems should detect road edges using the same boundary data.

Correct:

```txt
Sensor rays intersect RoadLine boundary data.
```

Incorrect:

```txt
Sensors define their own road edge values.
```

This keeps perception aligned with rendering.

---

# Collision / Road Departure Contract

Future road-departure checks should use road boundary geometry.

Example:

```txt
carLeftEdge < leftBoundaryX
carRightEdge > rightBoundaryX
```

The boundary data becomes the shared reference for visual and physical road limits.

---

# Testing Expectations

## Positive Tests

Verify:

```txt
Two boundary lines are generated.
Left boundary is first.
Right boundary is second.
Both lines are vertical.
Both lines have kind "boundary".
Left boundary X equals left road edge.
Right boundary X equals right road edge.
Boundary lines use topY and bottomY.
Custom road dimensions are supported.
Fractional coordinates are supported.
```

---

## Negative Tests

Verify rejection of:

```txt
NaN edgeX
Infinity edgeX
NaN topY
NaN bottomY
bottomY <= topY
Invalid road width
Invalid lane count
```

---

## Edge Cases

Verify:

```txt
Very narrow road.
Very wide road.
Negative topY.
Fractional centerX.
Fractional width.
Fractional topY and bottomY.
```

Expected:

```txt
Stable boundary calculations.
No NaN propagation.
No hardcoded values.
```

---

# Acceptance Criteria

This task is complete when:

```txt
RoadLine type exists.
getRoadBoundaryLines() exists.
Boundary lines are derived from road dimensions.
Boundary lines are not hardcoded in renderer.
Boundary line kind is marked as "boundary".
Tests verify left and right boundary X-values.
Invalid geometry is rejected.
```

---

# Traceability KPI

```txt
Road edge rendering and future collision rules use the same boundary data.
```

Success means:

```txt
Renderer consumes RoadLine boundary data.
Sensors consume RoadLine boundary data.
Road-departure logic consumes RoadLine boundary data.
No subsystem invents separate road boundaries.
```

---

# Engineering Lessons Learned

## Boundaries Are More Than Lines

At first, road boundaries look like a rendering detail.

They are not.

They eventually become:

```txt
Sensor targets
Collision references
Road departure rules
AI safety constraints
Debug overlays
```

That is why they belong in the road domain model.

---

## One Boundary Source Prevents Drift

If the renderer uses one boundary, sensors use another boundary, and collision logic uses a third boundary, the simulator will lie to itself.

Example failure:

```txt
Renderer shows car inside the road.
Collision system thinks car is off-road.
Sensor system detects a boundary somewhere else.
```

A single generated `RoadLine[]` prevents this.

---

## Geometry Should Be Shared, Style Should Not

The road model owns geometry.

The renderer owns style.

Correct separation:

```txt
Road Model:
startX, startY, endX, endY, kind

Renderer:
color, line width, dash pattern, glow
```

This keeps the codebase clean and futureproof.
