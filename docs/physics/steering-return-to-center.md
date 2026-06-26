# Steering Return-to-Center

## Purpose

Steering return-to-center smoothly restores the steering wheel toward the neutral position after steering input is released.

Without this behaviour, the steering angle would remain fixed indefinitely after the driver (or AI) stops steering, causing unrealistic continuous turning.

This phase introduces a configurable steering recovery rate that gradually moves the steering angle back to zero.

---

# Scope

This document covers **Phase 1.7.5 — Add Steering Return-to-Center**.

This phase implements:

- Steering recovery toward zero
- Configurable steering return rate
- Frame-rate independent steering recovery
- Overshoot prevention

This phase does **not** implement:

- Steering damping
- Tyre slip
- Self-aligning torque
- Ackermann steering geometry
- Suspension dynamics
- Road surface grip
- Force feedback

---

# File Locations

```text
src/simulation/vehicle/carState.ts
src/simulation/vehicle/createInitialCar.ts
src/simulation/engine/physics.ts
src/simulation/engine/physics.test.ts
```

---

# CarState Addition

```ts
/**
 * Steering recovery speed.
 *
 * Units:
 * radians per second
 *
 * Controls how quickly steering returns toward zero
 * after steering input is released.
 */
steeringReturnRate: number;
```

---

# Recommended Default

```ts
export const DEFAULT_STEERING_RETURN_RATE = Math.PI / 2;
```

Meaning:

```text
≈ 90° of steering recovery per second.
```

This provides responsive but smooth steering behaviour.

---

# Physics Rule

When no steering input exists:

```text
steeringInput == 0
```

Recover steering:

```text
returnAmount = steeringReturnRate × deltaTimeSeconds
```

Positive steering:

```text
steeringAngle =
max(
    0,
    steeringAngle - returnAmount
)
```

Negative steering:

```text
steeringAngle =
min(
    0,
    steeringAngle + returnAmount
)
```

---

# Overshoot Rule

Steering must never cross zero.

Example:

Current steering:

```text
0.04
```

Recovery amount:

```text
0.20
```

Incorrect:

```text
-0.16
```

Correct:

```text
0
```

The same rule applies to negative steering.

---

# Steering Recovery Algorithm

Recommended implementation:

```ts
export function returnSteeringAngleToCenter(
  steeringAngle: number,
  steeringReturnRate: number,
  deltaTimeSeconds: number,
): number {
  const amount = steeringReturnRate * deltaTimeSeconds;

  if (steeringAngle > 0) {
    return Math.max(0, steeringAngle - amount);
  }

  if (steeringAngle < 0) {
    return Math.min(0, steeringAngle + amount);
  }

  return 0;
}
```

---

# Physics Pipeline

Recommended order:

```text
Normalize input
        ↓
Apply acceleration
        ↓
Apply braking
        ↓
Apply friction
        ↓
Clamp speed
        ↓
Resolve steering threshold
        ↓
IF steeringInput ≠ 0
    steeringAngle ← steeringInputToAngle()
ELSE
    steeringAngle ← returnSteeringAngleToCenter()
        ↓
Clamp steering angle
        ↓
Update heading
        ↓
Update position
```

This ensures:

- Steering is updated before heading.
- Heading is updated before movement.

---

# Why Recovery Happens Before Heading

Heading uses:

```text
car.steeringAngle
```

Therefore steering must first become:

```text
smaller
```

before heading can naturally stop changing.

This creates a smooth transition instead of an abrupt stop.

---

# Behaviour Examples

## Example 1

```text
Current steering = 0.5

Return rate = 0.2

Delta = 1 second
```

Recovery:

```text
0.5 → 0.3
```

---

## Example 2

```text
Current steering = -0.5

Return rate = 0.2

Delta = 1 second
```

Recovery:

```text
-0.5 → -0.3
```

---

## Example 3

```text
Current steering = 0.05

Return amount = 0.20
```

Recovery:

```text
0
```

No overshoot.

---

# Validation Rules

Validate:

```text
steeringAngle is finite

steeringReturnRate is finite

steeringReturnRate ≥ 0

deltaTimeSeconds is finite

deltaTimeSeconds ≥ 0
```

Invalid values should throw:

```text
RangeError
```

---

# Factory Integration

`createInitialCar()` should support:

```ts
steeringReturnRate?: number;
```

Default:

```ts
DEFAULT_STEERING_RETURN_RATE;
```

Validation:

```ts
isValidSteeringReturnRate();
```

---

# Physics Integration

Inside `updateCarPhysics()`:

```ts
if (effectiveSteeringInput === 0) {
  steeringAngle = returnSteeringAngleToCenter(
    car.steeringAngle,
    car.steeringReturnRate,
    deltaTimeSeconds,
  );
} else {
  steeringAngle = steeringInputToAngle(effectiveSteeringInput, car.maxSteeringAngle);
}

steeringAngle = clampSteeringAngle(steeringAngle, car.maxSteeringAngle);
```

This guarantees:

- Active steering immediately responds.
- Released steering smoothly recenters.
- Steering never exceeds configured limits.

---

# Testing Strategy

## Positive Tests

Verify:

```text
Positive steering returns toward zero.

Negative steering returns toward zero.

Zero steering remains zero.

Delta time affects recovery distance.

Recovery never overshoots.

Zero return rate produces no change.
```

---

## Edge Cases

Verify:

```text
Very small steering values.

Very small delta time.

Large delta time.

Large steering angle.

Maximum steering angle.

Exactly zero steering.
```

---

## Negative Tests

Verify:

```text
NaN steering angle.

Infinity steering angle.

Negative return rate.

NaN delta time.

Infinity delta time.
```

All should throw:

```text
RangeError
```

---

# Acceptance Criteria

This task is complete when:

```text
Steering returns toward 0 when no input exists.

Positive steering decreases toward 0.

Negative steering increases toward 0.

Return uses delta time.

Return never overshoots.

Unit tests verify positive,
negative,
and near-zero recovery.
```

---

# Traceability KPI

```text
Steering behaviour feels stable and predictable after input release.
```

---

# Engineering Lessons Learned

## Steering Input Is Temporary

Steering input represents driver intent.

Once the input disappears, the steering wheel should naturally recover.

---

## Steering Angle Is Vehicle State

The steering angle belongs to the vehicle.

The input belongs to the driver (or AI).

Keeping them separate makes the physics easier to reason about.

---

## Never Overshoot

Overshooting zero introduces oscillation:

```text
Left
↓

Right
↓

Left
↓

Right
```

Preventing overshoot guarantees stable convergence.

---

## Delta Time Keeps Behaviour Frame-Rate Independent

Recovery distance depends on elapsed time, not frame count.

This ensures identical steering recovery at:

- 30 FPS
- 60 FPS
- 120 FPS

---

# Future Evolution

This implementation provides a foundation for more advanced steering systems, including:

- Speed-sensitive steering return
- Variable steering ratios
- Self-aligning tyre forces
- Steering damping
- Hydraulic steering simulation
- Electric power steering models
- Vehicle-specific steering characteristics
- AI steering smoothing
- Autonomous lane-centering

The long-term invariant remains:

```text
Steering angle always evolves smoothly,
remains physically bounded,
and converges predictably toward zero when no steering input is present.
```
