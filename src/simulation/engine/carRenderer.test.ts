import { describe, expect, it, vi } from "vitest";
import { createInitialRoad } from "../world";
import { createInitialCar } from "../vehicle";
import { DEFAULT_DRAW_CAR_OPTIONS, assertDrawableCarState, drawCar } from "./carRenderer";

function createMockContext(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    beginPath: vi.fn(),
    roundRect: vi.fn(),
    rect: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    shadowColor: "",
    shadowBlur: 0,
  } as unknown as CanvasRenderingContext2D;
}

describe("drawCar", () => {
  it("draws the car from CarState", () => {
    const context = createMockContext();
    const car = createInitialCar(createInitialRoad());

    drawCar(context, car);

    expect(context.translate).toHaveBeenCalledWith(car.positionX, car.positionY);
    expect(context.rotate).toHaveBeenCalledWith(car.angle);
    expect(context.beginPath).toHaveBeenCalledOnce();
    expect(context.fill).toHaveBeenCalledOnce();
    expect(context.stroke).toHaveBeenCalledOnce();
  });

  it("uses center-based dimensions", () => {
    const context = createMockContext();
    const car = createInitialCar(createInitialRoad());

    drawCar(context, car);

    expect(context.rect).toHaveBeenCalledWith(
      -car.width / 2,
      -car.height / 2,
      car.width,
      car.height,
    );
  });

  it("draws a front indicator", () => {
    const context = createMockContext();
    const car = createInitialCar(createInitialRoad());

    drawCar(context, car);

    expect(context.fillRect).toHaveBeenCalled();
  });

  it("applies default Tesla/Mission-Control styling", () => {
    const context = createMockContext();

    drawCar(context, createInitialCar(createInitialRoad()));

    expect(context.fillStyle).toBe(DEFAULT_DRAW_CAR_OPTIONS.frontIndicatorColor);
    expect(context.strokeStyle).toBe(DEFAULT_DRAW_CAR_OPTIONS.bodyStrokeColor);
    expect(context.lineWidth).toBe(DEFAULT_DRAW_CAR_OPTIONS.bodyLineWidth);
  });

  it("supports custom styling options", () => {
    const context = createMockContext();

    drawCar(context, createInitialCar(createInitialRoad()), {
      bodyFillColor: "white",
      bodyStrokeColor: "cyan",
      bodyLineWidth: 4,
      frontIndicatorColor: "blue",
      shadowColor: "transparent",
      shadowBlur: 0,
    });

    expect(context.strokeStyle).toBe("cyan");
    expect(context.lineWidth).toBe(4);
  });

  it("saves and restores canvas state", () => {
    const context = createMockContext();

    drawCar(context, createInitialCar(createInitialRoad()));

    expect(context.save).toHaveBeenCalled();
    expect(context.restore).toHaveBeenCalled();
  });

  it("does not mutate car state", () => {
    const context = createMockContext();
    const car = createInitialCar(createInitialRoad());
    const snapshot = structuredClone(car);

    drawCar(context, car);

    expect(car).toEqual(snapshot);
  });

  it("rejects invalid drawable car state", () => {
    const car = createInitialCar(createInitialRoad());

    expect(() =>
      assertDrawableCarState({
        ...car,
        positionX: Number.NaN,
      }),
    ).toThrow(RangeError);

    expect(() =>
      assertDrawableCarState({
        ...car,
        width: 0,
      }),
    ).toThrow(RangeError);
  });
});

describe("drawCar rectangle body integration", () => {
  it("translates to car center before drawing body", () => {
    const context = createMockContext();
    const car = createInitialCar(createInitialRoad());

    drawCar(context, car);

    expect(context.translate).toHaveBeenCalledWith(car.positionX, car.positionY);
    expect(context.rect).toHaveBeenCalledWith(
      -car.width / 2,
      -car.height / 2,
      car.width,
      car.height,
    );
  });

  it("does not mutate car state", () => {
    const context = createMockContext();
    const car = createInitialCar(createInitialRoad());
    const snapshot = structuredClone(car);

    drawCar(context, car);

    expect(car).toEqual(snapshot);
  });
});
