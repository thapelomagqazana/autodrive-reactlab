# Car Speed Field

## Purpose

`speed` represents the current movement speed of the simulated vehicle.

It is the single authoritative source of truth for how fast the vehicle is moving during simulation runtime.

Every movement calculation must ultimately derive from this field.

The purpose of this design is to ensure:

- One source of truth for movement
- Consistent physics calculations
- Predictable telemetry
- Reliable dashboard metrics
- Future AI compatibility
- Reduced technical debt

---

# File Location

```txt
src/simulation/vehicle/carState.ts
```

---

# Domain Model

```ts
speed: number;
```

The speed field exists on `CarState`.

Example:

```ts
export interface CarState {
  positionX: number;
  positionY: number;

  speed: number;

  acceleration: number;

  angle: number;
  steeringAngle: number;

  maxSpeed: number;
  maxReverseSpeed: number;
}
```

---

# Unit of Measurement

Speed is measured in:

```txt
pixels per second
```

Abbreviation:

```txt
px/s
```

Example:

```txt
speed = 100
```

means:

```txt
The vehicle moves 100 pixels every second.
```

---

# Direction Convention

The sign of the speed determines movement direction.

```txt
Positive speed = forward movement
Negative speed = reverse movement
Zero speed = stationary
```

Examples:

```txt
speed = 120
```

Forward movement.

```txt
speed = -40
```

Reverse movement.

```txt
speed = 0
```

Vehicle is stationary.

---

# Why Use Signed Speed?

Alternative approaches:

```txt
speed + direction
velocity objects
multiple movement flags
```

For the MVP, signed speed is simpler.

Advantages:

```txt
Less state
Less complexity
Simpler physics
Simpler telemetry
Easier testing
```

Physics can determine direction directly from the sign.

---

# Default Value

The vehicle must start stationary.

Default:

```ts
speed: 0;
```

Reason:

```txt
Predictable startup
Safe reset behaviour
Deterministic tests
No accidental movement
```

---

# Movement Limits

Speed must always remain within configured bounds.

Fields:

```ts
maxSpeed: number;
maxReverseSpeed: number;
```

Constraint:

```txt
-maxReverseSpeed <= speed <= maxSpeed
```

Example:

```txt
maxSpeed = 260
maxReverseSpeed = 80
```

Valid:

```txt
260
120
0
-40
-80
```

Invalid:

```txt
261
-81
```

---

# Validation Rules

Speed must always be a finite number.

Allowed:

```txt
0
10
-10
120
-40
260
-80
```

Rejected:

```txt
NaN
Infinity
-Infinity
```

Validation example:

```ts
Number.isFinite(speed);
```

---

# Runtime Ownership

Speed belongs to the vehicle domain model.

```txt
CarState owns speed.
```

Consumers:

```txt
Physics engine
Dashboard
Telemetry
Renderer
Future AI
Future scoring system
```

The following must NOT own speed:

```txt
React components
Canvas renderer
Dashboard widgets
Control hooks
Tests
```

Always use:

```ts
car.speed;
```

---

# Relationship to Position

Speed does NOT define location.

Position defines location.

```txt
speed -> movement rate
position -> current location
```

Example:

```ts
positionX = 400;
positionY = 600;

speed = 120;
```

The car remains at:

```txt
(400,600)
```

until physics updates the position.

---

# Relationship to Acceleration

Speed and acceleration are different concepts.

Speed:

```txt
How fast the vehicle is moving.
```

Acceleration:

```txt
How quickly speed changes.
```

Example:

```txt
speed = 100 px/s
acceleration = 120 px/s²
```

Acceleration influences future speed.

It does not represent current speed.

---

# Physics Contract

Future physics systems must use speed as the movement source.

Example:

```ts
nextPositionX = positionX + velocityX * deltaTime;

nextPositionY = positionY + velocityY * deltaTime;
```

The velocity components will be derived from:

```txt
speed
angle
```

This ensures:

```txt
Single movement source
Deterministic simulation
Consistent behaviour
```

---

# Telemetry Contract

Dashboard speed displays must read directly from:

```ts
car.speed;
```

Example:

```txt
Vehicle Speed
120 px/s
```

Telemetry must not maintain its own speed state.

Correct:

```txt
CarState.speed -> Dashboard
```

Incorrect:

```txt
CarState.speed
DashboardSpeed
RendererSpeed
PhysicsSpeed
```

Multiple speed values create drift and bugs.

---

# Reset Contract

Simulation reset must restore speed through:

```ts
createInitialCarState();
```

Do not do:

```ts
car.speed = 0;
```

Instead:

```ts
const car = createInitialCarState();
```

This keeps reset behaviour centralized.

---

# Helper Functions

Recommended validation helper:

```ts
export function isValidCarSpeedValue(value: number): boolean {
  return Number.isFinite(value);
}
```

Recommended clamping helper:

```ts
export function clampCarSpeed(
  speed: number,
  maxSpeed: number,
  maxReverseSpeed: number,
): number {
  return Math.min(Math.max(speed, -maxReverseSpeed), maxSpeed);
}
```

---

# Testing Expectations

## Positive Tests

Verify:

```txt
Initial speed is 0.
Forward speeds are allowed.
Reverse speeds are allowed.
Boundary values are allowed.
```

Examples:

```txt
0
120
-40
260
-80
```

---

## Negative Tests

Verify:

```txt
NaN rejected
Infinity rejected
-Infinity rejected
Invalid limits rejected
```

Examples:

```txt
NaN
Infinity
-Infinity
```

---

## Edge Cases

Verify:

```txt
0 speed
0 speed limit
Exact maxSpeed
Exact maxReverseSpeed
```

Examples:

```txt
speed = 0
speed = 260
speed = -80
```

---

## Corner Cases

Verify:

```txt
Very large speed
Very large reverse speed
Speed beyond limits
```

Examples:

```txt
99999
-99999
```

Expected result:

```txt
Proper clamping
No crashes
No NaN propagation
```

---

# Acceptance Criteria

This task is complete when:

```txt
speed exists on CarState.
speed is strongly typed as number.
Unit is documented as pixels per second.
Initial speed equals 0.
Forward movement uses positive values.
Reverse movement uses negative values.
Movement limits are enforced.
Non-finite values are rejected.
Tests verify startup, validation, and clamping behaviour.
```

---

# Traceability KPI

```txt
100% of vehicle movement calculations use CarState.speed as the single runtime speed value.
```

Success means:

```txt
No duplicate speed fields exist.
No renderer-owned speed exists.
No dashboard-owned speed exists.
No control-owned speed exists.
```

---

# Engineering Lessons Learned

## Speed Is a Domain Fact

Many projects accidentally create:

```txt
Physics Speed
Dashboard Speed
Renderer Speed
Control Speed
```

This creates synchronization bugs.

Instead:

```txt
CarState.speed
```

must be the only runtime speed source.

---

## Signed Speed Simplifies Design

Instead of:

```txt
speed + direction
```

use:

```txt
positive = forward
negative = reverse
```

Benefits:

```txt
Less state
Less logic
Less testing
Less technical debt
```

---

## Speed Is the Bridge Between Intent and Movement

Controls and future AI should not move the car directly.

Correct flow:

```txt
Controls / AI
      ↓
Acceleration
      ↓
Speed
      ↓
Physics
      ↓
Position
      ↓
Rendering
```

This separation creates a clean architecture that scales naturally into future phases such as steering physics, obstacle avoidance, lane following, traffic systems, and autonomous driving AI.
