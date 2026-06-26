# Update Heading from Steering

## Purpose

Updating heading from steering makes the car visually and physically turn while moving.

The vehicle heading is stored in:

```ts
car.angle;
```

This is the single source of truth for both physics direction and renderer rotation.

---

# Scope

This document covers **Phase 1.7.3 — Update Vehicle Heading from Steering Angle**.

This phase updates:

```txt
car.angle
```

from:

```txt
car.steeringAngle
car.speed
car.turnRate
deltaTimeSeconds
```

It does **not** implement:

```txt
Keyboard input collection
Steering return-to-center
Advanced tyre physics
Slip angle
Ackermann steering geometry
Collision response
Road grip variation
```

---

# File Locations

```txt
src/simulation/engine/physics.ts
src/simulation/vehicle/carState.ts
src/simulation/vehicle/createInitialCar.ts
```

---

# Recommended CarState Field

```ts
/**
 * Heading turn rate multiplier.
 *
 * Unit:
 * - radians per second influence per steering radian.
 */
turnRate: number;
```

Recommended default:

```ts
export const DEFAULT_CAR_TURN_RATE = 2.4;
```

---

# Core Formula

```txt
turnAmount = steeringAngle × turnRate × speedFactor × deltaTimeSeconds
angle = angle + turnAmount
```

Where:

```txt
steeringAngle = wheel steering angle in radians
turnRate = heading-turn multiplier
speedFactor = normalized speed influence
deltaTimeSeconds = elapsed frame time in seconds
```

---

# Speed Factor

The MVP speed factor should use speed magnitude:

```ts
speedFactor = Math.min(1, Math.abs(speed) / maxSpeed);
```

Why:

```txt
Reverse movement can still steer.
Higher speed creates stronger heading change.
Factor is capped at 1 to prevent runaway turning.
```

---

# Direction Rules

Positive steering angle:

```txt
turns right
increases angle
clockwise heading change
```

Negative steering angle:

```txt
turns left
decreases angle
counter-clockwise heading change
```

Zero steering angle:

```txt
no heading change
```

---

# Radian Rule

Heading uses radians.

Do not convert heading to degrees inside physics.

Correct:

```ts
angle + turnAmount;
```

Incorrect:

```ts
angle + radiansToDegrees(turnAmount);
```

---

# Recommended Helpers

```ts
calculateSteeringSpeedFactor(
  speed: number,
  maxSpeed: number,
): number;
```

```ts
updateHeadingFromSteering(
  car: Pick<
    CarState,
    "angle" | "steeringAngle" | "speed" | "maxSpeed" | "turnRate"
  >,
  deltaTimeSeconds: number,
): number;
```

---

# Implementation Sketch

```ts
export function calculateSteeringSpeedFactor(speed: number, maxSpeed: number): number {
  assertFiniteNumber(speed, "speed");

  if (!Number.isFinite(maxSpeed) || maxSpeed <= 0) {
    throw new RangeError("maxSpeed must be a finite positive number.");
  }

  return Math.min(1, Math.abs(speed) / maxSpeed);
}
```

```ts
export function updateHeadingFromSteering(
  car: Pick<CarState, "angle" | "steeringAngle" | "speed" | "maxSpeed" | "turnRate">,
  deltaTimeSeconds: number,
): number {
  assertValidDeltaTimeSeconds(deltaTimeSeconds);
  assertFiniteNumber(car.angle, "car.angle");
  assertFiniteNumber(car.steeringAngle, "car.steeringAngle");
  assertFiniteNumber(car.speed, "car.speed");

  if (!Number.isFinite(car.turnRate) || car.turnRate < 0) {
    throw new RangeError("car.turnRate must be a finite non-negative number.");
  }

  const speedFactor = calculateSteeringSpeedFactor(car.speed, car.maxSpeed);

  const turnAmount = car.steeringAngle * car.turnRate * speedFactor * deltaTimeSeconds;

  return car.angle + turnAmount;
}
```

---

# Physics Pipeline Placement

Recommended order:

```txt
Normalize input
        ↓
Apply acceleration / braking / friction
        ↓
Clamp speed
        ↓
Resolve effective steering input
        ↓
Convert steeringInput to steeringAngle
        ↓
Update heading angle
        ↓
Update position using new heading
        ↓
Return next CarState
```

This ensures position movement uses the updated heading.

---

# Input-to-Heading Flow

```txt
steeringInput
    ↓
steeringInputToAngle()
    ↓
steeringAngle
    ↓
updateHeadingFromSteering()
    ↓
angle
    ↓
updatePositionUsingSpeedAndHeading()
```

---

# Example

Given:

```txt
angle = 0
steeringAngle = 0.5
turnRate = 2
speed = 130
maxSpeed = 260
deltaTimeSeconds = 1
```

Then:

```txt
speedFactor = 130 / 260 = 0.5
turnAmount = 0.5 × 2 × 0.5 × 1 = 0.5
new angle = 0.5
```

The car turns right.

---

# Validation Rules

Validate:

```txt
angle is finite
steeringAngle is finite
speed is finite
maxSpeed is finite and positive
turnRate is finite and non-negative
deltaTimeSeconds is finite and non-negative
```

Invalid values should throw:

```txt
RangeError
```

---

# Testing Strategy

## Positive Tests

Verify:

```txt
Angle changes when moving and steering angle is non-zero.
Angle does not change when steeringAngle is 0.
Angle update uses deltaTimeSeconds.
Positive steering increases angle.
Negative steering decreases angle.
Reverse speed still contributes through speed magnitude.
Speed factor caps at 1.
```

---

## Negative Tests

Verify:

```txt
NaN angle throws.
NaN steeringAngle throws.
NaN speed throws.
Invalid maxSpeed throws.
Invalid turnRate throws.
Invalid deltaTimeSeconds throws.
```

---

## Integration Tests

Verify:

```txt
updateCarPhysics() changes angle when moving and steering.
updateCarPhysics() does not change angle when stopped.
updateCarPhysics() does not change angle when steering input is 0.
Position update uses the new heading.
```

---

# Acceptance Criteria

This task is complete when:

```txt
Angle changes when car is moving and steering angle is non-zero.
Angle does not change when steering angle is 0.
Angle update uses delta time.
Positive steering increases clockwise heading.
Negative steering decreases heading.
Unit tests verify left turn, right turn, and no-turn cases.
```

---

# Traceability KPI

```txt
Visual heading and physics heading remain the same source of truth.
```

Success means:

```txt
car.angle drives both movement direction and renderer rotation.
```

---

# Engineering Lessons Learned

## Separate Intent, Wheel State, and Heading

Three different ideas must remain separate:

```txt
steeringInput = user or AI intent
steeringAngle = wheel state
angle = vehicle heading
```

Mixing these concepts creates technical debt.

---

## Heading Is Physics State

The renderer should not calculate direction.

It should only rotate the car using:

```ts
context.rotate(car.angle);
```

---

## Speed Matters

A car should not rotate meaningfully without movement.

The speed factor keeps turning tied to movement.

---

## Reverse Still Turns

Using `Math.abs(speed)` means reverse movement can still produce heading changes.

This supports future parking and recovery behaviour.

---

# Future Evolution

This heading model can grow into:

```txt
Steering smoothing
Return-to-center behaviour
Speed-sensitive steering damping
Reverse steering inversion
Ackermann steering
Slip angle
Tyre grip
Road-surface steering penalties
Lane-following steering control
Autopilot path tracking
```

The stable invariant remains:

```txt
car.angle is the source of truth for heading.
```
