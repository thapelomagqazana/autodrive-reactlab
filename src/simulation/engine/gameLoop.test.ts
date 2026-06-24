import { describe, expect, it, vi } from "vitest";
import { createGameLoop, type GameLoopScheduler } from "./gameLoop";

function createMockScheduler() {
  const callbacks: FrameRequestCallback[] = [];

  const scheduler: GameLoopScheduler = {
    requestFrame: vi.fn((callback: FrameRequestCallback) => {
      callbacks.push(callback);
      return callbacks.length;
    }),
    cancelFrame: vi.fn(),
  };

  const runNextFrame = (timestampMs: number) => {
    const callback = callbacks.shift();

    if (!callback) {
      throw new Error("No frame callback scheduled.");
    }

    callback(timestampMs);
  };

  return {
    scheduler,
    runNextFrame,
  };
}

describe("createGameLoop delta time", () => {
  it("passes zero delta time on the first frame", () => {
    const { scheduler, runNextFrame } = createMockScheduler();
    const update = vi.fn();

    const loop = createGameLoop({ scheduler });

    loop.start({ update, render: vi.fn() });
    runNextFrame(1000);

    expect(update).toHaveBeenCalledWith({
      timestampMs: 1000,
      deltaTimeSeconds: 0,
    });
  });

  it("calculates delta time in seconds", () => {
    const { scheduler, runNextFrame } = createMockScheduler();
    const update = vi.fn();

    const loop = createGameLoop({ scheduler });

    loop.start({ update, render: vi.fn() });
    runNextFrame(1000);
    runNextFrame(1016.67);

    const lastTick = update.mock.calls.at(-1)?.[0];

    expect(lastTick.timestampMs).toBe(1016.67);
    expect(lastTick.deltaTimeSeconds).toBeCloseTo(0.01667);
  });

  it("caps large delta time jumps", () => {
    const { scheduler, runNextFrame } = createMockScheduler();
    const update = vi.fn();

    const loop = createGameLoop({
      scheduler,
      maxDeltaTimeSeconds: 0.1,
    });

    loop.start({ update, render: vi.fn() });
    runNextFrame(1000);
    runNextFrame(5000);

    expect(update).toHaveBeenLastCalledWith({
      timestampMs: 5000,
      deltaTimeSeconds: 0.1,
    });
  });

  it("uses default max delta time when configured value is invalid", () => {
    const { scheduler, runNextFrame } = createMockScheduler();
    const update = vi.fn();

    const loop = createGameLoop({
      scheduler,
      maxDeltaTimeSeconds: 0,
    });

    loop.start({ update, render: vi.fn() });
    runNextFrame(1000);
    runNextFrame(5000);

    expect(update).toHaveBeenLastCalledWith({
      timestampMs: 5000,
      deltaTimeSeconds: 0.1,
    });
  });

  it("resets timing after stop and restart", () => {
    const { scheduler, runNextFrame } = createMockScheduler();
    const update = vi.fn();

    const loop = createGameLoop({ scheduler });

    loop.start({ update, render: vi.fn() });
    runNextFrame(1000);

    loop.stop();

    loop.start({ update, render: vi.fn() });
    runNextFrame(5000);

    expect(update).toHaveBeenLastCalledWith({
      timestampMs: 5000,
      deltaTimeSeconds: 0,
    });
  });

  it("handles non-increasing timestamps safely", () => {
    const { scheduler, runNextFrame } = createMockScheduler();
    const update = vi.fn();

    const loop = createGameLoop({ scheduler });

    loop.start({ update, render: vi.fn() });
    runNextFrame(1000);
    runNextFrame(900);

    expect(update).toHaveBeenLastCalledWith({
      timestampMs: 900,
      deltaTimeSeconds: 0,
    });
  });
});