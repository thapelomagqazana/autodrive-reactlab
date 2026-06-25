# Car Front Indicator

## Purpose

The front indicator makes the vehicle's forward direction visually obvious.

A plain rectangle can be ambiguous because it is difficult to tell which side is the front, especially once the car rotates.

The front indicator solves this by placing a small visual marker near the vehicle's front edge.

---

# Scope

This document covers **Phase 1.5.4 — Draw Front Direction Indicator**.

This phase adds a visual direction marker to the car renderer.

It does **not** implement:

- Steering
- Rotation physics
- Brake lights
- Turn signals
- Headlights
- Sensor rays
- AI intent visualization

Those features may be added later.

---

# File Location

```txt
src/simulation/engine/carRenderer.ts
```

---

# Public Helper

```ts
drawCarFrontIndicator(
  context: CanvasRenderingContext2D,
  car: Pick<CarState, "width" | "height">,
  options: Pick<Required<DrawCarOptions>, "frontIndicatorColor">,
): void;
```

---

# Visual Rule

The indicator must appear near the vehicle's front edge.

The front edge is defined in local car coordinates as:

```txt
-local height / 2
```

Because the car body is drawn around local origin `(0, 0)`, the front indicator should be positioned near:

```txt
y = -car.height / 2
```

---

# Coordinate System

The indicator is drawn in **local vehicle coordinates**, not world coordinates.

This means the renderer first applies the car transform:

```ts
context.translate(car.positionX, car.positionY);
context.rotate(car.angle);
```

Then the indicator is drawn relative to the car body.

---

# Why Local Coordinates Matter

When the indicator is drawn in local coordinates, it automatically rotates with the vehicle.

Correct:

```txt
Car rotates
Indicator rotates with car
```

Incorrect:

```txt
Car rotates
Indicator remains fixed in world direction
```

---

# Recommended MVP Shape

Use a small cyan/blue strip near the front edge.

Example:

```ts
const indicatorWidth = car.width * 0.45;
const indicatorHeight = Math.max(3, car.height * 0.08);

context.fillRect(
  -indicatorWidth / 2,
  -car.height / 2 + 6,
  indicatorWidth,
  indicatorHeight,
);
```

---

# Theme Direction

The indicator should follow the Tesla FSD + NASA Mission Control Hybrid theme.

Recommended style:

```txt
Subtle cyan / blue
High contrast on light-slate body
Readable on dark road
Technical perception accent
Not arcade neon
```

Recommended default:

```ts
frontIndicatorColor: "rgb(14 165 233)";
```

---

# Relationship to Heading

The heading is stored in:

```ts
car.angle;
```

The indicator does not calculate heading.

It simply rotates because it is drawn after the car transform.

Correct flow:

```txt
CarState.angle
      ↓
context.rotate(car.angle)
      ↓
draw front indicator in local coordinates
```

---

# Relationship to Car Body

The indicator must use:

```ts
car.width;
car.height;
```

It must not use hardcoded world coordinates.

Correct:

```ts
indicatorWidth = car.width * 0.45;
indicatorY = -car.height / 2 + 6;
```

Incorrect:

```ts
context.fillRect(392, 568, 16, 5);
```

---

# Rendering Order

Within `drawCar()`:

```txt
1. Save canvas state
2. Translate to car center
3. Rotate by heading angle
4. Draw car body
5. Draw front indicator
6. Restore canvas state
```

The indicator should draw after the body so it remains visible above the body fill.

---

# Validation

The front indicator requires valid dimensions.

Valid:

```txt
width > 0
height > 0
```

Invalid:

```txt
width = 0
height = 0
NaN
Infinity
```

Invalid dimensions should throw a `RangeError`.

---

# Acceptance Criteria

This task is complete when:

```txt
Front indicator appears on the front edge.
Indicator rotates with the car body.
Indicator is visually distinct from the body.
Indicator uses car dimensions.
No hardcoded world coordinates are used.
Visual review confirms front direction is clear.
Unit tests verify indicator drawing.
```

---

# Testing Strategy

## Positive Tests

Verify:

```txt
Indicator is drawn with fillRect().
Indicator X uses car width.
Indicator Y uses car height.
Indicator color is applied.
Indicator draws after car transform.
Indicator rotates with the car body through inherited transform.
```

---

## Negative Tests

Verify:

```txt
Invalid width throws.
Invalid height throws.
NaN dimensions throw.
Infinity dimensions throw.
```

---

## Mutation Tests

Verify:

```txt
Indicator drawing does not mutate CarState.
```

---

# Traceability KPI

```txt
User can identify vehicle direction at a glance.
```

Success means:

```txt
A rotated car still clearly communicates which side is forward.
```

---

# Engineering Lessons Learned

## Direction Must Be Visible

A self-driving simulation is easier to understand when the user can immediately tell where the vehicle is facing.

The indicator removes ambiguity from the rectangular body.

---

## Draw Direction in Local Space

The most reliable way to make a direction marker rotate with the car is to draw it after applying the car transform.

That keeps the indicator attached to the vehicle, not the world.

---

## Geometry Comes From Car Dimensions

The indicator should scale with the vehicle.

A larger vehicle gets a larger indicator.

A smaller vehicle gets a smaller indicator.

This keeps rendering consistent across future vehicle types.

---

# Future Evolution

This design can grow into:

```txt
Headlights
Brake lights
Turn indicators
AI intent color
Emergency warning strip
Sensor mount marker
Vehicle type marker
Damage state marker
Autopilot active marker
```

The same rule should remain:

```txt
Draw directional visuals in local vehicle coordinates.
```
