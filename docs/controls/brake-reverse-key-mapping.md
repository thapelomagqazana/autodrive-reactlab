# Brake and Reverse Key Mapping

## Purpose

Brake and reverse key mapping converts backward-driving keyboard input into one normalized control intent:

```ts
isBrakeOrReversePressed: true;
```

The keyboard hook must not decide whether the vehicle should brake or reverse.

That decision belongs in the physics layer because only physics knows the current vehicle speed.

---

# Scope

This document covers **Phase 1.8.3 — Map ArrowDown / S to Brake and Reverse**.

This phase maps:

```txt
ArrowDown
S
s
```

to:

```ts
isBrakeOrReversePressed: true;
```

It does **not** implement:

```txt
Braking physics
Reverse acceleration physics
Speed-based behaviour
Canvas rendering
Game-loop updates
CarState mutation
```

---

# File Location

```txt
src/hooks/useKeyboardControls.ts
```

Related tests:

```txt
src/hooks/useKeyboardControls.test.tsx
```

---

# Public Output

The hook returns:

```ts
CarPhysicsInput;
```

With backward-driving intent represented as:

```ts
isBrakeOrReversePressed: boolean;
```

---

# Why Not `isBraking`?

A backward key can mean two different things:

```txt
If speed > 0:
  brake

If speed <= 0:
  reverse
```

The keyboard hook does not know `car.speed`.

Therefore the hook should not expose:

```ts
isBraking;
```

as a final decision.

Instead it exposes intent:

```ts
isBrakeOrReversePressed;
```

---

# Physics Responsibility

Physics later decides:

```txt
if car.speed > 0:
  apply braking

if car.speed <= 0:
  apply reverse acceleration
```

This keeps keyboard input decoupled from vehicle state.

---

# Key Mapping

Recommended key codes:

```txt
ArrowDown -> brake / reverse intent
KeyS      -> brake / reverse intent
```

Use:

```ts
event.code;
```

instead of:

```ts
event.key;
```

Reason:

```txt
event.code identifies the physical key.
event.key can vary by layout or casing.
```

Both lowercase `s` and uppercase `S` are represented by:

```txt
KeyS
```

---

# Held-Key Rule

Brake/reverse intent remains active while at least one backward-driving key is held.

Example:

```txt
ArrowDown down -> intent true
S down         -> intent true
ArrowDown up   -> intent still true because S is held
S up           -> intent false
```

---

# Recommended Key Set

```ts
const BRAKE_OR_REVERSE_KEYS = new Set(["ArrowDown", "KeyS"]);
```

---

# Recommended State Model

Track currently pressed keys:

```ts
export interface KeyboardControlState {
  pressedCodes: ReadonlySet<string>;
}
```

Then derive intent:

```ts
const isBrakeOrReversePressed = hasAnyPressedKey(
  keyboardState.pressedCodes,
  BRAKE_OR_REVERSE_KEYS,
);
```

---

# Conflict with Acceleration

Recommended MVP conflict rule:

```txt
Accelerate + Brake/Reverse = neutral throttle direction
```

Meaning:

```ts
isAccelerating: false;
isBrakeOrReversePressed: false;
```

Implementation:

```ts
createCarPhysicsInput({
  isAccelerating: isAcceleratingPressed && !isBrakeOrReversePressed,

  isBrakeOrReversePressed: isBrakeOrReversePressed && !isAcceleratingPressed,
});
```

This avoids impossible forward and backward commands at the same time.

---

# Repeated Keydown Rule

Browsers repeatedly fire `keydown` while a key is held.

Repeated events should not break state:

```ts
if (event.repeat) {
  return;
}
```

The held-key set remains authoritative.

---

# Key Release Rule

Releasing a backward key removes only that key from the pressed-key set.

It must not clear intent if another backward key is still held.

Correct:

```txt
ArrowDown + S held
ArrowDown released
intent remains true
```

Incorrect:

```txt
ArrowDown + S held
ArrowDown released
intent becomes false
```

---

# Window Blur Rule

Window blur should clear all pressed keys.

Reason:

```txt
If the browser loses focus while ArrowDown or S is held,
the keyup event may never fire.
```

This prevents stuck brake/reverse input.

---

# Hook Non-Responsibilities

`useKeyboardControls()` must not:

```txt
Read car.speed
Decide braking versus reversing
Call updateCarPhysics()
Mutate CarState
Read Zustand directly
Start the game loop
Draw to canvas
```

---

# Normalization Flow

```txt
KeyboardEvent
    ↓
pressedCodes
    ↓
isBrakeOrReversePressed
    ↓
CarPhysicsInput
    ↓
Physics decides brake or reverse from car.speed
```

---

# Testing Strategy

## Positive Tests

Verify:

```txt
ArrowDown activates brake/reverse intent.
KeyS activates brake/reverse intent.
Intent remains true while key is held.
```

---

## Release Tests

Verify:

```txt
Releasing ArrowDown clears intent if no other backward key is held.
Releasing KeyS clears intent if no other backward key is held.
Releasing ArrowDown does not clear intent if KeyS is still held.
Releasing KeyS does not clear intent if ArrowDown is still held.
```

---

## Repeat Tests

Verify:

```txt
Repeated ArrowDown keydown is safe.
Repeated KeyS keydown is safe.
```

---

## Blur Tests

Verify:

```txt
Window blur clears brake/reverse intent.
```

---

## Coupling Tests

Verify:

```txt
Hook output does not contain speed.
Hook does not decide brake versus reverse.
Hook exposes only normalized intent.
```

---

# Acceptance Criteria

This task is complete when:

```txt
ArrowDown activates brake/reverse intent.
S activates brake/reverse intent.
Releasing ArrowDown clears intent if no other brake/reverse key is held.
Releasing S clears intent if no other brake/reverse key is held.
Hook does not decide vehicle speed logic.
Physics layer decides brake versus reverse.
Tests verify ArrowDown and S behaviour.
```

---

# Traceability KPI

```txt
Brake/reverse intent is captured without coupling keyboard hook to car speed.
```

Success means:

```txt
No keyboard-control code reads car.speed.
```

---

# Engineering Lessons Learned

## Input Is Intent

Keyboard input should describe what the user wants.

It should not decide how the vehicle behaves.

---

## Speed-Based Behaviour Belongs in Physics

Only physics should decide:

```txt
brake
reverse
coast
accelerate
```

because physics owns current speed.

---

## Use One Intent for Backward Keys

A single field keeps the model clean:

```ts
isBrakeOrReversePressed;
```

This avoids premature decisions and keeps future braking/reverse behaviour flexible.

---

# Future Evolution

This design prepares the simulator for:

```txt
Braking physics
Reverse acceleration
Brake lights
Reverse lights
ABS
Parking behaviour
Gamepad triggers
Touch brake controls
AI reverse manoeuvres
Replay input
```

The stable rule remains:

```txt
Backward-driving keys create intent.
Physics decides behaviour.
```
