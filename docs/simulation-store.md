# Simulation Store

## Overview

The simulation store is the global Zustand state module for **AutoDrive ReactLab**.

It owns lightweight, UI-visible simulation state that needs to be shared between controls, dashboard, canvas integration, and future runtime coordination.

The store is a coordination boundary. It is not the simulation engine.

---

# Purpose

The simulation store exists to answer one question:

> What simulation state does the UI and runtime coordination layer need to share safely?

It provides a typed, deterministic state model for:

- simulation lifecycle status
- elapsed simulation time
- sampled FPS telemetry
- debug-mode preference
- sensor-visibility preference
- lifecycle actions

---

# Responsibilities

The store owns:

- `status`
- `simulationTimeSeconds`
- `fps`
- `isDebugModeEnabled`
- `areSensorsVisible`
- `startSimulation`
- `pauseSimulation`
- `resetSimulation`
- `advanceSimulationTime`
- `setSimulationTimeSeconds`
- `setFps`
- `toggleDebugMode`
- `toggleSensorsVisibility`
- focused selector hooks

---

# Non-Responsibilities

The store must not contain:

- canvas rendering context
- `requestAnimationFrame` IDs
- game loop instance
- raw sensor arrays
- heavy physics objects
- large replay history
- road mesh data
- AI model internals
- browser-only APIs during store creation
- per-frame rendering calculations

Those responsibilities belong to engine, rendering, replay, or runtime modules.

---

# State Shape

```ts
export type SimulationStatus = "idle" | "running" | "paused";

export interface SimulationTelemetry {
  simulationTimeSeconds: number;
  fps: number;
}

export interface SimulationUiPreferences {
  isDebugModeEnabled: boolean;
  areSensorsVisible: boolean;
}

export interface SimulationState {
  status: SimulationStatus;
  telemetry: SimulationTelemetry;
  ui: SimulationUiPreferences;
}
```

---

# Initial State

```ts
const INITIAL_TELEMETRY = {
  simulationTimeSeconds: 0,
  fps: 0,
};

const INITIAL_UI = {
  isDebugModeEnabled: false,
  areSensorsVisible: true,
};

const INITIAL_STATUS = "idle";
```

The initial state must be deterministic.

It must not depend on:

```text
window
document
canvas
localStorage
Date.now
performance.now
requestAnimationFrame
```

---

# Lifecycle Status

## Type

```ts
export type SimulationStatus = "idle" | "running" | "paused";
```

## Meaning

```text
idle:
The simulation has not started or has been reset.

running:
The simulation lifecycle is active.

paused:
The simulation is halted without resetting runtime state.
```

## Valid Transitions

```text
idle    -> running
running -> paused
paused  -> running
running -> idle
paused  -> idle
idle    -> idle
```

## Invalid Transitions

```text
idle -> paused is ignored
running -> running is safe/no-op
paused -> paused is safe/no-op
```

---

# Lifecycle Actions

## `startSimulation`

Starts or resumes the simulation lifecycle.

```ts
startSimulation: () => void;
```

Rules:

```text
idle   -> running
paused -> running
running -> running/no-op
```

The action updates store state only.

It must not call:

```text
requestAnimationFrame
gameLoop.start
canvas APIs
```

---

## `pauseSimulation`

Pauses the simulation lifecycle.

```ts
pauseSimulation: () => void;
```

Rules:

```text
running -> paused
idle    -> idle/no-op
paused  -> paused/no-op
```

The action updates store state only.

It must not call:

```text
cancelAnimationFrame
gameLoop.stop
canvas APIs
```

---

## `resetSimulation`

Restores runtime simulation state to a known baseline.

```ts
resetSimulation: () => void;
```

Reset restores:

```text
status = idle
simulationTimeSeconds = 0
fps = 0
```

Reset preserves:

```text
isDebugModeEnabled
areSensorsVisible
selected scenario, when added later
```

Reset must not erase user preferences unless a separate explicit preference-reset action is added.

---

# Simulation Time

## Field

```ts
simulationTimeSeconds: number;
```

## Unit

```text
seconds
```

## Rule

`simulationTimeSeconds` is simulation time, not wall-clock time.

It should advance only when:

```text
status === "running"
```

It should not advance when:

```text
status === "idle"
status === "paused"
```

---

## `advanceSimulationTime`

```ts
advanceSimulationTime: (deltaTimeSeconds: number) => void;
```

This action is intended for game-loop integration.

It accepts delta time in seconds and accumulates it into `simulationTimeSeconds`.

Valid values:

```text
finite
non-negative
number
```

Invalid values are ignored:

```text
NaN
Infinity
-Infinity
negative numbers
```

---

## `setSimulationTimeSeconds`

```ts
setSimulationTimeSeconds: (value: number) => void;
```

This action directly sets elapsed simulation time.

It is useful for:

- tests
- replay restore
- deterministic scenario setup
- future timeline scrubbing

It must still reject invalid values.

---

# FPS Telemetry

## Field

```ts
fps: number;
```

