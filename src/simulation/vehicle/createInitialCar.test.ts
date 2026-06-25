import { describe, expect, it } from "vitest";
import { createInitialRoad } from "../world";
import {
  DEFAULT_INITIAL_CAR_HEIGHT,
  DEFAULT_INITIAL_CAR_POSITION_Y,
  DEFAULT_INITIAL_CAR_WIDTH,
  createInitialCar,
} from "./createInitialCar";

describe("createInitialCar", () => {
  it("creates a complete default MVP car state", () => {
    const car = createInitialCar(createInitialRoad());

    expect(car).toEqual({
      positionX: 400,
      positionY: DEFAULT_INITIAL_CAR_POSITION_Y,

      speed: 0,
      acceleration: 120,

      angle: 0,
      steeringAngle: 0,

      maxSpeed: 260,
      maxReverseSpeed: 80,

      width: DEFAULT_INITIAL_CAR_WIDTH,
      height: DEFAULT_INITIAL_CAR_HEIGHT,

      distanceTravelled: 0,
      collisionCount: 0,

      decision: "idle",
    });
  });

  it("places the car on the default road start lane", () => {
    const car = createInitialCar(createInitialRoad());

    expect(car.positionX).toBe(400);
  });

  it("does not mutate the road model", () => {
    const road = createInitialRoad();
    const snapshot = structuredClone(road);

    createInitialCar(road);

    expect(road).toEqual(snapshot);
  });

  it("returns a fresh object every time for reset safety", () => {
    const road = createInitialRoad();

    const first = createInitialCar(road);
    const second = createInitialCar(road);

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });

  it("supports explicit spawn and runtime overrides", () => {
    const car = createInitialCar(createInitialRoad(), {
      positionX: 280,
      positionY: 500,
      speed: 20,
      decision: "accelerating",
    });

    expect(car.positionX).toBe(280);
    expect(car.positionY).toBe(500);
    expect(car.speed).toBe(20);
    expect(car.decision).toBe("accelerating");
  });

  it("supports telemetry overrides", () => {
    const car = createInitialCar(createInitialRoad(), {
      collisionCount: 2,
      distanceTravelled: 500,
    });

    expect(car.collisionCount).toBe(2);
    expect(car.distanceTravelled).toBe(500);
  });

  it("rejects invalid position overrides", () => {
    expect(() =>
      createInitialCar(createInitialRoad(), {
        positionX: Number.NaN,
      }),
    ).toThrow(RangeError);

    expect(() =>
      createInitialCar(createInitialRoad(), {
        positionY: Number.POSITIVE_INFINITY,
      }),
    ).toThrow(RangeError);
  });

  it("rejects invalid dimensions", () => {
    expect(() =>
      createInitialCar(createInitialRoad(), {
        width: 0,
      }),
    ).toThrow(RangeError);

    expect(() =>
      createInitialCar(createInitialRoad(), {
        height: -1,
      }),
    ).toThrow(RangeError);
  });

  it("rejects invalid movement values", () => {
    expect(() =>
      createInitialCar(createInitialRoad(), {
        speed: Number.NaN,
      }),
    ).toThrow(RangeError);

    expect(() =>
      createInitialCar(createInitialRoad(), {
        acceleration: -1,
      }),
    ).toThrow(RangeError);
  });

  it("rejects invalid movement limits", () => {
    expect(() =>
      createInitialCar(createInitialRoad(), {
        maxSpeed: 0,
      }),
    ).toThrow(RangeError);

    expect(() =>
      createInitialCar(createInitialRoad(), {
        maxReverseSpeed: -1,
      }),
    ).toThrow(RangeError);
  });

  it("rejects invalid telemetry values", () => {
    expect(() =>
      createInitialCar(createInitialRoad(), {
        distanceTravelled: -1,
      }),
    ).toThrow(RangeError);

    expect(() =>
      createInitialCar(createInitialRoad(), {
        collisionCount: Number.NaN,
      }),
    ).toThrow(RangeError);
  });
});
