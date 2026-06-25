# Road Lane Count

## Purpose

`laneCount` defines the number of drivable lanes on a road.

It is one of the fundamental properties of the Road Domain Model and serves as the single source of truth for lane-related calculations throughout AutoDrive ReactLab.

From this single value, the simulator derives:

- Lane width
- Lane center positions
- Lane divider count
- Lane divider positions
- Vehicle spawn lanes
- AI lane selection
- Future lane-changing behaviour
- Traffic generation
- Path planning

The road model owns `laneCount`.

No other subsystem should redefine it.

---

# File Location

```txt
src/simulation/world/road.ts
```

---

# Domain Model

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

# Definition

`laneCount` represents the total number of drivable lanes across the width of the road.

Unit:

```txt
count
```

Unlike width or position, lane count is dimensionless.

---

# MVP Default

The Phase 1 MVP uses:

```ts
laneCount: 3;
```

Why three lanes?

```txt
Left lane
Center lane
Right lane
```

Advantages:

- Center lane provides a natural spawn position.
- Lane calculations are easy to verify.
- Lane-following behaviour is visually clear.
- Future overtaking scenarios become possible.

---

# Design Rules

`laneCount` must satisfy:

```txt
Positive
Integer
Finite
```

Valid examples:

```txt
1
2
3
4
5
10
```

Invalid examples:

```txt
0
-1
2.5
NaN
Infinity
-Infinity
```

---

# Why Positive Integers?

A road cannot logically contain:

```txt
0 lanes
-3 lanes
2.7 lanes
```

Using positive integers prevents ambiguous world geometry.

---

# Validation

Recommended helper:

```ts
export function isValidLaneCount(value: number): boolean;
```

Returns:

```txt
true
```

when:

```txt
Number.isInteger(value)
&& value > 0
```

---

Recommended assertion:

```ts
export function assertValidLaneCount(laneCount: number): void;
```

Throws:

```txt
RangeError
```

for invalid values.

---

# Normalization

Future Scenario Editor and JSON import features may receive invalid values.

Recommended helper:

```ts
normalizeLaneCount(value, fallback);
```

Rules:

```txt
Finite positive numbers are floored.

Values below 1 become fallback.

NaN becomes fallback.

Infinity becomes fallback.
```

Example:

|    Input |   Output |
| -------: | -------: |
|        3 |        3 |
|      3.9 |        3 |
|        0 | fallback |
|       -2 | fallback |
|      NaN | fallback |
| Infinity | fallback |

---

# Derived Geometry

Lane count should never be used in isolation.

Instead, it drives derived geometry.

## Lane Width

Formula:

```txt
laneWidth =
road.width / laneCount
```

Example:

```txt
road.width = 360

laneCount = 3

laneWidth = 120
```

---

## Divider Count

Formula:

```txt
dividerCount =
laneCount - 1
```

Examples:

| Lanes | Divider Lines |
| ----: | ------------: |
|     1 |             0 |
|     2 |             1 |
|     3 |             2 |
|     4 |             3 |
|     5 |             4 |

This means divider lines are derived, not stored.

---

## Lane Centers

Lane centers are also derived.

Formula:

```txt
laneCenterX =
leftEdge +
laneWidth × (laneIndex + 0.5)
```

Example:

```txt
Road width = 360

Lane count = 3

Lane width = 120
```

Lane centers:

```txt
280
400
520
```

---

# One-Lane Roads

Special case:

```txt
laneCount = 1
```

Expected behaviour:

```txt
No divider lines.

Single lane center.

Entire road is drivable.
```

This is useful for:

- Narrow roads
- Country roads
- Tutorial scenarios

---

# Future Scalability

Although the MVP uses three lanes, the model supports any positive integer.

Examples:

```txt
1 lane
2 lanes
3 lanes
4 lanes
6 lanes
8-lane highway
```

No renderer changes should be required.

---

# Renderer Contract

The renderer must consume:

```txt
laneCount
```

and derive:

```txt
Lane width

Divider count

Divider positions
```

The renderer must never contain:

```ts
const laneCount = 3;
```

Hardcoded lane counts are forbidden.

---

# Physics Contract

Future physics systems will use:

```txt
laneCount
```

for:

- Lane boundaries
- Lane departure detection
- Lane alignment
- Vehicle positioning

Physics must never invent its own lane count.

---

# AI Contract

Future autonomous driving logic will consume:

```txt
laneCount
```

for:

- Lane following
- Lane selection
- Overtaking
- Safe lane changes
- Route planning

AI should not assume a three-lane road.

---

# Testing Expectations

## Positive Tests

Verify:

```txt
Default lane count is 3.

Lane count exists.

Lane count is positive.

Lane count is integer.

Lane width derives correctly.

Divider count derives correctly.

One-lane roads create zero dividers.
```

---

## Negative Tests

Verify:

```txt
0 rejected.

Negative values rejected.

Fractional values rejected.

NaN rejected.

Infinity rejected.
```

---

## Edge Cases

Verify:

```txt
1 lane.

2 lanes.

100 lanes.

Very narrow roads.

Very wide roads.
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
Number.MAX_SAFE_INTEGER lanes (validation only).

Large imported JSON scenarios.

Custom scenario editor input.
```

Expected:

```txt
Deterministic validation.

Safe normalization.

No NaN propagation.
```

---

# Acceptance Criteria

This task is complete when:

```txt
laneCount exists on the Road model.

laneCount is documented as a positive integer.

Default laneCount is 3.

Validation helpers exist.

Normalization helper exists.

Lane width derives from laneCount.

Divider count derives from laneCount.

One-lane roads generate zero dividers.

All unit tests pass.

No renderer contains hardcoded lane counts.
```

---

# Traceability KPI

```txt
Lane layout is derived from laneCount.
```

Success means:

```txt
100% of lane geometry is generated from:

Road.width

Road.laneCount

Nothing else.
```

---

# Engineering Lessons Learned

## Store Rules, Not Results

A common mistake is storing:

```txt
Lane width

Divider count

Divider positions

Lane centers
```

inside the road model.

Instead, store only:

```txt
Road width

Lane count
```

Everything else should be derived.

This minimizes state and prevents synchronization bugs.

---

## Lane Count Is a World Rule

`laneCount` is not merely a rendering property.

It influences:

```txt
Road Rendering

Vehicle Spawning

Camera Alignment

Physics

Sensors

Collision Detection

Traffic Simulation

AI Lane Following

Scenario Generation
```

Treat it as a core domain concept, not a UI detail.

---

## This Decision Enables Future Features

A well-designed `laneCount` model scales naturally into:

```txt
Highways

Motorways

Roundabouts

Multi-lane intersections

Dynamic road generation

Scenario editor

Procedural worlds

Autonomous traffic systems
```

Because all downstream geometry is derived from a single authoritative value, adding new road types requires configuration rather than architectural changes.
