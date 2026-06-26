import { describe, expect, it } from "vitest";
import {
  DEFAULT_CAR_ACCELERATION,
  DEFAULT_CAR_STATE,
  DEFAULT_CAR_MAX_REVERSE_SPEED,
  DEFAULT_CAR_MAX_SPEED,
  DEFAULT_CAR_MOVEMENT_LIMITS,
  DEFAULT_CAR_SPEED,
  DEFAULT_CAR_POSITION,
  DEFAULT_CAR_ANGLE,
  DEFAULT_CAR_STEERING_ANGLE,
  DEFAULT_MAX_STEERING_ANGLE,
  TWO_PI,
  applyForwardAcceleration,
  clampSteeringAngle,
  assertValidCarMovementLimits,
  clampCarSpeed,
  clampCarSpeedToMovementLimits,
  createCarPosition,
  createInitialCarState,
  isPositiveSpeedLimit,
  isValidCarMovementLimits,
  isValidCarSpeedValue,
  isValidSpeedLimit,
  isValidCanvasPositionValue,
  isValidAccelerationValue,
  isValidMaxSteeringAngle,
  isValidSteeringAngle,
  degreesToRadians,
  getHeadingVector,
  isValidHeadingAngle,
  normalizeHeadingAngle,
  radiansToDegrees,
  steeringInputToAngle,
} from "./carState";

describe("createInitialCarState", () => {
  it("creates the default Phase 1 MVP car state", () => {
    const car = createInitialCarState();

    expect(car).toEqual({
      positionX: 400,
      positionY: 600,
      speed: 0,
      acceleration: 120,
      friction: 70,
      angle: 0,
      steeringAngle: 0,
      turnRate: 2.4,
      maxSpeed: 260,
      maxReverseSpeed: 80,
      maxSteeringAngle: 0.5235987755982988,
      width: 36,
      height: 64,
      distanceTravelled: 0,
      collisionCount: 0,
      decision: "idle",
    });
  });

  it("returns a fresh object on every call", () => {
    const first = createInitialCarState();
    const second = createInitialCarState();

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });

  it("does not mutate DEFAULT_CAR_STATE when a runtime car copy changes", () => {
    const car = createInitialCarState();

    car.positionX = 999;
    car.speed = 123;
    car.decision = "accelerating";

    expect(DEFAULT_CAR_STATE.positionX).toBe(400);
    expect(DEFAULT_CAR_STATE.speed).toBe(0);
    expect(DEFAULT_CAR_STATE.decision).toBe("idle");
  });

  it("starts stationary with no steering", () => {
    const car = createInitialCarState();

    expect(car.speed).toBe(0);
    expect(car.steeringAngle).toBe(0);
    expect(car.angle).toBe(0);
  });

  it("uses positive movement limits", () => {
    const car = createInitialCarState();

    expect(car.maxSpeed).toBeGreaterThan(0);
    expect(car.maxReverseSpeed).toBeGreaterThan(0);
    expect(car.acceleration).toBeGreaterThan(0);
  });

  it("uses positive rendering dimensions", () => {
    const car = createInitialCarState();

    expect(car.width).toBeGreaterThan(0);
    expect(car.height).toBeGreaterThan(0);
  });

  it("starts with clean telemetry values", () => {
    const car = createInitialCarState();

    expect(car.distanceTravelled).toBe(0);
    expect(car.collisionCount).toBe(0);
    expect(car.decision).toBe("idle");
  });
});

