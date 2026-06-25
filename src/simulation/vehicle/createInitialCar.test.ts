import { describe, expect, it } from "vitest";
import { createInitialRoad } from "../world";
import {
  DEFAULT_INITIAL_CAR_HEIGHT,
  DEFAULT_START_OFFSET_FROM_BOTTOM,
  DEFAULT_INITIAL_CAR_WIDTH,
  createInitialCar,
} from "./createInitialCar";

describe("createInitialCar", () => {
  it("creates a complete default MVP car state", () => {
    const road = createInitialRoad();
    const car = createInitialCar(road);

    expect(car).toEqual({
      positionX: 400,
      positionY: road.bottomY - DEFAULT_START_OFFSET_FROM_BOTTOM,

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

describe("createInitialCar starting position", () => {
  it("starts in the center lane for a three-lane road", () => {
    const road = createInitialRoad();
    const car = createInitialCar(road);

    expect(car.positionX).toBe(400);
    expect(car.positionY).toBe(road.bottomY - DEFAULT_START_OFFSET_FROM_BOTTOM);
  });

  it("starts in the only lane for a one-lane road", () => {
    const road = {
      centerX: 400,
      width: 360,
      laneCount: 1,
      topY: 0,
      bottomY: 900,
    };

    const car = createInitialCar(road);

    expect(car.positionX).toBe(400);
    expect(car.positionY).toBe(600);
  });

  it("uses the left-middle lane for an even lane count", () => {
    const road = {
      centerX: 400,
      width: 400,
      laneCount: 2,
      topY: 0,
      bottomY: 900,
    };

    const car = createInitialCar(road);

    expect(car.positionX).toBe(300);
    expect(car.positionY).toBe(600);
  });

  it("supports explicit valid start lane override", () => {
    const road = createInitialRoad();

    expect(createInitialCar(road, { startLaneIndex: 0 }).positionX).toBe(280);
    expect(createInitialCar(road, { startLaneIndex: 1 }).positionX).toBe(400);
    expect(createInitialCar(road, { startLaneIndex: 2 }).positionX).toBe(520);
  });

  it("supports custom start offset from road bottom", () => {
    const road = createInitialRoad();

    const car = createInitialCar(road, {
      startOffsetFromBottom: 120,
    });

    expect(car.positionY).toBe(road.bottomY - 120);
  });

  it("does not mutate the road model", () => {
    const road = createInitialRoad();
    const snapshot = structuredClone(road);

    createInitialCar(road, {
      startLaneIndex: 2,
      startOffsetFromBottom: 150,
    });

    expect(road).toEqual(snapshot);
  });

  it("rejects invalid start lane indexes", () => {
    const road = createInitialRoad();

    expect(() => createInitialCar(road, { startLaneIndex: -1 })).toThrow(RangeError);

    expect(() => createInitialCar(road, { startLaneIndex: 3 })).toThrow(RangeError);

    expect(() => createInitialCar(road, { startLaneIndex: 1.5 })).toThrow(RangeError);

    expect(() => createInitialCar(road, { startLaneIndex: Number.NaN })).toThrow(
      RangeError,
    );
  });

  it("rejects invalid start offset values", () => {
    const road = createInitialRoad();

    expect(() =>
      createInitialCar(road, {
        startOffsetFromBottom: -1,
      }),
    ).toThrow(RangeError);

    expect(() =>
      createInitialCar(road, {
        startOffsetFromBottom: Number.NaN,
      }),
    ).toThrow(RangeError);
  });

  it("still allows explicit position overrides for tooling scenarios", () => {
    const car = createInitialCar(createInitialRoad(), {
      positionX: 123,
      positionY: 456,
    });

    expect(car.positionX).toBe(123);
    expect(car.positionY).toBe(456);
  });
});
