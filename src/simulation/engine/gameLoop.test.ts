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
    scheduledCount: () => callbacks.length,
  };
}

describe("createGameLoop start", () => {
  it("starts the loop and schedules the first frame", () => {
    const { scheduler } = createMockScheduler();
    const loop = createGameLoop({ scheduler });

    loop.start({
      update: vi.fn(),
      render: vi.fn(),
    });

    expect(loop.isRunning()).toBe(true);
    expect(scheduler.requestFrame).toHaveBeenCalledTimes(1);
  });

  it("executes update and render after the first frame runs", () => {
    const { scheduler, runNextFrame } = createMockScheduler();
    const update = vi.fn();
    const render = vi.fn();

    const loop = createGameLoop({ scheduler });

    loop.start({ update, render });
    runNextFrame(1000);

    expect(update).toHaveBeenCalledWith({
      timestampMs: 1000,
      deltaTimeSeconds: 0,
    });

    expect(render).toHaveBeenCalledWith({
      timestampMs: 1000,
      deltaTimeSeconds: 0,
    });
  });

  it("does not create duplicate loops when start is called repeatedly", () => {
    const { scheduler } = createMockScheduler();
    const loop = createGameLoop({ scheduler });

    const callbacks = {
      update: vi.fn(),
      render: vi.fn(),
    };

    loop.start(callbacks);
    loop.start(callbacks);
    loop.start(callbacks);

    expect(loop.isRunning()).toBe(true);
    expect(scheduler.requestFrame).toHaveBeenCalledTimes(1);
  });

  it("schedules one next frame per executed frame", () => {
    const { scheduler, runNextFrame } = createMockScheduler();
    const loop = createGameLoop({ scheduler });

    loop.start({
      update: vi.fn(),
      render: vi.fn(),
    });

    expect(scheduler.requestFrame).toHaveBeenCalledTimes(1);

    runNextFrame(1000);

    expect(scheduler.requestFrame).toHaveBeenCalledTimes(2);
  });

  it("can start again after stop with safe first-frame timing", () => {
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
});