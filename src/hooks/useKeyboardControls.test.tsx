import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useKeyboardControls } from "./useKeyboardControls";

function keyDown(code: string, repeat = false) {
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      code,
      repeat,
      bubbles: true,
      cancelable: true,
    }),
  );
}

function keyUp(code: string) {
  window.dispatchEvent(
    new KeyboardEvent("keyup", {
      code,
      bubbles: true,
      cancelable: true,
    }),
  );
}

function blurWindow() {
  window.dispatchEvent(new Event("blur"));
}

describe("useKeyboardControls", () => {
  it("returns neutral physics input by default", () => {
    const { result } = renderHook(() => useKeyboardControls());

    expect(result.current).toEqual({
      isAccelerating: false,
      isOffRoad: false,
      isBrakeOrReversePressed: false,
      steeringInput: 0,
    });
  });

  it("maps ArrowUp to acceleration", () => {
    const { result } = renderHook(() => useKeyboardControls());

    act(() => {
      keyDown("ArrowUp");
    });

    expect(result.current.isAccelerating).toBe(true);
    expect(result.current.isBrakeOrReversePressed).toBe(false);
  });

  it("maps ArrowDown to braking", () => {
    const { result } = renderHook(() => useKeyboardControls());

    act(() => {
      keyDown("ArrowDown");
    });

    expect(result.current.isBrakeOrReversePressed).toBe(true);
    expect(result.current.isAccelerating).toBe(false);
  });

  it("maps left and right steering to normalized input", () => {
    const { result } = renderHook(() => useKeyboardControls());

    act(() => {
      keyDown("ArrowLeft");
    });

    expect(result.current.steeringInput).toBe(-1);

    act(() => {
      keyUp("ArrowLeft");
      keyDown("ArrowRight");
    });

    expect(result.current.steeringInput).toBe(1);
  });

  it("resolves opposite steering keys to neutral", () => {
    const { result } = renderHook(() => useKeyboardControls());

    act(() => {
      keyDown("ArrowLeft");
      keyDown("ArrowRight");
    });

    expect(result.current.steeringInput).toBe(0);
  });

  it("clears input on key release", () => {
    const { result } = renderHook(() => useKeyboardControls());

    act(() => {
      keyDown("ArrowUp");
      keyDown("ArrowLeft");
    });

    expect(result.current.isAccelerating).toBe(true);
    expect(result.current.steeringInput).toBe(-1);

    act(() => {
      keyUp("ArrowUp");
      keyUp("ArrowLeft");
    });

    expect(result.current).toEqual({
      isAccelerating: false,
      isOffRoad: false,
      isBrakeOrReversePressed: false,
      steeringInput: 0,
    });
  });

  it("clears all input on window blur", () => {
    const { result } = renderHook(() => useKeyboardControls());

    act(() => {
      keyDown("ArrowUp");
      keyDown("ArrowRight");
    });

    expect(result.current.isAccelerating).toBe(true);
    expect(result.current.steeringInput).toBe(1);

    act(() => {
      blurWindow();
    });

    expect(result.current).toEqual({
      isAccelerating: false,
      isOffRoad: false,
      isBrakeOrReversePressed: false,
      steeringInput: 0,
    });
  });

  it("ignores repeated keydown events", () => {
    const { result } = renderHook(() => useKeyboardControls());

    act(() => {
      keyDown("ArrowUp");
      keyDown("ArrowUp", true);
    });

    expect(result.current.isAccelerating).toBe(true);
  });

  it("ignores untracked keys", () => {
    const { result } = renderHook(() => useKeyboardControls());

    act(() => {
      keyDown("Space");
    });

    expect(result.current).toEqual({
      isAccelerating: false,
      isOffRoad: false,
      isBrakeOrReversePressed: false,
      steeringInput: 0,
    });
  });

  it("removes event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useKeyboardControls());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("keyup", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("blur", expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});

it("maps ArrowUp to acceleration while held", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("ArrowUp");
  });

  expect(result.current.isAccelerating).toBe(true);

  act(() => {
    keyUp("ArrowUp");
  });

  expect(result.current.isAccelerating).toBe(false);
});

