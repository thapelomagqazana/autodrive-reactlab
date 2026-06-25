# Car Shadow and Outline

## Purpose

The car shadow and outline improve vehicle visibility against the road surface, lane markings, and background grid.

The goal is not to create a flashy effect.

The goal is to make the vehicle readable in a professional autonomous-driving simulation interface.

---

# Scope

This document covers **Phase 1.5.5 — Draw Car Shadow and Outline**.

This phase improves the visual clarity of the already-rendered car body.

It does **not** implement:

- Collision detection
- Physics
- Road shadows
- Lighting simulation
- Damage effects
- Brake lights
- Turn signals
- Sensor visualization

---

# File Location

```txt
src/simulation/engine/carRenderer.ts
```

---

# Visual Goal

The vehicle should remain visible across:

```txt
Dark road surface
Mission-control grid
Lane divider lines
Road boundary lines
Debug overlays
```

The style should be:

```txt
Subtle
Readable
Professional
Mission-control inspired
Tesla FSD compatible
```

Avoid:

```txt
Heavy neon glow
Pixel-art outline
Arcade-style bloom
Overly thick borders
Distracting effects
```

---

# Renderer Ownership

Shadow and outline are renderer concerns.

They must not be stored in:

```txt
CarState
Road model
Zustand store
Physics engine
```

Correct:

```ts
drawCar(context, car, {
  shadowColor: "rgb(0 0 0 / 0.45)",
});
```

Incorrect:

```ts
car.shadowColor = "black";
```

---

# Default Style

Recommended defaults:

```ts
export const DEFAULT_DRAW_CAR_OPTIONS = {
  bodyFillColor: "rgb(226 232 240)",
  bodyStrokeColor: "rgb(125 211 252)",
  bodyLineWidth: 2,

  frontIndicatorColor: "rgb(14 165 233)",

  shadowColor: "rgb(0 0 0 / 0.45)",
  shadowBlur: 10,
  shadowOffsetX: 0,
  shadowOffsetY: 4,
};
```

---

# Shadow Rule

The shadow should improve contrast without hiding road markings.

Recommended:

```txt
Soft black shadow
Low-to-medium blur
Small vertical offset
No strong neon color
```

Example:

```ts
context.shadowColor = options.shadowColor;
context.shadowBlur = options.shadowBlur;
context.shadowOffsetX = options.shadowOffsetX;
context.shadowOffsetY = options.shadowOffsetY;
```

---

# Outline Rule

The outline should define the car boundary clearly.

Recommended:

```txt
Thin blue-white outline
Readable against dark road
Crisp edge
Professional technical style
```

Example:

```ts
context.strokeStyle = options.bodyStrokeColor;
context.lineWidth = options.bodyLineWidth;
context.stroke();
```

---

# Shadow and Outline Order

Recommended drawing order:

```txt
1. Draw filled body with shadow enabled.
2. Disable shadow.
3. Draw outline.
```

Reason:

```txt
The shadow improves contrast.
The outline remains crisp.
```

Recommended implementation:

```ts
context.fill();

context.shadowColor = "transparent";
context.shadowBlur = 0;
context.shadowOffsetX = 0;
context.shadowOffsetY = 0;

context.stroke();
```

---

# Rotation Behaviour

The outline follows car rotation because the car body is drawn inside the same transformed local coordinate system.

Transform order:

```txt
1. Translate to car center
2. Rotate by car.angle
3. Draw body
4. Draw outline
```

The shadow can follow the rotated body or appear consistently beneath it depending on browser canvas behaviour and chosen shadow offsets.

Both are acceptable for MVP as long as the result is subtle and readable.

---

# Canvas State Safety

Canvas styling is stateful.

Shadow properties can leak into later renderers if not restored.

Affected future renderers may include:

```txt
Road renderer
Sensor renderer
Traffic renderer
Debug overlays
HUD renderer
```

Therefore `drawCarBody()` must use:

```ts
context.save();
```

and:

```ts
context.restore();
```

---

# Acceptance Criteria

This task is complete when:

```txt
Car is visible against the road surface.
Car has a readable outline.
Car has subtle shadow contrast.
Outline follows car rotation.
Visual style matches Tesla FSD + Mission Control theme.
No excessive neon, pixel, or arcade effect remains.
CarState is not mutated by visual styling.
```

---

# Testing Strategy

## Positive Tests

Verify:

```txt
Body fill is called.
Outline stroke is called.
Outline color is applied.
Outline line width is applied.
Shadow values are applied before fill.
Shadow values are reset before stroke.
Custom style options are supported.
```

---

## Negative Tests

Verify:

```txt
Invalid car dimensions throw before drawing.
NaN dimensions throw.
Infinity dimensions throw.
```

---

## Mutation Tests

Verify:

```txt
drawCar() does not mutate CarState.
drawCarBody() does not mutate dimension input.
```

---

# Traceability KPI

```txt
Vehicle visibility remains clear across road and grid backgrounds.
```

Success means:

```txt
The car boundary remains visible during normal MVP rendering.
```

---

# Engineering Lessons Learned

## Visibility Is a System Requirement

If the user cannot clearly see the vehicle, the simulation becomes difficult to understand.

Good rendering is not decoration.

It supports debugging, testing, and user comprehension.

---

## Style Must Not Become State

Shadow and outline belong in renderer options.

They should not pollute the vehicle model.

The car model describes the vehicle.

The renderer describes how it looks.

---

## Subtle Beats Loud

Mission-control style is about clarity, not visual noise.

A small shadow and thin outline are enough.

Too much glow makes the simulator look less professional.

---

## Restore Canvas State

Shadow bugs are common in canvas rendering.

A forgotten shadow reset can cause later road lines, sensor rays, or UI overlays to glow unexpectedly.

That is why save/restore and explicit shadow reset matter.

---

# Future Evolution

This styling pattern can support:

```txt
Night mode
Weather mode
Selected vehicle highlight
AI intent outline
Collision warning outline
Emergency state color
Traffic vehicle styles
Debug collision box overlay
```

The core rule remains:

```txt
Visual styling belongs in renderer options.
Vehicle geometry belongs in CarState.
```
