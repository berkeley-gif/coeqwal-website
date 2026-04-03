# Scenario Explorer

The Scenario Explorer is the main interface for exploring water allocation scenarios in the COEQWAL application. It provides multiple tools for viewing, comparing, and analyzing scenario data.

## Overview

- **Purpose**: Water allocation scenario exploration interface
- **Framework**: Next.js 15 (App Router) with React 19
- **State Management**: Zustand with Immer (`@repo/state`)
- **Styling**: MUI v7 (`@repo/ui/mui`) — no Tailwind
- **Location**: `apps/main/app/features/scenarioExplorer/`

## Architecture

### Main App Navigation

The top-level tab bar has two entries controlled by `mainView` state:

| View          | Label       | Description                                 |
| ------------- | ----------- | ------------------------------------------- |
| `get-started` | Get started | Onboarding / intro view                     |
| `explorer`    | Go to tools | All exploration tools via UnifiedToolLayout |

### Tool Modes

When `mainView === "explorer"`, five tool tabs are shown in the toolbar (controlled by `exploreMode` state):

| Mode         | Icon              | Label         | Description                                                                 |
| ------------ | ----------------- | ------------- | --------------------------------------------------------------------------- |
| `list`       | ViewListIcon      | List          | Default grid view of all scenarios (StrategyGrid)                           |
| `comparison` | CompareArrowsIcon | Tradeoffs     | Parallel coordinates / radar / parity / deviation / heatmap / sankey charts |
| `equity`     | AppsIcon          | Equity        | Equity analysis tool (placeholder)                                          |
| `resilience` | AutorenewIcon     | Resilience    | Resilience analysis tool (placeholder)                                      |
| `data`       | InsightsIcon      | Data in depth | Detailed data explorer with per-category sections                           |

### Layout: UnifiedToolLayout

All tools are rendered inside `UnifiedToolLayout`, which provides a persistent three-panel chrome:

```
[Sidebar (320–480px)] [Toolbar + Tool content (flex 1)] [Map panel (optional, 25%)]
```

- **Sidebar**: `ScenarioSelectionSidebar` — scenario checkboxes, search, theme filter, pinning. Hidden (width 0) in list mode; 320px normally; 480px when key operations column is expanded.
- **Toolbar**: `ToolToolbar` — distribution toggle, show-map toggle, hydroclimate chooser, tool tab buttons.
- **Tool content**: The active tool component (ListView, ComparisonPanel, EquityPanel, etc.).
- **Map panel**: Optional transparent reveal area (25% width) that lets the persistent app-level map show through. Toggled by the "Show map" switch in the toolbar.

## Folder Structure

```
apps/main/app/features/scenarioExplorer/
├── ScenarioExplorer.tsx              # Main orchestrator — tab bar + UnifiedToolLayout
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
│   ├── ComparisonPanel.tsx           # Tradeoffs — multiple chart types
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
│   └── useComparisonData.ts          # Data transformation for comparison charts
│
├── config/
│   └── outcomeDefinitions.tsx        # Outcome/metric definitions and colors
│
└── data/
    └── mockHydroclimateTiers.json    # Mock data for development
```

## Key Components

### ScenarioExplorer.tsx (Main Orchestrator)

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

The most complex tool panel. Supports six chart modes:

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

Currently placeholder panels. Ready for implementation — the layout chrome (sidebar, toolbar, map) is already provided by `UnifiedToolLayout`.

### ListView.tsx

Renders scenarios using the `StrategyGrid` system. Supports search filtering, outcome sorting, and hover coordination with the comparison panel.

## State Management

### Store (`store.ts`)

The Zustand store (with Immer) manages state shared across components.

#### Navigation

| Property      | Type          | Default         | Description            |
| ------------- | ------------- | --------------- | ---------------------- |
| `mainView`    | `MainView`    | `"get-started"` | Current top-level view |
| `exploreMode` | `ExploreMode` | `"list"`        | Active tool tab        |

#### Scenario Selection

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

#### Display Options

| Property                   | Type                        | Default          | Description                                 |
| -------------------------- | --------------------------- | ---------------- | ------------------------------------------- |
| `showAlternativeBaselines` | `boolean`                   | `false`          | Show alternative baseline scenarios         |
| `showDefinitions`          | `boolean`                   | `false`          | Show outcome definitions                    |
| `showKeyOperations`        | `boolean`                   | `false`          | Show key operations column (widens sidebar) |
| `outcomeDisplayMode`       | `"summary"\|"distribution"` | `"distribution"` | How outcomes are rendered                   |
| `showMap`                  | `boolean`                   | `false`          | Show map panel                              |

#### Comparison Panel

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

### When to Use Zustand vs Local State

**Use Zustand for:**

- State shared across multiple components (e.g., `selectedScenarios`, `hydroclimatePeriod`)
- Navigation state (e.g., `mainView`, `exploreMode`)
- State that must persist across view changes

**Use local React state for:**

- UI-specific toggles (e.g., chart mode, modal open/close)
- Hover states and ephemeral interactions
- Component-specific sorting and filtering

## Data Flow

### Hydroclimate Resolution

There is no separate hydroclimate API endpoint. The flow is:

