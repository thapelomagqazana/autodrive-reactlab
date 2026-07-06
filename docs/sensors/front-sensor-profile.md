# Front Sensor Ray Profile

## Overview

The front sensor ray profile defines the default forward-facing sensor layout for the car.

It uses the generic ray-generation module:

```txt
src/simulation/sensors/raycasting.ts
```

The profile does not duplicate ray-generation logic. It only defines:

- Default front sensor ray count
- Default front sensor spread
- Stable semantic ray labels
- Front-facing ray layout
- Front sensor profile behavior

---

## Module Location

```txt
src/simulation/sensors/frontSensorProfile.ts
```

Recommended test file:

```txt
src/simulation/sensors/frontSensorProfile.test.ts
```

---

## Purpose

The front sensor profile gives driving-domain meaning to generic sensor rays.

Generic ray generation answers:

```txt
Where does this ray start?
Where does this ray end?
What angle does it use?
How long is it?
```

The front sensor profile answers:

```txt
Which ray is wide-left?
Which ray is front-left?
Which ray is forward?
Which ray is front-right?
Which ray is wide-right?
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

- Front sensor profile defaults
- Front sensor ray labels
- Front-facing ray generation through `castSensorRays()`
- Front ray ordering
- Front spread behavior
- Disabled front sensor behavior

### Out of Scope

This module does not implement:

- Ray-casting intersections
- Obstacle detection
- Road-boundary detection
- Lane-boundary detection
- Traffic-light detection
- Sensor readings
- Sensor rendering
- Dashboard display
- AI decision-making
- Collision detection

---

## Default Front Sensor Configuration

The default front profile uses:

| Field          |                                Value |
| -------------- | -----------------------------------: |
| Ray count      |                                  `5` |
| Ray spread     |                        `Math.PI / 2` |
| Ray length     | Inherited from sensor config default |
| Sensor enabled | Inherited from sensor config default |

The default spread creates a 90-degree detection cone centered on the car heading.

---

## Default Ray Labels

The default front profile has five semantic labels:

```ts
type FrontSensorRayLabel =
  | "wide-left"
  | "front-left"
  | "forward"
  | "front-right"
  | "wide-right";
```

---

## Ray Layout

The default ray order is deterministic:

| Index | Label         | Meaning                      |
| ----: | ------------- | ---------------------------- |
|   `0` | `wide-left`   | Broad left-front awareness   |
|   `1` | `front-left`  | Near-forward left awareness  |
|   `2` | `forward`     | Main forward vision          |
|   `3` | `front-right` | Near-forward right awareness |
|   `4` | `wide-right`  | Broad right-front awareness  |

---

## Spread Behavior

Rays are centered around the car heading.

Example:

```ts
car.angle = 0;
raySpread = Math.PI / 2;
rayCount = 5;
```

Generated ray angles:

```txt
index 0: -Math.PI / 4
index 1: -Math.PI / 8
index 2: 0
index 3: Math.PI / 8
index 4: Math.PI / 4
```

The middle ray is always the `forward` ray.

---

## Heading Alignment

Changing the car heading rotates every front ray by the same offset.

Example:

```txt
car.angle = 0
```

Forward ray:

```txt
0
```

If the car rotates to:

```txt
car.angle = Math.PI / 2
```

Forward ray becomes:

```txt
Math.PI / 2
```

The entire cone rotates with the car.

---

## Disabled Sensors

If sensors are disabled:

```ts
config.sensorEnabled = false;
```

Then the front profile returns:

```ts
[];
```

Disabled sensors do not preserve previous rays.

State cleanup belongs to `SensorState` update/reset logic.

---

## Determinism

The front sensor profile is deterministic.

Calling it repeatedly with the same car pose and sensor config returns equivalent rays and labels.

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

The front profile must not mutate:

- `CarState`
- `SensorConfig`
- Existing sensor arrays
- Existing sensor readings

It returns a new array of labelled front rays.

---

## Validation

The front profile relies on the generic sensor validation rules.

Invalid values must be rejected by the sensor model or ray-generation module.

Examples of invalid values:

```txt
rayCount = 0
rayCount = 7 for this fixed 5-ray profile
rayLength = 0
raySpread = 0
raySpread > Math.PI
car.angle = NaN
car.positionX = Infinity
car.positionY = -Infinity
```

For the default front profile, exactly five generated rays are required so labels remain aligned with ray indexes.

---

## Design Rule

This module may import:

- Sensor model types
- Sensor config helpers
- Generic ray-generation functions
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

- Default front config uses five rays.
- Default front config uses `Math.PI / 2` spread.
- Safe config overrides are accepted.
- Five front rays are generated by default.
- Ray labels are deterministic.
- The middle ray is labelled `forward`.
- The middle ray aligns with car heading.
- Left rays are less than the car heading.
- Right rays are greater than the car heading.
- Spread boundaries are correct.
- Rays rotate when car heading changes.
- Disabled sensors return an empty array.
- Repeated calls are deterministic.
- Car state is not mutated.
- Invalid non-front ray counts are rejected.

---

## Acceptance Criteria Mapping

| Acceptance Criterion            | Covered By                          |
| ------------------------------- | ----------------------------------- |
| Forward ray exists              | `forward` label at index `2`        |
| Front-left ray exists           | `front-left` label at index `1`     |
| Front-right ray exists          | `front-right` label at index `3`    |
| Wider side-angle rays exist     | `wide-left` and `wide-right` labels |
| Default ray count is 5          | Default profile config              |
| Default spread is `Math.PI / 2` | Default profile config              |
| Rays follow car rotation        | Heading alignment rule              |
| Center ray remains forward      | Middle ray rule                     |
| Disabled sensors return no rays | Disabled sensors rule               |
| Unit tests exist                | Testing requirements                |

---

## Related Files

```txt
src/simulation/sensors/sensorModel.ts
src/simulation/sensors/sensorState.ts
src/simulation/sensors/raycasting.ts
src/simulation/sensors/frontSensorProfile.ts
src/simulation/sensors/frontSensorProfile.test.ts
src/simulation/vehicle/carState.ts
```

---

## Future Enhancements

Later tasks may add:

- Front bumper ray origin
- Variable ray lengths per label
- Shorter wide-angle rays
- Labelled sensor readings
- Side sensor profiles
- Rear sensor profiles
- Sensor group IDs
- Sensor debug rendering
- Sensor telemetry
- Sensor confidence values
- Detected object IDs
- Time-to-collision calculations

---

## Technical Debt Guardrails

Avoid:

- Duplicating `castSensorRays()` logic
- Adding intersection detection
- Adding rendering logic
- Adding dashboard formatting
- Reading Zustand store state
- Using Canvas APIs
- Using DOM APIs
- Mutating car state
- Mutating sensor config
- Returning unlabelled profile rays
- Allowing label/ray-count mismatch
