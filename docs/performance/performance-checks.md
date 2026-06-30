# Performance Checks

## Purpose

Performance checks ensure the simulation remains smooth, stable, and observable as more physics, camera, rendering, and dashboard features are added.

The MVP performance goal is:

```txt
Smooth visual updates
Visible FPS
No runaway loops
No unnecessary React-driven drawing
No obvious memory instability
```

---

# Scope

This document covers **Phase 1.17 — Performance Checks**.

Included tasks:

```txt
1.17.1 Track FPS
1.17.2 Avoid unnecessary React re-renders
1.17.3 Keep canvas drawing outside React render cycle
1.17.4 Test 60 FPS target
1.17.5 Check memory stability
```

This phase does **not** implement advanced profiling dashboards, GPU benchmarking, flamegraph tooling, or browser-specific performance tuning.

---

# 1.17.1 Track FPS

## Goal

FPS should be visible in the dashboard so developers can observe runtime smoothness.

FPS should be calculated from frame delta time:

```ts
fps = 1 / deltaTimeSeconds;
```

Recommended helper:

```txt
src/simulation/engine/performanceMetrics.ts
```

Recommended function:

```ts
export function calculateFps(deltaTimeSeconds: number): number;
```

Invalid or zero delta values should return `0`.

Very small delta values should be capped to avoid unrealistic dashboard spikes.

---

# 1.17.2 Avoid Unnecessary React Re-renders

## Goal

React should not re-render large UI sections unnecessarily every animation frame.

Use narrow Zustand selectors for dashboard fields:

```ts
useSimulationCarSpeed();
useSimulationCarAcceleration();
useSimulationCarSteeringAngle();
useSimulationCarPositionX();
useSimulationCarPositionY();
useSimulationCarHeading();
useRoadDepartureWarning();
```

Avoid this pattern in dashboard containers:

```ts
const car = useSimulationCar();
```

unless the entire `car` object is actually needed.

Reason:

```txt
A full object selector changes whenever any field changes.
A narrow selector changes only when that specific value changes.
```

---

# 1.17.3 Keep Canvas Drawing Outside React Render Cycle

## Goal

Canvas drawing should remain imperative.

React owns:

```txt
canvas element
layout
controls
dashboard
```

Canvas owns:

```txt
pixels
road drawing
car drawing
camera transform
grid drawing
```

Correct pattern:

```tsx
useEffect(() => {
  drawSimulationFrame(...);
}, [context, road, car, camera]);
```

Avoid this pattern:

```tsx
return <Car x={car.positionX} y={car.positionY} />;
```

The car should not be represented as React DOM during canvas rendering.

---

# 1.17.4 Test 60 FPS Target

## Goal

The MVP should be designed around a 60 FPS target.

At 60 FPS:

```txt
deltaTimeSeconds ≈ 1 / 60
fps ≈ 60
```

Recommended test:

```ts
expect(calculateFps(1 / 60)).toBeCloseTo(60, 5);
```

The goal is not to guarantee every machine always runs at exactly 60 FPS.

The goal is to ensure the calculation, loop, and telemetry are correct.

---

# 1.17.5 Check Memory Stability

## Goal

The simulation should not create runaway loops or repeated uncontrolled state writes.

Common causes of memory/performance problems:

```txt
Starting multiple requestAnimationFrame loops
Calling setState inside every render effect incorrectly
Recreating event listeners every frame
Drawing through React components instead of canvas
Never removing keyboard listeners
Never stopping the game loop on pause/unmount
```

Important checks:

```txt
Start while running should not create another loop.
Pause should stop physics updates.
Reset should restore baseline state.
Unmount should remove listeners.
Canvas draw should not call Zustand setState repeatedly.
```

---

# Recommended FPS Helper

```ts
/**
 * Performance metric helpers for AutoDrive ReactLab.
 *
 * Responsibility:
 * - Convert frame delta time into dashboard-readable FPS.
 *
 * Non-responsibilities:
 * - No React.
 * - No Zustand.
 * - No canvas drawing.
 */

export const DEFAULT_MIN_FPS_DELTA_SECONDS = 1 / 240;
export const DEFAULT_MAX_DISPLAY_FPS = 240;

export function isValidFpsDeltaSeconds(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function calculateFps(
  deltaTimeSeconds: number,
  minDeltaSeconds = DEFAULT_MIN_FPS_DELTA_SECONDS,
  maxDisplayFps = DEFAULT_MAX_DISPLAY_FPS,
): number {
  if (!isValidFpsDeltaSeconds(deltaTimeSeconds)) {
    return 0;
  }

  if (!isValidFpsDeltaSeconds(minDeltaSeconds)) {
    throw new RangeError("minDeltaSeconds must be finite and greater than zero.");
  }

  if (!Number.isFinite(maxDisplayFps) || maxDisplayFps <= 0) {
    throw new RangeError("maxDisplayFps must be finite and greater than zero.");
  }

  const safeDelta = Math.max(deltaTimeSeconds, minDeltaSeconds);

  return Math.min(1 / safeDelta, maxDisplayFps);
}
```

