import { describe, expect, it } from "vitest";
import { createInitialRoad } from "../world";
import {
  DEFAULT_MAXIMUM_OFF_ROAD_DISTANCE,
  shouldRecoverFromSevereRoadDeparture,
} from "./offRoadRecovery";

describe("offRoadRecovery", () => {
  it("does not recover while car center is inside road", () => {
    expect(
      shouldRecoverFromSevereRoadDeparture({ positionX: 400 }, createInitialRoad()),
    ).toBe(false);
  });

  it("does not recover for slight left off-road departure", () => {
    expect(
      shouldRecoverFromSevereRoadDeparture(
        { positionX: 220 - DEFAULT_MAXIMUM_OFF_ROAD_DISTANCE },
        createInitialRoad(),
      ),
    ).toBe(false);
  });

  it("does not recover for slight right off-road departure", () => {
    expect(
      shouldRecoverFromSevereRoadDeparture(
        { positionX: 580 + DEFAULT_MAXIMUM_OFF_ROAD_DISTANCE },
        createInitialRoad(),
      ),
    ).toBe(false);
  });

  it("recovers when car center exceeds left threshold", () => {
    expect(
      shouldRecoverFromSevereRoadDeparture(
        { positionX: 220 - DEFAULT_MAXIMUM_OFF_ROAD_DISTANCE - 1 },
        createInitialRoad(),
      ),
    ).toBe(true);
  });

  it("recovers when car center exceeds right threshold", () => {
    expect(
      shouldRecoverFromSevereRoadDeparture(
        { positionX: 580 + DEFAULT_MAXIMUM_OFF_ROAD_DISTANCE + 1 },
        createInitialRoad(),
      ),
    ).toBe(true);
  });

  it("supports custom maximum off-road distance", () => {
    expect(
      shouldRecoverFromSevereRoadDeparture(
        { positionX: 580 + 51 },
        createInitialRoad(),
        50,
      ),
    ).toBe(true);
  });

  it("rejects invalid car position", () => {
    expect(() =>
      shouldRecoverFromSevereRoadDeparture(
        { positionX: Number.NaN },
        createInitialRoad(),
      ),
    ).toThrow(RangeError);
  });

  it("rejects invalid maximum off-road distance", () => {
    expect(() =>
      shouldRecoverFromSevereRoadDeparture({ positionX: 400 }, createInitialRoad(), -1),
    ).toThrow(RangeError);
  });
});
