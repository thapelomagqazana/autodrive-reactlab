/**
 * Unit tests for the global simulation store.
 *
 * These tests validate state transitions and guard behavior without testing
 * Zustand internals.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { useSimulationStore } from "./simulationStore";

const resetStore = () => {
  useSimulationStore.getState().resetSimulation();
};

describe("simulationStore", () => {
  beforeEach(() => {
    resetStore();
  });

  it("starts in idle state", () => {
    expect(useSimulationStore.getState().status).toBe("idle");
    expect(useSimulationStore.getState().telemetry.elapsedTimeSeconds).toBe(0);
    expect(useSimulationStore.getState().telemetry.fps).toBe(0);
  });

  it("starts the simulation", () => {
    useSimulationStore.getState().startSimulation();

    expect(useSimulationStore.getState().status).toBe("running");
  });

  it("pauses only when running", () => {
    useSimulationStore.getState().pauseSimulation();
    expect(useSimulationStore.getState().status).toBe("idle");

    useSimulationStore.getState().startSimulation();
    useSimulationStore.getState().pauseSimulation();

    expect(useSimulationStore.getState().status).toBe("paused");
  });

  it("resets runtime telemetry", () => {
    useSimulationStore.getState().startSimulation();
    useSimulationStore.getState().setElapsedTimeSeconds(12.5);
    useSimulationStore.getState().setFps(60);

    useSimulationStore.getState().resetSimulation();

    expect(useSimulationStore.getState().status).toBe("idle");
    expect(useSimulationStore.getState().telemetry.elapsedTimeSeconds).toBe(0);
    expect(useSimulationStore.getState().telemetry.fps).toBe(0);
  });

  it("ignores invalid telemetry values", () => {
    useSimulationStore.getState().setElapsedTimeSeconds(Number.NaN);
    useSimulationStore.getState().setFps(Number.POSITIVE_INFINITY);
    useSimulationStore.getState().setFps(-1);

    expect(useSimulationStore.getState().telemetry.elapsedTimeSeconds).toBe(0);
    expect(useSimulationStore.getState().telemetry.fps).toBe(0);
  });

  it("preserves UI preferences after reset", () => {
    useSimulationStore.getState().toggleDebugMode();
    useSimulationStore.getState().toggleSensorsVisibility();

    useSimulationStore.getState().resetSimulation();

    expect(useSimulationStore.getState().ui.isDebugModeEnabled).toBe(true);
    expect(useSimulationStore.getState().ui.areSensorsVisible).toBe(false);
  });
});