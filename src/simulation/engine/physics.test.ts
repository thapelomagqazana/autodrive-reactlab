import { describe, expect, it } from "vitest";
import { createInitialRoad } from "../world";
import { createInitialCar } from "../vehicle";
import type { CarState } from "../vehicle";
import {
  DEFAULT_MINIMUM_STEERING_SPEED,
  NEUTRAL_CAR_PHYSICS_INPUT,
  assertValidDeltaTimeSeconds,
  isValidDeltaTimeSeconds,
  applyAccelerationToSpeed,
  applyFrictionToSpeed,
  resolveCarFriction,
  clampSpeed,
  clampSteeringInput,
  clampSpeedForRoadState,
  createCarPhysicsInput,
  isValidRawSteeringInput,
  updateCarPhysics,
  calculateTravelDistance,
  updatePositionUsingSpeedAndHeading,
  canApplySteeringAtSpeed,
  resolveEffectiveSteeringInput,
  isValidMinimumSteeringSpeed,
  calculateSteeringSpeedFactor,
  updateHeadingFromSteering,
  returnSteeringAngleToCenter,
  resolveEffectiveMaxSpeed,
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

describe("clampSpeed", () => {
  it("clamps forward speed to maxSpeed", () => {
    expect(clampSpeed(500, 260, 80)).toBe(260);
  });

  it("clamps reverse speed to -maxReverseSpeed", () => {
    expect(clampSpeed(-500, 260, 80)).toBe(-80);
  });

  it("preserves speed inside movement limits", () => {
    expect(clampSpeed(120, 260, 80)).toBe(120);
    expect(clampSpeed(-40, 260, 80)).toBe(-40);
    expect(clampSpeed(0, 260, 80)).toBe(0);
  });

  it("allows speed exactly at limits", () => {
    expect(clampSpeed(260, 260, 80)).toBe(260);
    expect(clampSpeed(-80, 260, 80)).toBe(-80);
  });

  it("rejects invalid speed values", () => {
    expect(() => clampSpeed(Number.NaN, 260, 80)).toThrow(RangeError);
    expect(() => clampSpeed(Number.POSITIVE_INFINITY, 260, 80)).toThrow(RangeError);
  });

  it("rejects invalid movement limits", () => {
    expect(() => clampSpeed(10, 0, 80)).toThrow(RangeError);
    expect(() => clampSpeed(10, -1, 80)).toThrow(RangeError);
    expect(() => clampSpeed(10, 260, 0)).toThrow(RangeError);
    expect(() => clampSpeed(10, 260, Number.NaN)).toThrow(RangeError);
  });
});

describe("updateCarPhysics speed clamping integration", () => {
  it("does not exceed maxSpeed after acceleration", () => {
    const car = {
      ...createInitialCar(createInitialRoad()),
      speed: 250,
      acceleration: 120,
      maxSpeed: 260,
    };

    const nextCar = updateCarPhysics(
      car,
      {
        ...NEUTRAL_CAR_PHYSICS_INPUT,
        isAccelerating: true,
      },
      1,
    );

    expect(nextCar.speed).toBe(260);
  });

  it("keeps reverse speed inside maxReverseSpeed", () => {
    const car = {
      ...createInitialCar(createInitialRoad()),
      speed: -500,
      maxReverseSpeed: 80,
    };

    const nextCar = updateCarPhysics(car, NEUTRAL_CAR_PHYSICS_INPUT, 0);

    expect(nextCar.speed).toBe(-80);
  });

  it("does not mutate input car while clamping", () => {
    const car = {
      ...createInitialCar(createInitialRoad()),
      speed: 500,
    };
    const snapshot = structuredClone(car);

    updateCarPhysics(car, NEUTRAL_CAR_PHYSICS_INPUT, 0);

    expect(car).toEqual(snapshot);
  });
});

describe("calculateTravelDistance", () => {
  it("calculates signed travel distance from speed and delta time", () => {
    expect(calculateTravelDistance(100, 0.5)).toBe(50);
    expect(calculateTravelDistance(-100, 0.5)).toBe(-50);
  });

  it("returns zero when speed is zero", () => {
    expect(calculateTravelDistance(0, 1)).toBe(0);
  });

  it("returns zero when delta time is zero", () => {
    expect(calculateTravelDistance(100, 0)).toBe(0);
  });

  it("rejects invalid values", () => {
    expect(() => calculateTravelDistance(Number.NaN, 1)).toThrow(RangeError);
    expect(() => calculateTravelDistance(100, -1)).toThrow(RangeError);
  });
});

describe("updatePositionUsingSpeedAndHeading", () => {
  function createMovingCar(overrides: Partial<CarState> = {}) {
    return {
      ...createInitialCar(createInitialRoad()),
      speed: 100,
      friction: 70,
      distanceTravelled: 0,
      ...overrides,
    };
  }

  it("moves upward when angle is 0 and speed is positive", () => {
    const car = createMovingCar({
      positionX: 400,
      positionY: 600,
      angle: 0,
      speed: 100,
    });

    expect(updatePositionUsingSpeedAndHeading(car, 1)).toEqual({
      positionX: 400,
      positionY: 500,
      distanceTravelled: 100,
    });
  });

  it("moves downward when angle is 0 and speed is negative", () => {
    const car = createMovingCar({
      positionX: 400,
      positionY: 600,
      angle: 0,
      speed: -100,
    });

    expect(updatePositionUsingSpeedAndHeading(car, 1)).toEqual({
      positionX: 400,
      positionY: 700,
      distanceTravelled: 100,
    });
  });

  it("moves right when angle is π/2 and speed is positive", () => {
    const car = createMovingCar({
      positionX: 400,
      positionY: 600,
      angle: Math.PI / 2,
      speed: 100,
    });

    const next = updatePositionUsingSpeedAndHeading(car, 1);

    expect(next.positionX).toBeCloseTo(500);
    expect(next.positionY).toBeCloseTo(600);
    expect(next.distanceTravelled).toBe(100);
  });

  it("moves downward when angle is π and speed is positive", () => {
    const car = createMovingCar({
      positionX: 400,
      positionY: 600,
      angle: Math.PI,
      speed: 100,
    });

    const next = updatePositionUsingSpeedAndHeading(car, 1);

    expect(next.positionX).toBeCloseTo(400);
    expect(next.positionY).toBeCloseTo(700);
  });

  it("moves left when angle is -π/2 and speed is positive", () => {
    const car = createMovingCar({
      positionX: 400,
      positionY: 600,
      angle: -Math.PI / 2,
      speed: 100,
    });

    const next = updatePositionUsingSpeedAndHeading(car, 1);

    expect(next.positionX).toBeCloseTo(300);
    expect(next.positionY).toBeCloseTo(600);
  });

  it("does not change position when speed is zero", () => {
    const car = createMovingCar({
      positionX: 400,
      positionY: 600,
      speed: 0,
    });

    expect(updatePositionUsingSpeedAndHeading(car, 1)).toEqual({
      positionX: 400,
      positionY: 600,
      distanceTravelled: 0,
    });
  });

  it("uses delta time", () => {
    const car = createMovingCar({
      positionX: 400,
      positionY: 600,
      angle: 0,
      speed: 100,
    });

    const next = updatePositionUsingSpeedAndHeading(car, 0.5);

    expect(next.positionX).toBe(400);
    expect(next.positionY).toBe(550);
    expect(next.distanceTravelled).toBe(50);
  });

  it("preserves previous distance travelled and adds absolute movement distance", () => {
    const car = createMovingCar({
      speed: -100,
      distanceTravelled: 25,
    });

    const next = updatePositionUsingSpeedAndHeading(car, 0.5);

    expect(next.distanceTravelled).toBe(75);
  });

  it("rejects invalid position inputs", () => {
    const car = createMovingCar();

    expect(() =>
      updatePositionUsingSpeedAndHeading(
        {
          ...car,
          positionX: Number.NaN,
        },
        1,
      ),
    ).toThrow(RangeError);

    expect(() =>
      updatePositionUsingSpeedAndHeading(
        {
          ...car,
          angle: Number.POSITIVE_INFINITY,
        },
        1,
      ),
    ).toThrow(RangeError);
  });
});

describe("updateCarPhysics position integration", () => {
  it("updates position after speed calculation", () => {
    const car = {
      ...createInitialCar(createInitialRoad()),
      speed: 100,
      friction: 0,
      angle: 0,
    };

    const nextCar = updateCarPhysics(car, NEUTRAL_CAR_PHYSICS_INPUT, 1);

    expect(nextCar.positionY).toBe(500);
    expect(nextCar.distanceTravelled).toBe(100);
  });

  it("does not mutate input car while updating position", () => {
    const car = {
      ...createInitialCar(createInitialRoad()),
      speed: 100,
      friction: 0,
    };
    const snapshot = structuredClone(car);

    updateCarPhysics(car, NEUTRAL_CAR_PHYSICS_INPUT, 1);

    expect(car).toEqual(snapshot);
  });
});

describe("normalized steering input", () => {
  it("accepts valid steering input values", () => {
    expect(isValidRawSteeringInput(-1)).toBe(true);
    expect(isValidRawSteeringInput(0)).toBe(true);
    expect(isValidRawSteeringInput(1)).toBe(true);
    expect(isValidRawSteeringInput(0.5)).toBe(true);
  });

  it("rejects invalid steering input values", () => {
    expect(isValidRawSteeringInput(Number.NaN)).toBe(false);
    expect(isValidRawSteeringInput(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidRawSteeringInput(Number.NEGATIVE_INFINITY)).toBe(false);
  });

  it("clamps steering input to the range [-1, 1]", () => {
    expect(clampSteeringInput(-2)).toBe(-1);
    expect(clampSteeringInput(-1)).toBe(-1);
    expect(clampSteeringInput(-0.5)).toBe(-0.5);
    expect(clampSteeringInput(0)).toBe(0);
    expect(clampSteeringInput(0.5)).toBe(0.5);
    expect(clampSteeringInput(1)).toBe(1);
    expect(clampSteeringInput(2)).toBe(1);
  });

  it("throws when steering input is not finite", () => {
    expect(() => clampSteeringInput(Number.NaN)).toThrow(RangeError);
    expect(() => clampSteeringInput(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it("creates neutral physics input by default", () => {
    expect(createCarPhysicsInput()).toEqual({
      isAccelerating: false,
      isOffRoad: false,
      isBrakeOrReversePressed: false,
      steeringInput: 0,
    });
  });

  it("creates normalized physics input from partial values", () => {
    expect(
      createCarPhysicsInput({
        isAccelerating: true,
        steeringInput: 5,
      }),
    ).toEqual({
      isAccelerating: true,
      isOffRoad: false,
      isBrakeOrReversePressed: false,
      steeringInput: 1,
    });

    expect(
      createCarPhysicsInput({
        isBrakeOrReversePressed: true,
        steeringInput: -5,
      }),
    ).toEqual({
      isAccelerating: false,
      isOffRoad: false,
      isBrakeOrReversePressed: true,
      steeringInput: -1,
    });
  });

  it("does not let steering input directly move the car sideways", () => {
    const car = {
      ...createInitialCar(createInitialRoad()),
      speed: 0,
      friction: 0,
    };

    const nextCar = updateCarPhysics(
      car,
      createCarPhysicsInput({
        steeringInput: 1,
      }),
      1,
    );

    expect(nextCar.positionX).toBe(car.positionX);
    expect(nextCar.positionY).toBe(car.positionY);
  });
});

describe("steering movement threshold", () => {
  it("defines a centralized default minimum steering speed", () => {
    expect(DEFAULT_MINIMUM_STEERING_SPEED).toBe(5);
  });

  it("validates minimum steering speed values", () => {
    expect(isValidMinimumSteeringSpeed(0)).toBe(true);
    expect(isValidMinimumSteeringSpeed(5)).toBe(true);

    expect(isValidMinimumSteeringSpeed(-1)).toBe(false);
    expect(isValidMinimumSteeringSpeed(Number.NaN)).toBe(false);
    expect(isValidMinimumSteeringSpeed(Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("does not allow steering when stopped", () => {
    expect(canApplySteeringAtSpeed(0)).toBe(false);
  });

  it("does not allow steering below threshold", () => {
    expect(canApplySteeringAtSpeed(4.999)).toBe(false);
    expect(canApplySteeringAtSpeed(-4.999)).toBe(false);
  });

  it("allows steering at threshold", () => {
    expect(canApplySteeringAtSpeed(5)).toBe(true);
    expect(canApplySteeringAtSpeed(-5)).toBe(true);
  });

  it("allows steering above threshold", () => {
    expect(canApplySteeringAtSpeed(20)).toBe(true);
    expect(canApplySteeringAtSpeed(-20)).toBe(true);
  });

  it("supports custom threshold", () => {
    expect(canApplySteeringAtSpeed(9, 10)).toBe(false);
    expect(canApplySteeringAtSpeed(10, 10)).toBe(true);
  });

  it("returns zero effective steering input when stopped", () => {
    expect(resolveEffectiveSteeringInput(0, 1)).toBe(0);
    expect(resolveEffectiveSteeringInput(0, -1)).toBe(0);
  });

  it("returns zero effective steering input below threshold", () => {
    expect(resolveEffectiveSteeringInput(4, 1)).toBe(0);
    expect(resolveEffectiveSteeringInput(-4, -1)).toBe(0);
  });

  it("returns clamped steering input when above threshold", () => {
    expect(resolveEffectiveSteeringInput(20, 2)).toBe(1);
    expect(resolveEffectiveSteeringInput(20, -2)).toBe(-1);
    expect(resolveEffectiveSteeringInput(-20, 0.5)).toBe(0.5);
  });

  it("rejects invalid speed or threshold values", () => {
    expect(() => canApplySteeringAtSpeed(Number.NaN)).toThrow(RangeError);
    expect(() => canApplySteeringAtSpeed(10, -1)).toThrow(RangeError);
  });
});

describe("updateCarPhysics steering threshold integration", () => {
  it("does not change heading when steering input is active but car is stopped", () => {
    const car = {
      ...createInitialCar(createInitialRoad()),
      speed: 0,
      friction: 0,
      angle: 0,
      steeringAngle: 0,
    };

    const nextCar = updateCarPhysics(
      car,
      createCarPhysicsInput({
        steeringInput: 1,
      }),
      1,
    );

    expect(nextCar.angle).toBe(0);
    expect(nextCar.steeringAngle).toBe(0);
  });

  it("does not change heading below minimum steering speed", () => {
    const car = {
      ...createInitialCar(createInitialRoad()),
      speed: 4,
      friction: 0,
      angle: 0,
      steeringAngle: 0,
    };

    const nextCar = updateCarPhysics(
      car,
      createCarPhysicsInput({
        steeringInput: 1,
      }),
      1,
    );

    expect(nextCar.angle).toBe(0);
  });

  it("keeps reverse movement eligible for steering threshold logic", () => {
    expect(resolveEffectiveSteeringInput(-20, -1)).toBe(-1);
  });
});

describe("calculateSteeringSpeedFactor", () => {
  it("returns 0 when speed is 0", () => {
    expect(calculateSteeringSpeedFactor(0, 260)).toBe(0);
  });

  it("uses absolute speed", () => {
    expect(calculateSteeringSpeedFactor(-130, 260)).toBe(0.5);
  });

  it("caps the factor at 1", () => {
    expect(calculateSteeringSpeedFactor(520, 260)).toBe(1);
  });

  it("rejects invalid values", () => {
    expect(() => calculateSteeringSpeedFactor(Number.NaN, 260)).toThrow(RangeError);

    expect(() => calculateSteeringSpeedFactor(10, 0)).toThrow(RangeError);
  });
});

describe("updateHeadingFromSteering", () => {
  function createHeadingCar(overrides: Partial<CarState> = {}) {
    return {
      ...createInitialCar(createInitialRoad()),
      speed: 130,
      maxSpeed: 260,
      steeringAngle: 0,
      turnRate: 2,
      angle: 0,
      ...overrides,
    };
  }

  it("does not change angle when steering angle is 0", () => {
    const car = createHeadingCar({
      steeringAngle: 0,
      speed: 130,
    });

    expect(updateHeadingFromSteering(car, 1)).toBe(0);
  });

  it("increases heading for positive steering", () => {
    const car = createHeadingCar({
      steeringAngle: 0.5,
      speed: 130,
      maxSpeed: 260,
      turnRate: 2,
    });

    expect(updateHeadingFromSteering(car, 1)).toBeCloseTo(0.5);
  });

  it("decreases heading for negative steering", () => {
    const car = createHeadingCar({
      steeringAngle: -0.5,
      speed: 130,
      maxSpeed: 260,
      turnRate: 2,
    });

    expect(updateHeadingFromSteering(car, 1)).toBeCloseTo(-0.5);
  });

  it("uses delta time", () => {
    const car = createHeadingCar({
      steeringAngle: 0.5,
      speed: 130,
      maxSpeed: 260,
      turnRate: 2,
    });

    expect(updateHeadingFromSteering(car, 0.5)).toBeCloseTo(0.25);
  });

  it("supports reverse movement", () => {
    const car = createHeadingCar({
      steeringAngle: 0.5,
      speed: -130,
      maxSpeed: 260,
      turnRate: 2,
    });

    expect(updateHeadingFromSteering(car, 1)).toBeCloseTo(0.5);
  });

  it("rejects invalid turn rate", () => {
    const car = createHeadingCar({
      turnRate: -1,
    });

    expect(() => updateHeadingFromSteering(car, 1)).toThrow(RangeError);
  });
});

describe("updateCarPhysics heading integration", () => {
  it("changes angle when moving and steering", () => {
    const car = {
      ...createInitialCar(createInitialRoad()),
      speed: 100,
      friction: 0,
      turnRate: 2,
    };

    const nextCar = updateCarPhysics(
      car,
      createCarPhysicsInput({
        steeringInput: 1,
      }),
      1,
    );

    expect(nextCar.angle).toBeGreaterThan(0);
  });

  it("does not change angle when steering input is zero", () => {
    const car = {
      ...createInitialCar(createInitialRoad()),
      speed: 100,
      friction: 0,
      turnRate: 2,
    };

    const nextCar = updateCarPhysics(car, createCarPhysicsInput(), 1);

    expect(nextCar.angle).toBe(0);
  });

  it("does not change angle when stopped", () => {
    const car = {
      ...createInitialCar(createInitialRoad()),
      speed: 0,
      friction: 0,
      turnRate: 2,
    };

    const nextCar = updateCarPhysics(
      car,
      createCarPhysicsInput({
        steeringInput: 1,
      }),
      1,
    );

    expect(nextCar.angle).toBe(0);
  });
});

describe("returnSteeringAngleToCenter", () => {
  it("returns positive steering downward toward 0", () => {
    expect(returnSteeringAngleToCenter(0.5, 0.2, 1)).toBeCloseTo(0.3);
  });

  it("returns negative steering upward toward 0", () => {
    expect(returnSteeringAngleToCenter(-0.5, 0.2, 1)).toBeCloseTo(-0.3);
  });

  it("does not overshoot past zero from positive steering", () => {
    expect(returnSteeringAngleToCenter(0.1, 0.5, 1)).toBe(0);
  });

  it("does not overshoot past zero from negative steering", () => {
    expect(returnSteeringAngleToCenter(-0.1, 0.5, 1)).toBe(0);
  });

  it("uses delta time", () => {
    expect(returnSteeringAngleToCenter(0.5, 0.2, 0.5)).toBeCloseTo(0.4);
  });

  it("keeps zero steering at zero", () => {
    expect(returnSteeringAngleToCenter(0, 0.2, 1)).toBe(0);
  });

  it("accepts zero return rate", () => {
    expect(returnSteeringAngleToCenter(0.5, 0, 1)).toBe(0.5);
  });

  it("rejects invalid values", () => {
    expect(() => returnSteeringAngleToCenter(Number.NaN, 0.2, 1)).toThrow(RangeError);

    expect(() => returnSteeringAngleToCenter(0.5, -1, 1)).toThrow(RangeError);
  });
});

it("returns steering toward center when no steering input is active", () => {
  const car = {
    ...createInitialCar(createInitialRoad()),
    speed: 100,
    friction: 0,
    steeringAngle: 0.5,
    steeringReturnRate: 0.2,
  };

  const nextCar = updateCarPhysics(car, createCarPhysicsInput(), 1);

  expect(nextCar.steeringAngle).toBeCloseTo(0.3);
});

it("does not overshoot steering center during physics update", () => {
  const car = {
    ...createInitialCar(createInitialRoad()),
    speed: 100,
    friction: 0,
    steeringAngle: 0.1,
    steeringReturnRate: 1,
  };

  const nextCar = updateCarPhysics(car, createCarPhysicsInput(), 1);

  expect(nextCar.steeringAngle).toBe(0);
});

it("uses active steering input instead of returning to center", () => {
  const car = {
    ...createInitialCar(createInitialRoad()),
    speed: 100,
    friction: 0,
    steeringAngle: 0.1,
    steeringReturnRate: 1,
    maxSteeringAngle: Math.PI / 6,
  };

  const nextCar = updateCarPhysics(
    car,
    createCarPhysicsInput({
      steeringInput: 1,
    }),
    1,
  );

  expect(nextCar.steeringAngle).toBe(Math.PI / 6);
});

describe("low-speed turning behaviour", () => {
  function createLowSpeedTurningCar(overrides: Partial<CarState> = {}) {
    return {
      ...createInitialCar(createInitialRoad()),
      friction: 0,
      angle: 0,
      steeringAngle: 0,
      steeringReturnRate: 0,
      turnRate: 2,
      maxSpeed: 100,
      maxSteeringAngle: Math.PI / 6,
      ...overrides,
    };
  }

  it("does not rotate when stopped, even with steering input", () => {
    const car = createLowSpeedTurningCar({
      speed: 0,
    });

    const nextCar = updateCarPhysics(
      car,
      createCarPhysicsInput({
        steeringInput: 1,
      }),
      1,
    );

    expect(nextCar.angle).toBe(0);
    expect(nextCar.steeringAngle).toBe(0);
  });

  it("does not rotate below the minimum steering speed", () => {
    const car = createLowSpeedTurningCar({
      speed: DEFAULT_MINIMUM_STEERING_SPEED - 0.001,
    });

    const nextCar = updateCarPhysics(
      car,
      createCarPhysicsInput({
        steeringInput: 1,
      }),
      1,
    );

    expect(nextCar.angle).toBe(0);
    expect(nextCar.steeringAngle).toBe(0);
  });

  it("allows heading change at the minimum steering speed", () => {
    const car = createLowSpeedTurningCar({
      speed: DEFAULT_MINIMUM_STEERING_SPEED,
    });

    const nextCar = updateCarPhysics(
      car,
      createCarPhysicsInput({
        steeringInput: 1,
      }),
      1,
    );

    expect(nextCar.steeringAngle).toBeCloseTo(Math.PI / 6);
    expect(nextCar.angle).toBeGreaterThan(0);
  });

  it("turns gradually at low positive speed", () => {
    const car = createLowSpeedTurningCar({
      speed: 10,
    });

    const nextCar = updateCarPhysics(
      car,
      createCarPhysicsInput({
        steeringInput: 1,
      }),
      0.5,
    );

    expect(nextCar.angle).toBeCloseTo((Math.PI / 6) * 2 * 0.1 * 0.5);
    expect(nextCar.angle).toBeGreaterThan(0);
  });

  it("documents deterministic low reverse steering behaviour", () => {
    const car = createLowSpeedTurningCar({
      speed: -10,
    });

    const nextCar = updateCarPhysics(
      car,
      createCarPhysicsInput({
        steeringInput: 1,
      }),
      0.5,
    );

    /**
     * MVP reverse-steering rule:
     * - reverse speed uses speed magnitude for turn strength
     * - positive steering still increases heading
     * - reverse does not invert steering direction yet
     */
    expect(nextCar.angle).toBeCloseTo((Math.PI / 6) * 2 * 0.1 * 0.5);
    expect(nextCar.angle).toBeGreaterThan(0);
  });

  it("keeps low reverse left steering deterministic", () => {
    const car = createLowSpeedTurningCar({
      speed: -10,
    });

    const nextCar = updateCarPhysics(
      car,
      createCarPhysicsInput({
        steeringInput: -1,
      }),
      0.5,
    );

    expect(nextCar.angle).toBeCloseTo(-(Math.PI / 6) * 2 * 0.1 * 0.5);
    expect(nextCar.angle).toBeLessThan(0);
  });

  it("does not mutate the input car during low-speed steering checks", () => {
    const car = createLowSpeedTurningCar({
      speed: 10,
    });
    const snapshot = structuredClone(car);

    updateCarPhysics(
      car,
      createCarPhysicsInput({
        steeringInput: 1,
      }),
      0.5,
    );

    expect(car).toEqual(snapshot);
  });
});

it("reduces effective max speed while off-road", () => {
  expect(resolveEffectiveMaxSpeed(200, true)).toBe(70);
});

it("keeps full max speed while on-road", () => {
  expect(resolveEffectiveMaxSpeed(200, false)).toBe(200);
});

it("clamps forward speed to off-road effective max speed", () => {
  expect(clampSpeedForRoadState(150, 200, 80, true)).toBe(70);
});

it("rejects invalid off-road multiplier", () => {
  expect(() => resolveEffectiveMaxSpeed(200, true, -0.1)).toThrow(RangeError);
  expect(() => resolveEffectiveMaxSpeed(200, true, 1.1)).toThrow(RangeError);
});

it("applies off-road speed cap during physics update", () => {
  const road = createInitialRoad();

  const car = {
    ...createInitialCar(road),
    speed: 180,
    maxSpeed: 200,
  };

  const nextCar = updateCarPhysics(
    car,
    createCarPhysicsInput({
      isOffRoad: true,
    }),
    0,
  );

  expect(nextCar.speed).toBe(70);
});
