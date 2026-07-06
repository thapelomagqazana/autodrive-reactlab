# Road Edge Warning Logic

## Overview

Road edge warning logic converts road-boundary sensor readings into structured warning signals.

It helps the system answer:

```txt
Is the car safely away from the left road edge?
Is the car safely away from the right road edge?
Is either side close enough to trigger warning or danger?
Which side is nearest to a road boundary?
```

This module produces dashboard-ready and future AI-ready signals.

It does not steer, brake, render, update physics, or control the vehicle.

---

## Module Location

```txt
src/simulation/sensors/roadEdgeWarning.ts
```

Recommended test file:

```txt
src/simulation/sensors/roadEdgeWarning.test.ts
```

---

## Scope

### In Scope

This module defines:

- Road-edge side model
- Warning severity states
- Warning and danger thresholds
- Threshold validation
- Left edge warning evaluation
- Right edge warning evaluation
- Overall warning severity
- Nearest road-edge side and distance

### Out of Scope

This module does not implement:

- Steering correction
- Braking behavior
- AI decision-making
- Ray generation
- Road-edge intersection detection
- Sensor rendering
- Dashboard redesign
- Sound alerts
- Lane-following logic

---

## Warning States

Supported states:

```ts
type RoadEdgeWarningState = "disabled" | "unknown" | "safe" | "warning" | "danger";
```

Meaning:

| State      | Meaning                                           |
| ---------- | ------------------------------------------------- |
| `disabled` | Sensors are off                                   |
| `unknown`  | Sensors are on, but no road-boundary data exists  |
| `safe`     | Nearest road edge is beyond the warning threshold |
| `warning`  | Nearest road edge is within the warning threshold |
| `danger`   | Nearest road edge is within the danger threshold  |

---

## Default Thresholds

Default thresholds:

```ts
{
  warningDistance: 80,
  dangerDistance: 35,
}
```

Distances use simulation world/canvas units.

---

## Threshold Rules

Thresholds must satisfy:

```txt
dangerDistance < warningDistance
```

Both values must be:

- Finite
- Positive
- Greater than `0`

Invalid examples:

```txt
NaN
Infinity
0
-1
dangerDistance >= warningDistance
```

---

## Side Inputs

The evaluator expects readings grouped by side:

```ts
leftReadings: SensorReading[]
rightReadings: SensorReading[]
```

These should come from authoritative sensor grouping, not guessed from a flat reading list.

---

## Important Grouping Rule

Do not blindly split or guess from:

```ts
car.sensors.readings;
```

Use:

```ts
car.sensors.readingGroups.left;
car.sensors.readingGroups.right;
```

or equivalent labelled side sensor metadata.

Incorrect grouping can create false warnings.

---

## Road-Boundary Filtering

The evaluator only considers detected readings where:

```ts
reading.detected === true;
reading.detectionType === "road-boundary";
```

It ignores:

- No-detection readings
- Obstacle readings
- Vehicle readings
- Pedestrian readings
- Traffic-light readings
- Lane-boundary readings

---

## Disabled Behavior

If sensors are disabled:

```txt
left.state = disabled
right.state = disabled
overallState = disabled
nearestDistance = null
nearestSide = null
```

Disabled state overrides stale readings.

---

## Missing Data Behavior

If sensors are enabled but no road-boundary readings exist:

```txt
state = unknown
nearestDistance = null
```

This prevents missing sensor data from being misinterpreted as safe.

---

## Distance Evaluation Rules

For each side:

```txt
distance <= dangerDistance  → danger
distance <= warningDistance → warning
distance > warningDistance  → safe
```

Example with defaults:

| Distance | Result    |
| -------: | --------- |
|     `20` | `danger`  |
|     `35` | `danger`  |
|     `60` | `warning` |
|     `80` | `warning` |
|    `120` | `safe`    |

---

## Overall Severity

Overall warning state chooses the highest severity across left and right.

Severity ranking:

```txt
danger > warning > safe > unknown > disabled
```

---

## Output Shape

