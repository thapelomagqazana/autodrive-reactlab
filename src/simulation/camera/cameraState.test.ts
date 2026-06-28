import { describe, expect, it } from "vitest";
import {
  createInitialCameraState,
  screenToWorldPosition,
  worldToScreenPosition,
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
