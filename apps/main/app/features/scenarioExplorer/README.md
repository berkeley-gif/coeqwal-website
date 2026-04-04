# Scenario Explorer

The Scenario Explorer is the main interface for exploring water allocation scenarios in the COEQWAL application. It provides multiple tools for viewing, comparing, and analyzing scenario data.

## Overview

- **Purpose**: Water allocation scenario exploration interface
- **Framework**: Next.js 15 (App Router) with React 19
- **State Management**: Zustand with Immer (`@repo/state`)
- **Styling**: MUI v7 (`@repo/ui/mui`)
- **Location**: `apps/main/app/features/scenarioExplorer/`

## Architecture

### Main app navigation

The top-level tab bar has two entries controlled by `mainView` state:

| View          | Label       | Description                                 |
| ------------- | ----------- | ------------------------------------------- |
| `get-started` | Get started | Onboarding / intro view                     |
| `explorer`    | Go to tools | All exploration tools via UnifiedToolLayout |

### Tool modes

When `mainView === "explorer"`, five tool tabs are currently shown in the toolbar (controlled by `exploreMode` state):

| Mode         | Label         | Description                                       |
| ------------ | ------------- | ------------------------------------------------- |
| `list`       | List          | Default grid view of all scenarios (StrategyGrid) |
| `comparison` | Tradeoffs     | Radar plot                                        |
| `equity`     | Equity        | Equity analysis tool (placeholder)                |
| `resilience` | Resilience    | Resilience analysis tool (placeholder)            |
| `data`       | Data in depth | Detailed data explorer with per-category sections |

### Layout: UnifiedToolLayout

All tools are rendered inside `UnifiedToolLayout`, which provides a persistent three-panel chrome:

```
[Sidebar (320-480px)] [Toolbar + Tool content (flex 1)] [Map panel (optional, 25%)]
```

- **Sidebar**: `ScenarioSelectionSidebar`.scenario checkboxes, search, theme filter, pinning
- **Toolbar**: `ToolToolbar`.distribution toggle, show-map toggle, hydroclimate chooser, tool tab buttons.
- **Tool content**: The active tool component (ListView, ComparisonPanel, EquityPanel, etc.).
- **Map panel**: Optional transparent reveal area (25% width) that lets the persistent app-level map show through. Toggled by the "Show map" switch in the toolbar.

## Folder structure

