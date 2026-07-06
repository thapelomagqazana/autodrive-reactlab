# Sensor Distance Calculation

## Overview

Sensor distance calculation converts validated sensor ray geometry and optional detection candidates into safe distance values and `SensorReading` objects.

This module answers:

```txt
How long is this ray?
How far away is the detection?
How close is the detection relative to the ray range?
Should this ray produce a detected reading or a no-detection reading?
Which candidate is nearest for this ray?
```

This module does not generate rays or detect intersections.

---

## Module Location

```txt
src/simulation/sensors/sensorDistance.ts
```

Recommended test file:

```txt
src/simulation/sensors/sensorDistance.test.ts
```

---

## Scope

### In Scope

This module defines:

- Point-to-point distance calculation
- Ray length calculation
- Hit distance calculation
- Normalized distance calculation
- Distance percentage calculation
- No-detection reading creation
- Detected reading creation
- Nearest candidate selection

### Out of Scope

This module does not implement:

- Ray generation
- Road-edge intersection detection
- Obstacle detection
- Lane detection
- Traffic-light detection
- Sensor rendering
- Dashboard UI
- AI decision-making
- Collision detection
- Store integration

---

## Distance Convention

All distances use simulation world/canvas units.

Distance is measured from:

```txt
ray.start
```

to either:

```txt
ray.end
```

or:

```txt
candidate.point
```

---

## Normalized Distance

Normalized distance is calculated as:

```txt
normalizedDistance = distance / ray.maxLength
```

Meaning:

```txt
0 = nearest
1 = farthest
```

Examples:

| Distance | Ray Max Length | Normalized Distance |
| -------: | -------------: | ------------------: |
|      `0` |          `100` |                 `0` |
|     `25` |          `100` |              `0.25` |
|     `50` |          `100` |               `0.5` |
|    `100` |          `100` |                 `1` |

---

## Dashboard Percentage

Dashboard percentage is calculated as:

```txt
percentage = normalizedDistance * 100
```

Meaning:

```txt
0% = nearest
100% = farthest
```

Examples:

| Normalized Distance | Percentage |
| ------------------: | ---------: |
|                 `0` |       `0%` |
|              `0.25` |      `25%` |
|               `0.5` |      `50%` |
|                 `1` |     `100%` |

---

## Detection Candidate

A detection candidate represents one possible hit for a sensor ray.

```ts
interface SensorDetectionCandidate {
  readonly detectionType: SensorDetectionType;
  readonly point: SensorPoint;
}
```

Candidates may come from modules such as:

- Road-edge detection
- Obstacle detection
- Lane-boundary detection
- Traffic-light detection
- Vehicle detection
- Pedestrian detection

This module does not care where a candidate came from.

---

## No-Hit Reading

A ray with no valid candidate produces an explicit no-detection reading:

```ts
{
  rayIndex: 0,
  detected: false,
  detectionType: null,
  distance: null,
  point: null,
}
```

No-hit readings must not fake a maximum-distance detection.

---

## Detected Reading

A ray with a valid candidate produces a detected reading:

```ts
{
  rayIndex: 0,
  detected: true,
  detectionType: "road-boundary",
  distance: 25,
  point: { x: 0, y: -25 },
}
```

The `distance` value is measured from `ray.start` to `candidate.point`.

---

## Nearest Candidate Rule

If multiple candidates exist for the same ray, the nearest valid candidate wins.

Distance is measured from:

```txt
ray.start
```

Candidates beyond `ray.maxLength` are ignored.

If no candidates are within range, the ray produces a no-detection reading.

---

## Hit at Ray Start

A detection exactly at `ray.start` is valid.

Result:

```txt
distance = 0
normalizedDistance = 0
percentage = 0
```

---

## Hit at Ray End

A detection exactly at `ray.end` is valid.

Result:

```txt
distance = ray.maxLength
normalizedDistance = 1
percentage = 100
```

---

## Floating-Point Tolerance

The module uses a small epsilon:

```ts
1e-9;
```

This is used only to handle harmless floating-point drift near `0` and `1`.

It must not be used to silently accept clearly invalid geometry.

---

## Validation Rules

The module rejects:

- Non-finite point coordinates
- Invalid ray index
- Non-positive ray max length
- Non-finite ray max length
- Negative distance
- Distance greater than max length
- Invalid normalized distance

Examples of invalid values:

```txt
NaN
Infinity
-Infinity
ray.maxLength = 0
ray.index = -1
distance = -1
normalizedDistance = 1.01
```

Invalid values throw `RangeError`.

---

## Determinism

The module is deterministic.

Given the same ray and detection candidates, it returns the same distances and readings.

The module does not depend on:

- Delta time
- Randomness
- Store state
- DOM state
- Canvas state
- Current frame number

---

## Immutability

The module must not mutate:

- `SensorRay`
- `SensorDetectionCandidate`
- `SensorPoint`
- Input arrays

It returns new result objects only.

---

## Design Rule

This module may import:

- Sensor model types
- Sensor reading construction helpers
- Sensor point construction helpers

This module must not import:

- React
- Zustand store state
- Canvas APIs
- DOM APIs
- Browser APIs
- Rendering modules
- Dashboard components
- AI modules
- Physics update modules

---

## Testing Requirements

Tests must verify:

- Ray length calculation
- Hit distance calculation
- Normalized distance calculation
- Percentage calculation
- Hit summary calculation
- Explicit no-detection reading
- Detected reading creation
- Nearest candidate selection
- Candidates beyond range are ignored
- Hit at ray start is valid
- Hit at ray end is valid
- Invalid distances are rejected
- Invalid normalized percentages are rejected
- Invalid rays are rejected
- Inputs are not mutated

---

## Acceptance Criteria Mapping

| Acceptance Criterion                   | Covered By                           |
| -------------------------------------- | ------------------------------------ |
| Ray length can be calculated           | `calculateRayLength()`               |
| Hit distance can be calculated         | `calculateHitDistance()`             |
| Normalized distance is calculated      | `normalizeDistance()`                |
| Dashboard percentage is calculated     | `distanceToPercentage()`             |
| Near/far semantics are defined         | Distance semantics                   |
| No-hit ray produces explicit reading   | `createSensorReadingFromCandidate()` |
| Detected ray produces detected reading | `createSensorReadingFromCandidate()` |
| Closest detection wins                 | `selectNearestDetectionCandidate()`  |
| Hit beyond range ignored               | Candidate range rule                 |
| Hit at ray start is valid              | Boundary behavior                    |
| Hit at ray end is valid                | Boundary behavior                    |
| Invalid values rejected                | Validation rules                     |
| Floating-point drift clamped safely    | Epsilon rule                         |
| Unit tests exist                       | Testing requirements                 |

---

## Related Files

```txt
src/simulation/sensors/sensorModel.ts
src/simulation/sensors/raycasting.ts
src/simulation/sensors/roadEdgeDetection.ts
src/simulation/sensors/sensorDistance.ts
src/simulation/sensors/sensorDistance.test.ts
```

---

## Future Enhancements

Later tasks may add:

- Labelled sensor readings
- Sensor group distance summaries
- Dashboard formatting helpers
- AI-ready normalized sensor vectors
- Time-to-collision estimates
- Candidate object IDs
- Detection confidence values
- Sensor noise simulation
- Sensor history buffers

---

## Technical Debt Guardrails

Avoid:

- Treating no-hit as a fake max-distance hit
- Performing intersection detection in this module
- Mutating input rays
- Mutating detection candidates
- Reading from the store
- Adding rendering logic
- Adding dashboard formatting too early
- Adding AI decisions
- Silently accepting invalid numeric values
