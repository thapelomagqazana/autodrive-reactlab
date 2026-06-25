# Car Initial Heading

## Purpose

The initial heading defines the direction that the vehicle faces when a simulation starts or when the simulation is reset.

For the MVP, the vehicle must begin aligned with the direction of travel on the straight road.

The canonical convention is:

```text
0 radians = facing upward (north)
```

The car begins near the bottom of the road and travels toward the top of the canvas.

---

# Scope

This document covers **Phase 1.4.5 — Set Initial Vehicle Heading**.

This phase defines only the initial heading stored in the vehicle state.

It does **not** implement:

- Steering
- Turning
- Vehicle rotation physics
- Wheel angle calculations
- Angular velocity

Those responsibilities belong to later phases.

---

# File Locations

```text
src/simulation/vehicle/carState.ts
src/simulation/vehicle/createInitialCar.ts
src/simulation/engine/carRenderer.ts
```

---

# Canonical Field

```ts
angle: number;
```

---

# Unit

The heading is always measured in:

```text
Radians
```

Never store degrees inside `CarState`.

---

# Coordinate Convention

The simulation uses the HTML Canvas coordinate system.

```text
Origin
┌────────────────────────► X
│
│
│
▼
Y
```

Canvas axes:

```text
Positive X = right
Positive Y = down
```

Vehicle heading uses the following convention:

```text
0 radians
      ↑
      │
      │
π/2 → │ ← -π/2
      │
      ▼
     π
```

Meaning:

| Heading | Direction    |
| ------- | ------------ |
| 0       | Up / North   |
| π / 2   | Right / East |
| π       | Down / South |
| -π / 2  | Left / West  |

---

# Default Heading

The MVP default heading is:

```ts
export const DEFAULT_CAR_ANGLE = 0;
```

This constant is the single source of truth.

---

# Factory Rule

`createInitialCar()` must initialize the heading as:

```ts
angle: options.angle ?? DEFAULT_CAR_ANGLE;
```

Normal startup should therefore produce:

```text
angle = 0
```

---

# Road Alignment

The MVP road is vertical.

The car starts:

```text
Bottom
    ▲
    │
    │
 Car
    │
    │
Top
```

Therefore:

```text
Vehicle heading
=
Road direction
```

No correction is required.

---

# Renderer Contract

The renderer rotates the vehicle using:

```ts
context.rotate(car.angle);
```

The renderer must never convert:

```text
Radians → Degrees
```

Canvas APIs already expect radians.

---

# Physics Contract

Future steering physics updates the heading.

Current ownership:

```text
Factory
    │
    ▼
Initial angle
```

Future ownership:

```text
Physics
    │
    ▼
Updated angle
```

The renderer always consumes the current value.

---

# State Ownership

The heading belongs exclusively to:

```text
CarState.angle
```

No renderer, dashboard, or component should maintain a duplicate heading value.

---

# Validation

The heading must be finite.

Valid:

```text
0
π
π / 2
-π / 2
```

Invalid:

```text
NaN
Infinity
-Infinity
```

Invalid values should throw a `RangeError`.

---

# Reset Behaviour

Reset recreates the car using:

```ts
createInitialCar(road);
```

Result:

```text
angle = 0
```

Every reset returns the vehicle to its forward-facing orientation.

---

# Explicit Overrides

The factory supports explicit heading overrides.

Example:

```ts
createInitialCar(road, {
  angle: Math.PI / 2,
});
```

These overrides are intended for:

- Unit tests
- Replay systems
- Scenario editor
- AI debugging
- Future missions

Normal startup should not override the default heading.

---

# Testing Strategy

## Positive Tests

Verify:

```text
Initial heading equals 0.
Heading is stored in radians.
Renderer can consume angle directly.
Reset restores heading to 0.
Explicit finite override works.
```

---

## Negative Tests

Verify:

```text
NaN throws.
Infinity throws.
-Infinity throws.
```

---

## Edge Cases

Verify:

```text
0 radians
π radians
π / 2
-π / 2
Very small angles
Very large finite angles
```

---

# Acceptance Criteria

This task is complete when:

```text
Initial angle is documented in radians.
Initial angle equals 0 radians by default.
Vehicle faces upward along the MVP road.
Renderer consumes the heading directly.
Reset restores the heading.
Tests verify default heading.
No degree/radian ambiguity exists.
```

---

# Traceability KPI

```text
Initial car heading aligns with MVP road direction.
```

Success means:

```text
100% of initial vehicle orientation is derived from DEFAULT_CAR_ANGLE.
```

---

# Engineering Lessons Learned

## Heading Is State

The vehicle heading is runtime state.

It is not a rendering concern.

The renderer displays the heading but never owns it.

---

## One Angular Unit

Every subsystem should use radians.

Using multiple angular units inevitably leads to incorrect rendering and steering behaviour.

The simulation should standardize on radians from the beginning.

---

## Rendering Should Trust State

The renderer should simply execute:

```ts
context.rotate(car.angle);
```

It should never attempt to reinterpret or normalize the angle.

Keeping rendering passive makes the pipeline predictable and easy to test.

---

## Reset Means Fresh Orientation

A proper reset restores:

- Position
- Speed
- Steering
- Heading
- Telemetry

Returning the heading to its canonical default guarantees deterministic startup and repeatable test execution.

---

# Future Evolution

This design naturally supports future capabilities such as:

```text
Steering physics
Slip-angle modelling
Vehicle yaw
Angular velocity
Replay orientation
Scenario-specific spawn headings
Curved roads
Intersections
Roundabouts
Parking manoeuvres
```

None of these features require changing the renderer API.

Only the producer of `CarState.angle` changes; the renderer continues to consume the current heading consistently.