describe("car position fields", () => {
  it("defines the default car position in canvas pixels", () => {
    expect(DEFAULT_CAR_POSITION).toEqual({
      positionX: 400,
      positionY: 600,
    });
  });

  it("creates initial car state with positionX and positionY", () => {
    const car = createInitialCarState();

    expect(car.positionX).toBe(400);
    expect(car.positionY).toBe(600);
  });

  it("returns position fields as finite numbers", () => {
    const car = createInitialCarState();

    expect(Number.isFinite(car.positionX)).toBe(true);
    expect(Number.isFinite(car.positionY)).toBe(true);
  });

  it("creates a valid custom car position", () => {
    expect(createCarPosition(120, 240)).toEqual({
      positionX: 120,
      positionY: 240,
    });
  });

  it("allows zero as a valid canvas position edge case", () => {
    expect(createCarPosition(0, 0)).toEqual({
      positionX: 0,
      positionY: 0,
    });
  });

  it("allows negative values for future world-space/camera scenarios", () => {
    expect(createCarPosition(-50, -100)).toEqual({
      positionX: -50,
      positionY: -100,
    });
  });

  it("rejects NaN position values", () => {
    expect(() => createCarPosition(Number.NaN, 100)).toThrow(RangeError);
    expect(() => createCarPosition(100, Number.NaN)).toThrow(RangeError);
  });

  it("rejects infinite position values", () => {
    expect(() => createCarPosition(Number.POSITIVE_INFINITY, 100)).toThrow(RangeError);

    expect(() => createCarPosition(100, Number.NEGATIVE_INFINITY)).toThrow(RangeError);
  });

  it("validates finite canvas position values", () => {
    expect(isValidCanvasPositionValue(0)).toBe(true);
    expect(isValidCanvasPositionValue(400)).toBe(true);
    expect(isValidCanvasPositionValue(-400)).toBe(true);
    expect(isValidCanvasPositionValue(Number.NaN)).toBe(false);
    expect(isValidCanvasPositionValue(Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe("car speed field", () => {
  it("starts with speed set to zero", () => {
    const car = createInitialCarState();

    expect(car.speed).toBe(0);
    expect(car.speed).toBe(DEFAULT_CAR_SPEED);
  });

  it("documents forward speed using a positive value", () => {
    expect(clampCarSpeed(120, DEFAULT_CAR_MAX_SPEED, DEFAULT_CAR_MAX_REVERSE_SPEED)).toBe(
      120,
    );
  });

  it("documents reverse speed using a negative value", () => {
    expect(clampCarSpeed(-40, DEFAULT_CAR_MAX_SPEED, DEFAULT_CAR_MAX_REVERSE_SPEED)).toBe(
      -40,
    );
  });

  it("keeps zero speed stationary", () => {
    expect(clampCarSpeed(0, DEFAULT_CAR_MAX_SPEED, DEFAULT_CAR_MAX_REVERSE_SPEED)).toBe(
      0,
    );
  });

  it("clamps forward speed to maxSpeed", () => {
    expect(clampCarSpeed(999, 260, 80)).toBe(260);
  });

  it("clamps reverse speed to negative maxReverseSpeed", () => {
    expect(clampCarSpeed(-999, 260, 80)).toBe(-80);
  });

  it("allows speed exactly at forward boundary", () => {
    expect(clampCarSpeed(260, 260, 80)).toBe(260);
  });

  it("allows speed exactly at reverse boundary", () => {
    expect(clampCarSpeed(-80, 260, 80)).toBe(-80);
  });

  it.skip("supports zero speed limits for locked movement scenarios", () => {
    expect(clampCarSpeed(100, 0, 0)).toBe(0);
    expect(clampCarSpeed(-100, 0, 0)).toBe(-0);
  });

  it("validates finite speed values", () => {
    expect(isValidCarSpeedValue(0)).toBe(true);
    expect(isValidCarSpeedValue(120)).toBe(true);
    expect(isValidCarSpeedValue(-40)).toBe(true);
    expect(isValidCarSpeedValue(Number.NaN)).toBe(false);
    expect(isValidCarSpeedValue(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidCarSpeedValue(Number.NEGATIVE_INFINITY)).toBe(false);
  });

  it("validates speed limits", () => {
    expect(isValidSpeedLimit(0)).toBe(true);
    expect(isValidSpeedLimit(80)).toBe(true);
    expect(isValidSpeedLimit(-1)).toBe(false);
    expect(isValidSpeedLimit(Number.NaN)).toBe(false);
    expect(isValidSpeedLimit(Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("rejects invalid speed values", () => {
    expect(() => clampCarSpeed(Number.NaN, 260, 80)).toThrow(RangeError);
    expect(() => clampCarSpeed(Number.POSITIVE_INFINITY, 260, 80)).toThrow(RangeError);
    expect(() => clampCarSpeed(Number.NEGATIVE_INFINITY, 260, 80)).toThrow(RangeError);
  });

  it("rejects invalid max speed limits", () => {
    expect(() => clampCarSpeed(10, -1, 80)).toThrow(RangeError);
    expect(() => clampCarSpeed(10, Number.NaN, 80)).toThrow(RangeError);
    expect(() => clampCarSpeed(10, Number.POSITIVE_INFINITY, 80)).toThrow(RangeError);
  });

  it("rejects invalid max reverse speed limits", () => {
    expect(() => clampCarSpeed(10, 260, -1)).toThrow(RangeError);
    expect(() => clampCarSpeed(10, 260, Number.NaN)).toThrow(RangeError);
    expect(() => clampCarSpeed(10, 260, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe("car acceleration capability", () => {
  it("defines a positive default acceleration", () => {
    const car = createInitialCarState();

    expect(car.acceleration).toBe(DEFAULT_CAR_ACCELERATION);
    expect(car.acceleration).toBeGreaterThan(0);
  });

  it("keeps acceleration separate from current speed", () => {
    const car = createInitialCarState();

    expect(car.speed).toBe(0);
    expect(car.acceleration).toBe(120);
    expect(car.speed).not.toBe(car.acceleration);
  });

  it("applies acceleration using delta time", () => {
    expect(applyForwardAcceleration(0, 120, 1)).toBe(120);
    expect(applyForwardAcceleration(10, 120, 0.5)).toBe(70);
    expect(applyForwardAcceleration(50, 120, 0)).toBe(50);
  });

  it("supports zero acceleration for locked movement scenarios", () => {
    expect(applyForwardAcceleration(50, 0, 1)).toBe(50);
  });

  it("validates acceleration values", () => {
    expect(isValidAccelerationValue(0)).toBe(true);
    expect(isValidAccelerationValue(120)).toBe(true);
    expect(isValidAccelerationValue(0.5)).toBe(true);

    expect(isValidAccelerationValue(-1)).toBe(false);
    expect(isValidAccelerationValue(Number.NaN)).toBe(false);
    expect(isValidAccelerationValue(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidAccelerationValue(Number.NEGATIVE_INFINITY)).toBe(false);
  });

  it("rejects invalid acceleration values", () => {
    expect(() => applyForwardAcceleration(0, -1, 1)).toThrow(RangeError);
    expect(() => applyForwardAcceleration(0, Number.NaN, 1)).toThrow(RangeError);
    expect(() => applyForwardAcceleration(0, Number.POSITIVE_INFINITY, 1)).toThrow(
      RangeError,
    );
  });

  it("rejects invalid speed values", () => {
    expect(() => applyForwardAcceleration(Number.NaN, 120, 1)).toThrow(RangeError);

    expect(() => applyForwardAcceleration(Number.POSITIVE_INFINITY, 120, 1)).toThrow(
      RangeError,
    );
  });

  it("rejects invalid delta time values", () => {
    expect(() => applyForwardAcceleration(0, 120, -1)).toThrow(RangeError);
    expect(() => applyForwardAcceleration(0, 120, Number.NaN)).toThrow(RangeError);

    expect(() => applyForwardAcceleration(0, 120, Number.POSITIVE_INFINITY)).toThrow(
      RangeError,
    );
  });

  it("handles fractional delta time for frame-rate independent motion", () => {
    expect(applyForwardAcceleration(0, 120, 1 / 60)).toBeCloseTo(2);
    expect(applyForwardAcceleration(0, 120, 1 / 30)).toBeCloseTo(4);
  });
});

describe("vehicle heading angle", () => {
  it("defines default heading as 0 radians", () => {
    const car = createInitialCarState();

    expect(car.angle).toBe(DEFAULT_CAR_ANGLE);
    expect(car.angle).toBe(0);
  });

  it("treats 0 radians as facing upward / north", () => {
    const vector = getHeadingVector(0);

    expect(vector.x).toBeCloseTo(0);
    expect(vector.y).toBeCloseTo(-1);
  });

  it("treats positive rotation as clockwise", () => {
    const right = getHeadingVector(Math.PI / 2);
    const down = getHeadingVector(Math.PI);
    const left = getHeadingVector((3 * Math.PI) / 2);

    expect(right.x).toBeCloseTo(1);
    expect(right.y).toBeCloseTo(0);

    expect(down.x).toBeCloseTo(0);
    expect(down.y).toBeCloseTo(1);

    expect(left.x).toBeCloseTo(-1);
    expect(left.y).toBeCloseTo(0);
  });

  it("validates finite heading angles", () => {
    expect(isValidHeadingAngle(0)).toBe(true);
    expect(isValidHeadingAngle(Math.PI)).toBe(true);
    expect(isValidHeadingAngle(-Math.PI)).toBe(true);
    expect(isValidHeadingAngle(TWO_PI * 10)).toBe(true);

    expect(isValidHeadingAngle(Number.NaN)).toBe(false);
    expect(isValidHeadingAngle(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidHeadingAngle(Number.NEGATIVE_INFINITY)).toBe(false);
  });

  it("normalizes positive angles into the range 0 inclusive to 2π exclusive", () => {
    expect(normalizeHeadingAngle(0)).toBeCloseTo(0);
    expect(normalizeHeadingAngle(TWO_PI)).toBeCloseTo(0);
    expect(normalizeHeadingAngle(TWO_PI + Math.PI / 2)).toBeCloseTo(Math.PI / 2);
  });

  it("normalizes negative angles into the range 0 inclusive to 2π exclusive", () => {
    expect(normalizeHeadingAngle(-Math.PI / 2)).toBeCloseTo((3 * Math.PI) / 2);
    expect(normalizeHeadingAngle(-TWO_PI)).toBeCloseTo(0);
  });

  it("converts radians to degrees for display use", () => {
    expect(radiansToDegrees(0)).toBeCloseTo(0);
    expect(radiansToDegrees(Math.PI / 2)).toBeCloseTo(90);
    expect(radiansToDegrees(Math.PI)).toBeCloseTo(180);
  });

  it("converts degrees to radians for tests and tooling", () => {
    expect(degreesToRadians(0)).toBeCloseTo(0);
    expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2);
    expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
  });

  it("rejects invalid heading angles", () => {
    expect(() => getHeadingVector(Number.NaN)).toThrow(RangeError);
    expect(() => normalizeHeadingAngle(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => radiansToDegrees(Number.NEGATIVE_INFINITY)).toThrow(RangeError);
  });

  it("rejects invalid degree values", () => {
    expect(() => degreesToRadians(Number.NaN)).toThrow(RangeError);
    expect(() => degreesToRadians(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe("vehicle steering angle", () => {
  it("starts with steering angle set to zero", () => {
    const car = createInitialCarState();

    expect(car.steeringAngle).toBe(DEFAULT_CAR_STEERING_ANGLE);
    expect(car.steeringAngle).toBe(0);
  });

  it("keeps steering angle separate from vehicle heading angle", () => {
    const car = createInitialCarState();

    expect(car.angle).toBe(0);
    expect(car.steeringAngle).toBe(0);
  });

  it("uses negative steering angle for left steering", () => {
    const left = steeringInputToAngle(-1);

    expect(left).toBeCloseTo(-DEFAULT_MAX_STEERING_ANGLE);
  });

  it("uses positive steering angle for right steering", () => {
    const right = steeringInputToAngle(1);

    expect(right).toBeCloseTo(DEFAULT_MAX_STEERING_ANGLE);
  });

  it("uses zero steering angle for straight wheels", () => {
    expect(steeringInputToAngle(0)).toBe(0);
  });

  it("clamps steering angle to maximum steering range", () => {
    expect(clampSteeringAngle(Math.PI, Math.PI / 6)).toBeCloseTo(Math.PI / 6);
    expect(clampSteeringAngle(-Math.PI, Math.PI / 6)).toBeCloseTo(-Math.PI / 6);
  });

  it("allows steering exactly at both boundaries", () => {
    expect(clampSteeringAngle(Math.PI / 6, Math.PI / 6)).toBeCloseTo(Math.PI / 6);
    expect(clampSteeringAngle(-Math.PI / 6, Math.PI / 6)).toBeCloseTo(-Math.PI / 6);
  });

  it("clamps normalized steering input to the range -1 to 1", () => {
    expect(steeringInputToAngle(99, Math.PI / 6)).toBeCloseTo(Math.PI / 6);
    expect(steeringInputToAngle(-99, Math.PI / 6)).toBeCloseTo(-Math.PI / 6);
  });

  it("supports zero maximum steering angle for locked steering scenarios", () => {
    expect(clampSteeringAngle(Math.PI / 6, 0)).toBe(0);
    expect(steeringInputToAngle(1, 0)).toBe(0);
  });

  it("validates steering angles", () => {
    expect(isValidSteeringAngle(0)).toBe(true);
    expect(isValidSteeringAngle(Math.PI / 12)).toBe(true);
    expect(isValidSteeringAngle(-Math.PI / 12)).toBe(true);

    expect(isValidSteeringAngle(Number.NaN)).toBe(false);
    expect(isValidSteeringAngle(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidSteeringAngle(Number.NEGATIVE_INFINITY)).toBe(false);
  });

  it("validates maximum steering angles", () => {
    expect(isValidMaxSteeringAngle(0)).toBe(true);
    expect(isValidMaxSteeringAngle(Math.PI / 6)).toBe(true);

    expect(isValidMaxSteeringAngle(-1)).toBe(false);
    expect(isValidMaxSteeringAngle(Number.NaN)).toBe(false);
    expect(isValidMaxSteeringAngle(Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("rejects invalid steering angle values", () => {
    expect(() => clampSteeringAngle(Number.NaN)).toThrow(RangeError);
    expect(() => clampSteeringAngle(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it("rejects invalid maximum steering angle values", () => {
    expect(() => clampSteeringAngle(0, -1)).toThrow(RangeError);
    expect(() => steeringInputToAngle(0, Number.NaN)).toThrow(RangeError);
  });

  it("rejects invalid normalized steering input values", () => {
    expect(() => steeringInputToAngle(Number.NaN)).toThrow(RangeError);
    expect(() => steeringInputToAngle(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it("documents default maximum steering angle as 30 degrees", () => {
    expect(radiansToDegrees(DEFAULT_MAX_STEERING_ANGLE)).toBeCloseTo(30);
    expect(degreesToRadians(30)).toBeCloseTo(DEFAULT_MAX_STEERING_ANGLE);
  });
});

describe("car movement limits", () => {
  it("defines positive default movement limits", () => {
    const car = createInitialCarState();

    expect(car.maxSpeed).toBe(DEFAULT_CAR_MAX_SPEED);
    expect(car.maxReverseSpeed).toBe(DEFAULT_CAR_MAX_REVERSE_SPEED);

    expect(car.maxSpeed).toBeGreaterThan(0);
    expect(car.maxReverseSpeed).toBeGreaterThan(0);
  });

  it("exposes canonical default movement limits", () => {
    expect(DEFAULT_CAR_MOVEMENT_LIMITS).toEqual({
      maxSpeed: 260,
      maxReverseSpeed: 80,
    });
  });

  it("keeps forward speed inside maxSpeed", () => {
    expect(clampCarSpeedToMovementLimits(999, DEFAULT_CAR_MOVEMENT_LIMITS)).toBe(260);
  });

  it("keeps reverse speed inside negative maxReverseSpeed", () => {
    expect(clampCarSpeedToMovementLimits(-999, DEFAULT_CAR_MOVEMENT_LIMITS)).toBe(-80);
  });

  it("allows speed inside movement limits", () => {
    expect(clampCarSpeedToMovementLimits(120, DEFAULT_CAR_MOVEMENT_LIMITS)).toBe(120);

    expect(clampCarSpeedToMovementLimits(-40, DEFAULT_CAR_MOVEMENT_LIMITS)).toBe(-40);
  });

  it("allows exact forward and reverse boundaries", () => {
    expect(clampCarSpeedToMovementLimits(260, DEFAULT_CAR_MOVEMENT_LIMITS)).toBe(260);

    expect(clampCarSpeedToMovementLimits(-80, DEFAULT_CAR_MOVEMENT_LIMITS)).toBe(-80);
  });

  it("supports direct clamp wrapper", () => {
    expect(clampCarSpeed(999, 260, 80)).toBe(260);
    expect(clampCarSpeed(-999, 260, 80)).toBe(-80);
  });

  it("validates positive speed limits", () => {
    expect(isPositiveSpeedLimit(1)).toBe(true);
    expect(isPositiveSpeedLimit(260)).toBe(true);

    expect(isPositiveSpeedLimit(0)).toBe(false);
    expect(isPositiveSpeedLimit(-1)).toBe(false);
    expect(isPositiveSpeedLimit(Number.NaN)).toBe(false);
    expect(isPositiveSpeedLimit(Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("validates full movement limit objects", () => {
    expect(
      isValidCarMovementLimits({
        maxSpeed: 260,
        maxReverseSpeed: 80,
      }),
    ).toBe(true);

    expect(
      isValidCarMovementLimits({
        maxSpeed: 0,
        maxReverseSpeed: 80,
      }),
    ).toBe(false);

    expect(
      isValidCarMovementLimits({
        maxSpeed: 260,
        maxReverseSpeed: -1,
      }),
    ).toBe(false);
  });

  it("throws when movement limits are invalid", () => {
    expect(() =>
      assertValidCarMovementLimits({
        maxSpeed: 0,
        maxReverseSpeed: 80,
      }),
    ).toThrow(RangeError);

    expect(() =>
      assertValidCarMovementLimits({
        maxSpeed: 260,
        maxReverseSpeed: 0,
      }),
    ).toThrow(RangeError);
  });

  it("rejects invalid speed values before clamping", () => {
    expect(() =>
      clampCarSpeedToMovementLimits(Number.NaN, DEFAULT_CAR_MOVEMENT_LIMITS),
    ).toThrow(RangeError);

    expect(() =>
      clampCarSpeedToMovementLimits(
        Number.POSITIVE_INFINITY,
        DEFAULT_CAR_MOVEMENT_LIMITS,
      ),
    ).toThrow(RangeError);
  });
});

describe("clampSteeringAngle", () => {
  it("clamps right steering to positive maxSteeringAngle", () => {
    expect(clampSteeringAngle(Math.PI, Math.PI / 6)).toBe(Math.PI / 6);
  });

  it("clamps left steering to negative maxSteeringAngle", () => {
    expect(clampSteeringAngle(-Math.PI, Math.PI / 6)).toBe(-Math.PI / 6);
  });

  it("preserves steering angle inside limits", () => {
    expect(clampSteeringAngle(0.1, Math.PI / 6)).toBe(0.1);
    expect(clampSteeringAngle(-0.1, Math.PI / 6)).toBe(-0.1);
  });

  it("allows zero max steering angle", () => {
    expect(clampSteeringAngle(1, 0)).toBe(0);
    expect(clampSteeringAngle(-1, 0)).toBe(0);
  });

  it("rejects invalid steering values", () => {
    expect(() => clampSteeringAngle(Number.NaN)).toThrow(RangeError);
    expect(() => clampSteeringAngle(1, Number.NaN)).toThrow(RangeError);
    expect(() => clampSteeringAngle(1, -1)).toThrow(RangeError);
  });
});
