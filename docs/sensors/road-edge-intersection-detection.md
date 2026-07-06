# Road Edge Intersection Detection

## Overview

Road edge intersection detection checks generated sensor rays against finite road boundary segments.

This module answers:

```txt
Does this sensor ray hit the left or right road edge?
Where does it hit?
How far away is the hit?
How close is the hit relative to the ray's maximum range?
```

It returns the closest valid road-boundary hit for a ray, or `null` when no valid hit exists.

---

## Module Location

```txt
src/simulation/sensors/roadEdgeDetection.ts
```

Recommended test file:

```txt
src/simulation/sensors/roadEdgeDetection.test.ts
```

---

## Scope

### In Scope

This module defines:

- Finite line segment model
- Road boundary segment model
- Segment intersection result model
- Road-edge intersection result model
- `getIntersection()`
- `detectClosestRoadEdgeIntersection()`

### Out of Scope

This module does not implement:

- Sensor ray generation
- Obstacle detection
- Lane-boundary detection
- Vehicle detection
- Pedestrian detection
- Traffic-light detection
- Sensor readings
- Sensor rendering
- Dashboard integration
- AI steering behavior
- Collision handling
- Physics updates

---

## Coordinate Convention

All coordinates use world/canvas coordinates.

Project convention:

- Positive X moves right.
- Positive Y moves down.
- Sensor rays are finite segments from `ray.start` to `ray.end`.
- Road boundaries are finite line segments.

---

## Road Boundary Sides

Supported road boundary sides:

```ts
type RoadBoundarySide = "left" | "right";
```

---

## Line Segment Model

A finite line segment is represented as:

```ts
interface LineSegment {
  readonly start: SensorPoint;
  readonly end: SensorPoint;
}
```

Both points must contain finite world-space coordinates.

Zero-length segments are invalid.

---

## Road Boundary Segment Model

A road boundary segment extends `LineSegment` with a side label:

```ts
interface RoadBoundarySegment extends LineSegment {
  readonly side: RoadBoundarySide;
}
```

Example:

```ts
{
  side: "left",
  start: { x: 200, y: 0 },
  end: { x: 200, y: 1000 },
}
```

---

## Segment Intersection Result

`getIntersection()` returns:

```ts
interface SegmentIntersection {
  readonly point: SensorPoint;
  readonly offsetOnFirstSegment: number;
  readonly offsetOnSecondSegment: number;
}
```

Offsets are normalized:

```txt
0 = segment start
1 = segment end
```

If there is no valid finite intersection, the result is:

```ts
null;
```

---

## Road Edge Intersection Result

Road-edge detection returns:

```ts
interface RoadEdgeIntersection {
  readonly detectionType: "road-boundary";
  readonly boundarySide: "left" | "right";
  readonly point: SensorPoint;
  readonly distance: number;
  readonly normalizedOffset: number;
  readonly rayIndex: number;
}
```

---

## Detection Type

All road-edge hits use:

```ts
detectionType: "road-boundary";
```

This keeps road-edge detection compatible with the broader sensor detection model.

---

## Normalized Offset

Normalized offset is calculated as:

```txt
normalizedOffset = distanceFromRayStart / ray.maxLength
```

Meaning:

```txt
0 = hit at ray start
1 = hit at ray maximum range
```

Examples:

| Distance | Ray Max Length | Normalized Offset |
| -------: | -------------: | ----------------: |
|      `0` |          `100` |               `0` |
|     `25` |          `100` |            `0.25` |
|     `50` |          `100` |             `0.5` |
|    `100` |          `100` |               `1` |

---

## Closest Hit Rule

If one sensor ray intersects multiple road boundary segments, the closest valid hit wins.

Distance is measured from:

```txt
ray.start
```

to:

```txt
intersection.point
```

---

## No-Hit Rule

If no road boundary is hit, return:

```ts
null;
```

No fake detection should be created.

Conversion into a no-detection `SensorReading` belongs to the sensor distance/reading layer.

---

## Endpoint Contact

Endpoint contact is valid.

Example:

```txt
ray.end touches road boundary endpoint
```

