# Sensor State on Car

## Overview

`CarState` owns structured sensor runtime state through a single `sensors` field.

All sensor-related data must be grouped under:

```ts
car.sensors;
```

Do not add loose root-level sensor fields such as:

```ts
car.rayStartPosition;
car.rayEndPosition;
car.detectedDistance;
car.detectionType;
```

## State Shape

```ts
interface SensorState {
  readonly config: SensorConfig;
  readonly rays: readonly SensorRay[];
  readonly readings: readonly SensorReading[];
}
```

## Initial State

A newly created car starts with:

```ts
sensors: {
  config: DEFAULT_SENSOR_CONFIG,
  rays: [],
  readings: [],
}
```

Rays and readings are empty because they are runtime-derived data.

They will be populated later by ray-generation and ray-casting tasks.

## Reset Behavior

Car reset must:

- Restore default sensor configuration.
- Clear all generated rays.
- Clear all latest readings.
- Remove stale detection data.
- Produce deterministic sensor state.

Reset result:

```ts
sensors: {
  config: DEFAULT_SENSOR_CONFIG,
  rays: [],
  readings: [],
}
```

## Design Rules

Sensor state must:

- Stay grouped under `car.sensors`.
- Use world-space simulation coordinates.
- Use radians for angles.
- Preserve immutable state updates.
- Avoid React, Canvas, DOM, and browser API dependencies.
- Avoid AI, rendering, and dashboard logic.

## Out of Scope

This task does not implement:

- Ray generation
- Ray casting
- Intersection detection
- Sensor rendering
- AI decisions
- Dashboard display
- Traffic-light detection

## Testing Requirements

Tests must verify:

- A new car includes `sensors`.
- Default sensor config is present.
- Initial rays are empty.
- Initial readings are empty.
- Reset clears stale rays.
- Reset clears stale readings.
- Reset restores default sensor config.
- No loose sensor fields exist on root `CarState`.

## Related Files

```txt
src/simulation/sensors/sensorState.ts
src/simulation/sensors/sensorState.test.ts
src/simulation/vehicle/carState.ts
src/simulation/vehicle/carState.test.ts
src/simulation/vehicle/createInitialCar.test.ts
```
