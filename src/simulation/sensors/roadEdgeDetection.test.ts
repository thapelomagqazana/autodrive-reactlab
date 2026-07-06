import { describe, expect, it } from "vitest";
import { createSensorPoint, type SensorRay } from "./sensorModel";
import {
  detectClosestRoadEdgeIntersection,
  getIntersection,
  type RoadBoundarySegment,
} from "./roadEdgeDetection";

function createRay(overrides: Partial<SensorRay> = {}): SensorRay {
  return {
    index: 0,
    start: createSensorPoint(0, 0),
    end: createSensorPoint(100, 0),
    angle: Math.PI / 2,
    maxLength: 100,
    ...overrides,
  };
}

describe("roadEdgeDetection", () => {
  describe("getIntersection", () => {
    it("returns intersection point and offsets for crossing segments", () => {
      const result = getIntersection(
        { start: createSensorPoint(0, 0), end: createSensorPoint(100, 0) },
        { start: createSensorPoint(50, -50), end: createSensorPoint(50, 50) },
      );

      expect(result).not.toBeNull();
      expect(result?.point).toEqual({ x: 50, y: 0 });
      expect(result?.offsetOnFirstSegment).toBeCloseTo(0.5);
      expect(result?.offsetOnSecondSegment).toBeCloseTo(0.5);
    });

    it("returns null for parallel non-overlapping segments", () => {
      expect(
        getIntersection(
          { start: createSensorPoint(0, 0), end: createSensorPoint(100, 0) },
          { start: createSensorPoint(0, 10), end: createSensorPoint(100, 10) },
        ),
      ).toBeNull();
    });

    it("returns null when intersection is outside first segment", () => {
      expect(
        getIntersection(
          { start: createSensorPoint(0, 0), end: createSensorPoint(10, 0) },
          { start: createSensorPoint(50, -10), end: createSensorPoint(50, 10) },
        ),
      ).toBeNull();
    });

    it("accepts endpoint contact", () => {
      const result = getIntersection(
        { start: createSensorPoint(0, 0), end: createSensorPoint(100, 0) },
        { start: createSensorPoint(100, 0), end: createSensorPoint(100, 50) },
      );

      expect(result).not.toBeNull();
      expect(result?.point).toEqual({ x: 100, y: 0 });
      expect(result?.offsetOnFirstSegment).toBeCloseTo(1);
    });
  });

  describe("detectClosestRoadEdgeIntersection", () => {
    it("detects left road boundary", () => {
      const ray = createRay();
      const boundaries: RoadBoundarySegment[] = [
        {
          side: "left",
          start: createSensorPoint(40, -50),
          end: createSensorPoint(40, 50),
        },
      ];

      const result = detectClosestRoadEdgeIntersection(ray, boundaries);

      expect(result).toMatchObject({
        detectionType: "road-boundary",
        boundarySide: "left",
        point: { x: 40, y: 0 },
        rayIndex: 0,
      });
      expect(result?.distance).toBeCloseTo(40);
      expect(result?.normalizedOffset).toBeCloseTo(0.4);
    });

    it("detects right road boundary", () => {
      const ray = createRay();
      const boundaries: RoadBoundarySegment[] = [
        {
          side: "right",
          start: createSensorPoint(75, -50),
          end: createSensorPoint(75, 50),
        },
      ];

      const result = detectClosestRoadEdgeIntersection(ray, boundaries);

      expect(result?.boundarySide).toBe("right");
      expect(result?.distance).toBeCloseTo(75);
      expect(result?.normalizedOffset).toBeCloseTo(0.75);
    });

    it("returns null when no boundary is hit", () => {
      const ray = createRay();
      const boundaries: RoadBoundarySegment[] = [
        {
          side: "left",
          start: createSensorPoint(150, -50),
          end: createSensorPoint(150, 50),
        },
      ];

      expect(detectClosestRoadEdgeIntersection(ray, boundaries)).toBeNull();
    });

    it("returns closest intersection when multiple boundaries are hit", () => {
      const ray = createRay();
      const boundaries: RoadBoundarySegment[] = [
        {
          side: "right",
          start: createSensorPoint(80, -50),
          end: createSensorPoint(80, 50),
        },
        {
          side: "left",
          start: createSensorPoint(30, -50),
          end: createSensorPoint(30, 50),
        },
      ];

      const result = detectClosestRoadEdgeIntersection(ray, boundaries);

      expect(result?.boundarySide).toBe("left");
      expect(result?.distance).toBeCloseTo(30);
    });

    it("ignores intersection behind ray start", () => {
      const ray = createRay();
      const boundaries: RoadBoundarySegment[] = [
        {
          side: "left",
          start: createSensorPoint(-20, -50),
          end: createSensorPoint(-20, 50),
        },
      ];

      expect(detectClosestRoadEdgeIntersection(ray, boundaries)).toBeNull();
    });

    it("ignores intersection beyond ray end", () => {
      const ray = createRay();
      const boundaries: RoadBoundarySegment[] = [
        {
          side: "right",
          start: createSensorPoint(120, -50),
          end: createSensorPoint(120, 50),
        },
      ];

      expect(detectClosestRoadEdgeIntersection(ray, boundaries)).toBeNull();
    });

    it("supports normalized offset near 0", () => {
      const ray = createRay();
      const boundaries: RoadBoundarySegment[] = [
        {
          side: "left",
          start: createSensorPoint(0, -50),
          end: createSensorPoint(0, 50),
        },
      ];

      const result = detectClosestRoadEdgeIntersection(ray, boundaries);

      expect(result?.normalizedOffset).toBeCloseTo(0);
    });

    it("supports normalized offset near 1", () => {
      const ray = createRay();
      const boundaries: RoadBoundarySegment[] = [
        {
          side: "right",
          start: createSensorPoint(100, -50),
          end: createSensorPoint(100, 50),
        },
      ];

      const result = detectClosestRoadEdgeIntersection(ray, boundaries);

      expect(result?.normalizedOffset).toBeCloseTo(1);
    });

    it("does not mutate ray or boundary inputs", () => {
      const ray = createRay();
      const boundaries: RoadBoundarySegment[] = [
        {
          side: "left",
          start: createSensorPoint(40, -50),
          end: createSensorPoint(40, 50),
        },
      ];

      const rayBefore = structuredClone(ray);
      const boundariesBefore = structuredClone(boundaries);

      detectClosestRoadEdgeIntersection(ray, boundaries);

      expect(ray).toEqual(rayBefore);
      expect(boundaries).toEqual(boundariesBefore);
    });

    it("rejects invalid ray geometry", () => {
      const ray = createRay({
        maxLength: 0,
      });

      expect(() => detectClosestRoadEdgeIntersection(ray, [])).toThrow(RangeError);
    });
  });
});
