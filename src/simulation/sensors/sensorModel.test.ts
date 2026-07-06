import { describe, expect, it } from "vitest";
import {
  DEFAULT_SENSOR_CONFIG,
  assertValidSensorConfig,
  createDetectedSensorReading,
  createNoDetectionSensorReading,
  createSensorConfig,
  createSensorPoint,
  isValidRayCount,
  isValidRayLength,
  isValidRaySpread,
} from "./sensorModel";

describe("sensorModel", () => {
  describe("default sensor configuration", () => {
    it("defines valid default sensor settings", () => {
      expect(DEFAULT_SENSOR_CONFIG).toEqual({
        rayCount: 7,
        rayLength: 180,
        raySpread: Math.PI / 2,
        sensorEnabled: true,
      });

      expect(() => assertValidSensorConfig(DEFAULT_SENSOR_CONFIG)).not.toThrow();
    });
  });

  describe("createSensorConfig", () => {
    it("accepts valid custom configuration", () => {
      const config = createSensorConfig({
        rayCount: 5,
        rayLength: 120,
        raySpread: Math.PI / 3,
        sensorEnabled: false,
      });

      expect(config).toEqual({
        rayCount: 5,
        rayLength: 120,
        raySpread: Math.PI / 3,
        sensorEnabled: false,
      });
    });

    it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
      "rejects invalid rayCount: %s",
      (rayCount) => {
        expect(() => createSensorConfig({ rayCount })).toThrow(RangeError);
      },
    );

    it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
      "rejects invalid rayLength: %s",
      (rayLength) => {
        expect(() => createSensorConfig({ rayLength })).toThrow(RangeError);
      },
    );

    it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, Math.PI + 0.01])(
      "rejects invalid raySpread: %s",
      (raySpread) => {
        expect(() => createSensorConfig({ raySpread })).toThrow(RangeError);
      },
    );
  });

  describe("validation helpers", () => {
    it("validates ray count boundaries", () => {
      expect(isValidRayCount(1)).toBe(true);
      expect(isValidRayCount(7)).toBe(true);
      expect(isValidRayCount(0)).toBe(false);
      expect(isValidRayCount(2.5)).toBe(false);
    });

    it("validates ray length boundaries", () => {
      expect(isValidRayLength(1)).toBe(true);
      expect(isValidRayLength(180)).toBe(true);
      expect(isValidRayLength(0)).toBe(false);
      expect(isValidRayLength(Number.NaN)).toBe(false);
    });

    it("validates ray spread boundaries", () => {
      expect(isValidRaySpread(0.1)).toBe(true);
      expect(isValidRaySpread(Math.PI)).toBe(true);
      expect(isValidRaySpread(0)).toBe(false);
      expect(isValidRaySpread(Math.PI + 0.1)).toBe(false);
    });
  });

  describe("sensor readings", () => {
    it("creates a no-detection reading", () => {
      const reading = createNoDetectionSensorReading(0);

      expect(reading).toEqual({
        rayIndex: 0,
        detected: false,
        detectionType: null,
        distance: null,
        point: null,
      });
    });

    it("creates a detected reading", () => {
      const point = createSensorPoint(10, 20);

      const reading = createDetectedSensorReading({
        rayIndex: 2,
        detectionType: "obstacle",
        distance: 42,
        point,
      });

      expect(reading).toEqual({
        rayIndex: 2,
        detected: true,
        detectionType: "obstacle",
        distance: 42,
        point: { x: 10, y: 20 },
      });
    });

    it("rejects invalid ray index for readings", () => {
      expect(() => createNoDetectionSensorReading(-1)).toThrow(RangeError);
      expect(() => createNoDetectionSensorReading(1.5)).toThrow(RangeError);
    });

    it("rejects invalid detection distance", () => {
      expect(() =>
        createDetectedSensorReading({
          rayIndex: 0,
          detectionType: "obstacle",
          distance: -1,
          point: createSensorPoint(0, 0),
        }),
      ).toThrow(RangeError);
    });
  });
});
