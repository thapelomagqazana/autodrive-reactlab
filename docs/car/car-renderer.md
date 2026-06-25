# Car Renderer

## Purpose

`drawCar()` is the dedicated canvas renderer for the simulated vehicle.

It converts the current `CarState` into visible pixels on the simulation canvas.

The renderer is intentionally small, focused, and passive.

It draws the car.

It does not update the car.

---

# Scope

This document covers **Phase 1.5.1 — Create Car Rendering Function**.

This task introduces a renderer responsible for drawing the MVP vehicle using the current car state.

It does **not** implement:

- Physics
- Steering logic
- Speed updates
- Position updates
- Keyboard controls
- AI decisions
- Zustand access
- Animation loop ownership

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

---

# Inputs

```txt
CanvasRenderingContext2D
CarState
DrawCarOptions
```

---

# Output

```txt
Visible car rendered on the canvas
```

The function returns:

```ts
void
```

---

# Responsibilities

`drawCar()` is responsible for:

```txt
Reading car position.
Reading car dimensions.
Reading car angle.
Applying visual style.
Drawing the car body.
Drawing a front indicator.
Saving and restoring canvas state.
```

---

# Non-Responsibilities

`drawCar()` must not:

```txt
Mutate car state.
Read Zustand directly.
Import React.
Apply physics.
Update speed.
Update position.
Update angle.
Start requestAnimationFrame.
Resize canvas.
Read keyboard input.
Run AI logic.
```

---

# Geometry Contract

The car renderer consumes:

```ts
car.positionX;
car.positionY;
car.width;
car.height;
car.angle;
```

The car's position represents the **center point**.

Therefore the body rectangle is drawn around the center:

```txt
x = -car.width / 2
y = -car.height / 2
width = car.width
height = car.height
```

---

# Coordinate Convention

The simulation uses canvas coordinates:

```txt
Origin = top-left
Positive X = right
Positive Y = down
Units = pixels
```

The car heading uses radians:

```txt
0 radians = facing upward / north
```

---

# Transform Contract

The renderer should draw in local vehicle coordinates.

Recommended flow:

```ts
context.save();

context.translate(car.positionX, car.positionY);
context.rotate(car.angle);

// draw car around local origin

context.restore();
```

This keeps rotation simple and makes the car naturally rotate around its center.

---

# Canvas State Safety

Canvas is stateful.

`drawCar()` must use:

```ts
context.save();
```

and:

```ts
context.restore();
```

This prevents car styles and transforms from leaking into:

```txt
Road renderer
Sensor renderer
HUD renderer
Debug overlays
Traffic renderer
```

---

# Default Theme

The renderer should follow the Tesla FSD + NASA Mission Control Hybrid theme.

Recommended visual direction:

```txt
Clean light vehicle body
Cyan technical outline
Subtle glow
Clear front indicator
Professional dashboard feel
No arcade/pixel styling
```

Recommended defaults:

```ts
export const DEFAULT_DRAW_CAR_OPTIONS = {
  bodyFillColor: "rgb(226 232 240)",
  bodyStrokeColor: "rgb(56 189 248)",
  bodyLineWidth: 2,
  frontIndicatorColor: "rgb(14 165 233)",
  shadowColor: "rgb(56 189 248 / 0.28)",
  shadowBlur: 14,
};
```

---

# Front Indicator

The front indicator shows which side of the car is forward.

This is important because a rectangle alone does not clearly show vehicle direction.

For MVP:

```txt
Draw a small colored bar near the front/top of the local car body.
```

Since `angle = 0` means facing upward, the indicator should sit near:

```txt
-car.height / 2
```

in local coordinates.

---

# Validation

Before drawing, `drawCar()` should validate required numeric fields.

Required finite values:

```txt
positionX
positionY
width
height
angle
```

Required positive dimensions:

```txt
width > 0
height > 0
```

Invalid values should throw a `RangeError`.

This prevents `NaN` and `Infinity` from poisoning canvas transforms.

---

# Rendering Order

In the MVP frame pipeline, the car should render after the road.

Recommended order:

```txt
beginFrame()
background grid
road
car
debug overlays
HUD
```

This ensures the car is visible above the road surface and lane markings.

---

# Integration Example

```ts
drawRoad(context, road, {
  showCenterGuide,
});

drawCar(context, car);
```

---

# Testing Strategy

## Positive Tests

Verify:

```txt
drawCar() accepts context and car.
drawCar() returns void.
translate() uses car.positionX and car.positionY.
rotate() uses car.angle.
Body drawing methods are called.
Front indicator is drawn.
Default style is applied.
Custom style options are supported.
Canvas state is saved and restored.
```

---

## Negative Tests

Verify:

```txt
NaN position throws.
Infinity position throws.
width = 0 throws.
width < 0 throws.
height = 0 throws.
height < 0 throws.
NaN angle throws.
```

---

## Mutation Tests

Verify:

```txt
drawCar() does not mutate CarState.
```

---

## Edge Cases

Verify:

```txt
Very small valid car.
Large car.
Fractional position.
Fractional dimensions.
Custom angle.
Negative finite angle.
Large finite angle.
```

---

# Acceptance Criteria

This task is complete when:

```txt
drawCar() exists.
drawCar() accepts CanvasRenderingContext2D and CarState.
drawCar() returns void.
drawCar() does not mutate car state.
drawCar() does not import React.
drawCar() does not import Zustand.
drawCar() does not apply physics.
drawCar() uses car dimensions.
drawCar() uses car angle.
drawCar() saves and restores canvas state.
Unit tests verify canvas drawing methods are called.
Renderer is called from the frame rendering pipeline.
```

---

# Traceability KPI

```txt
100% of MVP car visuals are rendered through drawCar().
```

Success means:

```txt
No component draws the car manually.
No frame pipeline hardcodes vehicle shape.
No duplicate car rendering paths exist.
```

---

# Engineering Lessons Learned

## Renderers Should Be Passive

A renderer should display state.

It should not change state.

Bad renderer:

```txt
Draws car
Updates speed
Moves position
Reads controls
```

Good renderer:

```txt
Draws car from current CarState
```

---

## Local Coordinates Simplify Rotation

By translating to the car center and rotating the context, the renderer can draw the car as if it is always centered at `(0, 0)`.

This keeps geometry simple:

```txt
body starts at -width / 2
body starts at -height / 2
```

---

## One State, One Shape

The car renderer must use:

```txt
CarState.width
CarState.height
```

The future collision system should use the same values.

This prevents visual/collision mismatch.

---

## Canvas State Must Not Leak

Every renderer must protect the global canvas context.

If `drawCar()` forgets `restore()`, later renderers may inherit:

```txt
rotation
translation
shadow
stroke color
fill color
line width
```

That creates difficult visual bugs.

---

# Future Evolution

This renderer design can support:

```txt
Car body gradients
Wheel rendering
Headlights
Brake lights
Turn signals
Sensor mount points
Debug collision box
Damage state
AI intent color
Multiple vehicle types
Traffic car rendering
Night mode
Weather mode
```

The core API should remain stable:

```ts
drawCar(context, car, options);
```
