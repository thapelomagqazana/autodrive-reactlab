import { useEffect, useRef } from "react";
import { createGameLoop, type GameLoopController } from "../simulation/engine/gameLoop";
import { useKeyboardControls } from "../hooks";
import { useSimulationStatus, useSimulationStore } from "../store";

/**
 * Owns the runtime game-loop bridge between requestAnimationFrame and Zustand.
 *
 * Responsibilities:
 * - Start the browser game loop when simulation status is running.
 * - Stop the browser game loop when simulation status is paused or idle.
 * - Convert frame delta milliseconds into clamped seconds.
 * - Call store.tickSimulation(deltaTimeSeconds).
 *
 * Non-responsibilities:
 * - No UI rendering.
 * - No canvas drawing.
 * - No physics implementation.
 */
export function SimulationLoopController() {
  const status = useSimulationStatus();
  const keyboardInput = useKeyboardControls();

  const inputRef = useRef(keyboardInput);
  const loopRef = useRef<GameLoopController | null>(null);

  useEffect(() => {
    inputRef.current = keyboardInput;
  }, [keyboardInput]);

  useEffect(() => {
    if (!loopRef.current) {
      loopRef.current = createGameLoop({
        maxDeltaTimeSeconds: 0.05,
      });
    }

    const loop = loopRef.current;

    if (status !== "running") {
      loop.stop();
      return;
    }

    loop.start({
      update: (tick) => {
        const state = useSimulationStore.getState();

        if (state.status !== "running") {
          return;
        }

        state.tickSimulation(inputRef.current, tick.deltaTimeSeconds);
      },

      render: () => {
        // Rendering is handled by SimulationCanvas reacting to store updates.
      },

      onFps: (fps) => {
        useSimulationStore.getState().setFps(fps);
      },
    });

    return () => {
      loop.stop();
    };
  }, [status]);

  return null;
}