```
apps/main/app/features/scenarioExplorer/
├── ScenarioExplorer.tsx              # Main orchestrator.tab bar + UnifiedToolLayout
├── store.ts                          # Zustand state management
├── types.ts                          # Shared TypeScript types
├── README.md                         # This file
│
├── getStarted/                       # "Get started" onboarding view
│   ├── GetStartedView.tsx            # Main get-started component
│   ├── TierAnimationSection.tsx      # Animated tier intro
│   ├── useTierAnimationData.ts       # Data hook for tier animation
│   └── PolygonMorphOverlay.tsx       # Decorative polygon morph
│
├── exploreView/                      # Tool panels (list/comparison/equity/resilience)
│   ├── index.ts                      # Barrel exports
│   ├── ListView.tsx                  # Scenario grid (StrategyGrid wrapper)
│   ├── ComparisonPanel.tsx           # Tradeoffs.multiple chart types
│   ├── EquityPanel.tsx               # Equity tool (placeholder)
│   └── ResiliencePanel.tsx           # Resilience tool (placeholder)
│
├── dataExplorer/                     # "Data in depth" view
│   ├── DataExplorerView.tsx          # Main data explorer component
│   ├── README.md                     # Data explorer documentation
│   ├── hooks/
│   │   └── useMetricData.ts          # Data transformation for metrics
│   ├── utils/
│   │   └── exportUtils.ts            # CSV/image export utilities
│   └── components/
│       ├── CategoryView.tsx          # Category-based data view
│       ├── ChartGridContext.tsx       # Aligned chart grid provider
│       ├── AlignedScenarioGrid.tsx   # Scenario-aligned grid layout
│       ├── ReservoirView.tsx         # Reservoir-specific view
│       ├── ReservoirPercentilesSection.tsx
│       ├── SpillFrequencySection.tsx
│       ├── CwsSection.tsx            # Community water system section
│       ├── AgSection.tsx             # Agricultural delivery section
│       ├── RefugeSection.tsx         # Wildlife refuge section
│       ├── EnvFlowSection.tsx        # Environmental flow section
│       ├── DeltaSection.tsx          # Delta statistics section
│       ├── TableView.tsx             # Tabular data view
│       ├── MapView.tsx               # Standalone map visualization
│       ├── TemporalControls.tsx      # Time-period controls
│       └── PercentileMatrixSkeleton.tsx  # Loading skeleton
│
├── components/                       # Shared UI components
│   ├── UnifiedToolLayout.tsx         # Three-panel layout chrome
│   ├── ToolToolbar.tsx               # Shared toolbar (toggles + hydroclimate + tool tabs)
│   ├── ScenarioSelectionSidebar.tsx  # Sidebar with checkboxes, search, theme filter
│   ├── SearchBar.tsx                 # Search input connected to store
│   ├── ThemeFilter.tsx               # Theme badge filter
│   ├── SelectionBanner.tsx           # Shows selected scenario count
│   ├── ComparisonHeader.tsx          # Header/legend for comparison view
│   ├── ShareDrawer.tsx               # Share staging drawer
│   ├── ShareScenarioCard.tsx         # Card for shared scenario
│   ├── KeyboardShortcuts.tsx         # Global keyboard handler
│   ├── TogglePair.tsx                # Toggle button component
│   └── useScrollSync.ts             # Scroll synchronization hook
│
├── strategyGrid/                     # Reusable grid layout system
│   ├── index.ts                      # Barrel exports
│   ├── types.ts                      # Grid types
│   ├── StrategyGrid.tsx              # Main grid component
│   ├── StrategyGridRow.tsx           # Individual row component
│   ├── StrategyGridHeader.tsx        # Grid header with sorting
│   ├── StrategyGridContent.tsx       # Grid content wrapper
│   └── GridControls.tsx              # Grid control buttons
│
├── hooks/
│   ├── useComparisonData.ts          # Data transformation for comparison charts
│   ├── usePrefetchTiers.ts           # Prefetches tier data for all hydroclimates on tab load
│   └── useResolvedScenarioTiers.ts   # Resolves hydroclimate + fetches tier data (main data hook)
│
├── config/
│   └── outcomeDefinitions.tsx        # Outcome/metric definitions and colors
│
└── data/
    └── mockHydroclimateTiers.json    # Mock data for development
```

## Key components

### ScenarioExplorer.tsx (main orchestrator)

Renders the top-level tab bar and, when `mainView === "explorer"`, wraps everything in `UnifiedToolLayout`. Manages hover coordination between sidebar and tool panels.

**State from Store:** `mainView`, `exploreMode`, `showMap`

**Routing logic:**

```typescript
{exploreMode === "list" && <ListView />}
{exploreMode === "comparison" && <ComparisonPanel />}
{exploreMode === "equity" && <EquityPanel />}
{exploreMode === "resilience" && <ResiliencePanel />}
{exploreMode === "data" && <DataExplorerView />}
```

### UnifiedToolLayout.tsx

Persistent three-panel chrome. Receives `sidebar`, `toolbar`, and `children` as props.

- Sidebar width: 0 in list mode, 320px normally, 480px with key operations
- Map panel: transparent 25% reveal area when `showMap` is true
- Manages map mode via `mapActions` from the map store

### ComparisonPanel.tsx

The most complex tool panel. Supports six experimental chart modes (to be reduced to radar chart):

| Chart    | Component                      |
| -------- | ------------------------------ |
| Radar    | `RadarPlot`                    |
| Parallel | `VerticalParallelLinePlotPeak` |
| Parity   | `ParityPlot`                   |
| Column   | `DeviationPlot`                |
| Heatmap  | `TierHeatmap`                  |
| Sankey   | `TierSankey`                   |

All chart components are from `@repo/viz`. Each chart mode has its own set of toggle controls (checkboxes). Data comes from `useComparisonData()`.

### EquityPanel.tsx / ResiliencePanel.tsx

Currently placeholder panels. Ready for implementation.the layout chrome (sidebar, toolbar, map) is already provided by `UnifiedToolLayout`.

### ListView.tsx

Renders scenarios using the `StrategyGrid` system. Supports search filtering, outcome sorting, and hover coordination with the comparison panel.

## State management

### Store (`store.ts`)

The Zustand store (with Immer) manages state shared across components.

#### Navigation

| Property      | Type          | Default         | Description            |
| ------------- | ------------- | --------------- | ---------------------- |
| `mainView`    | `MainView`    | `"get-started"` | Current top-level view |
| `exploreMode` | `ExploreMode` | `"list"`        | Active tool tab        |

