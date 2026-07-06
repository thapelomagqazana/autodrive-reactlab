import { describe, expect, it } from "vitest";
import { createInitialCarState } from "../vehicle/carState";
import {
  createDefaultFrontSensorConfig,
  castFrontSensorRays,
  DEFAULT_FRONT_SENSOR_RAY_COUNT,
  DEFAULT_FRONT_SENSOR_SPREAD,
  DEFAULT_FRONT_SENSOR_RAY_LABELS,
} from "./frontSensorProfile";
import { createSensorConfig } from "./sensorModel";

describe("frontSensorProfile", () => {
  it("creates the default front sensor configuration", () => {
    const config = createDefaultFrontSensorConfig();

    expect(config.rayCount).toBe(DEFAULT_FRONT_SENSOR_RAY_COUNT);
    expect(config.raySpread).toBe(DEFAULT_FRONT_SENSOR_SPREAD);
    expect(config.rayLength).toBe(180);
    expect(config.sensorEnabled).toBe(true);
  });

  it("allows safe config overrides", () => {
    const config = createDefaultFrontSensorConfig({
      rayLength: 220,
      sensorEnabled: false,
    });

    expect(config).toEqual({
      rayCount: 5,
      rayLength: 220,
      raySpread: Math.PI / 2,
      sensorEnabled: false,
    });
  });

  it("generates 5 front rays by default", () => {
    const car = createInitialCarState();

    const rays = castFrontSensorRays({ car });

    expect(rays).toHaveLength(5);
  });

  it("assigns deterministic front sensor labels", () => {
    const car = createInitialCarState();

    const rays = castFrontSensorRays({ car });

    expect(rays.map((entry) => entry.label)).toEqual(DEFAULT_FRONT_SENSOR_RAY_LABELS);
  });

  it("aligns the middle ray with the car heading", () => {
    const car = {
      ...createInitialCarState(),
      angle: Math.PI / 3,
    };

    const rays = castFrontSensorRays({ car });

    expect(rays[2].label).toBe("forward");
    expect(rays[2].ray.angle).toBeCloseTo(car.angle);
  });

  it("places left rays left of the heading and right rays right of the heading", () => {
    const car = {
      ...createInitialCarState(),
      angle: 0,
    };

    const rays = castFrontSensorRays({ car });

    expect(rays[0].label).toBe("wide-left");
    expect(rays[1].label).toBe("front-left");
    expect(rays[2].label).toBe("forward");
    expect(rays[3].label).toBe("front-right");
    expect(rays[4].label).toBe("wide-right");

    expect(rays[0].ray.angle).toBeLessThan(car.angle);
    expect(rays[1].ray.angle).toBeLessThan(car.angle);
    expect(rays[2].ray.angle).toBeCloseTo(car.angle);
    expect(rays[3].ray.angle).toBeGreaterThan(car.angle);
    expect(rays[4].ray.angle).toBeGreaterThan(car.angle);
  });

  it("uses the expected 90-degree spread boundaries", () => {
    const car = {
      ...createInitialCarState(),
      angle: 0,
    };

    const rays = castFrontSensorRays({ car });

    expect(rays[0].ray.angle).toBeCloseTo(-Math.PI / 4);
    expect(rays[4].ray.angle).toBeCloseTo(Math.PI / 4);
  });

  it("rotates all rays when car heading changes", () => {
    const baseCar = {
      ...createInitialCarState(),
      angle: 0,
    };

    const rotatedCar = {
      ...createInitialCarState(),
      angle: Math.PI / 2,
    };

    const baseRays = castFrontSensorRays({ car: baseCar });
    const rotatedRays = castFrontSensorRays({ car: rotatedCar });

    for (let index = 0; index < baseRays.length; index += 1) {
      expect(rotatedRays[index].ray.angle - baseRays[index].ray.angle).toBeCloseTo(
        Math.PI / 2,
      );
    }
  });

  it("returns no rays when sensors are disabled", () => {
    const car = createInitialCarState();

    const config = createDefaultFrontSensorConfig({
      sensorEnabled: false,
    });

    expect(castFrontSensorRays({ car, config })).toEqual([]);
  });

  it("is deterministic for repeated calls", () => {
    const car = createInitialCarState();

    const first = castFrontSensorRays({ car });
    const second = castFrontSensorRays({ car });

    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });

  it("does not mutate car state", () => {
    const car = createInitialCarState();
    const before = structuredClone(car);

    castFrontSensorRays({ car });

    expect(car).toEqual(before);
  });

  it("rejects non-front profile ray counts", () => {
    const car = createInitialCarState();

    const invalidFrontConfig = createSensorConfig({
      rayCount: 7,
      rayLength: 180,
      raySpread: Math.PI / 2,
      sensorEnabled: true,
    });

    expect(() =>
      castFrontSensorRays({
        car,
        config: invalidFrontConfig,
      }),
    ).toThrow(RangeError);
  });
});
