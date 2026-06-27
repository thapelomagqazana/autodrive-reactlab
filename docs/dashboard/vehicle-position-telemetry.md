# Vehicle Position Telemetry

## Purpose

Vehicle position telemetry displays the current location of the simulated vehicle within the canvas coordinate system.

The displayed values must come directly from:

```ts
CarState.positionX;
CarState.positionY;
```

This telemetry allows developers to verify that the physics engine, renderer, and dashboard are all using the same position state.

---

# Scope

This document covers **Phase 1.11.4 — Display Vehicle Position Coordinates**.

This phase introduces a live dashboard telemetry card showing the vehicle's X and Y coordinates.

This phase does **not** implement:

- GPS coordinates
- Geographic positioning
- World-space transforms
- Camera-relative coordinates
- Route tracking
- Historical position replay

---

# Source of Truth

The dashboard must always display the current values from the simulation store:

```ts
state.car.positionX;
state.car.positionY;
```

No duplicate position state should exist inside the dashboard.

---

# Coordinate System

The simulation uses the HTML Canvas coordinate system.

```
Origin
(0,0)
┌────────────────────────────────────► +X

│

│

│

▼
+Y
```

Rules:

- Origin = top-left corner
- Positive X = right
- Positive Y = down

Example:

```
X: 450
Y: 720
```

indicates the vehicle center is located:

- 450 pixels from the left edge
- 720 pixels from the top edge

---

# Display Format

For readability, coordinates should be rounded to whole pixels.

Examples:

```
450.2 → X: 450
719.8 → Y: 720
```

Recommended display:

```
X: 450 | Y: 720
```

or

```
X: 450
Y: 720
```

Both are acceptable, provided the labels are clear and formatting is consistent.

---

# Store Selectors

Prefer primitive selectors over object selectors.

Recommended:

```ts
export const useSimulationCarPositionX = () =>
  useSimulationStore((state) => state.car.positionX);

export const useSimulationCarPositionY = () =>
  useSimulationStore((state) => state.car.positionY);
```

Avoid:

```ts
useSimulationStore((state) => ({
  positionX: state.car.positionX,
  positionY: state.car.positionY,
}));
```

Returning a new object on every render can trigger unnecessary re-renders and, depending on usage, lead to update loops.

---

# Formatter

Recommended file:

```
src/components/formatVehiclePosition.ts
```

Recommended implementation:

```ts
/**
 * Formats vehicle canvas coordinates for dashboard telemetry.
 *
 * Coordinate system:
 * - origin at top-left
 * - X increases to the right
 * - Y increases downward
 */
export function formatVehiclePosition(positionX: number, positionY: number): string {
  const x = Number.isFinite(positionX) ? Math.round(positionX) : 0;
  const y = Number.isFinite(positionY) ? Math.round(positionY) : 0;

  return `X: ${x} | Y: ${y}`;
}
```

---

# Dashboard Properties

Recommended props:

```ts
vehiclePositionX: number;
vehiclePositionY: number;
```

The dashboard should remain a presentational component.

---

# Container Wiring

Recommended implementation:

```tsx
const vehiclePositionX = useSimulationCarPositionX();
const vehiclePositionY = useSimulationCarPositionY();

<DashboardPanel
    ...
    vehiclePositionX={vehiclePositionX}
    vehiclePositionY={vehiclePositionY}
/>
```

---

# Telemetry Card

Recommended implementation:

```tsx
<TelemetryCard
  label="Position"
  value={formatVehiclePosition(vehiclePositionX, vehiclePositionY)}
/>
```

---

# Runtime Behaviour

The displayed coordinates should update every simulation frame.

Examples:

Vehicle stationary:

```
X: 400 | Y: 650
```

Vehicle moving:

```
X: 401 | Y: 645

↓

X: 404 | Y: 639

↓

X: 410 | Y: 625
```

The dashboard should reflect movement without requiring a page refresh.

---

# Testing Strategy

## Formatter Tests

Verify:

```
Integer coordinates display correctly.
Decimal coordinates round correctly.
Negative coordinates display correctly.
NaN becomes 0.
Infinity becomes 0.
```

---

## Dashboard Tests

Verify:

```
Position label renders.
Formatted coordinates render.
Rounded values are displayed.
Formatting remains consistent.
```

---

## Container Tests

Verify:

```
Dashboard reads X from CarState.
Dashboard reads Y from CarState.
Changing CarState.positionX updates dashboard.
Changing CarState.positionY updates dashboard.
Displayed values match formatted state.
```

---

# Acceptance Criteria

Implementation is complete when:

```
Dashboard reads X and Y from CarState.
Coordinates update during movement.
Coordinates are rounded.
Display clearly labels X and Y.
Tests verify coordinate updates.
```

---

# Traceability KPI

```
Displayed coordinates always match the rendered vehicle position.
```

This ensures:

- Physics
- Rendering
- Dashboard

all reference the same runtime position.

---

# Architecture Notes

Position telemetry is primarily a debugging and validation feature.

It allows developers to confirm:

- Physics integration is functioning correctly.
- Vehicle movement updates are occurring every frame.
- The renderer and dashboard remain synchronized.
- Simulation state remains the single source of truth.

Because the dashboard subscribes directly to Zustand selectors, no duplicate state or manual synchronization is required.

---

# Future Evolution

This telemetry provides the foundation for:

- World-space coordinates
- GPS coordinate simulation
- Waypoint tracking
- Destination telemetry
- Distance travelled
- Path visualization
- Replay debugging
- AI localization diagnostics
- Position history graphs

The governing rule remains:

```
Displayed coordinates always originate from CarState.positionX and CarState.positionY.
```
