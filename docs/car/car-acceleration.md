# Car Acceleration Capability

## Purpose

`acceleration` represents the vehicle's speed-change capability.

It defines how quickly the vehicle can increase its speed when acceleration input is active.

Acceleration is a fundamental physics property that influences movement but does not directly move the vehicle.

This distinction is critical for maintaining a clean simulation architecture.

---

# File Location

```txt
src/simulation/vehicle/carState.ts
```

---

# Domain Model

```ts
acceleration: number;
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

Acceleration is measured in:

```txt
pixels per second squared
```

Abbreviation:

```txt
px/s²
```

Meaning:

```txt
How many pixels/second of speed
can be gained every second.
```

Example:

```txt
acceleration = 120 px/s²
```

means:

```txt
After 1 second:
speed increases by 120 px/s

After 2 seconds:
speed increases by 240 px/s

Assuming continuous acceleration
and no speed limits.
```

---

# Physics Relationship

Acceleration changes speed.

Speed changes position.

The relationship is:

Within AutoDrive:

```txt
Acceleration
      ↓
Speed
      ↓
Position
      ↓
Rendering
```

Acceleration never updates position directly.

---

# What Acceleration Is

Acceleration describes capability.

Example:

```txt
Sports car:
High acceleration

Truck:
Lower acceleration
```

Acceleration answers:

```txt
How quickly can the vehicle gain speed?
```

---

# What Acceleration Is NOT

Acceleration is NOT:

```txt
Current speed
Current position
Current heading
Current steering angle
```

Incorrect:

```txt
acceleration = movement
```

Correct:

```txt
acceleration influences speed
speed influences movement
```

---

# Default Value

Recommended MVP default:

```ts
acceleration: 120;
```

Meaning:

```txt
Vehicle gains
120 px/s
of speed
every second
while accelerating.
```

Reasoning:

```txt
Simple
Predictable
Easy to test
Easy to tune
```

---

# Validation Rules

Acceleration must be:

```txt
Finite
Non-negative
```

Allowed:

```txt
0
0.5
1
120
250
500
```

Rejected:

```txt
-1
NaN
Infinity
-Infinity
```

Example validation:

```ts
Number.isFinite(acceleration) && acceleration >= 0;
```

---

# Why Zero Is Allowed

Zero acceleration is valid.

Examples:

```txt
Parked vehicles
Disabled vehicles
Broken vehicles
Traffic scenarios
Testing
Scenario editor constraints
```

Therefore:

```txt
0 is valid
Negative values are not
```

---

# Relationship to Speed

Speed and acceleration are different concepts.

Example:

```txt
speed = 80 px/s

acceleration = 120 px/s²
```

Interpretation:

```txt
Vehicle is currently moving
at 80 px/s

Vehicle can gain
120 px/s
of additional speed
every second.
```

---

# Relationship to Braking

Future braking systems should NOT mutate acceleration.

Recommended future model:

```ts
acceleration: number;
brakeForce: number;
```

Reason:

```txt
Acceleration = speed increase capability

Brake force = speed reduction capability
```

Keeping them separate reduces technical debt.

---

# Relationship to AI

Future AI systems will consume acceleration.

Examples:

```txt
Accelerate
Cruise
Follow vehicle
Overtake
Merge
Recover from obstacle
```

AI should express intent.

Physics should apply acceleration.

Correct flow:

```txt
AI
 ↓
Desired acceleration
 ↓
Physics
 ↓
Speed
 ↓
Position
```

---

# Relationship to Controls

Keyboard input does not directly move the vehicle.

Incorrect:

```txt
ArrowUp
   ↓
Position changes
```

Correct:

```txt
ArrowUp
   ↓
Acceleration requested
   ↓
Speed updated
   ↓
Position updated
```

This architecture scales naturally into autonomous driving.

---

# Runtime Ownership

Acceleration belongs to:

```txt
CarState
```

Consumers:

```txt
Physics
Controls
AI
Telemetry
Dashboard
```

The following must NOT own acceleration:

```txt
React components
Canvas renderers
Control buttons
Tests
```

Always use:

```ts
car.acceleration;
```

---

# Future Extensions

Future phases may add:

```ts
throttleInput: number;
brakeForce: number;
tractionMultiplier: number;
weatherAccelerationModifier: number;
roadSurfaceModifier: number;
```

The core acceleration field remains the base capability.

---

# Testing Expectations

## Positive Tests

Verify:

```txt
Default acceleration exists.
Default acceleration is positive.
Acceleration is finite.
Acceleration changes speed.
```

Examples:

```txt
120
250
500
```

---

## Negative Tests

Verify rejection of:

```txt
-1
NaN
Infinity
-Infinity
```

Expected:

```txt
Validation failure
RangeError
```

---

## Edge Cases

Verify:

```txt
0 acceleration
0 delta time
Very small acceleration
Fractional acceleration
```

Examples:

```txt
0
0.1
0.5
```

---

## Corner Cases

Verify:

```txt
Very large acceleration
Long simulation duration
Large delta time
```

Examples:

```txt
5000
10000
```

Expected:

```txt
Stable calculations
No NaN
No overflow
No crashes
```

---

# Acceptance Criteria

This task is complete when:

```txt
acceleration exists on CarState.
Acceleration is strongly typed as number.
Unit is documented as px/s².
Default value exists in createInitialCarState().
Default acceleration is positive.
Acceleration is clearly separated from speed.
Validation rejects invalid values.
Tests verify startup and validation behaviour.
```

---

# Traceability KPI

```txt
Acceleration is clearly separated from speed.
```

Success means:

```txt
Acceleration never stores current speed.
Acceleration never stores position.
Acceleration never stores steering.
Acceleration only represents speed-change capability.
```

---

# Design Rules

Rule 1

```txt
Acceleration does not move the car.
```

Rule 2

```txt
Acceleration changes speed.
```

Rule 3

```txt
Speed changes position.
```

Rule 4

```txt
Physics owns movement.
```

Rule 5

```txt
Rendering only visualizes state.
```

---

# Engineering Lessons Learned

## Most Beginner Simulators Get This Wrong

Common mistake:

```txt
Acceleration directly changes position.
```

Example:

```txt
Acceleration
      ↓
Position
```

This bypasses physics.

The result:

```txt
Unrealistic movement
Broken telemetry
Broken AI
Difficult testing
```

---

## Capability vs State

Acceleration is capability.

Speed is state.

Example:

```txt
Acceleration = engine capability

Speed = current road speed
```

Confusing these concepts creates fragile designs.

Keeping them separate creates a scalable architecture.

---

## Clean Simulation Architecture

A professional simulation pipeline looks like:

```txt
Controls / AI
        ↓
Acceleration
        ↓
Speed
        ↓
Position
        ↓
Camera
        ↓
Rendering
        ↓
Dashboard
```

Every layer has one responsibility.

This reduces technical debt and keeps future autonomous-driving features easier to implement.