#### Scenario selection

| Property              | Type           | Default | Description                             |
| --------------------- | -------------- | ------- | --------------------------------------- |
| `selectedScenarios`   | `string[]`     | `[]`    | IDs of selected (checked) scenarios     |
| `highlightedScenario` | `string\|null` | `null`  | Currently hovered/highlighted scenario  |
| `pinnedScenarioIds`   | `string[]`     | `[]`    | Pinned scenarios (persist across views) |

#### Filtering

| Property          | Type                  | Default | Description                    |
| ----------------- | --------------------- | ------- | ------------------------------ |
| `searchQuery`     | `string`              | `""`    | Text filter for scenario names |
| `showOnlyChosen`  | `boolean`             | `false` | Show only selected scenarios   |
| `selectedTheme`   | `ScenarioTheme\|null` | `null`  | Active theme filter            |
| `showOnlyTheme`   | `boolean`             | `false` | Strict theme filtering         |
| `showThemeBadges` | `boolean`             | `false` | Show theme badges on rows      |
| `selectedIconId`  | `string\|null`        | `null`  | Active icon filter             |

#### Display options

| Property                   | Type                        | Default          | Description                                 |
| -------------------------- | --------------------------- | ---------------- | ------------------------------------------- |
| `showAlternativeBaselines` | `boolean`                   | `false`          | Show alternative baseline scenarios         |
| `showDefinitions`          | `boolean`                   | `false`          | Show outcome definitions                    |
| `showKeyOperations`        | `boolean`                   | `false`          | Show key operations column (widens sidebar) |
| `outcomeDisplayMode`       | `"summary"\|"distribution"` | `"distribution"` | How outcomes are rendered                   |
| `showMap`                  | `boolean`                   | `false`          | Show map panel                              |

#### Comparison panel

| Property             | Type      | Default | Description                      |
| -------------------- | --------- | ------- | -------------------------------- |
| `relativeToBaseline` | `boolean` | `true`  | Show values relative to baseline |
| `highlightBaseline`  | `boolean` | `false` | Highlight baseline scenario      |
| `overlayTiers`       | `boolean` | `false` | Overlay tier zones on chart      |
| `defineOutcome`      | `boolean` | `false` | Define-an-outcome mode           |

#### Hydroclimate

| Property             | Type     | Default        | Description                                                                              |
| -------------------- | -------- | -------------- | ---------------------------------------------------------------------------------------- |
| `hydroclimatePeriod` | `string` | `"historical"` | Active hydroclimate period (e.g., `"historical"`, `"warmer-wetter"`, `"warmer-drier-i"`) |

#### Other

| Property            | Type                        | Default | Description                    |
| ------------------- | --------------------------- | ------- | ------------------------------ |
| `isSortActive`      | `boolean`                   | `false` | Whether outcome sort is active |
| `selectedTier`      | `{strategy, outcome}\|null` | `null`  | Selected tier for map viz      |
| `sharedScenarioIds` | `string[]`                  | `[]`    | Scenarios staged for sharing   |
| `showShareDrawer`   | `boolean`                   | `false` | Share drawer open state        |

### When to use Zustand vs local state

**Use Zustand for:**

- State shared across multiple components (e.g., `selectedScenarios`, `hydroclimatePeriod`)
- Navigation state (e.g., `mainView`, `exploreMode`)
- State that must persist across view changes

**Use local React state for:**

- UI-specific toggles (e.g., chart mode, modal open/close)
- Hover states and ephemeral interactions
- Component-specific sorting and filtering

## Data flow

### Hydroclimate resolution

There is no separate hydroclimate API endpoint. The flow is:

1. User picks a hydroclimate in `HydroclimateChooser` -> store's `hydroclimatePeriod` (e.g., `"historical"`)
2. `HYDROCLIMATE_ID_MAP` in `content/scenarios.ts` maps the string to a numeric ID (e.g., `"historical"` -> `2`)
3. `GET /api/scenarios` returns all 72+ scenarios, each with `hydroclimate_id` and `sibling_group`
4. `buildIdMapping(hydroclimatePeriod)` resolves sibling group IDs -> actual scenario codes for the active hydroclimate
5. `useMultipleScenarioTiers(idMapping)` batch-fetches tier data for the resolved codes and re-keys results back to sibling group IDs

You do not need to do this manually. `useResolvedScenarioTiers()` wraps steps 1-5 into a single hook call. See `packages/data/README.md` for details.