## Unit

```text
frames per second
```

## Rule

FPS is telemetry produced by the game loop.

The store receives sampled FPS values only.

The store must not calculate FPS from timestamps.

---

## `setFps`

```ts
setFps: (value: number) => void;
```

Valid values:

```text
finite
non-negative
number
```

Invalid values are ignored:

```text
NaN
Infinity
-Infinity
negative numbers
```

FPS should be updated at a controlled telemetry interval such as:

```text
500ms
1000ms
```

It should not be updated every animation frame.

---

# UI Preferences

## `isDebugModeEnabled`

Controls future development overlays such as:

- canvas bounds
- grid markers
- sensor debug views
- AI reasoning overlays

---

## `areSensorsVisible`

Controls whether future sensor rays are visible on the simulation canvas.

---

## Preference Rule

UI preferences are user choices.

They should survive simulation reset.

Resetting the simulation should restart runtime state, not erase display preferences.

---

# Selector Hooks

Use focused selector hooks instead of subscribing to the whole store.

Preferred:

```ts
const status = useSimulationStatus();
const fps = useSimulationFps();
const simulationTime = useSimulationTimeSeconds();
```

Avoid:

```ts
const state = useSimulationStore();
```

Subscribing to the whole store may cause unnecessary component re-renders as the simulator grows.

---

# Public Selectors

```ts
useSimulationStatus;
useSimulationTelemetry;
useSimulationTimeSeconds;
useSimulationFps;
useSimulationUiPreferences;
useStartSimulation;
usePauseSimulation;
useResetSimulation;
useAdvanceSimulationTime;
useSetSimulationTimeSeconds;
useSetFps;
useToggleDebugMode;
useToggleSensorsVisibility;
```

---

# Testing Strategy

## Positive Tests

Verify:

- initial status is `idle`
- initial simulation time is `0`
- initial FPS is `0`
- initial debug mode is disabled
- initial sensors visibility is enabled
- start changes status to `running`
- pause changes running status to `paused`
- paused status can resume to `running`
- reset restores runtime state
- reset preserves UI preferences
- valid simulation time updates are accepted
- valid FPS updates are accepted
- debug mode toggles
- sensor visibility toggles

---

## Negative Tests

Verify:

- pause from idle is ignored
- repeated start is safe
- repeated pause is safe
- repeated reset is safe
- time does not advance while idle
- time does not advance while paused
- invalid delta time is ignored
- invalid FPS is ignored
- reset does not erase UI preferences
- store does not import game loop modules
- store does not use browser-only APIs during creation

---

## Edge Cases

Verify:

- delta time of `0`
- FPS of `0`
- very small positive delta
- large finite delta
- decimal FPS
- reset while running
- reset while paused
- start after reset
- pause after reset
- rapid start/pause/reset calls

---

# Reset Contract

Reset restores runtime state only.

Runtime state includes:

```text
status
simulationTimeSeconds
fps
future collision count
future current decision
future runtime telemetry
```

User preference state includes:

```text
isDebugModeEnabled
areSensorsVisible
future selected scenario
```

User preferences should be preserved unless a separate explicit reset-preferences action is added.

---

# Runtime Integration Rule

The store may be called by future runtime coordination code.

Example:

```ts
loop.start({
  update: ({ deltaTimeSeconds }) => {
    useSimulationStore.getState().advanceSimulationTime(deltaTimeSeconds);
  },
  render: () => {
    // render elsewhere
  },
  onFps: (fps) => {
    useSimulationStore.getState().setFps(fps);
  },
});
```

The store should not create or own the loop.

---

# Anti-Patterns

Avoid adding:

```text
requestAnimationFrame ID
gameLoop instance
CanvasRenderingContext2D
large telemetry history
raw sensor arrays
physics world objects
AI model state
DOM nodes
Date.now
performance.now
localStorage reads during creation
```

These increase coupling and make the store harder to test.

---

# Definition of Done

The simulation store is complete for this phase when:

- state is strongly typed
- actions are strongly typed
- initial state is deterministic
- status transitions are safe
- simulation time updates only while running
- FPS accepts valid sampled values only
- reset restores runtime state
- reset preserves UI preferences
- focused selector hooks exist
- unit tests cover lifecycle, telemetry, reset, and preferences
- linting passes
- build passes

---

# Related WBS Items

- 0.7.1 — Create Simulation Store Module
- 0.7.2 — Add Simulation Status State
- 0.7.3 — Add Simulation Time State
- 0.7.4 — Add FPS State
- 0.7.5 — Add Reset Action
- 0.7.6 — Add Start and Pause Actions

---

# Related Documentation

- `docs/game-loop.md`
- `docs/dashboard-panel.md`
- `docs/controls-panel.md`
- `docs/simulation-canvas.md`

---

# Key Lesson

The simulation store is not the engine.

It should hold lightweight shared state and safe actions.

Keep timing, rendering, physics, AI, and heavy telemetry outside the store so the application remains maintainable as AutoDrive ReactLab grows.
