# Car Heading Rendering

## Purpose

Car heading rendering makes the vehicle visually point in the direction stored in `CarState.angle`.

The renderer should not calculate the vehicle's heading.

It should simply consume the current heading state and apply it to the canvas transform.

---

# Scope

This document covers **Phase 1.5.3 — Rotate Car by Heading Angle**.

This phase adds visual rotation to the car renderer.

It does **not** implement:

- Steering physics
- Vehicle turning
- Angle updates
- Keyboard input
- AI heading decisions
- Collision rotation
- Sensor rotation

Those systems may update `CarState.angle` later.

The renderer only displays it.

---

# File Location

```txt
src/simulation/engine/carRenderer.ts
```

---

# Public API

```ts
drawCar(
  context: CanvasRenderingContext2D,
  car: CarState,
  options?: DrawCarOptions,
): void;
```

Supporting helper:

```ts
applyCarTransform(
  context: CanvasRenderingContext2D,
  car: Pick<CarState, "positionX" | "positionY" | "angle">,
): void;
```

---

# Heading Source

The source of truth is:

```ts
car.angle;
```

No renderer, component, dashboard, or canvas hook should maintain a duplicate heading value.

---

# Angle Unit

The angle unit is:

```txt
Radians
```

Canvas rotation APIs expect radians.

Do not convert radians to degrees before rendering.

Correct:

```ts
context.rotate(car.angle);
```

Incorrect:

```ts
context.rotate((car.angle * 180) / Math.PI);
```

---

# Coordinate Convention

The project uses this vehicle heading convention:

```txt
0 radians = facing upward / north on the canvas
Positive rotation = clockwise
```

Examples:

```txt
0          = up / north
Math.PI/2  = right / east
Math.PI    = down / south
-Math.PI/2 = left / west
```

---

# Transform Order

Transform order is important.

Correct order:

```txt
1. save canvas state
2. translate to car center
3. rotate by car.angle
4. draw car body around local origin
5. restore canvas state
```

Code:

```ts
context.save();

context.translate(car.positionX, car.positionY);
context.rotate(car.angle);

drawCarBody(context, car, options);

context.restore();
```

---

# Why Translate Before Rotate?

The car should rotate around its own center.

If rotation happens before translation, the car can rotate around the canvas origin instead.

Correct:

```txt
Car rotates around itself.
```

Incorrect:

```txt
Car swings around the top-left canvas origin.
```

---

# Local Coordinates

After translation and rotation, the car body is drawn in local coordinates.

The car center becomes:

```txt
0, 0
```

The rectangle body is drawn from:

```txt
x = -car.width / 2
y = -car.height / 2
```

This keeps the car centered on its position while rotating.

---

# Canvas State Safety

Canvas transforms are stateful.

If rotation is not restored, future drawings may inherit the car's transform.

Affected systems could include:

```txt
Road renderer
Sensor renderer
Dashboard overlays
Traffic renderer
Debug visuals
```

Therefore, `drawCar()` must always use:

```ts
context.save();
```

and:

```ts
context.restore();
```

---

# Validation

The renderer must validate:

```txt
positionX
positionY
angle
```

Each must be finite.

Invalid values:

```txt
NaN
Infinity
-Infinity
```

Invalid transform values should throw a `RangeError`.

---

# Acceptance Criteria

This task is complete when:

```txt
Car rotates around its center.
Canvas state is saved before transform.
Canvas state is restored after drawing.
Angle is passed to context.rotate() unchanged.
No degree conversion occurs.
Other canvas drawings are not affected by car rotation.
Tests verify save, translate, rotate, and restore are called.
```

---

# Testing Strategy

## Positive Tests

Verify:

```txt
translate() receives car.positionX and car.positionY.
rotate() receives car.angle.
drawCar() saves canvas state.
drawCar() restores canvas state.
Car body is drawn around local origin.
Negative finite angles work.
Large finite angles work.
```

---

## Negative Tests

Verify:

```txt
NaN position throws.
Infinity position throws.
NaN angle throws.
Infinity angle throws.
```

---

## Mutation Tests

Verify:

```txt
drawCar() does not mutate CarState.
```

---

# Traceability KPI

```txt
Visual heading matches CarState.angle.
```

Success means:

```txt
100% of car visual orientation comes from car.angle.
```

---

# Engineering Lessons Learned

## Rendering Displays State

The renderer should not decide where the car points.

It should only render the heading that state already contains.

Correct architecture:

```txt
Physics / Controls / AI
        ↓
CarState.angle
        ↓
drawCar()
        ↓
Canvas rotation
```

---

## Radians Must Stay Radians

Mixing degrees and radians creates confusing bugs.

Canvas expects radians.

Internal state uses radians.

Therefore, no conversion is needed for rendering.

---

## Rotation Origin Matters

The car's position is its center point.

That means all rotation must happen around the center.

The simplest way to achieve that is:

```txt
translate to center
rotate
draw body around 0,0
```

---

## Restore the Canvas

Canvas transform state persists until changed.

A missing restore can break every renderer after the car.

That is why transform isolation is non-negotiable.

---

# Future Evolution

This heading-rendering design prepares the project for:

```txt
Steering physics
Sensor ray rotation
Rotated collision boxes
Traffic vehicle heading
AI path orientation
Replay playback
Parking manoeuvres
Roundabout navigation
Lane-change visualization
```

The renderer API does not need to change.

Only `CarState.angle` changes over time.
