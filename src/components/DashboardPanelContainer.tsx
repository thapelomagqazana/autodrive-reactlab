/**
 * DashboardPanelContainer.
 *
 * Connects dashboard display to Zustand using focused selectors.
 */

import {
  useSimulationFps,
  useSimulationStatus,
  useSimulationTimeSeconds,
  useSimulationCarSpeed,
} from "../store";
import { DashboardPanel } from "./DashboardPanel";

export function DashboardPanelContainer() {
  const status = useSimulationStatus();
  const simulationTimeSeconds = useSimulationTimeSeconds();
  const fps = useSimulationFps();
  const vehicleSpeed = useSimulationCarSpeed();

  return (
    <DashboardPanel
      status={status}
      simulationTimeSeconds={simulationTimeSeconds}
      fps={fps}
      vehicleSpeed={vehicleSpeed}
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
