# Render Road Relative to Camera

## Purpose

The road should appear to move through the viewport while the car advances through world space.

This is achieved by applying a camera transform during rendering.

The important rule is:

```txt
Camera movement changes the view, not the world.
```

---

# Scope

This document covers **Phase 1.12.3 — Render Road Relative to Camera**.

This phase applies `CameraState` to the world rendering pipeline so that road and car are drawn through the same camera transform.

It does **not** implement:

```txt
Physics changes
Road coordinate mutation
Car coordinate mutation
Camera smoothing
Zoom
Camera rotation
HUD movement
Dashboard movement
```

---

# Source of Truth

World objects keep world-space coordinates:

```txt
CarState.positionX
CarState.positionY
Road.centerX
Road.width
Obstacle positions
```

The camera only changes where those world coordinates appear on screen.

---

# Render Pipeline

Recommended render flow:

```txt
beginFrame()
drawBackgroundGrid()

context.save()
applyCameraTransform()
drawRoad()
drawCar()
context.restore()

drawHUD()
```

The world layer is inside the camera transform.

HUD and overlays are outside the camera transform.

---

# Camera Transform Convention

The camera follows this convention:

```txt
screenX = worldX + camera.offsetX
screenY = worldY + camera.offsetY
```

Therefore:

```ts
context.translate(camera.offsetX, camera.offsetY);
```

This matches the follow-camera target formula:

```txt
targetOffsetX = anchorX - car.positionX
targetOffsetY = anchorY - car.positionY
```

---

# Camera Renderer

Recommended file:

```txt
src/simulation/engine/cameraRenderer.ts
```

Recommended implementation:

```ts
import type { CameraState } from "../camera";

/**
 * Applies the active camera transform to world-space rendering.
 *
 * Convention:
 * - screenX = worldX + camera.offsetX
 * - screenY = worldY + camera.offsetY
 *
 * Important:
 * - Call inside context.save() / context.restore().
 * - Do not use this for HUD/dashboard/overlay rendering.
 */
export function applyCameraTransform(
  context: CanvasRenderingContext2D,
  camera: CameraState,
): void {
  context.translate(camera.offsetX, camera.offsetY);
}
```

---

# Frame Renderer Responsibility

The frame renderer should own the camera transform boundary.

Recommended structure:

```ts
export function drawSimulationFrame(
  context: CanvasRenderingContext2D,
  road: Road,
  car: CarState,
  options: DrawSimulationFrameOptions = {},
): void {
  assertCarIsRenderableOnRoad(road, car);

  context.save();

  try {
    if (options.camera) {
      applyCameraTransform(context, options.camera);
    }

    drawRoad(context, road, options.road);
    drawCar(context, car, options.car);
  } finally {
    context.restore();
  }
}
```

The `finally` block is important because canvas state must be restored even if road or car rendering throws.

---

# Why Road and Car Share the Same Transform

Road and car are both world objects.

If only the car receives the transform, it separates visually from the road.

If only the road receives the transform, the car appears disconnected from the world.

Correct:

```txt
camera transform
  ├── road
  └── car
```

Incorrect:

```txt
road
camera transform
  └── car
```

Incorrect:

```txt
camera transform
  └── road
car
```

---

# HUD and Dashboard Rule

HUD, dashboard, and fixed overlays should not move with the camera.

They must render after:

```ts
context.restore();
```

Examples of screen-fixed elements:

```txt
FPS overlay
Debug labels
Dashboard panel
Mini-map frame
Control hints
Mouse coordinates
```

---

# SimulationCanvas Integration

Recommended flow:

```tsx
beginFrame(context, {
  width: dimensions.width,
  height: dimensions.height,
});

renderBackgroundGrid(context, {
  width: dimensions.width,
  height: dimensions.height,
  spacing: 40 * (dimensions.pixelRatio ?? 1),
  enabled: isGridEnabled,
});

const renderCamera = resolveCameraForView(camera, car, {
  width: dimensions.width,
  height: dimensions.height,
});

drawSimulationFrame(context, road, car, {
  camera: renderCamera,
  road: {
    showCenterGuide: ui.isDebugModeEnabled,
  },
});
```

The background grid remains screen-fixed unless intentionally moved into the world layer.

---

# Testing Strategy

## Transform Order Tests

Verify:

```txt
context.save() happens before camera transform.
camera transform happens before drawRoad().
drawRoad() happens before drawCar().
drawCar() happens before context.restore().
```

---

## No Camera Tests

Verify:

```txt
drawRoad() and drawCar() still render when no camera is provided.
context.translate() is not called when camera is missing.
context.save() and context.restore() still wrap world drawing.
```

---

## Restore Safety Tests

Verify:

```txt
context.restore() is called if drawRoad() throws.
context.restore() is called if drawCar() throws.
```

---

## World-State Safety Tests

Verify:

```txt
Road object is not mutated.
Car object is not mutated.
Camera object is not mutated.
```

---

# Acceptance Criteria

This task is complete when:

```txt
Road appears to move relative to viewport in follow mode.
Car and road use the same camera transform.
Dashboard and HUD do not move with camera.
Canvas transform is restored after world rendering.
Tests verify transform order.
```

---

# Traceability KPI

```txt
All world objects render through one camera transform.
```

Success means:

```txt
Road, car, obstacles, and future world objects share the same world-to-screen transform.
```

---

# Engineering Lessons Learned

## Camera Is a Boundary

The camera transform should be applied once at the world-rendering boundary.

Do not scatter camera math inside every renderer unless necessary.

---

## Canvas State Is Global

Canvas transforms affect every draw call after them.

That is why `save()` and `restore()` are not optional.

---

## HUD Is Screen Space

World objects use camera transform.

HUD elements use screen coordinates.

Keep those layers separate.

---

# Future Evolution

This rendering foundation prepares the simulator for:

```txt
Follow camera smoothing
Zoom camera
Camera bounds
Obstacle rendering
Sensor ray rendering
World-space debug labels
Screen-space HUD overlays
Mini-map
Replay camera controls
Scenario editor tools
```

The stable rule remains:

```txt
World objects render inside the camera transform; overlays render outside it.
```