This counts as an intersection.

---

## Parallel and Collinear Segments

Parallel non-overlapping segments return:

```ts
null;
```

Collinear overlapping segments also return:

```ts
null;
```

This is intentional for the current implementation because road-edge detection only needs crossing-style ray-to-boundary intersections.

---

## Floating-Point Tolerance

The module uses a small epsilon:

```ts
1e-9;
```

This protects against tiny floating-point drift near segment endpoints.

The epsilon must not be used to accept clearly invalid geometry.

---

## Validation Rules

The module rejects:

- Non-finite point coordinates
- Zero-length segments
- Invalid ray index
- Non-positive ray max length
- Non-finite ray max length

Examples of invalid values:

```txt
NaN
Infinity
-Infinity
ray.maxLength = 0
ray.index = -1
segment.start === segment.end
```

Invalid geometry throws `RangeError`.

---

## Determinism

The module is deterministic.

Given the same ray and boundary segments, it returns the same result.

The module does not depend on:

- Delta time
- Randomness
- Store state
- DOM state
- Canvas state
- Current frame number

---

## Immutability

The module must not mutate:

- `SensorRay`
- `RoadBoundarySegment`
- `SensorPoint`
- Input arrays

It returns new result objects only.

---

## Design Rule

This module may import:

- Sensor model types
- Sensor point construction helpers

This module must not import:

- React
- Zustand store state
- Canvas APIs
- DOM APIs
- Browser APIs
- Rendering modules
- Dashboard components
- AI modules
- Physics update modules

---

## Testing Requirements

Tests must verify:

- `getIntersection()` returns intersection point and offsets.
- Parallel non-overlapping segments return `null`.
- Intersections outside the first segment return `null`.
- Intersections outside the second segment return `null`.
- Endpoint contact is accepted.
- Left boundary hit is detected.
- Right boundary hit is detected.
- No-hit ray returns `null`.
- Closest intersection wins.
- Intersection behind ray start is ignored.
- Intersection beyond ray end is ignored.
- Normalized offset near `0` works.
- Normalized offset near `1` works.
- Sensor ray input is not mutated.
- Road boundary input is not mutated.
- Invalid ray geometry is rejected.
- Invalid boundary geometry is rejected.

---

## Acceptance Criteria Mapping

| Acceptance Criterion                          | Covered By                       |
| --------------------------------------------- | -------------------------------- |
| Road edges represented as finite segments     | `RoadBoundarySegment`            |
| `getIntersection()` exists                    | Segment intersection helper      |
| Parallel non-overlapping segments return null | Parallel rule                    |
| Intersection behind ray ignored               | Finite ray-segment rule          |
| Intersection beyond ray end ignored           | Finite ray-segment rule          |
| Left boundary detection works                 | `boundarySide: "left"`           |
| Right boundary detection works                | `boundarySide: "right"`          |
| Closest intersection returned                 | Closest hit rule                 |
| No-hit result explicit                        | `null`                           |
| Normalized offset calculated                  | `distance / ray.maxLength`       |
| Detection type is road-boundary               | `detectionType: "road-boundary"` |
| Unit tests exist                              | Testing requirements             |

---

## Related Files

```txt
src/simulation/sensors/sensorModel.ts
src/simulation/sensors/raycasting.ts
src/simulation/sensors/roadEdgeDetection.ts
src/simulation/sensors/roadEdgeDetection.test.ts
```

---

## Future Enhancements

Later tasks may add:

- Conversion into `SensorReading`
- Multi-segment road edge detection
- Curved road approximation through segmented polylines
- Lane-boundary intersection detection
- Obstacle intersection detection
- Boundary normal vectors
- Road-edge warning logic
- Time-to-boundary estimates
- Sensor confidence values

---

## Technical Debt Guardrails

Avoid:

- Treating road boundaries as infinite lines
- Mutating input rays
- Mutating road boundary data
- Returning fake detections for no-hit cases
- Mixing sensor readings into this module
- Adding rendering logic
- Adding AI decisions
- Reading directly from the store
- Silently accepting invalid geometry
