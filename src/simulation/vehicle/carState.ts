/**
 * Car runtime domain model for AutoDrive ReactLab.
 *
 * This module is the single source of truth for the simulated vehicle's
 * core runtime state during Phase 1: MVP moving car on road.
 *
 * Coordinate system:
 * - Units are canvas pixels unless otherwise stated.
 * - Origin is the top-left of the canvas.
 * - Positive X moves right.
 * - Positive Y moves down.
 *
 * Angle system:
 * - Angles are stored in radians.
 * - 0 radians means the car faces upward/north on the canvas.
 * - Positive angle rotation is clockwise.
 *
 * Design rule:
 * This file must not import React, Zustand, canvas APIs, physics functions,
 * rendering functions, or browser APIs. It is a pure domain model.
 */

/**
 * Explains the car's current high-level decision/state.
 *
 * Phase 1 starts with manual/runtime movement states only. Future phases can
 * extend this union for AI behaviour such as obstacle avoidance, parking,
 * lane following, and red-light stopping.
 */
export type CarDecision =
  | "idle"
  | "accelerating"
  | "braking"
  | "reversing"
  | "turning-left"
  | "turning-right";

/**
 * Center-point position of the simulated vehicle.
 *
 * This small type exists so rendering, physics, sensors, and future collision
 * systems can pass around position data without depending on the full CarState.
 */
export interface CarPosition {
  /** Horizontal center position in canvas pixels. */
  positionX: number;

  /** Vertical center position in canvas pixels. */
  positionY: number;
}

/**
 * Runtime state for the simulated car.
 *
 * This interface intentionally keeps rendering, physics, telemetry, and future
 * AI consumers aligned around one canonical state shape.
 */
export interface CarState extends CarPosition {
  /**
   * Current vehicle speed in pixels per second.
   *
   * Positive values move the car forward.
   * Negative values move the car in reverse.
   * Zero means stationary.
   */
  speed: number;

  /**
   * Forward acceleration capability in pixels per second squared.
   *
   * This is not current speed. Physics uses this value to change speed over time.
   */
  acceleration: number;

  /**
   * Current vehicle heading in radians.
   *
   * 0 means facing upward/north on the canvas.
   */
  angle: number;

  /**
   * Current steering angle in radians.
   *
   * 0 means wheels are straight.
   * Negative means steering left.
   * Positive means steering right.
   */
  steeringAngle: number;

  /** Maximum forward speed in pixels per second. */
  maxSpeed: number;

  /** Maximum reverse speed magnitude in pixels per second. */
  maxReverseSpeed: number;

  /** Render and collision width in pixels. */
  width: number;

  /** Render and collision height in pixels. */
  height: number;

  /** Total distance travelled in pixels. Used for telemetry. */
  distanceTravelled: number;

  /** Number of detected collisions. Used for telemetry and scoring. */
  collisionCount: number;

  /** Current high-level vehicle decision/state. */
  decision: CarDecision;
}

/**
 * Default center position for the Phase 1 MVP car.
 *
 * These values are intentionally centralized to prevent magic numbers from
 * leaking into renderers, stores, tests, and future reset logic.
 */
export const DEFAULT_CAR_POSITION: Readonly<CarPosition> = Object.freeze({
  positionX: 400,
  positionY: 600,
});

/**
 * Default speed for a fresh simulation.
 *
 * The vehicle must start stationary so Start/Pause/Reset behaviour remains
 * deterministic and safe.
 */
export const DEFAULT_CAR_SPEED = 0;

/**
 * Default maximum forward speed in pixels per second.
 */
export const DEFAULT_CAR_MAX_SPEED = 260;

/**
 * Default maximum reverse speed magnitude in pixels per second.
 */
export const DEFAULT_CAR_MAX_REVERSE_SPEED = 80;

/**
 * Default acceleration in pixels per second squared.
 *
 * This value means the car can gain 120 px/s of speed every second while
 * acceleration input is active, before max-speed clamping is applied.
 */
export const DEFAULT_CAR_ACCELERATION = 120;

/**
 * Immutable default configuration for the Phase 1 MVP car.
 *
 * Keeping these defaults centralized prevents components, tests, physics,
 * and store reset logic from duplicating magic numbers.
 */
