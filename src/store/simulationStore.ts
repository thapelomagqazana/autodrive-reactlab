/**
 * Global simulation store for AutoDrive ReactLab.
 *
 * Owns lightweight UI-visible simulation/runtime state only.
 */

import { create } from "zustand";
import { createInitialRoad, type Road } from "../simulation/world";
import { createInitialCar, type CarState } from "../simulation/vehicle";
import {
  NEUTRAL_CAR_PHYSICS_INPUT,
  updateCarPhysics,
} from "../simulation/engine/physics";

export type SimulationStatus = "idle" | "running" | "paused";

export interface SimulationTelemetry {
  simulationTimeSeconds: number;
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

  road: Road;
  car: CarState;
}

export interface SimulationActions {
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  tickSimulation: (deltaTimeSeconds: number) => void;

  advanceSimulationTime: (deltaTimeSeconds: number) => void;
  setSimulationTimeSeconds: (value: number) => void;
  setFps: (value: number) => void;

  setCar: (car: CarState) => void;
  updateCar: (updater: (car: CarState) => CarState) => void;

  toggleDebugMode: () => void;
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
  const road = createInitialRoad();

  return {
    status: "idle",
    telemetry: { ...INITIAL_TELEMETRY },
    ui: { ...INITIAL_UI },
    road,
    car: createInitialCar(road),
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

      return { status: "running" };
    }),

  pauseSimulation: () =>
    set((state) => {
      if (state.status !== "running") {
        return state;
      }

      return { status: "paused" };
    }),

  resetSimulation: () =>
    set((state) => {
      const road = createInitialRoad();

      return {
        status: "idle",
        telemetry: { ...INITIAL_TELEMETRY },
        ui: state.ui,
        road,
        car: createInitialCar(road),
      };
    }),

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
          simulationTimeSeconds: state.telemetry.simulationTimeSeconds + deltaTimeSeconds,
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

  setCar: (car) =>
    set(() => ({
      car,
    })),

  updateCar: (updater) =>
    set((state) => ({
      car: updater(state.car),
    })),

  toggleDebugMode: () =>
    set((state) => ({
      ui: {
        ...state.ui,
        isDebugModeEnabled: !state.ui.isDebugModeEnabled,
      },
    })),

  tickSimulation: (deltaTimeSeconds) =>
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
          simulationTimeSeconds: state.telemetry.simulationTimeSeconds + deltaTimeSeconds,
        },
        car: updateCarPhysics(state.car, NEUTRAL_CAR_PHYSICS_INPUT, deltaTimeSeconds),
      };
    }),

  toggleSensorsVisibility: () =>
    set((state) => ({
      ui: {
        ...state.ui,
        areSensorsVisible: !state.ui.areSensorsVisible,
      },
    })),
}));

export const useSimulationStatus = () => useSimulationStore((state) => state.status);

export const useSimulationTelemetry = () =>
  useSimulationStore((state) => state.telemetry);

export const useSimulationTimeSeconds = () =>
  useSimulationStore((state) => state.telemetry.simulationTimeSeconds);

export const useSimulationFps = () => useSimulationStore((state) => state.telemetry.fps);

export const useSimulationUiPreferences = () => useSimulationStore((state) => state.ui);

export const useSimulationRoad = () => useSimulationStore((state) => state.road);

export const useSimulationCar = () => useSimulationStore((state) => state.car);

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

export const useSetCar = () => useSimulationStore((state) => state.setCar);

export const useUpdateCar = () => useSimulationStore((state) => state.updateCar);

export const useToggleDebugMode = () =>
  useSimulationStore((state) => state.toggleDebugMode);

export const useTickSimulation = () =>
  useSimulationStore((state) => state.tickSimulation);

export const useToggleSensorsVisibility = () =>
  useSimulationStore((state) => state.toggleSensorsVisibility);