---

# Store Integration

Inside `tickSimulation()`:

```ts
telemetry: {
  ...state.telemetry,
  simulationTimeSeconds:
    state.telemetry.simulationTimeSeconds + deltaTimeSeconds,
  fps: calculateFps(deltaTimeSeconds),
},
```

Do not calculate FPS inside the dashboard.

The dashboard should only format and display the value.

---

# Dashboard Display

The dashboard already has an FPS metric card.

Expected display:

```txt
FPS
60
```

Formatting should remain handled by:

```txt
src/utils/formatFps.ts
```

---

# Canvas Rendering Rule

Canvas rendering should follow this separation:

```txt
React render:
  creates canvas element

useEffect:
  gets context
  clears frame
  draws grid
  applies camera
  draws road
  draws car
```

This keeps high-frequency pixel work outside JSX rendering.

---

# Game Loop Rule

Only one active game loop should exist.

Expected lifecycle:

```txt
idle    -> no active physics loop
running -> active loop
paused  -> no physics update
reset   -> baseline state
```

Starting while already running should be a no-op.

---

# Testing Strategy

## Unit Tests

Recommended file:

```txt
src/simulation/engine/performanceMetrics.test.ts
```

Test cases:

```txt
calculate 60 FPS from 1/60 second
return 0 for invalid delta
cap extremely high FPS values
reject invalid configuration
validate delta seconds
```

---

## Store Tests

Test cases:

```txt
FPS updates during running tick
FPS does not update while paused
FPS does not update while idle
simulation time advances during running tick
simulation time does not advance while paused
```

---

## E2E Tests

Recommended file:

```txt
tests/e2e/performance.spec.ts
```

E2E checks:

```txt
FPS label is visible
FPS updates after Start
start/pause/start/reset produces no console errors
simulation remains responsive
```

Avoid over-testing exact FPS values in browser E2E because different browsers and machines vary.

---

# Manual Performance Checklist

Use this checklist while testing in the browser:

```txt
Start simulation.
Hold ArrowUp.
Confirm speed changes smoothly.
Hold ArrowLeft or ArrowRight.
Confirm steering updates smoothly.
Toggle follow camera.
Confirm no visual freezing.
Pause simulation.
Confirm car stops moving.
Resume simulation.
Confirm movement continues.
Reset simulation.
Confirm telemetry resets.
Open browser devtools.
Confirm no repeated console errors.
```

---

# Anti-Patterns to Avoid

## Anti-pattern: React Per-Pixel Rendering

Avoid:

```tsx
<div style={{ transform: `translate(${car.positionX}px)` }} />
```

for simulation objects.

Use canvas drawing instead.

---

## Anti-pattern: Store Writes from Canvas Render Effect

Avoid repeatedly calling Zustand setters inside the canvas render effect:

```tsx
useEffect(() => {
  setCamera(resolveCameraForView(...));
}, [camera, car]);
```

This can cause maximum update depth errors.

Camera updates should happen through the runtime loop or deterministic store actions, not uncontrolled render effects.

---

## Anti-pattern: Multiple Loops

Avoid creating a new game loop every time the component renders.

Use a `ref`:

```tsx
const loopRef = useRef<GameLoopController | null>(null);
```

and stop the loop on cleanup.

---

# Acceptance Criteria

This phase is complete when:

```txt
FPS is tracked and displayed.
Canvas drawing remains outside React JSX rendering.
Simulation does not create duplicate active loops.
Pause stops physics updates.
Reset returns to baseline state.
E2E performance smoke test passes.
No repeated console errors occur during start/pause/reset.
```

---

# Traceability KPI

```txt
Simulation remains smooth, observable, and stable during MVP runtime.
```

Success means:

```txt
Performance state is visible, React re-renders are controlled, and canvas drawing remains isolated from JSX rendering.
```

---

# Engineering Lessons Learned

## Measure Before Optimizing

FPS telemetry gives a simple runtime signal.

It does not replace profiling, but it helps catch obvious regressions.

---

## Canvas Is the Right Tool for Per-Frame Drawing

React is excellent for stateful UI.

Canvas is better for high-frequency pixel drawing.

Use each tool for the right job.

---

## Stability Is Performance

Avoiding runaway loops, unnecessary listeners, and repeated state writes is as important as optimizing draw calls.

---

# Future Evolution

Future performance improvements may include:

```txt
FPS moving average
frame time graph
debug overlay
performance budget warnings
render-layer caching
dirty-region rendering
offscreen canvas
Web Worker physics
profiling mode
memory snapshot checks
```

The stable MVP rule remains:

```txt
The game loop updates runtime state; canvas draws pixels; React displays UI.
```
