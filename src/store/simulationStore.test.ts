import { beforeEach, describe, expect, it } from "vitest";
import { useSimulationStore } from "./simulationStore";
import { createInitialRoad } from "../simulation/world";
import { createInitialCar } from "../simulation/vehicle";

function resetStore() {
  const road = createInitialRoad();

  useSimulationStore.setState({
    status: "idle",
    telemetry: {
      simulationTimeSeconds: 0,
      fps: 0,
    },
    ui: {
      isDebugModeEnabled: false,
      areSensorsVisible: true,
    },
    road,
    car: createInitialCar(road),
  });
}

describe("simulationStore", () => {
  beforeEach(() => {
    resetStore();
  });

  it("has deterministic initial state", () => {
    const state = useSimulationStore.getState();

    expect(state.status).toBe("idle");
    expect(state.telemetry.simulationTimeSeconds).toBe(0);
    expect(state.telemetry.fps).toBe(0);
    expect(state.ui.isDebugModeEnabled).toBe(false);
    expect(state.ui.areSensorsVisible).toBe(true);
  });

  it("starts simulation from idle", () => {
    useSimulationStore.getState().startSimulation();

    expect(useSimulationStore.getState().status).toBe("running");
  });

  it("pauses simulation only from running", () => {
    useSimulationStore.getState().pauseSimulation();
    expect(useSimulationStore.getState().status).toBe("idle");

    useSimulationStore.getState().startSimulation();
    useSimulationStore.getState().pauseSimulation();

    expect(useSimulationStore.getState().status).toBe("paused");
  });

  it("resumes simulation from paused", () => {
    useSimulationStore.getState().startSimulation();
    useSimulationStore.getState().pauseSimulation();
    useSimulationStore.getState().startSimulation();

    expect(useSimulationStore.getState().status).toBe("running");
  });

  it("advances simulation time only while running", () => {
    useSimulationStore.getState().advanceSimulationTime(1);

    expect(useSimulationStore.getState().telemetry.simulationTimeSeconds).toBe(0);

    useSimulationStore.getState().startSimulation();
    useSimulationStore.getState().advanceSimulationTime(1.5);

    expect(useSimulationStore.getState().telemetry.simulationTimeSeconds).toBe(1.5);

    useSimulationStore.getState().pauseSimulation();
    useSimulationStore.getState().advanceSimulationTime(1);

    expect(useSimulationStore.getState().telemetry.simulationTimeSeconds).toBe(1.5);
  });

  it("rejects invalid simulation time updates", () => {
    useSimulationStore.getState().startSimulation();

    useSimulationStore.getState().advanceSimulationTime(Number.NaN);
    useSimulationStore.getState().advanceSimulationTime(Number.POSITIVE_INFINITY);
    useSimulationStore.getState().advanceSimulationTime(-1);

    expect(useSimulationStore.getState().telemetry.simulationTimeSeconds).toBe(0);
  });

  it("sets simulation time when value is valid", () => {
    useSimulationStore.getState().setSimulationTimeSeconds(12.5);

    expect(useSimulationStore.getState().telemetry.simulationTimeSeconds).toBe(12.5);
  });

  it("sets FPS when value is valid", () => {
    useSimulationStore.getState().setFps(60);

    expect(useSimulationStore.getState().telemetry.fps).toBe(60);
  });

  it("rejects invalid FPS values", () => {
    useSimulationStore.getState().setFps(60);

    useSimulationStore.getState().setFps(Number.NaN);
    useSimulationStore.getState().setFps(Number.POSITIVE_INFINITY);
    useSimulationStore.getState().setFps(-1);

    expect(useSimulationStore.getState().telemetry.fps).toBe(60);
  });

  it("resets runtime state while preserving UI preferences", () => {
    useSimulationStore.getState().startSimulation();
    useSimulationStore.getState().advanceSimulationTime(2);
    useSimulationStore.getState().setFps(60);
    useSimulationStore.getState().toggleDebugMode();
    useSimulationStore.getState().toggleSensorsVisibility();

    useSimulationStore.getState().resetSimulation();

    const state = useSimulationStore.getState();

    expect(state.status).toBe("idle");
    expect(state.telemetry.simulationTimeSeconds).toBe(0);
    expect(state.telemetry.fps).toBe(0);
    expect(state.ui.isDebugModeEnabled).toBe(true);
    expect(state.ui.areSensorsVisible).toBe(false);
  });

  it("allows repeated lifecycle actions safely", () => {
    useSimulationStore.getState().startSimulation();
    useSimulationStore.getState().startSimulation();

    expect(useSimulationStore.getState().status).toBe("running");

    useSimulationStore.getState().pauseSimulation();
    useSimulationStore.getState().pauseSimulation();

    expect(useSimulationStore.getState().status).toBe("paused");

    useSimulationStore.getState().resetSimulation();
    useSimulationStore.getState().resetSimulation();

    expect(useSimulationStore.getState().status).toBe("idle");
  });

  it("keeps running status unchanged when start is called while already running", () => {
    useSimulationStore.getState().startSimulation();
    useSimulationStore.getState().startSimulation();

    expect(useSimulationStore.getState().status).toBe("running");
  });

  it("keeps paused status unchanged when pause is called while already paused", () => {
    useSimulationStore.getState().startSimulation();
    useSimulationStore.getState().pauseSimulation();
    useSimulationStore.getState().pauseSimulation();

    expect(useSimulationStore.getState().status).toBe("paused");
  });

  it("resets paused simulation to idle", () => {
    useSimulationStore.getState().startSimulation();
    useSimulationStore.getState().pauseSimulation();
    useSimulationStore.getState().resetSimulation();

    expect(useSimulationStore.getState().status).toBe("idle");
  });

  it("accepts zero simulation time delta while running", () => {
    useSimulationStore.getState().startSimulation();
    useSimulationStore.getState().advanceSimulationTime(0);

    expect(useSimulationStore.getState().telemetry.simulationTimeSeconds).toBe(0);
  });

  it("accumulates multiple valid simulation time deltas while running", () => {
    useSimulationStore.getState().startSimulation();

    useSimulationStore.getState().advanceSimulationTime(0.016);
    useSimulationStore.getState().advanceSimulationTime(0.034);

    expect(useSimulationStore.getState().telemetry.simulationTimeSeconds).toBeCloseTo(
      0.05,
    );
  });

  it("resets simulation time from running", () => {
    useSimulationStore.getState().startSimulation();
    useSimulationStore.getState().advanceSimulationTime(5);

    useSimulationStore.getState().resetSimulation();

    expect(useSimulationStore.getState().telemetry.simulationTimeSeconds).toBe(0);
  });

  it("accepts zero FPS", () => {
    useSimulationStore.getState().setFps(0);

    expect(useSimulationStore.getState().telemetry.fps).toBe(0);
  });

  it("accepts decimal FPS values", () => {
    useSimulationStore.getState().setFps(59.94);

    expect(useSimulationStore.getState().telemetry.fps).toBe(59.94);
  });

  it("resets FPS to zero", () => {
    useSimulationStore.getState().setFps(60);

    useSimulationStore.getState().resetSimulation();

    expect(useSimulationStore.getState().telemetry.fps).toBe(0);
  });

  it("preserves FPS when pausing", () => {
    useSimulationStore.getState().startSimulation();
    useSimulationStore.getState().setFps(60);
    useSimulationStore.getState().pauseSimulation();

    expect(useSimulationStore.getState().telemetry.fps).toBe(60);
  });

  it("resets from paused to idle", () => {
    useSimulationStore.getState().startSimulation();
    useSimulationStore.getState().pauseSimulation();

    useSimulationStore.getState().resetSimulation();

    expect(useSimulationStore.getState().status).toBe("idle");
  });

  it("does not advance time while paused", () => {
    useSimulationStore.getState().startSimulation();
    useSimulationStore.getState().pauseSimulation();
    useSimulationStore.getState().advanceSimulationTime(1);

    expect(useSimulationStore.getState().telemetry.simulationTimeSeconds).toBe(0);
  });

  it("initializes road and car state", () => {
    const state = useSimulationStore.getState();

    expect(state.road.centerX).toBe(400);
    expect(state.car.positionX).toBe(400);
    expect(state.car.speed).toBe(0);
    expect(state.car.angle).toBe(0);
    expect(state.car.steeringAngle).toBe(0);
    expect(state.car.decision).toBe("idle");
    expect(state.car.collisionCount).toBe(0);
    expect(state.car.distanceTravelled).toBe(0);
  });

  it("resetSimulation restores car state", () => {
    useSimulationStore.getState().setCar({
      ...useSimulationStore.getState().car,
      positionX: 123,
      speed: 99,
      angle: Math.PI,
      steeringAngle: 0.5,
      decision: "accelerating",
      collisionCount: 7,
      distanceTravelled: 1000,
    });

    useSimulationStore.getState().resetSimulation();

    const state = useSimulationStore.getState();

    expect(state.car.positionX).toBe(400);
    expect(state.car.speed).toBe(0);
    expect(state.car.angle).toBe(0);
    expect(state.car.steeringAngle).toBe(0);
    expect(state.car.decision).toBe("idle");
    expect(state.car.collisionCount).toBe(0);
    expect(state.car.distanceTravelled).toBe(0);
  });

  it("updateCar applies immutable updates", () => {
    useSimulationStore.getState().updateCar((car) => ({
      ...car,
      speed: 50,
    }));

    expect(useSimulationStore.getState().car.speed).toBe(50);
  });
});
