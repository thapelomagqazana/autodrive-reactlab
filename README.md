# AutoDrive Lab

A React + TypeScript self-driving car simulation lab built with canvas rendering, Zustand state management, keyboard controls, deterministic vehicle physics, camera following, dashboard telemetry, and Playwright E2E coverage.

## Project Status

```txt
Phase 1: MVP Moving Car on Road — Completed
```

## What Phase 1 Delivers

Phase 1 establishes the first playable simulation loop:

```txt
Start simulation
Pause simulation
Reset simulation
Drive forward
Brake / reverse
Steer left and right
Track speed, acceleration, steering, heading, position, FPS, and road status
Follow the vehicle with camera mode
Render road and car on canvas
Detect off-road state
Apply off-road speed penalty
Recover from severe road departure
Validate behaviour with unit and E2E tests
```

## Tech Stack

```txt
React
TypeScript
Vite
Tailwind CSS
Zustand
Canvas API
Vitest
Testing Library
Playwright
```

## Core Features

- Canvas-based simulation viewport
- Zustand-backed simulation state
- Start, pause, and reset lifecycle controls
- Keyboard driving controls
- Acceleration and brake/reverse input
- Steering input with return-to-center behaviour
- Vehicle movement physics
- Follow/fixed camera mode
- Procedural road rendering
- Dashboard telemetry
- Road departure warning
- Off-road speed penalty
- Severe off-road recovery reset
- Unit tests and Playwright E2E tests

## Running the Project

```bash
npm install
npm run dev
```

## Running Tests

```bash
npm test
npm run test:e2e
```

## Phase 1 Acceptance Summary

```txt
Car moves smoothly.
Car can reset.
Speed updates live.
No page reload is needed.
Keyboard input controls movement.
Camera can follow the vehicle.
Dashboard reflects live simulation state.
Off-road state is detected and handled safely.
Tests protect the MVP behaviour.
```

## Useful Scripts

```bash
npm run dev
npm test
npm run test:e2e
npm run build
npm run lint
```

## Current Architecture

```txt
src/
  app/
  components/
  hooks/
  simulation/
    camera/
    engine/
    vehicle/
    world/
  store/
  types/
  utils/

tests/
  e2e/
```

## Phase 1 Engineering Principles

Phase 1 was intentionally designed around a small set of engineering principles that make the simulator easy to understand, test, and extend. Rather than coupling rendering, physics, and UI together, each subsystem has a clearly defined responsibility.

| Principle                                  | Rationale                                                                                                                                     |
| :----------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| **Physics is pure and deterministic**      | Every frame produces the same output for the same input, making behaviour predictable and easy to test.                                       |
| **React owns the UI, not the simulation**  | React renders dashboards, controls, and telemetry only. It does not participate in per-frame vehicle physics.                                 |
| **Canvas owns rendering**                  | All drawing occurs directly on the HTML Canvas using the Canvas 2D API, avoiding unnecessary React re-renders.                                |
| **Zustand owns runtime state**             | The global simulation state is centralized in a lightweight store that exposes focused selectors for efficient rendering.                     |
| **Keyboard input is normalized**           | Raw keyboard events are converted into a consistent input model before reaching the physics engine.                                           |
| **Road boundary detection is centralized** | A single helper determines whether the vehicle is on or off the road, ensuring consistent behaviour across all systems.                       |
| **Camera influences rendering only**       | Camera calculations modify only what the user sees, never the underlying physics or world coordinates.                                        |
| **Performance is measurable**              | FPS and canvas diagnostics are exposed through telemetry to make performance visible during development.                                      |
| **Testing spans every layer**              | Unit tests validate pure functions, integration tests validate state updates, and Playwright end-to-end tests verify complete user workflows. |

---

## Vehicle Physics

The simulator uses a deterministic, frame-rate-independent kinematic physics model. Although intentionally simple for the Phase 1 MVP, the architecture is designed to support significantly more advanced vehicle dynamics in later phases without requiring major refactoring.

### Physics Update Pipeline

Each simulation frame executes the following sequence:

```text
Keyboard Input
        │
        ▼
Input Normalisation
        │
        ▼
Acceleration / Braking
        │
        ▼
Rolling Friction
        │
        ▼
Off-Road Speed Penalty
        │
        ▼
Forward / Reverse Speed Clamp
        │
        ▼
Steering Angle Resolution
        │
        ▼
Heading Integration
        │
        ▼
Position Integration
        │
        ▼
Road Boundary Detection
        │
        ▼
Road Departure Warning
        │
        ▼
Severe Departure Recovery Check
        │
        ▼
Telemetry Update
        │
        ▼
Canvas Rendering
```

Each stage has a single responsibility and is implemented independently. This separation keeps the simulation deterministic while allowing future systems to be inserted without affecting existing behaviour.

---

## Vehicle State Model

Every frame operates on an immutable `CarState` object.

The state currently contains:

