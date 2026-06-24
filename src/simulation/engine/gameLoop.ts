/**
 * Browser game loop module for AutoDrive ReactLab.
 *
 * This module owns loop lifecycle only.
 *
 * Responsibilities:
 * - start the browser animation loop
 * - prevent duplicate loops
 * - schedule frames with requestAnimationFrame
 * - calculate safe delta time
 * - execute update/render callbacks
 *
 * Non-responsibilities:
 * - no React
 * - no Zustand
 * - no physics
 * - no AI
 * - no rendering details
 */

export interface GameLoopTick {
  timestampMs: number;
  deltaTimeSeconds: number;
}

export interface GameLoopCallbacks {
  update: (tick: GameLoopTick) => void;
  render: (tick: GameLoopTick) => void;
}

export interface GameLoopScheduler {
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (frameId: number) => void;
}

export interface GameLoopOptions {
  scheduler?: GameLoopScheduler;
  maxDeltaTimeSeconds?: number;
}

export interface GameLoopController {
  start: (callbacks: GameLoopCallbacks) => void;
  stop: () => void;
  isRunning: () => boolean;
}

const DEFAULT_MAX_DELTA_TIME_SECONDS = 0.1;

function createBrowserScheduler(): GameLoopScheduler {
  return {
    requestFrame: window.requestAnimationFrame.bind(window),
    cancelFrame: window.cancelAnimationFrame.bind(window),
  };
}

function normalizeMaxDeltaTime(value: number | undefined): number {
  if (!Number.isFinite(value) || value === undefined || value <= 0) {
    return DEFAULT_MAX_DELTA_TIME_SECONDS;
  }

  return value;
}

function calculateDeltaTimeSeconds(
  previousTimestampMs: number | null,
  currentTimestampMs: number,
  maxDeltaTimeSeconds: number,
): number {
  if (previousTimestampMs === null || !Number.isFinite(currentTimestampMs)) {
    return 0;
  }

  const rawDeltaSeconds = (currentTimestampMs - previousTimestampMs) / 1000;

  if (!Number.isFinite(rawDeltaSeconds) || rawDeltaSeconds <= 0) {
    return 0;
  }

  return Math.min(rawDeltaSeconds, maxDeltaTimeSeconds);
}

export function createGameLoop(options: GameLoopOptions = {}): GameLoopController {
  const scheduler = options.scheduler ?? createBrowserScheduler();
  const maxDeltaTimeSeconds = normalizeMaxDeltaTime(options.maxDeltaTimeSeconds);

  let running = false;
  let frameId: number | null = null;
  let previousTimestampMs: number | null = null;

  function resetTiming(): void {
    previousTimestampMs = null;
  }

  function scheduleNextFrame(callbacks: GameLoopCallbacks): void {
    frameId = scheduler.requestFrame((timestampMs) => {
      if (!running) {
        return;
      }

      const deltaTimeSeconds = calculateDeltaTimeSeconds(
        previousTimestampMs,
        timestampMs,
        maxDeltaTimeSeconds,
      );

      previousTimestampMs = Number.isFinite(timestampMs) ? timestampMs : null;

      const tick: GameLoopTick = {
        timestampMs,
        deltaTimeSeconds,
      };

      callbacks.update(tick);
      callbacks.render(tick);

      scheduleNextFrame(callbacks);
    });
  }

  /**
   * Starts or resumes the animation loop.
   *
   * Calling start repeatedly while running is safe and does not create
   * duplicate requestAnimationFrame loops.
   */
  function start(callbacks: GameLoopCallbacks): void {
    if (running) {
      return;
    }

    running = true;
    resetTiming();
    scheduleNextFrame(callbacks);
  }

  function stop(): void {
    if (!running && frameId === null) {
      return;
    }

    running = false;

    if (frameId !== null) {
      scheduler.cancelFrame(frameId);
      frameId = null;
    }

    resetTiming();
  }

  function isRunning(): boolean {
    return running;
  }

  return {
    start,
    stop,
    isRunning,
  };
}