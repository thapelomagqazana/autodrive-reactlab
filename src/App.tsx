/**
 * Root composition for AutoDrive ReactLab.
 */

import { AppShell } from "./app";
import {
  ControlsPanelContainer,
  DashboardPanelContainer,
  Header,
  SimulationCanvas,
  SimulationLoopController,
} from "./components";

export function App() {
  return (
    <>
      <SimulationLoopController />

      <AppShell
        header={<Header />}
        simulation={<SimulationCanvas />}
        controls={<ControlsPanelContainer />}
        dashboard={<DashboardPanelContainer />}
      />
    </>
  );
}

export default App;