1. User picks a hydroclimate in `HydroclimateChooser` → store's `hydroclimatePeriod` (e.g., `"historical"`)
2. `HYDROCLIMATE_ID_MAP` in `content/scenarios.ts` maps the string to a numeric ID (`"historical" → 2`)
3. `GET /api/scenarios` returns all 72+ scenarios, each with `hydroclimate_id` and `sibling_group`
4. `useScenarioList().buildIdMapping(hydroclimatePeriod)` resolves sibling group IDs → actual scenario codes for the active hydroclimate
5. `useMultipleScenarioTiers(idMapping)` fetches tier data for the resolved codes and re-keys results back to sibling group IDs

### Data Hooks

```typescript
// Scenario list with sibling group mapping
import { useScenarioList } from "../../scenarios/hooks"
const { siblingGroups, buildIdMapping, getDisplayName } = useScenarioList()

// Comparison chart data (handles hydroclimate resolution internally)
import { useComparisonData } from "../hooks/useComparisonData"
const { data, axes, lineColors, baselineScenario, isLoading } =
  useComparisonData()

// Raw tier data for multiple scenarios
import { useMultipleScenarioTiers } from "../../scenarios/hooks"
const { allChartData, allScoreData, allScenariosData, isLoading } =
  useMultipleScenarioTiers(idMapping)
```

## How to Add a New Tool

### Step 1: Create Your Tool Component

Create `exploreView/YourToolPanel.tsx`:

```typescript
"use client"

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"

export default function YourToolPanel() {
  const theme = useTheme()
  const { selectedScenarios, hydroclimatePeriod } = useScenarioExplorerStore()

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Your tool implementation */}
    </Box>
  )
}
```

### Step 2: Export from Barrel

In `exploreView/index.ts`:

```typescript
export { default as YourToolPanel } from "./YourToolPanel"
```

### Step 3: Add Rendering in ScenarioExplorer.tsx

Inside the `UnifiedToolLayout` children:

```typescript
{exploreMode === "yourTool" && <YourToolPanel />}
```

### Step 4: Add the Mode Type (if creating a new tab)

If you need a new toolbar tab (rather than replacing an existing placeholder):

1. Add to `ExploreMode` in `store.ts`: `| "yourTool"`
2. Add to `TOOL_TABS` in `ToolToolbar.tsx`

If you're implementing one of the existing placeholders (equity or resilience), the mode and toolbar tab already exist — just replace the placeholder component contents.

## Quick Checklist: Integrating a New Visualization

For developers porting an external visualization (e.g., the tier treemap from COEQWALTierVisualization) into the Equity panel:

- [ ] **Replace the placeholder** in `EquityPanel.tsx` with your React component
- [ ] **Read shared state** from `useScenarioExplorerStore()`: `selectedScenarios`, `hydroclimatePeriod`, `highlightedScenario`, `pinnedScenarioIds` (see `packages/state/README.md` for the full property reference)
- [ ] **Fetch data via hooks** — use `useScenarioList().buildIdMapping(hydroclimatePeriod)` then `useMultipleScenarioTiers(idMapping)`. Do not call `fetch()` or raw fetchers directly. (See `packages/data/README.md` "How to Get Data" section for the full walkthrough.)
- [ ] **Write back to store** when the user interacts: `setHighlightedScenario()` on hover, `togglePinnedScenario()` on click, `setSelectedTier()` to drive map visualization
- [ ] **Use MUI `sx` prop** for all styling — no Tailwind. Import from `@repo/ui/mui`.
- [ ] **D3 rendering** goes in `useEffect` + `useRef<SVGSVGElement>` — standard React + D3 pattern. The existing `@repo/viz` components do this; use them as reference.
- [ ] **Port `UnitVisPositionCalculation.ts` as-is** — it's pure D3 math with no framework dependencies. Place it alongside your panel or in a `utils/` subdirectory.
- [ ] **Do not create a separate map** — the persistent Mapbox map is shared. Call `mapActions.setOutcomeVisualization(outcomeCode, scenarioId)` to show polygons. All polygon geometry is pre-loaded in Mapbox vector tilesets; no deck.gl needed. (See `packages/state/README.md` "Persistent Map Integration" section.)
- [ ] **Keep visualization-specific state local** — view mode, color mode, internal search, etc. as `useState`. Only cross-cutting state goes in the store.
- [ ] **Export is already wired** — `EquityPanel` is already exported from `exploreView/index.ts` and rendered in `ScenarioExplorer.tsx` when `exploreMode === "equity"`.

## Dependencies

| Package        | Purpose                                                              |
| -------------- | -------------------------------------------------------------------- |
| `@repo/ui`     | UI components (CompactSearchBar, InfoTooltip, MobileModal, etc.)     |
| `@repo/ui/mui` | MUI components (Box, Typography, useTheme, icons, etc.)              |
| `@repo/viz`    | D3-based chart components (RadarPlot, ParityPlot, TierHeatmap, etc.) |
| `@repo/map`    | Mapbox / react-map-gl map components and store                       |
| `@repo/data`   | SWR-based data fetching hooks and API types                          |
| `@repo/state`  | Zustand + Immer re-exports                                           |
| `@repo/i18n`   | Internationalization                                                 |