it("maps W to acceleration while held", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("KeyW");
  });

  expect(result.current.isAccelerating).toBe(true);

  act(() => {
    keyUp("KeyW");
  });

  expect(result.current.isAccelerating).toBe(false);
});

it("keeps acceleration active when one of multiple acceleration keys is released", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("ArrowUp");
    keyDown("KeyW");
  });

  expect(result.current.isAccelerating).toBe(true);

  act(() => {
    keyUp("ArrowUp");
  });

  expect(result.current.isAccelerating).toBe(true);

  act(() => {
    keyUp("KeyW");
  });

  expect(result.current.isAccelerating).toBe(false);
});

it("handles repeated acceleration keydown safely", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("ArrowUp");
    keyDown("ArrowUp", true);
  });

  expect(result.current.isAccelerating).toBe(true);

  act(() => {
    keyUp("ArrowUp");
  });

  expect(result.current.isAccelerating).toBe(false);
});

it("maps ArrowDown to brake or reverse intent while held", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("ArrowDown");
  });

  expect(result.current.isBrakeOrReversePressed).toBe(true);

  act(() => {
    keyUp("ArrowDown");
  });

  expect(result.current.isBrakeOrReversePressed).toBe(false);
});

it("maps S to brake or reverse intent while held", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("KeyS");
  });

  expect(result.current.isBrakeOrReversePressed).toBe(true);

  act(() => {
    keyUp("KeyS");
  });

  expect(result.current.isBrakeOrReversePressed).toBe(false);
});

it("keeps brake or reverse intent active when one of multiple backward keys is released", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("ArrowDown");
    keyDown("KeyS");
  });

  expect(result.current.isBrakeOrReversePressed).toBe(true);

  act(() => {
    keyUp("ArrowDown");
  });

  expect(result.current.isBrakeOrReversePressed).toBe(true);

  act(() => {
    keyUp("KeyS");
  });

  expect(result.current.isBrakeOrReversePressed).toBe(false);
});

it("handles repeated brake or reverse keydown safely", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("ArrowDown");
    keyDown("ArrowDown", true);
  });

  expect(result.current.isBrakeOrReversePressed).toBe(true);

  act(() => {
    keyUp("ArrowDown");
  });

  expect(result.current.isBrakeOrReversePressed).toBe(false);
});

it("does not decide brake versus reverse from speed inside the keyboard hook", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("KeyS");
  });

  expect(result.current).toMatchObject({
    isBrakeOrReversePressed: true,
  });

  expect("speed" in result.current).toBe(false);
});

it("maps ArrowLeft to left steering while held", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("ArrowLeft");
  });

  expect(result.current.steeringInput).toBe(-1);

  act(() => {
    keyUp("ArrowLeft");
  });

  expect(result.current.steeringInput).toBe(0);
});

it("maps A to left steering while held", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("KeyA");
  });

  expect(result.current.steeringInput).toBe(-1);

  act(() => {
    keyUp("KeyA");
  });

  expect(result.current.steeringInput).toBe(0);
});

it("keeps left steering active when one of multiple left keys is released", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("ArrowLeft");
    keyDown("KeyA");
  });

  expect(result.current.steeringInput).toBe(-1);

  act(() => {
    keyUp("ArrowLeft");
  });

  expect(result.current.steeringInput).toBe(-1);

  act(() => {
    keyUp("KeyA");
  });

  expect(result.current.steeringInput).toBe(0);
});

it("cancels steering when left and right are both held", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("ArrowLeft");
    keyDown("ArrowRight");
  });

  expect(result.current.steeringInput).toBe(0);
});

it("restores right steering when left is released while right remains held", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("ArrowLeft");
    keyDown("ArrowRight");
  });

  expect(result.current.steeringInput).toBe(0);

  act(() => {
    keyUp("ArrowLeft");
  });

  expect(result.current.steeringInput).toBe(1);
});

