/**
 * DashboardPanelContainer.
 *
 * Connects dashboard display to Zustand using focused selectors.
 */

import {
  useSimulationFps,
  useSimulationStatus,
  useSimulationTimeSeconds,
} from "../store";
import { DashboardPanel } from "./DashboardPanel";

export function DashboardPanelContainer() {
  const status = useSimulationStatus();
  const simulationTimeSeconds = useSimulationTimeSeconds();
  const fps = useSimulationFps();

  return (
    <DashboardPanel
      status={status}
      simulationTimeSeconds={simulationTimeSeconds}
      fps={fps}
      canvasDiagnostics={{
        width: 1280,
        height: 720,
        pixelRatio: 2,
        bufferWidth: 2560,
        bufferHeight: 1440,
      }}
    />
  );
}