### Data hooks

```typescript
// Primary hook - tier data with automatic hydroclimate resolution
import { useResolvedScenarioTiers } from "../hooks/useResolvedScenarioTiers"
const {
  allScenariosData, // Record<scenarioId, ScenarioTiersResponse> - all 24 scenarios
  allChartData, // Pre-processed chart data, keyed by scenario then outcome code
  allScoreData, // Scores per outcome: weighted_score, normalized_score, gini, etc.
  outcomeNames, // Display-ordered list of { shortCode, displayName }
  siblingGroups, // Scenario group metadata
  getDisplayName, // (id) -> human-readable scenario name
  getThemeForScenario, // (id) -> theme key for color assignment
  isLoading, // True only on initial load
  isValidating, // True during background revalidation
  error,
} = useResolvedScenarioTiers()

// Comparison chart data (extends useResolvedScenarioTiers with cross-HC ranges, parallel plot transforms)
import { useComparisonData } from "../hooks/useComparisonData"
const { data, axes, lineColors, baselineScenario, isLoading } =
  useComparisonData()

// Lower-level: scenario list with manual hydroclimate mapping (for advanced use cases)
import { useScenarioList } from "../../scenarios/hooks"
const { siblingGroups, buildIdMapping, getDisplayName } = useScenarioList()
```

## How to add a new tool

### Step 1: Create your tool component

Create `exploreView/YourToolPanel.tsx`:

```typescript
"use client"

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"
import { useResolvedScenarioTiers } from "../hooks/useResolvedScenarioTiers"

export default function YourToolPanel() {
  const theme = useTheme()
  const { selectedScenarios } = useScenarioExplorerStore()
  const { allChartData, allScoreData, siblingGroups, isLoading, error } =
    useResolvedScenarioTiers()

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Your tool implementation */}
    </Box>
  )
}
```

### Step 2: Export from barrel

In `exploreView/index.ts`:

```typescript
export { default as YourToolPanel } from "./YourToolPanel"
```

### Step 3: Add rendering in ScenarioExplorer.tsx

Inside the `UnifiedToolLayout` children:

```typescript
{exploreMode === "yourTool" && <YourToolPanel />}
```

### Step 4: Add the mode type (if creating a new tab)

If you need a new toolbar tab (rather than replacing an existing placeholder):

1. Add to `ExploreMode` in `store.ts`: `| "yourTool"`
2. Add to `TOOL_TABS` in `ToolToolbar.tsx`

If you're implementing one of the existing placeholders (equity or resilience), the mode and toolbar tab already exist. Just replace the placeholder component contents.

## Quick checklist: integrating a new visualization

For developers porting an external visualization:

- [ ] **Replace the placeholder content** in `EquityPanel.tsx` with your React component
- [ ] **Read shared state** from `useScenarioExplorerStore()`: `selectedScenarios`, `hydroclimatePeriod`, `highlightedScenario`, `pinnedScenarioIds` (see `packages/state/README.md` for the full property reference)
- [ ] **Fetch data via hooks**.use `useResolvedScenarioTiers()` (handles hydroclimate resolution automatically). Do not call `fetch()` or raw fetchers directly. (See `packages/data/README.md` "How to Get Data" section for the full walkthrough.)
- [ ] **Write back to store** when the user interacts: `setHighlightedScenario()` on hover, `togglePinnedScenario()` on click. For map visualization, use `mapActions.setOutcomeVisualization()` (see "Map integration" below).
- [ ] **Use MUI `sx` prop** for all styling. Please remember to remove any imports from other css. Import from `@repo/ui/mui`.
- [ ] **D3 rendering** goes in `useEffect` + `useRef<SVGSVGElement>`.standard React + D3 pattern. The existing `@repo/viz` components do this; use them as reference.
- [ ] **Port pure d3 visualizations as-is**. You can place them directly in your component, or if there is a case for reuse, in the `@repo/viz`package.
- [ ] **Please use the site persistent Mapbox map** See "Map integration" below. We can add an option to change the basemap.
- [ ] **Render custom dot markers** on the shared map using `setMotionChildren` from `useMap()`. Do not modify the existing marker components (`TierMarkers.tsx`, `TierLocationLabels.tsx`). See "Custom dot markers" under "Map integration" below.
- [ ] **Keep visualization-specific state local** i.e. view mode, color mode, internal search, etc. as `useState`. Only cross-cutting state goes in the store.
- [ ] **Export is already wired**.`EquityPanel` is already exported from `exploreView/index.ts` and rendered in `ScenarioExplorer.tsx` when `exploreMode === "equity"`.

