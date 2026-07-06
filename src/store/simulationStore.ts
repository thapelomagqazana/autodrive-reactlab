/**
 * Global simulation store for AutoDrive ReactLab.
 *
 * Owns lightweight UI-visible simulation/runtime state only.
 */

import { create } from "zustand";
import { createInitialRoad, type Road } from "../simulation/world";
import { createInitialCar, type CarState } from "../simulation/vehicle";
import { updateCarPhysics, type CarPhysicsInput } from "../simulation/engine/physics";
import { isCarOffRoad } from "../simulation/engine/roadBoundary";
import { shouldRecoverFromSevereRoadDeparture } from "../simulation/engine/offRoadRecovery";
import { calculateFps } from "../simulation/engine/performanceMetrics";
import type { CanvasDiagnostics } from "../types/canvasDiagnostics";
import { updateSensorsForFrame } from "../simulation/sensors/sensorUpdateSystem";
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
  roadDepartureWarning: boolean;
  canvasDiagnostics: CanvasDiagnostics | null;
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
  setRoadDepartureWarning: (value: boolean) => void;
  setCanvasDiagnostics: (diagnostics: CanvasDiagnostics | null) => void;
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
    roadDepartureWarning: false,
    canvasDiagnostics: null,
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
        roadDepartureWarning: false,
        canvasDiagnostics: state.canvasDiagnostics,
      };
    }),

  /**
   * Advances one active simulation frame.
   *
   * Frame order:
   * 1. Validate active simulation state and delta time.
   * 2. Evaluate the previous frame's road-departure state.
   * 3. Update vehicle physics.
   * 4. Recover from severe road departure when required.
   * 5. Update sensors from the post-physics car pose.
   * 6. Recalculate road-departure warning state.
   * 7. Persist telemetry and the fully updated car atomically.
   *
   * Sensor ordering is intentional:
   * sensors must observe the car position and heading produced by the current
   * physics update, preventing one-frame perception lag.
   */
  tickSimulation: (input, deltaTimeSeconds) =>
    set((state) => {
      if (
        state.status !== "running" ||
        !isValidNonNegativeFiniteNumber(deltaTimeSeconds)
      ) {
        return state;
      }

      /**
       * Determine whether the car started this frame off-road.
       *
       * Physics consumes this information when applying the current frame's
       * movement behavior.
       */
      const wasOffRoad = isCarOffRoad(state.car, state.road);

      /**
       * Phase 1: advance vehicle physics.
       *
       * This is the authoritative post-movement car pose for the current frame.
       * Sensor calculations must use this result rather than state.car.
       */
      const movedCar = updateCarPhysics(
        state.car,
        {
          ...input,
          isOffRoad: wasOffRoad,
        },
        deltaTimeSeconds,
      );

      /**
       * Severe departure recovery takes precedence over sensor calculation.
       *
       * The reset car is created with fresh default sensor state, so stale
       * runtime rays and readings cannot survive recovery.
       */
      if (shouldRecoverFromSevereRoadDeparture(movedCar, state.road)) {
        const road = createInitialRoad();

        return {
          status: "idle",
          telemetry: { ...INITIAL_TELEMETRY },
          ui: state.ui,
          road,
          car: createInitialCar(road),
          camera: createInitialCameraState(),
          roadDepartureWarning: false,
        };
      }

      /**
       * Phase 2: update perception from the post-physics car pose.
       *
       * Because this runs after updateCarPhysics(), generated rays and readings
       * correspond to the car's current-frame position and heading.
       */
      const sensorResult = updateSensorsForFrame({
        status: state.status,
        car: movedCar,
        road: state.road,
      });

      /**
       * Road-departure warning also evaluates the current-frame car pose.
       *
       * Use sensorResult.car so the final persisted CarState is the same
       * immutable object carrying the latest sensor state.
       */
      const roadDepartureWarning = isCarOffRoad(sensorResult.car, state.road);

      return {
        telemetry: {
          ...state.telemetry,
          simulationTimeSeconds: state.telemetry.simulationTimeSeconds + deltaTimeSeconds,
          fps: calculateFps(deltaTimeSeconds),
        },

        /**
         * Persist the post-physics, post-sensor car atomically.
         *
         * Do not persist movedCar here, because that would discard the newly
         * generated sensor rays and readings.
         */
        car: sensorResult.car,

        roadDepartureWarning,
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

  setRoadDepartureWarning: (value) =>
    set(() => ({
      roadDepartureWarning: value,
    })),

  setCanvasDiagnostics: (diagnostics) =>
    set(() => ({
      canvasDiagnostics: diagnostics,
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

export const useRoadDepartureWarning = () =>
  useSimulationStore((state) => state.roadDepartureWarning);

export const useSetRoadDepartureWarning = () =>
  useSimulationStore((state) => state.setRoadDepartureWarning);

export const useCanvasDiagnostics = () =>
  useSimulationStore((state) => state.canvasDiagnostics);

export const useSetCanvasDiagnostics = () =>
  useSimulationStore((state) => state.setCanvasDiagnostics);
