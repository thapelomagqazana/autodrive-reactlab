import { describe, expect, it } from "vitest";
import {
  DEFAULT_SENSOR_CONFIG,
  createDetectedSensorReading,
  createNoDetectionSensorReading,
  createSensorPoint,
  type SensorRay,
} from "./sensorModel";
import {
  createInitialSensorState,
  resetSensorState,
  withSensorConfig,
  withSensorRays,
  withSensorReadings,
} from "./sensorState";

describe("sensorState", () => {
  it("creates initial sensor state with default config and empty runtime data", () => {
    const state = createInitialSensorState();

    expect(state.config).toEqual(DEFAULT_SENSOR_CONFIG);
    expect(state.rays).toEqual([]);
    expect(state.readings).toEqual([]);
  });

  it("accepts valid custom sensor configuration", () => {
    const state = createInitialSensorState({
      rayCount: 5,
      rayLength: 120,
      raySpread: Math.PI / 3,
      sensorEnabled: false,
    });

    expect(state.config).toEqual({
      rayCount: 5,
      rayLength: 120,
      raySpread: Math.PI / 3,
      sensorEnabled: false,
    });
  });

  it("resets sensor state to defaults and clears stale data", () => {
    const reset = resetSensorState();

    expect(reset.config).toEqual(DEFAULT_SENSOR_CONFIG);
    expect(reset.rays).toEqual([]);
    expect(reset.readings).toEqual([]);
  });

  it("stores sensor rays immutably", () => {
    const initial = createInitialSensorState();

    const rays: SensorRay[] = [
      {
        index: 0,
        start: createSensorPoint(0, 0),
        end: createSensorPoint(10, 0),
        angle: 0,
        maxLength: 10,
      },
    ];

    const updated = withSensorRays(initial, rays);

    expect(updated).not.toBe(initial);
    expect(updated.rays).toEqual(rays);
    expect(initial.rays).toEqual([]);
  });

  it("stores sensor readings immutably", () => {
    const initial = createInitialSensorState();

    const readings = [
      createNoDetectionSensorReading(0),
      createDetectedSensorReading({
        rayIndex: 1,
        detectionType: "obstacle",
        distance: 25,
        point: createSensorPoint(10, 15),
      }),
    ];

    const updated = withSensorReadings(initial, readings);

    expect(updated).not.toBe(initial);
    expect(updated.readings).toEqual(readings);
    expect(initial.readings).toEqual([]);
  });

  it("clears stale rays and readings when config changes", () => {
    const initial = createInitialSensorState();
    const withRays = withSensorRays(initial, [
      {
        index: 0,
        start: createSensorPoint(0, 0),
        end: createSensorPoint(10, 0),
        angle: 0,
        maxLength: 10,
      },
    ]);

    const updated = withSensorConfig(withRays, {
      rayCount: 3,
      rayLength: 90,
      raySpread: Math.PI / 4,
      sensorEnabled: true,
    });

    expect(updated.config.rayCount).toBe(3);
    expect(updated.rays).toEqual([]);
    expect(updated.readings).toEqual([]);
  });

  it("rejects invalid config", () => {
    expect(() =>
      createInitialSensorState({
        rayCount: 0,
        rayLength: 180,
        raySpread: Math.PI / 2,
        sensorEnabled: true,
      }),
    ).toThrow(RangeError);
  });
});
