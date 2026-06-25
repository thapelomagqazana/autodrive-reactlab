# Road Center Guide Rendering

## Purpose

The road center guide is an optional debug visual that shows the horizontal center line of the road.

It helps developers verify that the road model, renderer, vehicle spawn position, camera system, and lane calculations are aligned correctly.

The center guide is not part of normal MVP presentation rendering.

It is a debug aid.

---

# File Location

```txt
src/simulation/engine/roadRenderer.ts
```

---

# Public API

```ts
drawRoadCenterGuide(
  context: CanvasRenderingContext2D,
  road: Road,
  options: CenterGuideOptions,
): void;
```

---

# Control Option

The center guide is controlled by an explicit render option:

```ts
showCenterGuide?: boolean;
```

Default:

```txt
false
```

This means the guide is hidden unless intentionally enabled.

---

# Responsibilities

`drawRoadCenterGuide()` is responsible for:

```txt
Checking whether center guide rendering is enabled.
Drawing a diagnostic line at Road.centerX.
Applying diagnostic center-guide styling.
Returning without drawing when disabled.
Avoiding mutation of road or car state.
```

---

# Non-Responsibilities

`drawRoadCenterGuide()` must not:

```txt
Mutate the road model.
Mutate car state.
Change lane geometry.
Change physics state.
Change camera state.
Read Zustand.
Import React.
Resize canvas.
Start a game loop.
```

---

# Geometry

The center guide line is drawn at:

```txt
road.centerX
```

It runs from:

```txt
road.topY
```

to:

```txt
road.bottomY
```

Example:

```ts
{
  startX: road.centerX,
  startY: road.topY,
  endX: road.centerX,
  endY: road.bottomY,
  kind: "divider",
}
```

Although it can use the same `RoadLine` shape, it is debug-only and should not be treated as a real lane divider.

---

# Default Behaviour

By default:

```txt
showCenterGuide = false
```

Expected result:

```txt
No center guide is drawn.
No extra canvas line is requested.
Normal road rendering remains clean.
```

---

# Enabled Behaviour

When:

```txt
showCenterGuide = true
```

Expected result:

```txt
A diagnostic center line is drawn at Road.centerX.
```

Example for default road:

```txt
Road.centerX = 400
```

The line should be drawn from:

```txt
(400, road.topY)
```

to:

```txt
(400, road.bottomY)
```

---

# Diagnostic Style

The center guide should look different from both boundaries and lane dividers.

Recommended style:

```txt
Thin cyan line
Dashed pattern
Low visual weight
Debug-only appearance
```

Recommended values:

```ts
centerGuideColor: "rgb(56 189 248)";
centerGuideLineWidth: 1;
dash: [8, 12];
```

---

# Render Order

Inside full road rendering, the center guide should render after:

```txt
Road surface
Road boundaries
Lane dividers
```

Recommended order:

```txt
1. Road surface
2. Road boundaries
3. Lane dividers
4. Optional center guide
```

This makes the guide visible when debugging without interfering with core road geometry.

---

# Why It Must Be Explicit

Debug visuals can confuse production behaviour if they appear accidentally.

A visible center guide might be mistaken for:

```txt
A lane divider
A road boundary
A sensor ray
A navigation path
```

Therefore, it must only appear when explicitly enabled.

---

# Relationship to Road Model

The Road model owns:

```txt
centerX
topY
bottomY
```

The renderer consumes those values.

Correct:

```ts
startX: road.centerX;
endX: road.centerX;
```

Incorrect:

```ts
startX: 400;
endX: 400;
```

No hardcoded center guide coordinates should exist.

---

# Relationship to Car Spawning

The center guide helps verify that the car starts where expected.

For a 3-lane road, the center lane may align with:

```txt
Road.centerX
```

The center guide makes this visually obvious during development.

---

# Relationship to Camera

Future camera-follow behaviour can use the center guide to verify:

```txt
Road alignment
Camera offset
Viewport translation
Car position stability
```

---

# Testing Expectations

## Positive Tests

Verify:

```txt
Guide is drawn when showCenterGuide is true.
Guide is drawn at Road.centerX.
Guide uses road.topY and road.bottomY.
Guide uses diagnostic styling.
Guide adds exactly one extra rendered line.
```

---

## Negative Tests

Verify:

```txt
Guide is not drawn by default.
Guide is not drawn when showCenterGuide is false.
Guide does not mutate road state.
Guide does not mutate car state.
```

---

## Edge Cases

Verify:

```txt
Custom road.centerX.
Negative road.topY.
Large road.bottomY.
Fractional road.centerX.
```

Expected:

```txt
Guide remains model-derived.
No hardcoded coordinates.
No NaN propagation.
```

---

# Acceptance Criteria

This task is complete when:

```txt
Center guide is not visible by default.
Center guide is visible when showCenterGuide is true.
Center guide is drawn at Road.centerX.
Center guide uses road.topY and road.bottomY.
Center guide uses a distinct diagnostic style.
Center guide does not affect road model or car state.
Tests verify disabled and enabled behaviour.
```

---

# Traceability KPI

```txt
Debug visuals are explicitly controlled by render options.
```

Success means:

```txt
No debug center guide appears unless showCenterGuide is true.
No debug visual is hardcoded into normal rendering.
No debug state leaks into the road model.
```

---

# Engineering Lessons Learned

## Debug Rendering Must Be Intentional

Debug visuals are powerful, but dangerous if they silently appear in production rendering.

The correct design is:

```txt
Explicit option
      ↓
Debug renderer
      ↓
Canvas
```

Not:

```txt
Renderer always draws debug helpers.
```

---

## Debug Visuals Should Not Become Domain State

The center guide does not belong in the Road model.

It is not a road feature.

It is a renderer diagnostic.

The Road model provides geometry.

The renderer decides whether to visualize a debug guide.

---

## Keep Debug Style Distinct

A debug guide should never look like:

```txt
A road boundary
A real lane divider
A sensor ray
A navigation path
```

Distinct styling prevents visual confusion and keeps the simulator professional.

---

# Future Extensions

This pattern can later support:

```txt
showLaneCenters
showRoadBounds
showCarBounds
showSensorOrigins
showCollisionBoxes
showPathfindingGraph
showAIIntent
showCameraAnchor
```

Each debug visual should follow the same rule:

```txt
Hidden by default.
Explicitly enabled.
Model-derived.
Non-mutating.
Tested.
```
