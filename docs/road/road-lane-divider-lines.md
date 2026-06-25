# Road Lane Divider Lines

## Purpose

Lane divider lines define the visual markings that separate adjacent traffic lanes.

Unlike road boundaries, lane divider lines **do not define the edge of the drivable road**. Instead, they communicate lane organization to drivers, AI systems, and debugging tools.

Lane divider geometry is derived entirely from the Road Domain Model.

The same generated divider data should be reused by:

- Road renderer
- Debug overlays
- Lane-following visualization
- Future perception sensors
- Future autonomous driving AI
- Scenario editor
- Telemetry tools

No subsystem should manually calculate divider positions.

---

# File Location

```txt
src/simulation/world/road.ts
```

---

# RoadLine Type

Lane divider lines use the shared `RoadLine` type.

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

Using a common type allows renderers to draw all road geometry while preserving semantic meaning through the `kind` property.

---

# Divider Definition

A lane divider separates two adjacent lanes.

For the Phase 1 MVP:

- Divider lines are vertical.
- Divider lines extend from `road.topY` to `road.bottomY`.
- Divider lines never exist outside the road boundaries.

Example:

```txt
Boundary | Lane 1 | Divider | Lane 2 | Divider | Lane 3 | Boundary
```

---

# Coordinate System

Divider lines use canvas/world coordinates.

```txt
Origin = top-left

Positive X = right

Positive Y = down

Units = pixels
```

---

# Divider Count Rule

Divider count is always derived.

Formula:

```txt
dividerCount = laneCount - 1
```

Examples:

| Lane Count | Divider Count |
| ---------- | ------------- |
| 1          | 0             |
| 2          | 1             |
| 3          | 2             |
| 4          | 3             |
| 5          | 4             |
| 6          | 5             |

The divider count is never stored independently.

---

# Divider Position Formula

Divider positions are calculated using lane geometry.

Definitions:

```txt
laneWidth = road.width / road.laneCount
```

Road edge:

```txt
leftEdgeX =
road.centerX - road.width / 2
```

Divider X:

```txt
dividerX =
leftEdgeX +
laneWidth × (dividerIndex + 1)
```

Where:

```txt
dividerIndex = 0 ... dividerCount - 1
```

---

# Example

Road:

```txt
centerX = 400

width = 360

laneCount = 3
```

Derived:

```txt
leftEdgeX = 220

laneWidth = 120
```

Divider positions:

```txt
Divider 0 = 340

Divider 1 = 460
```

Generated geometry:

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

# Helper Functions

Recommended API:

```ts
export function getLaneDividerCount(laneCount: number): number;
```

```ts
export function createLaneDividerLine(
  dividerX: number,
  topY: number,
  bottomY: number,
): RoadLine;
```

```ts
export function getLaneDividerLines(road: Road): RoadLine[];
```

---

# Behaviour Rules

## Rule 1

Divider lines exist only between lanes.

Therefore:

```txt
1 lane
↓

0 divider lines
```

---

## Rule 2

Divider positions are derived.

Never hardcode:

```txt
340

460

580
```

Always calculate them.

---

## Rule 3

Divider lines are visual markings.

They are **not**:

- Walls
- Collision boundaries
- Sensor blockers
- Physical barriers

Future features may change this behaviour, but the MVP treats them as informational geometry only.

---

# Renderer Contract

Correct:

```ts
const dividerLines = getLaneDividerLines(road);

for (const line of dividerLines) {
  drawLine(line);
}
```

Incorrect:

```ts
drawVerticalLine(340);
drawVerticalLine(460);
```

The renderer should consume generated geometry, not recreate it.

---

# Physics Contract

Current MVP:

```txt
Divider lines have no collision behaviour.
```

Future:

They may support:

- Lane departure detection
- Lane keeping
- AI path alignment

Physics must not assume divider lines are walls.

---

# AI Contract

Future autonomous driving logic will use divider geometry for:

- Lane centering
- Lane following
- Lane changes
- Overtaking
- Risk scoring

AI should consume the generated divider data instead of recalculating divider positions.

---

# Scenario Editor Contract

Future custom roads should only define:

```txt
Road width

Lane count
```

Divider geometry must be generated automatically.

---

# Validation Rules

Divider generation rejects:

```txt
Invalid lane count

NaN coordinates

Infinity coordinates

Invalid vertical bounds

bottomY <= topY
```

Expected failure:

```txt
RangeError
```

---

# Testing Expectations

## Positive Tests

Verify:

```txt
Divider count equals laneCount - 1.

Three-lane road creates two dividers.

Four-lane road creates three dividers.

One-lane road creates zero dividers.

Divider kind equals "divider".

Divider X positions are correct.

Fractional lane widths work correctly.

Custom road dimensions work correctly.
```

---

## Negative Tests

Verify rejection of:

```txt
laneCount = 0

laneCount < 0

Fractional lane counts

NaN

Infinity

Invalid vertical bounds
```

---

## Edge Cases

Verify:

```txt
One lane

Two lanes

Very wide road

Very narrow road

Fractional road width

Fractional centerX
```

Expected:

```txt
Stable divider calculations

No duplicated geometry

No NaN propagation
```

---

## Corner Cases

Verify:

```txt
100-lane road

Extremely large road widths

Large imported scenarios
```

Expected:

```txt
Deterministic calculations

Correct divider count

Correct divider ordering
```

---

# Acceptance Criteria

Task completion requires:

```txt
RoadLine supports divider kind.

getLaneDividerCount() exists.

createLaneDividerLine() exists.

getLaneDividerLines() exists.

Divider count equals laneCount - 1.

Divider positions are derived.

No divider lines for one-lane roads.

Divider kind is "divider".

Renderer consumes generated divider data.

All unit tests pass.
```

---

# Traceability KPI

```txt
Lane visual markings are generated from road data, not manually duplicated.
```

Success means:

```txt
100% of lane divider geometry is derived from:

Road.width

Road.centerX

Road.laneCount

Nothing else.
```

---

# Engineering Lessons Learned

## Geometry Should Be Derived, Not Stored

Never store divider positions.

Store:

```txt
Road width

Road center

Lane count
```

Everything else can be calculated.

This prevents synchronization bugs when the road changes.

---

## Semantics Matter

Although boundaries and dividers share the same `RoadLine` structure, they represent different concepts.

```txt
Boundary
↓

Road edge
Collision candidate

Divider
↓

Lane marking
Visual guidance
```

Using the `kind` field preserves this distinction while keeping the renderer simple.

---

## Shared Geometry Eliminates Drift

If rendering, AI, sensors, and debugging each calculate divider positions independently, inconsistencies inevitably appear.

The correct architecture is:

```txt
Road Domain Model
        │
        ▼
Lane Divider Generator
        │
        ├────────► Renderer
        ├────────► Sensors
        ├────────► AI
        ├────────► Debug Overlay
        └────────► Scenario Editor
```

A single source of truth ensures every subsystem sees the same road geometry.

---

## Foundation for Future Features

This design naturally supports:

```txt
Dashed lane markings

Solid lane markings

Double divider lines

Highway lane markings

Construction zones

Reversible lanes

Bus lanes

Bike lanes

Dynamic lane closures

Procedurally generated roads
```

Because divider geometry is derived rather than hardcoded, these future features become configuration changes instead of architectural rewrites.
