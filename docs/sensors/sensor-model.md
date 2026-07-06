# Ray-Based Sensor Model

## Overview

The ray-based sensor model defines the foundational domain contracts for the AutoDrive ReactLab vehicle sensor system.

The model provides strongly typed representations for:

- Sensor configuration
- Sensor ray geometry
- Sensor detection readings
- Supported detection categories
- Sensor configuration validation
- Safe sensor-domain object construction

This module establishes the vocabulary and invariants required by future capabilities such as:

- Sensor ray generation
- Ray casting
- Obstacle detection
- Road-boundary detection
- Lane-boundary detection
- Traffic-light detection
- Vehicle detection
- Pedestrian detection
- Sensor visualization
- Autonomous driving decisions
- Telemetry
- Debug tooling

The model intentionally does not implement any of those runtime behaviors.

---

## Task Metadata

| Field          | Value                                        |
| -------------- | -------------------------------------------- |
| Task ID        | 2.1                                          |
| Task Name      | Define Ray-Based Sensor Model                |
| Domain         | Vehicle Sensor System                        |
| Layer          | Simulation Domain                            |
| Status         | Implemented                                  |
| Primary Module | `src/simulation/sensors/sensorModel.ts`      |
| Test Module    | `src/simulation/sensors/sensorModel.test.ts` |

---

## Objectives

The sensor model must provide a stable, deterministic, framework-independent foundation for future sensor behavior.

The implementation must:

- Define sensor configuration.
- Define sensor ray geometry.
- Define sensor detection readings.
- Define supported detection categories.
- Define safe default configuration.
- Reject invalid sensor configuration.
- Support detected and non-detected readings.
- Remain independent from React and rendering concerns.
- Use world-space simulation coordinates.
- Use radians for all angles.
- Remain deterministic and easy to test.

---

## Scope

### In Scope

This module defines:

- `SensorConfig`
- `SensorRay`
- `SensorReading`
- `SensorDetectionType`
- `SensorPoint`
- Default sensor configuration
- Sensor configuration validation
- Sensor point validation
- Ray index validation
- Detection distance validation
- Safe construction helpers

### Out of Scope

This module does not implement:

- Ray generation
- Ray casting
- Obstacle intersection logic
- Road-boundary intersection logic
- Lane-boundary detection
- Traffic-light detection behavior
- Vehicle detection behavior
- Pedestrian detection behavior
- Sensor rendering
- Debug ray visualization
- AI decision-making
- Dashboard integration
- Collision detection
- Pathfinding
- Sensor performance optimization

These capabilities belong to later implementation tasks.

---

## Architectural Position

The sensor model belongs to the simulation domain.

Recommended structure:

```text
src/
  simulation/
    sensors/
      sensorModel.ts
      sensorModel.test.ts
```

The model must remain independent from:

- React
- Zustand
- HTML Canvas
- Browser APIs
- Rendering modules
- Dashboard components
- AI modules
- Pathfinding modules
- Physics update orchestration

This dependency direction keeps the sensor model reusable across future simulation systems.

---

## Core Design Principles

### Framework Independence

The sensor model is plain TypeScript.

It must not depend on UI frameworks or browser rendering APIs.

### Determinism

Given the same input values, validation and construction behavior must produce equivalent results.

### Strong Typing

Invalid combinations of sensor reading state should be difficult or impossible to represent accidentally.

### Explicit Domain Semantics

Detection categories must use explicit domain values rather than arbitrary strings.

### Fail Fast

Invalid configuration must be rejected before it reaches future ray-casting, rendering, or AI systems.

### Separation of Concerns

The model defines sensor data.

It does not generate rays, detect intersections, render graphics, or make driving decisions.

---

## Coordinate System

All sensor coordinates use world-space simulation coordinates.

Example:

```text
World Space
    |
    |      obstacle
    |         X
    |
    |   car -----> ray
    |
    +-----------------------
```

