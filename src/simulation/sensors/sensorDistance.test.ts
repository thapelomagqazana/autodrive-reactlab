import { describe, expect, it } from "vitest";
import { createSensorPoint, type SensorRay } from "./sensorModel";
import {
  calculateHitDistance,
  calculateRayLength,
  createNearestSensorReading,
  createSensorReadingFromCandidate,
  distanceToPercentage,
  isCandidateWithinRayRange,
  normalizeDistance,
  selectNearestDetectionCandidate,
  summarizeHitDistance,
} from "./sensorDistance";

function createRay(overrides: Partial<SensorRay> = {}): SensorRay {
  return {
    index: 0,
    start: createSensorPoint(0, 0),
    end: createSensorPoint(0, -100),
    angle: 0,
    maxLength: 100,
    ...overrides,
  };
}

describe("sensorDistance", () => {
  it("calculates ray length", () => {
    expect(calculateRayLength(createRay())).toBeCloseTo(100);
  });

  it("calculates hit distance from ray start", () => {
    expect(calculateHitDistance(createRay(), createSensorPoint(0, -25))).toBeCloseTo(25);
  });

  it("normalizes distance", () => {
    expect(normalizeDistance(25, 100)).toBeCloseTo(0.25);
  });

  it("converts normalized distance to percentage", () => {
    expect(distanceToPercentage(0.25)).toBeCloseTo(25);
  });

  it("summarizes hit distance", () => {
    expect(summarizeHitDistance(createRay(), createSensorPoint(0, -25))).toEqual({
      rawDistance: 25,
      normalizedDistance: 0.25,
      percentage: 25,
    });
  });

  it("creates explicit no-detection reading", () => {
    expect(createSensorReadingFromCandidate(createRay(), null)).toEqual({
      rayIndex: 0,
      detected: false,
      detectionType: null,
      distance: null,
      point: null,
    });
  });

  it("creates detected reading from valid candidate", () => {
    expect(
      createSensorReadingFromCandidate(createRay(), {
        detectionType: "road-boundary",
        point: createSensorPoint(0, -25),
      }),
    ).toEqual({
      rayIndex: 0,
      detected: true,
      detectionType: "road-boundary",
      distance: 25,
      point: { x: 0, y: -25 },
    });
  });

  it("returns no-detection reading when candidate is beyond ray range", () => {
    expect(
      createSensorReadingFromCandidate(createRay(), {
        detectionType: "road-boundary",
        point: createSensorPoint(0, -125),
      }),
    ).toEqual({
      rayIndex: 0,
      detected: false,
      detectionType: null,
      distance: null,
      point: null,
    });
  });

  it("selects nearest candidate within range", () => {
    const nearest = selectNearestDetectionCandidate(createRay(), [
      {
        detectionType: "obstacle",
        point: createSensorPoint(0, -80),
      },
      {
        detectionType: "road-boundary",
        point: createSensorPoint(0, -30),
      },
    ]);

    expect(nearest).toEqual({
      detectionType: "road-boundary",
      point: { x: 0, y: -30 },
    });
  });

  it("ignores candidates beyond ray range", () => {
    const nearest = selectNearestDetectionCandidate(createRay(), [
      {
        detectionType: "obstacle",
        point: createSensorPoint(0, -120),
      },
    ]);

    expect(nearest).toBeNull();
  });

  it("creates nearest sensor reading", () => {
    const reading = createNearestSensorReading(createRay(), [
      {
        detectionType: "obstacle",
        point: createSensorPoint(0, -80),
      },
      {
        detectionType: "road-boundary",
        point: createSensorPoint(0, -20),
      },
    ]);

    expect(reading).toEqual({
      rayIndex: 0,
      detected: true,
      detectionType: "road-boundary",
      distance: 20,
      point: { x: 0, y: -20 },
    });
  });

  it("accepts hit at ray start", () => {
    const ray = createRay();

    expect(summarizeHitDistance(ray, ray.start)).toEqual({
      rawDistance: 0,
      normalizedDistance: 0,
      percentage: 0,
    });
  });

  it("accepts hit at ray end", () => {
    const ray = createRay();

    expect(summarizeHitDistance(ray, ray.end)).toEqual({
      rawDistance: 100,
      normalizedDistance: 1,
      percentage: 100,
    });
  });

  it("checks whether candidate is within ray range", () => {
    expect(
      isCandidateWithinRayRange(createRay(), {
        detectionType: "road-boundary",
        point: createSensorPoint(0, -50),
      }),
    ).toBe(true);

    expect(
      isCandidateWithinRayRange(createRay(), {
        detectionType: "road-boundary",
        point: createSensorPoint(0, -150),
      }),
    ).toBe(false);
  });

  it("rejects invalid distance normalization", () => {
    expect(() => normalizeDistance(Number.NaN, 100)).toThrow(RangeError);
    expect(() => normalizeDistance(-1, 100)).toThrow(RangeError);
    expect(() => normalizeDistance(10, 0)).toThrow(RangeError);
    expect(() => normalizeDistance(101, 100)).toThrow(RangeError);
  });

  it("rejects invalid normalized percentage input", () => {
    expect(() => distanceToPercentage(Number.NaN)).toThrow(RangeError);
    expect(() => distanceToPercentage(-0.01)).toThrow(RangeError);
    expect(() => distanceToPercentage(1.01)).toThrow(RangeError);
  });

  it("rejects invalid ray", () => {
    expect(() =>
      calculateRayLength(
        createRay({
          maxLength: 0,
        }),
      ),
    ).toThrow(RangeError);
  });

  it("does not mutate inputs", () => {
    const ray = createRay();
    const candidates = [
      {
        detectionType: "road-boundary" as const,
        point: createSensorPoint(0, -40),
      },
    ];

    const rayBefore = structuredClone(ray);
    const candidatesBefore = structuredClone(candidates);

    createNearestSensorReading(ray, candidates);

    expect(ray).toEqual(rayBefore);
    expect(candidates).toEqual(candidatesBefore);
  });
});
