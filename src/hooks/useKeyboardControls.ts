import { useEffect, useMemo, useState } from "react";
import {
  createCarPhysicsInput,
  type CarPhysicsInput,
} from "../simulation/engine/physics";

export interface KeyboardControlState {
  isAcceleratingPressed: boolean;
  isBrakingPressed: boolean;
  isLeftPressed: boolean;
  isRightPressed: boolean;
}

const INITIAL_KEYBOARD_CONTROL_STATE: KeyboardControlState = {
  isAcceleratingPressed: false,
  isBrakingPressed: false,
  isLeftPressed: false,
  isRightPressed: false,
};

const ACCELERATE_KEYS = new Set(["ArrowUp", "KeyW"]);
const BRAKE_KEYS = new Set(["ArrowDown", "KeyS"]);
const LEFT_KEYS = new Set(["ArrowLeft", "KeyA"]);
const RIGHT_KEYS = new Set(["ArrowRight", "KeyD"]);

function isTrackedControlKey(code: string): boolean {
  return (
    ACCELERATE_KEYS.has(code) ||
    BRAKE_KEYS.has(code) ||
    LEFT_KEYS.has(code) ||
    RIGHT_KEYS.has(code)
  );
}

function resolveSteeringInput(state: KeyboardControlState): number {
  if (state.isLeftPressed && !state.isRightPressed) {
    return -1;
  }

  if (state.isRightPressed && !state.isLeftPressed) {
    return 1;
  }

  return 0;
}

function updateControlStateForKey(
  state: KeyboardControlState,
  code: string,
  isPressed: boolean,
): KeyboardControlState {
  if (ACCELERATE_KEYS.has(code)) {
    return { ...state, isAcceleratingPressed: isPressed };
  }

  if (BRAKE_KEYS.has(code)) {
    return { ...state, isBrakingPressed: isPressed };
  }

  if (LEFT_KEYS.has(code)) {
    return { ...state, isLeftPressed: isPressed };
  }

  if (RIGHT_KEYS.has(code)) {
    return { ...state, isRightPressed: isPressed };
  }

  return state;
}

/**
 * Listens to keyboard controls and exposes normalized physics input.
 *
 * Responsibilities:
 * - Convert keyboard state into CarPhysicsInput.
 * - Clear input on key release.
 * - Clear all input on window blur.
 *
 * Non-responsibilities:
 * - Does not mutate car state.
 * - Does not run physics.
 * - Does not draw to canvas.
 * - Does not start or stop the game loop.
 */
export function useKeyboardControls(): CarPhysicsInput {
  const [keyboardState, setKeyboardState] = useState<KeyboardControlState>(
    INITIAL_KEYBOARD_CONTROL_STATE,
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (!isTrackedControlKey(event.code)) {
        return;
      }

      event.preventDefault();

      if (event.repeat) {
        return;
      }

      setKeyboardState((currentState) =>
        updateControlStateForKey(currentState, event.code, true),
      );
    }

    function handleKeyUp(event: KeyboardEvent): void {
      if (!isTrackedControlKey(event.code)) {
        return;
      }

      event.preventDefault();

      setKeyboardState((currentState) =>
        updateControlStateForKey(currentState, event.code, false),
      );
    }

    function handleWindowBlur(): void {
      setKeyboardState(INITIAL_KEYBOARD_CONTROL_STATE);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  return useMemo(
    () =>
      createCarPhysicsInput({
        isAccelerating:
          keyboardState.isAcceleratingPressed && !keyboardState.isBrakingPressed,

        isBraking: keyboardState.isBrakingPressed && !keyboardState.isAcceleratingPressed,

        steeringInput: resolveSteeringInput(keyboardState),
      }),
    [keyboardState],
  );
}
