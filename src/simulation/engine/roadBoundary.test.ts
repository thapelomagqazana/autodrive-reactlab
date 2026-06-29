import { describe, expect, it } from "vitest";
import { createInitialRoad } from "../world";
import { createInitialCar } from "../vehicle";
import {
  evaluateCarRoadBoundary,
  getCarLeftEdgeX,
  getCarRightEdgeX,
  isCarOffRoad,
} from "./roadBoundary";

describe("road boundary detection", () => {
  it("detects a car fully on-road", () => {
    const road = createInitialRoad();
    const car = createInitialCar(road);

    expect(isCarOffRoad(car, road)).toBe(false);
  });

  it("allows car touching the left boundary", () => {
    const road = createInitialRoad();
    const car = {
      ...createInitialCar(road),
      positionX: 220 + 20,
      width: 40,
    };

    expect(isCarOffRoad(car, road)).toBe(false);
  });

  it("allows car touching the right boundary", () => {
    const road = createInitialRoad();
    const car = {
      ...createInitialCar(road),
      positionX: 580 - 20,
      width: 40,
    };

    expect(isCarOffRoad(car, road)).toBe(false);
  });

  it("detects car partially off-road on the left", () => {
    const road = createInitialRoad();
    const car = {
      ...createInitialCar(road),
      positionX: 220 + 19,
      width: 40,
    };

    expect(isCarOffRoad(car, road)).toBe(true);
  });

  it("detects car partially off-road on the right", () => {
    const road = createInitialRoad();
    const car = {
      ...createInitialCar(road),
      positionX: 580 - 19,
      width: 40,
    };

    expect(isCarOffRoad(car, road)).toBe(true);
  });

  it("detects car fully off-road on the left", () => {
    const road = createInitialRoad();
    const car = {
      ...createInitialCar(road),
      positionX: 100,
      width: 40,
    };

    expect(isCarOffRoad(car, road)).toBe(true);
  });

  it("detects car fully off-road on the right", () => {
    const road = createInitialRoad();
    const car = {
      ...createInitialCar(road),
      positionX: 700,
      width: 40,
    };

    expect(isCarOffRoad(car, road)).toBe(true);
  });

  it("reports detailed boundary values", () => {
    const road = createInitialRoad();
    const car = {
      ...createInitialCar(road),
      positionX: 400,
      width: 40,
    };

    expect(evaluateCarRoadBoundary(car, road)).toEqual({
      carLeftEdgeX: 380,
      carRightEdgeX: 420,
      roadLeftEdgeX: 220,
      roadRightEdgeX: 580,
      isOffRoad: false,
    });
  });

  it("calculates car body edges from center position and width", () => {
    const car = {
      positionX: 400,
      width: 40,
    };

    expect(getCarLeftEdgeX(car)).toBe(380);
    expect(getCarRightEdgeX(car)).toBe(420);
  });

  it("rejects invalid car position and width", () => {
    const road = createInitialRoad();

    expect(() =>
      isCarOffRoad(
        {
          positionX: Number.NaN,
          width: 40,
        },
        road,
      ),
    ).toThrow(RangeError);

    expect(() =>
      isCarOffRoad(
        {
          positionX: 400,
          width: 0,
        },
        road,
      ),
    ).toThrow(RangeError);
  });
});
