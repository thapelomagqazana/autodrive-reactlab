/**
 * Global simulation store for AutoDrive ReactLab.
 *
 * This store owns UI-visible simulation/runtime state only.
 *
 * Responsibilities:
 * - simulation lifecycle status
 * - simulation elapsed time
 * - FPS telemetry
 * - debug-mode preference
 * - sensor-visibility preference
 * - safe lifecycle actions
 *
 * Non-responsibilities:
 * - no canvas rendering context
 * - no requestAnimationFrame IDs
 * - no game loop instance
 * - no heavy physics objects
 * - no raw sensor arrays
 * - no large replay history
 * - no browser-only APIs during store creation
 */

import { create } from "zustand";

/**
 * Represents the simulation lifecycle state.
 *
 * Valid states:
 * - idle: simulation has not started or has been reset
 * - running: simulation updates are active
 * - paused: simulation is halted without resetting runtime state
 *
 * Valid transitions:
 * - idle -> running
 * - running -> paused
 * - paused -> running
 * - running -> idle
 * - paused -> idle
 * - idle -> idle
 *
 * Invalid transitions:
 * - idle -> paused is ignored
 * - running -> running is safe/no-op
 * - paused -> paused is safe/no-op
 */
export type SimulationStatus = "idle" | "running" | "paused";

export interface SimulationTelemetry {
  /**
   * Elapsed simulation time in seconds.
   *
   * This is simulation time, not wall-clock time.
   * It should advance from game-loop delta time only.
   */
  simulationTimeSeconds: number;

  /**
   * Frames per second sampled by the game loop.
   *
   * This value should be updated at a controlled telemetry interval,
   * not every animation frame.
   */
  fps: number;
}

export interface SimulationUiPreferences {
  /**
   * Enables future development overlays such as:
   * - grid markers
   * - canvas bounds
   * - sensor debug views
   * - AI reasoning overlays
   */
  isDebugModeEnabled: boolean;

  /**
   * Controls whether future sensor rays are visible.
   */
  areSensorsVisible: boolean;
}

export interface SimulationState {
  status: SimulationStatus;
  telemetry: SimulationTelemetry;
  ui: SimulationUiPreferences;
}

export interface SimulationActions {
  /**
   * Starts or resumes the simulation lifecycle.
   *
   * Valid transitions:
   * - idle -> running
   * - paused -> running
   * - running -> running/no-op
   */
  startSimulation: () => void;

  /**
   * Pauses the simulation lifecycle.
   *
   * Valid transitions:
   * - running -> paused
   * - idle -> idle/no-op
   * - paused -> paused/no-op
   */
  pauseSimulation: () => void;

  /**
   * Resets runtime simulation state to baseline.
   *
   * Preserves UI preferences because reset should restart the runtime,
   * not erase user display choices.
   */
  resetSimulation: () => void;

  /**
   * Advances simulation time from game-loop delta time.
   *
   * Time only advances while status is running.
   */
  advanceSimulationTime: (deltaTimeSeconds: number) => void;

  /**
   * Directly sets simulation elapsed time.
   *
   * Useful for future replay restore/testing.
   */
  setSimulationTimeSeconds: (value: number) => void;

  /**
   * Stores sampled FPS from the game loop telemetry callback.
   */
  setFps: (value: number) => void;

  /**
   * Toggles future debug overlays.
   */
  toggleDebugMode: () => void;

  /**
   * Toggles future sensor visibility.
   */
  toggleSensorsVisibility: () => void;
}

export type SimulationStore = SimulationState & SimulationActions;

const INITIAL_TELEMETRY: SimulationTelemetry = {
  simulationTimeSeconds: 0,
  fps: 0,
};

const INITIAL_UI: SimulationUiPreferences = {
  isDebugModeEnabled: false,
  areSensorsVisible: true,
};

function createInitialState(): SimulationState {
  return {
    status: "idle",
    telemetry: { ...INITIAL_TELEMETRY },
    ui: { ...INITIAL_UI },
  };
}

function isValidNonNegativeFiniteNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export const useSimulationStore = create<SimulationStore>()((set) => ({
  ...createInitialState(),

  startSimulation: () =>
    set((state) => {
      if (state.status === "running") {
        return state;
      }

      return {
        status: "running",
      };
    }),

  pauseSimulation: () =>
    set((state) => {
      if (state.status !== "running") {
        return state;
      }

      return {
        status: "paused",
      };
    }),

  resetSimulation: () =>
    set((state) => ({
      status: "idle",
      telemetry: { ...INITIAL_TELEMETRY },
      ui: state.ui,
    })),

  advanceSimulationTime: (deltaTimeSeconds) =>
    set((state) => {
      if (
        state.status !== "running" ||
        !isValidNonNegativeFiniteNumber(deltaTimeSeconds)
      ) {
        return state;
      }

      return {
        telemetry: {
          ...state.telemetry,
          simulationTimeSeconds:
            state.telemetry.simulationTimeSeconds + deltaTimeSeconds,
        },
      };
    }),

  setSimulationTimeSeconds: (value) =>
    set((state) => {
      if (!isValidNonNegativeFiniteNumber(value)) {
        return state;
      }

      return {
        telemetry: {
          ...state.telemetry,
          simulationTimeSeconds: value,
        },
      };
    }),

  setFps: (value) =>
    set((state) => {
      if (!isValidNonNegativeFiniteNumber(value)) {
        return state;
      }

      return {
        telemetry: {
          ...state.telemetry,
          fps: value,
        },
      };
    }),

  toggleDebugMode: () =>
    set((state) => ({
      ui: {
        ...state.ui,
        isDebugModeEnabled: !state.ui.isDebugModeEnabled,
      },
    })),

  toggleSensorsVisibility: () =>
    set((state) => ({
      ui: {
        ...state.ui,
        areSensorsVisible: !state.ui.areSensorsVisible,
      },
    })),
}));

export const useSimulationStatus = () =>
  useSimulationStore((state) => state.status);

export const useSimulationTelemetry = () =>
  useSimulationStore((state) => state.telemetry);

export const useSimulationTimeSeconds = () =>
  useSimulationStore((state) => state.telemetry.simulationTimeSeconds);

export const useSimulationFps = () =>
  useSimulationStore((state) => state.telemetry.fps);

export const useSimulationUiPreferences = () =>
  useSimulationStore((state) => state.ui);

export const useStartSimulation = () =>
  useSimulationStore((state) => state.startSimulation);

export const usePauseSimulation = () =>
  useSimulationStore((state) => state.pauseSimulation);

export const useResetSimulation = () =>
  useSimulationStore((state) => state.resetSimulation);

export const useAdvanceSimulationTime = () =>
  useSimulationStore((state) => state.advanceSimulationTime);

export const useSetSimulationTimeSeconds = () =>
  useSimulationStore((state) => state.setSimulationTimeSeconds);

export const useSetFps = () => useSimulationStore((state) => state.setFps);

export const useToggleDebugMode = () =>
  useSimulationStore((state) => state.toggleDebugMode);

export const useToggleSensorsVisibility = () =>
  useSimulationStore((state) => state.toggleSensorsVisibility);