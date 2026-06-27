# Read Car State Each Frame

## Purpose

The simulation loop must read the latest `CarState` from the Zustand store during every active frame.

This prevents stale React-rendered values from being used inside the animation loop.

The core rule is:

```txt
Per-frame simulation state must come from useSimulationStore.getState().
```

---

# Scope

This document covers **Phase 1.9.1 — Read Car State from the Simulation Store Each Frame**.

This phase connects the game loop to the latest store-backed car state.

It does **not** implement:

```txt
New physics rules
Keyboard mapping
Canvas drawing
AI decision-making
Sensor logic
Collision logic
```

---

# File Locations

```txt
src/components/SimulationLoopController.tsx
src/store/simulationStore.ts
src/store/simulationStore.test.ts
```

---

# Problem

React component values are render snapshots.

If a game loop callback closes over a React value such as:

```ts
const car = useSimulationCar();
```

then the loop may keep using the old value even after the store changes.

This creates stale-state bugs.

---

# Incorrect Pattern

```tsx
const car = useSimulationCar();

loop.start({
  update: (tick) => {
    updateCarPhysics(car, input, tick.deltaTimeSeconds);
  },
});
```

Problem:

```txt
car was captured when React rendered.
The animation loop may continue using that old value.
```

---

# Correct Pattern

```tsx
loop.start({
  update: (tick) => {
    const state = useSimulationStore.getState();

    state.tickSimulation(inputRef.current, tick.deltaTimeSeconds);
  },
});
```

Why this works:

```txt
getState() reads the current Zustand state at frame execution time.
```

---

# Source of Truth

The runtime source of truth is:

```txt
Zustand simulation store
```

Specifically:

```txt
state.car
```

Do not duplicate the car in local component state.

---

# Store Action Signature

Recommended:

```ts
tickSimulation(
  input: CarPhysicsInput,
  deltaTimeSeconds: number,
): void;
```

This action owns the frame update.

Inside the action:

```ts
car: updateCarPhysics(state.car, input, deltaTimeSeconds);
```

The important detail is:

```txt
state.car is read inside Zustand's set callback.
```

That means it is the latest store-backed value.

---

# Recommended Store Implementation

```ts
tickSimulation: (input, deltaTimeSeconds) =>
  set((state) => {
    if (state.status !== "running" || !isValidNonNegativeFiniteNumber(deltaTimeSeconds)) {
      return state;
    }

    return {
      telemetry: {
        ...state.telemetry,
        simulationTimeSeconds: state.telemetry.simulationTimeSeconds + deltaTimeSeconds,
      },
      car: updateCarPhysics(state.car, input, deltaTimeSeconds),
    };
  });
```

---

# Keyboard Input Ref

Keyboard input comes from React.

The game loop should not close over stale input either.

Use a ref:

```tsx
const keyboardInput = useKeyboardControls();
const inputRef = useRef(keyboardInput);

useEffect(() => {
  inputRef.current = keyboardInput;
}, [keyboardInput]);
```

Then inside the frame callback:

```tsx
state.tickSimulation(inputRef.current, tick.deltaTimeSeconds);
```

This keeps input fresh without restarting the game loop every time a key changes.

---

# Recommended Loop Controller

```tsx
export function SimulationLoopController() {
  const status = useSimulationStatus();
  const keyboardInput = useKeyboardControls();

  const inputRef = useRef(keyboardInput);
  const loopRef = useRef<GameLoopController | null>(null);

  useEffect(() => {
    inputRef.current = keyboardInput;
  }, [keyboardInput]);

  useEffect(() => {
    if (!loopRef.current) {
      loopRef.current = createGameLoop({
        maxDeltaTimeSeconds: 0.05,
      });
    }

    const loop = loopRef.current;

    if (status !== "running") {
      loop.stop();
      return;
    }

    loop.start({
      update: (tick) => {
        const state = useSimulationStore.getState();

        if (state.status !== "running") {
          return;
        }

        state.tickSimulation(inputRef.current, tick.deltaTimeSeconds);
      },

      render: () => {
        // Rendering is handled by SimulationCanvas reacting to store updates.
      },

      onFps: (fps) => {
        useSimulationStore.getState().setFps(fps);
      },
    });

    return () => {
      loop.stop();
    };
  }, [status]);

  return null;
}
```

---

# Why Not Put Car in a Ref?

A ref can avoid React stale closures, but it creates a second source of truth.

Avoid this:

```tsx
const carRef = useRef(car);
```

unless there is a very specific rendering-only need.

The safer model is:

```txt
Zustand owns car.
Frame callback reads Zustand.
```

---

# Rendering

Rendering should read store-backed state separately.

The frame loop updates state.

The canvas renderer draws state.

Recommended separation:

```txt
SimulationLoopController
    updates runtime state

SimulationCanvas
    draws current state
```

---

# Testing Strategy

## Store Tests

Verify:

```txt
tickSimulation uses latest store-backed car state.
tickSimulation does not update while idle.
tickSimulation does not update while paused.
tickSimulation updates simulation time while running.
tickSimulation updates car through updateCarPhysics().
```

---

## Stale-State Regression Test

Recommended test:

```ts
it("tickSimulation uses the latest store-backed car state", () => {
  const road = createInitialRoad();

  useSimulationStore.setState({
    status: "running",
    telemetry: {
      simulationTimeSeconds: 0,
      fps: 0,
    },
    ui: {
      isDebugModeEnabled: false,
      areSensorsVisible: true,
    },
    road,
    car: {
      ...createInitialCar(road),
      speed: 10,
      friction: 0,
    },
  });

  useSimulationStore.getState().setCar({
    ...useSimulationStore.getState().car,
    speed: 100,
    friction: 0,
  });

  useSimulationStore.getState().tickSimulation(NEUTRAL_CAR_PHYSICS_INPUT, 1);

  expect(useSimulationStore.getState().car.speed).toBe(100);
  expect(useSimulationStore.getState().car.positionY).toBe(500);
});
```

---

# Acceptance Criteria

This task is complete when:

```txt
Game loop reads the latest car state during each active frame.
Car state source of truth remains Zustand.
Animation callback does not close over outdated car values.
No duplicate car state exists in component-local state.
Unit or integration test verifies frame update uses latest car state.
```

---

# Traceability KPI

```txt
100% of runtime car updates use the latest store-backed car state.
```

Success means:

```txt
All frame updates use Zustand state at execution time.
```

---

# Engineering Lessons Learned

## React Values Are Snapshots

React hook values represent the state at render time.

Animation loops run outside normal React render timing.

That mismatch can create stale closures.

---

## Zustand getState Is Runtime-Friendly

`useSimulationStore.getState()` gives direct access to current store state.

That makes it appropriate inside animation callbacks.

---

## One Source of Truth Wins

Do not duplicate car state in:

```txt
React component state
Refs
Canvas objects
Game loop local variables
```

Keep the car in Zustand and update it through store actions.

---

# Future Evolution

This pattern prepares the project for:

```txt
AI driving input
Sensor updates
Collision checks
Replay playback
Debug stepping
Networked simulation
Recording frame history
Deterministic test runners
```

The stable invariant remains:

```txt
Every active frame reads current runtime state from the store.
```