Sensor geometry must not store screen-space coordinates.

The rendering layer is responsible for transforming world-space coordinates into screen-space coordinates.

This separation ensures that sensor behavior remains independent from:

- Camera position
- Camera smoothing
- Viewport dimensions
- Canvas resolution
- Device pixel ratio
- Zoom level

---

## Angle Convention

All sensor angles use radians.

Examples:

| Direction Concept |         Angle |
| ----------------- | ------------: |
| Quarter turn      | `Math.PI / 2` |
| Half turn         |     `Math.PI` |
| Full turn         | `Math.PI * 2` |

The sensor system must remain consistent with the existing vehicle heading convention.

The sensor model does not independently redefine vehicle orientation semantics.

---

## Distance Convention

All sensor distances use simulation world units.

The model does not assume:

- Pixels
- Meters
- Centimeters
- Kilometers

A simulation world unit is interpreted according to the broader simulation coordinate model.

---

## SensorPoint

`SensorPoint` represents a position in simulation world space.

Conceptual shape:

```ts
interface SensorPoint {
  readonly x: number;
  readonly y: number;
}
```

### Invariants

Both coordinates must be finite numbers.

Valid examples:

```text
{ x: 0, y: 0 }
{ x: 10, y: 20 }
{ x: -50, y: 120 }
```

Invalid examples:

```text
{ x: NaN, y: 0 }
{ x: Infinity, y: 10 }
{ x: 20, y: -Infinity }
```

Negative coordinates are valid because world-space simulation coordinates may extend beyond the initial viewport.

---

## SensorConfig

`SensorConfig` defines the configuration required by future sensor ray generation.

Conceptual shape:

```ts
interface SensorConfig {
  readonly rayCount: number;
  readonly rayLength: number;
  readonly raySpread: number;
  readonly sensorEnabled: boolean;
}
```

---

## rayCount

`rayCount` defines the number of rays generated by the future sensor ray-generation system.

### Rules

The value must be:

- Finite
- Integer
- Greater than zero

### Valid Examples

```text
1
3
5
7
9
```

### Invalid Examples

```text
0
-1
1.5
NaN
Infinity
-Infinity
```

### Rationale

Fractional ray counts have no meaningful domain interpretation.

Zero rays are not accepted as valid active sensor configuration. Sensor disabling is represented explicitly through `sensorEnabled`.

---

## rayLength

`rayLength` defines the maximum detection range of a future sensor ray.

### Rules

The value must be:

- Finite
- Greater than zero

### Valid Examples

```text
1
50
180
250.5
```

### Invalid Examples

```text
0
-1
NaN
Infinity
-Infinity
```

### Rationale

A zero-length ray cannot represent a useful detection range.

Negative ray lengths have no valid geometric meaning.

---

## raySpread

`raySpread` defines the total angular field of view available to future sensor ray generation.

### Rules

The value must be:

- Finite
- Greater than zero
- Less than or equal to `Math.PI`

Formally:

```text
0 < raySpread <= Math.PI
```

### Valid Examples

```text
Math.PI / 6
Math.PI / 4
Math.PI / 2
Math.PI
```

### Invalid Examples

```text
0
-1
NaN
Infinity
Math.PI + 0.01
Math.PI * 2
```

### Rationale

The initial sensor model supports a maximum field of view of 180 degrees.

Wider coverage should later be represented through additional sensor groups such as:

- Rear sensors
- Left-side sensors
- Right-side sensors

This keeps sensor topology explicit rather than overloading one front-facing sensor configuration.

---

## sensorEnabled

`sensorEnabled` determines whether the sensor system is enabled.

### Rules

The value must be a boolean.

Valid values:

```text
true
false
```

Invalid conceptual values:

```text
1
0
"true"
"false"
null
undefined
```

### Rationale

Sensor activation state must remain explicit and strongly typed.

---

## Default Sensor Configuration

The default configuration is:

