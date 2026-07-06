import { describe, expect, it } from "vitest";
import {
  DEFAULT_BASE_SENSOR_CONFIG,
  DEFAULT_FRONT_SENSOR_PROFILE_CONFIG,
  DEFAULT_SIDE_SENSOR_PROFILE_CONFIG,
  createBaseSensorConfig,
  createFrontSensorProfileConfig,
  createSensorSystemConfig,
  createSideSensorProfileConfig,
} from "./sensorConfiguration";

describe("sensorConfiguration", () => {
  it("creates valid default base sensor config", () => {
    expect(createBaseSensorConfig()).toEqual(DEFAULT_BASE_SENSOR_CONFIG);
  });

  it("allows valid base overrides", () => {
    expect(
      createBaseSensorConfig({
        rayCount: 9,
        rayLength: 250,
        raySpread: Math.PI / 3,
        sensorEnabled: false,
      }),
    ).toEqual({
      rayCount: 9,
      rayLength: 250,
      raySpread: Math.PI / 3,
      sensorEnabled: false,
    });
  });

  it("rejects invalid ray count", () => {
    expect(() => createBaseSensorConfig({ rayCount: 0 })).toThrow(RangeError);
    expect(() => createBaseSensorConfig({ rayCount: -1 })).toThrow(RangeError);
    expect(() => createBaseSensorConfig({ rayCount: 1.5 })).toThrow(RangeError);
    expect(() => createBaseSensorConfig({ rayCount: Number.NaN })).toThrow(RangeError);
    expect(() => createBaseSensorConfig({ rayCount: Infinity })).toThrow(RangeError);
  });

  it("rejects invalid ray length", () => {
    expect(() => createBaseSensorConfig({ rayLength: 0 })).toThrow(RangeError);
    expect(() => createBaseSensorConfig({ rayLength: -1 })).toThrow(RangeError);
    expect(() => createBaseSensorConfig({ rayLength: Number.NaN })).toThrow(RangeError);
    expect(() => createBaseSensorConfig({ rayLength: Infinity })).toThrow(RangeError);
  });

  it("rejects invalid ray spread", () => {
    expect(() => createBaseSensorConfig({ raySpread: 0 })).toThrow(RangeError);
    expect(() => createBaseSensorConfig({ raySpread: -1 })).toThrow(RangeError);
    expect(() => createBaseSensorConfig({ raySpread: Number.NaN })).toThrow(RangeError);
    expect(() => createBaseSensorConfig({ raySpread: Infinity })).toThrow(RangeError);
    expect(() => createBaseSensorConfig({ raySpread: Math.PI + 0.01 })).toThrow(
      RangeError,
    );
  });

  it("preserves front profile defaults", () => {
    expect(createFrontSensorProfileConfig()).toEqual(DEFAULT_FRONT_SENSOR_PROFILE_CONFIG);
  });

  it("allows valid front profile overrides", () => {
    expect(
      createFrontSensorProfileConfig({
        rayCount: 5,
        raySpread: Math.PI / 3,
      }),
    ).toEqual({
      rayCount: 5,
      raySpread: Math.PI / 3,
    });
  });

  it("preserves side profile defaults", () => {
    expect(createSideSensorProfileConfig()).toEqual(DEFAULT_SIDE_SENSOR_PROFILE_CONFIG);
  });

  it("allows valid side profile overrides", () => {
    expect(
      createSideSensorProfileConfig({
        sideSensorEnabled: false,
        sideRayLengthRatio: 0.5,
      }),
    ).toEqual({
      sideSensorEnabled: false,
      sideRayLengthRatio: 0.5,
    });
  });

  it("rejects invalid side ray length ratio", () => {
    expect(() => createSideSensorProfileConfig({ sideRayLengthRatio: 0 })).toThrow(
      RangeError,
    );
    expect(() => createSideSensorProfileConfig({ sideRayLengthRatio: -1 })).toThrow(
      RangeError,
    );
    expect(() => createSideSensorProfileConfig({ sideRayLengthRatio: 1 })).toThrow(
      RangeError,
    );
    expect(() => createSideSensorProfileConfig({ sideRayLengthRatio: 1.1 })).toThrow(
      RangeError,
    );
    expect(() =>
      createSideSensorProfileConfig({ sideRayLengthRatio: Number.NaN }),
    ).toThrow(RangeError);
    expect(() => createSideSensorProfileConfig({ sideRayLengthRatio: Infinity })).toThrow(
      RangeError,
    );
  });

  it("creates full sensor system config", () => {
    expect(
      createSensorSystemConfig({
        base: { rayLength: 250 },
        front: { rayCount: 5 },
        side: { sideRayLengthRatio: 0.5 },
      }),
    ).toEqual({
      base: {
        ...DEFAULT_BASE_SENSOR_CONFIG,
        rayLength: 250,
      },
      front: {
        ...DEFAULT_FRONT_SENSOR_PROFILE_CONFIG,
        rayCount: 5,
      },
      side: {
        ...DEFAULT_SIDE_SENSOR_PROFILE_CONFIG,
        sideRayLengthRatio: 0.5,
      },
    });
  });

  it("does not mutate defaults", () => {
    const baseBefore = structuredClone(DEFAULT_BASE_SENSOR_CONFIG);
    const frontBefore = structuredClone(DEFAULT_FRONT_SENSOR_PROFILE_CONFIG);
    const sideBefore = structuredClone(DEFAULT_SIDE_SENSOR_PROFILE_CONFIG);

    createSensorSystemConfig({
      base: { rayLength: 250 },
      front: { raySpread: Math.PI / 3 },
      side: { sideRayLengthRatio: 0.5 },
    });

    expect(DEFAULT_BASE_SENSOR_CONFIG).toEqual(baseBefore);
    expect(DEFAULT_FRONT_SENSOR_PROFILE_CONFIG).toEqual(frontBefore);
    expect(DEFAULT_SIDE_SENSOR_PROFILE_CONFIG).toEqual(sideBefore);
  });
});
