# Clamp Speed

## Purpose

Vehicle speed must always remain within the movement limits defined by the vehicle model.

Speed clamping is the **final safety gate** in the physics update pipeline.

Regardless of how speed changes—through acceleration, braking, reverse acceleration, friction, AI control, or future physics—it must always satisfy the configured limits before the next `CarState` is returned.

---

# Scope

This document covers **Phase 1.6.4 — Clamp Forward and Reverse Speed**.

This phase introduces explicit movement constraints and ensures the physics engine cannot produce unrealistic speeds.

This phase does **not** introduce:

- New acceleration rules
- Braking behaviour
- Steering
- Position updates
- Collision response

It only guarantees that the resulting speed is valid.

---

# File Location

```text
src/simulation/engine/physics.ts
```

---

# Purpose of Clamping

The simulator may apply several speed-changing operations during a single physics update:

```text
Acceleration
Braking
Reverse acceleration
Friction
Future traction control
Future ABS
Future AI overrides
```

Each operation can change the speed.

Before returning the next `CarState`, the speed must be constrained.

---

# Vehicle Constraints

Every vehicle exposes two movement limits.

```ts
maxSpeed: number;
maxReverseSpeed: number;
```

Both values are measured in:

```text
pixels per second
```

Both must always be positive.

Example:

```text
maxSpeed = 260
maxReverseSpeed = 80
```

---

# Allowed Speed Range

The legal movement range is:

```text
-maxReverseSpeed <= speed <= maxSpeed
```

Example:

```text
-80 <= speed <= 260
```

Any value outside this interval is invalid.

---

# Public API

```ts
clampSpeed(
    speed: number,
    maxSpeed: number,
    maxReverseSpeed: number,
): number;
```

Optional convenience helper:

```ts
clampCarPhysicsSpeed(
    car: Pick<CarState, "speed" | "maxSpeed" | "maxReverseSpeed">,
): number;
```

---

# Core Algorithm

Recommended implementation:

```ts
return Math.min(maxSpeed, Math.max(-maxReverseSpeed, speed));
```

This produces three behaviours:

```text
Speed above maxSpeed
↓

Returns maxSpeed

-------------------

Speed below -maxReverseSpeed
↓

Returns -maxReverseSpeed

-------------------

Speed already inside limits
↓

Returns unchanged
```

---

# Examples

## Forward Clamp

Input:

```text
speed = 500
maxSpeed = 260
```

Output:

```text
260
```

---

## Reverse Clamp

Input:

```text
speed = -500
maxReverseSpeed = 80
```

Output:

```text
-80
```

---

## Already Valid

Input:

```text
speed = 120
```

Output:

```text
120
```

---

## Exactly On Limit

Input:

```text
speed = 260
```

Output:

```text
260
```

Input:

```text
speed = -80
```

Output:

```text
-80
```

---

# Physics Pipeline

Clamping should always be the final speed operation.

Recommended order:

```text
Validate delta time
        ↓
Acceleration
        ↓
Braking (future)
        ↓
Reverse acceleration (future)
        ↓
Friction
        ↓
Clamp speed
        ↓
Update position (future)
        ↓
Return new CarState
```

Do not clamp before friction or braking if later calculations may change the speed again.

---

# Validation Rules

Validate:

```text
speed is finite
maxSpeed is finite
maxReverseSpeed is finite
maxSpeed > 0
maxReverseSpeed > 0
```

Reject:

```text
NaN
Infinity
-Infinity
0 movement limits
Negative movement limits
```

Throw:

```ts
RangeError;
```

---

# Immutability

Clamping must never modify the existing car object.

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

# Determinism

Given identical:

```text
speed
maxSpeed
maxReverseSpeed
```

The function must always return the same value.

No randomness.

No global state.

No browser APIs.

---

# Testing Strategy

## Positive Tests

Verify:

```text
Forward speed clamps to maxSpeed.
Reverse speed clamps to -maxReverseSpeed.
Speed inside limits is unchanged.
Speed exactly at limits is unchanged.
Zero speed is unchanged.
```

---

## Integration Tests

Verify:

```text
Acceleration cannot exceed maxSpeed.
Reverse movement cannot exceed maxReverseSpeed.
Friction cannot move speed outside limits.
updateCarPhysics() returns a clamped speed.
```

---

## Negative Tests

Verify:

```text
NaN speed throws.
Infinity speed throws.
Negative maxSpeed throws.
Negative maxReverseSpeed throws.
Zero maxSpeed throws.
Zero maxReverseSpeed throws.
```

---

## Edge Cases

Verify:

```text
speed = maxSpeed
speed = -maxReverseSpeed
speed = 0
speed = 0.0001
speed = -0.0001
Very large positive speed
Very large negative speed
```

---

# Acceptance Criteria

This task is complete when:

```text
Forward speed cannot exceed maxSpeed.
Reverse speed cannot exceed -maxReverseSpeed.
Clamp is applied after all speed changes.
Both limits are validated as positive numbers.
Unit tests verify forward and reverse clamping.
Physics remains deterministic.
Input CarState is not mutated.
```

---

# Traceability KPI

```text
Vehicle speed never exceeds configured movement constraints.
```

Success means every physics update produces a speed that satisfies:

```text
-maxReverseSpeed <= speed <= maxSpeed
```

---

# Engineering Lessons Learned

## Clamping Is a Safety Boundary

Every movement calculation may introduce unexpected values.

Rather than trusting every individual calculation, the simulator performs one final validation step before exposing the updated state.

Think of clamping as a "guard rail" around the physics engine.

---

## Vehicle Limits Belong to the Model

The movement limits are vehicle properties.

Different vehicles can expose different capabilities.

Examples:

```text
Sports car
Truck
Bus
Race car
Forklift
Autonomous shuttle
```

Keeping the limits in `CarState` allows future vehicle types without changing the physics algorithm.

---

## Clamp Once, Clamp Last

Multiple intermediate clamps increase complexity and make behaviour harder to reason about.

The preferred design is:

```text
Perform all speed calculations.

↓

Clamp once.

↓

Return the next immutable state.
```

This keeps the update pipeline predictable and easy to test.

---

## Deterministic Physics Enables Better Testing

Because the clamp function is pure, unit tests can verify it independently from the rest of the physics engine.

This makes failures easier to diagnose and reduces technical debt as new movement features are introduced.

---

# Future Evolution

The same speed-clamping boundary will continue protecting the simulator as additional features are added:

```text
Braking
Reverse acceleration
Cruise control
Adaptive cruise control
AI throttle control
Emergency braking
Road-surface modifiers
Vehicle-specific performance profiles
```

Regardless of future complexity, the final invariant remains:

```text
Vehicle speed must always stay within its configured movement limits.
```
