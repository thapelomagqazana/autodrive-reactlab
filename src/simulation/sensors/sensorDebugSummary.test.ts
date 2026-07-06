import { describe, expect, it } from "vitest";
import {
  createSensorConfig,
  createDetectedSensorReading,
  createNoDetectionSensorReading,
} from "./sensorModel";
import { createInitialSensorState } from "./sensorState";
import { createSensorDebugSummary } from "./sensorDebugSummary";

describe("sensorDebugSummary", () => {
  it("returns disabled display values when sensors are disabled", () => {
    const summary = createSensorDebugSummary({
      sensorState: createInitialSensorState(createSensorConfig({ sensorEnabled: false })),
      groupedReadings: {
        front: [
          createDetectedSensorReading({
            rayIndex: 0,
            detectionType: "road-boundary",
            distance: 20,
            point: { x: 0, y: 0 },
          }),
        ],
        left: [],
        right: [],
      },
    });

    expect(summary.status).toBe("Disabled");
    expect(summary.front.displayDistance).toBe("Disabled");
    expect(summary.nearestDetection).toBeNull();
  });

  it("handles empty readings safely", () => {
    const summary = createSensorDebugSummary({
      sensorState: createInitialSensorState(),
      groupedReadings: {
        front: [],
        left: [],
        right: [],
      },
    });

    expect(summary.front.displayDistance).toBe("No data");
    expect(summary.left.displayDistance).toBe("No data");
    expect(summary.right.displayDistance).toBe("No data");
    expect(summary.nearestDetection).toBeNull();
  });

  it("renders no-detection readings as clear", () => {
    const summary = createSensorDebugSummary({
      sensorState: createInitialSensorState(),
      groupedReadings: {
        front: [createNoDetectionSensorReading(0)],
        left: [createNoDetectionSensorReading(1)],
        right: [createNoDetectionSensorReading(2)],
      },
    });

    expect(summary.front.displayDistance).toBe("Clear");
    expect(summary.left.displayDistance).toBe("Clear");
    expect(summary.right.displayDistance).toBe("Clear");
  });

  it("summarizes nearest front, left, and right detections", () => {
    const summary = createSensorDebugSummary({
      sensorState: createInitialSensorState(),
      groupedReadings: {
        front: [
          createDetectedSensorReading({
            rayIndex: 0,
            detectionType: "road-boundary",
            distance: 80,
            point: { x: 0, y: -80 },
          }),
          createDetectedSensorReading({
            rayIndex: 1,
            detectionType: "obstacle",
            distance: 40,
            point: { x: 0, y: -40 },
          }),
        ],
        left: [
          createDetectedSensorReading({
            rayIndex: 2,
            detectionType: "road-boundary",
            distance: 30,
            point: { x: -30, y: 0 },
          }),
        ],
        right: [
          createDetectedSensorReading({
            rayIndex: 3,
            detectionType: "vehicle",
            distance: 60,
            point: { x: 60, y: 0 },
          }),
        ],
      },
    });

    expect(summary.front.displayDistance).toBe("40 px");
    expect(summary.left.displayDistance).toBe("30 px");
    expect(summary.right.displayDistance).toBe("60 px");
    expect(summary.nearestDetection).toEqual({
      group: "left",
      detectionType: "road-boundary",
      distance: 30,
      displayDistance: "30 px",
    });
  });
});
