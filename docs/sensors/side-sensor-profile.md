# Left and Right Side Sensor Profiles

## Overview

Side sensor profiles define shorter side-facing and diagonal front-side rays for the car.

They improve future awareness for:

- Lane boundaries
- Road edges
- Nearby vehicles
- Nearby obstacles
- Side clearance

This module only generates side ray geometry.

It does not detect objects, render sensors, update dashboard UI, or make AI steering decisions.

---

## Module Location

```txt
src/simulation/sensors/sideSensorProfile.ts
```

Recommended test file:

```txt
src/simulation/sensors/sideSensorProfile.test.ts
```

---

## Purpose

The side sensor profile gives driving-domain meaning to generic ray geometry.

Generic ray casting answers:

```txt
Where does this ray start?
Where does this ray end?
What angle does it use?
How long is it?
```

The side sensor profile answers:

```txt
Which ray is left-diagonal-front?
Which ray is left-side?
Which ray is right-diagonal-front?
Which ray is right-side?
Which rays belong to the left group?
Which rays belong to the right group?
```

---

## Coordinate and Angle Convention

The project uses the existing car heading convention:

- Positive X moves right.
- Positive Y moves down.
- `0` radians means the car faces upward/north.
- Positive angle rotation is clockwise.

Examples:

|               Angle | Direction    |
| ------------------: | ------------ |
|                 `0` | Up / North   |
|       `Math.PI / 2` | Right / East |
|           `Math.PI` | Down / South |
| `(3 * Math.PI) / 2` | Left / West  |

---

## Scope

### In Scope

This module defines:

- Side sensor ray labels
- Left side ray group
- Right side ray group
- Combined deterministic side ray order
- Diagonal front-side rays
- Side ray length ratio
- Disabled side sensor behavior

### Out of Scope

This module does not implement:

- Road-edge detection
- Lane-boundary detection
- Obstacle detection
- Vehicle detection
- Pedestrian detection
- Sensor readings
- Sensor rendering
- Dashboard UI
- AI steering behavior
- Collision detection
- Rear sensors

---

## Default Side Ray Labels

The default side profile has four semantic labels:

```ts
type SideSensorRayLabel =
  | "left-diagonal-front"
  | "left-side"
  | "right-diagonal-front"
  | "right-side";
```

Canonical order:

```ts
["left-diagonal-front", "left-side", "right-diagonal-front", "right-side"];
```

---

## Ray Layout

The default side profile generates four rays.

| Order | Label                  | Angle                     |
| ----: | ---------------------- | ------------------------- |
|   `0` | `left-diagonal-front`  | `car.angle - Math.PI / 4` |
|   `1` | `left-side`            | `car.angle - Math.PI / 2` |
|   `2` | `right-diagonal-front` | `car.angle + Math.PI / 4` |
|   `3` | `right-side`           | `car.angle + Math.PI / 2` |

---

## Grouping

Side rays are returned in three groups:

```ts
interface SideSensorRayGroups {
  readonly left: readonly SideSensorRay[];
  readonly right: readonly SideSensorRay[];
  readonly all: readonly SideSensorRay[];
}
```

### Left Group

```txt
left-diagonal-front
left-side
```

### Right Group

```txt
right-diagonal-front
right-side
```

### All Group

```txt
left-diagonal-front
left-side
right-diagonal-front
right-side
```

The `all` group preserves deterministic ordering for tests, rendering, telemetry, and future batch processing.

---

## Side Ray Length

Side rays are shorter than front rays.

Default ratio:

```ts
sideRayLength = frontRayLength * 0.6;
```

If the base sensor config uses:

```ts
rayLength = 180;
```

Then side rays use:

```ts
sideRayLength = 108;
```

### Rationale

Side rays are shorter because side awareness is usually for nearby objects, road edges, lane boundaries, and side clearance.

Long side rays may create noisy or unrealistic detections in future detection logic.

---

## Disabled Sensors

If sensors are disabled:

```ts
sensorConfig.sensorEnabled = false;
```

Then side ray generation returns:

```ts
{
  left: [],
  right: [],
  all: [],
}
```

