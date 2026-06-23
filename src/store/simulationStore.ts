/**
 * Global simulation store for AutoDrive ReactLab.
 *
 * This store owns UI-visible simulation state only.
 *
 * It should contain:
 * - simulation lifecycle status
 * - lightweight telemetry values
 * - UI toggles
 * - safe lifecycle actions
 *
 * It should NOT contain:
 * - canvas rendering context
 * - requestAnimationFrame IDs
 * - heavy physics objects
 * - raw sensor arrays
 * - large replay history
 *
 * Keeping this boundary clear prevents the store from becoming a dumping
 * ground for engine internals.
 */

import { create } from "zustand";

export type SimulationStatus = "idle" | "running" | "paused";

export interface SimulationTelemetry {
  /**
   * Elapsed simulation time in seconds.
   *
   * This is simulation time, not wall-clock time.
   * It should only increase while the simulation is running.
   */
  elapsedTimeSeconds: number;

  /**
   * Frames per second reported by the game loop.
   *
   * This should be updated at a controlled interval, not every frame.
   */
  fps: number;
}

export interface SimulationUiPreferences {
  /**
   * Enables development overlays such as canvas boundaries,
   * grid markers, sensor debug views, and future AI reasoning overlays.
   */
  isDebugModeEnabled: boolean;

  /**
   * Controls whether sensor rays are visible on the simulation canvas.
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
   * Starts or resumes the simulation.
   *
   * Valid transitions:
   * - idle -> running
   * - paused -> running
   * - running -> running
   */
  startSimulation: () => void;

  /**
   * Pauses the simulation without resetting runtime state.
   *
   * Valid transitions:
   * - running -> paused
   * - idle -> idle
   * - paused -> paused
   */
  pauseSimulation: () => void;

  /**
   * Resets runtime simulation state to a known baseline.
   *
   * This preserves UI preferences because preferences are user choices,
   * not runtime telemetry.
   */
  resetSimulation: () => void;

  /**
   * Updates elapsed simulation time.
   *
   * Negative, infinite, or NaN values are ignored to protect the store
   * from invalid game-loop input.
   */
  setElapsedTimeSeconds: (value: number) => void;

  /**
   * Updates the displayed FPS value.
   *
   * Invalid values are ignored. Valid values are normalized to a
   * non-negative finite number.
   */
  setFps: (value: number) => void;

  /**
   * Toggles debug mode for future development overlays.
   */
  toggleDebugMode: () => void;

  /**
   * Toggles sensor visibility for future sensor rendering.
   */
  toggleSensorsVisibility: () => void;
}

export type SimulationStore = SimulationState & SimulationActions;

const INITIAL_TELEMETRY: SimulationTelemetry = {
  elapsedTimeSeconds: 0,
  fps: 0,
};

const INITIAL_UI: SimulationUiPreferences = {
  isDebugModeEnabled: false,
  areSensorsVisible: true,
};

const createInitialState = (): SimulationState => ({
  status: "idle",
  telemetry: { ...INITIAL_TELEMETRY },
  ui: { ...INITIAL_UI },
});

const isValidMetric = (value: number): boolean => Number.isFinite(value) && value >= 0;

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

      /**
       * Preserve UI preferences across reset.
       * Resetting should restart the simulation, not erase user display choices.
       */
      ui: state.ui,
    })),

  setElapsedTimeSeconds: (value) =>
    set((state) => {
      if (!isValidMetric(value)) {
        return state;
      }

      return {
        telemetry: {
          ...state.telemetry,
          elapsedTimeSeconds: value,
        },
      };
    }),

  setFps: (value) =>
    set((state) => {
      if (!isValidMetric(value)) {
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

/**
 * Selector hooks.
 *
 * Components should use these hooks instead of subscribing to the whole store.
 * This prevents unnecessary re-renders as the simulator grows.
 */

export const useSimulationStatus = () => useSimulationStore((state) => state.status);

export const useSimulationTelemetry = () =>
  useSimulationStore((state) => state.telemetry);

export const useSimulationUiPreferences = () => useSimulationStore((state) => state.ui);

export const useSimulationActions = () =>
  useSimulationStore((state) => ({
    startSimulation: state.startSimulation,
    pauseSimulation: state.pauseSimulation,
    resetSimulation: state.resetSimulation,
    setElapsedTimeSeconds: state.setElapsedTimeSeconds,
    setFps: state.setFps,
    toggleDebugMode: state.toggleDebugMode,
    toggleSensorsVisibility: state.toggleSensorsVisibility,
  }));