# Off-Road Speed Penalty

## Purpose

The off-road speed penalty reduces the vehicle's forward speed capability when it leaves the drivable road area.

The goal is to give immediate movement feedback without harsh collision behaviour.

For MVP:

```txt
Off-road driving should feel slower, not instantly blocked.
```

---

# Scope

This document covers **Phase 1.13.3 — Apply Off-Road Speed Penalty**.

This phase adds a deterministic speed cap when the vehicle is off-road.

It does **not** implement:

```txt
Vehicle damage
Collision bounce-back
Automatic reset
Off-road steering penalties
Terrain friction maps
Skid physics
Sound effects
Visual warning effects
```

---

# Chosen MVP Approach

Use an effective max speed multiplier.

Recommended rule:

```ts
effectiveMaxSpeed = car.maxSpeed * 0.35;
```

While off-road:

```txt
forward speed cannot exceed effectiveMaxSpeed
```

Reverse speed remains unchanged for MVP so the driver can recover.

---

# Why Not Extra Friction Yet?

Extra friction is realistic but introduces more tuning complexity.

A max-speed cap is:

```txt
simple
deterministic
easy to test
easy to explain
safe for MVP
```

Friction-based terrain can be added later.

---

# Source of Truth

Off-road state is derived from:

```ts
isCarOffRoad(car, road);
```

The physics update receives the result through normalized input:

```ts
isOffRoad: boolean;
```

---

# Physics Input

`CarPhysicsInput` should include:

```ts
isOffRoad: boolean;
```

Callers may omit it before normalization, but the normalized physics input must always contain a boolean.

Recommended pattern:

```ts
export type CreateCarPhysicsInput = Partial<CarPhysicsInput>;

export function createCarPhysicsInput(
  input: CreateCarPhysicsInput = {},
): CarPhysicsInput {
  return {
    isAccelerating: input.isAccelerating ?? false,
    isBrakeOrReversePressed: input.isBrakeOrReversePressed ?? false,
    steeringInput: clampSteeringInput(input.steeringInput ?? 0),
    isOffRoad: input.isOffRoad ?? false,
  };
}
```

This prevents TypeScript errors such as:

```txt
boolean | undefined is not assignable to boolean
```

---

# Constants

Recommended constant:

```ts
export const DEFAULT_OFF_ROAD_SPEED_MULTIPLIER = 0.35;
```

Meaning:

```txt
Off-road max speed = 35% of normal max speed.
```

Example:

```txt
Normal max speed: 200 px/s
Off-road max speed: 70 px/s
```

---

# Validation

Recommended validation helper:

```ts
export function isValidOffRoadSpeedMultiplier(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}
```

Valid values:

```txt
0
0.35
1
```

Invalid values:

```txt
NaN
Infinity
-0.1
1.1
```

---

# Effective Max Speed Helper

Recommended implementation:

```ts
export function resolveEffectiveMaxSpeed(
  maxSpeed: number,
  isOffRoad: boolean,
  offRoadSpeedMultiplier = DEFAULT_OFF_ROAD_SPEED_MULTIPLIER,
): number {
  if (!Number.isFinite(maxSpeed) || maxSpeed <= 0) {
    throw new RangeError("maxSpeed must be a finite positive value.");
  }

  if (!isValidOffRoadSpeedMultiplier(offRoadSpeedMultiplier)) {
    throw new RangeError("offRoadSpeedMultiplier must be between 0 and 1.");
  }

  return isOffRoad ? maxSpeed * offRoadSpeedMultiplier : maxSpeed;
}
```

---

# Road-Aware Speed Clamp

Recommended implementation:

```ts
export function clampSpeedForRoadState(
  speed: number,
  maxSpeed: number,
  maxReverseSpeed: number,
  isOffRoad: boolean,
): number {
  const effectiveMaxSpeed = resolveEffectiveMaxSpeed(maxSpeed, isOffRoad);

  return clampSpeed(speed, effectiveMaxSpeed, maxReverseSpeed);
}
```

Design choice:

```txt
Forward speed is capped while off-road.
Reverse speed is not additionally capped.
```

This allows the driver to reverse back onto the road.

---

# Physics Pipeline Integration

