# Road Boundary Violations

## Purpose

Road boundary violation detection determines whether the vehicle is still inside the drivable horizontal road area.

This feature answers one question:

```txt
Is the car off the road?
```

The answer must come from a pure helper function, not from renderer logic.

---

# Scope

This document covers **Phase 1.13.1 — Detect Road Boundary Violations**.

This phase introduces:

```ts
isCarOffRoad(car, road);
```

and supporting edge-calculation helpers.

This phase does **not** implement:

```txt
Collision response
Automatic braking
Car reset
Damage system
Game-over state
Off-road friction
Sensor logic
Visual warning UI
```

Those behaviours can be added later after boundary detection is stable.

---

# Source of Truth

Boundary detection uses:

```txt
CarState.positionX
CarState.width
Road.centerX
Road.width
```

Road left and right edges must be derived from the road model.

Do not hardcode road edges such as:

```ts
220;
580;
```

except in tests where they are expected values derived from the default road.

---

# Coordinate System

The simulation uses canvas/world coordinates:

```txt
Origin = top-left
Positive X = right
Positive Y = down
```

For horizontal road boundary checks, only X geometry is required.

---

# Boundary Formula

Car horizontal body edges:

```ts
carLeftEdgeX = car.positionX - car.width / 2;
carRightEdgeX = car.positionX + car.width / 2;
```

Road horizontal edges:

```ts
roadLeftEdgeX = getRoadLeftEdgeX(road);
roadRightEdgeX = getRoadRightEdgeX(road);
```

Off-road rule:

```ts
offRoad = carLeftEdgeX < roadLeftEdgeX || carRightEdgeX > roadRightEdgeX;
```

Boundary touching is allowed.

That means:

```txt
carLeftEdgeX === roadLeftEdgeX   => on-road
carRightEdgeX === roadRightEdgeX => on-road
```

---

# Recommended File

```txt
src/simulation/engine/roadBoundary.ts
```

---

# Recommended Implementation

```ts
/**
 * Road boundary detection helpers for AutoDrive ReactLab.
 *
 * Responsibility:
 * - Determine whether a vehicle is inside the drivable horizontal road area.
 *
 * Non-responsibilities:
 * - No rendering.
 * - No canvas logic.
 * - No Zustand.
 * - No physics mutation.
 * - No collision response.
 */

import type { Road } from "../world";
import { getRoadLeftEdgeX, getRoadRightEdgeX } from "../world";
import type { CarState } from "../vehicle";

export interface CarRoadBoundaryCheck {
  carLeftEdgeX: number;
  carRightEdgeX: number;
  roadLeftEdgeX: number;
  roadRightEdgeX: number;
  isOffRoad: boolean;
}

export function getCarLeftEdgeX(car: Pick<CarState, "positionX" | "width">): number {
  if (!Number.isFinite(car.positionX)) {
    throw new RangeError("car.positionX must be finite.");
  }

  if (!Number.isFinite(car.width) || car.width <= 0) {
    throw new RangeError("car.width must be a finite positive number.");
  }

  return car.positionX - car.width / 2;
}

export function getCarRightEdgeX(car: Pick<CarState, "positionX" | "width">): number {
  if (!Number.isFinite(car.positionX)) {
    throw new RangeError("car.positionX must be finite.");
  }

  if (!Number.isFinite(car.width) || car.width <= 0) {
    throw new RangeError("car.width must be a finite positive number.");
  }

  return car.positionX + car.width / 2;
}

export function evaluateCarRoadBoundary(
  car: Pick<CarState, "positionX" | "width">,
  road: Road,
): CarRoadBoundaryCheck {
  const carLeftEdgeX = getCarLeftEdgeX(car);
  const carRightEdgeX = getCarRightEdgeX(car);
  const roadLeftEdgeX = getRoadLeftEdgeX(road);
  const roadRightEdgeX = getRoadRightEdgeX(road);

  return {
    carLeftEdgeX,
    carRightEdgeX,
    roadLeftEdgeX,
    roadRightEdgeX,
    isOffRoad: carLeftEdgeX < roadLeftEdgeX || carRightEdgeX > roadRightEdgeX,
  };
}

export function isCarOffRoad(
  car: Pick<CarState, "positionX" | "width">,
  road: Road,
): boolean {
  return evaluateCarRoadBoundary(car, road).isOffRoad;
}
```

