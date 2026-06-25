import { describe, expect, it, vi } from "vitest";
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
  return {} as CanvasRenderingContext2D;
}

describe("simulation frame renderer", () => {
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
