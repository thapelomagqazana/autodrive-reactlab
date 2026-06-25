# Car State Store Integration

## Purpose

The simulation store is the global runtime state boundary for AutoDrive ReactLab.

After Phase 1.4.6, the store owns the current `car` state so that rendering, dashboard telemetry, controls, and future physics can all read from the same source of truth.

The store must not manually duplicate default car values.

Instead, it must initialize and reset the vehicle through:

```ts
createInitialCar(road);
```

---

# Scope

This document covers **Phase 1.4.6 — Integrate Car State into Zustand Store**.

This phase adds the current car state to the global simulation store.

It does **not** implement:

- Physics updates
- Car rendering
- Keyboard control mapping
- Sensor state
- Collision detection
- AI decision logic

Those systems consume or update the stored car state later.

---

# File Locations

```txt
src/store/simulationStore.ts
src/store/simulationStore.test.ts
src/simulation/vehicle/createInitialCar.ts
src/simulation/world/road.ts
```

---

# Store Ownership

The store owns:

```ts
road: Road;
car: CarState;
```

The road must be created first because the car's starting position depends on road geometry.

Correct initialization order:

```ts
const road = createInitialRoad();

return {
  road,
  car: createInitialCar(road),
};
```

---

# State Shape

Recommended store state:

```ts
export interface SimulationState {
  status: SimulationStatus;
  telemetry: SimulationTelemetry;
  ui: SimulationUiPreferences;

  road: Road;
  car: CarState;
}
```

Recommended actions:

```ts
export interface SimulationActions {
  resetSimulation: () => void;

  setCar: (car: CarState) => void;
  updateCar: (updater: (car: CarState) => CarState) => void;
}
```

---

# Initialization Rule

Initial car state must come from the factory.

Correct:

```ts
const road = createInitialRoad();
const car = createInitialCar(road);
```

Incorrect:

```ts
const car = {
  positionX: 400,
  positionY: 600,
  speed: 0,
};
```

Manual construction creates duplicated defaults and long-term technical debt.

---

# Reset Rule

`resetSimulation()` must recreate both road and car.

Correct:

```ts
resetSimulation: () =>
  set((state) => {
    const road = createInitialRoad();

    return {
      status: "idle",
      telemetry: { ...INITIAL_TELEMETRY },
      ui: state.ui,
      road,
      car: createInitialCar(road),
    };
  });
```

This guarantees that reset restores:

```txt
Position
Speed
Acceleration
Heading
Steering angle
Movement limits
Decision state
Collision count
Distance travelled
```

---

# UI Preference Rule

Reset should preserve UI preferences.

Examples:

```txt
Debug mode
Sensor visibility
```

Reason:

```txt
Reset restarts simulation runtime state.

It should not erase user display preferences.
```

Correct:

```ts
ui: state.ui;
```

---

# Car Update Actions

## setCar

Use when replacing the whole car state.

```ts
setCar: (car) =>
  set(() => ({
    car,
  }));
```

Typical use cases:

```txt
Scenario loading
Replay loading
Full physics replacement
Testing
```

---

## updateCar

Use when deriving a new car state from the current car state.

```ts
updateCar: (updater) =>
  set((state) => ({
    car: updater(state.car),
  }));
```

Typical use cases:

```txt
Physics frame update
Keyboard controls
AI update
Collision update
Telemetry update
```

---

# Immutability Rule

Car updates must be immutable.

Correct:

```ts
updateCar((car) => ({
  ...car,
  speed: 50,
}));
```

Incorrect:

```ts
updateCar((car) => {
  car.speed = 50;
  return car;
});
```

Immutable updates prevent subtle React/Zustand subscription bugs.

---

# Component Rule

Components should read state.

They should not create default car objects.

Correct:

```ts
const car = useSimulationCar();
```

Incorrect:

```ts
const car = {
  positionX: 400,
  speed: 0,
};
```

---

# Selector Hooks

Recommended selector hooks:

```ts
export const useSimulationRoad = () => useSimulationStore((state) => state.road);
```

```ts
export const useSimulationCar = () => useSimulationStore((state) => state.car);
```

```ts
export const useSetCar = () => useSimulationStore((state) => state.setCar);
```

```ts
export const useUpdateCar = () => useSimulationStore((state) => state.updateCar);
```

Selector hooks reduce component coupling to full store shape.

---

# Testing Strategy

## Initialization Tests

Verify:

```txt
Store initializes road.
Store initializes car.
Car starts in road-derived lane.
Car speed starts at 0.
Car angle starts at 0.
Car steering angle starts at 0.
Car decision starts idle.
Collision count starts at 0.
Distance travelled starts at 0.
```

---

## Reset Tests

Verify reset restores:

```txt
status = idle
telemetry.simulationTimeSeconds = 0
telemetry.fps = 0
car.positionX = initial lane center
car.speed = 0
car.angle = 0
car.steeringAngle = 0
car.decision = idle
car.collisionCount = 0
car.distanceTravelled = 0
```

---

## Preference Preservation Tests

Verify reset preserves:

```txt
ui.isDebugModeEnabled
ui.areSensorsVisible
```

---

## Update Tests

Verify:

```txt
setCar replaces the current car.
updateCar derives a new car.
resetSimulation returns a fresh car object.
```

---

# Acceptance Criteria

This task is complete when:

```txt
Zustand store includes a typed car property.
Zustand store includes a typed road property.
Initial car comes from createInitialCar().
Reset restores car through createInitialCar().
Reset restores position, speed, angle, steering, decision, collision count, and distance travelled.
No component owns duplicate initial car values.
Store tests verify initialization and reset.
```

---

# Traceability KPI

```txt
Global car state has one initialization and reset source of truth.
```

Success means:

```txt
100% of initial and reset car state comes from:

createInitialCar(road)
```

and nowhere else.

---

# Engineering Lessons Learned

## Store Is the Runtime Boundary

The store should own runtime state that multiple systems need.

For this project, `car` is shared by:

```txt
Canvas rendering
Dashboard
Controls
Game loop
Physics
AI
Collision detection
Sensors
```

That makes it store-worthy.

---

## Factories Prevent Drift

Without a factory, reset logic slowly drifts from startup logic.

Example failure:

```txt
Startup sets speed = 0.
Reset forgets steeringAngle.
Dashboard shows stale decision.
Collision count remains dirty.
```

Factory-based reset prevents this.

---

## Road Must Exist Before Car

The car's starting position depends on road lane geometry.

Therefore:

```txt
Road first.
Car second.
```

This ordering is critical.

---

## UI Preferences Are Not Runtime Physics

Resetting simulation state should not erase user display preferences.

This keeps reset predictable and user-friendly.

---

# Future Evolution

This store integration prepares the project for:

```txt
Frame-by-frame physics updates
Keyboard movement
AI decision updates
Collision counting
Dashboard telemetry
Sensor rendering
Replay snapshots
Scenario loading
Traffic simulation
Pathfinding state
```

The key principle remains:

```txt
Create car state in one place.
Read it everywhere.
Update it through explicit actions.
```
