import { describe, expect, it } from "vitest";
import { createInitialCarState } from "../vehicle/carState";
import {
  DEFAULT_SENSOR_CONFIG,
  createSensorConfig,
  createSensorPoint,
} from "./sensorModel";
import { castRay, castSensorRays, getSensorDirectionVector, lerp } from "./raycasting";

describe("raycasting", () => {
  describe("lerp", () => {
    it("returns the start value when t is 0", () => {
      expect(lerp(10, 20, 0)).toBe(10);
    });

    it("returns the end value when t is 1", () => {
      expect(lerp(10, 20, 1)).toBe(20);
    });

    it("returns the midpoint when t is 0.5", () => {
      expect(lerp(10, 20, 0.5)).toBe(15);
    });

    it("rejects non-finite inputs", () => {
      expect(() => lerp(Number.NaN, 20, 0.5)).toThrow(RangeError);
      expect(() => lerp(10, Number.POSITIVE_INFINITY, 0.5)).toThrow(RangeError);
      expect(() => lerp(10, 20, Number.NaN)).toThrow(RangeError);
    });
  });

  describe("getSensorDirectionVector", () => {
    it("maps 0 radians to upward/north", () => {
      expect(getSensorDirectionVector(0)).toEqual({ x: 0, y: -1 });
    });

    it("maps PI / 2 radians to right/east", () => {
      const vector = getSensorDirectionVector(Math.PI / 2);

      expect(vector.x).toBeCloseTo(1);
      expect(vector.y).toBeCloseTo(0);
    });

    it("maps PI radians to downward/south", () => {
      const vector = getSensorDirectionVector(Math.PI);

      expect(vector.x).toBeCloseTo(0);
      expect(vector.y).toBeCloseTo(1);
    });
  });

  describe("castRay", () => {
    it("generates one upward ray", () => {
      const ray = castRay({
        origin: createSensorPoint(100, 100),
        angle: 0,
        rayLength: 50,
        index: 0,
      });

      expect(ray).toEqual({
        index: 0,
        start: { x: 100, y: 100 },
        end: { x: 100, y: 50 },
        angle: 0,
        maxLength: 50,
      });
    });

    it("generates one right-facing ray", () => {
      const ray = castRay({
        origin: createSensorPoint(100, 100),
        angle: Math.PI / 2,
        rayLength: 50,
        index: 1,
      });

      expect(ray.index).toBe(1);
      expect(ray.start).toEqual({ x: 100, y: 100 });
      expect(ray.end.x).toBeCloseTo(150);
      expect(ray.end.y).toBeCloseTo(100);
      expect(ray.angle).toBe(Math.PI / 2);
      expect(ray.maxLength).toBe(50);
    });

    it("rejects invalid ray index", () => {
      expect(() =>
        castRay({
          origin: createSensorPoint(0, 0),
          angle: 0,
          rayLength: 50,
          index: -1,
        }),
      ).toThrow(RangeError);
    });

    it("rejects invalid ray length", () => {
      expect(() =>
        castRay({
          origin: createSensorPoint(0, 0),
          angle: 0,
          rayLength: 0,
          index: 0,
        }),
      ).toThrow(RangeError);
    });
  });

  describe("castSensorRays", () => {
    it("generates the configured number of rays", () => {
      const car = createInitialCarState();
      const rays = castSensorRays({
        car,
        config: DEFAULT_SENSOR_CONFIG,
      });

      expect(rays).toHaveLength(DEFAULT_SENSOR_CONFIG.rayCount);
    });

    it("centers rays around car heading", () => {
      const car = {
        ...createInitialCarState(),
        angle: 0,
      };

      const config = createSensorConfig({
        rayCount: 3,
        rayLength: 100,
        raySpread: Math.PI / 2,
        sensorEnabled: true,
      });

      const rays = castSensorRays({ car, config });

      expect(rays[0].angle).toBeCloseTo(-Math.PI / 4);
      expect(rays[1].angle).toBeCloseTo(0);
      expect(rays[2].angle).toBeCloseTo(Math.PI / 4);
    });

    it("aligns the middle ray with car heading when ray count is odd", () => {
      const car = {
        ...createInitialCarState(),
        angle: Math.PI / 3,
      };

      const config = createSensorConfig({
        rayCount: 5,
        rayLength: 100,
        raySpread: Math.PI / 2,
        sensorEnabled: true,
      });

      const rays = castSensorRays({ car, config });

      expect(rays[2].angle).toBeCloseTo(car.angle);
    });

    it("aligns the only ray with car heading when ray count is 1", () => {
      const car = {
        ...createInitialCarState(),
        angle: Math.PI / 6,
      };

      const config = createSensorConfig({
        rayCount: 1,
        rayLength: 100,
        raySpread: Math.PI / 2,
        sensorEnabled: true,
      });

      const rays = castSensorRays({ car, config });

      expect(rays).toHaveLength(1);
      expect(rays[0].angle).toBeCloseTo(car.angle);
    });

    it("returns rays in deterministic left-to-right order", () => {
      const car = {
        ...createInitialCarState(),
        angle: 0,
      };

      const config = createSensorConfig({
        rayCount: 5,
        rayLength: 100,
        raySpread: Math.PI / 2,
        sensorEnabled: true,
      });

      const rays = castSensorRays({ car, config });

      expect(rays.map((ray) => ray.index)).toEqual([0, 1, 2, 3, 4]);
      expect(rays[0].angle).toBeLessThan(rays[1].angle);
      expect(rays[1].angle).toBeLessThan(rays[2].angle);
      expect(rays[2].angle).toBeLessThan(rays[3].angle);
      expect(rays[3].angle).toBeLessThan(rays[4].angle);
    });

    it("returns empty rays when sensors are disabled", () => {
      const car = createInitialCarState();
      const config = createSensorConfig({
        sensorEnabled: false,
      });

      expect(castSensorRays({ car, config })).toEqual([]);
    });

    it("returns a new array each time", () => {
      const car = createInitialCarState();

      const first = castSensorRays({ car, config: DEFAULT_SENSOR_CONFIG });
      const second = castSensorRays({ car, config: DEFAULT_SENSOR_CONFIG });

      expect(first).not.toBe(second);
      expect(first).toEqual(second);
    });

    it("does not mutate car state", () => {
      const car = createInitialCarState();
      const before = structuredClone(car);

      castSensorRays({ car, config: DEFAULT_SENSOR_CONFIG });

      expect(car).toEqual(before);
    });

    it("does not mutate sensor config", () => {
      const car = createInitialCarState();
      const config = createSensorConfig();
      const before = structuredClone(config);

      castSensorRays({ car, config });

      expect(config).toEqual(before);
    });

    it("rejects invalid config", () => {
      const car = createInitialCarState();

      expect(() =>
        castSensorRays({
          car,
          config: {
            rayCount: 0,
            rayLength: 100,
            raySpread: Math.PI / 2,
            sensorEnabled: true,
          },
        }),
      ).toThrow(RangeError);
    });

    it("rejects invalid car pose", () => {
      const car = {
        ...createInitialCarState(),
        angle: Number.NaN,
      };

      expect(() =>
        castSensorRays({
          car,
          config: DEFAULT_SENSOR_CONFIG,
        }),
      ).toThrow(RangeError);
    });
  });
});
