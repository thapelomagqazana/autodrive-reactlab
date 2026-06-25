# Car Dimensions

## Purpose

Car dimensions define the simulated vehicle's visual size and future collision shape.

The same dimensions must be used by:

- Car rendering
- Collision detection
- Road-boundary checks
- Sensor origin calculations
- Dashboard telemetry
- Debug overlays
- Future AI safety logic

The project must not maintain separate visual dimensions and collision dimensions.

There should be one source of truth:

```ts
CarState.width;
CarState.height;
```

---

# Scope

This document covers **Phase 1.4.3 — Define Car Dimensions**.

The implementation defines the car's width and height in pixels and ensures those dimensions are valid for the selected road lane.

---

# File Locations

```txt
src/simulation/vehicle/carState.ts
src/simulation/vehicle/createInitialCar.ts
```

---

# Fields

```ts
width: number;
height: number;
```

---

# Coordinate System

The car uses the same canvas coordinate system as the road.

```txt
Origin = top-left of canvas
Positive X = right
Positive Y = down
Units = pixels
```

---

# Position Convention

The car position represents the **center point** of the vehicle.

```ts
positionX: number;
positionY: number;
```

This means the rendered/collision rectangle is derived around the center.

---

# Default Dimensions

Recommended MVP dimensions:

```ts
DEFAULT_INITIAL_CAR_WIDTH = 36;
DEFAULT_INITIAL_CAR_HEIGHT = 64;
```

Combined object:

```ts
DEFAULT_INITIAL_CAR_DIMENSIONS = {
  width: 36,
  height: 64,
};
```

These values are small enough to fit inside the default lane width and large enough to be visible on the canvas.

---

# Dimension Rules

Car dimensions must be:

```txt
Finite
Positive
Measured in pixels
```

Valid:

```txt
1
36
64
100
```

Invalid:

```txt
0
-1
NaN
Infinity
-Infinity
```

Invalid values should throw a `RangeError`.

---

# Lane Fit Rule

The car width must fit inside the selected lane.

```txt
car.width < laneWidth
```

The strict `<` rule leaves visual room on both sides of the car.

Example:

```txt
laneWidth = 120
car.width = 36

36 < 120
```

Valid.

Invalid example:

```txt
laneWidth = 120
car.width = 120

120 < 120
```

Invalid.

The car should not completely fill the lane.

---

# Bounds Derivation

The collision/render bounds are derived from the center point and dimensions.

```txt
left = positionX - width / 2
right = positionX + width / 2
top = positionY - height / 2
bottom = positionY + height / 2
```

Example:

```txt
positionX = 400
positionY = 600
width = 36
height = 64
```

Result:

```txt
left = 382
right = 418
top = 568
bottom = 632
```

---

# Recommended Types

```ts
export interface CarDimensions {
  width: number;
  height: number;
}
```

```ts
export interface CarBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}
```

---

# Recommended Helpers

```ts
isValidCarDimension(value: number): boolean;
```

```ts
assertValidCarDimensions(dimensions: CarDimensions): void;
```

```ts
getCarBoundsFromCenter(
  positionX: number,
  positionY: number,
  dimensions: CarDimensions,
): CarBounds;
```

```ts
assertCarFitsInsideLane(
  road: Road,
  laneIndex: number,
  dimensions: CarDimensions,
): void;
```

---

# Factory Responsibility

`createInitialCar()` must define the car dimensions.

Correct:

```ts
const car = createInitialCar(road);
```

Expected:

```ts
car.width === 36;
car.height === 64;
```

Incorrect:

```ts
const width = 36;
const height = 64;
```

inside a renderer or component.

---

# Rendering Contract

The car renderer must consume:

```ts
car.width;
car.height;
```

It must not invent its own size.

Correct:

```ts
drawCar(context, car);
```

Incorrect:

```ts
context.fillRect(x, y, 40, 80);
```

---

# Collision Contract

Future collision detection must consume the same dimensions.

Correct:

```ts
const bounds = getCarBoundsFromCenter(car.positionX, car.positionY, {
  width: car.width,
  height: car.height,
});
```

Incorrect:

```ts
const collisionWidth = 30;
const collisionHeight = 50;
```

---

# Sensor Contract

Future sensor origin and vehicle corners should also derive from:

```ts
car.positionX;
car.positionY;
car.width;
car.height;
```

This keeps perception aligned with rendering and collision detection.

---

# Testing Strategy

## Positive Tests

Verify:

```txt
Default width is 36.
Default height is 64.
Dimensions are positive.
Dimensions are finite.
Custom valid dimensions are accepted.
Bounds derive correctly from center point.
Default car width is less than selected lane width.
```

---

## Negative Tests

Verify:

```txt
width = 0 throws.
width < 0 throws.
height = 0 throws.
height < 0 throws.
NaN throws.
Infinity throws.
Car width >= lane width throws.
```

---

## Edge Cases

Verify:

```txt
Very narrow valid car.
Very tall valid car.
Fractional dimensions.
One-lane road.
Two-lane road.
Custom lane width.
```

---

# Acceptance Criteria

This task is complete when:

```txt
Car width and height are positive numbers.
Width and height are measured in pixels.
Car dimensions are defined in createInitialCar().
PositionX and positionY represent the car center point.
Collision/render bounds are derived from center and dimensions.
Car dimensions fit inside the selected lane.
Tests verify width and height defaults.
Tests verify car width is less than lane width.
```

---

# Traceability KPI

```txt
Car render shape and collision shape use the same dimensions.
```

Success means:

```txt
100% of vehicle visual shape and future collision shape are derived from:

CarState.positionX
CarState.positionY
CarState.width
CarState.height
```

---

# Engineering Lessons Learned

## One Shape, Many Consumers

The car's rectangle is not only a visual object.

It becomes the basis for:

```txt
Rendering
Collision detection
Road boundary checks
Sensors
AI safety
Telemetry
Debugging
```

If each subsystem defines its own size, they eventually disagree.

---

## Center-Based Coordinates Simplify Rotation

Using the car center as the position makes future rotation easier.

A car rotates naturally around its center point.

This supports:

```txt
Steering physics
Heading rendering
Collision boxes
Sensor ray origins
```

---

## Dimensions Must Fit the Lane

The car should be valid in the world where it spawns.

A vehicle wider than the lane creates immediate visual and collision problems.

That is why the factory validates lane fit at creation time.

---

# Future Evolution

This model can support:

```txt
Different car types
Truck dimensions
Motorbike dimensions
Emergency vehicles
Vehicle selection
Scenario-specific cars
Collision polygons
Rotated bounding boxes
Sensor anchor points
Vehicle profiles
```

The key rule remains:

```txt
Dimensions belong in car state.
Renderers and collision systems consume them.
```
