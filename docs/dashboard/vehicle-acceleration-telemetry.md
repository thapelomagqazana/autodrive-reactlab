# Vehicle Acceleration Telemetry

## Purpose

Vehicle acceleration telemetry displays the car's configured acceleration capability on the simulation dashboard.

The displayed value must come directly from:

```ts
CarState.acceleration;
```

This telemetry communicates how quickly the vehicle is capable of increasing its speed when acceleration input is applied.

It is **not**:

- Current vehicle speed
- Instantaneous change in velocity
- Engine RPM
- Throttle percentage
- Measured acceleration from sensors

---

# Scope

This document covers **Phase 1.11.2 — Display Vehicle Acceleration Telemetry**.

This phase introduces a live dashboard card that displays the vehicle's configured acceleration value.

This phase does **not** implement:

- Live measured acceleration
- Longitudinal acceleration sensors
- Lateral acceleration
- G-force calculations
- Traction control
- Vehicle dynamics analysis

---

# Source of Truth

Acceleration telemetry must always originate from:

```ts
state.car.acceleration;
```

within the Zustand simulation store.

The dashboard must never duplicate this value in local React state.

---

# Unit

MVP unit:

```text
pixels/second²
```

Displayed as:

```text
px/s²
```

This represents the configured acceleration capability used by the physics engine.

Future versions may additionally display:

- m/s²
- km/h per second
- G-force equivalents

---

# Meaning of the Value

For example:

```text
Acceleration = 120 px/s²
```

means that while acceleration input is active:

```text
Speed increases by approximately 120 pixels/second every second.
```

Example:

```text
t = 0 s
Speed = 0 px/s

t = 1 s
Speed ≈ 120 px/s

t = 2 s
Speed ≈ 240 px/s
```

until constrained by:

- maximum forward speed
- braking
- friction
- reverse limits

---

# Configuration

The default acceleration is defined by:

```ts
export const DEFAULT_CAR_ACCELERATION = 120;
```

This is **only the default configuration**.

Individual vehicles may override this value.

Examples:

```text
Truck:
60 px/s²

Sedan:
120 px/s²

Sports Car:
220 px/s²
```

The dashboard must always display the value stored in the current `CarState`.

---

# Store Selector

Recommended selector:

```ts
export const useSimulationCarAcceleration = () =>
  useSimulationStore((state) => state.car.acceleration);
```

Using a narrow selector minimizes unnecessary React re-renders.

---

# Formatter

Recommended file:

```text
src/components/formatVehicleAcceleration.ts
```

Recommended implementation:

```ts
/**
 * Formats configured vehicle acceleration for dashboard telemetry.
 *
 * Unit:
 * - pixels per second squared
 *
 * The displayed value represents the configured acceleration capability
 * rather than instantaneous acceleration.
 */
export function formatVehicleAcceleration(acceleration: number): string {
  if (!Number.isFinite(acceleration)) {
    return "0";
  }

  return Math.round(acceleration).toString();
}
```

---

# Dashboard Prop

Recommended prop:

```ts
vehicleAcceleration: number;
```

`DashboardPanel` should remain a presentational component.

It receives values rather than reading the simulation store directly.

---

# Container Wiring

Recommended implementation:

```tsx
const vehicleAcceleration = useSimulationCarAcceleration();

return (
  <DashboardPanel
    status={status}
    simulationTimeSeconds={simulationTimeSeconds}
    fps={fps}
    vehicleSpeed={vehicleSpeed}
    vehicleAcceleration={vehicleAcceleration}
    canvasDiagnostics={canvasDiagnostics}
  />
);
```

---

# Telemetry Card

Recommended implementation:

```tsx
<TelemetryCard
  label="Acceleration"
  value={`${formatVehicleAcceleration(vehicleAcceleration)} px/s²`}
/>
```

The acceleration card should no longer display placeholder text after this feature is implemented.

---

# UI Behaviour

Expected examples:

```text
0 px/s²
```

```text
120 px/s²
```

```text
220 px/s²
```

Formatting must remain consistent across all dashboard updates.

---

# Testing Strategy

## Formatter Tests

Verify:

```text
0 formats correctly.
Positive decimal values round correctly.
Large values display correctly.
NaN returns "0".
Infinity returns "0".
```

---

## Dashboard Tests

Verify:

```text
Vehicle Speed card renders.
Acceleration card renders.
Acceleration unit is displayed.
Displayed value matches formatted CarState.acceleration.
Placeholder is removed.
```

---

## Container Tests

Verify:

```text
DashboardPanelContainer reads acceleration from Zustand.
Changing CarState.acceleration updates the dashboard.
Displayed value matches the store.
```

---

# Acceptance Criteria

Implementation is complete when:

```text
Dashboard reads acceleration from CarState.
Acceleration displays in px/s².
Formatting is consistent.
Dashboard updates automatically when acceleration changes.
Tests verify displayed value matches CarState.acceleration.
```

---

# Traceability KPI

```text
Displayed acceleration always equals CarState.acceleration.
```

This guarantees that dashboard telemetry reflects the same configuration used by the physics engine.

---

# Architecture Notes

The dashboard intentionally displays the **configured acceleration capability**, not measured acceleration.

This separation avoids confusion between:

```text
Vehicle Capability
```

and

```text
Vehicle Runtime Behaviour
```

For example:

```text
Capability:
120 px/s²
```

does not necessarily mean the vehicle is currently accelerating.

If the driver is not pressing the accelerator:

```text
Speed = constant

Configured acceleration = 120 px/s²
```

Both values can exist simultaneously.

---

# Future Evolution

This telemetry system provides the foundation for:

- Live measured acceleration
- Longitudinal acceleration graphs
- Lateral acceleration
- G-force indicators
- Vehicle performance comparisons
- Multiple vehicle profiles
- AI driving diagnostics
- Performance tuning tools
- Telemetry recording and replay

The governing rule remains:

```text
Dashboard acceleration telemetry always reflects CarState.acceleration.
```
