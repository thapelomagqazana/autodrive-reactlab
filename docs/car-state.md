# CarState Domain Model

`CarState` is the canonical runtime model for the AutoDrive ReactLab vehicle.

## Purpose

The purpose of `CarState` is to give rendering, physics, controls, telemetry, tests, and future AI logic one shared source of truth for the simulated vehicle.

Without this model, different parts of the simulator may invent their own vehicle fields, causing duplicated state, inconsistent movement rules, fragile reset behaviour, and technical debt.

## File Location

```txt
src/simulation/vehicle/carState.ts
```

## Public API

```ts
export type CarDecision =
  | "idle"
  | "accelerating"
  | "braking"
  | "reversing"
  | "turning-left"
  | "turning-right";

export interface CarState {
  positionX: number;
  positionY: number;
  speed: number;
  acceleration: number;
  angle: number;
  steeringAngle: number;
  maxSpeed: number;
  maxReverseSpeed: number;
  width: number;
  height: number;
  distanceTravelled: number;
  collisionCount: number;
  decision: CarDecision;
}

export function createInitialCarState(): CarState;
```

## Coordinate System

AutoDrive ReactLab uses canvas-space coordinates.

| Field       | Meaning                                                |
| ----------- | ------------------------------------------------------ |
| `positionX` | Horizontal center position of the car in canvas pixels |
| `positionY` | Vertical center position of the car in canvas pixels   |

Coordinate rules:

```txt
Origin = top-left of the canvas
Positive X = right
Positive Y = down
```

## Movement Fields

| Field             |           Unit | Meaning                                   |
| ----------------- | -------------: | ----------------------------------------- |
| `speed`           |  pixels/second | Current forward or reverse movement speed |
| `acceleration`    | pixels/second² | Speed-change capability                   |
| `maxSpeed`        |  pixels/second | Maximum forward speed                     |
| `maxReverseSpeed` |  pixels/second | Maximum reverse speed magnitude           |

Speed rules:

```txt
Positive speed = forward
Negative speed = reverse
Zero speed = stationary
```

Movement limit rule:

```txt
-maxReverseSpeed <= speed <= maxSpeed
```

## Heading and Steering

| Field           |    Unit | Meaning                          |
| --------------- | ------: | -------------------------------- |
| `angle`         | radians | Current vehicle heading          |
| `steeringAngle` | radians | Current wheel/steering direction |

Angle rules:

```txt
0 radians = facing upward / north on the canvas
Positive rotation = clockwise
```

Steering rules:

```txt
0 steeringAngle = wheels straight
Negative steeringAngle = turning left
Positive steeringAngle = turning right
```

`angle` and `steeringAngle` are intentionally separate.

`angle` describes where the car is facing.

`steeringAngle` describes the current steering input that future physics will use to change the car heading.

## Rendering Dimensions

| Field    |   Unit | Meaning                         |
| -------- | -----: | ------------------------------- |
| `width`  | pixels | Car render and collision width  |
| `height` | pixels | Car render and collision height |

The car position represents the center point of the vehicle.

Renderers should derive the rectangle from:

```txt
left = positionX - width / 2
right = positionX + width / 2
top = positionY - height / 2
bottom = positionY + height / 2
```

## Telemetry Fields

| Field               | Meaning                                   |
| ------------------- | ----------------------------------------- |
| `distanceTravelled` | Total distance travelled in pixels        |
| `collisionCount`    | Number of detected collisions             |
| `decision`          | Current high-level vehicle decision state |

These fields exist early so dashboard and future AI work can build on a stable contract.

## Initial State Factory

Use `createInitialCarState()` whenever a fresh runtime car state is needed.

Examples:

```txt
Store initialization
Simulation reset
Unit tests
Story/demo setup
```

Do not duplicate default car values inside React components, Zustand stores, renderers, or tests.

## Design Rules

```txt
CarState must not import React.
CarState must not import Zustand.
CarState must not import canvas APIs.
CarState must not run physics.
CarState must not perform rendering.
CarState must remain a pure domain model.
```

## Acceptance Criteria

This model is complete when:

```txt
CarState is exported from the vehicle module.
All required fields are strongly typed.
No field uses any.
Initial state can be created using createInitialCarState().
The model is reusable by rendering, physics, controls, dashboard, and tests.
```

## Testing Expectations

Test coverage should verify:

```txt
Initial car state contains all required fields.
Initial speed is 0.
Initial steering angle is 0.
Initial heading angle is 0.
Movement limits are positive.
Rendering dimensions are positive.
Telemetry fields start clean.
createInitialCarState() returns a fresh object every time.
Runtime mutation does not alter default values.
```

## Key Engineering Lesson

State models are architecture.

A weak vehicle model causes every later layer to become messy: physics invents movement fields, rendering invents dimensions, dashboard invents telemetry, and reset logic becomes fragile.

A strong `CarState` gives the simulator a stable foundation for movement, sensors, AI decisions, telemetry, testing, and future scenario systems.
