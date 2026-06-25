import { describe, expect, it, vi } from "vitest";
import { createInitialRoad } from "../world";
import { createInitialCar } from "../vehicle";
import {
  DEFAULT_DRAW_CAR_OPTIONS,
  assertDrawableCarState,
  applyCarTransform,
  assertDrawableCarTransform,
  drawCar,
  drawCarFrontIndicator,
} from "./carRenderer";

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

describe("car heading transform", () => {
  it("applies transform using car center and angle", () => {
    const context = createMockContext();

    applyCarTransform(context, {
      positionX: 400,
      positionY: 600,
      angle: Math.PI / 2,
    });

    expect(context.translate).toHaveBeenCalledWith(400, 600);
    expect(context.rotate).toHaveBeenCalledWith(Math.PI / 2);
  });

  it("does not convert radians to degrees", () => {
    const context = createMockContext();

    applyCarTransform(context, {
      positionX: 400,
      positionY: 600,
      angle: Math.PI,
    });

    expect(context.rotate).toHaveBeenCalledWith(Math.PI);
    expect(context.rotate).not.toHaveBeenCalledWith(180);
  });

  it("drawCar saves before transform and restores after drawing", () => {
    const context = createMockContext();
    const car = createInitialCar(createInitialRoad(), {
      angle: Math.PI / 4,
    });

    drawCar(context, car);

    expect(context.save).toHaveBeenCalled();
    expect(context.translate).toHaveBeenCalledWith(car.positionX, car.positionY);
    expect(context.rotate).toHaveBeenCalledWith(Math.PI / 4);
    expect(context.restore).toHaveBeenCalled();
  });

  it("drawCar rotates around the car center", () => {
    const context = createMockContext();
    const car = createInitialCar(createInitialRoad(), {
      positionX: 280,
      positionY: 500,
      angle: Math.PI / 2,
    });

    drawCar(context, car);

    expect(context.translate).toHaveBeenCalledWith(280, 500);
    expect(context.rotate).toHaveBeenCalledWith(Math.PI / 2);
    expect(context.rect).toHaveBeenCalledWith(
      -car.width / 2,
      -car.height / 2,
      car.width,
      car.height,
    );
  });

  it("supports negative finite angles", () => {
    const context = createMockContext();

    applyCarTransform(context, {
      positionX: 400,
      positionY: 600,
      angle: -Math.PI / 2,
    });

    expect(context.rotate).toHaveBeenCalledWith(-Math.PI / 2);
  });

  it("supports large finite angles without normalization", () => {
    const context = createMockContext();

    applyCarTransform(context, {
      positionX: 400,
      positionY: 600,
      angle: Math.PI * 8,
    });

    expect(context.rotate).toHaveBeenCalledWith(Math.PI * 8);
  });

  it("rejects invalid transform values", () => {
    expect(() =>
      assertDrawableCarTransform({
        positionX: Number.NaN,
        positionY: 600,
        angle: 0,
      }),
    ).toThrow(RangeError);

    expect(() =>
      assertDrawableCarTransform({
        positionX: 400,
        positionY: 600,
        angle: Number.POSITIVE_INFINITY,
      }),
    ).toThrow(RangeError);
  });

  it("does not mutate car state while rotating", () => {
    const context = createMockContext();
    const car = createInitialCar(createInitialRoad(), {
      angle: Math.PI / 3,
    });
    const snapshot = structuredClone(car);

    drawCar(context, car);

    expect(car).toEqual(snapshot);
  });
});

describe("car front indicator", () => {
  it("draws the indicator near the front edge of the car", () => {
    const context = createMockContext();

    drawCarFrontIndicator(
      context,
      {
        width: 36,
        height: 64,
      },
      DEFAULT_DRAW_CAR_OPTIONS,
    );

    expect(context.fillRect).toHaveBeenCalledWith(-8.1, -26, 16.2, 5.12);
  });

  it("uses car dimensions instead of hardcoded world coordinates", () => {
    const context = createMockContext();

    drawCarFrontIndicator(
      context,
      {
        width: 40,
        height: 80,
      },
      DEFAULT_DRAW_CAR_OPTIONS,
    );

    expect(context.fillRect).toHaveBeenCalledWith(-9, -34, 18, 6.4);
  });

  it("applies a distinct front-indicator color", () => {
    const context = createMockContext();

    drawCarFrontIndicator(
      context,
      {
        width: 36,
        height: 64,
      },
      {
        frontIndicatorColor: "rgb(14 165 233)",
      },
    );

    expect(context.fillStyle).toBe("rgb(14 165 233)");
  });

  it("saves and restores canvas state while drawing the indicator", () => {
    const context = createMockContext();

    drawCarFrontIndicator(
      context,
      {
        width: 36,
        height: 64,
      },
      DEFAULT_DRAW_CAR_OPTIONS,
    );

    expect(context.save).toHaveBeenCalledOnce();
    expect(context.restore).toHaveBeenCalledOnce();
  });

  it("drawCar renders the front indicator after body transform is applied", () => {
    const context = createMockContext();
    const car = createInitialCar(createInitialRoad(), {
      angle: Math.PI / 2,
    });

    drawCar(context, car);

    expect(context.translate).toHaveBeenCalledWith(car.positionX, car.positionY);
    expect(context.rotate).toHaveBeenCalledWith(Math.PI / 2);
    expect(context.fillRect).toHaveBeenCalled();
  });

  it("rejects invalid dimensions before drawing indicator", () => {
    const context = createMockContext();

    expect(() =>
      drawCarFrontIndicator(
        context,
        {
          width: 0,
          height: 64,
        },
        DEFAULT_DRAW_CAR_OPTIONS,
      ),
    ).toThrow(RangeError);

    expect(() =>
      drawCarFrontIndicator(
        context,
        {
          width: 36,
          height: Number.NaN,
        },
        DEFAULT_DRAW_CAR_OPTIONS,
      ),
    ).toThrow(RangeError);
  });
});
