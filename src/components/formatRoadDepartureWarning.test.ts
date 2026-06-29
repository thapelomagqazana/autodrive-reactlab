import { describe, expect, it } from "vitest";
import { formatRoadDepartureWarning } from "./formatRoadDepartureWarning";

describe("formatRoadDepartureWarning", () => {
  it("formats inactive warning", () => {
    expect(formatRoadDepartureWarning(false)).toBe("On road");
  });

  it("formats active warning", () => {
    expect(formatRoadDepartureWarning(true)).toBe("Off road");
  });
});
