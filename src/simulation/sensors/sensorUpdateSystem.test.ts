import { describe, expect, it } from "vitest";
import { createInitialCarState } from "../vehicle";
import { createInitialRoad } from "../world";
import { createSensorConfig, createNoDetectionSensorReading } from "./sensorModel";
import { updateSensorsForFrame } from "./sensorUpdateSystem";

describe("sensorUpdateSystem", () => {
  it("updates sensors while running", () => {
    const car = createInitialCarState();
    const road = createInitialRoad();

    const result = updateSensorsForFrame({
      status: "running",
      car,
      road,
    });

    expect(result.sensorsUpdated).toBe(true);
    expect(result.car.sensors.rays.length).toBeGreaterThan(0);
    expect(result.car.sensors.readings).toHaveLength(result.car.sensors.rays.length);
    expect(result.car.sensors.readingGroups.front.length).toBeGreaterThan(0);
    expect(result.car.sensors.readingGroups.left.length).toBeGreaterThan(0);
    expect(result.car.sensors.readingGroups.right.length).toBeGreaterThan(0);
  });

  it("does not update sensors while paused", () => {
    const car = createInitialCarState();
    const road = createInitialRoad();

    const result = updateSensorsForFrame({
      status: "paused",
      car,
      road,
    });

    expect(result.sensorsUpdated).toBe(false);
    expect(result.car).toBe(car);
  });

  it("does not update sensors while idle", () => {
    const car = createInitialCarState();
    const road = createInitialRoad();

    const result = updateSensorsForFrame({
      status: "idle",
      car,
      road,
    });

    expect(result.sensorsUpdated).toBe(false);
    expect(result.car).toBe(car);
  });

  it("clears runtime sensor data when sensors are disabled", () => {
    const car = {
      ...createInitialCarState(),
      sensors: {
        config: createSensorConfig({ sensorEnabled: false }),
        rays: [
          {
            index: 0,
            start: { x: 0, y: 0 },
            end: { x: 0, y: -100 },
            angle: 0,
            maxLength: 100,
          },
        ],
        readings: [createNoDetectionSensorReading(0)],
        readingGroups: {
          front: [createNoDetectionSensorReading(0)],
          left: [],
          right: [],
        },
      },
    };

    const result = updateSensorsForFrame({
      status: "running",
      car,
      road: createInitialRoad(),
    });

    expect(result.sensorsUpdated).toBe(true);
    expect(result.car.sensors.config.sensorEnabled).toBe(false);
    expect(result.car.sensors.rays).toEqual([]);
    expect(result.car.sensors.readings).toEqual([]);
    expect(result.car.sensors.readingGroups).toEqual({
      front: [],
      left: [],
      right: [],
    });
  });

  it("does not mutate previous car state", () => {
    const car = createInitialCarState();
    const before = structuredClone(car);

    updateSensorsForFrame({
      status: "running",
      car,
      road: createInitialRoad(),
    });

    expect(car).toEqual(before);
  });

  it("produces no-detection readings when rays do not hit road edges", () => {
    const car = createInitialCarState();
    const road = createInitialRoad();

    const result = updateSensorsForFrame({
      status: "running",
      car,
      road,
    });

    expect(result.car.sensors.readings.length).toBe(result.car.sensors.rays.length);
    expect(
      result.car.sensors.readings.every(
        (reading) => typeof reading.detected === "boolean",
      ),
    ).toBe(true);
  });
});

it("continues detecting road edges after car moves beyond road topY", () => {
  const road = createInitialRoad();
  const car = {
    ...createInitialCarState(),
    positionY: road.topY - 500,
  };

  const result = updateSensorsForFrame({
    status: "running",
    car,
    road,
  });

  expect(result.car.sensors.readingGroups.left.length).toBeGreaterThan(0);
  expect(result.car.sensors.readingGroups.right.length).toBeGreaterThan(0);
});
