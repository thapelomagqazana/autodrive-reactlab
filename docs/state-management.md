# State Management Guide

AutoDrive ReactLab uses Zustand for lightweight global state.

## Store responsibility

The Zustand store owns UI-visible simulation state:

- simulation lifecycle status
- lightweight telemetry
- UI preferences
- control actions

## What belongs in Zustand

Good candidates:

- `status`
- `elapsedTimeSeconds`
- `fps`
- `isDebugModeEnabled`
- `areSensorsVisible`
- `selectedScenarioId`

## What does not belong in Zustand

Avoid storing:

- canvas rendering context
- animation frame IDs
- large replay buffers
- heavy physics objects
- raw per-frame sensor arrays
- mutable engine internals

These should remain inside the simulation engine or specialized modules.

## Selector rule

Components should use selector hooks instead of subscribing to the entire store.

Good:

```ts
const status = useSimulationStatus();
```

The second example subscribes the component to all store changes and may cause
unnecessary re-renders as the simulator grows.

## Reset rule

`resetSimulation` resets runtime telemetry but preserves UI preferences.

This means:
- status returns to `idle`
- elapsed time returns to `0`
- FPS returns to `0`
- debug mode remains as the user selected it
- sensor visibility remains as the user selected it