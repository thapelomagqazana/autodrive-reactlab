import { beforeEach, describe, expect, it } from "vitest";
import { useSimulationStore } from "./simulationStore";
import { createInitialRoad } from "../simulation/world";
import { createInitialCar } from "../simulation/vehicle";
import {
  createCarPhysicsInput,
  NEUTRAL_CAR_PHYSICS_INPUT,
} from "../simulation/engine/physics";
import { createInitialCameraState } from "../simulation/camera";

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

it("tickSimulation uses the latest store-backed car state", () => {
  const road = createInitialRoad();

  useSimulationStore.setState({
    status: "running",
    telemetry: {
      simulationTimeSeconds: 0,
      fps: 0,
    },
    ui: {
      isDebugModeEnabled: false,
      areSensorsVisible: true,
    },
    road,
    car: {
      ...createInitialCar(road),
      speed: 10,
      friction: 0,
    },
  });

  useSimulationStore.getState().setCar({
    ...useSimulationStore.getState().car,
    speed: 100,
    friction: 0,
  });

  useSimulationStore.getState().tickSimulation(NEUTRAL_CAR_PHYSICS_INPUT, 1);

  expect(useSimulationStore.getState().car.speed).toBe(100);
  expect(useSimulationStore.getState().car.positionY).toBe(500);
});

it("passes input into physics during tickSimulation", () => {
  const road = createInitialRoad();

  useSimulationStore.setState({
    status: "running",
    telemetry: {
      simulationTimeSeconds: 0,
      fps: 0,
    },
    ui: {
      isDebugModeEnabled: false,
      areSensorsVisible: true,
    },
    road,
    car: {
      ...createInitialCar(road),
      speed: 0,
      friction: 0,
    },
  });

  useSimulationStore.getState().tickSimulation(
    createCarPhysicsInput({
      isAccelerating: true,
    }),
    1,
  );

  expect(useSimulationStore.getState().car.speed).toBeGreaterThan(0);
});

it("neutral input stops acceleration on the next frame", () => {
  const road = createInitialRoad();

  useSimulationStore.setState({
    status: "running",
    telemetry: {
      simulationTimeSeconds: 0,
      fps: 0,
    },
    ui: {
      isDebugModeEnabled: false,
      areSensorsVisible: true,
    },
    road,
    car: {
      ...createInitialCar(road),
      speed: 0,
      friction: 0,
    },
  });

  useSimulationStore.getState().tickSimulation(
    createCarPhysicsInput({
      isAccelerating: true,
    }),
    1,
  );

  const speedAfterAcceleration = useSimulationStore.getState().car.speed;

  useSimulationStore.getState().tickSimulation(NEUTRAL_CAR_PHYSICS_INPUT, 1);

  expect(useSimulationStore.getState().car.speed).toBe(speedAfterAcceleration);
});

it("updates car physics during running frames", () => {
  const road = createInitialRoad();

  useSimulationStore.setState({
    status: "running",
    telemetry: {
      simulationTimeSeconds: 0,
      fps: 0,
    },
    ui: {
      isDebugModeEnabled: false,
      areSensorsVisible: true,
    },
    road,
    car: {
      ...createInitialCar(road),
      speed: 0,
      friction: 0,
    },
  });

  const previousCar = useSimulationStore.getState().car;

  useSimulationStore.getState().tickSimulation(
    createCarPhysicsInput({
      isAccelerating: true,
    }),
    1,
  );

  const state = useSimulationStore.getState();

  expect(state.car).not.toBe(previousCar);
  expect(state.car.speed).toBeGreaterThan(0);
  expect(state.telemetry.simulationTimeSeconds).toBe(1);
});

it("does not update car physics while paused", () => {
  const road = createInitialRoad();
  const car = {
    ...createInitialCar(road),
    speed: 0,
    friction: 0,
  };

  useSimulationStore.setState({
    status: "paused",
    telemetry: {
      simulationTimeSeconds: 0,
      fps: 0,
    },
    ui: {
      isDebugModeEnabled: false,
      areSensorsVisible: true,
    },
    road,
    car,
  });

  useSimulationStore.getState().tickSimulation(
    createCarPhysicsInput({
      isAccelerating: true,
    }),
    1,
  );

  const state = useSimulationStore.getState();

  expect(state.car).toBe(car);
  expect(state.car.speed).toBe(0);
  expect(state.telemetry.simulationTimeSeconds).toBe(0);
});

it("does not update car physics while idle", () => {
  const road = createInitialRoad();
  const car = {
    ...createInitialCar(road),
    speed: 0,
    friction: 0,
  };

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
    car,
  });

  useSimulationStore.getState().tickSimulation(
    createCarPhysicsInput({
      isAccelerating: true,
    }),
    1,
  );

  const state = useSimulationStore.getState();

  expect(state.car).toBe(car);
  expect(state.car.speed).toBe(0);
  expect(state.telemetry.simulationTimeSeconds).toBe(0);
});