## Map integration

The app has a single persistent Mapbox map that lives behind the UI. When the user toggles "Show map" in the toolbar, a transparent 25% reveal area opens on the right side of the layout. The tools don't create or manage the map. Instead, they communicate with the map through the **map store** (`apps/main/app/features/map/store.ts`).

The pattern: user clicks an element in the visualization -> write to the map store -> the `VisualizationLayers` component (which is always mounted on the map) reads that state and renders the appropriate polygons, markers, or line layers.

### How to show a tier outcome on the map

```typescript
import { mapActions, useActiveOutcomeVisualization } from "../../map/store"

// Which outcome is currently shown on the map? (null if none)
const activeVisualization = useActiveOutcomeVisualization()
const activeOutcome = activeVisualization?.outcomeCode ?? null
// e.g. "CWS_DEL" if the user clicked that outcome, or null if nothing is active

// On click, toggle the outcome on/off
const handleOutcomeClick = (outcomeCode: string, scenarioId: string) => {
  if (activeOutcome === outcomeCode) {
    mapActions.clearOutcomeVisualization()
  } else {
    mapActions.setOutcomeVisualization(outcomeCode, scenarioId)
  }
}

// Use activeOutcome to highlight the corresponding element in your UI
const isActive = (code: string) => code === activeOutcome
// e.g. <Box sx={{ border: isActive("CWS_DEL") ? "2px solid blue" : "none" }}>
```

That's it. The `VisualizationLayers` component handles the rest:

- Looks up which Mapbox tileset has the geometry for that outcome (see the outcome-to-tileset table in `packages/data/README.md`)
- Colors the polygons/markers by tier level
- Shows tooltips on hover/click

### Custom dot markers

The existing map markers (diamonds in `TierMarkers.tsx`, labels in `TierLocationLabels.tsx`) are used by other parts of the app. If your visualization needs its own marker style (e.g., large colored dots), use `setMotionChildren` from `useMap()` to inject your own `<Marker>` components onto the shared map without touching the existing marker components.

```typescript
import { useMap } from "@repo/map/client"
import { Marker } from "@repo/map"
import { useEffect } from "react"

// Inside your component:
const { setMotionChildren } = useMap()

// locations: array of { location_id, lng, lat, tierLevel } you want to show
useEffect(() => {
  if (!locations.length) {
    setMotionChildren?.(null)
    return
  }

  setMotionChildren?.(
    <>
      {locations.map((loc) => (
        <Marker
          key={loc.location_id}
          longitude={loc.lng}
          latitude={loc.lat}
          anchor="center"
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              backgroundColor: tierColor(loc.tierLevel),
              border: "none",
            }}
          />
        </Marker>
      ))}
    </>
  )

  return () => setMotionChildren?.(null) // clean up on unmount
}, [locations, setMotionChildren])
```

`setMotionChildren` renders React elements directly inside the `<Map>` component (wrapped in `<AnimatePresence>` for enter/exit animations). You can pass any JSX, like `<Marker>` positions elements at geographic coordinates.

Clean up by calling `setMotionChildren(null)` when your component unmounts or when the markers should be removed.

### What your component should do

1. **Set the visualization**: call `mapActions.setOutcomeVisualization(outcomeCode, scenarioId)` when the user clicks an element
2. **Clear it**: call `mapActions.clearOutcomeVisualization()` when the user clicks the same element again (toggle off) or navigates away
3. **Highlight the active element**: read `useActiveOutcomeVisualization()` and visually indicate which outcome is currently shown on the map (e.g., an element border or highlight color)
4. **Render custom markers**: use `setMotionChildren` from `useMap()` to show your own dot markers on the map (see above)

### What you do not need to do

- Create map layers, sources, or polygons
- Fetch GeoJSON geometry
- Handle the "Show map" toggle (the toolbar and `UnifiedToolLayout` manage that)

### Reference implementation

`KeyOutcomesPanel.tsx` (`apps/main/app/features/map/overlays/scenarioPanels/`) shows how to toggle outcome visualization on the map via `mapActions.setOutcomeVisualization()`. For the `setMotionChildren` API, see `packages/map/src/context/MapContext.tsx` and `packages/map/src/Map.tsx` where the injected children are rendered inside `<AnimatePresence>`.
