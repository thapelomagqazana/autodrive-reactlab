import { describe, expect, it } from "vitest";
import {
  DEFAULT_ROAD_BOTTOM_EXTENSION,
  DEFAULT_ROAD_TOP_EXTENSION,
  assertValidRoadViewportDimensions,
  createFixedRoadForViewport,
  isRoadCenteredInViewport,
  isValidViewportDimension,
} from "./roadViewport";

describe("fixed road viewport", () => {
  it("creates a road centered in the canvas viewport", () => {
    const road = createFixedRoadForViewport({
      width: 800,
      height: 900,
    });

    expect(road).toEqual({
      centerX: 400,
      width: 360,
      laneCount: 3,
      topY: -DEFAULT_ROAD_TOP_EXTENSION,
      bottomY: 900 + DEFAULT_ROAD_BOTTOM_EXTENSION,
    });
  });

  it("keeps road centered horizontally after canvas resize", () => {
    const smallRoad = createFixedRoadForViewport({
      width: 800,
      height: 900,
    });

    const largeRoad = createFixedRoadForViewport({
      width: 1200,
      height: 900,
    });

    expect(smallRoad.centerX).toBe(400);
    expect(largeRoad.centerX).toBe(600);
  });

  it("is deterministic for the same viewport dimensions", () => {
    const dimensions = {
      width: 800,
      height: 900,
    };

    expect(createFixedRoadForViewport(dimensions)).toEqual(
      createFixedRoadForViewport(dimensions),
    );
  });

  it("does not depend on car movement", () => {
    const dimensions = {
      width: 800,
      height: 900,
    };

    const roadBeforeCarMovement = createFixedRoadForViewport(dimensions);
    const roadAfterCarMovement = createFixedRoadForViewport(dimensions);

    expect(roadAfterCarMovement).toEqual(roadBeforeCarMovement);
  });

  it("supports custom road options", () => {
    const road = createFixedRoadForViewport(
      {
        width: 1000,
        height: 700,
      },
      {
        width: 420,
        laneCount: 4,
        topExtension: 500,
        bottomExtension: 300,
      },
    );

    expect(road).toEqual({
      centerX: 500,
      width: 420,
      laneCount: 4,
      topY: -500,
      bottomY: 1000,
    });
  });

  it("reports whether road is centered in viewport", () => {
    const dimensions = {
      width: 800,
      height: 900,
    };

    const road = createFixedRoadForViewport(dimensions);

    expect(isRoadCenteredInViewport(road, dimensions)).toBe(true);

    expect(
      isRoadCenteredInViewport(
        {
          ...road,
          centerX: 401,
        },
        dimensions,
      ),
    ).toBe(false);
  });

  it("validates viewport dimensions", () => {
    expect(isValidViewportDimension(1)).toBe(true);
    expect(isValidViewportDimension(800)).toBe(true);

    expect(isValidViewportDimension(0)).toBe(false);
    expect(isValidViewportDimension(-1)).toBe(false);
    expect(isValidViewportDimension(Number.NaN)).toBe(false);
    expect(isValidViewportDimension(Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("rejects invalid viewport dimensions", () => {
    expect(() =>
      assertValidRoadViewportDimensions({
        width: 0,
        height: 900,
      }),
    ).toThrow(RangeError);

    expect(() =>
      assertValidRoadViewportDimensions({
        width: 800,
        height: Number.NaN,
      }),
    ).toThrow(RangeError);
  });

  it("rejects invalid road options", () => {
    expect(() =>
      createFixedRoadForViewport(
        {
          width: 800,
          height: 900,
        },
        {
          width: 0,
        },
      ),
    ).toThrow(RangeError);

    expect(() =>
      createFixedRoadForViewport(
        {
          width: 800,
          height: 900,
        },
        {
          laneCount: 1.5,
        },
      ),
    ).toThrow(RangeError);

    expect(() =>
      createFixedRoadForViewport(
        {
          width: 800,
          height: 900,
        },
        {
          topExtension: -1,
        },
      ),
    ).toThrow(RangeError);
  });
});