In `updateCarPhysics()`, replace:

```ts
speed = clampSpeed(speed, car.maxSpeed, car.maxReverseSpeed);
```

with:

```ts
speed = clampSpeedForRoadState(
  speed,
  car.maxSpeed,
  car.maxReverseSpeed,
  normalizedInput.isOffRoad,
);
```

This ensures off-road speed penalty is part of the normal speed-clamping pipeline.

---

# Store Integration

The store should detect whether the car is off-road before applying the next physics update.

Recommended tick flow:

```ts
const wasOffRoad = isCarOffRoad(state.car, state.road);

const nextCar = updateCarPhysics(
  state.car,
  {
    ...input,
    isOffRoad: wasOffRoad,
  },
  deltaTimeSeconds,
);

const roadDepartureWarning = isCarOffRoad(nextCar, state.road);
```

Why use `wasOffRoad`?

```txt
The speed penalty applies based on the vehicle's state entering the frame.
The warning reflects the vehicle's state after the frame.
```

This keeps the update deterministic.

---

# Behaviour

## On-Road

```txt
isOffRoad = false
maxSpeed = 200

effectiveMaxSpeed = 200
```

The car can use full forward speed.

---

## Off-Road

```txt
isOffRoad = true
maxSpeed = 200

effectiveMaxSpeed = 70
```

The car cannot exceed 70 px/s forward speed.

---

## Returning to Road

Once the car is back on-road:

```txt
isOffRoad = false
```

the full max speed becomes available again.

The penalty is removed automatically.

---

# Important Design Notes

## Does Not Stop Instantly

If the vehicle is moving very fast and becomes off-road, the speed is clamped down to the off-road cap.

That is immediate but not a full stop.

Example:

```txt
speed = 180
off-road cap = 70

next speed = 70
```

---

## Does Not Affect Reverse Recovery

Reverse speed remains governed by:

```ts
car.maxReverseSpeed;
```

This makes it possible to recover from off-road state without making the car feel trapped.

---

## Does Not Change Position Directly

The penalty affects speed only.

It must not directly rewrite:

```txt
positionX
positionY
angle
steeringAngle
```

---

# Testing Strategy

## Effective Max Speed

Verify:

```txt
on-road returns full maxSpeed
off-road returns maxSpeed * 0.35
invalid maxSpeed throws RangeError
invalid multiplier throws RangeError
```

---

## Road-Aware Clamp

Verify:

```txt
on-road speed clamps to normal maxSpeed
off-road speed clamps to effective maxSpeed
reverse speed still respects maxReverseSpeed
```

---

## Physics Update

Verify:

```txt
updateCarPhysics() applies off-road speed cap
off-road input does not mutate car directly
off-road input does not stop vehicle instantly
normal on-road behaviour remains unchanged
```

---

## Store Integration

Verify:

```txt
store passes off-road state into physics
off-road car receives speed penalty
roadDepartureWarning still updates correctly
returning on-road removes penalty
```

---

# Acceptance Criteria

This task is complete when:

```txt
Penalty activates when off-road.
Penalty is removed when back on-road.
Penalty is deterministic.
Penalty does not stop vehicle instantly.
Tests verify speed reduction behaviour.
```

---

# Traceability KPI

```txt
Off-road driving produces measurable movement consequences.
```

Success means:

```txt
A car outside road boundaries has a lower effective forward speed than a car inside road boundaries.
```

---

# Engineering Lessons Learned

## Detection Comes Before Consequence

`isCarOffRoad()` detects the condition.

The physics pipeline applies the movement consequence.

Do not mix detection and response into one function.

---

## Prefer a Simple MVP Rule

The `0.35` max-speed multiplier is easy to reason about and test.

More realistic terrain friction can come later.

---

## Keep Recovery Possible

Off-road penalties should discourage leaving the road without trapping the car.

That is why reverse speed remains available.

---

# Future Evolution

This system can later support:

```txt
terrain-specific speed multipliers
grass friction
gravel friction
mud slowdown
off-road steering penalty
tire grip model
AI reward penalties
dashboard warning levels
camera shake
vehicle damage
```

The stable MVP rule remains:

```txt
Off-road state reduces effective forward max speed.
```
