import { describe, expect, it, vi } from "vitest";
import type { SensorRay, SensorReading } from "../sensors/sensorModel";
import { drawSensors } from "./sensorRenderer";

function createMockContext(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 1,
  } as unknown as CanvasRenderingContext2D;
}

function createRay(index = 0): SensorRay {
  return {
    index,
    start: { x: 0, y: 0 },
    end: { x: 0, y: -100 },
    angle: 0,
    maxLength: 100,
  };
}

describe("sensorRenderer", () => {
  it("draws nothing when overlay is disabled", () => {
    const context = createMockContext();

    drawSensors(context, {
      isEnabled: false,
      rays: [createRay()],
      readings: [],
    });

    expect(context.beginPath).not.toHaveBeenCalled();
    expect(context.stroke).not.toHaveBeenCalled();
    expect(context.fill).not.toHaveBeenCalled();
  });

  it("draws a full clear line for missing reading", () => {
    const context = createMockContext();

    drawSensors(context, {
      isEnabled: true,
      rays: [createRay()],
      readings: [],
    });

    expect(context.moveTo).toHaveBeenCalledWith(0, 0);
    expect(context.lineTo).toHaveBeenCalledWith(0, -100);
    expect(context.stroke).toHaveBeenCalledTimes(1);
  });

  it("draws a full clear line for no-detection reading", () => {
    const context = createMockContext();

    const reading: SensorReading = {
      rayIndex: 0,
      detected: false,
      detectionType: null,
      distance: null,
      point: null,
    };

    drawSensors(context, {
      isEnabled: true,
      rays: [createRay()],
      readings: [reading],
    });

    expect(context.lineTo).toHaveBeenCalledWith(0, -100);
    expect(context.stroke).toHaveBeenCalledTimes(1);
    expect(context.arc).not.toHaveBeenCalled();
  });

  it("draws clear segment, danger segment, and hit marker for detected reading", () => {
    const context = createMockContext();

    const reading: SensorReading = {
      rayIndex: 0,
      detected: true,
      detectionType: "road-boundary",
      distance: 40,
      point: { x: 0, y: -40 },
    };

    drawSensors(context, {
      isEnabled: true,
      rays: [createRay()],
      readings: [reading],
    });

    expect(context.moveTo).toHaveBeenCalledWith(0, 0);
    expect(context.lineTo).toHaveBeenCalledWith(0, -40);
    expect(context.moveTo).toHaveBeenCalledWith(0, -40);
    expect(context.lineTo).toHaveBeenCalledWith(0, -100);
    expect(context.arc).toHaveBeenCalledWith(0, -40, 4, 0, Math.PI * 2);
    expect(context.stroke).toHaveBeenCalledTimes(2);
    expect(context.fill).toHaveBeenCalledTimes(1);
  });

  it("maps readings to rays by ray index", () => {
    const context = createMockContext();

    drawSensors(context, {
      isEnabled: true,
      rays: [createRay(7)],
      readings: [
        {
          rayIndex: 7,
          detected: true,
          detectionType: "road-boundary",
          distance: 25,
          point: { x: 0, y: -25 },
        },
      ],
    });

    expect(context.lineTo).toHaveBeenCalledWith(0, -25);
    expect(context.arc).toHaveBeenCalledWith(0, -25, 4, 0, Math.PI * 2);
  });

  it("does not mutate inputs", () => {
    const context = createMockContext();

    const rays = [createRay()];
    const readings: SensorReading[] = [
      {
        rayIndex: 0,
        detected: true,
        detectionType: "road-boundary",
        distance: 40,
        point: { x: 0, y: -40 },
      },
    ];

    const raysBefore = structuredClone(rays);
    const readingsBefore = structuredClone(readings);

    drawSensors(context, {
      isEnabled: true,
      rays,
      readings,
    });

    expect(rays).toEqual(raysBefore);
    expect(readings).toEqual(readingsBefore);
  });

  it("rejects invalid ray coordinates", () => {
    const context = createMockContext();

    expect(() =>
      drawSensors(context, {
        isEnabled: true,
        rays: [
          {
            ...createRay(),
            start: { x: Number.NaN, y: 0 },
          },
        ],
        readings: [],
      }),
    ).toThrow(RangeError);
  });
});
