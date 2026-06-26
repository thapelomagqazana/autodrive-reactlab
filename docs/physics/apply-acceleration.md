# Apply Acceleration

## Purpose

Acceleration increases the car's current speed when acceleration input is active.

This is the first real movement rule in the physics engine.

The rule is time-based, deterministic, and frame-rate independent.

---

# Scope

This document covers **Phase 1.6.2 — Apply Acceleration**.

This phase updates speed only.

It does **not** implement:

- Friction
- Braking
- Reverse movement
- Steering
- Position updates
- Collision response
- AI decisions
- Sensor feedback

Those behaviours are added in later tasks.

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

Supporting helper:

```ts
applyAccelerationToSpeed(
  car: Pick<CarState, "speed" | "acceleration" | "maxSpeed" | "maxReverseSpeed">,
  input: Pick<CarPhysicsInput, "isAccelerating">,
  deltaTimeSeconds: number,
): number;
```

---

# Input Field

```ts
isAccelerating: boolean;
```

Acceleration is applied only when:

```ts
input.isAccelerating === true;
```

---

# Core Rule

```txt
nextSpeed = speed + acceleration × deltaTimeSeconds
```

Where:

```txt
speed = current speed in pixels per second
acceleration = pixels per second squared
deltaTimeSeconds = elapsed simulation time in seconds
```

---

# Why Delta Time Matters

Acceleration must be frame-rate independent.

Example:

```txt
acceleration = 120 px/s²
deltaTimeSeconds = 1
speed gain = 120 px/s
```

If half a second passes:

```txt
acceleration = 120 px/s²
deltaTimeSeconds = 0.5
speed gain = 60 px/s
```

This means a faster monitor does not make the car accelerate faster.

---

# Physics Concept

This follows the basic constant-acceleration velocity update:

In the simulator, the implementation form is:

```ts
const nextSpeed = car.speed + car.acceleration * deltaTimeSeconds;
```

---

# Acceleration Gate

Acceleration must not apply unless input is active.

Correct:

```ts
const nextSpeed = input.isAccelerating
  ? car.speed + car.acceleration * deltaTimeSeconds
  : car.speed;
```

Incorrect:

```ts
const nextSpeed = car.speed + car.acceleration * deltaTimeSeconds;
```

The incorrect version accelerates even when the user or AI did nothing.

---

# Speed Clamping

After acceleration, speed must be clamped.

```txt
minimum speed = -car.maxReverseSpeed
maximum speed = car.maxSpeed
```

Recommended helper:

```ts
clampSpeed(speed, car.maxSpeed, car.maxReverseSpeed);
```

This prevents unrealistic acceleration beyond configured limits.

---

# Immutability Rule

Acceleration must not mutate the input car.

Correct:

```ts
return {
  ...car,
  speed,
};
```

Incorrect:

```ts
car.speed = speed;
return car;
```

---

# Validation Rules

The physics implementation should validate:

```txt
deltaTimeSeconds is finite and non-negative
car.speed is finite
car.acceleration is finite and non-negative
car.maxSpeed is finite and positive
car.maxReverseSpeed is finite and positive
```

Invalid values should throw a `RangeError`.

---

# Example

Given:

```txt
speed = 0
acceleration = 120
deltaTimeSeconds = 1
isAccelerating = true
```

Result:

```txt
nextSpeed = 120
```

Given:

```txt
speed = 0
acceleration = 120
deltaTimeSeconds = 0.5
isAccelerating = true
```

Result:

```txt
nextSpeed = 60
```

Given:

```txt
speed = 25
isAccelerating = false
```

Result:

```txt
nextSpeed = 25
```

---

# Testing Strategy

## Positive Tests

Verify:

```txt
Speed increases when isAccelerating is true.
Acceleration uses deltaTimeSeconds.
Half-second acceleration produces half the speed gain.
Zero delta time does not change speed.
Speed is clamped to maxSpeed.
updateCarPhysics() returns a new car object.
```

---

## Negative Tests

Verify:

```txt
Invalid delta time throws.
NaN speed throws.
Infinity speed throws.
Negative acceleration throws.
NaN acceleration throws.
Invalid maxSpeed throws.
Invalid maxReverseSpeed throws.
```

---

## Edge Cases

Verify:

```txt
deltaTimeSeconds = 0
deltaTimeSeconds = 1 / 60
deltaTimeSeconds = 1
speed near maxSpeed
speed already at maxSpeed
car accelerating from reverse speed
```

---

# Acceptance Criteria

This task is complete when:

```txt
Speed increases when isAccelerating is true.
Speed does not increase when isAccelerating is false.
Acceleration uses delta time.
Acceleration does not exceed maxSpeed after clamping.
Unit tests cover accelerating and non-accelerating cases.
Physics remains pure.
Input car state is not mutated.
```

---

# Traceability KPI

```txt
Acceleration behaviour is measurable and frame-rate independent.
```

Success means:

```txt
Speed gain is proportional to elapsed seconds, not frame count.
```

---

# Engineering Lessons Learned

## Frame-Based Movement Is a Bug

Bad:

```txt
speed += acceleration
```

This makes acceleration depend on frames rendered.

Good:

```txt
speed += acceleration * deltaTimeSeconds
```

This makes acceleration depend on simulation time.

---

## Input Should Gate Physics

Acceleration is a response to input.

If the input is not active, speed should not increase from acceleration.

This keeps physics predictable and testable.

---

## Clamp After Calculation

The safest sequence is:

```txt
calculate next speed
then clamp
```

This allows the physics formula to remain simple while enforcing movement limits centrally.

---

## Keep Movement Centralized

Acceleration should live inside `updateCarPhysics()` and helpers.

Do not apply acceleration in:

```txt
React components
Keyboard hooks
Zustand actions
Canvas renderers
```

Those systems should provide inputs or consume results, not calculate movement.

---

# Future Evolution

This acceleration rule prepares the physics engine for:

```txt
Friction
Braking
Reverse movement
Steering
Velocity-based position updates
AI throttle control
Traffic vehicle acceleration
Scenario-defined performance profiles
```

The core idea remains:

```txt
previous speed + acceleration over time = next speed
```