| Field           |       Default |
| --------------- | ------------: |
| `rayCount`      |           `7` |
| `rayLength`     |         `180` |
| `raySpread`     | `Math.PI / 2` |
| `sensorEnabled` |        `true` |

Conceptually:

```ts
const DEFAULT_SENSOR_CONFIG = {
  rayCount: 7,
  rayLength: 180,
  raySpread: Math.PI / 2,
  sensorEnabled: true,
};
```

### Default Design Rationale

Seven rays provide:

- A center ray
- Symmetrical left coverage
- Symmetrical right coverage
- Reasonable angular resolution

A 90-degree spread provides a practical initial front-facing field of view.

A length of 180 world units provides a useful initial range while remaining configurable.

These values are domain defaults, not immutable product requirements.

---

## SensorRay

`SensorRay` represents the geometry of one generated sensor ray.

Conceptual shape:

```ts
interface SensorRay {
  readonly index: number;
  readonly start: SensorPoint;
  readonly end: SensorPoint;
  readonly angle: number;
  readonly maxLength: number;
}
```

---

## SensorRay.index

Identifies the ray within a generated sensor ray collection.

### Rules

The index must be:

- Integer
- Greater than or equal to zero

Examples:

```text
0
1
2
3
```

Invalid examples:

```text
-1
1.5
NaN
Infinity
```

---

## SensorRay.start

Represents the ray origin in world-space coordinates.

Future ray-generation logic may derive this point from:

- Car center
- Front-center of the car
- Sensor mounting position

The sensor model does not decide that policy.

---

## SensorRay.end

Represents the maximum geometric endpoint of the ray in world space.

This is not necessarily the detected intersection point.

A future intersection system may detect an object before the maximum endpoint.

---

## SensorRay.angle

Represents ray direction in radians.

The angle must remain consistent with the existing car heading convention.

---

## SensorRay.maxLength

Represents the maximum configured range of the ray.

The value uses simulation world units.

---

## SensorReading

`SensorReading` represents the result of evaluating one sensor ray against future detectable world geometry.

The model uses a discriminated union.

This prevents ambiguous states such as:

```text
detected = false
distance = 42
detectionType = obstacle
```

Such combinations are logically inconsistent.

---

## No-Detection Reading

A no-detection reading represents a ray that did not intersect a detectable object within its evaluation range.

Conceptual shape:

```ts
{
  rayIndex: number;
  detected: false;
  detectionType: null;
  distance: null;
  point: null;
}
```

### Invariants

When `detected` is `false`:

- `detectionType` must be `null`
- `distance` must be `null`
- `point` must be `null`

---

## Detected Reading

A detected reading represents a successful ray intersection.

Conceptual shape:

```ts
{
  rayIndex: number;
  detected: true;
  detectionType: SensorDetectionType;
  distance: number;
  point: SensorPoint;
}
```

### Invariants

When `detected` is `true`:

- `detectionType` must exist
- `distance` must be finite
- `distance` must be greater than or equal to zero
- `point` must contain finite world-space coordinates

---

## SensorDetectionType

Supported detection categories are explicit.

Required values:

```text
obstacle
road-boundary
lane-boundary
traffic-light
vehicle
pedestrian
wall
```

Conceptual type:

```ts
type SensorDetectionType =
  | "obstacle"
  | "road-boundary"
  | "lane-boundary"
  | "traffic-light"
  | "vehicle"
  | "pedestrian"
  | "wall";
```

### Rationale

Explicit categories provide:

- Compile-time safety
- Predictable telemetry
- Stable AI inputs
- Clear debug output
- Easier testing
- Reduced typo risk

---

## Validation Strategy

Validation is implemented through two complementary mechanisms:

### Predicate Functions

Predicate functions return booleans.

Examples:

```text
isValidRayCount()
isValidRayLength()
isValidRaySpread()
isValidSensorPoint()
```

Use predicates when callers need conditional control flow.

