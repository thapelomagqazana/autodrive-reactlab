# Car Starting Position

## Purpose

The starting position of the vehicle defines where the car is spawned when a simulation begins or when the simulation is reset.

The spawning algorithm must be:

- Deterministic
- Road-aware
- Lane-aware
- Independent of rendering
- Independent of physics
- Independent of AI

The goal is to ensure that every new simulation starts from a valid, predictable position without relying on hardcoded coordinates.

---

# Scope

This document covers **Phase 1.4.2 — Set Car Starting Position**.

The implementation is responsible for determining the vehicle's initial position using information from the road model.

It does **not** control movement, steering, rendering, collision detection, or AI behaviour.

---

# File Locations

```text
src/simulation/vehicle/createInitialCar.ts
src/simulation/world/road.ts
```

---

# Public API

```ts
createInitialCar(
  road: Road,
  options?: CreateInitialCarOptions,
): CarState;
```

---

# Design Goals

The starting position should satisfy the following principles:

- Every simulation begins in a valid lane.
- Position is derived from the Road model.
- Spawn logic is deterministic.
- Spawn logic is reusable.
- Spawn logic is configurable.
- Reset behaviour reuses the same factory.

---

# Starting Position Model

The vehicle position consists of:

```text
positionX
positionY
```

Where:

```text
positionX = lane center
positionY = road.bottomY - startOffsetFromBottom
```

No hardcoded X coordinate should exist anywhere in the application.

---

# Lane Selection

## Default Rule

For an odd number of lanes:

```text
Use the true center lane.
```

Example:

| Lane Count | Start Lane |
| ---------- | ---------: |
| 1          |          0 |
| 3          |          1 |
| 5          |          2 |

---

## Even Lane Rule

Even lane counts have no true center lane.

The default rule is:

```text
Use the left-middle lane.
```

Examples:

| Lane Count | Default Lane |
| ---------- | -----------: |
| 2          |            0 |
| 4          |            1 |
| 6          |            2 |

This produces deterministic behaviour while avoiding ambiguity.

---

# Lane Geometry

The X coordinate is calculated from lane geometry.

```ts
positionX = getLaneCenterX(road, laneIndex);
```

The renderer must never calculate lane centers.

The Road domain owns lane geometry.

---

# Vertical Spawn Position

The Y coordinate is calculated from the bottom of the road.

```text
positionY = road.bottomY - startOffsetFromBottom
```

Default:

```ts
DEFAULT_START_OFFSET_FROM_BOTTOM = 300;
```

Advantages:

- Works with different canvas heights.
- Works after resize.
- Works with future camera systems.
- Avoids magic numbers.

---

# Explicit Overrides

The factory supports controlled overrides.

```ts
interface CreateInitialCarOptions {
  startLaneIndex?: number;
  startOffsetFromBottom?: number;

  positionX?: number;
  positionY?: number;
}
```

Priority order:

```text
Explicit position
↓

Lane geometry
↓

Road defaults
```

---

# Validation

The implementation validates:

- Lane index
- Position values
- Offset values

Invalid lane indexes throw a `RangeError`.

Examples:

```text
-1
3 (for a 3-lane road)
1.5
NaN
Infinity
```

---

# Road Ownership

The Road model owns:

```text
laneCount
centerX
width
bottomY
```

The Car factory consumes those values.

Correct flow:

```text
Road
   ↓
Lane geometry
   ↓
Car factory
   ↓
CarState
```

Incorrect flow:

```text
Car factory
      ↓
Hardcoded lane positions
```

---

# Reset Behaviour

The reset operation should always create a completely new car.

Example:

```ts
set({
  car: createInitialCar(state.road),
});
```

This guarantees:

- identical defaults
- deterministic spawning
- no stale runtime state
- repeatable tests

---

# Road Mutation

The factory must never modify the Road.

Correct:

```ts
const car = createInitialCar(road);
```

Incorrect:

```ts
road.centerX += 100;
```

The Road model is treated as immutable input.

---

# Determinism

Given identical:

- Road
- Options

The factory must always produce identical values.

Example:

```ts
createInitialCar(road);
```

and

```ts
createInitialCar(road);
```

must return equal objects with different references.

---

# Testing Strategy

## Positive Tests

Verify:

- Car starts in center lane.
- Car starts inside road boundaries.
- Default Y position is correct.
- Road is not mutated.
- Factory returns a new object.
- Explicit overrides work.

---

## Negative Tests

Verify:

- Invalid lane index throws.
- Invalid offset throws.
- NaN position throws.
- Infinite position throws.

---

## Edge Cases

Verify:

### One lane

```text
Lane 0
```

### Two lanes

```text
Lane 0
```

(left-middle rule)

### Three lanes

```text
Lane 1
```

(center lane)

### Four lanes

```text
Lane 1
```

(left-middle rule)

### Custom offset

```text
road.bottomY - offset
```

---

# Acceptance Criteria

This task is complete when:

- Car starts inside the road.
- Car starts on a valid lane center.
- Default lane follows documented rules.
- Position is derived from Road geometry.
- No hardcoded X coordinate exists.
- Reset uses the same factory.
- Invalid lane indexes are rejected.
- Unit tests cover one-, two-, and three-lane roads.
- Road model remains immutable.

---

# Traceability

| Requirement       | Implementation          |
| ----------------- | ----------------------- |
| Spawn inside lane | `getLaneCenterX()`      |
| Spawn near bottom | `road.bottomY - offset` |
| Deterministic     | Factory defaults        |
| Reset support     | `createInitialCar()`    |
| Road-aware        | Road model              |
| Lane-aware        | Lane geometry           |

---

# Future Evolution

The current spawning algorithm is designed to support future features without modification to the core API.

Future enhancements may include:

- Scenario-specific spawn locations
- AI traffic spawn points
- Parking bay spawn positions
- Checkpoint spawning
- Replay restoration
- Multiplayer spawn allocation
- Randomized spawn policies
- Mission-based spawn rules

Because spawning is centralized in a single factory, these capabilities can be introduced without changing rendering, physics, controls, or AI systems.

---

# Engineering Lessons Learned

## Separate Geometry from State

The Road model owns geometry.

The Car model owns runtime state.

Keeping these concerns separate prevents duplication and inconsistencies.

---

## Factories Create Consistency

A single factory guarantees:

- identical defaults
- consistent reset behaviour
- easier testing
- lower maintenance cost

Without a factory, different parts of the application tend to construct objects differently over time.

---

## Derive, Don't Duplicate

The X coordinate should always be **derived** from lane geometry.

Hardcoded positions eventually drift away from the Road model as features evolve.

Using derived values ensures that rendering, physics, AI, and collision systems all agree on the same world representation.

---

## Design for Tomorrow

Although Phase 1 supports only a straight road, the spawning API already supports future road types.

Curved roads, intersections, parking lots, highways, and scenario editors can reuse the same factory by supplying different Road models and spawn options rather than introducing new spawning implementations.
