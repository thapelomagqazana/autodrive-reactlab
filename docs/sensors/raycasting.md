# Sensor Ray Casting

## Overview

`raycasting.ts` generates deterministic sensor ray geometry from:

- Car position
- Car heading angle
- Sensor configuration

This module prepares ray geometry for future detection, rendering, telemetry, and AI systems.

It only creates rays.

It does not detect objects, render sensors, update dashboard data, or make driving decisions.

---

## Module Location

```txt
src/simulation/sensors/raycasting.ts
```

Recommended tests:

```txt
src/simulation/sensors/raycasting.test.ts
```

---

## Coordinate System

The project uses canvas/world coordinates:

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

- `lerp()`
- `getSensorDirectionVector()`
- `castRay()`
- `castSensorRays()`

### Out of Scope

This module does not implement:

- Obstacle detection
- Road-boundary detection
- Lane-boundary detection
- Traffic-light detection
- Collision detection
- Sensor readings
- Sensor rendering
- Dashboard updates
- AI decisions
- Pathfinding

---

## Design Rule

This module must remain pure and framework-independent.

It must not import:

- React
- Zustand store state
- Canvas APIs
- DOM APIs
- Browser APIs
- Rendering modules
- Dashboard components
- AI modules

---

## Inputs

`castSensorRays()` requires:

```ts
car.positionX;
car.positionY;
car.angle;
config.rayCount;
config.rayLength;
config.raySpread;
config.sensorEnabled;
```

The function does not require:

```ts
deltaTimeSeconds
simulation status
keyboard input
canvas context
camera state
world obstacles
AI state
```

---

## Ray Origin

For the current implementation, rays originate from the car center point:

```ts
{
  x: car.positionX,
  y: car.positionY,
}
```

This is a simple and deterministic starting point.

A later task may move the origin to the car front-center or a configurable sensor mount point.

---

## Angle Convention

The ray direction follows the existing car heading convention.

Formula:

```ts
x = Math.sin(angle);
y = -Math.cos(angle);
```

This means:

```txt
angle = 0             -> { x: 0,  y: -1 }
angle = Math.PI / 2   -> { x: 1,  y: 0  }
angle = Math.PI       -> { x: 0,  y: 1  }
angle = 3 * Math.PI/2 -> { x: -1, y: 0  }
```

---

## Ray Geometry

A `SensorRay` represents one geometric ray:

```ts
interface SensorRay {
  readonly index: number;
  readonly start: SensorPoint;
  readonly end: SensorPoint;
  readonly angle: number;
  readonly maxLength: number;
}
```

Example:

```ts
{
  index: 0,
  start: { x: 100, y: 100 },
  end: { x: 100, y: 50 },
  angle: 0,
  maxLength: 50,
}
```

This ray starts at `(100, 100)`, points upward, and has a maximum length of `50`.

---

## Linear Interpolation

`lerp()` distributes ray angles evenly across the configured spread.

```ts
lerp(start, end, t);
```

Rules:

|   `t` | Result   |
| ----: | -------- |
|   `0` | `start`  |
|   `1` | `end`    |
| `0.5` | midpoint |

Example:

```ts
lerp(10, 20, 0.5) === 15;
```

---

## Sensor Spread

`raySpread` represents the total angular field of view.

Rays are centered on the car heading.

Example:

```ts
car.angle = 0;
raySpread = Math.PI / 2;
```

The generated rays cover:

```txt
-Math.PI / 4  to  Math.PI / 4
```

So a 90-degree cone is centered on the car’s forward direction.

---

## Ray Ordering

Generated rays are ordered from left to right:

```txt
leftmost -> center -> rightmost
```

For example, with:

```ts
car.angle = 0;
rayCount = 3;
raySpread = Math.PI / 2;
```

The ray angles are:

```txt
index 0: -Math.PI / 4
index 1: 0
index 2: Math.PI / 4
```

---

## Single-Ray Behavior

When `rayCount` is `1`, the only ray aligns exactly with the car heading.