it("passes delta time in seconds into physics", () => {
  const road = createInitialRoad();

  useSimulationStore.setState({
    status: "running",
    telemetry: {
      simulationTimeSeconds: 0,
      fps: 0,
    },
    ui: {
      isDebugModeEnabled: false,
      areSensorsVisible: true,
    },
    road,
    car: {
      ...createInitialCar(road),
      speed: 0,
      friction: 0,
      acceleration: 120,
    },
  });

  useSimulationStore.getState().tickSimulation(
    createCarPhysicsInput({
      isAccelerating: true,
    }),
    0.5,
  );

  expect(useSimulationStore.getState().car.speed).toBe(60);
});

it("does not mutate the existing car object", () => {
  const road = createInitialRoad();
  const car = {
    ...createInitialCar(road),
    speed: 0,
    friction: 0,
  };
  const snapshot = structuredClone(car);

  useSimulationStore.setState({
    status: "running",
    telemetry: {
      simulationTimeSeconds: 0,
      fps: 0,
    },
    ui: {
      isDebugModeEnabled: false,
      areSensorsVisible: true,
    },
    road,
    car,
  });

  useSimulationStore.getState().tickSimulation(
    createCarPhysicsInput({
      isAccelerating: true,
    }),
    1,
  );

  expect(car).toEqual(snapshot);
  expect(useSimulationStore.getState().car).not.toBe(car);
});

it("ignores invalid delta time values", () => {
  const road = createInitialRoad();
  const car = createInitialCar(road);

  useSimulationStore.setState({
    status: "running",
    telemetry: {
      simulationTimeSeconds: 0,
      fps: 0,
    },
    ui: {
      isDebugModeEnabled: false,
      areSensorsVisible: true,
    },
    road,
    car,
  });

  useSimulationStore.getState().tickSimulation(NEUTRAL_CAR_PHYSICS_INPUT, Number.NaN);

  expect(useSimulationStore.getState().car).toBe(car);
  expect(useSimulationStore.getState().telemetry.simulationTimeSeconds).toBe(0);
});

it("starts simulation from idle", () => {
  useSimulationStore.setState({
    ...useSimulationStore.getState(),
    status: "idle",
  });

  useSimulationStore.getState().startSimulation();

  expect(useSimulationStore.getState().status).toBe("running");
});

it("resumes simulation from paused", () => {
  useSimulationStore.setState({
    ...useSimulationStore.getState(),
    status: "paused",
  });

  useSimulationStore.getState().startSimulation();

  expect(useSimulationStore.getState().status).toBe("running");
});

it("start while already running is a safe no-op", () => {
  useSimulationStore.setState({
    ...useSimulationStore.getState(),
    status: "running",
  });

  const before = useSimulationStore.getState();

  useSimulationStore.getState().startSimulation();
  useSimulationStore.getState().startSimulation();

  expect(useSimulationStore.getState().status).toBe("running");
  expect(useSimulationStore.getState().car).toBe(before.car);
});

it("resets simulation state from factories", () => {
  useSimulationStore.getState().startSimulation();

  useSimulationStore
    .getState()
    .tickSimulation(createCarPhysicsInput({ isAccelerating: true }), 1);

  useSimulationStore.getState().resetSimulation();

  const state = useSimulationStore.getState();
  const expectedRoad = createInitialRoad();
  const expectedCar = createInitialCar(expectedRoad);

  expect(state.status).toBe("idle");
  expect(state.telemetry).toEqual({
    simulationTimeSeconds: 0,
    fps: 0,
  });
  expect(state.road).toEqual(expectedRoad);
  expect(state.car).toEqual(expectedCar);
});

it.skip("reset produces identical baseline state every time", () => {
  useSimulationStore.getState().resetSimulation();
  const first = structuredClone(useSimulationStore.getState());

  useSimulationStore.getState().startSimulation();
  useSimulationStore
    .getState()
    .tickSimulation(createCarPhysicsInput({ isAccelerating: true }), 1);

  useSimulationStore.getState().resetSimulation();
  const second = structuredClone(useSimulationStore.getState());

  expect(second.status).toBe(first.status);
  expect(second.telemetry).toEqual(first.telemetry);
  expect(second.road).toEqual(first.road);
  expect(second.car).toEqual(first.car);
});

it("reset creates fresh road and car objects", () => {
  const oldRoad = useSimulationStore.getState().road;
  const oldCar = useSimulationStore.getState().car;

  useSimulationStore.getState().resetSimulation();

  const state = useSimulationStore.getState();

  expect(state.road).not.toBe(oldRoad);
  expect(state.car).not.toBe(oldCar);
});

it("reset preserves UI preferences", () => {
  useSimulationStore.getState().toggleDebugMode();
  useSimulationStore.getState().toggleSensorsVisibility();

  useSimulationStore.getState().resetSimulation();

  expect(useSimulationStore.getState().ui).toEqual({
    isDebugModeEnabled: true,
    areSensorsVisible: false,
  });
});

it("initializes camera from factory", () => {
  const state = useSimulationStore.getState();

  expect(state.camera).toEqual(createInitialCameraState());
});

it("reset recreates camera state", () => {
  const previousCamera = useSimulationStore.getState().camera;

  useSimulationStore.getState().resetSimulation();

  expect(useSimulationStore.getState().camera).toEqual(createInitialCameraState());
  expect(useSimulationStore.getState().camera).not.toBe(previousCamera);
});
