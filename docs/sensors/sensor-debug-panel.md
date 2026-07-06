# Sensor Debug Panel

## Overview

The sensor debug panel displays dashboard-ready sensor information.

It helps users inspect:

- Sensor enabled/disabled status
- Front sensor awareness
- Left sensor awareness
- Right sensor awareness
- Nearest detected reading

The panel is presentation-focused.

It does not generate rays, calculate intersections, calculate distances, render canvas overlays, update state, or make AI decisions.

---

## Module Locations

Selector module:

```txt
src/simulation/sensors/sensorDebugSummary.ts
```

Panel component:

```txt
src/components/SensorDebugPanel.tsx
```

Recommended tests:

```txt
src/simulation/sensors/sensorDebugSummary.test.ts
src/components/SensorDebugPanel.test.tsx
```

---

## Scope

### In Scope

This feature defines:

- Sensor debug summary selector
- Front sensor display value
- Left sensor display value
- Right sensor display value
- Nearest detection summary
- Sensor enabled/disabled display
- Sensor debug panel component

### Out of Scope

This feature does not implement:

- Ray generation
- Road-edge detection
- Obstacle detection
- Sensor distance calculation
- Sensor overlay rendering
- AI steering behavior
- Traffic-light logic
- Store redesign
- Object identity system
- Sensor history charts

---

## Design Principle

Dashboard components should summarize and display sensor state.

They must not compute simulation truth.

Sensor math belongs in sensor modules.

Sensor display belongs in dashboard components.

---

## Sensor Groups

Supported dashboard groups:

```ts
type SensorDebugGroup = "front" | "left" | "right";
```

Grouped readings shape:

```ts
interface GroupedSensorReadings {
  readonly front: readonly SensorReading[];
  readonly left: readonly SensorReading[];
  readonly right: readonly SensorReading[];
}
```

---

## Display Status

Sensor status is derived from:

```ts
sensorState.config.sensorEnabled;
```

Possible display values:

```ts
type SensorDisplayStatus = "Enabled" | "Disabled";
```

---

## Distance Display

Sensor group distance display values:

```ts
type SensorDistanceDisplay = "Disabled" | "Clear" | "No data" | `${number} px`;
```

Meaning:

| Display        | Meaning                                    |
| -------------- | ------------------------------------------ |
| `Disabled`     | Sensors are off                            |
| `No data`      | No readings exist yet                      |
| `Clear`        | Readings exist, but no detection was found |
| `${number} px` | Nearest detected distance                  |

---

## Disabled Behavior

When sensors are disabled:

```txt
status = Disabled
front = Disabled
left = Disabled
right = Disabled
nearestDetection = null
```

Disabled status must override stale readings.

This prevents old sensor values from appearing active after sensors are turned off.

---

## Empty Readings Behavior

If sensors are enabled but a group has no readings:

```txt
displayDistance = No data
nearestReading = null
```

This usually means the sensor update loop has not populated readings yet.

---

## No-Detection Behavior

If readings exist but all readings are no-detection readings:

```txt
displayDistance = Clear
nearestReading = null
```

No-detection readings must not display as:

```txt
0 px
```

`0 px` would imply an immediate hit.

---

## Detected Reading Behavior

If a group has one or more detected readings, the nearest detected reading wins.

Example:

```txt
front readings:
- obstacle at 80 px
- road-boundary at 40 px
```

Displayed front value:

```txt
40 px
```

---

## Nearest Detection

The nearest detection is selected across all groups:

```txt
front
left
right
```

Minimum displayed information:

- Sensor group
- Detection type
- Distance

Example:

```txt
Left road-boundary at 30 px
```

Until stable world object IDs exist, use “nearest detection” rather than “nearest object”.

---

## Distance Formatting

Distances are rounded and displayed as:

```txt
108 px
```

Invalid distances must be rejected by selector helpers.

Examples of invalid values:

```txt
NaN
Infinity
-1
```

---

## Dashboard Integration

The recommended integration point is the AI telemetry tab.

The AI tab can show:

- AI decision placeholder
- Destination status placeholder
- Sensor debug panel

Example layout:

