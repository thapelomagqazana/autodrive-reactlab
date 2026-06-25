# Road Domain Model

## Purpose

The Road Domain Model is the single source of truth for all road geometry in AutoDrive ReactLab.

Its responsibility is to define:

- Road position
- Road dimensions
- Lane layout
- Road boundaries
- Lane dividers
- Lane center positions

The road model must not contain rendering logic.

The road model provides geometry data that can be consumed by:

```txt
Canvas Renderer
Vehicle Physics
Sensors
Collision Detection
AI Navigation
Telemetry
Testing
Future Scenario Editor
```

---

# File Location

```txt
src/simulation/world/road.ts
```

---

# Architectural Goal

The road model owns layout.

Everything else consumes layout.

Correct architecture:

```txt
Road Model
     ↓
Derived Geometry
     ↓
Renderer
Physics
Sensors
AI
Tests
```

Incorrect architecture:

```txt
Renderer invents lane positions
Physics invents boundaries
Sensors invent road edges
```

That creates multiple sources of truth and increases technical debt.

---

# Coordinate System

The road uses canvas-space coordinates.

Convention:

```txt
Origin = Top Left

Positive X = Right

Positive Y = Down

Units = Pixels
```

Example:

```txt
(0,0)
┌────────────────────► X
│
│
│
▼
Y
```

---

# Road Interface

```ts
export interface Road {
  centerX: number;

  width: number;

  laneCount: number;

  topY: number;

  bottomY: number;
}
```

---

# Field Definitions

## centerX

Road center position.

Unit:

```txt
pixels
```

Example:

```ts
centerX: 400;
```

Meaning:

```txt
Road is centered horizontally at X = 400.
```

---

## width

Total road width.

Unit:

```txt
pixels
```

Example:

```ts
width: 360;
```

Meaning:

```txt
Road spans 360 pixels.
```

---

## laneCount

Number of drivable lanes.

Example:

```ts
laneCount: 3;
```

Meaning:

```txt
Three lanes.
```

---

## topY

Upper road boundary.

Unit:

```txt
pixels
```

Example:

```ts
topY: -2000;
```

Allows the road to extend beyond the visible canvas.

---

## bottomY

Lower road boundary.

Unit:

```txt
pixels
```

Example:

```ts
bottomY: 900;
```

---

# Default Road

Recommended MVP configuration:

```ts
export const DEFAULT_ROAD = {
  centerX: 400,
  width: 360,
  laneCount: 3,
  topY: -2000,
  bottomY: 900,
};
```

---

# Road Boundaries

Road edges are derived.

Formula:

```txt
leftEdgeX  = centerX - width / 2

rightEdgeX = centerX + width / 2
```

Example:

```txt
centerX = 400
width = 360
```

Result:

```txt
leftEdgeX  = 220

rightEdgeX = 580
```

---

# Lane Width

Lane width is derived.

Formula:

```txt
laneWidth = width / laneCount
```

Example:

```txt
360 / 3 = 120
```

Result:

```txt
Lane width = 120 pixels
```

---

# Lane Centers

Lane centers are critical because:

```txt
Car spawning
AI navigation
Lane following
Path planning
Camera alignment
```

Formula:

```txt
laneCenterX =
leftEdgeX +
laneWidth × (laneIndex + 0.5)
```

Example:

```txt
Road width = 360

Lane count = 3

Lane width = 120

Left edge = 220
```

Lane centers:

```txt
Lane 0 = 280

Lane 1 = 400

Lane 2 = 520
```

---

# RoadLine Model

Road geometry is represented using line segments.

```ts
export interface RoadLine {
  startX: number;
  startY: number;

  endX: number;
  endY: number;

  kind: "boundary" | "divider";
}
```

---

# Boundary Lines

Boundary lines represent road edges.

Example:

```txt
Left Edge
│
│
│

Right Edge
│
│
│
```

Output:

```ts
kind: "boundary";
```

These are later reused by:

```txt
Collision Detection
Sensors
Lane Departure Logic
```

---

# Divider Lines

Divider lines separate lanes.

Example:

```txt
│ Lane 0 │ Lane 1 │ Lane 2 │
```

Output:

```ts
kind: "divider";
```

These are initially visual.

Future phases may use them for:

```txt
Lane Following
AI Navigation
Road Rules
```

---

# Factory Function

Road instances must be created through:

```ts
createInitialRoad();
```

Example:

```ts
const road = createInitialRoad();
```

Benefits:

```txt
Centralized defaults
Deterministic tests
Consistent reset behaviour
```

---

# Validation Rules

A valid road satisfies:

## centerX

```txt
Finite number
```

Allowed:

```txt
0
400
1000
```

Rejected:

```txt
NaN
Infinity
```

---

## width

```txt
Positive number
```

Allowed:

```txt
1
100
360
```

Rejected:

```txt
0
-1
```

---

## laneCount

```txt
Positive integer
```

Allowed:

```txt
1
2
3
4
```

Rejected:

```txt
0
-1
1.5
```

---

## Vertical Bounds

Rule:

```txt
bottomY > topY
```

Allowed:

```txt
topY = -2000
bottomY = 900
```

Rejected:

```txt
topY = 900
bottomY = 0
```

---

# Rendering Contract

Renderers must consume road geometry.

Correct:

```ts
drawRoad(road);
```

Incorrect:

```ts
const roadWidth = 360;

const laneCount = 3;
```

Hardcoded geometry is forbidden outside the road model.

---

# Physics Contract

Future physics systems must consume:

```txt
Road boundaries
Lane centers
Road width
```

from the Road model.

Physics must never invent its own geometry.

---

# Sensor Contract

Future sensor rays will use:

```txt
Boundary lines
Divider lines
```

for detection.

This ensures:

```txt
Renderer
Physics
Sensors
```

all agree on the same world.

---

# Testing Expectations

## Positive Tests

Verify:

```txt
Road creation works.
Lane width calculation works.
Lane center calculation works.
Boundary generation works.
Divider generation works.
```

---

## Negative Tests

Verify:

```txt
Width <= 0 rejected.
Lane count <= 0 rejected.
Invalid lane index rejected.
bottomY <= topY rejected.
NaN rejected.
Infinity rejected.
```

---

## Edge Cases

Verify:

```txt
One lane road.
Very narrow road.
Very wide road.
Single divider.
No divider.
```

---

## Corner Cases

Verify:

```txt
100 lanes.
Huge road width.
Very large coordinates.
```

Expected:

```txt
Stable calculations.
No crashes.
No NaN propagation.
```

---

# Acceptance Criteria

This task is complete when:

```txt
Road model is strongly typed.
Road uses canvas-space coordinates.
Road width is configurable.
Lane count is configurable.
Lane width is derived.
Lane centers are derived.
Boundary lines are generated.
Divider lines are generated.
Factory function exists.
Unit tests pass.
No renderer contains hardcoded road geometry.
```

---

# Traceability KPI

```txt
100% of road layout values come from the Road model.
```

Success means:

```txt
Renderer uses Road.

Physics uses Road.

Sensors use Road.

Tests use Road.

No duplicate road geometry exists elsewhere.
```

---

# Engineering Lessons Learned

## Geometry Must Live in One Place

The most common simulator mistake is:

```txt
Renderer knows road width.

Physics knows road width.

AI knows road width.

Sensors know road width.
```

Each system eventually drifts.

Instead:

```txt
Road owns geometry.
```

Everyone else consumes it.

---

## Derived Data Is Better Than Stored Data

Do not store:

```txt
leftEdgeX
rightEdgeX
laneWidth
```

inside Road.

Store:

```txt
centerX
width
laneCount
```

Then derive the rest.

Benefits:

```txt
Less state
Less synchronization
Less technical debt
Fewer bugs
```

---

## This Becomes the Foundation for Everything

Future phases will build on this model:

```txt
Road Rendering
Lane Following
Road Boundary Detection
Obstacle Placement
Traffic Cars
Pathfinding
Intersections
Roundabouts
Highways
Scenario Editor
```

A strong road model now prevents expensive rewrites later.