### Assertion Functions

Assertion functions throw when invariants are violated.

Examples:

```text
assertValidRayCount()
assertValidRayLength()
assertValidRaySpread()
assertValidSensorConfig()
assertValidSensorPoint()
```

Use assertions at trusted construction boundaries.

---

## Error Handling Strategy

Invalid numeric domain values produce `RangeError`.

Examples include:

- Invalid ray count
- Invalid ray length
- Invalid ray spread
- Invalid ray index
- Invalid detection distance
- Invalid world-space coordinates

Invalid type-level values produce `TypeError` where runtime validation is applicable.

Example:

```text
sensorEnabled is not boolean
```

### Design Rationale

`RangeError` communicates that the value type may be numeric but lies outside the accepted domain.

`TypeError` communicates that the runtime value has an invalid type.

---

## Construction Strategy

Safe factory functions validate values before returning domain objects.

Examples:

```text
createSensorConfig()
createSensorPoint()
createNoDetectionSensorReading()
createDetectedSensorReading()
```

### Benefits

Factory functions provide:

- Centralized validation
- Predictable invariants
- Easier future evolution
- Consistent error behavior
- Improved testability

---

## Immutability

Sensor domain interfaces use readonly properties.

Example:

```ts
interface SensorPoint {
  readonly x: number;
  readonly y: number;
}
```

This communicates that domain values should be treated as immutable.

Future sensor algorithms should create new values rather than mutating existing sensor state.

---

## Dependency Rules

The sensor model may depend on:

- TypeScript language features
- Pure domain types
- Shared world-space geometry types if introduced later

The sensor model must not depend on:

- React
- React hooks
- Zustand
- HTML Canvas
- DOM APIs
- Browser event APIs
- Rendering modules
- Dashboard components
- AI decision modules
- Pathfinding modules

---

## Testing Strategy

The test suite must verify:

### Positive Tests

- Default configuration is valid.
- Valid custom configuration is accepted.
- Valid sensor points are accepted.
- No-detection readings can be created.
- Detected readings can be created.
- Every required detection category is representable.

### Negative Tests

- Zero ray count is rejected.
- Negative ray count is rejected.
- Fractional ray count is rejected.
- `NaN` ray count is rejected.
- Infinite ray count is rejected.
- Zero ray length is rejected.
- Negative ray length is rejected.
- `NaN` ray length is rejected.
- Infinite ray length is rejected.
- Zero ray spread is rejected.
- Negative ray spread is rejected.
- `NaN` ray spread is rejected.
- Infinite ray spread is rejected.
- Spread greater than `Math.PI` is rejected.
- Negative ray index is rejected.
- Fractional ray index is rejected.
- Negative detection distance is rejected.
- Non-finite detection distance is rejected.
- Non-finite sensor coordinates are rejected.

### Boundary Tests

- `rayCount = 1` is accepted.
- Very small positive finite `rayLength` is accepted.
- Very small positive finite `raySpread` is accepted.
- `raySpread = Math.PI` is accepted.
- `raySpread > Math.PI` is rejected.
- `distance = 0` is accepted for immediate-contact detection.
- `rayIndex = 0` is accepted.

### Regression Tests

Regression coverage should protect against:

- Accidentally allowing zero rays
- Accidentally allowing fractional ray counts
- Accidentally allowing infinite geometry
- Accidentally allowing spreads above `Math.PI`
- Accidentally representing contradictory reading states

---

## Security Considerations

This module does not process network input directly.

However, future configuration may originate from:

- Scenario files
- URL state
- User controls
- Saved simulations
- External APIs

For this reason, runtime validation remains important even with TypeScript types.

TypeScript types do not validate untrusted runtime data.

Invalid numeric values such as:

```text
NaN
Infinity
-Infinity
```

must be rejected before entering geometry algorithms.

---

## Performance Considerations

The model intentionally avoids premature optimization.

Current operations are constant-time validation checks.

