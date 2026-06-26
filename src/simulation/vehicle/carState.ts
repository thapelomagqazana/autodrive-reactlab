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

export interface HeadingVector {
  /** Horizontal unit direction component. */
  x: number;

  /** Vertical unit direction component. */
  y: number;
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

  /**
   * Natural deceleration in pixels per second squared.
   *
   * Physics uses this to reduce speed toward 0 when no acceleration or braking
   * input is active. Friction must never reverse the vehicle direction by itself.
   */
  friction: number;
}

/**
 * Explicit movement limits for the car.
 *
 * Keeping this separate from CarState allows physics, AI, scenario loading,
 * and validation tools to reason about speed constraints without needing the
 * entire vehicle state object.
 */
export interface CarMovementLimits {
  /** Maximum forward speed in pixels per second. */
  maxSpeed: number;

  /** Maximum reverse speed magnitude in pixels per second. */
  maxReverseSpeed: number;
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
 * Canonical default movement limits.
 */
export const DEFAULT_CAR_MOVEMENT_LIMITS: Readonly<CarMovementLimits> = Object.freeze({
  maxSpeed: DEFAULT_CAR_MAX_SPEED,
  maxReverseSpeed: DEFAULT_CAR_MAX_REVERSE_SPEED,
});

/**
 * Default acceleration in pixels per second squared.
 *
 * This value means the car can gain 120 px/s of speed every second while
 * acceleration input is active, before max-speed clamping is applied.
 */
export const DEFAULT_CAR_ACCELERATION = 120;

/**
 * Default heading angle in radians.
 *
 * 0 radians points upward/north on the canvas.
 */
export const DEFAULT_CAR_ANGLE = 0;

/**
 * Full turn in radians.
 */
export const TWO_PI = Math.PI * 2;

/** Default steering angle: wheels straight. */
export const DEFAULT_CAR_STEERING_ANGLE = 0;

/** Maximum steering angle for MVP, equal to 30 degrees in radians. */
export const DEFAULT_MAX_STEERING_ANGLE = Math.PI / 6;

export const DEFAULT_CAR_FRICTION = 70;

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
  friction: DEFAULT_CAR_FRICTION,

  angle: DEFAULT_CAR_ANGLE,
  steeringAngle: DEFAULT_CAR_STEERING_ANGLE,

