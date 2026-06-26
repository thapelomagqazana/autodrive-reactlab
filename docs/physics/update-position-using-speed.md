# Update Position Using Speed and Heading

## Purpose

The car's position must update over time based on its current speed, heading angle, and elapsed simulation time.

This phase turns speed into visible movement.

The rule is deterministic, frame-rate independent, and aligned with the project heading convention.

---

# Scope

This document covers **Phase 1.6.5 — Update Position Using Speed and Heading**.

This phase updates:

```txt
positionX
positionY
distanceTravelled
```

It does **not** implement:

```txt
Steering angle updates
Road boundary handling
Collision response
Sensors
AI navigation
Camera follow
Lane keeping
```

---

# File Location

```txt
src/simulation/engine/physics.ts
```

---

# Public API

```ts
updateCarPhysics(
  car: CarState,
  input: CarPhysicsInput,
  deltaTimeSeconds: number,
): CarState;
```

Supporting helpers:

```ts
calculateTravelDistance(
  speed: number,
  deltaTimeSeconds: number,
): number;
```

```ts
updatePositionUsingSpeedAndHeading(
  car: Pick<
    CarState,
    "positionX" | "positionY" | "speed" | "angle" | "distanceTravelled"
  >,
  deltaTimeSeconds: number,
): CarPositionUpdate;
```

---

# Input Fields

```ts
positionX: number;
positionY: number;
speed: number;
angle: number;
deltaTimeSeconds: number;
```

---

# Coordinate Convention

Canvas coordinates:

```txt
Origin = top-left
Positive X = right
Positive Y = down
```

Heading convention:

```txt
0 radians = upward / north
Positive rotation = clockwise
```

Speed convention:

```txt
Positive speed = forward
Negative speed = backward
Zero speed = stationary
```

---

# Core Formula

```ts
const distance = speed * deltaTimeSeconds;

positionX = positionX + Math.sin(angle) * distance;
positionY = positionY - Math.cos(angle) * distance;
```

Why this works:

```txt
Math.sin(angle) controls horizontal movement.
-Math.cos(angle) controls vertical movement.
```

For `angle = 0`:

```txt
Math.sin(0) = 0
-Math.cos(0) = -1
```

So positive speed moves upward.

---

# Direction Examples

## 0 radians

```txt
angle = 0
speed = 100
delta = 1
```

Result:

```txt
positionX unchanged
positionY decreases by 100
```

The car moves upward.

---

## π / 2 radians

```txt
angle = Math.PI / 2
speed = 100
delta = 1
```

Result:

```txt
positionX increases by 100
positionY unchanged
```

The car moves right.

---

## π radians

```txt
angle = Math.PI
speed = 100
delta = 1
```

Result:

```txt
positionX unchanged
positionY increases by 100
```

The car moves downward.

---

## -π / 2 radians

```txt
angle = -Math.PI / 2
speed = 100
delta = 1
```

Result:

```txt
positionX decreases by 100
positionY unchanged
```

The car moves left.

---

# Reverse Movement

Negative speed moves opposite the heading.

Example:

```txt
angle = 0
speed = -100
delta = 1
```

Result:

```txt
positionY increases by 100
```

The car moves downward while still facing upward.

---

# Distance Travelled

`distanceTravelled` measures total path length.

It should increase by the absolute movement distance:

```ts
distanceTravelled = distanceTravelled + Math.abs(distance);
```

This means reverse movement still adds positive travelled distance.

---

# Zero Speed Rule

If:

```txt
speed = 0
```

Then:

```txt
positionX unchanged
positionY unchanged
distanceTravelled unchanged
```

---

# Zero Delta Rule

If:

```txt
deltaTimeSeconds = 0
```

Then:

```txt
positionX unchanged
positionY unchanged
distanceTravelled unchanged
```

---

# Validation Rules

Validate:

```txt
positionX is finite
positionY is finite
speed is finite
angle is finite
distanceTravelled is finite and non-negative
deltaTimeSeconds is finite and non-negative
```

Invalid values should throw:

```txt
RangeError
```

---

# Physics Pipeline Placement

Position should update after speed calculations.

Recommended order:

```txt
Validate delta time
        ↓
Apply acceleration
        ↓
Apply friction
        ↓
Clamp speed
        ↓
Update position using speed and heading
        ↓
Return next CarState
```

This ensures position uses the final speed for the current frame.

---

# Testing Strategy

## Positive Tests

Verify:

```txt
angle = 0 moves upward with positive speed.
angle = 0 moves downward with negative speed.
angle = π / 2 moves right.
angle = π moves downward.
angle = -π / 2 moves left.
Position uses delta time.
Distance travelled increases by absolute distance.
```

---

## Negative Tests

Verify:

```txt
NaN position throws.
Infinity position throws.
NaN speed throws.
Infinity speed throws.
NaN angle throws.
Infinity angle throws.
Negative distanceTravelled throws.
Invalid delta time throws.
```

---

## Edge Cases

Verify:

```txt
speed = 0
deltaTimeSeconds = 0
very small speed
very small delta
negative speed
large finite angle
existing distanceTravelled > 0
```

---

# Acceptance Criteria

This task is complete when:

```txt
Car moves upward when angle is 0 and speed is positive.
Car moves downward when angle is 0 and speed is negative.
Position uses delta time.
No position change occurs when speed is 0.
Unit tests verify movement for 0, π/2, π, and -π/2 radians.
Input CarState is not mutated.
```

---

# Traceability KPI

```txt
Vehicle movement direction matches heading convention.
```

Success means:

```txt
The visual movement direction agrees with CarState.angle.
```

---

# Engineering Lessons Learned

## Heading Controls Direction

Speed alone only tells you how far to move.

Heading tells you where to move.

Both are required.

---

## Canvas Y Goes Down

In normal math graphs, positive Y often points upward.

In canvas, positive Y points downward.

That is why the Y formula uses:

```ts
-Math.cos(angle);
```

instead of:

```ts
Math.cos(angle);
```

---

## Delta Time Prevents Frame-Rate Bugs

Movement should depend on elapsed time, not frame count.

Correct:

```ts
distance = speed * deltaTimeSeconds;
```

Incorrect:

```ts
positionY -= speed;
```

---

## Position Update Must Stay Pure

Do not update position inside renderers or components.

Correct architecture:

```txt
CarState + input + delta
        ↓
updateCarPhysics()
        ↓
next CarState
        ↓
drawCar()
```

---

# Future Evolution

This movement model prepares the project for:

```txt
Steering
Lane keeping
Sensors
Collision boxes
Camera follow
Replay playback
AI route following
Traffic simulation
Parking manoeuvres
```

The key invariant remains:

```txt
Speed + heading + delta time = position change
```
