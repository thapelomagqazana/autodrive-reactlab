# Game Loop

## Overview

The game loop is the central browser animation lifecycle module for **AutoDrive ReactLab**.

It controls how continuous simulation updates and rendering cycles are scheduled over time.

The game loop is infrastructure. It owns timing and lifecycle only. It does not own vehicle physics, AI decisions, rendering details, canvas drawing, Zustand state, or React components.

---

# Purpose

The game loop exists to answer one question:

> When should the simulation update and render the next frame?

It provides a reusable timing foundation for:

* car movement
* sensor updates
* AI decision timing
* canvas rendering
* dashboard telemetry
* FPS tracking
* replay and performance diagnostics

---

# Responsibilities

The game loop owns:

* `requestAnimationFrame` scheduling
* `cancelAnimationFrame` cleanup
* start lifecycle
* stop lifecycle
* running state
* delta-time calculation
* delta-time capping
* FPS sampling
* duplicate-loop prevention

---

# Non-Responsibilities

The game loop must not contain:

* React component logic
* Zustand store mutation
* canvas drawing details
* road rendering
* vehicle physics
* AI decisions
* collision detection
* sensor raycasting
* scenario loading
* telemetry persistence
* dashboard rendering

Those responsibilities belong to dedicated modules.

---

# Public API

```ts
const loop = createGameLoop();

loop.start({
  update: ({ deltaTimeSeconds, timestampMs }) => {
    // future simulation update work
  },
  render: ({ deltaTimeSeconds, timestampMs }) => {
    // future rendering work
  },
  onFps: (fps) => {
    // future dashboard telemetry update
  },
});

loop.stop();

loop.isRunning();
```

---

# Core Concepts

## Start

`start` begins the animation loop.

Expected behavior:

* sets running state
* resets timing state
* schedules the first animation frame
* prevents duplicate loops if called more than once

---

## Stop / Pause

`stop` pauses the animation loop.

Expected behavior:

* cancels the pending animation frame
* marks loop as not running
* clears stored animation frame ID
* resets timing state
* does not reset simulation state

Important distinction:

```text
Start = run or resume loop
Stop/Pause = halt frame updates
Reset = restore simulation state elsewhere
```

---

## Tick

A tick is one animation-frame execution.

Each tick should:

1. calculate delta time
2. call `update`
3. call `render`
4. update FPS counters
5. schedule the next frame if still running

---

# Delta Time

Delta time is the elapsed time between frames.

It is measured in seconds.

```text
deltaTimeSeconds = (currentTimestampMs - previousTimestampMs) / 1000
```

The first frame should use:

```text
deltaTimeSeconds = 0
```

This prevents invalid or giant first-frame movement.

---

# Delta-Time Capping

Large delta-time jumps can happen when:

* the browser tab sleeps
* the computer lags
* the app is paused
* the user switches tabs
* the browser throttles timers

To avoid huge simulation jumps, delta time should be capped.

Recommended default:

```text
maxDeltaTimeSeconds = 0.1
```

This means a single frame should not advance the simulation by more than 100ms.

---

# FPS Calculation

FPS should be sampled over a controlled interval.

Recommended default:

```text
fpsSampleIntervalMs = 1000
```

FPS should not update React state every frame.

Good:

```text
FPS updates every 500ms or 1000ms
```

Bad:

```text
FPS updates every animation frame
```

Updating UI every frame can cause unnecessary React rendering and noisy telemetry.

---

# Lifecycle Order

A future runtime may use this order:

```text
start
  ↓
requestAnimationFrame
  ↓
tick
  ↓
update(deltaTimeSeconds)
  ↓
render(deltaTimeSeconds)
  ↓
FPS sampling
  ↓
requestAnimationFrame
  ↓
...
stop
```

---

# Future Render Lifecycle

The render callback may later call:

```text
beginFrame
drawGrid
drawRoad
drawVehicle
drawSensors
drawDebugOverlays
endFrame
```

The game loop should not know those details.

It only calls `render`.

---

# Testing Strategy

## Positive Tests

Verify:

* loop starts
* frame is scheduled
* update callback executes
* render callback executes
* delta time is passed in seconds
* FPS callback fires after sampling interval
* stop cancels pending frame

---

## Negative Tests

Verify:

* starting twice does not create duplicate loops
* stopping before start does not throw
* stopping twice does not throw
* loop does not continue after stop
* module does not import React, Zustand, physics, AI, or rendering modules

---

## Edge Cases

Verify:

* first frame delta is safe
* large delta time is capped
* rapid start/stop cycles do not leak frames
* frame callback firing after stop does not continue loop
* pause/resume does not create giant delta jump

---

# Anti-Patterns

Avoid adding:

```text
React hooks
Zustand mutations
canvas drawing
vehicle movement
collision checks
AI decisions
sensor calculations
scenario loading
DOM reads
direct DashboardPanel updates every frame
```

These responsibilities do not belong in the game loop module.

---

# Performance Notes

A good game loop should:

* do minimal work itself
* call update/render callbacks
* avoid unnecessary allocations
* avoid duplicate loops
* avoid per-frame UI state updates
* cancel frames on stop

The game loop is a coordinator, not the whole simulation engine.

---

# Definition of Done

The game loop is complete for this phase when:

* `gameLoop.ts` exists
* loop can start
* loop can stop
* duplicate starts are prevented
* stop is idempotent
* delta time is calculated in seconds
* large delta time is capped
* FPS is sampled at a controlled interval
* pending animation frames are cancelled
* unit tests verify lifecycle behavior
* linting passes
* build passes

---

# Related WBS Items

* 0.6.1 — Create Game Loop Module
* 0.6.2 — Implement RequestAnimationFrame Loop
* 0.6.3 — Track Delta Time
* 0.6.4 — Add Start Loop Function
* 0.6.5 — Add Stop/Pause Loop Function
* 0.6.6 — Add FPS Calculation

---

# Related Documentation

* `docs/simulation-canvas.md`
* `docs/canvas-sizing.md`
* `docs/canvas-grid.md`
* `docs/frame-renderer.md`
* `docs/state-management.md`

---

# Key Lesson

The game loop controls time.

It should not control the simulation domain.

Keeping the game loop small and independent makes future movement, rendering, AI, telemetry, and replay systems easier to build and test.
