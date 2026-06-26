import { describe, expect, it } from "vitest";
import { createInitialRoad } from "../world";
import { createInitialCar } from "../vehicle";
import {
  NEUTRAL_CAR_PHYSICS_INPUT,
  assertValidDeltaTimeSeconds,
  isValidDeltaTimeSeconds,
  applyAccelerationToSpeed,
  applyFrictionToSpeed,
  resolveCarFriction,
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

describe("applyFrictionToSpeed", () => {
  it("decays positive speed toward zero", () => {
    expect(applyFrictionToSpeed(100, 70, 1)).toBe(30);
  });

  it("decays negative speed toward zero", () => {
    expect(applyFrictionToSpeed(-100, 70, 1)).toBe(-30);
  });

  it("does not flip positive speed to negative", () => {
    expect(applyFrictionToSpeed(10, 70, 1)).toBe(0);
  });

  it("does not flip negative speed to positive", () => {
    expect(applyFrictionToSpeed(-10, 70, 1)).toBe(0);
  });

  it("uses delta time", () => {
    expect(applyFrictionToSpeed(100, 70, 0.5)).toBe(65);
  });

  it("keeps zero speed at zero", () => {
    expect(applyFrictionToSpeed(0, 70, 1)).toBe(0);
  });

  it("accepts zero friction", () => {
    expect(applyFrictionToSpeed(100, 0, 1)).toBe(100);
  });

  it("accepts zero delta time", () => {
    expect(applyFrictionToSpeed(100, 70, 0)).toBe(100);
  });

  it("rejects invalid friction values", () => {
    expect(() => applyFrictionToSpeed(100, -1, 1)).toThrow(RangeError);
    expect(() => applyFrictionToSpeed(100, Number.NaN, 1)).toThrow(RangeError);
  });

  it("rejects invalid speed values", () => {
    expect(() => applyFrictionToSpeed(Number.NaN, 70, 1)).toThrow(RangeError);
    expect(() => applyFrictionToSpeed(Number.POSITIVE_INFINITY, 70, 1)).toThrow(
      RangeError,
    );
  });
});

describe("resolveCarFriction", () => {
  it("uses explicit car friction when available", () => {
    expect(resolveCarFriction({ friction: 50 })).toBe(50);
  });

  it("rejects invalid car friction", () => {
    expect(() => resolveCarFriction({ friction: -1 })).toThrow(RangeError);
    expect(() => resolveCarFriction({ friction: Number.NaN })).toThrow(RangeError);
  });
});

describe("updateCarPhysics friction integration", () => {
  it("slows naturally when no acceleration or braking is active", () => {
    const car = {
      ...createInitialCar(createInitialRoad()),
      speed: 100,
    };

    const nextCar = updateCarPhysics(car, NEUTRAL_CAR_PHYSICS_INPUT, 1);

    expect(nextCar.speed).toBe(30);
  });

  it("does not apply friction while accelerating", () => {
    const car = {
      ...createInitialCar(createInitialRoad()),
      speed: 100,
    };

    const nextCar = updateCarPhysics(
      car,
      {
        ...NEUTRAL_CAR_PHYSICS_INPUT,
        isAccelerating: true,
      },
      1,
    );

    expect(nextCar.speed).toBe(220);
  });

  it("does not mutate input car", () => {
    const car = {
      ...createInitialCar(createInitialRoad()),
      speed: 100,
    };
    const snapshot = structuredClone(car);

    updateCarPhysics(car, NEUTRAL_CAR_PHYSICS_INPUT, 1);

    expect(car).toEqual(snapshot);
  });
});
