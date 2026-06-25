# Road Width and Horizontal Position

## Purpose

The road's horizontal layout is defined by two canonical fields:

```ts
centerX: number;
width: number;
```

These fields are the only source of truth for the road's horizontal position and size.

The goal is to ensure that:

- Rendering uses the same road geometry as physics.
- Sensors use the same road geometry as AI.
- Tests use the same road geometry as production code.
- No hardcoded road dimensions exist outside the road model.

---

# File Location

```txt
src/simulation/world/road.ts
```

---

# Architectural Principle

Store facts.

Derive calculations.

Facts:

```txt
centerX
width
```

Calculations:

```txt
leftEdgeX
rightEdgeX
laneWidth
laneCenters
```

Correct:

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

Incorrect:

```txt
Renderer stores road edges

Physics stores road edges

Sensors store road edges
```

That creates multiple sources of truth and eventually causes bugs.

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
┌────────────────────────► X
│
│
│
▼
Y
```

---

# Road Horizontal Geometry

Recommended interface:

```ts
export interface RoadHorizontalGeometry {
  centerX: number;
  width: number;
}
```

This interface represents the minimum information required to determine where the road exists horizontally.

---

# centerX

## Definition

The horizontal center of the road.

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
The road is centered at X = 400.
```

---

## Why Use a Center?

Using a center point makes future camera systems easier.

Instead of storing:

```txt
leftEdgeX
rightEdgeX
```

you store:

```txt
centerX
width
```

and derive everything else.

Benefits:

```txt
Simpler camera movement
Simpler resizing
Simpler scenario generation
Less duplicated state
```

---

# width

## Definition

Total horizontal width of the road.

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
The road spans 360 pixels from left edge to right edge.
```

---

## Width Rules

Width must be:

```txt
Finite
Positive
Greater than 0
```

Allowed:

```txt
1
100
360
500
```

Rejected:

```txt
0
-1
NaN
Infinity
-Infinity
```

---

# Derived Road Edges

Road edges are not stored.

They are calculated.

Formula:

```txt
leftEdgeX = centerX - width / 2

rightEdgeX = centerX + width / 2
```

---

## Example 1

```txt
centerX = 400
width = 360
```

Calculation:

```txt
leftEdgeX = 400 - 180 = 220

rightEdgeX = 400 + 180 = 580
```

Result:

```txt
220 ─────────────────────── 580
              400
```

---

## Example 2

```txt
centerX = 500
width = 200
```

Calculation:

```txt
leftEdgeX = 400

rightEdgeX = 600
```

---

## Example 3

```txt
centerX = 100.5
width = 50.5
```

Calculation:

```txt
leftEdgeX = 75.25

rightEdgeX = 125.75
```

This confirms that fractional coordinates are supported.

---

# Helper Functions

Recommended API:

```ts
export function getRoadLeftEdgeX(geometry: RoadHorizontalGeometry): number;
```

```ts
export function getRoadRightEdgeX(geometry: RoadHorizontalGeometry): number;
```

```ts
export function getRoadHorizontalEdges(geometry: RoadHorizontalGeometry): {
  leftEdgeX: number;
  rightEdgeX: number;
};
```

---

# Why Edges Are Derived

Do not store:

```ts
leftEdgeX: number;
rightEdgeX: number;
```

because they can become inconsistent.

Example problem:

```txt
width changes

leftEdgeX not updated

rightEdgeX not updated
```

Now the road is invalid.

Instead:

```txt
Store centerX
Store width

Derive everything else
```

Benefits:

```txt
Single source of truth
Fewer bugs
Less synchronization
Easier testing
```

---

# Validation Rules

## centerX

Must be:

```txt
Finite number
```

Allowed:

```txt
0
400
1000
-500
```

Rejected:

```txt
NaN
Infinity
-Infinity
```

---

## width

Must be:

```txt
Finite
Positive
```

Allowed:

```txt
1
100
360
0.5
```

Rejected:

```txt
0
-1
NaN
Infinity
```

---

# Renderer Contract

The renderer must consume road geometry.

Correct:

```ts
const leftEdge = getRoadLeftEdgeX(road);
const rightEdge = getRoadRightEdgeX(road);
```

Incorrect:

```ts
const leftEdge = 220;
const rightEdge = 580;
```

No hardcoded road boundaries should exist inside rendering code.

---

# Physics Contract

Future physics systems must use:

```txt
Road.centerX
Road.width
```

to determine:

```txt
Lane position
Road departure
Boundary checks
```

Physics must never invent separate road dimensions.

---

# Sensor Contract

Future sensors will derive road boundaries from:

```txt
centerX
width
```

This guarantees:

```txt
Sensors
Physics
Renderer
AI
```

all agree on the same road.

---

# Testing Expectations

## Positive Tests

Verify:

```txt
Default centerX exists.
Default width exists.
Left edge calculation works.
Right edge calculation works.
Horizontal edge helper works.
Fractional values work.
```

---

## Negative Tests

Verify:

```txt
Width = 0 rejected.
Width < 0 rejected.
NaN rejected.
Infinity rejected.
Invalid centerX rejected.
```

---

## Edge Cases

Verify:

```txt
Very small width.
Very large width.
Negative centerX.
Fractional centerX.
Fractional width.
```

Expected:

```txt
Stable calculations.
No crashes.
No invalid geometry.
```

---

## Corner Cases

Verify:

```txt
width = Number.MAX_SAFE_INTEGER
centerX = very large coordinate
```

Expected:

```txt
Deterministic edge calculations.
No NaN propagation.
```

---

# Acceptance Criteria

This task is complete when:

```txt
Road width is measured in pixels.
Road has a clear horizontal center.
centerX exists.
width exists.
Left edge is derived.
Right edge is derived.
Width must be greater than 0.
Validation exists.
Unit tests pass.
Renderer contains no hardcoded road edges.
```

---

# Traceability KPI

```txt
Road boundaries are calculated from a single road width source.
```

Success means:

```txt
100% of horizontal road geometry originates from:

centerX
width
```

and nowhere else.

---

# Engineering Lessons Learned

## Geometry Ownership Matters

A common mistake in simulation projects is allowing every subsystem to invent geometry.

Example:

```txt
Renderer uses width 360

Physics uses width 400

Sensors use width 350
```

Now the simulation disagrees with itself.

Instead:

```txt
Road owns geometry.
```

Everyone else consumes it.

---

## Derived Data Beats Stored Data

Bad:

```txt
Store centerX
Store width
Store leftEdgeX
Store rightEdgeX
```

Good:

```txt
Store centerX
Store width
```

Then derive:

```txt
leftEdgeX
rightEdgeX
```

Benefits:

```txt
Less state
Less synchronization
Less technical debt
Better maintainability
```

---

## This Is the Foundation of the World Model

Everything that follows depends on this task:

```txt
Lane Layout
Road Rendering
Road Boundaries
Car Spawning
Camera Follow
Collision Detection
Sensors
Traffic Cars
Pathfinding
Scenario Editor
```

A clean width-and-position model now prevents expensive refactoring later.
