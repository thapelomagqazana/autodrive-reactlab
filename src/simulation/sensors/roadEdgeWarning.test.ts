import { describe, expect, it } from "vitest";
import {
  createDetectedSensorReading,
  createNoDetectionSensorReading,
} from "./sensorModel";
import {
  createRoadEdgeWarningThresholds,
  evaluateRoadEdgeWarning,
} from "./roadEdgeWarning";

describe("roadEdgeWarning", () => {
  it("creates default thresholds", () => {
    expect(createRoadEdgeWarningThresholds()).toEqual({
      warningDistance: 80,
      dangerDistance: 35,
    });
  });

  it("rejects invalid thresholds", () => {
    expect(() => createRoadEdgeWarningThresholds({ warningDistance: 0 })).toThrow(
      RangeError,
    );
    expect(() => createRoadEdgeWarningThresholds({ dangerDistance: 0 })).toThrow(
      RangeError,
    );
    expect(() => createRoadEdgeWarningThresholds({ warningDistance: Infinity })).toThrow(
      RangeError,
    );
    expect(() => createRoadEdgeWarningThresholds({ dangerDistance: Number.NaN })).toThrow(
      RangeError,
    );
    expect(() =>
      createRoadEdgeWarningThresholds({
        warningDistance: 80,
        dangerDistance: 80,
      }),
    ).toThrow(RangeError);
  });

  it("returns disabled when sensors are disabled", () => {
    const result = evaluateRoadEdgeWarning({
      sensorEnabled: false,
      leftReadings: [
        createDetectedSensorReading({
          rayIndex: 0,
          detectionType: "road-boundary",
          distance: 10,
          point: { x: 0, y: 0 },
        }),
      ],
      rightReadings: [],
      isCarOffRoad: false,
    });

    expect(result.left.state).toBe("disabled");
    expect(result.right.state).toBe("disabled");
    expect(result.overallState).toBe("disabled");
    expect(result.nearestDistance).toBeNull();
    expect(result.nearestSide).toBeNull();
  });

  it("returns unknown when no road-boundary readings exist", () => {
    const result = evaluateRoadEdgeWarning({
      sensorEnabled: true,
      leftReadings: [],
      rightReadings: [createNoDetectionSensorReading(1)],
      isCarOffRoad: false,
    });

    expect(result.left.state).toBe("unknown");
    expect(result.right.state).toBe("unknown");
    expect(result.overallState).toBe("unknown");
  });

  it("detects left warning", () => {
    const result = evaluateRoadEdgeWarning({
      sensorEnabled: true,
      leftReadings: [
        createDetectedSensorReading({
          rayIndex: 0,
          detectionType: "road-boundary",
          distance: 60,
          point: { x: -60, y: 0 },
        }),
      ],
      rightReadings: [],
      isCarOffRoad: false,
    });

    expect(result.left.state).toBe("warning");
    expect(result.overallState).toBe("warning");
  });

  it("detects left danger", () => {
    const result = evaluateRoadEdgeWarning({
      sensorEnabled: true,
      leftReadings: [
        createDetectedSensorReading({
          rayIndex: 0,
          detectionType: "road-boundary",
          distance: 20,
          point: { x: -20, y: 0 },
        }),
      ],
      rightReadings: [],
      isCarOffRoad: false,
    });

    expect(result.left.state).toBe("danger");
    expect(result.overallState).toBe("danger");
  });

  it("detects right warning", () => {
    const result = evaluateRoadEdgeWarning({
      sensorEnabled: true,
      leftReadings: [],
      rightReadings: [
        createDetectedSensorReading({
          rayIndex: 1,
          detectionType: "road-boundary",
          distance: 70,
          point: { x: 70, y: 0 },
        }),
      ],
      isCarOffRoad: false,
    });

    expect(result.right.state).toBe("warning");
    expect(result.overallState).toBe("warning");
  });

  it("detects right danger", () => {
    const result = evaluateRoadEdgeWarning({
      sensorEnabled: true,
      leftReadings: [],
      rightReadings: [
        createDetectedSensorReading({
          rayIndex: 1,
          detectionType: "road-boundary",
          distance: 35,
          point: { x: 35, y: 0 },
        }),
      ],
      isCarOffRoad: false,
    });

    expect(result.right.state).toBe("danger");
    expect(result.overallState).toBe("danger");
  });

  it("returns safe when road-boundary distance is greater than warning threshold", () => {
    const result = evaluateRoadEdgeWarning({
      sensorEnabled: true,
      leftReadings: [
        createDetectedSensorReading({
          rayIndex: 0,
          detectionType: "road-boundary",
          distance: 120,
          point: { x: -120, y: 0 },
        }),
      ],
      rightReadings: [
        createDetectedSensorReading({
          rayIndex: 1,
          detectionType: "road-boundary",
          distance: 140,
          point: { x: 140, y: 0 },
        }),
      ],
      isCarOffRoad: false,
    });

    expect(result.left.state).toBe("safe");
    expect(result.right.state).toBe("safe");
    expect(result.overallState).toBe("safe");
  });

  it("overall state chooses highest severity", () => {
    const result = evaluateRoadEdgeWarning({
      sensorEnabled: true,
      leftReadings: [
        createDetectedSensorReading({
          rayIndex: 0,
          detectionType: "road-boundary",
          distance: 70,
          point: { x: -70, y: 0 },
        }),
      ],
      rightReadings: [
        createDetectedSensorReading({
          rayIndex: 1,
          detectionType: "road-boundary",
          distance: 20,
          point: { x: 20, y: 0 },
        }),
      ],
      isCarOffRoad: false,
    });

    expect(result.left.state).toBe("warning");
    expect(result.right.state).toBe("danger");
    expect(result.overallState).toBe("danger");
    expect(result.nearestSide).toBe("right");
    expect(result.nearestDistance).toBe(20);
  });

  it("ignores non-road-boundary detections", () => {
    const result = evaluateRoadEdgeWarning({
      sensorEnabled: true,
      leftReadings: [
        createDetectedSensorReading({
          rayIndex: 0,
          detectionType: "obstacle",
          distance: 10,
          point: { x: -10, y: 0 },
        }),
      ],
      rightReadings: [],
      isCarOffRoad: false,
    });

    expect(result.left.state).toBe("unknown");
    expect(result.overallState).toBe("unknown");
  });

  it("does not mutate inputs", () => {
    const leftReadings = [
      createDetectedSensorReading({
        rayIndex: 0,
        detectionType: "road-boundary",
        distance: 60,
        point: { x: -60, y: 0 },
      }),
    ];

    const rightReadings = [createNoDetectionSensorReading(1)];

    const leftBefore = structuredClone(leftReadings);
    const rightBefore = structuredClone(rightReadings);

    evaluateRoadEdgeWarning({
      sensorEnabled: true,
      leftReadings,
      rightReadings,
      isCarOffRoad: false,
    });

    expect(leftReadings).toEqual(leftBefore);
    expect(rightReadings).toEqual(rightBefore);
  });
});

it("returns off-road when car is off-road", () => {
  const result = evaluateRoadEdgeWarning({
    sensorEnabled: true,
    isCarOffRoad: true,
    leftReadings: [],
    rightReadings: [],
  });

  expect(result.left.state).toBe("off-road");
  expect(result.right.state).toBe("off-road");
  expect(result.overallState).toBe("off-road");
  expect(result.nearestDistance).toBeNull();
  expect(result.nearestSide).toBeNull();
});
