/**
 * DashboardPanelContainer.
 *
 * Connects dashboard display to Zustand using focused selectors.
 */

import {
  useSimulationCarAcceleration,
  useSimulationCar,
  useSimulationFps,
  useSimulationStatus,
  useSimulationTimeSeconds,
  useSimulationCarSpeed,
  useSimulationCarSteeringAngle,
  useSimulationCarPositionX,
  useSimulationCarPositionY,
  useSimulationCarHeading,
  useRoadDepartureWarning,
} from "../store";
import { DashboardPanel } from "./DashboardPanel";
import { createSensorDebugSummary } from "../simulation/sensors/sensorDebugSummary";

export function DashboardPanelContainer() {
  const car = useSimulationCar();
  const status = useSimulationStatus();
  const vehicleAcceleration = useSimulationCarAcceleration();
  const simulationTimeSeconds = useSimulationTimeSeconds();
  const fps = useSimulationFps();
  const vehicleSpeed = useSimulationCarSpeed();
  const steeringAngle = useSimulationCarSteeringAngle();
  const vehiclePositionX = useSimulationCarPositionX();
  const vehiclePositionY = useSimulationCarPositionY();
  const vehicleHeading = useSimulationCarHeading();
  const roadDepartureWarning = useRoadDepartureWarning();
  const sensorDebugSummary = createSensorDebugSummary({
    sensorState: car.sensors,
    groupedReadings: {
      front: car.sensors.readings,
      left: [],
      right: [],
    },
  });

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
      roadDepartureWarning={roadDepartureWarning}
      canvasDiagnostics={{
        width: 1280,
        height: 720,
        pixelRatio: 2,
        bufferWidth: 2560,
        bufferHeight: 1440,
      }}
      sensorDebugSummary={sensorDebugSummary}
    />
  );
}
