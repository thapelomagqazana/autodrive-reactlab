import { describe, expect, it } from "vitest";
import { createInitialRoad } from "../world";
import { createInitialCar } from "../vehicle";
import {
  NEUTRAL_CAR_PHYSICS_INPUT,
  assertValidDeltaTimeSeconds,
  isValidDeltaTimeSeconds,
  updateCarPhysics,
} from "./physics";

describe("updateCarPhysics", () => {
  it("returns a new CarState object", () => {
    const car = createInitialCar(createInitialRoad());

    const nextCar = updateCarPhysics(car, NEUTRAL_CAR_PHYSICS_INPUT, 0.016);

    expect(nextCar).toEqual(car);
    expect(nextCar).not.toBe(car);
  });

  it("does not mutate input car state", () => {
    const car = createInitialCar(createInitialRoad());
    const snapshot = structuredClone(car);

    updateCarPhysics(car, NEUTRAL_CAR_PHYSICS_INPUT, 0.016);

    expect(car).toEqual(snapshot);
  });

  it("is deterministic for the same input", () => {
    const car = createInitialCar(createInitialRoad());

    expect(updateCarPhysics(car, NEUTRAL_CAR_PHYSICS_INPUT, 0.016)).toEqual(
      updateCarPhysics(car, NEUTRAL_CAR_PHYSICS_INPUT, 0.016),
    );
  });

  it("accepts delta time in seconds", () => {
    const car = createInitialCar(createInitialRoad());

    expect(() => updateCarPhysics(car, NEUTRAL_CAR_PHYSICS_INPUT, 1 / 60)).not.toThrow();
  });

  it("accepts zero delta time", () => {
    const car = createInitialCar(createInitialRoad());

    const nextCar = updateCarPhysics(car, NEUTRAL_CAR_PHYSICS_INPUT, 0);

    expect(nextCar).toEqual(car);
  });

  it("validates delta time", () => {
    expect(isValidDeltaTimeSeconds(0)).toBe(true);
    expect(isValidDeltaTimeSeconds(0.016)).toBe(true);

    expect(isValidDeltaTimeSeconds(-1)).toBe(false);
    expect(isValidDeltaTimeSeconds(Number.NaN)).toBe(false);
    expect(isValidDeltaTimeSeconds(Number.POSITIVE_INFINITY)).toBe(false);

    expect(() => assertValidDeltaTimeSeconds(-1)).toThrow(RangeError);
  });

  it("rejects invalid delta time", () => {
    const car = createInitialCar(createInitialRoad());

    expect(() => updateCarPhysics(car, NEUTRAL_CAR_PHYSICS_INPUT, Number.NaN)).toThrow(
      RangeError,
    );

    expect(() => updateCarPhysics(car, NEUTRAL_CAR_PHYSICS_INPUT, -1)).toThrow(
      RangeError,
    );
  });
});
