import { describe, expect, it } from "vitest";
import {
  calculateFollowCameraAnchor,
  calculateFollowCameraOffset,
  createInitialCameraState,
  screenToWorldPosition,
  worldToScreenPosition,
  resolveCameraForView,
  lerpNumber,
  smoothCameraOffset,
} from "./cameraState";

describe("cameraState", () => {
  it("creates fixed camera at origin by default", () => {
    expect(createInitialCameraState()).toEqual({
      offsetX: 0,
      offsetY: 0,
      mode: "fixed",
    });
  });

  it("supports valid overrides", () => {
    expect(
      createInitialCameraState({
        offsetX: 100,
        offsetY: 200,
        mode: "follow",
      }),
    ).toEqual({
      offsetX: 100,
      offsetY: 200,
      mode: "follow",
    });
  });

  it("rejects invalid offsets", () => {
    expect(() =>
      createInitialCameraState({
        offsetX: Number.NaN,
      }),
    ).toThrow(RangeError);

    expect(() =>
      createInitialCameraState({
        offsetY: Number.POSITIVE_INFINITY,
      }),
    ).toThrow(RangeError);
  });

  it("converts world position to screen position", () => {
    expect(
      worldToScreenPosition(
        { positionX: 450, positionY: 720 },
        { offsetX: 50, offsetY: 120, mode: "fixed" },
      ),
    ).toEqual({
      screenX: 400,
      screenY: 600,
    });
  });

  it("converts screen position to world position", () => {
    expect(
      screenToWorldPosition(
        { screenX: 400, screenY: 600 },
        { offsetX: 50, offsetY: 120, mode: "fixed" },
      ),
    ).toEqual({
      positionX: 450,
      positionY: 720,
    });
  });

  it("does not mutate inputs during conversion", () => {
    const camera = { offsetX: 50, offsetY: 120, mode: "fixed" as const };
    const position = { positionX: 450, positionY: 720 };

    worldToScreenPosition(position, camera);

    expect(camera).toEqual({ offsetX: 50, offsetY: 120, mode: "fixed" });
    expect(position).toEqual({ positionX: 450, positionY: 720 });
  });
});

describe("follow camera anchor", () => {
  it("places the anchor at horizontal center and lower viewport", () => {
    expect(
      calculateFollowCameraAnchor({
        width: 1000,
        height: 800,
      }),
    ).toEqual({
      anchorX: 500,
      anchorY: 576,
    });
  });

  it("calculates offset that places car at the anchor", () => {
    expect(
      calculateFollowCameraOffset(
        {
          positionX: 450,
          positionY: 720,
        },
        {
          width: 1000,
          height: 800,
        },
      ),
    ).toEqual({
      offsetX: 50,
      offsetY: -144,
    });
  });

  it("supports custom anchor ratio", () => {
    expect(
      calculateFollowCameraAnchor(
        {
          width: 1000,
          height: 800,
        },
        0.5,
      ),
    ).toEqual({
      anchorX: 500,
      anchorY: 400,
    });
  });

  it("rejects invalid viewport dimensions", () => {
    expect(() =>
      calculateFollowCameraAnchor({
        width: 0,
        height: 800,
      }),
    ).toThrow(RangeError);

    expect(() =>
      calculateFollowCameraAnchor({
        width: 1000,
        height: Number.NaN,
      }),
    ).toThrow(RangeError);
  });

  it("keeps fixed camera unchanged", () => {
    const camera = createInitialCameraState({
      mode: "fixed",
      offsetX: 10,
      offsetY: 20,
    });

    expect(
      resolveCameraForView(
        camera,
        { positionX: 450, positionY: 720 },
        { width: 1000, height: 800 },
      ),
    ).toBe(camera);
  });

  it("updates follow camera offset from car and viewport", () => {
    expect(
      resolveCameraForView(
        createInitialCameraState({
          mode: "follow",
        }),
        { positionX: 450, positionY: 720 },
        { width: 1000, height: 800 },
      ),
    ).toEqual({
      mode: "follow",
      offsetX: 50,
      offsetY: -144,
    });
  });
});

it("linearly interpolates toward a target", () => {
  expect(lerpNumber(0, 100, 0.12)).toBe(12);
});

it("smooths camera offset toward target", () => {
  expect(
    smoothCameraOffset({ offsetX: 0, offsetY: 0 }, { offsetX: 100, offsetY: -50 }, 0.12),
  ).toEqual({
    offsetX: 12,
    offsetY: -6,
  });
});

it("does not move when smoothing factor is zero", () => {
  expect(
    smoothCameraOffset({ offsetX: 10, offsetY: 20 }, { offsetX: 100, offsetY: 200 }, 0),
  ).toEqual({
    offsetX: 10,
    offsetY: 20,
  });
});

it("snaps to target when smoothing factor is one", () => {
  expect(
    smoothCameraOffset({ offsetX: 10, offsetY: 20 }, { offsetX: 100, offsetY: 200 }, 1),
  ).toEqual({
    offsetX: 100,
    offsetY: 200,
  });
});

it("rejects invalid smoothing factors", () => {
  expect(() => lerpNumber(0, 100, -0.1)).toThrow(RangeError);
  expect(() => lerpNumber(0, 100, 1.1)).toThrow(RangeError);
  expect(() => lerpNumber(0, 100, Number.NaN)).toThrow(RangeError);
});

it("resolves follow camera smoothly instead of snapping", () => {
  const camera = {
    offsetX: 0,
    offsetY: 0,
    mode: "follow" as const,
  };

  const next = resolveCameraForView(
    camera,
    { positionX: 450, positionY: 720 },
    { width: 1000, height: 800 },
    0.12,
  );

  expect(next).toEqual({
    mode: "follow",
    offsetX: 6,
    offsetY: -17.28,
  });
});
