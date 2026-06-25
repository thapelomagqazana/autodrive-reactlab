# Car Position Fields

## Purpose

`positionX` and `positionY` define the runtime location of the simulated vehicle inside the AutoDrive ReactLab world.

These fields are the canonical source of truth for vehicle location and must be used consistently by:

- Rendering
- Physics
- Collision Detection
- Sensors
- Camera Systems
- Telemetry
- Future AI Systems

Without a clear position contract, different subsystems may interpret vehicle location differently, leading to rendering bugs, incorrect collision detection, unstable physics, and technical debt.

---

# File Location

```txt
src/simulation/vehicle/carState.ts
```

---

# Domain Model

```ts
export interface CarPosition {
  positionX: number;
  positionY: number;
}
```

The full vehicle state extends this position model:

```ts
export interface CarState extends CarPosition {
  ...
}
```

---

# Coordinate System

AutoDrive ReactLab uses a standard HTML Canvas coordinate system.

```txt
Origin = top-left corner
Positive X = right
Positive Y = down
Unit = pixels
```

Visual representation:

```txt
(0,0)
 ┌────────────────────────────► X
 │
 │
 │
 │
 ▼
 Y
```

Example:

```txt
positionX = 400
positionY = 600
```

means:

```txt
400 pixels from the left edge
600 pixels from the top edge
```

---

# Position Ownership

The position fields belong to the vehicle domain model.

```txt
CarState owns position.
```

The following systems must consume position data:

```txt
Canvas renderer
Physics engine
Road boundary checks
Collision system
Camera system
Telemetry dashboard
Future sensor system
Future AI navigation system
```

The following systems must NOT create duplicate position state:

```txt
React components
Canvas renderers
Dashboard widgets
Control hooks
Tests
```

Always use:

```ts
car.positionX;
car.positionY;
```

---

# Position Semantics

## Center-Based Position

The vehicle position represents the CENTER of the car.

```txt
positionX = center X
positionY = center Y
```

This decision simplifies:

```txt
Rotation
Steering
Sensor ray casting
Collision calculations
Camera tracking
```

Example:

```txt
Car Width  = 36
Car Height = 64

Position:
X = 400
Y = 600
```

Calculated bounds:

```txt
Left   = 382
Right  = 418

Top    = 568
Bottom = 632
```

Formula:

```txt
left   = positionX - width / 2
right  = positionX + width / 2

top    = positionY - height / 2
bottom = positionY + height / 2
```

---

# Units

Position values are measured in:

```txt
Pixels
```

Examples:

```txt
0
100
250
400
1024
```

Fractional values are allowed:

```txt
400.25
600.5
```

This enables smooth movement and sub-pixel interpolation.

---

# Default Position

Phase 1 MVP default:

```ts
export const DEFAULT_CAR_POSITION = {
  positionX: 400,
  positionY: 600,
};
```

These values provide:

```txt
Visible starting position
Stable MVP demonstrations
Predictable testing
Consistent resets
```

---

# Validation Rules

Position values must be finite numbers.

Allowed:

```txt
0
100
-100
400
400.5
1000
```

Rejected:

```txt
NaN
Infinity
-Infinity
```

Example:

```ts
Number.isFinite(positionX);
Number.isFinite(positionY);
```

---

# Why Negative Coordinates Are Allowed

Negative coordinates are intentionally allowed.

Reason:

Future phases may introduce:

```txt
Camera systems
Infinite roads
World-space coordinates
Scenario loading
Pathfinding worlds
```

Example:

```txt
positionX = -200
positionY = 1500
```

This may be completely valid in world-space.

Therefore:

```txt
Negative coordinates are NOT invalid.
Non-finite coordinates ARE invalid.
```

---

# Rendering Contract

The renderer consumes position values directly.

Example:

```ts
context.translate(car.positionX, car.positionY);
```

Rendering code must not:

```txt
Store its own vehicle position
Create duplicate coordinates
Mutate position during rendering
```

Rendering is a consumer of position data.

---

# Physics Contract

Physics updates position.

Example:

```ts
nextPositionX = positionX + velocityX * deltaTime;

nextPositionY = positionY + velocityY * deltaTime;
```

Physics owns movement.

Rendering only displays the result.

---

# Camera Contract

Future camera systems follow the vehicle using:

```ts
car.positionX;
car.positionY;
```

The camera must never become the source of truth for vehicle location.

Correct:

```txt
Car -> Camera
```

Incorrect:

```txt
Camera -> Car
```

---

# Telemetry Contract

Dashboard telemetry derives position from:

```ts
car.positionX;
car.positionY;
```

Example display:

```txt
X: 400
Y: 600
```

Telemetry must not maintain its own coordinate state.

---

# Reset Contract

Simulation reset must restore position through:

```ts
createInitialCarState();
```

Never do:

```ts
car.positionX = 400;
car.positionY = 600;
```

Instead:

```ts
const car = createInitialCarState();
```

This prevents duplicated defaults.

---

# Testing Expectations

Unit tests must verify:

```txt
Initial X position
Initial Y position
Position values are finite
Fresh object creation
Position validation
Default position consistency
```

Edge cases:

```txt
0 coordinate
Negative coordinate
Large coordinate
Fractional coordinate
```

Negative tests:

```txt
NaN
Infinity
-Infinity
```

---

# Acceptance Criteria

This task is complete when:

```txt
positionX exists on CarState.
positionY exists on CarState.
Both fields are strongly typed numbers.
Position values represent the vehicle center.
Units are documented as pixels.
Initial values are defined in createInitialCarState().
Position values can be consumed directly by renderers.
Validation rejects non-finite values.
Tests verify initial values and edge cases.
```

---

# Engineering Lessons Learned

## Position Is a Domain Concept

Many projects treat position as a rendering concern.

That creates problems:

```txt
Renderer owns position.
Physics owns position.
Camera owns position.
```

Now there are three competing sources of truth.

Instead:

```txt
CarState owns position.
```

Everything else reads from it.

---

## Center-Based Coordinates Win Long-Term

Using top-left coordinates seems simple initially.

However, as soon as the car rotates:

```txt
Collision detection becomes harder.
Steering becomes harder.
Sensor math becomes harder.
```

Using center coordinates makes:

```txt
Rotation trivial.
Sensor origins obvious.
Collision boxes symmetrical.
```

---

## Position Is the Foundation of Everything

Every future system depends on position:

```txt
Physics
Rendering
Collision Detection
Sensors
Pathfinding
Camera
Telemetry
AI
```

A clean position model now prevents large-scale architectural debt later.
