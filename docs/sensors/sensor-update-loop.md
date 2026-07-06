# Sensor Update Loop

## Overview

The sensor update loop integrates sensor perception into the simulation frame lifecycle.

It updates sensor rays and sensor readings while the simulation is running, stores the results under `car.sensors`, and makes the latest perception data available to the renderer and dashboard.

This module does not render sensors or make AI decisions.

---

## Module Location

```txt
src/simulation/sensors/sensorUpdateSystem.ts
```

Recommended test file:

```txt
src/simulation/sensors/sensorUpdateSystem.test.ts
```

---

## Frame Order

Correct frame order:

```txt
input
physics update
sensor update
render road
render car
render sensors
dashboard reads car.sensors
```

Sensors must run after physics so rays match the car’s current-frame position and heading.

---

## State Rules

### Running

When status is:

```txt
running
```

and sensors are enabled:

- Recalculate front rays.
- Recalculate side rays.
- Detect road-edge intersections.
- Create one reading per ray.
- Store rays/readings under `car.sensors`.

### Paused or Idle

When status is:

```txt
paused
idle
```

the sensor update is skipped.

Existing sensor state is preserved.

### Disabled Sensors

When:

```ts
car.sensors.config.sensorEnabled === false;
```

the update loop clears:

```txt
car.sensors.rays
car.sensors.readings
```

but preserves:

```txt
car.sensors.config
```

---

## Store Wiring

The update belongs in the Zustand frame/tick action.

Correct order:

```ts
const movedCar = updateCarPhysics(...);

const sensorResult = updateSensorsForFrame({
  status: state.status,
  car: movedCar,
  road: state.road,
});

return {
  car: sensorResult.car,
};
```

Do not update sensors in `SimulationCanvas`.

---

## Render Wiring

Sensor rendering belongs in the frame renderer after road and car drawing:

```ts
drawRoad(context, road, options.road);
drawCar(context, car, options.car);

drawSensors(context, {
  isEnabled: options.sensors?.isEnabled ?? false,
  rays: car.sensors.rays,
  readings: car.sensors.readings,
  style: options.sensors?.style,
});
```

---

## Canvas Visibility Rule

Overlay visibility should be controlled separately from sensor computation.

Recommended condition:

```ts
isEnabled: ui.isDebugModeEnabled &&
  ui.areSensorsVisible &&
  car.sensors.config.sensorEnabled;
```

This means:

```txt
sensor enabled = sensors compute
sensor visible = overlay drawn
debug mode = diagnostic UI visible
```

---

## Stored Sensor Data

Sensor output is stored only under:

```txt
car.sensors.rays
car.sensors.readings
```

Do not add loose fields to `CarState`.

---

## Out of Scope

This task does not implement:

- Obstacle detection
- Lane detection
- Traffic-light detection
- AI decisions
- Dashboard redesign
- Sensor history replay
- Performance profiling

---

## Testing Requirements

Tests must verify:

- Running frames update sensors.
- Paused frames skip sensor updates.
- Idle frames skip sensor updates.
- Disabled sensors clear rays/readings.
- Previous car state is not mutated.
- Readings length matches ray length.
- Sensor state remains under `car.sensors`.
- Renderer draws sensors after road and car.

---

## Technical Guardrails

Avoid:

- Updating sensors before physics.
- Updating sensors in canvas components.
- Rendering inside the sensor update system.
- Reading Zustand directly inside sensor modules.
- Mutating `CarState`.
- Persisting `movedCar` instead of `sensorResult.car`.
- Showing stale rays when sensors are disabled.
