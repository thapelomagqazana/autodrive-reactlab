# Header Component

## Overview

The **Header** component provides the primary project identity and high-level context for **AutoDrive ReactLab**.

It is the first UI element presented to users and establishes the application's purpose before any simulation content is shown.

The component is intentionally lightweight and presentation-focused. It contains **no simulation logic**, **no state management**, and **no layout orchestration**, making it highly reusable, testable, and maintainable.

---

# Purpose

The Header exists to answer three questions immediately after the application loads:

1. **What is this application?**
2. **What does it do?**
3. **What stage of development or execution is it currently in?**

Providing these answers creates a professional engineering experience instead of presenting users with an unexplained collection of controls.

---

# Responsibilities

The Header is responsible for displaying:

* Project identity
* Product title
* Short simulator description
* Current development phase or application status
* Future product metadata (optional)

Examples of future metadata include:

* Version number
* Build number
* Git commit hash
* Environment badge
* Connected simulator status
* Demo mode indicator

---

# Non-Responsibilities

The Header **must never** own application behavior.

Specifically, it must not:

* start or stop simulations
* mutate Zustand state
* communicate with the simulation engine
* render the simulation canvas
* display telemetry
* contain routing logic
* perform API requests
* perform authentication
* manage application layout

Those responsibilities belong elsewhere in the architecture.

---

# Architectural Position

```
App
│
└── AppShell
    │
    ├── Header
    ├── SimulationCanvas
    ├── ControlsPanel
    └── DashboardPanel
```

The Header is a child of **AppShell**.

AppShell determines **where** the Header appears.

Header determines **what** is displayed inside that region.

---

# Public API

```tsx
interface HeaderProps {
    title?: string;
    subtitle?: string;
    eyebrow?: string;
    phaseLabel?: string;
}
```

All properties are optional.

Reasonable defaults are supplied so that most consumers can simply render:

```tsx
<Header />
```

---

# Default Content

| Property | Default                                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------ |
| Title    | AutoDrive ReactLab                                                                                                       |
| Eyebrow  | Autonomous Simulation Lab                                                                                                |
| Subtitle | Retro arcade autonomous driving simulator with state, telemetry, controls, and future canvas-based vehicle intelligence. |
| Phase    | Phase 0 · Foundation                                                                                                     |

---

# Design Principles

The Header follows several UI principles.

## 1. Strong Visual Hierarchy

Users should naturally read:

Eyebrow

↓

Title

↓

Description

↓

Phase Badge

---

## 2. Single Responsibility

The Header communicates identity only.

It should never become a "God Component."

---

## 3. Responsive by Default

Desktop

```
Title                     Badge
Subtitle
```

Tablet

```
Title

Subtitle

Badge
```

Mobile

```
Title
Subtitle
Badge
```

No horizontal scrolling should occur.

---

## 4. Accessibility

The component should expose:

* one `<h1>`
* descriptive text
* sufficient color contrast
* keyboard-focusable interactive elements (if links/buttons are added later)

---

# Styling

The project uses the Arcade design system.

Primary utility classes include:

```
arcade-panel
arcade-title
arcade-accent
arcade-badge
```

The Header should not define inline colors.

All branding should be driven through reusable design tokens.

---

# Future Enhancements

The Header has been intentionally designed for future growth.

Potential additions include:

* GitHub repository link
* Documentation link
* Live deployment link
* Build status
* Version badge
* Active scenario name
* FPS indicator
* Connected AI model
* Recording indicator
* Replay mode indicator
* Theme selector
* User profile
* Notifications

These additions should not require architectural changes.

---

# Testing Strategy

## Positive Tests

Verify:

* Header renders.
* Title is visible.
* Subtitle is visible.
* Phase badge is visible.
* Custom props override defaults.

---

## Negative Tests

Verify:

* No Zustand store imports.
* No simulation engine imports.
* Rendering succeeds with only default props.

---

## Edge Cases

Verify:

* Extremely long title wraps correctly.
* Extremely long subtitle wraps correctly.
* Missing optional props fall back to defaults.
* Small viewport remains readable.

---

## Regression Tests

Verify:

* `npm run lint`
* `npm test`
* `npm run test:e2e`
* `npm run build`

all complete successfully.

---

# Performance Considerations

The Header is intentionally inexpensive to render.

It:

* contains no effects
* contains no timers
* performs no subscriptions
* performs no asynchronous work
* allocates minimal objects

This allows React to memoize or optimize rendering in future if necessary.

---

# Maintainability Guidelines

When modifying this component:

✅ Keep it presentation-only.

✅ Prefer props over global state.

✅ Reuse design tokens.

✅ Preserve semantic HTML.

✅ Keep responsive behavior declarative.

Avoid:

* business logic
* simulation state
* engine imports
* networking
* canvas code

---

# Engineering Principles

The Header follows these architectural principles:

* Single Responsibility Principle (SRP)
* Separation of Concerns
* Composition over Inheritance
* Declarative UI
* Accessibility by Default
* Responsive by Default
* Reusable Component Design
* Stable Public Interface

---

# Future Integration

During later phases, the Header may consume readonly metadata from a dedicated configuration or build-information source, for example:

* application version
* release channel
* Git commit SHA
* deployment environment
* feature flags

The Header should remain a passive presentation component, receiving such information via props rather than fetching or managing it directly.

---

# Related Components

* App
* AppShell
* SimulationCanvas
* ControlsPanel
* DashboardPanel

---

# Related Documentation

* `docs/app-shell.md`
* `docs/design-system.md`
* `docs/component-architecture.md`
* `docs/testing.md`

---

# Revision History

| Version | Description                                                                     |
| ------- | ------------------------------------------------------------------------------- |
| 0.1     | Initial production-ready Header component documentation for Phase 0 Foundation. |
