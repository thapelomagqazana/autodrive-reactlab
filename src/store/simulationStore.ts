/**
 * Global simulation store for AutoDrive ReactLab.
 */

import { create } from "zustand";

export type SimulationStatus = "idle" | "running" | "paused";

export interface SimulationTelemetry {
  elapsedTimeSeconds: number;
  fps: number;
}

export interface SimulationUiPreferences {
  isDebugModeEnabled: boolean;
  areSensorsVisible: boolean;
}

export interface SimulationState {
  status: SimulationStatus;
  telemetry: SimulationTelemetry;
  ui: SimulationUiPreferences;
}

export interface SimulationActions {
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  setElapsedTimeSeconds: (value: number) => void;
  setFps: (value: number) => void;
  toggleDebugMode: () => void;
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

const isValidMetric = (value: number): boolean =>
  Number.isFinite(value) && value >= 0;

export const useSimulationStore = create<SimulationStore>()((set) => ({
  ...createInitialState(),

  startSimulation: () =>
    set((state) => {
      if (state.status === "running") return state;
      return { status: "running" };
    }),

  pauseSimulation: () =>
    set((state) => {
      if (state.status !== "running") return state;
      return { status: "paused" };
    }),

  resetSimulation: () =>
    set((state) => ({
      status: "idle",
      telemetry: { ...INITIAL_TELEMETRY },
      ui: state.ui,
    })),

  setElapsedTimeSeconds: (value) =>
    set((state) => {
      if (!isValidMetric(value)) return state;

      return {
        telemetry: {
          ...state.telemetry,
          elapsedTimeSeconds: value,
        },
      };
    }),

  setFps: (value) =>
    set((state) => {
      if (!isValidMetric(value)) return state;

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

export const useSimulationUiPreferences = () =>
  useSimulationStore((state) => state.ui);

export const useStartSimulation = () =>
  useSimulationStore((state) => state.startSimulation);

export const usePauseSimulation = () =>
  useSimulationStore((state) => state.pauseSimulation);

export const useResetSimulation = () =>
  useSimulationStore((state) => state.resetSimulation);

export const useSetElapsedTimeSeconds = () =>
  useSimulationStore((state) => state.setElapsedTimeSeconds);

export const useSetFps = () => useSimulationStore((state) => state.setFps);

export const useToggleDebugMode = () =>
  useSimulationStore((state) => state.toggleDebugMode);

export const useToggleSensorsVisibility = () =>
  useSimulationStore((state) => state.toggleSensorsVisibility);