export const DEFAULT_CAR_STATE: Readonly<CarState> = Object.freeze({
  ...DEFAULT_CAR_POSITION,

  speed: DEFAULT_CAR_SPEED,
  acceleration: DEFAULT_CAR_ACCELERATION,

  angle: 0,
  steeringAngle: 0,

  maxSpeed: DEFAULT_CAR_MAX_SPEED,
  maxReverseSpeed: DEFAULT_CAR_MAX_REVERSE_SPEED,

  width: 36,
  height: 64,

  distanceTravelled: 0,
  collisionCount: 0,

  decision: "idle",
});

/**
 * Creates a fresh initial car state.
 *
 * A new object is returned every time so callers can safely mutate their own
 * runtime copy without changing the shared defaults.
 */
export function createInitialCarState(): CarState {
  return {
    ...DEFAULT_CAR_STATE,
  };
}

/**
 * Returns true when a position value is safe for simulation use.
 *
 * This intentionally rejects NaN and Infinity because those values can poison
 * canvas rendering, physics calculations, and telemetry displays.
 */
export function isValidCanvasPositionValue(value: number): boolean {
  return Number.isFinite(value);
}

/**
 * Returns true when a speed value is safe for simulation calculations.
 */
export function isValidCarSpeedValue(value: number): boolean {
  return Number.isFinite(value);
}

/**
 * Returns true when an acceleration value is safe for simulation calculations.
 *
 * Acceleration must be finite and non-negative.
 * Zero is allowed for tests, parked states, disabled vehicles, or future
 * scenarios where movement is intentionally locked.
 */
export function isValidAccelerationValue(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/**
 * Returns true when a speed limit is safe.
 *
 * Speed limits must be finite and non-negative. Zero is technically valid,
 * because tests or future scenarios may intentionally freeze movement.
 */
export function isValidSpeedLimit(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/**
 * Creates a safe car position object.
 *
 * This helper is useful for tests, future scenario loading, reset logic, and
 * future editor tools where position data may come from user-authored JSON.
 */
export function createCarPosition(positionX: number, positionY: number): CarPosition {
  if (!isValidCanvasPositionValue(positionX)) {
    throw new RangeError("positionX must be a finite canvas pixel value.");
  }

  if (!isValidCanvasPositionValue(positionY)) {
    throw new RangeError("positionY must be a finite canvas pixel value.");
  }

  return {
    positionX,
    positionY,
  };
}

/**
 * Clamps a speed value into the allowed reverse/forward speed range.
 *
 * Rule:
 * - maxSpeed controls the upper forward bound.
 * - maxReverseSpeed controls the reverse magnitude.
 * - final speed must satisfy: -maxReverseSpeed <= speed <= maxSpeed.
 */
export function clampCarSpeed(
  speed: number,
  maxSpeed: number,
  maxReverseSpeed: number,
): number {
  if (!isValidCarSpeedValue(speed)) {
    throw new RangeError("speed must be a finite pixels-per-second value.");
  }

  if (!isValidSpeedLimit(maxSpeed)) {
    throw new RangeError("maxSpeed must be a finite non-negative value.");
  }

  if (!isValidSpeedLimit(maxReverseSpeed)) {
    throw new RangeError("maxReverseSpeed must be a finite non-negative value.");
  }

  return Math.min(Math.max(speed, -maxReverseSpeed), maxSpeed);
}

/**
 * Applies forward acceleration to speed in a frame-rate independent way.
 *
 * This helper does not update position. It only calculates speed.
 *
 * Formula:
 * nextSpeed = speed + acceleration * deltaTimeSeconds
 */
export function applyForwardAcceleration(
  speed: number,
  acceleration: number,
  deltaTimeSeconds: number,
): number {
  if (!isValidCarSpeedValue(speed)) {
    throw new RangeError("speed must be a finite pixels-per-second value.");
  }

  if (!isValidAccelerationValue(acceleration)) {
    throw new RangeError("acceleration must be a finite non-negative value.");
  }

  if (!Number.isFinite(deltaTimeSeconds) || deltaTimeSeconds < 0) {
    throw new RangeError("deltaTimeSeconds must be a finite non-negative value.");
  }

  return speed + acceleration * deltaTimeSeconds;
}
