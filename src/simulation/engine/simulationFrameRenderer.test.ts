import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialRoad } from "../world";
import { createInitialCar } from "../vehicle";
import {
  assertCarAppearsOnRoad,
  drawSimulationFrame,
  evaluateRoadCarComposition,
} from "./simulationFrameRenderer";

vi.mock("./roadRenderer", () => ({
  drawRoad: vi.fn(),
}));

vi.mock("./carRenderer", () => ({
  drawCar: vi.fn(),
}));

import { drawRoad } from "./roadRenderer";
import { drawCar } from "./carRenderer";

function createMockContext(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe("simulation frame renderer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies camera transform before drawing world objects", () => {
    const context = createMockContext();
    const road = createInitialRoad();
    const car = createInitialCar(road);

    drawSimulationFrame(context, road, car, {
      camera: {
        offsetX: 50,
        offsetY: 120,
        mode: "fixed",
      },
    });

    expect(context.translate).toHaveBeenCalledWith(50, 120);

    expect(vi.mocked(context.translate).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(drawRoad).mock.invocationCallOrder[0],
    );
  });

  it("draws road before car", () => {
    const context = createMockContext();
    const road = createInitialRoad();
    const car = createInitialCar(road);

    drawSimulationFrame(context, road, car);

    expect(drawRoad).toHaveBeenCalledWith(context, road, undefined);
    expect(drawCar).toHaveBeenCalledWith(context, car, undefined);

    expect(vi.mocked(drawRoad).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(drawCar).mock.invocationCallOrder[0],
    );
  });

  it("wraps world rendering in save and restore", () => {
    const context = createMockContext();
    const road = createInitialRoad();
    const car = createInitialCar(road);

    drawSimulationFrame(context, road, car);

    expect(context.save).toHaveBeenCalledTimes(1);
    expect(context.restore).toHaveBeenCalledTimes(1);

    expect(vi.mocked(context.save).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(context.restore).mock.invocationCallOrder[0],
    );
  });

  it("applies camera transform before drawing world objects", () => {
    const context = createMockContext();
    const road = createInitialRoad();
    const car = createInitialCar(road);

    drawSimulationFrame(context, road, car, {
      camera: {
        offsetX: 50,
        offsetY: 120,
        mode: "fixed",
      },
    });

    expect(context.translate).toHaveBeenCalledWith(50, 120);

    expect(vi.mocked(context.translate).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(drawRoad).mock.invocationCallOrder[0],
    );
  });

  it("does not translate when no camera is provided", () => {
    const context = createMockContext();
    const road = createInitialRoad();
    const car = createInitialCar(road);

    drawSimulationFrame(context, road, car);

    expect(context.translate).not.toHaveBeenCalled();
  });

  it("confirms default car starts inside road boundaries", () => {
    const road = createInitialRoad();
    const car = createInitialCar(road);

    expect(() => assertCarAppearsOnRoad(road, car)).not.toThrow();
  });

  it("evaluates valid default road/car composition", () => {
    const road = createInitialRoad();
    const car = createInitialCar(road);

    expect(evaluateRoadCarComposition(road, car, 1)).toEqual({
      carCenterInsideRoad: true,
      carFullyInsideRoad: true,
      carCenterAlignedWithLane: true,
    });
  });

  it("rejects car outside road boundaries", () => {
    const road = createInitialRoad();
    const car = {
      ...createInitialCar(road),
      positionX: 9999,
    };

    expect(() => assertCarAppearsOnRoad(road, car)).toThrow(RangeError);
  });

  it("rejects car body that is wider than road placement allows", () => {
    const road = createInitialRoad();
    const car = {
      ...createInitialCar(road),
      width: 999,
    };

    expect(() => assertCarAppearsOnRoad(road, car)).toThrow(RangeError);
  });

  it("rejects lane-center mismatch", () => {
    const road = createInitialRoad();
    const car = {
      ...createInitialCar(road),
      positionX: 401,
    };

    expect(() => assertCarAppearsOnRoad(road, car)).toThrow(RangeError);
  });
});

it("applies camera transform before drawing world objects", () => {
  const context = createMockContext();
  const road = createInitialRoad();
  const car = createInitialCar(road);

  drawSimulationFrame(context, road, car, {
    camera: {
      offsetX: 50,
      offsetY: 120,
      mode: "fixed",
    },
  });

  expect(context.translate).toHaveBeenCalledWith(50, 120);

  expect(vi.mocked(context.save).mock.invocationCallOrder[0]).toBeLessThan(
    vi.mocked(context.translate).mock.invocationCallOrder[0],
  );

  expect(vi.mocked(context.translate).mock.invocationCallOrder[0]).toBeLessThan(
    vi.mocked(drawRoad).mock.invocationCallOrder[0],
  );

  expect(vi.mocked(drawRoad).mock.invocationCallOrder[0]).toBeLessThan(
    vi.mocked(drawCar).mock.invocationCallOrder[0],
  );

  expect(vi.mocked(drawCar).mock.invocationCallOrder[0]).toBeLessThan(
    vi.mocked(context.restore).mock.invocationCallOrder[0],
  );
});

it("restores canvas state when world rendering throws", () => {
  const context = createMockContext();
  const road = createInitialRoad();
  const car = createInitialCar(road);

  vi.mocked(drawRoad).mockImplementationOnce(() => {
    throw new Error("road render failed");
  });

  expect(() => drawSimulationFrame(context, road, car)).toThrow("road render failed");

  expect(context.restore).toHaveBeenCalledTimes(1);
});
