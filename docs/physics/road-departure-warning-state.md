# Road Departure Warning State

## Purpose

Road departure warning state indicates whether the vehicle is currently outside the drivable road area.

The dashboard needs a simple, readable flag:

```ts
roadDepartureWarning: boolean;
```

For MVP:

```txt
false = vehicle is on-road
true  = vehicle is off-road
```

---

# Scope

This document covers **Phase 1.13.2 — Add Road Departure Warning State**.

This phase adds a store-backed warning flag derived from road-boundary detection.

It does **not** implement:

```txt
Automatic braking
Collision response
Damage
Vehicle reset
Game over
Off-road traction
Warning sound
Visual flashing alerts
```

Those behaviours can be added later after warning state is reliable.

---

# Source of Truth

Road departure warning is derived from:

```ts
isCarOffRoad(car, road);
```

The helper comes from:

```txt
src/simulation/engine/roadBoundary.ts
```

The store owns the final UI-readable boolean:

```ts
roadDepartureWarning: boolean;
```

---

# State Model

Recommended store field:

```ts
export interface SimulationState {
  status: SimulationStatus;
  telemetry: SimulationTelemetry;
  ui: SimulationUiPreferences;

  road: Road;
  car: CarState;
  camera: CameraState;

  roadDepartureWarning: boolean;
}
```

Initial value:

```ts
roadDepartureWarning: false;
```

Reset value:

```ts
roadDepartureWarning: false;
```

---

# Store Update Rule

During an active simulation tick:

```ts
const nextCar = updateCarPhysics(state.car, input, deltaTimeSeconds);

const roadDepartureWarning = isCarOffRoad(nextCar, state.road);
```

Then persist:

```ts
return {
  telemetry: {
    ...state.telemetry,
    simulationTimeSeconds: state.telemetry.simulationTimeSeconds + deltaTimeSeconds,
  },
  car: nextCar,
  roadDepartureWarning,
};
```

The warning should reflect the car position after the frame update.

---

# Why Warning Does Not Affect Physics

This task only reports state.

It should not:

```txt
slow the vehicle
stop the vehicle
change steering
change acceleration
reset the car
```

Those behaviours belong to later tasks, such as:

```txt
1.13.3 — Apply Off-Road Speed Penalty
```

---

# Manual Setter

A setter is useful for tests and debug tooling:

```ts
setRoadDepartureWarning: (value: boolean) => void;
```

Implementation:

```ts
setRoadDepartureWarning: (value) =>
  set(() => ({
    roadDepartureWarning: value,
  }));
```

Selector:

```ts
export const useRoadDepartureWarning = () =>
  useSimulationStore((state) => state.roadDepartureWarning);
```

---

# Dashboard Formatting

Recommended formatter:

```txt
src/components/formatRoadDepartureWarning.ts
```

Implementation:

```ts
/**
 * Formats the road departure warning flag for dashboard telemetry.
 */
export function formatRoadDepartureWarning(isWarningActive: boolean): string {
  return isWarningActive ? "Off road" : "On road";
}
```

---

# Dashboard Card

Recommended telemetry card:

```tsx
<TelemetryCard
  label="Road Status"
  value={formatRoadDepartureWarning(roadDepartureWarning)}
/>
```

The dashboard should read the warning from the store through its container.

---

# Behaviour

## On-Road

```txt
isCarOffRoad(car, road) = false
roadDepartureWarning = false
Dashboard = On road
```

---

## Off-Road

```txt
isCarOffRoad(car, road) = true
roadDepartureWarning = true
Dashboard = Off road
```

---

## Return to Road

```txt
isCarOffRoad(car, road) = false
roadDepartureWarning = false
Dashboard = On road
```

The warning must clear automatically when the vehicle returns to the road.

---

# Testing Strategy

## Initial State

Verify:

```txt
roadDepartureWarning starts as false.
```

---

## Off-Road Transition

Set the car outside the road and run one tick.

Expected:

```txt
roadDepartureWarning becomes true.
```

---

## Return-to-Road Transition

Set warning to true, put the car back inside the road, and run one tick.

Expected:

```txt
roadDepartureWarning becomes false.
```

---

## Reset

Set warning to true, then reset.

Expected:

```txt
roadDepartureWarning becomes false.
```

---

## Dashboard

Verify:

```txt
false displays as On road.
true displays as Off road.
Dashboard reads the value from Zustand.
```

---

# Acceptance Criteria

This task is complete when:

```txt
Warning becomes true when vehicle leaves road.
Warning becomes false when vehicle returns to road.
Dashboard can read warning state.
Warning does not affect physics directly.
Tests verify warning transitions.
```

---

# Traceability KPI

```txt
Dashboard warning reflects actual road state.
```

Success means:

```txt
The dashboard warning always reflects isCarOffRoad(car, road).
```

---

# Engineering Lessons Learned

## Detection and Reporting Are Separate

`isCarOffRoad()` detects the condition.

`roadDepartureWarning` reports the condition to the UI.

Neither should duplicate the other's responsibility.

---

## Warning State Is Not Physics

A warning is information.

The vehicle should not slow down or stop merely because the warning flag changed.

Speed penalties belong in a separate task.

---

## Store State Should Be Dashboard-Friendly

The dashboard should not calculate road boundaries.

It should read a simple flag:

```ts
roadDepartureWarning;
```

This keeps UI simple and testable.

---

# Future Evolution

The boolean MVP can later evolve into:

```ts
warningLevel: "none" | "warning" | "critical";
```

Possible future behaviours:

```txt
road-departure alert banner
red dashboard warning
off-road speed penalty
lane-keeping warnings
AI reward penalty
sound alert
collision counter
recovery guidance
```

The stable rule remains:

```txt
Warning state is derived from boundary detection, not guessed by the UI.
```
