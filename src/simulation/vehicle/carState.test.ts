import { describe, expect, it } from "vitest";
import { DEFAULT_CAR_STATE, createInitialCarState } from "./carState";

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