- Vehicle position (`positionX`, `positionY`)
- Heading angle
- Current speed
- Acceleration rate
- Steering angle
- Maximum steering angle
- Maximum forward speed
- Maximum reverse speed
- Rolling friction
- Steering return rate
- Vehicle dimensions
- Off-road state (derived, not stored permanently)

Rather than mutating an existing object, each physics update returns a brand-new `CarState`. This functional approach simplifies reasoning, debugging, undo operations, and automated testing.

---

## Implemented Physics Features

Phase 1 includes the following vehicle behaviours:

### Vehicle Movement

- Forward acceleration
- Braking
- Reverse driving
- Speed clamping
- Frame-rate-independent integration

### Steering

- Left and right steering
- Steering angle limits
- Automatic steering return-to-centre
- Steering effectiveness based on movement

### Motion

- Heading integration
- Position integration
- Rolling friction
- Deterministic movement

### Road Interaction

- Road boundary detection
- Road departure warning
- Off-road speed penalty
- Manual recovery by steering back onto the road
- Automatic severe departure recovery

### Camera System

- Fixed camera mode
- Follow camera mode
- Camera tracking independent of physics
- Vehicle remains visible during off-road driving

### Telemetry

Mission telemetry currently exposes:

- Simulation status
- Elapsed time
- FPS
- Vehicle speed
- Acceleration
- Steering angle
- Heading
- Position
- Road status
- Canvas diagnostics
- Debug placeholders for future systems

---

## Why the Physics Engine Is Deterministic

The simulation is intentionally deterministic.

Given the same:

- Initial vehicle state
- Keyboard inputs
- Road configuration
- Delta time sequence

the simulator will always produce exactly the same result.

Deterministic simulations provide several advantages:

- Reliable automated testing
- Easier debugging
- Repeatable demonstrations
- Consistent AI training environments
- Predictable multiplayer synchronization
- Simplified replay and recording systems

---

## Separation of Responsibilities

The project follows a strict separation between major subsystems.

```text
React UI
    │
    ▼
Zustand Store
    │
    ▼
Simulation Engine
    │
    ▼
Physics
    │
    ▼
Road / Vehicle Models
    │
    ▼
Canvas Renderer
```

Each layer communicates only through well-defined interfaces.

This architecture minimizes coupling, improves maintainability, and allows individual components to evolve independently.

---

## Testing Strategy

The simulator is tested at multiple levels.

### Unit Tests

Validate individual pure functions, including:

- Speed calculations
- Steering calculations
- Friction
- Road boundary detection
- Camera calculations
- Vehicle state creation
- Formatting helpers

### Integration Tests

Validate subsystem interactions, including:

- Zustand store updates
- Physics pipeline execution
- Road departure warnings
- Camera mode switching
- Recovery behaviour

### End-to-End Tests

Playwright verifies complete user-visible workflows:

- Application startup
- Simulation lifecycle
- Keyboard driving
- Steering
- Camera switching
- Road departure
- Automatic recovery
- Performance monitoring

This layered testing approach ensures correctness from individual algorithms through to the complete user experience.

---

## Architectural Goals

The Phase 1 architecture was built with long-term extensibility in mind.

The design aims to remain:

- Deterministic
- Pure
- Modular
- Maintainable
- Testable
- Extensible
- Rendering-independent
- Framework-independent
- Performance-conscious

By keeping physics independent of both React and Canvas, future rendering technologies or UI frameworks can be adopted without rewriting the simulation core.

---

## Future Physics Roadmap

The current kinematic model provides a strong foundation for more advanced vehicle dynamics.

Planned enhancements include:

### Vehicle Dynamics

- Tyre slip angles
- Ackermann steering geometry
- Weight transfer
- Vehicle mass
- Centre of gravity
- Suspension systems
- Aerodynamic drag
- Engine torque curves
- Gearboxes
- Differential models

### Environment

- Road friction coefficients
- Wet surfaces
- Gravel
- Ice
- Elevation changes
- Banking
- Variable road widths

### Collision System

- Static obstacles
- Dynamic vehicles
- Collision response
- Damage modelling
- Impact forces
- Recovery strategies

### Autonomous Driving

- Ray-cast sensors
- Lidar simulation
- Camera simulation
- Lane detection
- Traffic rules
- Path planning
- Behaviour trees
- State machines
- Reinforcement learning agents
- Neural network controllers

The architectural decisions made in Phase 1 ensure that these future capabilities can be added incrementally while preserving the simplicity, reliability, and testability of the existing codebase.

---

## ⌨️ Keyboard Controls

AutoDrive ReactLab is designed to be driven entirely from the keyboard, providing an experience similar to many driving simulators and games. Vehicle movement and simulation lifecycle controls are intentionally separated so that driving actions remain independent from application management.

### Vehicle Controls

| Key | Action              | Description                                                                    |
| :-- | :------------------ | :----------------------------------------------------------------------------- |
| ↑   | **Accelerate**      | Increases forward speed while the key is held.                                 |
| ↓   | **Brake / Reverse** | Applies braking force. When the vehicle is stationary, continues into reverse. |
| ←   | **Steer Left**      | Turns the steering wheel left while the key is held.                           |
| →   | **Steer Right**     | Turns the steering wheel right while the key is held.                          |

