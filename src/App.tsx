/**
 * Root composition for AutoDrive ReactLab.
 */

import { AppShell } from "./app";
import {
  ControlsPanelContainer,
  DashboardPanel,
  Header,
  SimulationCanvas,
} from "./components";
import { useSimulationStatus, useSimulationTelemetry } from "./store";

export function App() {
  const status = useSimulationStatus();
  const telemetry = useSimulationTelemetry();

  return (
    <AppShell
      header={<Header />}
      simulation={<SimulationCanvas />}
      controls={<ControlsPanelContainer />}
      dashboard={
        <DashboardPanel
          telemetry={{
            simulationTime: `${telemetry.simulationTimeSeconds.toFixed(1)}s`,
            fps: String(telemetry.fps),
            currentDecision: status,
          }}
        />
      }
    />
  );
}

export default App;