```ts
interface RoadEdgeWarningResult {
  readonly left: RoadEdgeSideWarning;
  readonly right: RoadEdgeSideWarning;
  readonly overallState: RoadEdgeWarningState;
  readonly nearestDistance: number | null;
  readonly nearestSide: "left" | "right" | null;
  readonly thresholds: RoadEdgeWarningThresholds;
}
```

This is structured data, not UI text.

Dashboard and AI consumers should not parse strings.

---

## Dashboard Usage

Recommended usage:

```ts
const warning = evaluateRoadEdgeWarning({
  sensorEnabled: car.sensors.config.sensorEnabled,
  leftReadings: car.sensors.readingGroups.left,
  rightReadings: car.sensors.readingGroups.right,
});
```

The dashboard should consume this output directly.

It should not duplicate threshold logic.

---

## AI Usage

Future AI can consume:

```ts
warning.overallState;
warning.left.state;
warning.right.state;
warning.nearestDistance;
warning.nearestSide;
```

This module does not decide how the AI reacts.

---

## Determinism

The evaluator is deterministic.

Given the same readings, sensor state, and thresholds, it returns the same result.

It does not depend on:

- Delta time
- Randomness
- Store state
- DOM state
- Canvas state
- Frame number

---

## Immutability

The evaluator must not mutate:

- Sensor readings
- Sensor state
- Car state
- Threshold defaults
- Input arrays

It returns new result objects only.

---

## Design Rule

This module may import:

- Sensor model types

This module must not import:

- React
- Zustand store state
- Canvas APIs
- DOM APIs
- Renderer modules
- Dashboard components
- AI modules
- Physics modules
- Ray-generation modules
- Intersection detection modules

---

## Testing Requirements

Tests must verify:

- Default thresholds are valid.
- Invalid thresholds are rejected.
- Disabled sensors produce disabled state.
- Missing readings produce unknown state.
- Left warning works.
- Left danger works.
- Right warning works.
- Right danger works.
- Safe state works.
- Overall state chooses highest severity.
- Non-road-boundary detections are ignored.
- Inputs are not mutated.

---

## Acceptance Criteria Mapping

| Acceptance Criterion        | Covered By                                             |
| --------------------------- | ------------------------------------------------------ |
| Warning threshold exists    | `DEFAULT_ROAD_EDGE_WARNING_THRESHOLDS.warningDistance` |
| Danger threshold exists     | `DEFAULT_ROAD_EDGE_WARNING_THRESHOLDS.dangerDistance`  |
| Thresholds validated        | `createRoadEdgeWarningThresholds()`                    |
| Warning states explicit     | `RoadEdgeWarningState`                                 |
| Left warning works          | Left-side evaluation                                   |
| Left danger works           | Left-side evaluation                                   |
| Right warning works         | Right-side evaluation                                  |
| Right danger works          | Right-side evaluation                                  |
| Safe state works            | Distance evaluation rules                              |
| Disabled state safe         | Disabled behavior                                      |
| Missing readings documented | Missing data behavior                                  |
| Overall highest severity    | Overall severity                                       |
| Dashboard state available   | Structured output                                      |
| AI-ready output exists      | Structured output                                      |
| Tests exist                 | Testing requirements                                   |

---

## Related Files

```txt
src/simulation/sensors/sensorModel.ts
src/simulation/sensors/sensorState.ts
src/simulation/sensors/sensorUpdateSystem.ts
src/simulation/sensors/roadEdgeWarning.ts
src/simulation/sensors/roadEdgeWarning.test.ts
src/components/DashboardPanelContainer.tsx
```

---

## Future Enhancements

Later tasks may add:

- Dashboard visual warning badges
- Warning/danger color mapping
- AI steering response
- Different thresholds by speed
- Different thresholds by ray group
- Normalized warning severity
- Time-to-road-edge estimate
- Warning history
- Scenario-specific thresholds

---

## Technical Debt Guardrails

Avoid:

- Treating missing readings as safe
- Guessing left/right from flat readings
- Parsing dashboard strings in AI
- Storing duplicate warning state without need
- Adding steering or braking behavior here
- Reading from Zustand inside this module
- Rendering UI inside this module
- Mixing threshold logic into dashboard components