Disabled side sensors do not preserve previous rays.

State cleanup belongs to `SensorState` update/reset logic.

---

## Determinism

Side sensor generation is deterministic.

Calling it repeatedly with the same car pose and sensor config returns equivalent ray geometry.

The function does not depend on:

- Delta time
- Randomness
- Global state
- Store state
- Canvas state
- Browser state
- Current frame number

---

## Immutability

The side profile must not mutate:

- `CarState`
- `SensorConfig`
- Existing sensor arrays
- Existing sensor readings

It returns new grouped ray arrays.

---

## Validation

The side profile validates:

- Car position
- Car angle
- Sensor configuration
- Derived side ray length

Invalid values must be rejected.

Examples of invalid values:

```txt
car.positionX = NaN
car.positionY = Infinity
car.angle = -Infinity
rayLength = 0
rayLength = NaN
sideRayLength <= 0
sideRayLength >= frontRayLength
```

---

## Design Rule

This module may import:

- Sensor model types
- Sensor config helpers
- Generic ray-generation helpers
- Minimal car pose types

This module must not import:

- React
- Zustand store state
- Canvas APIs
- DOM APIs
- Browser APIs
- Rendering modules
- Dashboard components
- AI modules
- Pathfinding modules

---

## Testing Requirements

Tests must verify:

- Default side profile config derives side length from front ray length.
- Left and right side ray groups are generated.
- Combined `all` group contains four rays.
- Labels are deterministic.
- Left diagonal front ray angle is `car.angle - Math.PI / 4`.
- Left side ray angle is `car.angle - Math.PI / 2`.
- Right diagonal front ray angle is `car.angle + Math.PI / 4`.
- Right side ray angle is `car.angle + Math.PI / 2`.
- Side rays are shorter than front rays.
- Side rays rotate with car heading.
- Disabled sensors return empty groups.
- Repeated calls are deterministic.
- Car state is not mutated.
- Invalid car pose is rejected.

---

## Acceptance Criteria Mapping

| Acceptance Criterion                 | Covered By                                    |
| ------------------------------------ | --------------------------------------------- |
| Left side ray exists                 | `left-side` label                             |
| Right side ray exists                | `right-side` label                            |
| Diagonal side rays exist             | `left-diagonal-front`, `right-diagonal-front` |
| Side labels are explicit             | `SideSensorRayLabel`                          |
| Side rays shorter than front rays    | `DEFAULT_SIDE_SENSOR_LENGTH_RATIO`            |
| Side readings grouped separately     | Left/right/all grouping model prepares this   |
| Rays rotate with car heading         | Relative angle formulas                       |
| Disabled sensors return no side rays | Empty groups                                  |
| Deterministic ordering               | Canonical label order                         |
| Unit tests exist                     | Testing requirements                          |

---

## Related Files

```txt
src/simulation/sensors/sensorModel.ts
src/simulation/sensors/sensorState.ts
src/simulation/sensors/raycasting.ts
src/simulation/sensors/frontSensorProfile.ts
src/simulation/sensors/sideSensorProfile.ts
src/simulation/sensors/sideSensorProfile.test.ts
src/simulation/vehicle/carState.ts
```

---

## Future Enhancements

Later tasks may add:

- Rear side diagonal rays
- Rear sensor profile
- Separate side sensor enable flag
- Configurable side ray ratio
- Per-label ray lengths
- Labelled side sensor readings
- Side sensor rendering
- Side clearance telemetry
- Lane boundary proximity
- Road-edge proximity
- Adjacent vehicle detection
- Time-to-collision calculations
- Sensor confidence values

---

## Technical Debt Guardrails

Avoid:

- Duplicating generic ray-generation logic
- Adding intersection detection
- Adding rendering logic
- Reading Zustand store state
- Using Canvas APIs
- Using DOM APIs
- Adding dashboard formatting
- Adding AI steering rules
- Mutating car state
- Mutating sensor config
- Mixing front, side, and rear profiles into one unclear function
- Returning ungrouped side rays only
- Allowing label/order mismatch
