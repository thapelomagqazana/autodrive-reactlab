# Off-Road Recovery Reset

## Purpose

Off-road recovery reset prevents the vehicle from becoming permanently lost after a severe road departure.

This feature is a safety net.

It is not normal collision handling.

The goal is:

```txt
Slightly off-road = recover manually
Severely off-road = reset to a safe baseline
```

---

# Scope

This document covers **Phase 1.13.5 — Implement Off-Road Recovery Reset**.

This phase adds a configurable severe-departure threshold and triggers recovery when the car center moves too far beyond the road.

It does **not** implement:

```txt
Collision bounce
Vehicle damage
Crash animation
Manual respawn button
Checkpoint recovery
Partial car repositioning
Tow-truck logic
```

---

# Chosen MVP Approach

Use the existing reset pipeline:

```ts
resetSimulation();
```

or equivalent reset-state logic inside the store.

Reason:

```txt
The MVP should return to a known safe baseline rather than trying to repair many pieces of state manually.
```

This resets:

```txt
status
telemetry
road
car
camera
roadDepartureWarning
```

while preserving UI preferences.

---

# Recovery Threshold

Recommended default:

```ts
export const DEFAULT_MAXIMUM_OFF_ROAD_DISTANCE = 300;
```

Meaning:

```txt
The car may move up to 300 pixels beyond the road edge before automatic recovery.
```

This gives the driver space to recover manually.

---

# Trigger Rule

Use the car center position.

```txt
leftRecoveryLimit = roadLeftEdgeX - maximumOffRoadDistance
rightRecoveryLimit = roadRightEdgeX + maximumOffRoadDistance
```

Recovery triggers when:

```ts
car.positionX < leftRecoveryLimit || car.positionX > rightRecoveryLimit;
```

Boundary equality is allowed.

That means:

```txt
positionX === leftRecoveryLimit  => no reset
positionX === rightRecoveryLimit => no reset
```

Reset begins only after crossing beyond the limit.

---

# Recommended File

```txt
src/simulation/engine/offRoadRecovery.ts
```

---

# Recommended Implementation

```ts
/**
 * Severe off-road recovery detection for AutoDrive ReactLab.
 *
 * Responsibility:
 * - Detect when the vehicle has gone too far beyond the road to remain
 *   safely recoverable by steering.
 *
 * Non-responsibilities:
 * - Does not reset state directly.
 * - Does not mutate car or road.
 * - Does not render warnings.
 * - Does not apply speed penalties.
 */

import type { Road } from "../world";
import { getRoadLeftEdgeX, getRoadRightEdgeX } from "../world";
import type { CarState } from "../vehicle";

export const DEFAULT_MAXIMUM_OFF_ROAD_DISTANCE = 300;

export function isValidMaximumOffRoadDistance(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function assertValidMaximumOffRoadDistance(value: number): void {
  if (!isValidMaximumOffRoadDistance(value)) {
    throw new RangeError("maximumOffRoadDistance must be finite and non-negative.");
  }
}

export function shouldRecoverFromSevereRoadDeparture(
  car: Pick<CarState, "positionX">,
  road: Road,
  maximumOffRoadDistance = DEFAULT_MAXIMUM_OFF_ROAD_DISTANCE,
): boolean {
  if (!Number.isFinite(car.positionX)) {
    throw new RangeError("car.positionX must be finite.");
  }

  assertValidMaximumOffRoadDistance(maximumOffRoadDistance);

  const leftRecoveryLimit = getRoadLeftEdgeX(road) - maximumOffRoadDistance;
  const rightRecoveryLimit = getRoadRightEdgeX(road) + maximumOffRoadDistance;

  return car.positionX < leftRecoveryLimit || car.positionX > rightRecoveryLimit;
}
```

---

# Store Integration

Recommended flow inside `tickSimulation()`:

```ts
const nextCar = updateCarPhysics(
  state.car,
  {
    ...input,
    isOffRoad: wasOffRoad,
  },
  deltaTimeSeconds,
);

if (shouldRecoverFromSevereRoadDeparture(nextCar, state.road)) {
  const road = createInitialRoad();

  return {
    status: "idle",
    telemetry: { ...INITIAL_TELEMETRY },
    ui: state.ui,
    road,
    car: createInitialCar(road),
    camera: createInitialCameraState(),
    roadDepartureWarning: false,
  };
}

const roadDepartureWarning = isCarOffRoad(nextCar, state.road);
```

Important:

```txt
Recovery check happens after physics calculates the next car state.
```

This means recovery responds to where the car ended up after the frame.

---

# Why Use Full Reset for MVP?

Full reset is safest because it restores:

```txt
car position
car speed
steering angle
camera offset
simulation time
warning state
```

It avoids bugs where only the car position is reset but speed, camera, or warning state remain inconsistent.

---

# Behaviour

## On-Road

```txt
Car center remains inside road boundaries.
No reset.
```

---

## Slightly Off-Road

```txt
Car center remains within recovery threshold.
No reset.
Road departure warning may be true.
Off-road speed penalty may apply.
Player can steer back manually.
```

---

## Severe Departure

```txt
Car center exceeds road edge + maximumOffRoadDistance.
Simulation resets to safe baseline.
```

---

# Testing Strategy

## No Reset On-Road

Verify:

```txt
car.positionX inside road boundaries => false
```

---

## No Reset at Threshold

Verify:

```txt
positionX = roadLeftEdgeX - maximumOffRoadDistance => false
positionX = roadRightEdgeX + maximumOffRoadDistance => false
```

---

## Reset Beyond Threshold

Verify:

```txt
positionX = roadLeftEdgeX - maximumOffRoadDistance - 1 => true
positionX = roadRightEdgeX + maximumOffRoadDistance + 1 => true
```

---

## Custom Threshold

Verify:

```txt
maximumOffRoadDistance can be configured.
```

---

## Invalid Input

Verify:

```txt
NaN car position throws RangeError.
Negative threshold throws RangeError.
Infinity threshold throws RangeError.
```

---

## Store Recovery

Verify:

```txt
When severe departure occurs during tickSimulation(), store resets to idle baseline.
```

Expected reset values:

```txt
status = idle
simulationTimeSeconds = 0
roadDepartureWarning = false
car = createInitialCar(createInitialRoad())
camera = createInitialCameraState()
```

---

# Acceptance Criteria

This task is complete when:

```txt
Vehicle can remain slightly off-road without reset.
Vehicle exceeding threshold triggers recovery.
Recovery uses existing reset pipeline.
Recovery threshold is configurable.
Tests verify threshold behaviour.
```

---

# Traceability KPI

```txt
Severe road departures always return simulation to a recoverable state.
```

Success means:

```txt
The vehicle cannot be driven permanently into an unrecoverable off-screen state.
```

---

# Engineering Lessons Learned

## Warning Is Not Recovery

Road departure warning indicates off-road state.

Recovery reset handles severe unrecoverable departure.

They are related but separate.

---

## Avoid Early Teleporting

Do not reset the moment the car touches the road edge.

The player should have room to recover manually.

---

## Prefer Reset Pipeline Over Manual Patching

Manual patching can leave stale speed, camera, telemetry, or warning state.

Using the reset pipeline keeps recovery deterministic.

---

# Future Evolution

Later versions can replace full reset with:

```txt
checkpoint respawn
nearest lane recovery
safe shoulder recovery
countdown before reset
manual recovery prompt
AI tow/recovery logic
vehicle damage
```

The stable MVP rule remains:

```txt
Severe road departure resets the simulation to a known safe state.
```