### Driving Notes

- Steering effectiveness increases while the vehicle is moving.
- Steering automatically returns toward the centre when released.
- Releasing **↑** and **↓** allows rolling friction to gradually slow the vehicle.
- Maximum forward and reverse speeds are enforced by the physics engine.
- Driving off the road activates the off-road penalty system and displays a road departure warning.

---

## 🎮 Simulation Controls

Simulation lifecycle controls are available from the **Controls** panel.

| Button        | Action             | Description                                                              |
| :------------ | :----------------- | :----------------------------------------------------------------------- |
| ▶ **Start**   | Start Simulation   | Begins the physics simulation and starts updating telemetry.             |
| ⏸ **Pause**   | Pause Simulation   | Suspends physics updates while preserving the current vehicle state.     |
| 🔄 **Reset**  | Reset Simulation   | Restores the vehicle, road, camera and telemetry to their initial state. |
| 📷 **Camera** | Toggle Camera Mode | Switches between **Fixed Camera** and **Follow Camera** modes.           |

---

## 📷 Camera Modes

### Fixed Camera

- Camera remains stationary.
- Vehicle moves through the viewport.
- Useful for debugging physics.

### Follow Camera

- Camera continuously follows the vehicle.
- Vehicle remains near the lower centre of the viewport.
- Makes long-distance driving easier.
- Vehicle remains visible during off-road driving until recovery occurs.

---

## ⚠️ Road Departure Behaviour

When the vehicle leaves the drivable road surface:

- ⚠️ Dashboard displays an **Off Road** warning.
- 🚧 Vehicle speed is automatically limited using the off-road speed penalty.
- 🎥 Camera continues following the vehicle.
- 🚗 Vehicle remains controllable and can be steered back onto the road.
- 🔄 If the vehicle exceeds the configurable recovery threshold, the simulation automatically resets the vehicle to a safe state.

---

## 💡 Tips

- Hold **↑** before steering to see realistic turning behaviour.
- Use **Follow Camera** for longer driving sessions.
- Watch the **Mission Telemetry** panel to monitor:
  - Vehicle speed
  - Steering angle
  - Position
  - Heading
  - FPS
  - Road status
- Try intentionally driving off the road to observe the warning, speed penalty, and automatic recovery systems.

---

These controls form the complete interaction model for the **Phase 1 MVP**. Future phases will extend them with AI driving, sensors, collision detection, traffic, navigation, and autonomous driving capabilities while preserving the same core control scheme.

---

## 🎥 Demo

Below is a short demonstration of the completed **Phase 1 MVP**.

### Features Demonstrated

- 🚀 Launch application
- ▶️ Start simulation
- ⬆️ Accelerate vehicle
- ⬅️ Steer vehicle
- 📷 Toggle camera mode
- 🛣️ Leave the road
- ⚠️ Observe off-road warning
- ↩️ Return safely to the road
- 🔄 Trigger severe off-road recovery
- 🔁 Reset simulation

<p align="center">
  <img
    src="./docs/images/autodrive-phase1.gif"
    alt="AutoDrive ReactLab Phase 1 MVP Demo"
    width="1000"
  />
</p>

> If the GIF does not render on GitHub, you can download it directly:
>
> **[View Demo GIF](./docs/images/autodrive-phase1.gif)**

---

# Testing

## Unit Tests

Run all unit tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test
```

Run a specific test file:

```bash
npm test -- src/store/simulationStore.test.ts
```

---

## End-to-End Tests

Execute Playwright tests:

```bash
npm run test:e2e
```

Run only Chromium:

```bash
npx playwright test --project=chromium
```

Run with the Playwright UI:

```bash
npx playwright test --ui
```

Open the HTML report:

```bash
npx playwright show-report
```

---

## Build Verification

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## Quality Checklist

Before opening a Pull Request, verify that:

- All unit tests pass.
- All Playwright tests pass.
- The project builds successfully.
- ESLint reports no errors.
- TypeScript reports no type errors.
- The simulation starts correctly.
- Vehicle controls work.
- Camera modes work.
- Dashboard telemetry updates correctly.
- Road departure detection functions correctly.
- Off-road recovery functions correctly.

---

# Engineering Philosophy

AutoDrive ReactLab is intentionally structured as a teaching project.

The codebase prioritises:

- Clear architecture over premature optimisation.
- Pure functions over hidden side effects.
- Deterministic simulation behaviour.
- High unit-test coverage.
- Separation of rendering, simulation, and UI.
- Incremental feature development through well-defined work packages (WBS).

Each completed phase establishes a stable foundation for the next, allowing progressively more advanced autonomous driving capabilities to be added without introducing unnecessary technical debt.

## Next Phase

```txt
Phase 2: Sensors
```

Planned work:

```txt
Ray-casting sensors
Front / left / right sensor rays
Sensor distance calculation
Sensor overlay rendering
Road-edge detection
Sensor telemetry
```
