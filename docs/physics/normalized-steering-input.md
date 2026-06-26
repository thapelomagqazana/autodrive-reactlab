# Normalized Steering Input

## Purpose

Normalized steering input gives the physics engine one clean, predictable way to receive steering intent from a driver, keyboard, AI system, replay system, or future scenario editor.

The core rule is:

```txt
All steering intent enters physics through one number.
```

That number is:

```ts
steeringInput: number;
```

---

# Scope

This document covers **Phase 1.7.1 — Add Normalized Steering Input**.

This phase adds steering intent to the physics input model.

It does **not** directly turn the car.

It does **not** directly move the car sideways.

It does **not** update `CarState.angle` yet.

Later steering physics will convert `steeringInput` into `CarState.steeringAngle`, and then use that steering angle to update vehicle heading.

---

# File Location

```txt
src/simulation/engine/physics.ts
```

Related future files may include:

```txt
src/hooks/useKeyboardControls.ts
src/store/simulationStore.ts
src/simulation/vehicle/carState.ts
```

---

# Public Input Field

```ts
steeringInput: number;
```

---

# Input Convention

```txt
-1 = full left
 0 = no steering input
 1 = full right
```

Intermediate values are allowed:

```txt
-0.5 = half left
 0.25 = slight right
```

---

# Direction Meaning

Negative input means:

```txt
Turn left
```

Positive input means:

```txt
Turn right
```

Zero means:

```txt
No active steering intent
```

---

# Normalization Rule

Raw steering input must be clamped into:

```txt
[-1, 1]
```

Recommended helper:

```ts
export function clampSteeringInput(value: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError("steeringInput must be a finite number.");
  }

  return Math.min(1, Math.max(-1, value));
}
```

Examples:

```txt
-2   -> -1
-1   -> -1
-0.5 -> -0.5
 0   -> 0
 0.5 -> 0.5
 1   -> 1
 2   -> 1
```

---

# Recommended Input Type

```ts
export interface CarPhysicsInput {
  isAccelerating: boolean;
  isBraking: boolean;

  /**
   * Normalized steering intent.
   *
   * - -1 = full left
   * - 0 = no steering input
   * - 1 = full right
   */
  steeringInput: number;
}
```

---

# Neutral Input

```ts
export const NEUTRAL_CAR_PHYSICS_INPUT = Object.freeze({
  isAccelerating: false,
  isBraking: false,
  steeringInput: 0,
});
```

Neutral steering means:

```txt
No active steering intent.
```

---

# Input Factory

A factory can normalize partial or untrusted input.

```ts
export function createCarPhysicsInput(
  input: Partial<CarPhysicsInput> = {},
): CarPhysicsInput {
  return {
    isAccelerating: input.isAccelerating ?? false,
    isBraking: input.isBraking ?? false,
    steeringInput: clampSteeringInput(input.steeringInput ?? 0),
  };
}
```

Use cases:

```txt
Keyboard input
AI input
Replay input
Scenario editor input
Test fixtures
```

---

# Important Non-Responsibility

`steeringInput` must not directly move the car sideways.

Incorrect:

```ts
positionX += steeringInput * 10;
```

Correct future flow:

```txt
steeringInput
    ↓
steeringAngle
    ↓
angle
    ↓
position update using speed + heading
```

---

# Why Not Use isSteeringLeft / isSteeringRight?

Boolean steering fields become limiting over time.

Example:

```ts
isSteeringLeft: true;
isSteeringRight: false;
```

This works for keyboard input, but not for:

```txt
Gamepad analog sticks
AI steering percentages
Lane keeping
Replay data
Autopilot path following
Smooth steering transitions
```

A normalized number is more futureproof.

---

# Keyboard Mapping Example

Keyboard input can be translated into normalized steering:

```ts
const steeringInput =
  isLeftPressed && !isRightPressed ? -1 : isRightPressed && !isLeftPressed ? 1 : 0;
```

Conflict rule:

```txt
Left + Right = 0
```

This avoids impossible steering intent.

---

# AI Mapping Example

AI can express partial steering:

```ts
createCarPhysicsInput({
  steeringInput: -0.35,
});
```

Meaning:

```txt
Slight left correction.
```

---

# Validation Rules

Valid:

```txt
-1
0
1
0.5
-0.25
2       clamped to 1
-2      clamped to -1
```

Invalid:

```txt
NaN
Infinity
-Infinity
```

Invalid values should throw a `RangeError`.

---

# Physics Integration Rule

At the start of `updateCarPhysics()`, normalize input once:

```ts
const normalizedInput = createCarPhysicsInput(input);
```

Then all physics uses:

```ts
normalizedInput.steeringInput;
```

This prevents raw untrusted values from leaking into steering calculations.

---

# Testing Strategy

## Positive Tests

Verify:

```txt
-1 is accepted.
0 is accepted.
1 is accepted.
Intermediate values are accepted.
Values less than -1 clamp to -1.
Values greater than 1 clamp to 1.
createCarPhysicsInput() returns neutral input by default.
```

---

## Negative Tests

Verify:

```txt
NaN throws.
Infinity throws.
-Infinity throws.
```

---

## Behaviour Tests

Verify:

```txt
Negative input means left.
Positive input means right.
Zero means no active steering intent.
steeringInput does not directly move car position.
```

---

# Acceptance Criteria

This task is complete when:

```txt
steeringInput is defined as a number.
steeringInput is clamped to [-1, 1].
Negative input means left.
Positive input means right.
Zero means no active steering intent.
Unit tests verify clamping.
Steering input does not directly change position.
```

---

# Traceability KPI

```txt
All steering control enters physics through one normalized input.
```

Success means:

```txt
Keyboard, AI, replay, and future controller steering all become the same input shape before physics runs.
```

---

# Engineering Lessons Learned

## Normalize at the Boundary

Raw input can come from many places.

Normalize it once at the physics boundary.

Then every later steering rule can trust the value.

---

## Analog Beats Boolean

Boolean steering is enough for arrow keys.

Normalized steering is better for long-term simulation quality.

It supports:

```txt
Smooth steering
AI control
Gamepad input
Autopilot corrections
Lane-centering behaviour
```

---

## Intent Is Not Movement

Steering input is intent.

It should not directly change position.

The vehicle should move because its heading changes, and then speed moves it along that heading.

---

# Future Evolution

This input model prepares the project for:

```txt
Keyboard controls
Gamepad controls
AI steering
Lane following
Autopilot path tracking
Replay playback
Scenario editor scripted controls
Smooth steering return-to-center
Low-speed steering limits
High-speed steering damping
```

The core principle remains:

```txt
Control intent enters physics as normalized data.
Physics decides vehicle motion.
```
