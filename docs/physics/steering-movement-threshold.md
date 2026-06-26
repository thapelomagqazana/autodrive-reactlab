# Steering Movement Threshold

## Purpose

The steering movement threshold prevents the car from rotating in place while stationary.

In a realistic driving simulation, steering should only affect heading once the vehicle is moving enough for steering to be physically meaningful.

The rule is:

```txt
Steering affects heading only when abs(speed) >= minimumSteeringSpeed.
```

---

# Scope

This document covers **Phase 1.7.2 — Apply Steering Only Above Movement Threshold**.

This phase adds a gate that decides whether steering input is allowed to affect vehicle heading.

It does **not** yet implement:

```txt
Steering angle update
Heading angle update
Wheel return-to-center
Steering smoothing
Low-speed steering scaling
High-speed steering damping
```

Those behaviours are added in later steering physics tasks.

---

# File Location

```txt
src/simulation/engine/physics.ts
```

---

# Central Default

```ts
export const DEFAULT_MINIMUM_STEERING_SPEED = 5;
```

Unit:

```txt
pixels per second
```

Meaning:

```txt
The car must be moving at least 5 px/s forward or backward before steering can affect heading.
```

---

# Core Rule

```ts
Math.abs(speed) >= minimumSteeringSpeed;
```

Examples:

```txt
speed = 0      -> steering disabled
speed = 4.99   -> steering disabled
speed = 5      -> steering enabled
speed = 20     -> steering enabled
speed = -5     -> steering enabled
speed = -20    -> steering enabled
```

---

# Why Use Absolute Speed?

Reverse movement should still allow steering behaviour.

A reversing car can still turn.

Therefore the threshold must use:

```ts
Math.abs(speed);
```

not:

```ts
speed;
```

---

# Public Helpers

```ts
isValidMinimumSteeringSpeed(value: number): boolean;
```

```ts
assertValidMinimumSteeringSpeed(value: number): void;
```

```ts
canApplySteeringAtSpeed(
  speed: number,
  minimumSteeringSpeed?: number,
): boolean;
```

```ts
resolveEffectiveSteeringInput(
  speed: number,
  steeringInput: number,
  minimumSteeringSpeed?: number,
): number;
```

---

# Helper Responsibilities

## canApplySteeringAtSpeed

Determines whether current speed is enough for steering to affect heading.

```ts
return Math.abs(speed) >= minimumSteeringSpeed;
```

---

## resolveEffectiveSteeringInput

Returns either:

```txt
0
```

when steering is not allowed, or the clamped steering input when steering is allowed.

```ts
const normalizedSteeringInput = clampSteeringInput(steeringInput);

if (!canApplySteeringAtSpeed(speed, minimumSteeringSpeed)) {
  return 0;
}

return normalizedSteeringInput;
```

---

# Validation Rules

Validate:

```txt
speed is finite
minimumSteeringSpeed is finite and non-negative
steeringInput is finite
```

Invalid values:

```txt
NaN
Infinity
-Infinity
Negative threshold
```

Invalid values should throw:

```txt
RangeError
```

---

# Behaviour Rules

## Stationary Car

```txt
speed = 0
steeringInput = 1
```

Result:

```txt
effectiveSteeringInput = 0
heading does not change
```

---

## Below Threshold

```txt
speed = 4
minimumSteeringSpeed = 5
steeringInput = -1
```

Result:

```txt
effectiveSteeringInput = 0
heading does not change
```

---

## At Threshold

```txt
speed = 5
minimumSteeringSpeed = 5
steeringInput = 1
```

Result:

```txt
effectiveSteeringInput = 1
steering may affect heading
```

---

## Reverse Movement

```txt
speed = -20
minimumSteeringSpeed = 5
steeringInput = -1
```

Result:

```txt
effectiveSteeringInput = -1
reverse steering is allowed
```

---

# Physics Pipeline Placement

Recommended steering pipeline:

```txt
Normalize steering input
        ↓
Calculate speed
        ↓
Clamp speed
        ↓
Check steering movement threshold
        ↓
Update steering angle / heading in later phases
        ↓
Update position using final heading
```

For this phase, the threshold is introduced before heading updates exist.

---

# Important Non-Responsibility

This task does not update heading yet.

Correct for this phase:

```txt
Gate steering intent.
Keep heading unchanged.
```

Incorrect for this phase:

```txt
Rotate the car immediately.
```

Heading updates belong to later steering tasks.

---

# Testing Strategy

## Positive Tests

Verify:

```txt
Default threshold is 5 px/s.
Steering is allowed at speed 5.
Steering is allowed above speed 5.
Steering is allowed at reverse speed -5.
Steering is allowed above reverse threshold, such as -20.
Custom threshold works.
```

---

## Negative Tests

Verify:

```txt
Steering is disabled at speed 0.
Steering is disabled below threshold.
Steering is disabled below reverse threshold.
Invalid speed throws.
Invalid threshold throws.
Invalid steering input throws.
```

---

## Integration Tests

Verify:

```txt
updateCarPhysics() does not change heading when speed is 0.
updateCarPhysics() does not change heading below threshold.
Reverse movement is eligible for steering gate logic.
```

---

# Acceptance Criteria

This task is complete when:

```txt
Car does not change heading when speed is 0.
Car does not change heading below minimumSteeringSpeed.
Car can steer once speed is above threshold.
Reverse movement still allows steering behaviour.
Threshold is configurable or centralized.
Unit tests verify stopped, below-threshold, and above-threshold cases.
```

---

# Traceability KPI

```txt
Vehicle heading changes only when movement is physically plausible.
```

Success means:

```txt
No stationary spin occurs from steering input.
```

---

# Engineering Lessons Learned

## Steering Is Not Magic Rotation

A car should not rotate in place just because the user presses left or right.

Steering is physically meaningful when the car is moving.

---

## Thresholds Prevent Simulation Weirdness

Without a threshold, tiny numerical speeds can cause visible heading changes.

A minimum speed creates stable and understandable behaviour.

---

## Reverse Still Counts as Movement

Using absolute speed keeps reverse steering possible.

This matters for:

```txt
Reversing
Parking
Recovery
Future manoeuvres
```

---

## Gate First, Turn Later

This phase creates the steering permission rule.

Later phases can safely implement turning because they will know when steering is allowed.

---

# Future Evolution

This threshold can later support:

```txt
Vehicle-specific steering thresholds
Low-speed steering scaling
High-speed steering damping
Reverse steering inversion rules
Parking assist
Autopilot steering limits
Tyre grip modelling
Road-surface steering penalties
```

The core invariant remains:

```txt
No heading change without plausible movement.
```
