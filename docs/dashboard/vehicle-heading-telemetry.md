# Vehicle Heading Telemetry

## Purpose

Vehicle heading telemetry displays the current orientation of the simulated vehicle.

The internal simulation value comes from:

```ts
CarState.angle;
```

The dashboard converts this value from radians into degrees for readability.

---

# Scope

This document covers **Phase 1.11.5 — Display Vehicle Heading Telemetry**.

This phase adds a dashboard telemetry card for the vehicle heading angle.

It does **not** implement:

```txt
Compass labels
Path following
Navigation directions
GPS heading
Yaw-rate telemetry
Heading history graphs
```

---

# Source of Truth

The source of truth is:

```ts
state.car.angle;
```

from the Zustand simulation store.

No duplicate heading value should exist in dashboard-local state.

---

# Internal Representation

Physics and rendering use:

```txt
radians
```

Rules:

```txt
0 radians = north/up on canvas
positive rotation = clockwise
negative rotation = counter-clockwise
```

The renderer should use the raw radian value.

The dashboard should convert only for display.

---

# Dashboard Representation

The dashboard displays:

```txt
degrees
```

Examples:

```txt
0°
90°
180°
270°
```

MVP displays degrees only.

Future versions may display compass labels such as:

```txt
North
North-East
East
South-East
South
South-West
West
North-West
```

---

# Normalization Rule

Heading should be normalized for display into:

```txt
0° <= heading < 360°
```

Examples:

```txt
0 radians       -> 0°
π / 2 radians   -> 90°
π radians       -> 180°
3π / 2 radians  -> 270°
2π radians      -> 0°
-π / 2 radians  -> 270°
```

---

# Store Selector

Recommended selector:

```ts
export const useSimulationCarHeading = () =>
  useSimulationStore((state) => state.car.angle);
```

This keeps the dashboard subscribed only to the heading value.

---

# Formatter

Recommended file:

```txt
src/components/formatVehicleHeading.ts
```

Recommended implementation:

```ts
/**
 * Formats vehicle heading for dashboard telemetry.
 *
 * Internal unit:
 * - radians
 *
 * Display unit:
 * - degrees
 *
 * Convention:
 * - 0 radians = north/up on canvas
 * - positive angle = clockwise rotation
 *
 * Display rule:
 * - normalize to [0, 360)
 * - round to the nearest whole degree
 */
export function formatVehicleHeading(radians: number): string {
  if (!Number.isFinite(radians)) {
    return "0°";
  }

  const rawDegrees = (radians * 180) / Math.PI;
  const normalizedDegrees = ((rawDegrees % 360) + 360) % 360;
  const roundedDegrees = Math.round(normalizedDegrees) % 360;

  return `${Object.is(roundedDegrees, -0) ? 0 : roundedDegrees}°`;
}
```

---

# Dashboard Prop

Recommended prop:

```ts
vehicleHeading: number;
```

`DashboardPanel` should remain presentational.

It receives values and renders them.

It should not read Zustand directly.

---

# Container Wiring

Recommended container wiring:

```tsx
const vehicleHeading = useSimulationCarHeading();

return (
  <DashboardPanel
    status={status}
    simulationTimeSeconds={simulationTimeSeconds}
    fps={fps}
    vehicleSpeed={vehicleSpeed}
    vehicleAcceleration={vehicleAcceleration}
    steeringAngle={steeringAngle}
    vehiclePositionX={vehiclePositionX}
    vehiclePositionY={vehiclePositionY}
    vehicleHeading={vehicleHeading}
    canvasDiagnostics={canvasDiagnostics}
  />
);
```

---

# Telemetry Card

Recommended card:

```tsx
<TelemetryCard label="Heading" value={formatVehicleHeading(vehicleHeading)} />
```

Once this is implemented, the heading card should no longer use placeholder text.

---

# Testing Strategy

## Formatter Tests

Verify:

```txt
0 radians formats as 0°.
π / 2 radians formats as 90°.
π radians formats as 180°.
3π / 2 radians formats as 270°.
2π radians formats as 0°.
Negative heading normalizes correctly.
NaN returns 0°.
Infinity returns 0°.
```

---

## Dashboard Tests

Verify:

```txt
Heading label renders.
Heading value renders in degrees.
The heading placeholder is removed.
Display format is consistent.
```

---

## Container Tests

Verify:

```txt
DashboardPanelContainer reads angle from Zustand.
Changing CarState.angle updates the heading card.
Displayed heading matches formatted CarState.angle.
```

---

# E2E Note

If both steering and heading display:

```txt
0°
```

then Playwright strict mode may match more than one element.

Prefer test IDs for telemetry cards:

```tsx
<TelemetryCard
  testId="vehicle-heading-telemetry"
  label="Heading"
  value={formatVehicleHeading(vehicleHeading)}
/>
```

Then E2E can assert:

```ts
await expect(page.getByTestId("vehicle-heading-telemetry")).toContainText("0°");
```

---

# Acceptance Criteria

This task is complete when:

```txt
Dashboard reads angle from CarState.
Radians are converted to degrees.
Heading updates while turning.
Display format is consistent.
Tests verify conversion accuracy.
```

---

# Traceability KPI

```txt
Displayed heading matches vehicle orientation.
```

Success means:

```txt
Dashboard heading reflects the same CarState.angle used by the renderer.
```

---

# Engineering Lessons Learned

## Keep Physics in Radians

Radians are the correct internal unit for trigonometry and canvas rotation.

The dashboard should convert to degrees only at the presentation boundary.

---

## Normalize for Humans

Physics can accumulate angles beyond one full rotation.

Humans expect heading to stay inside:

```txt
0° to 359°
```

Normalization makes telemetry easier to read.

---

## Avoid Duplicate Heading State

Do not store a second heading value in UI state.

Read from Zustand and format at render time.

---

# Future Evolution

This telemetry can later support:

```txt
Compass direction labels
Yaw-rate telemetry
Heading history
Autopilot target heading
Lane-following heading error
Route navigation bearing
Debug overlays
Replay telemetry
```

The stable rule remains:

```txt
Displayed heading comes from CarState.angle.
```
