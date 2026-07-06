# Sensor Configuration

## Overview

Sensor configuration centralizes validated tuning values for the sensor system.

It provides type-safe defaults and factory helpers for:

- Base sensor configuration
- Front sensor profile configuration
- Side sensor tuning configuration
- Full sensor system configuration

This module does not implement UI controls, rendering, detection, AI behavior, or persistence.

---

## Module Location

```txt
src/simulation/sensors/sensorConfiguration.ts
```

Recommended test file:

```txt
src/simulation/sensors/sensorConfiguration.test.ts
```

---

## Scope

### In Scope

This module defines:

- Centralized sensor defaults
- Configuration limits
- Base sensor configuration factory
- Front sensor profile configuration factory
- Side sensor tuning configuration factory
- Full sensor system configuration factory
- Runtime validation for configurable values

### Out of Scope

This module does not implement:

- Sensor UI controls
- Scenario editor
- Local storage persistence
- URL config loading
- AI tuning
- Rendering styles
- Detection algorithms
- Performance profiling

---

## Base Sensor Config

Base sensor config contains:

```ts
interface SensorConfig {
  readonly rayCount: number;
  readonly rayLength: number;
  readonly raySpread: number;
  readonly sensorEnabled: boolean;
}
```

Default:

```ts
{
  rayCount: 7,
  rayLength: 180,
  raySpread: Math.PI / 2,
  sensorEnabled: true,
}
```

---

## Front Sensor Profile Config

Front profile config contains:

```ts
interface FrontSensorProfileConfig {
  readonly rayCount: number;
  readonly raySpread: number;
}
```

Default:

```ts
{
  rayCount: 5,
  raySpread: Math.PI / 2,
}
```

The front profile remains explicit because it has a fixed semantic layout:

```txt
wide-left
front-left
forward
front-right
wide-right
```

---

## Side Sensor Tuning Config

Side sensor tuning config contains:

```ts
interface SideSensorTuningConfig {
  readonly sideSensorEnabled: boolean;
  readonly sideRayLengthRatio: number;
}
```

Default:

```ts
{
  sideSensorEnabled: true,
  sideRayLengthRatio: 0.6,
}
```

Important distinction:

```txt
SideSensorTuningConfig
```

belongs to centralized configuration.

```txt
SideSensorProfileConfig
```

belongs to the runtime side profile module and may contain derived runtime fields such as:

```txt
frontRayLength
sideRayLength
sensorEnabled
```

Do not confuse these two models.

---

## Full Sensor System Config

Full system config groups all sensor configuration domains:

```ts
interface SensorSystemConfig {
  readonly base: SensorConfig;
  readonly front: FrontSensorProfileConfig;
  readonly side: SideSensorTuningConfig;
}
```

---

## Configuration Limits

Recommended tuning limits:

```ts
{
  minRayCount: 1,
  maxRayCount: 15,
  minRayLength: 50,
  maxRayLength: 500,
  minRaySpread: Number.EPSILON,
  maxRaySpread: Math.PI,
  minSideRayLengthRatio: Number.EPSILON,
  maxSideRayLengthRatioExclusive: 1,
}
```

These limits prevent unstable or unrealistic sensor geometry.

---

## Validation Rules

### Ray Count

Ray count must be:

- Finite
- Integer
- Greater than or equal to `1`
- Less than or equal to `15`

Invalid examples:

```txt
0
-1
1.5
NaN
Infinity
```

---

### Ray Length

Ray length must be:

- Finite
- Positive
- Greater than or equal to `50`
- Less than or equal to `500`

Invalid examples:

```txt
0
-1
NaN
Infinity
```

---

### Ray Spread

Ray spread must be:

- Finite
- Greater than `0`
- Less than or equal to `Math.PI`
- Expressed in radians

Invalid examples:

```txt
0
-1
NaN
Infinity
Math.PI + 0.01
```

---

### Side Ray Length Ratio

Side ray length ratio must be:

- Finite
- Greater than `0`
- Less than `1`

Invalid examples:

```txt
0
-1
1
1.1
NaN
Infinity
```

---

### Boolean Flags

Boolean config values must be actual booleans:

```ts
true;
false;
```

Do not use:

```txt
"true"
"false"
1
0
null
undefined
```

---

## Factory Helpers

Recommended helpers:

```ts
createBaseSensorConfig();
createFrontSensorProfileConfig();
createSideSensorProfileConfig();
createSensorSystemConfig();
```

Factory helpers must:

- Merge defaults with overrides.
- Validate the result.
- Return fresh objects.
- Avoid mutating defaults.
- Fail fast on invalid values.

---

## Mutation Safety

Defaults are treated as immutable.

Creating custom config must not mutate:

```ts
DEFAULT_BASE_SENSOR_CONFIG;
DEFAULT_FRONT_SENSOR_PROFILE_CONFIG;
DEFAULT_SIDE_SENSOR_PROFILE_CONFIG;
DEFAULT_SENSOR_SYSTEM_CONFIG;
```

---

## Design Rules

This module may import:

- Sensor model types
- Sensor model validation/factory helpers

This module must not import:

- React
- Zustand store state
- Canvas APIs
- DOM APIs
- Browser APIs
- Renderer modules
- Dashboard components
- AI modules
- Detection modules

---

## Testing Requirements

Tests must verify:

- Default base config is valid.
- Valid base overrides work.
- Invalid ray count is rejected.
- Invalid ray length is rejected.
- Invalid ray spread is rejected.
- Front profile defaults are preserved.
- Valid front profile overrides work.
- Side tuning defaults are preserved.
- Valid side tuning overrides work.
- Invalid side ray length ratio is rejected.
- Full sensor system config can be created.
- Defaults are not mutated.
- Side tuning config does not expose runtime side profile fields.

---

## Acceptance Criteria Mapping

| Acceptance Criterion             | Covered By                        |
| -------------------------------- | --------------------------------- |
| Default sensor config exists     | `DEFAULT_BASE_SENSOR_CONFIG`      |
| Ray count configurable           | `createBaseSensorConfig()`        |
| Ray length configurable          | `createBaseSensorConfig()`        |
| Ray spread configurable          | `createBaseSensorConfig()`        |
| Side sensor config exists        | `SideSensorTuningConfig`          |
| Side ratio validated             | `createSideSensorProfileConfig()` |
| Front config explicit            | `FrontSensorProfileConfig`        |
| Overrides do not mutate defaults | Mutation safety tests             |
| Factories return valid objects   | Factory helpers                   |
| Tests exist                      | Testing requirements              |

---

## Related Files

```txt
src/simulation/sensors/sensorModel.ts
src/simulation/sensors/sensorConfiguration.ts
src/simulation/sensors/sensorConfiguration.test.ts
src/simulation/sensors/frontSensorProfile.ts
src/simulation/sensors/sideSensorProfile.ts
```

---

## Future Enhancements

Later tasks may add:

- Sensor config UI controls
- Scenario-specific sensor config
- Local storage persistence
- URL/imported config validation
- Separate front/side enable flags in runtime state
- Configurable side diagonal angles
- Configurable max ray count by performance tier
- Sensor profile presets
- AI tuning profiles

---

## Technical Debt Guardrails

Avoid:

- Duplicating sensor magic numbers in profile modules
- Mutating default config objects
- Treating TypeScript types as enough validation
- Letting invalid runtime input enter sensor state
- Confusing `SideSensorTuningConfig` with `SideSensorProfileConfig`
- Adding UI controls to this module
- Adding rendering styles to this module
- Adding AI behavior to this module
