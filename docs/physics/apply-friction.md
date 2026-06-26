# Apply Friction

## Purpose

Friction applies natural deceleration to the car when no active movement input is forcing speed to increase.

It makes the vehicle gradually slow down instead of sliding forever.

The core rule is:

```txt
Friction reduces speed magnitude toward 0.
```

It must never reverse the car direction by itself.

---

# Scope

This document covers **Phase 1.6.3 — Apply Friction / Natural Deceleration**.

This phase updates speed only.

It does **not** implement:

- Braking
- Reverse acceleration
- Steering
- Position updates
- Road-surface-specific grip
- Collision response
- ABS / traction control
- Weather effects

Those behaviours can be added later.

---

# File Location

```txt
src/simulation/engine/physics.ts
```

Recommended related model location:

```txt
src/simulation/vehicle/carState.ts
```

---

# Recommended CarState Field

Friction should live on `CarState` as a vehicle capability/config value.

```ts
/**
 * Natural deceleration in pixels per second squared.
 *
 * Physics uses this to reduce speed toward 0 when no acceleration or braking
 * input is active. Friction must never reverse the vehicle direction by itself.
 */
friction: number;
```

Recommended default:

```ts
export const DEFAULT_CAR_FRICTION = 70;
```

Add to `DEFAULT_CAR_STATE`:

```ts
friction: DEFAULT_CAR_FRICTION;
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
applyFrictionToSpeed(
  speed: number,
  friction: number,
  deltaTimeSeconds: number,
): number;
```

---

# Friction Unit

```txt
pixels per second squared
```

Meaning:

```txt
A friction value of 70 reduces speed by 70 px/s every second.
```

---

# Core Rules

## Forward Motion

If:

```txt
speed > 0
```

Then:

```txt
speed = max(0, speed - friction * deltaTimeSeconds)
```

---

## Reverse Motion

If:

```txt
speed < 0
```

Then:

```txt
speed = min(0, speed + friction * deltaTimeSeconds)
```

---

## Stationary

If:

```txt
speed = 0
```

Then:

```txt
speed remains 0
```

---

# Direction Safety

Friction must never flip vehicle direction.

Bad:

```txt
speed = 10
friction = 70
delta = 1

result = -60
```

Good:

```txt
result = 0
```

Bad:

```txt
speed = -10
friction = 70
delta = 1

result = 60
```

Good:

```txt
result = 0
```

---

# Application Rule

Apply friction only when no active acceleration or braking input is present.

Recommended:

```ts
const shouldApplyFriction = !input.isAccelerating && !input.isBraking;
```

Then:

```ts
const speed = shouldApplyFriction
  ? applyFrictionToSpeed(acceleratedSpeed, car.friction, deltaTimeSeconds)
  : acceleratedSpeed;
```

---

# Why Not Apply Friction While Accelerating?

For the MVP, acceleration should remain easy to reason about.

If friction applies at the same time as acceleration, then expected acceleration tests become less clear.

Example:

```txt
Acceleration says +120
Friction says -70
Net result = +50
```

That may be more realistic later, but for MVP clarity, friction should apply only when no throttle/brake input is active.

---

# Validation Rules

Validate:

```txt
speed is finite
friction is finite and non-negative
deltaTimeSeconds is finite and non-negative
```

Valid friction:

```txt
0
1
70
120.5
```

Invalid friction:

```txt
-1
NaN
Infinity
-Infinity
```

Invalid values should throw a `RangeError`.

---

# Example Calculations

## Forward Speed

Given:

```txt
speed = 100
friction = 70
deltaTimeSeconds = 1
```

Result:

```txt
100 - 70 = 30
```

---

## Reverse Speed

Given:

```txt
speed = -100
friction = 70
deltaTimeSeconds = 1
```

Result:

```txt
-100 + 70 = -30
```

---

## Near Zero Forward

Given:

```txt
speed = 10
friction = 70
deltaTimeSeconds = 1
```

Result:

```txt
max(0, -60) = 0
```

---

## Near Zero Reverse

Given:

```txt
speed = -10
friction = 70
deltaTimeSeconds = 1
```

Result:

```txt
min(0, 60) = 0
```

---

# Implementation Sketch

```ts
export function applyFrictionToSpeed(
  speed: number,
  friction: number,
  deltaTimeSeconds: number,
): number {
  assertValidDeltaTimeSeconds(deltaTimeSeconds);
  assertFiniteNumber(speed, "speed");
  assertNonNegativeFiniteNumber(friction, "friction");

  const frictionAmount = friction * deltaTimeSeconds;

  if (speed > 0) {
    return Math.max(0, speed - frictionAmount);
  }

  if (speed < 0) {
    return Math.min(0, speed + frictionAmount);
  }

  return 0;
}
```

---

# Testing Strategy

## Positive Tests

Verify:

```txt
Positive speed decays toward 0.
Negative speed decays toward 0.
Zero speed stays 0.
Friction uses delta time.
Zero friction keeps speed unchanged.
Zero delta time keeps speed unchanged.
```

---

## Direction Safety Tests

Verify:

```txt
Positive speed never becomes negative.
Negative speed never becomes positive.
Near-zero forward speed clamps to 0.
Near-zero reverse speed clamps to 0.
```

---

## Integration Tests

Verify:

```txt
updateCarPhysics() applies friction with neutral input.
updateCarPhysics() does not apply friction while accelerating.
updateCarPhysics() does not mutate input car.
```

---

## Negative Tests

Verify:

```txt
Negative friction throws.
NaN friction throws.
Infinity friction throws.
NaN speed throws.
Infinity speed throws.
Invalid delta time throws.
```

---

# Acceptance Criteria

This task is complete when:

```txt
Positive speed decays toward 0.
Negative speed decays toward 0.
Friction never flips speed from positive to negative.
Friction never flips speed from negative to positive.
Friction uses delta time.
Unit tests cover forward, reverse, and near-zero speeds.
Car eventually becomes stationary without active input.
Input car state is not mutated.
```

---

# Traceability KPI

```txt
Car eventually becomes stationary without active input.
```

Success means:

```txt
Neutral input repeatedly applied through updateCarPhysics() drives speed toward 0.
```

---

# Engineering Lessons Learned

## Friction Reduces Magnitude

Friction should reduce the magnitude of speed.

It should not blindly subtract from speed.

Wrong:

```ts
speed - friction * deltaTimeSeconds;
```

This works for positive speed but breaks reverse speed.

Correct:

```txt
If speed is positive, move downward toward 0.
If speed is negative, move upward toward 0.
```

---

## Friction Is Not Reverse Input

Friction should stop the car.

It should not make the car reverse.

That is why the implementation uses:

```ts
Math.max(0, ...)
```

for positive speeds and:

```ts
Math.min(0, ...)
```

for negative speeds.

---

## Vehicle Capability Belongs in CarState

Friction is like acceleration.

Different vehicles may eventually have different friction values.

Examples:

```txt
Sedan
Truck
Sports car
Wet-road vehicle
Ice-road scenario
```

So friction belongs in vehicle state/config, not as a hidden magic number inside physics.

---

# Future Evolution

This friction model can later support:

```txt
Road-surface grip
Weather effects
Tyre wear
Brake assist
Traction control
Drift mode
Off-road penalties
Vehicle-specific handling profiles
```

The MVP rule remains simple:

```txt
Friction moves speed toward 0 without changing direction.
```
