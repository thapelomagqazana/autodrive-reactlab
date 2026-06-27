# Vehicle Speed Telemetry

## Purpose

Vehicle speed telemetry displays the current simulation speed of the car on the dashboard.

The displayed value must come directly from:

```ts
CarState.speed;
```

This makes the dashboard reflect the same store-backed state used by the physics engine.

---

# Scope

This document covers **Phase 1.11.1 — Display Vehicle Speed Telemetry**.

This phase adds a live speed metric card to the dashboard.

It does **not** implement:

```txt
km/h conversion
mph conversion
Real-world vehicle calibration
Speedometer animation
Instantaneous acceleration display
```

---

# Source of Truth

The source of truth is:

```ts
state.car.speed;
```

from the Zustand simulation store.

The dashboard must not keep duplicate speed in local component state.

---

# Unit

MVP unit:

```txt
pixels/second
```

Display label:

```txt
px/s
```

Future versions may convert simulation speed into:

```txt
km/h
mph
m/s
```

---

# Display Format

MVP format:

```txt
rounded integer
```

Examples:

```txt
0       -> 0 px/s
12.4    -> 12 px/s
12.5    -> 13 px/s
-7.6    -> -8 px/s
```

Negative speed is valid because the car may reverse.

---

# Store Selector

Recommended selector:

```ts
export const useSimulationCarSpeed = () => useSimulationStore((state) => state.car.speed);
```

This keeps the component dependency small and avoids subscribing to the whole car object.

---

# Formatter

Recommended file:

```txt
src/components/formatVehicleSpeed.ts
```

Recommended implementation:

```ts
/**
 * Formats simulation vehicle speed for MVP dashboard telemetry.
 *
 * Unit:
 * - pixels per second
 *
 * MVP rule:
 * - display rounded integer
 */
export function formatVehicleSpeed(speed: number): string {
  if (!Number.isFinite(speed)) {
    return "0";
  }

  return Math.round(speed).toString();
}
```

---

# Dashboard Prop

Recommended prop:

```ts
vehicleSpeed: number;
```

This keeps `DashboardPanel` presentational.

It receives values and renders them.

It does not read Zustand directly.

---

# Container Wiring

Recommended container responsibility:

```tsx
const vehicleSpeed = useSimulationCarSpeed();

return (
  <DashboardPanel
    status={status}
    simulationTimeSeconds={simulationTimeSeconds}
    fps={fps}
    vehicleSpeed={vehicleSpeed}
    canvasDiagnostics={canvasDiagnostics}
  />
);
```

---

# Telemetry Card

Recommended card:

```tsx
<TelemetryCard label="Vehicle Speed" value={`${formatVehicleSpeed(vehicleSpeed)} px/s`} />
```

The speed card should not use placeholder text once live speed telemetry exists.

---

# Testing Strategy

## Formatter Tests

Verify:

```txt
0 formats as "0".
Positive decimal speed rounds consistently.
Negative reverse speed rounds consistently.
NaN returns "0".
Infinity returns "0".
```

---

## Dashboard Tests

Verify:

```txt
Dashboard renders Vehicle Speed label.
Dashboard renders the speed value.
Dashboard renders px/s unit.
Vehicle Speed is no longer a placeholder.
```

---

## Container Tests

Verify:

```txt
DashboardPanelContainer reads speed from Zustand.
Changing state.car.speed changes displayed speed.
Displayed speed matches formatted CarState.speed.
```

---

# Acceptance Criteria

This task is complete when:

```txt
Dashboard reads speed from CarState.
Speed updates while simulation runs.
Speed displays 0 when stationary.
Speed updates without page refresh.
Value is formatted consistently.
Unit label is displayed.
Tests verify dashboard updates when speed changes.
```

---

# Traceability KPI

```txt
Displayed speed equals current CarState.speed.
```

Success means:

```txt
The dashboard speed card always reflects the same speed value used by physics.
```

---

# Engineering Lessons Learned

## Telemetry Must Read Runtime State

Telemetry is only useful if it reflects the real simulation state.

Avoid hardcoded placeholders after the real field exists.

---

## Use Narrow Selectors

Subscribing only to:

```ts
state.car.speed;
```

avoids unnecessary dashboard re-renders from unrelated car changes.

---

## Keep Units Honest

The MVP speed is not km/h.

It is simulation speed:

```txt
pixels/second
```

Clear units prevent misleading telemetry.

---

# Future Evolution

This telemetry foundation can later support:

```txt
km/h conversion
mph conversion
Speedometer gauge
Speed history chart
Average speed
Top speed
Reverse-speed indicator
Telemetry export
Replay overlays
```

The stable rule remains:

```txt
Displayed speed comes from CarState.speed.
```
