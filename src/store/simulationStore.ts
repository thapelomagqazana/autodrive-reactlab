/**
 * Global simulation store for AutoDrive ReactLab.
 *
 * Owns lightweight UI-visible simulation/runtime state only.
 */

import { create } from "zustand";
import { createInitialRoad, type Road } from "../simulation/world";
import { createInitialCar, type CarState } from "../simulation/vehicle";
import { updateCarPhysics, type CarPhysicsInput } from "../simulation/engine/physics";
import {
  createInitialCameraState,
  type CameraMode,
  type CameraState,
} from "../simulation/camera";

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
  camera: CameraState;
}

export interface SimulationActions {
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  tickSimulation: (input: CarPhysicsInput, deltaTimeSeconds: number) => void;

  advanceSimulationTime: (deltaTimeSeconds: number) => void;
  setSimulationTimeSeconds: (value: number) => void;
  setFps: (value: number) => void;

  setCar: (car: CarState) => void;
  setCamera: (camera: CameraState) => void;
  setCameraMode: (mode: CameraMode) => void;
  toggleCameraMode: () => void;
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
    camera: createInitialCameraState(),
  };
}

function isValidNonNegativeFiniteNumber(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export const useSimulationStore = create<SimulationStore>()((set) => ({
  ...createInitialState(),

  startSimulation: () =>
    set((state) => (state.status === "running" ? state : { status: "running" })),

  pauseSimulation: () =>
    set((state) => (state.status !== "running" ? state : { status: "paused" })),

  resetSimulation: () =>
    set((state) => {
      const road = createInitialRoad();

      return {
        status: "idle",
        telemetry: { ...INITIAL_TELEMETRY },
        ui: state.ui,
        road,
        car: createInitialCar(road),
        camera: createInitialCameraState(),
      };
    }),

  /**
   * Advances one active simulation frame.
   *
   * Rules:
   * - Runs only while status is "running".
   * - Uses delta time in seconds.
   * - Delegates movement to updateCarPhysics().
   * - Persists the returned CarState back into Zustand.
   * - Never mutates the existing car object.
   */
  tickSimulation: (input, deltaTimeSeconds) =>
    set((state) => {
      if (
        state.status !== "running" ||
        !isValidNonNegativeFiniteNumber(deltaTimeSeconds)
      ) {
        return state;
      }

      const nextCar = updateCarPhysics(state.car, input, deltaTimeSeconds);

      return {
        telemetry: {
          ...state.telemetry,
          simulationTimeSeconds: state.telemetry.simulationTimeSeconds + deltaTimeSeconds,
        },
        car: nextCar,
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

  setCameraMode: (mode) =>
    set((state) => ({
      camera: {
        ...state.camera,
        mode,
        offsetX: mode === "fixed" ? 0 : state.camera.offsetX,
        offsetY: mode === "fixed" ? 0 : state.camera.offsetY,
      },
    })),

  toggleCameraMode: () =>
    set((state) => {
      const nextMode = state.camera.mode === "fixed" ? "follow" : "fixed";

      return {
        camera: {
          ...state.camera,
          mode: nextMode,
          offsetX: nextMode === "fixed" ? 0 : state.camera.offsetX,
          offsetY: nextMode === "fixed" ? 0 : state.camera.offsetY,
        },
      };
    }),

  updateCar: (updater) =>
    set((state) => ({
      car: updater(state.car),
    })),

  setCamera: (camera) =>
    set(() => ({
      camera,
    })),

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

export const useSimulationCarSpeed = () => useSimulationStore((state) => state.car.speed);

export const useSimulationCarAcceleration = () =>
  useSimulationStore((state) => state.car.acceleration);

export const useSimulationCarSteeringAngle = () =>
  useSimulationStore((state) => state.car.steeringAngle);

export const useSimulationCarPositionX = () =>
  useSimulationStore((state) => state.car.positionX);

export const useSimulationCarPositionY = () =>
  useSimulationStore((state) => state.car.positionY);

export const useSimulationCarHeading = () =>
  useSimulationStore((state) => state.car.angle);

export const useSimulationCamera = () => useSimulationStore((state) => state.camera);

export const useSetCamera = () => useSimulationStore((state) => state.setCamera);

export const useSimulationCameraMode = () =>
  useSimulationStore((state) => state.camera.mode);

export const useSetCameraMode = () => useSimulationStore((state) => state.setCameraMode);

export const useToggleCameraMode = () =>
  useSimulationStore((state) => state.toggleCameraMode);
