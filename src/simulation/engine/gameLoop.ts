/**
 * Browser game loop module for AutoDrive ReactLab.
 *
 * Responsibilities:
 * - Schedule frames using requestAnimationFrame.
 * - Execute update and render callbacks.
 * - Store and cancel the active animation frame ID.
 * - Prevent duplicate active loops.
 * - Keep loop lifecycle independent from React and simulation domain logic.
 *
 * Non-responsibilities:
 * - No React.
 * - No Zustand.
 * - No canvas drawing.
 * - No vehicle physics.
 * - No AI decisions.
 * - No collision detection.
 */

export interface GameLoopTick {
  /**
   * Current frame timestamp from requestAnimationFrame.
   */
  timestampMs: number;
}

export interface GameLoopCallbacks {
  /**
   * Runs simulation update work once per frame.
   */
  update: (tick: GameLoopTick) => void;

  /**
   * Runs rendering work once per frame.
   */
  render: (tick: GameLoopTick) => void;
}

export interface GameLoopScheduler {
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (frameId: number) => void;
}

export interface GameLoopController {
  start: (callbacks: GameLoopCallbacks) => void;
  stop: () => void;
  isRunning: () => boolean;
}

function createBrowserScheduler(): GameLoopScheduler {
  return {
    requestFrame: window.requestAnimationFrame.bind(window),
    cancelFrame: window.cancelAnimationFrame.bind(window),
  };
}

/**
 * Creates a reusable requestAnimationFrame-based game loop.
 */
export function createGameLoop(
  scheduler: GameLoopScheduler = createBrowserScheduler(),
): GameLoopController {
  let running = false;
  let frameId: number | null = null;

  function scheduleNextFrame(callbacks: GameLoopCallbacks): void {
    frameId = scheduler.requestFrame((timestampMs) => {
      if (!running) {
        return;
      }

      const tick: GameLoopTick = {
        timestampMs,
      };

      callbacks.update(tick);
      callbacks.render(tick);

      scheduleNextFrame(callbacks);
    });
  }

  function start(callbacks: GameLoopCallbacks): void {
    if (running) {
      return;
    }

    running = true;
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