it("handles repeated left keydown safely", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("ArrowLeft");
    keyDown("ArrowLeft", true);
  });

  expect(result.current.steeringInput).toBe(-1);

  act(() => {
    keyUp("ArrowLeft");
  });

  expect(result.current.steeringInput).toBe(0);
});

it("maps ArrowRight to right steering while held", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("ArrowRight");
  });

  expect(result.current.steeringInput).toBe(1);

  act(() => {
    keyUp("ArrowRight");
  });

  expect(result.current.steeringInput).toBe(0);
});

it("maps D to right steering while held", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("KeyD");
  });

  expect(result.current.steeringInput).toBe(1);

  act(() => {
    keyUp("KeyD");
  });

  expect(result.current.steeringInput).toBe(0);
});

it("keeps right steering active when one of multiple right keys is released", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("ArrowRight");
    keyDown("KeyD");
  });

  expect(result.current.steeringInput).toBe(1);

  act(() => {
    keyUp("ArrowRight");
  });

  expect(result.current.steeringInput).toBe(1);

  act(() => {
    keyUp("KeyD");
  });

  expect(result.current.steeringInput).toBe(0);
});

it("cancels steering when right and left are both held", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("ArrowRight");
    keyDown("ArrowLeft");
  });

  expect(result.current.steeringInput).toBe(0);
});

it("restores left steering when right is released while left remains held", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("ArrowRight");
    keyDown("ArrowLeft");
  });

  expect(result.current.steeringInput).toBe(0);

  act(() => {
    keyUp("ArrowRight");
  });

  expect(result.current.steeringInput).toBe(-1);
});

it("handles repeated right keydown safely", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("ArrowRight");
    keyDown("ArrowRight", true);
  });

  expect(result.current.steeringInput).toBe(1);

  act(() => {
    keyUp("ArrowRight");
  });

  expect(result.current.steeringInput).toBe(0);
});

it("clears only the released key", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("ArrowUp");
    keyDown("ArrowLeft");
  });

  expect(result.current.isAccelerating).toBe(true);
  expect(result.current.steeringInput).toBe(-1);

  act(() => {
    keyUp("ArrowLeft");
  });

  expect(result.current.isAccelerating).toBe(true);
  expect(result.current.steeringInput).toBe(0);
});

it("keeps acceleration active until all acceleration keys are released", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("KeyW");
    keyDown("ArrowUp");
  });

  expect(result.current.isAccelerating).toBe(true);

  act(() => {
    keyUp("KeyW");
  });

  expect(result.current.isAccelerating).toBe(true);

  act(() => {
    keyUp("ArrowUp");
  });

  expect(result.current.isAccelerating).toBe(false);
});

it("clears all active inputs on window blur", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("KeyW");
    keyDown("ArrowDown");
    keyDown("ArrowLeft");
  });

  act(() => {
    window.dispatchEvent(new Event("blur"));
  });

  expect(result.current).toEqual({
    isAccelerating: false,
    isOffRoad: false,
    isBrakeOrReversePressed: false,
    steeringInput: 0,
  });
});

it("prevents stuck steering after focus loss while key is held", () => {
  const { result } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("ArrowRight");
  });

  expect(result.current.steeringInput).toBe(1);

  act(() => {
    window.dispatchEvent(new Event("blur"));
  });

  expect(result.current.steeringInput).toBe(0);
});

it("removes keyboard and blur listeners on unmount", () => {
  const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

  const { unmount } = renderHook(() => useKeyboardControls());

  unmount();

  expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  expect(removeEventListenerSpy).toHaveBeenCalledWith("keyup", expect.any(Function));
  expect(removeEventListenerSpy).toHaveBeenCalledWith("blur", expect.any(Function));

  removeEventListenerSpy.mockRestore();
});

it("does not keep movement stuck after unmount", () => {
  const { result, unmount } = renderHook(() => useKeyboardControls());

  act(() => {
    keyDown("ArrowUp");
  });

  expect(result.current.isAccelerating).toBe(true);

  unmount();

  act(() => {
    keyUp("ArrowUp");
  });

  expect(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowUp" }));
  }).not.toThrow();
});