Example:

```ts
car.angle = Math.PI / 6;
rayCount = 1;
```

Result:

```txt
ray[0].angle = Math.PI / 6
```

---

## Disabled Sensors

If sensors are disabled:

```ts
config.sensorEnabled = false;
```

Then:

```ts
castSensorRays({ car, config }) === [];
```

Disabled sensors do not preserve or return previous rays.

State cleanup belongs to sensor state update/reset logic.

---

## Determinism

`castSensorRays()` is deterministic.

Calling it repeatedly with the same car pose and sensor config returns equivalent ray geometry.

The function does not use:

- Delta time
- Randomness
- Global state
- Store state
- Browser state
- Current frame number

---

## Immutability

The module must not mutate:

- `CarState`
- `SensorConfig`
- Existing sensor arrays
- Existing sensor readings

It returns new ray objects and a new ray array.

---

## Validation

The module validates:

- Car position
- Car angle
- Ray count
- Ray length
- Ray spread
- Ray index
- Sensor config

Invalid values throw `RangeError`.

Examples of invalid values:

```txt
NaN
Infinity
-Infinity
rayCount = 0
rayCount = 1.5
rayLength = 0
raySpread = 0
raySpread > Math.PI
negative ray index
```

---

## Testing Requirements

Tests must verify:

- `lerp()` returns start when `t = 0`.
- `lerp()` returns end when `t = 1`.
- `lerp()` returns midpoint when `t = 0.5`.
- Invalid `lerp()` values are rejected.
- `castRay()` creates one valid ray.
- `castRay()` rejects invalid ray index.
- `castRay()` rejects invalid ray length.
- `castSensorRays()` returns the configured number of rays.
- Rays are centered around car heading.
- Odd ray counts align the middle ray with car heading.
- `rayCount = 1` aligns the only ray with car heading.
- Rays are ordered left-to-right.
- Disabled sensors return an empty array.
- Repeated calls produce equivalent results.
- Car state is not mutated.
- Sensor config is not mutated.
- Invalid config is rejected.
- Invalid car pose is rejected.

---

## Acceptance Criteria Mapping

| Acceptance Criteria             | Covered By                   |
| ------------------------------- | ---------------------------- |
| `raycasting.ts` exists          | Module location              |
| `lerp()` exists                 | Linear interpolation section |
| `castRay()` exists              | Ray geometry generation      |
| `castSensorRays()` exists       | Sensor spread and ordering   |
| Rays centered on heading        | Sensor spread section        |
| Middle ray points forward       | Ray ordering section         |
| Single ray behavior defined     | Single-ray behavior          |
| Deterministic ray order         | Ray ordering                 |
| Disabled sensors return no rays | Disabled sensors             |
| Delta-independent output        | Determinism                  |
| Invalid config rejected         | Validation                   |
| Unit tests exist                | Testing requirements         |

---

## Related Files

```txt
src/simulation/sensors/sensorModel.ts
src/simulation/sensors/sensorState.ts
src/simulation/sensors/raycasting.ts
src/simulation/sensors/raycasting.test.ts
src/simulation/vehicle/carState.ts
```

---

## Future Enhancements

Later tasks may add:

- Front bumper ray origin
- Front sensor profile
- Side sensor profile
- Rear sensor profile
- Ray-object intersection detection
- Road-boundary detection
- Lane-boundary detection
- Traffic-light detection
- Sensor rendering
- Sensor telemetry
- Sensor debug labels
- Sensor noise simulation
- Sensor confidence values
- Detected object IDs
- Time-to-collision calculations

---

## Technical Debt Guardrails

Avoid:

- Adding rendering logic to `raycasting.ts`
- Reading directly from Zustand
- Using Canvas APIs
- Using DOM APIs
- Adding AI decision logic
- Returning sensor readings from ray generation
- Mutating car state
- Mutating sensor config
- Introducing delta-time dependency
- Mixing world-space and screen-space coordinates
