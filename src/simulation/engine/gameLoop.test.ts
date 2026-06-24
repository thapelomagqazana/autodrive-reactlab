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

  it("stops the loop and cancels the pending frame", () => {
    const { scheduler } = createMockScheduler();
    const loop = createGameLoop({ scheduler });

    loop.start({
      update: vi.fn(),
      render: vi.fn(),
    });

    loop.stop();

    expect(loop.isRunning()).toBe(false);
    expect(scheduler.cancelFrame).toHaveBeenCalledWith(1);
  });

  it("allows stop before start", () => {
    const { scheduler } = createMockScheduler();
    const loop = createGameLoop({ scheduler });

    expect(() => loop.stop()).not.toThrow();
    expect(loop.isRunning()).toBe(false);
    expect(scheduler.cancelFrame).not.toHaveBeenCalled();
  });

  it("allows stop to be called multiple times", () => {
    const { scheduler } = createMockScheduler();
    const loop = createGameLoop({ scheduler });

    loop.start({
      update: vi.fn(),
      render: vi.fn(),
    });

    expect(() => {
      loop.stop();
      loop.stop();
      loop.stop();
    }).not.toThrow();

    expect(scheduler.cancelFrame).toHaveBeenCalledTimes(1);
  });

  it("does not continue after stop", () => {
    const { scheduler, runNextFrame } = createMockScheduler();
    const update = vi.fn();
    const render = vi.fn();

    const loop = createGameLoop({ scheduler });

    loop.start({ update, render });
    loop.stop();

    runNextFrame(1000);

    expect(update).not.toHaveBeenCalled();
    expect(render).not.toHaveBeenCalled();
    expect(scheduler.requestFrame).toHaveBeenCalledTimes(1);
  });

  it("resumes with safe first-frame delta after stop", () => {
    const { scheduler, runNextFrame } = createMockScheduler();
    const update = vi.fn();

    const loop = createGameLoop({ scheduler });

    loop.start({ update, render: vi.fn() });
    runNextFrame(1000);

    loop.stop();

    loop.start({ update, render: vi.fn() });
    runNextFrame(9000);

    expect(update).toHaveBeenLastCalledWith({
      timestampMs: 9000,
      deltaTimeSeconds: 0,
    });
  });

  it("does not report FPS before the sampling interval", () => {
    const { scheduler, runNextFrame } = createMockScheduler();
    const onFps = vi.fn();

    const loop = createGameLoop({
      scheduler,
      fpsSampleIntervalMs: 1000,
    });

    loop.start({
      update: vi.fn(),
      render: vi.fn(),
      onFps,
    });

    runNextFrame(0);
    runNextFrame(250);
    runNextFrame(500);
    runNextFrame(750);

    expect(onFps).not.toHaveBeenCalled();
  });

  it("reports FPS after the sampling interval", () => {
    const { scheduler, runNextFrame } = createMockScheduler();
    const onFps = vi.fn();

    const loop = createGameLoop({
      scheduler,
      fpsSampleIntervalMs: 1000,
    });

    loop.start({
      update: vi.fn(),
      render: vi.fn(),
      onFps,
    });

    runNextFrame(0);
    runNextFrame(250);
    runNextFrame(500);
    runNextFrame(750);
    runNextFrame(1000);

    expect(onFps).toHaveBeenCalledWith(5);
  });

  it("resets FPS counters after reporting", () => {
    const { scheduler, runNextFrame } = createMockScheduler();
    const onFps = vi.fn();

    const loop = createGameLoop({
      scheduler,
      fpsSampleIntervalMs: 1000,
    });

    loop.start({
      update: vi.fn(),
      render: vi.fn(),
      onFps,
    });

    runNextFrame(0);
    runNextFrame(500);
    runNextFrame(1000);

    runNextFrame(1500);
    runNextFrame(2000);

    expect(onFps).toHaveBeenCalledTimes(2);
  });

  it("does not report FPS after stop", () => {
    const { scheduler, runNextFrame } = createMockScheduler();
    const onFps = vi.fn();

    const loop = createGameLoop({
      scheduler,
      fpsSampleIntervalMs: 1000,
    });

    loop.start({
      update: vi.fn(),
      render: vi.fn(),
      onFps,
    });

    loop.stop();

    runNextFrame(2000);

    expect(onFps).not.toHaveBeenCalled();
  });

  it("uses the default FPS interval when configured interval is invalid", () => {
    const { scheduler, runNextFrame } = createMockScheduler();
    const onFps = vi.fn();

    const loop = createGameLoop({
      scheduler,
      fpsSampleIntervalMs: 0,
    });

    loop.start({
      update: vi.fn(),
      render: vi.fn(),
      onFps,
    });

    runNextFrame(0);
    runNextFrame(999);

    expect(onFps).not.toHaveBeenCalled();

    runNextFrame(1000);

    expect(onFps).toHaveBeenCalled();
  });
});
