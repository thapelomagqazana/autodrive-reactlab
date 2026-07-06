# Visual Sensor Overlay

## Overview

The visual sensor overlay renders existing sensor rays and existing sensor readings on the simulation canvas.

It helps users see:

- Full sensor range
- Clear sensor path
- Blocked or danger segment after detection
- Exact hit point
- Sensor overlay enabled/disabled behavior

This module is rendering-only.

It does not generate rays, calculate intersections, update sensor state, or make AI decisions.

---

## Module Location

```txt
src/simulation/engine/sensorRenderer.ts
```

Recommended test file:

```txt
src/simulation/engine/sensorRenderer.test.ts
```

---

## Scope

### In Scope

This module defines:

- `drawSensors()`
- `SensorOverlayStyle`
- `DrawSensorsOptions`
- `DEFAULT_SENSOR_OVERLAY_STYLE`
- Clear ray rendering
- Danger segment rendering
- Hit marker rendering
- Overlay disabled behavior

### Out of Scope

This module does not implement:

- Ray generation
- Road-edge detection
- Obstacle detection
- Distance calculation
- Sensor update loop
- Dashboard telemetry
- AI decision-making
- Store integration
- Keyboard shortcuts
- Advanced style editor

---

## Rendering Inputs

`drawSensors()` requires:

```ts
context: CanvasRenderingContext2D;
options: DrawSensorsOptions;
```

Where:

```ts
interface DrawSensorsOptions {
  readonly isEnabled: boolean;
  readonly rays: readonly SensorRay[];
  readonly readings: readonly SensorReading[];
  readonly style?: Partial<SensorOverlayStyle>;
}
```

---

## Overlay Style

Default style:

```ts
{
  clearColor: "rgba(34, 197, 94, 0.85)",
  dangerColor: "rgba(239, 68, 68, 0.85)",
  hitColor: "rgba(250, 204, 21, 0.95)",
  lineWidth: 2,
  hitMarkerRadius: 4,
}
```

Style values are centralized so future tuning does not scatter magic values across renderers.

---

## Rendering Rules

### Disabled Overlay

If:

```ts
isEnabled === false;
```

Then:

```txt
draw nothing
```

No canvas drawing calls should occur.

---

### Missing Reading

If a ray has no matching reading, draw the full ray as clear:

```txt
ray.start -> ray.end
```

---

### No-Detection Reading

If a reading exists with:

```ts
detected: false;
```

Draw the full ray as clear:

```txt
ray.start -> ray.end
```

---

### Detected Reading

If a reading exists with:

```ts
detected: true;
```

Draw:

```txt
clear segment:  ray.start -> reading.point
danger segment: reading.point -> ray.end
hit marker:     centered at reading.point
```

---

## Reading-to-Ray Mapping

Readings map to rays by:

```ts
reading.rayIndex === ray.index;
```

The renderer must not depend on array order.

---

## Camera Transform Rule

`drawSensors()` assumes camera/world transforms have already been applied by the caller.

The renderer draws the coordinates it receives.

It does not perform world-to-screen conversion.

---

## Determinism

The renderer is deterministic.

Given the same context, rays, readings, enabled flag, and style config, it performs the same drawing operations.

It does not depend on:

- Delta time
- Randomness
- Store state
- DOM state
- Current frame number
- `requestAnimationFrame`

---

## Immutability

The renderer must not mutate:

- `SensorRay`
- `SensorReading`
- Input arrays
- `CarState`
- `SensorState`

It only performs canvas drawing side effects.

---

## Validation Rules

The renderer rejects:

- Missing canvas context
- Non-finite ray start coordinates
- Non-finite ray end coordinates
- Invalid ray index
- Invalid reading ray index
- Non-finite detected hit point coordinates

Invalid geometry throws `RangeError`.

Missing canvas context throws `TypeError`.

---

## Design Rule

This module may import:

- Sensor model types

This module must not import:

- React
- Zustand store state
- DOM APIs
- Browser event APIs
- Ray-generation modules
- Intersection detection modules
- AI modules
- Dashboard components

---

## Testing Requirements

Tests must verify:

- Disabled overlay draws nothing.
- Missing reading draws full clear ray.
- No-detection reading draws full clear ray.
- Detected reading draws clear segment.
- Detected reading draws danger segment.
- Detected reading draws hit marker.
- Readings map to rays by ray index.
- Inputs are not mutated.
- Invalid ray coordinates are rejected.

---

## Acceptance Criteria Mapping

| Acceptance Criterion                   | Covered By                 |
| -------------------------------------- | -------------------------- |
| `drawSensors()` exists                 | Renderer function          |
| Disabled overlay draws nothing         | Disabled overlay rule      |
| No-hit ray draws full clear line       | Missing/no-detection rules |
| Detected ray draws clear segment       | Detected reading rule      |
| Detected ray draws danger segment      | Detected reading rule      |
| Detected ray draws hit marker          | Hit marker rule            |
| Readings map by ray index              | Mapping rule               |
| Missing reading treated as no-hit      | Missing reading rule       |
| No-detection reading treated as no-hit | No-detection rule          |
| Styles centralized                     | Default style              |
| Renderer does not mutate inputs        | Immutability rule          |
| Tests exist                            | Testing requirements       |

---

## Related Files

```txt
src/simulation/sensors/sensorModel.ts
src/simulation/sensors/raycasting.ts
src/simulation/sensors/sensorDistance.ts
src/simulation/engine/sensorRenderer.ts
src/simulation/engine/sensorRenderer.test.ts
```

---

## Future Enhancements

Later tasks may add:

- Sensor labels
- Different marker styles by detection type
- Different colors for warning/danger severity
- Overlay opacity control
- Debug-only label rendering
- Side/front sensor group styling
- Accessibility-friendly dashboard values
- Theme-driven sensor colors

---

## Technical Debt Guardrails

Avoid:

- Generating rays in the renderer
- Calculating intersections in the renderer
- Calculating distances in the renderer
- Reading from the store
- Mutating sensor state
- Mutating car state
- Calling `requestAnimationFrame`
- Performing world-to-screen conversion here
- Coupling overlay visibility to sensor enabled state without an explicit option
