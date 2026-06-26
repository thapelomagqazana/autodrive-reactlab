# Update Car Physics

## Purpose

`updateCarPhysics()` is the pure movement-update boundary for AutoDrive ReactLab.

It calculates the next `CarState` from:

- the previous `CarState`
- physics/control input
- elapsed simulation time

It does not render anything.

It does not read global state.

It does not own the game loop.

---

# Scope

This document covers **Phase 1.6.1 — Create Pure Car Physics Update Function**.

This phase introduces the physics update function and establishes the rules for future movement logic.

It does **not** yet implement full acceleration, friction, steering, collision, sensors, AI, or road-boundary response.

Those behaviours are added in later phases.

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

---

# Input Type

```ts
export interface CarPhysicsInput {
  accelerate: boolean;
  brake: boolean;
  steerLeft: boolean;
  steerRight: boolean;
}
```

---

# Neutral Input

```ts
export const NEUTRAL_CAR_PHYSICS_INPUT = Object.freeze({
  accelerate: false,
  brake: false,
  steerLeft: false,
  steerRight: false,
});
```

Neutral input means:

```txt
No throttle
No braking
No steering
```

---

# Responsibilities

`updateCarPhysics()` is responsible for:

```txt
Validating delta time.
Returning a new CarState object.
Keeping updates deterministic.
Preserving immutability.
Providing one movement-update entry point.
```

Future responsibilities will include:

```txt
Acceleration
Braking
Friction
Reverse movement
Steering
Position updates
Distance travelled updates
Decision state updates
```

---

# Non-Responsibilities

`updateCarPhysics()` must not:

```txt
Mutate input car object.
Read Zustand directly.
Read keyboard state directly.
Draw to canvas.
Use requestAnimationFrame.
Depend on React.
Read DOM APIs.
Start or stop the game loop.
```

---

# Delta Time Rule

`deltaTimeSeconds` must be:

```txt
Finite
Non-negative
Measured in seconds
```

Valid:

```txt
0
0.016
1 / 60
0.1
```

Invalid:

```txt
-1
NaN
Infinity
-Infinity
```

Invalid delta time should throw a `RangeError`.

---

# Why Seconds?

The game loop may produce timestamps in milliseconds, but physics should consume seconds.

Correct flow:

```txt
requestAnimationFrame timestamp
        ↓
millisecondsToSeconds()
        ↓
clampDeltaTime()
        ↓
updateCarPhysics()
```

This keeps physics units clean.

---

# Purity Rule

The function must be pure.

Same inputs should produce the same output.

Correct:

```ts
const nextCar = updateCarPhysics(car, input, 0.016);
```

Incorrect:

```ts
updateCarPhysics(car, input, 0.016);
car.speed = 10;
```

---

# Immutability Rule

The function must return a new object.

```ts
nextCar !== car;
```

But when no physics change has happened yet:

```ts
nextCar;
```

may still be deeply equal to:

```ts
car;
```

This supports Zustand and React update patterns.

---

# Determinism Rule

Given identical:

```txt
CarState
CarPhysicsInput
deltaTimeSeconds
```

the function must return identical values.

No random numbers.

No wall-clock reads.

No hidden state.

---

# Current MVP Behaviour

At Phase 1.6.1, the function is intentionally conservative.

It validates input and returns a cloned car state.

```ts
return {
  ...car,
};
```

Later phases add movement rules incrementally.

---

# Future Physics Direction

Later movement rules will likely follow this conceptual flow:

```txt
1. Validate delta time.
2. Resolve throttle/brake input.
3. Update speed.
4. Apply friction.
5. Clamp speed.
6. Update heading from steering.
7. Update position from speed and heading.
8. Update distance travelled.
9. Return next CarState.
```

A future velocity update will follow the idea behind constant-acceleration motion:

---

# Testing Strategy

## Positive Tests

Verify:

```txt
Returns a new CarState object.
Does not mutate input car.
Accepts delta time in seconds.
Accepts zero delta time.
Is deterministic for the same input.
Neutral input preserves current state at Phase 1.6.1.
```

---

## Negative Tests

Verify:

```txt
Negative delta time throws.
NaN delta time throws.
Infinity delta time throws.
-Infinity delta time throws.
```

---

## Edge Cases

Verify:

```txt
deltaTimeSeconds = 0
deltaTimeSeconds = 1 / 60
deltaTimeSeconds = 0.1
Stationary car
Moving car
Neutral input
Conflicting input, such as accelerate and brake both true
```

Conflicting input handling can be added in later phases.

---

# Acceptance Criteria

This task is complete when:

```txt
updateCarPhysics() exists.
CarPhysicsInput type exists.
Function returns a new CarState object.
Function does not mutate input state.
Function accepts deltaTimeSeconds as seconds.
Function validates deltaTimeSeconds.
Function is deterministic for the same input.
Function is covered by unit tests.
No React, Zustand, canvas, DOM, or requestAnimationFrame dependency exists.
```

---

# Traceability KPI

```txt
100% of MVP car movement updates go through updateCarPhysics().
```

Success means:

```txt
No component, hook, game loop, or store action manually calculates car movement outside updateCarPhysics().
```

---

# Engineering Lessons Learned

## Physics Should Be Pure

Pure functions are easier to test, reason about, and reuse.

A pure physics function can run in:

```txt
Unit tests
Game loop
Replay system
AI training mode
Server-side simulation
Web Worker
Scenario editor
```

without needing React or the DOM.

---

## Separate Input Collection from Physics

Keyboard hooks collect input.

Physics consumes input.

Correct architecture:

```txt
Keyboard / AI / Scenario Input
        ↓
CarPhysicsInput
        ↓
updateCarPhysics()
        ↓
CarState
```

Wrong architecture:

```txt
updateCarPhysics()
        ↓
reads keyboard directly
```

---

## Delta Time Makes Movement Frame-Rate Independent

Using `deltaTimeSeconds` prevents movement from depending on the user's device speed.

A car should not move faster just because the browser renders more frames.

---

## Build the Boundary First

Even before full movement exists, creating the update boundary is valuable.

It gives the project a clean place to add acceleration, friction, steering, and collision logic without spreading movement code across components.

---

# Future Evolution

This physics boundary prepares the simulator for:

```txt
Acceleration
Braking
Friction
Reverse movement
Steering
Collision response
Road-edge penalties
Sensor-informed decisions
AI control input
Replay playback
Deterministic simulation testing
Web Worker physics
```

The core rule remains:

```txt
Previous car + input + delta time = next car
```
