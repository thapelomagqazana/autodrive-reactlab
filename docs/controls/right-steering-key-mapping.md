# Right Steering Key Mapping

## Purpose

Right steering key mapping converts right-turn keyboard input into normalized steering intent:

```ts
steeringInput: 1;
```

The keyboard hook does not rotate the car directly.

It only communicates right-steering intent to the physics layer.

---

# Scope

This document covers **Phase 1.8.5 — Map ArrowRight / D to Steer Right**.

This phase maps:

```txt
ArrowRight
D
d
```

to:

```ts
steeringInput = 1;
```

It does **not** implement:

```txt
Steering physics
Heading updates
Position updates
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

With steering represented as:

```ts
steeringInput: number;
```

---

# Steering Convention

```txt
-1 = full left
 0 = no steering intent
 1 = full right
```

Therefore right steering must always map to:

```txt
1
```

---

# Key Mapping

Recommended key codes:

```txt
ArrowRight -> right steering
KeyD       -> right steering
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
event.key can vary by keyboard layout or casing.
```

Both lowercase `d` and uppercase `D` are represented by:

```txt
KeyD
```

---

# Recommended Key Set

```ts
const RIGHT_KEYS = new Set(["ArrowRight", "KeyD"]);
```

---

# Held-Key Rule

Right steering remains active while at least one right key is held.

Example:

```txt
ArrowRight down -> steeringInput = 1
D down          -> steeringInput = 1
ArrowRight up   -> steeringInput still 1 because D is held
D up            -> steeringInput = 0
```

This prevents one right-key release from clearing right steering while another right key remains pressed.

---

# Opposing Steering Rule

If left and right steering are both active:

```txt
left + right = neutral steering
```

Output:

```ts
steeringInput: 0;
```

This is deterministic and avoids impossible steering intent.

---

# Recommended Resolver

```ts
function resolveSteeringInput(pressedCodes: ReadonlySet<string>): number {
  const isLeftPressed = hasAnyPressedKey(pressedCodes, LEFT_KEYS);

  const isRightPressed = hasAnyPressedKey(pressedCodes, RIGHT_KEYS);

  if (isLeftPressed && !isRightPressed) {
    return -1;
  }

  if (isRightPressed && !isLeftPressed) {
    return 1;
  }

  return 0;
}
```

---

# Why a Set Is Better Than a Boolean

A boolean such as:

```ts
isRightPressed: boolean;
```

is not enough when multiple keys map to the same command.

Problem:

```txt
ArrowRight down -> true
D down          -> true
ArrowRight up   -> false, even though D is still held
```

Better model:

```ts
pressedCodes: Set<string>;
```

Then the hook can ask:

```txt
Is any right key currently held?
```

---

# Repeated Keydown Rule

Browsers emit repeated keydown events when a key is held.

The hook should ignore repeated keydown events:

```ts
if (event.repeat) {
  return;
}
```

This avoids unnecessary state updates.

---

# Key Release Rule

Releasing a right key removes only that key from the pressed-key set.

It must not clear right steering if another right key remains held.

Correct:

```txt
ArrowRight + D held
ArrowRight released
steeringInput remains 1
```

Incorrect:

```txt
ArrowRight + D held
ArrowRight released
steeringInput becomes 0
```

---

# Window Blur Rule

Window blur clears all pressed keys.

Reason:

```txt
If the tab loses focus while ArrowRight or D is held,
the keyup event may never fire.
```

This prevents stuck steering.

---

# Hook Non-Responsibilities

`useKeyboardControls()` must not:

```txt
Mutate CarState
Update car.angle
Update car.steeringAngle
Update car.positionX
Run updateCarPhysics()
Read canvas context
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
resolveSteeringInput()
    ↓
steeringInput = 1
    ↓
CarPhysicsInput
    ↓
Physics converts steering intent into steering angle
```

---

# Testing Strategy

## Positive Tests

Verify:

```txt
ArrowRight sets steeringInput to 1.
KeyD sets steeringInput to 1.
Right steering remains active while key is held.
```

---

## Release Tests

Verify:

```txt
Releasing ArrowRight clears steering if no other right key is held.
Releasing KeyD clears steering if no other right key is held.
Releasing ArrowRight does not clear steering if KeyD is still held.
Releasing KeyD does not clear steering if ArrowRight is still held.
```

---

## Opposing-Key Tests

Verify:

```txt
ArrowRight + ArrowLeft resolves to 0.
KeyD + KeyA resolves to 0.
Right + left conflict is deterministic.
Releasing right while left remains held returns steeringInput = -1.
```

---

## Repeat Tests

Verify:

```txt
Repeated ArrowRight keydown is safe.
Repeated KeyD keydown is safe.
```

---

## Blur Tests

Verify:

```txt
Window blur clears right steering.
```

---

# Acceptance Criteria

This task is complete when:

```txt
ArrowRight contributes right steering.
D contributes right steering.
Right-only input returns steeringInput = 1.
Left + right input returns steeringInput = 0.
Releasing right key updates steering correctly.
Tests verify ArrowRight, D, and opposing-key behaviour.
```

---

# Traceability KPI

```txt
Right steering always maps to normalized positive input.
```

Success means:

```txt
No keyboard code directly changes car position, steering angle, or heading for right turns.
```

---

# Engineering Lessons Learned

## Right Is Intent, Not Movement

Pressing right should not move the car right.

It should only express right steering intent.

Physics decides whether and how that intent changes steering angle, heading, and position.

---

## Opposing Inputs Need a Rule

Without a clear rule, pressing left and right together can cause unstable or last-event-wins behaviour.

Neutral cancellation is simple and predictable.

---

## Held-Key State Is More Reliable Than Events

Keyboard events are transitions.

Driving controls need state.

That is why the hook tracks currently pressed keys.

---

# Future Evolution

This mapping prepares the simulator for:

```txt
Custom key bindings
Gamepad analog steering
Touch steering controls
AI steering input
Replay steering input
Accessibility remapping
```

The stable rule remains:

```txt
Right steering becomes steeringInput = 1.
```
