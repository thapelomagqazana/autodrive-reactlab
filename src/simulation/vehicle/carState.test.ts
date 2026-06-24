import { describe, expect, it } from "vitest";
import {
  DEFAULT_CAR_STATE,
  createCarPosition,
  createInitialCarState,
  DEFAULT_CAR_POSITION,
  isValidCanvasPositionValue,
} from "./carState";

describe("createInitialCarState", () => {
  it("creates the default Phase 1 MVP car state", () => {
    const car = createInitialCarState();

    expect(car).toEqual({
      positionX: 400,
      positionY: 600,
      speed: 0,
      acceleration: 120,
      angle: 0,
      steeringAngle: 0,
      maxSpeed: 260,
      maxReverseSpeed: 80,
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