Expected complexity:

| Operation           | Complexity |
| ------------------- | ---------- |
| Validate ray count  | O(1)       |
| Validate ray length | O(1)       |
| Validate ray spread | O(1)       |
| Validate point      | O(1)       |
| Create reading      | O(1)       |
| Create config       | O(1)       |

Future ray generation and intersection algorithms will have separate performance characteristics.

---

## Observability Considerations

The domain model does not perform logging.

This is intentional.

Pure domain functions should not create hidden side effects.

Future orchestration layers may record:

- Invalid configuration failures
- Sensor processing duration
- Detection counts
- Sensor frame age
- Ray-casting performance

Logging must remain outside the domain model.

---

## Future Integration

The next expected task is sensor ray generation.

Conceptual future flow:

```text
CarState
   |
   v
SensorConfig
   |
   v
Generate Sensor Rays
   |
   v
SensorRay[]
   |
   v
Evaluate World Intersections
   |
   v
SensorReading[]
   |
   +------> Renderer
   |
   +------> Dashboard
   |
   +------> Telemetry
   |
   +------> Driving AI
```

---

## Future Enhancements

Potential future additions include:

- Sensor group identifiers
- Front sensor profiles
- Side sensor profiles
- Rear sensor profiles
- Detected entity IDs
- Detection timestamps
- Simulation frame IDs
- Detection confidence
- Sensor noise models
- Occlusion metadata
- Material classification
- Relative velocity
- Time-to-collision estimates

These capabilities should be introduced only when concrete requirements justify them.

---

## Technical Debt Guardrails

Avoid:

- Adding Canvas-specific coordinates
- Adding React state to sensor models
- Storing arbitrary detection strings
- Mutating readings in place
- Mixing ray generation into this module
- Mixing intersection detection into this module
- Adding confidence scores without a defined semantics
- Adding object IDs before world entities have stable identity
- Adding generalized abstraction layers without demonstrated need

---

## Acceptance Criteria Traceability

| Acceptance Criterion              | Design Support                       |
| --------------------------------- | ------------------------------------ |
| AC1 SensorConfig exists           | `SensorConfig`                       |
| AC2 SensorRay exists              | `SensorRay`                          |
| AC3 SensorReading exists          | Discriminated `SensorReading` union  |
| AC4 Explicit detection categories | `SensorDetectionType`                |
| AC5 Defaults defined              | `DEFAULT_SENSOR_CONFIG`              |
| AC6 Invalid rayCount rejected     | Validation predicates and assertions |
| AC7 Invalid rayLength rejected    | Validation predicates and assertions |
| AC8 Invalid raySpread rejected    | Validation predicates and assertions |
| AC9 No React dependency           | Pure TypeScript module               |
| AC10 Unit tests exist             | Dedicated Vitest suite               |

---

## Definition of Done

The task is complete when:

- `SensorConfig` exists.
- `SensorRay` exists.
- `SensorReading` exists.
- `SensorDetectionType` exists.
- Default sensor configuration exists.
- Invalid ray counts are rejected.
- Invalid ray lengths are rejected.
- Invalid ray spreads are rejected.
- Sensor points reject non-finite coordinates.
- Sensor readings support detection and no detection.
- Unit tests cover positive cases.
- Unit tests cover negative cases.
- Unit tests cover boundaries.
- No React dependency exists.
- No rendering logic exists.
- No ray-generation logic exists.
- No AI logic exists.
- Documentation is updated.
- The model is ready for the next sensor ray-generation task.

---

## Related Files

```text
src/simulation/sensors/sensorModel.ts
src/simulation/sensors/sensorModel.test.ts
docs/sensors/sensor-model.md
```

---

## Related Future Tasks

- Task 2.2 — Add Sensor State to Car
- Task 2.3 — Create Ray-Casting Module
- Task 2.4 — Build Front Sensor Rays
- Task 2.5 — Build Left and Right Sensors
