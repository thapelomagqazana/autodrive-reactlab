/**
 * Component tests for Header.
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "../tests/test-utils";
import { Header } from "./Header";

describe("Header", () => {
  it("renders the default project title", () => {
    render(<Header />);

    expect(
      screen.getByRole("heading", { level: 1, name: "AutoDrive Lab" }),
    ).toBeInTheDocument();
  });

  it("renders the simulator subtitle", () => {
    render(<Header />);

    expect(
      screen.getByText(/retro arcade autonomous driving simulator/i),
    ).toBeInTheDocument();
  });

  it("renders the phase badge", () => {
    render(<Header />);

    expect(screen.getByText("Phase 0 · Foundation")).toBeInTheDocument();
  });

  it("supports custom header content", () => {
    render(
      <Header
        title="Custom Lab"
        eyebrow="Custom Eyebrow"
        subtitle="Custom subtitle"
        phaseLabel="Phase X"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Custom Lab" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Custom Eyebrow")).toBeInTheDocument();
    expect(screen.getByText("Custom subtitle")).toBeInTheDocument();
    expect(screen.getByText("Phase X")).toBeInTheDocument();
  });
});