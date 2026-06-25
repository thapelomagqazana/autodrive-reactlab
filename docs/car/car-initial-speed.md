# Car Initial Speed

## Purpose

The car's initial speed defines the vehicle's movement state when a simulation first loads or when the simulation is reset.

For the MVP, every fresh simulation must begin with the car stationary.

The rule is simple:

```txt
Initial speed = 0 pixels per second
```

The car must not move until the simulation engine applies acceleration, braking, reverse input, or future AI control.

---

# Scope

This document covers **Phase 1.4.4 — Set Initial Speed to Stationary**.

This task ensures that the initial `CarState` created by `createInitialCar()` starts with zero motion.

It does not implement acceleration, friction, braking, reverse motion, or physics updates.

---

# File Locations

```txt
src/simulation/vehicle/carState.ts
src/simulation/vehicle/createInitialCar.ts
```

---

# Canonical Field

```ts
speed: number;
```

---

# Unit

```txt
pixels per second
```

---

# Speed Meaning

```txt
Positive speed = forward movement
Negative speed = reverse movement
Zero speed = stationary
```

---

# Default Constant

```ts
export const DEFAULT_CAR_SPEED = 0;
```

This constant is the canonical source for fresh vehicle speed.

Do not duplicate the value elsewhere.

---

# Factory Rule

`createInitialCar()` must use:

```ts
speed: options.speed ?? DEFAULT_CAR_SPEED;
```

Default result:

```ts
car.speed === 0;
```

---

# Lifecycle Rule

Fresh simulation:

```txt
speed = 0
```

Paused simulation:

```txt
speed remains unchanged
```

Reset simulation:

```txt
speed = 0
```

Running simulation:

```txt
physics may update speed
```

---

# No Default Drift

A newly created car must not drift before the simulation starts.

This means the following fields should align:

```txt
speed = 0
decision = "idle"
distanceTravelled = 0
```

These defaults make the simulation predictable.

---

# Reset Behaviour

Reset must recreate the car through the factory:

```ts
set({
  car: createInitialCar(road),
});
```

Do not manually reset only some fields:

```ts
car.speed = 0;
```

Manual partial reset can leave stale steering, collision, distance, or decision state behind.

---

# Explicit Overrides

The factory may support explicit speed override for:

```txt
Tests
Scenario tooling
Replay systems
Future scenario editor
```

Example:

```ts
createInitialCar(road, {
  speed: 25,
});
```

Normal simulation startup should not pass a speed override.

---

# Validation

Initial speed must be finite.

Valid:

```txt
0
10
-5
25.5
```

Invalid:

```txt
NaN
Infinity
-Infinity
```

Invalid speed values should throw a `RangeError`.

---

# Acceptance Criteria

This task is complete when:

```txt
Initial speed is exactly 0.
Reset restores speed to 0.
No default drift occurs before simulation start.
Unit tests verify initial speed.
Invalid speed overrides are rejected.
```

---

# Testing Strategy

## Positive Tests

Verify:

```txt
createInitialCar() returns speed 0.
Repeated calls return speed 0.
Reset-safe car creation returns speed 0.
Default decision is idle.
Default distance travelled is 0.
```

---

## Negative Tests

Verify:

```txt
speed = NaN throws.
speed = Infinity throws.
speed = -Infinity throws.
```

---

## Edge Cases

Verify:

```txt
Explicit speed override is allowed for controlled tests.
Negative finite speed is accepted for future reverse scenarios.
Zero remains exact.
```

---

# Traceability KPI

```txt
Fresh simulation starts with zero vehicle motion.
```

Success means:

```txt
100% of fresh and reset car states use DEFAULT_CAR_SPEED unless explicitly overridden.
```

---

# Engineering Lessons Learned

## Initial State Is Not Physics

Initial speed describes lifecycle state.

Physics later changes speed.

Do not mix the two concerns.

Correct:

```txt
Factory creates speed = 0.
Physics updates speed when simulation runs.
```

Incorrect:

```txt
Factory starts car with movement.
```

---

## Reset Must Recreate State

A reliable reset should recreate a fresh car state through the same factory used at startup.

This guarantees:

```txt
No stale speed
No stale steering
No stale decision
No stale collision count
No stale distance travelled
```

---

## Zero Motion Is a Safety Baseline

Starting stationary makes the MVP easier to test and reason about.

It prevents:

```txt
Unexpected movement
Flaky tests
Dashboard drift
Frame timing bugs
Confusing first render
```

---

# Future Evolution

Future features may introduce:

```txt
Scenario-defined start speeds
Replay snapshots
AI-controlled launch states
Traffic spawn velocities
Rolling-start scenarios
```

Those should use explicit factory options.

The default remains:

```txt
speed = 0
```