  ...DEFAULT_CAR_MOVEMENT_LIMITS,

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
 * Returns true when a heading angle is safe for simulation use.
 *
 * Any finite radian value is valid. Values outside 0..2π are allowed because
 * repeated turning may accumulate angle before normalization.
 */
export function isValidHeadingAngle(value: number): boolean {
  return Number.isFinite(value);
}

/**
 * Returns true when a steering angle is safe for simulation use.
 */
export function isValidSteeringAngle(value: number): boolean {
  return Number.isFinite(value);
}

/**
 * Returns true when a maximum steering angle is safe.
 *
 * It must be finite and non-negative.
 */
export function isValidMaxSteeringAngle(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/**
 * Returns true when a speed limit is valid.
 *
 * For production movement limits, positive numbers are required.
 */
export function isPositiveSpeedLimit(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

/**
 * Validates a full movement limit object.
 */
export function isValidCarMovementLimits(limits: CarMovementLimits): boolean {
  return (
    isPositiveSpeedLimit(limits.maxSpeed) && isPositiveSpeedLimit(limits.maxReverseSpeed)
  );
}

/**
 * Asserts that movement limits are safe for production physics use.
 */
export function assertValidCarMovementLimits(limits: CarMovementLimits): void {
  if (!isPositiveSpeedLimit(limits.maxSpeed)) {
    throw new RangeError("maxSpeed must be a finite positive value.");
  }

  if (!isPositiveSpeedLimit(limits.maxReverseSpeed)) {
    throw new RangeError("maxReverseSpeed must be a finite positive value.");
  }
}

/**
 * Clamps a signed speed value to explicit movement limits.
 *
 * Rule:
 * - Forward speed cannot exceed `maxSpeed`.
 * - Reverse speed cannot exceed `-maxReverseSpeed`.
 */
export function clampCarSpeedToMovementLimits(
  speed: number,
  limits: CarMovementLimits,
): number {
  if (!isValidCarSpeedValue(speed)) {
    throw new RangeError("speed must be a finite pixels-per-second value.");
  }

  assertValidCarMovementLimits(limits);

  return Math.min(Math.max(speed, -limits.maxReverseSpeed), limits.maxSpeed);
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
  return clampCarSpeedToMovementLimits(speed, {
    maxSpeed,
    maxReverseSpeed,
  });
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

/**
 * Clamps steering angle to the configured steering range.
 *
 * Rule:
 * - negative max = full left
 * - positive max = full right
 */
export function clampSteeringAngle(
  steeringAngle: number,
  maxSteeringAngle = DEFAULT_MAX_STEERING_ANGLE,
): number {
  if (!isValidSteeringAngle(steeringAngle)) {
    throw new RangeError("steeringAngle must be a finite radian value.");
  }

  if (!isValidMaxSteeringAngle(maxSteeringAngle)) {
    throw new RangeError("maxSteeringAngle must be a finite non-negative value.");
  }

  return Math.min(Math.max(steeringAngle, -maxSteeringAngle), maxSteeringAngle);
}

/**
 * Converts normalized steering input into a steering angle.
 *
 * Input convention:
 * - -1 = full left
 * - 0 = straight
 * - 1 = full right
 */
export function steeringInputToAngle(
  steeringInput: number,
  maxSteeringAngle = DEFAULT_MAX_STEERING_ANGLE,
): number {
  if (!Number.isFinite(steeringInput)) {
    throw new RangeError("steeringInput must be finite.");
  }

  if (!isValidMaxSteeringAngle(maxSteeringAngle)) {
    throw new RangeError("maxSteeringAngle must be a finite non-negative value.");
  }

  const clampedInput = Math.min(Math.max(steeringInput, -1), 1);

  return clampedInput * maxSteeringAngle;
}

/**
 * Normalizes a heading angle into the range [0, 2π).
 *
 * This is useful for dashboard display, debugging, telemetry, and future
 * serialization. Physics may still work with unnormalized angles, but UI
 * should prefer normalized values.
 */
export function normalizeHeadingAngle(angle: number): number {
  if (!isValidHeadingAngle(angle)) {
    throw new RangeError("angle must be a finite radian value.");
  }

  return ((angle % TWO_PI) + TWO_PI) % TWO_PI;
}

/**
 * Converts a heading angle into a canvas-space unit direction vector.
 *
 * Convention:
 * - 0 radians -> { x: 0, y: -1 }
 * - π / 2 radians -> { x: 1, y: 0 }
 * - π radians -> { x: 0, y: 1 }
 * - 3π / 2 radians -> { x: -1, y: 0 }
 */
export function getHeadingVector(angle: number): HeadingVector {
  if (!isValidHeadingAngle(angle)) {
    throw new RangeError("angle must be a finite radian value.");
  }

  return {
    x: Math.sin(angle),
    y: -Math.cos(angle),
  };
}

/**
 * Converts radians to degrees for display-only use.
 *
 * Internal simulation state must continue to use radians.
 */
export function radiansToDegrees(radians: number): number {
  if (!isValidHeadingAngle(radians)) {
    throw new RangeError("radians must be a finite value.");
  }

  return (radians * 180) / Math.PI;
}

/**
 * Converts degrees to radians for tests, docs, editor tools, or future imports.
 *
 * Runtime simulation state should still store radians.
 */
export function degreesToRadians(degrees: number): number {
  if (!Number.isFinite(degrees)) {
    throw new RangeError("degrees must be a finite value.");
  }

  return (degrees * Math.PI) / 180;
}
