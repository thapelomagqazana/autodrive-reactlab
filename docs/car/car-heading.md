# Vehicle Heading Angle

## Purpose

`angle` represents the direction the simulated vehicle is facing.

It is the canonical heading value for the car and must be shared by:

- Rendering
- Physics
- Movement
- Sensors
- Telemetry
- Future AI decision logic

The goal is to ensure that every system agrees on the same vehicle direction.

---

# File Location

```txt
src/simulation/vehicle/carState.ts
```

---

# Domain Model

```ts
angle: number;
```

Example:

```ts
export interface CarState {
  positionX: number;
  positionY: number;

  speed: number;
  acceleration: number;

  angle: number;

  steeringAngle: number;
}
```

---

# Unit of Measurement

`angle` is measured in:

```txt
radians
```

JavaScript trigonometry uses radians, so the simulation stores radians internally.

Examples:

```ts
Math.sin(angle);
Math.cos(angle);
```

---

# Heading Convention

AutoDrive ReactLab uses the following heading convention:

```txt
0 radians = facing upward / north on the canvas
Positive rotation = clockwise
```

This is designed for HTML Canvas, where:

```txt
Origin = top-left
Positive X = right
Positive Y = down
```

---

# Direction Examples

| Direction    |             Radians | Degrees |
| ------------ | ------------------: | ------: |
| Up / North   |                 `0` |    `0°` |
| Right / East |       `Math.PI / 2` |   `90°` |
| Down / South |           `Math.PI` |  `180°` |
| Left / West  | `(3 * Math.PI) / 2` |  `270°` |

---

# Default Value

The vehicle starts facing forward along the MVP road.

```ts
angle: 0;
```

Meaning:

```txt
The car faces upward / north on the canvas.
```

---

# Heading Vector

A heading angle can be converted into a canvas-space direction vector.

```ts
x = Math.sin(angle);
y = -Math.cos(angle);
```

Why?

Because in canvas coordinates:

```txt
Positive Y points down
```

So facing upward means:

```txt
x = 0
y = -1
```

Examples:

```txt
angle = 0
vector = { x: 0, y: -1 }

angle = Math.PI / 2
vector = { x: 1, y: 0 }

angle = Math.PI
vector = { x: 0, y: 1 }

angle = 3 * Math.PI / 2
vector = { x: -1, y: 0 }
```

---

# Relationship to Position

`angle` does not store where the car is.

Position is stored separately:

```ts
positionX: number;
positionY: number;
```

The heading angle only describes direction.

Movement uses:

```txt
position + speed + angle + deltaTime
```

---

# Relationship to Speed

`angle` does not store how fast the car is moving.

Speed is stored separately:

```ts
speed: number;
```

The vehicle may have:

```txt
speed = 0
angle = Math.PI / 2
```

Meaning:

```txt
The car is facing right but not moving.
```

---

# Relationship to Steering Angle

`angle` and `steeringAngle` are different.

| Field           | Meaning                       |
| --------------- | ----------------------------- |
| `angle`         | Where the vehicle is facing   |
| `steeringAngle` | How far the wheels are turned |

Example:

```txt
angle = 0
steeringAngle = Math.PI / 12
```

Meaning:

```txt
The car is currently facing upward, but the wheels are turned right.
```

Future physics uses `steeringAngle` to change `angle`.

---

# Internal vs Display Units

Internal simulation state must use radians.

Human-facing UI may display degrees.

Correct:

```txt
Store angle in radians.
Display angle in degrees.
```

Incorrect:

```txt
Store some angles in radians and others in degrees.
```

Recommended helpers:

```ts
export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
```

---

# Normalization

Angles may grow beyond one full rotation during long simulations.

Example:

```txt
angle = Math.PI * 6
```

This is mathematically valid.

For display, telemetry, and debugging, normalize angles into:

```txt
0 <= angle < 2π
```

Recommended helper:

```ts
export function normalizeHeadingAngle(angle: number): number {
  const twoPi = Math.PI * 2;

  return ((angle % twoPi) + twoPi) % twoPi;
}
```

---

# Validation Rules

Heading angles must be finite numbers.

Allowed:

```txt
0
Math.PI / 2
Math.PI
-Math.PI
Math.PI * 10
```

Rejected:

```txt
NaN
Infinity
-Infinity
```

Validation example:

```ts
Number.isFinite(angle);
```

---

# Rendering Contract

The car renderer should rotate the canvas using `car.angle`.

Example:

```ts
context.save();

context.translate(car.positionX, car.positionY);
context.rotate(car.angle);

// draw car body around local center

context.restore();
```

Rendering must not:

```txt
Own separate heading state.
Convert angle to degrees for canvas rotation.
Mutate car.angle.
```

---

# Physics Contract

Physics updates `angle`.

Rendering displays `angle`.

Controls and AI express intent.

Recommended flow:

```txt
Controls / AI
      ↓
steeringAngle
      ↓
physics
      ↓
angle
      ↓
rendering
```

---

# Telemetry Contract

Dashboard may display heading as degrees.

Example:

```txt
Heading: 90°
```

But dashboard must derive the value from:

```ts
car.angle;
```

Telemetry must not store a second heading value.

---

# Testing Expectations

Unit tests should verify:

```txt
Default angle is 0.
Angle unit is radians.
0 radians points upward.
π / 2 radians points right.
π radians points downward.
3π / 2 radians points left.
Positive rotation is clockwise.
Invalid angles are rejected.
Radians convert to degrees correctly.
Degrees convert to radians correctly.
Normalization handles large positive angles.
Normalization handles negative angles.
```

---

# Acceptance Criteria

This task is complete when:

```txt
angle exists on CarState.
angle is strongly typed as number.
Unit is documented as radians.
Initial angle is defined.
0 radians means facing upward / north.
Positive rotation is clockwise.
Rendering and movement can use the same angle.
Tests verify default angle and direction convention.
No degrees/radians ambiguity remains.
```

---

# Traceability KPI

```txt
100% of heading logic uses radians consistently.
```

Success means:

```txt
No renderer-owned heading.
No dashboard-owned heading.
No control-owned heading.
No degree-based runtime heading.
```

---

# Engineering Lessons Learned

## Heading Is a Domain Concept

Heading is not just a rendering value.

It affects:

```txt
Movement direction
Sensor ray direction
Collision box rotation
AI path following
Camera alignment
Dashboard telemetry
```

That means it belongs in `CarState`, not inside the renderer.

---

## Radians Internally, Degrees at the Edge

JavaScript math APIs expect radians.

Therefore, radians should be the internal simulation language.

Degrees are useful for:

```txt
Humans
Dashboards
Debug panels
Documentation
```

But they should not become runtime state.

---

## Heading Is Not Steering

This distinction is critical.

```txt
angle = where the car is facing
steeringAngle = how the wheels are turned
```

If these are confused, the car may rotate instantly instead of turning naturally.

A professional simulator keeps them separate.
