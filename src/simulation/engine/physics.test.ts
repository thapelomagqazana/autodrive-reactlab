import { describe, expect, it } from "vitest";
import { createInitialRoad } from "../world";
import { createInitialCar } from "../vehicle";
import {
  NEUTRAL_CAR_PHYSICS_INPUT,
  assertValidDeltaTimeSeconds,
  isValidDeltaTimeSeconds,
  applyAccelerationToSpeed,
  clampSpeed,
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

describe("applyAccelerationToSpeed", () => {
  it("increases speed when isAccelerating is true", () => {
    const car = createInitialCar(createInitialRoad());

    const nextSpeed = applyAccelerationToSpeed(
      car,
      {
        isAccelerating: true,
      },
      1,
    );

    expect(nextSpeed).toBe(120);
  });

  it("uses delta time when accelerating", () => {
    const car = createInitialCar(createInitialRoad());

    const nextSpeed = applyAccelerationToSpeed(
      car,
      {
        isAccelerating: true,
      },
      0.5,
    );

    expect(nextSpeed).toBe(60);
  });

  it("does not increase speed when isAccelerating is false", () => {
    const car = {
      ...createInitialCar(createInitialRoad()),
      speed: 25,
    };

    const nextSpeed = applyAccelerationToSpeed(
      car,
      {
        isAccelerating: false,
      },
      1,
    );

    expect(nextSpeed).toBe(25);
  });

  it("does not exceed maxSpeed after clamping", () => {
    const car = {
      ...createInitialCar(createInitialRoad()),
      speed: 250,
      acceleration: 120,
      maxSpeed: 260,
    };

    const nextSpeed = applyAccelerationToSpeed(
      car,
      {
        isAccelerating: true,
      },
      1,
    );

    expect(nextSpeed).toBe(260);
  });

  it("accepts zero delta time without changing speed", () => {
    const car = {
      ...createInitialCar(createInitialRoad()),
      speed: 25,
    };

    expect(applyAccelerationToSpeed(car, { isAccelerating: true }, 0)).toBe(25);
  });

  it("rejects invalid acceleration values", () => {
    const car = createInitialCar(createInitialRoad());

    expect(() =>
      applyAccelerationToSpeed(
        {
          ...car,
          acceleration: -1,
        },
        { isAccelerating: true },
        1,
      ),
    ).toThrow(RangeError);

    expect(() =>
      applyAccelerationToSpeed(
        {
          ...car,
          acceleration: Number.NaN,
        },
        { isAccelerating: true },
        1,
      ),
    ).toThrow(RangeError);
  });
});

describe("clampSpeed", () => {
  it("clamps forward speed to maxSpeed", () => {
    expect(clampSpeed(500, 260, 80)).toBe(260);
  });

  it("clamps reverse speed to -maxReverseSpeed", () => {
    expect(clampSpeed(-500, 260, 80)).toBe(-80);
  });

  it("preserves speed inside limits", () => {
    expect(clampSpeed(120, 260, 80)).toBe(120);
  });
});

describe("updateCarPhysics acceleration integration", () => {
  it("returns a new car with increased speed when accelerating", () => {
    const car = createInitialCar(createInitialRoad());

    const nextCar = updateCarPhysics(
      car,
      {
        ...NEUTRAL_CAR_PHYSICS_INPUT,
        isAccelerating: true,
      },
      1,
    );

    expect(nextCar.speed).toBe(120);
    expect(nextCar).not.toBe(car);
  });

  it("does not mutate input car", () => {
    const car = createInitialCar(createInitialRoad());
    const snapshot = structuredClone(car);

    updateCarPhysics(
      car,
      {
        ...NEUTRAL_CAR_PHYSICS_INPUT,
        isAccelerating: true,
      },
      1,
    );

    expect(car).toEqual(snapshot);
  });

  it("does not increase speed with neutral input", () => {
    const car = createInitialCar(createInitialRoad());

    const nextCar = updateCarPhysics(car, NEUTRAL_CAR_PHYSICS_INPUT, 1);

    expect(nextCar.speed).toBe(0);
  });

  it("is deterministic for acceleration input", () => {
    const car = createInitialCar(createInitialRoad());
    const input = {
      ...NEUTRAL_CAR_PHYSICS_INPUT,
      isAccelerating: true,
    };

    expect(updateCarPhysics(car, input, 0.5)).toEqual(updateCarPhysics(car, input, 0.5));
  });
});
