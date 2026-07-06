import { describe, expect, it } from "vitest";
import { createInitialCarState } from "../vehicle/carState";
import { createSensorConfig } from "./sensorModel";
import {
  DEFAULT_SIDE_SENSOR_LENGTH_RATIO,
  castSideSensorRays,
  createDefaultSideSensorProfileConfig,
} from "./sideSensorProfile";

describe("sideSensorProfile", () => {
  it("creates default side profile config from sensor config", () => {
    const sensorConfig = createSensorConfig({
      rayLength: 200,
    });

    const config = createDefaultSideSensorProfileConfig(sensorConfig);

    expect(config).toEqual({
      frontRayLength: 200,
      sideRayLength: 200 * DEFAULT_SIDE_SENSOR_LENGTH_RATIO,
      sensorEnabled: true,
    });
  });

  it("generates left and right side ray groups", () => {
    const car = createInitialCarState();
    const sensorConfig = createSensorConfig();

    const groups = castSideSensorRays({ car, sensorConfig });

    expect(groups.left).toHaveLength(2);
    expect(groups.right).toHaveLength(2);
    expect(groups.all).toHaveLength(4);
  });

  it("assigns deterministic side labels", () => {
    const groups = castSideSensorRays({
      car: createInitialCarState(),
      sensorConfig: createSensorConfig(),
    });

    expect(groups.all.map((entry) => entry.label)).toEqual([
      "left-diagonal-front",
      "left-side",
      "right-diagonal-front",
      "right-side",
    ]);
  });

  it("uses expected side angles when car heading is 0", () => {
    const car = {
      ...createInitialCarState(),
      angle: 0,
    };

    const groups = castSideSensorRays({
      car,
      sensorConfig: createSensorConfig(),
    });

    expect(groups.all[0].ray.angle).toBeCloseTo(-Math.PI / 4);
    expect(groups.all[1].ray.angle).toBeCloseTo(-Math.PI / 2);
    expect(groups.all[2].ray.angle).toBeCloseTo(Math.PI / 4);
    expect(groups.all[3].ray.angle).toBeCloseTo(Math.PI / 2);
  });

  it("keeps side rays shorter than front rays", () => {
    const sensorConfig = createSensorConfig({
      rayLength: 180,
    });

    const groups = castSideSensorRays({
      car: createInitialCarState(),
      sensorConfig,
    });

    for (const entry of groups.all) {
      expect(entry.ray.maxLength).toBe(180 * DEFAULT_SIDE_SENSOR_LENGTH_RATIO);
      expect(entry.ray.maxLength).toBeLessThan(sensorConfig.rayLength);
    }
  });

  it("rotates side rays with car heading", () => {
    const baseCar = {
      ...createInitialCarState(),
      angle: 0,
    };

    const rotatedCar = {
      ...createInitialCarState(),
      angle: Math.PI / 2,
    };

    const sensorConfig = createSensorConfig();

    const baseGroups = castSideSensorRays({ car: baseCar, sensorConfig });
    const rotatedGroups = castSideSensorRays({ car: rotatedCar, sensorConfig });

    for (let index = 0; index < baseGroups.all.length; index += 1) {
      expect(
        rotatedGroups.all[index].ray.angle - baseGroups.all[index].ray.angle,
      ).toBeCloseTo(Math.PI / 2);
    }
  });

  it("returns empty groups when sensors are disabled", () => {
    const groups = castSideSensorRays({
      car: createInitialCarState(),
      sensorConfig: createSensorConfig({
        sensorEnabled: false,
      }),
    });

    expect(groups).toEqual({
      left: [],
      right: [],
      all: [],
    });
  });

  it("is deterministic for repeated calls", () => {
    const car = createInitialCarState();
    const sensorConfig = createSensorConfig();

    const first = castSideSensorRays({ car, sensorConfig });
    const second = castSideSensorRays({ car, sensorConfig });

    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });

  it("does not mutate car state", () => {
    const car = createInitialCarState();
    const before = structuredClone(car);

    castSideSensorRays({
      car,
      sensorConfig: createSensorConfig(),
    });

    expect(car).toEqual(before);
  });

  it("rejects invalid car pose", () => {
    expect(() =>
      castSideSensorRays({
        car: {
          ...createInitialCarState(),
          angle: Number.NaN,
        },
        sensorConfig: createSensorConfig(),
      }),
    ).toThrow(RangeError);
  });
});