---

# Function Responsibilities

## `getCarLeftEdgeX()`

Calculates the left horizontal edge of the vehicle body.

Example:

```txt
positionX = 400
width = 40

left edge = 380
```

---

## `getCarRightEdgeX()`

Calculates the right horizontal edge of the vehicle body.

Example:

```txt
positionX = 400
width = 40

right edge = 420
```

---

## `evaluateCarRoadBoundary()`

Returns detailed diagnostic information.

Useful for:

```txt
debug panels
tests
future collision systems
future off-road warnings
```

---

## `isCarOffRoad()`

Returns only the boolean result.

This is the canonical helper for gameplay logic.

---

# Why Boundary Touching Is Allowed

The car should not be considered off-road merely because its edge touches the road edge.

Allowed:

```txt
carLeftEdgeX = roadLeftEdgeX
carRightEdgeX = roadRightEdgeX
```

Off-road begins only when the car body crosses beyond the boundary.

---

# Testing Strategy

## Fully On-Road

Car is centered inside the road:

```txt
carLeftEdgeX > roadLeftEdgeX
carRightEdgeX < roadRightEdgeX
```

Expected:

```txt
isOffRoad = false
```

---

## Touching Left Boundary

```txt
carLeftEdgeX = roadLeftEdgeX
```

Expected:

```txt
isOffRoad = false
```

---

## Touching Right Boundary

```txt
carRightEdgeX = roadRightEdgeX
```

Expected:

```txt
isOffRoad = false
```

---

## Partially Off-Road Left

```txt
carLeftEdgeX < roadLeftEdgeX
```

Expected:

```txt
isOffRoad = true
```

---

## Partially Off-Road Right

```txt
carRightEdgeX > roadRightEdgeX
```

Expected:

```txt
isOffRoad = true
```

---

## Fully Off-Road

Car body is completely outside one side of the road.

Expected:

```txt
isOffRoad = true
```

---

## Invalid Input

Reject invalid car data:

```txt
positionX = NaN
width = 0
width < 0
width = Infinity
```

Expected:

```txt
RangeError
```

---

# Acceptance Criteria

This task is complete when:

```txt
Detection uses road model dimensions.
Detection uses car dimensions.
Detection is implemented as a pure function.
No renderer logic performs boundary checks.
Unit tests cover fully on-road, touching boundary, partially off-road, and fully off-road.
```

---

# Traceability KPI

```txt
100% of road violation detection uses one helper function.
```

Success means:

```txt
All future off-road logic imports isCarOffRoad() rather than duplicating edge calculations.
```

---

# Engineering Lessons Learned

## Renderer Should Not Own Gameplay Rules

The renderer should draw the car.

It should not decide whether the car has violated the road boundary.

Boundary logic belongs in domain/physics helpers.

---

## Use Derived Edges, Not Magic Numbers

Road edges should come from:

```ts
getRoadLeftEdgeX(road);
getRoadRightEdgeX(road);
```

This keeps boundary logic correct if road width or center position changes.

---

## Boolean Helper Plus Diagnostic Helper

A boolean helper is simple for gameplay:

```ts
isCarOffRoad(car, road);
```

A diagnostic helper is better for testing and debugging:

```ts
evaluateCarRoadBoundary(car, road);
```

Both share the same calculation.

---

# Future Evolution

This boundary detection foundation can support:

```txt
Off-road warnings
Collision response
Automatic reset
Reduced traction off-road
Damage counters
AI lane-keeping penalties
Boundary sensor rays
Training reward functions
Dashboard diagnostics
Replay debugging
```

The stable rule remains:

```txt
Road boundary detection comes from isCarOffRoad().
```
