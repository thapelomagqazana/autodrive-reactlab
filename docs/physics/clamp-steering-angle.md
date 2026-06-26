# Clamp Steering Angle

## Purpose

Steering angle clamping prevents unrealistic sharp turns by limiting the wheel steering angle to an explicit maximum.

The rule is:

```txt
-maxSteeringAngle <= steeringAngle <= maxSteeringAngle
```

This keeps steering behaviour bounded, predictable, and testable.

---

# Scope

This document covers **Phase 1.7.4 — Clamp Steering Angle**.

This phase adds an explicit steering constraint to the vehicle model and physics pipeline.

It does **not** implement:

```txt
Keyboard controls
Steering smoothing
Return-to-center
Heading update rules
Tyre physics
Road grip
Collision response
```

---

# File Locations

```txt
src/simulation/vehicle/carState.ts
src/simulation/vehicle/createInitialCar.ts
src/simulation/engine/physics.ts
```

---

# CarState Field

```ts
/**
 * Maximum absolute steering angle in radians.
 *
 * Default is Math.PI / 6, approximately 30 degrees.
 */
maxSteeringAngle: number;
```

---

# Default Value

```ts
export const DEFAULT_MAX_STEERING_ANGLE = Math.PI / 6;
```

Meaning:

```txt
Math.PI / 6 radians ≈ 30 degrees
```

---

# Core Rule

```ts
steeringAngle = Math.min(Math.max(steeringAngle, -maxSteeringAngle), maxSteeringAngle);
```

With:

```txt
maxSteeringAngle = Math.PI / 6
```

Allowed range:

```txt
-Math.PI / 6 <= steeringAngle <= Math.PI / 6
```

---

# Public Helpers

```ts
isValidMaxSteeringAngle(value: number): boolean;
```

```ts
clampSteeringAngle(
  steeringAngle: number,
  maxSteeringAngle?: number,
): number;
```

---

# Validation Rules

Valid `maxSteeringAngle` values:

```txt
0
Math.PI / 12
Math.PI / 6
1
```

Invalid values:

```txt
NaN
Infinity
-Infinity
-1
```

Invalid values should throw:

```txt
RangeError
```

---

# Why Zero Is Valid

A `maxSteeringAngle` of `0` means:

```txt
Steering is locked straight.
```

This can be useful for:

```txt
Tests
Debug mode
Damaged vehicle state
Future special scenarios
```

Because JavaScript can produce `-0`, `clampSteeringAngle()` should normalize `-0` to `0`.

Recommended:

```ts
return Object.is(clamped, -0) ? 0 : clamped;
```

---

# Input-to-Angle Flow

```txt
steeringInput
    ↓
steeringInputToAngle()
    ↓
clampSteeringAngle()
    ↓
steeringAngle
    ↓
updateHeadingFromSteering()
```

---

# Steering Input Is Not Steering Angle

`steeringInput` is normalized intent:

```txt
-1 to 1
```

`steeringAngle` is physical wheel angle:

```txt
radians
```

`maxSteeringAngle` limits that physical wheel angle.

---

# Physics Integration

Recommended update inside `updateCarPhysics()`:

```ts
const steeringAngle = clampSteeringAngle(
  steeringInputToAngle(effectiveSteeringInput, car.maxSteeringAngle),
  car.maxSteeringAngle,
);
```

This guarantees:

```txt
Raw input is normalized.
Input is converted to radians.
Result is constrained by vehicle model.
```

---

# Factory Integration

`createInitialCar()` should support:

```ts
maxSteeringAngle?: number;
```

It should validate:

```ts
if (!isValidMaxSteeringAngle(maxSteeringAngle)) {
  throw new RangeError("maxSteeringAngle must be a finite non-negative value.");
}
```

It should clamp initial steering angle:

```ts
const steeringAngle = clampSteeringAngle(
  options.steeringAngle ?? DEFAULT_CAR_STEERING_ANGLE,
  maxSteeringAngle,
);
```

---

# Examples

## Right Clamp

```txt
steeringAngle = Math.PI
maxSteeringAngle = Math.PI / 6
```

Result:

```txt
Math.PI / 6
```

---

## Left Clamp

```txt
steeringAngle = -Math.PI
maxSteeringAngle = Math.PI / 6
```

Result:

```txt
-Math.PI / 6
```

---

## Inside Limits

```txt
steeringAngle = 0.1
maxSteeringAngle = Math.PI / 6
```

Result:

```txt
0.1
```

---

## Steering Locked

```txt
steeringAngle = -1
maxSteeringAngle = 0
```

Result:

```txt
0
```

---

# Testing Strategy

## Positive Tests

Verify:

```txt
Right steering clamps to positive maxSteeringAngle.
Left steering clamps to negative maxSteeringAngle.
Inside-limit steering is preserved.
Default max steering angle is Math.PI / 6.
Initial car includes maxSteeringAngle.
Physics update keeps steeringAngle inside limits.
```

---

## Edge Tests

Verify:

```txt
maxSteeringAngle = 0 returns 0.
-0 is normalized to 0.
steeringAngle exactly equals maxSteeringAngle.
steeringAngle exactly equals -maxSteeringAngle.
```

---

## Negative Tests

Verify:

```txt
NaN steeringAngle throws.
Infinity steeringAngle throws.
NaN maxSteeringAngle throws.
Infinity maxSteeringAngle throws.
Negative maxSteeringAngle throws.
```

---

# Acceptance Criteria

This task is complete when:

```txt
maxSteeringAngle exists on CarState or physics config.
Steering angle never exceeds positive maxSteeringAngle.
Steering angle never goes below negative maxSteeringAngle.
Default max steering angle is documented in radians.
Unit tests verify left and right clamping.
```

---

# Traceability KPI

```txt
Steering remains bounded by explicit model constraints.
```

Success means:

```txt
No steering angle can escape the configured range.
```

---

# Engineering Lessons Learned

## Steering Needs a Physical Bound

Without a steering limit, a normalized input can become an unrealistic wheel angle.

A vehicle should not turn infinitely sharply.

---

## Bounds Belong to the Model

`maxSteeringAngle` belongs with the vehicle because different vehicles can steer differently.

Examples:

```txt
Sports car
Bus
Truck
Forklift
Autonomous shuttle
```

---

## Clamp After Conversion

The best sequence is:

```txt
Normalize intent
Convert intent to angle
Clamp angle
```

This makes each stage clear and testable.

---

## Beware JavaScript -0

JavaScript has both `0` and `-0`.

Most of the time this does not matter, but strict tests using `Object.is` can distinguish them.

Normalize `-0` when returning clamped steering values.

---

# Future Evolution

This steering limit prepares the simulator for:

```txt
Steering smoothing
Return-to-center
Speed-sensitive max steering
Vehicle-specific steering profiles
Road-grip steering limits
Damage-state steering limits
AI steering constraints
```

The core invariant remains:

```txt
steeringAngle is always inside [-maxSteeringAngle, maxSteeringAngle].
```