```tsx
{
  activeTelemetryTabId === "ai" ? (
    <div className="grid grid-cols-1 gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TelemetryCard
          label="AI Decision"
          value={DEFAULT_VEHICLE_TELEMETRY_PLACEHOLDERS.aiDecision}
          isPlaceholder
        />

        <TelemetryCard
          label="Destination Status"
          value={DEFAULT_VEHICLE_TELEMETRY_PLACEHOLDERS.destinationStatus}
          isPlaceholder
        />
      </div>

      <SensorDebugPanel summary={sensorDebugSummary} />
    </div>
  ) : null;
}
```

---

## Important Grouping Rule

Do not blindly pass all readings as front readings.

Incorrect:

```ts
groupedReadings: {
  front: car.sensors.readings,
  left: [],
  right: [],
}
```

This misclassifies readings and can produce misleading telemetry.

Until authoritative grouped readings exist, use one of these safer approaches:

- Derive groups from stable ray labels.
- Derive groups from stored sensor group metadata.
- Show `No data` for groups that cannot be classified.
- Keep the panel disabled until grouped readings are available.

---

## Selector Responsibility

`createSensorDebugSummary()` is responsible for converting grouped readings into display-ready values.

It should:

- Respect disabled sensor state.
- Handle empty readings.
- Handle no-detection readings.
- Select nearest group detection.
- Select nearest overall detection.
- Format distances consistently.

It should not:

- Generate rays.
- Detect intersections.
- Calculate hit distances.
- Read from the store.
- Render UI.
- Mutate sensor state.

---

## Component Responsibility

`SensorDebugPanel` is responsible for rendering a provided summary.

It should:

- Render status.
- Render front distance.
- Render left distance.
- Render right distance.
- Render nearest detection.
- Use accessible labels and semantic markup.

It should not:

- Read from Zustand directly.
- Calculate sensor summaries.
- Generate readings.
- Mutate state.
- Perform simulation logic.

---

## Testing Requirements

Selector tests must verify:

- Disabled sensors override stale readings.
- Empty readings show `No data`.
- No-detection readings show `Clear`.
- Front detection summary works.
- Left detection summary works.
- Right detection summary works.
- Nearest overall detection works.
- Invalid distances are rejected.

Component tests must verify:

- Sensor panel renders.
- Status renders.
- Front value renders.
- Left value renders.
- Right value renders.
- Nearest detection renders.
- Disabled state renders safely.
- No nearest detection renders as `None`.

---

## Acceptance Criteria Mapping

| Acceptance Criterion            | Covered By                      |
| ------------------------------- | ------------------------------- |
| Sensor dashboard section exists | `SensorDebugPanel`              |
| Sensor status displayed         | `summary.status`                |
| Front distance displayed        | `summary.front.displayDistance` |
| Left distance displayed         | `summary.left.displayDistance`  |
| Right distance displayed        | `summary.right.displayDistance` |
| Nearest detection displayed     | `summary.nearestDetection`      |
| Disabled state safe             | Disabled behavior               |
| Empty readings safe             | Empty readings behavior         |
| No-detection readings safe      | No-detection behavior           |
| Formatting consistent           | Distance formatting             |
| Selector tests exist            | Selector testing requirements   |
| Component tests exist           | Component testing requirements  |

---

## Related Files

```txt
src/simulation/sensors/sensorModel.ts
src/simulation/sensors/sensorState.ts
src/simulation/sensors/sensorDebugSummary.ts
src/simulation/sensors/sensorDebugSummary.test.ts
src/components/SensorDebugPanel.tsx
src/components/SensorDebugPanel.test.tsx
src/components/DashboardPanel.tsx
src/components/DashboardPanelContainer.tsx
```

---

## Future Enhancements

Later tasks may add:

- Authoritative front/left/right grouped readings
- Sensor group metadata in `SensorState`
- Labelled sensor readings
- Detection object IDs
- Detection confidence
- Normalized distance display
- Warning/danger severity display
- Sensor history charts
- Debug labels for individual rays
- Toggleable debug panel visibility

---

## Technical Debt Guardrails

Avoid:

- Calculating intersections in dashboard code
- Calculating distances in dashboard code
- Reading raw store state inside `SensorDebugPanel`
- Misclassifying all readings as front readings
- Showing stale readings while sensors are disabled
- Treating no-detection as `0 px`
- Calling nearest detection “nearest object” before object IDs exist
- Mixing canvas overlay rendering with dashboard display
