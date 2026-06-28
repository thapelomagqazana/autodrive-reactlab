/**
 * DashboardPanelContainer.
 *
 * Connects dashboard display to Zustand using focused selectors.
 */

import {
  useSimulationCarAcceleration,
  useSimulationFps,
  useSimulationStatus,
  useSimulationTimeSeconds,
  useSimulationCarSpeed,
  useSimulationCarSteeringAngle,
  useSimulationCarPositionX,
  useSimulationCarPositionY,
  useSimulationCarHeading,
} from "../store";
import { DashboardPanel } from "./DashboardPanel";

export function DashboardPanelContainer() {
  const status = useSimulationStatus();
  const vehicleAcceleration = useSimulationCarAcceleration();
  const simulationTimeSeconds = useSimulationTimeSeconds();
  const fps = useSimulationFps();
  const vehicleSpeed = useSimulationCarSpeed();
  const steeringAngle = useSimulationCarSteeringAngle();
  const vehiclePositionX = useSimulationCarPositionX();
  const vehiclePositionY = useSimulationCarPositionY();
  const vehicleHeading = useSimulationCarHeading();

  return (
    <DashboardPanel
      status={status}
      simulationTimeSeconds={simulationTimeSeconds}
      fps={fps}
      vehicleSpeed={vehicleSpeed}
      vehicleAcceleration={vehicleAcceleration}
      steeringAngle={steeringAngle}
      vehiclePositionX={vehiclePositionX}
      vehiclePositionY={vehiclePositionY}
      vehicleHeading={vehicleHeading}
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
