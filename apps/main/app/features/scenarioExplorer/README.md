# Scenario Explorer (Explore Section)

The Scenario Explorer is the main interface for exploring water allocation scenarios in the COEQWAL application. It provides multiple tools for viewing, comparing, and analyzing scenario data.

## Overview

- **Purpose**: Water allocation scenario exploration interface
- **Framework**: Next.js 14+ (App Router) with React 19
- **State Management**: Zustand with Immer
- **Location**: `apps/main/app/features/scenarioExplorer/`

## Architecture

The Explore section uses a two-level navigation structure:

### Main App Navigation

The app has three main tabs defined in `app/types/tabs.ts`:

- Learn
- **Explore** (this section)
- Share

### Explore Sub-Navigation

Within the Explore tab, there are two main views controlled by `mainView` state:

1. **"Choose scenarios"** (`mainView: "explorer"`) - Contains the exploration tools
2. **"Explore data in depth"** (`mainView: "data"`) - Detailed data analysis

### Tool Modes

Within "Choose scenarios", four tool modes are available (controlled by `exploreMode` state):

| Mode         | Icon           | Description                            |
| ------------ | -------------- | -------------------------------------- |
| `list`       | List icon      | Default grid view of all scenarios     |
| `map`        | Map icon       | Spatial visualization with map overlay |
| `comparison` | Compare arrows | Parallel coordinates chart comparison  |
| `equity`     | Apps icon      | Equity tool (panel left, map right)    |

## Folder Structure

```
apps/main/app/features/scenarioExplorer/
├── ScenarioExplorer.tsx          # Main orchestrator component
├── store.ts                       # Zustand state management
├── README.md                      # This file
│
├── exploreView/                   # Explore tools (list/map/comparison/equity)
│   ├── index.ts                  # Barrel exports
│   ├── ListPanel.tsx             # Container for scenario list (handles list/map modes)
│   ├── ListView.tsx              # The actual scenario grid component
│   ├── ComparisonPanel.tsx       # Comparison chart panel
│   └── EquityPanel.tsx           # Equity tool panel
│
├── dataExplorer/                  # "Explore data in depth" view
│   ├── DataExplorerView.tsx      # Main data explorer component
│   └── components/
│       ├── MapView.tsx           # Standalone map visualization
│       ├── TableView.tsx         # Table data view
│       ├── CategoryView.tsx      # Category-based view
│       ├── ReservoirView.tsx     # Reservoir-specific view
│       └── TemporalControls.tsx  # Time-based controls
│
├── components/                    # Shared UI components
│   ├── SearchBar.tsx             # Search input with toolbar slots
│   ├── SelectionBanner.tsx       # Shows selected scenario count
│   ├── ViewModeControls.tsx      # Toggle switches for view options
│   ├── KeyboardShortcuts.tsx     # Global keyboard handler
│   ├── ComparisonHeader.tsx      # Header for comparison view
│   └── TogglePair.tsx            # Toggle button component
│
├── strategyGrid/                  # Reusable grid layout system
│   ├── StrategyGrid.tsx          # Main grid component
│   ├── StrategyGridRow.tsx       # Individual row component
│   ├── StrategyGridHeader.tsx    # Grid header with sorting
│   ├── StrategyGridContent.tsx   # Grid content wrapper
│   └── GridControls.tsx          # Grid control buttons
│
├── hooks/
│   └── useComparisonData.ts      # Data transformation for comparison chart
│
└── config/
    └── outcomeDefinitions.tsx    # Outcome/metric definitions and colors
```

## Key components

### ScenarioExplorer.tsx (Main orchestrator)

The root component that manages the overall layout and navigation. It reads navigation state from the Zustand store and renders the appropriate views.

**State from Store:**

- `mainView`: `"explorer" | "data"` - Toggles between sub-tabs
- `exploreMode`: `"list" | "map" | "comparison"` - Current tool mode

**Local UI State:**

- `isListExpanded`: Controls the expanded modal for list view

**Layout:**

- Tab navigation at top (full width)
- Split-panel layout below tabs:
  - Left column: Tool panel (comparison chart when in comparison mode)
  - Right column: Scenario list with search

### ListPanel.tsx

Container for the scenario list that handles different explore modes. This is the right panel in split views.

**What it does:**

- Wraps `ListView` and passes mode-specific props
- Manages map state via `mapActions` when in map mode
- Handles tier click events for map visualization

**Note:** The actual map visualization is rendered at a higher level in the app. In map mode, `ListPanel` just:

1. Activates the map via store actions
2. Shows `ListView` in compact mode
3. Handles clicks to visualize outcomes on the map

**Props:**

```typescript
interface ListPanelProps {
  isExpanded?: boolean // External modal control
  onCloseExpand?: () => void
  modalToolbar?: React.ReactNode // Content for expanded modal
}
```

### ListView.tsx

The actual scenario grid component. Displays scenarios in a scrollable list with search, filter, and sort capabilities.

**Props:**

```typescript
interface ListViewProps {
  compact?: boolean // Compact mode for split views
  onTierClick?: (scenarioId: string, outcomeCode: string) => void
  isExpanded?: boolean
  onCloseExpand?: () => void
  modalToolbar?: React.ReactNode
}
```

**State from Store:**

- `selectedScenarios`, `toggleScenario`
- `searchQuery`, `pinnedScenarioId`
- `showOnlyChosen`, `showDefinitions`

**Local State:**

- `sortBy`, `sortDirection` - Sorting is component-local
- `localSelectedOutcomes` - Outcome selection per scenario
- `isExpandedInternal` - Fallback when not externally controlled

**Features:**

- Search filtering by name, description, ID
- Sorting by outcome scores
- Expandable modal view
- Pinned scenario support
- Compact mode for map/comparison views

### ComparisonPanel.tsx

Left panel displaying a parallel coordinates chart for scenario comparison. Gets state directly from the store.

**State from Store:**

- `highlightedScenario`, `setHighlightedScenario`
- `setPinnedScenarioId`

**Local UI State:**

- `overlayTiers`, `highlightBaseline`, `relativeToBaseline`, `defineOutcome`
- `isExpanded`, `hoveredScenario`

**Features:**

- `VerticalParallelLinePlotPeak` visualization
- Toggle: relative to baseline
- Toggle: highlight baseline (current operations)
- Toggle: overlay tiers
- Expandable modal view
- Hover tooltips with scenario names
- Click to highlight/pin scenarios

### EquityPanel.tsx

Left panel for the equity tool. Equity mode shows the panel on the left and the map on the right.

**Layout:**

- Left column: EquityPanel with search, hydroclimate chooser
- Right column: Map (transparent, map rendered at app level)

**State from Store:**

- `selectedScenarios`

**Local UI State:**

- `isExpanded`: Controls modal expansion
- `selectedHydroclimate`: Currently selected climate scenario

**Features:**

- Search bar for filtering scenarios
- Hydroclimate scenario chooser
- Expandable modal view
- Map activation via `mapActions`

**Map Integration:**

```typescript
useEffect(() => {
  mapActions.setMapMode("explore")
  return () => {
    mapActions.setMapMode("hidden")
    mapActions.clearOutcomeVisualization()
  }
}, [])
```

### MapView.tsx (in dataExplorer/components/)

Spatial visualization of outcomes on an interactive map.

**Features:**

- Metric/scenario selectors
- Temporal controls
- Tier markers on map
- Export screenshot functionality
- Uses Mapbox via `@repo/map` package

## State Management

The Zustand store in `store.ts` manages shared state across all explore tools.

### Design Principles

1. **Shared state in Zustand**: State that is accessed by multiple components (e.g., `selectedScenarios`, `exploreMode`)
2. **Local state in components**: UI-specific state that doesn't need to be shared (e.g., modal open/close, hover states, chart toggles)

### Types

```typescript
// Tool mode within "Choose scenarios" view
type ExploreMode = "list" | "map" | "comparison" | "equity"

// Main view within Explore section
type MainView = "explorer" | "data"
```

### State

| Property              | Type                            | Description                          |
| --------------------- | ------------------------------- | ------------------------------------ |
| `mainView`            | `MainView`                      | Current main view (explorer or data) |
| `exploreMode`         | `ExploreMode`                   | Current tool mode within explorer    |
| `selectedScenarios`   | `string[]`                      | IDs of selected scenarios            |
| `highlightedScenario` | `string \| null`                | Currently highlighted scenario       |
| `pinnedScenarioId`    | `string \| null`                | Scenario pinned to top of list       |
| `searchQuery`         | `string`                        | Current search text                  |
| `showOnlyChosen`      | `boolean`                       | Filter to selected only              |
| `showDefinitions`     | `boolean`                       | Show outcome definitions             |
| `selectedTier`        | `{ strategy, outcome } \| null` | Currently selected tier              |

### Actions

```typescript
// Navigation
setMainView(view: MainView)
setExploreMode(mode: ExploreMode)

// Scenario selection
toggleScenario(scenarioId: string)
selectScenarios(scenarioIds: string[])
clearScenarios()
setHighlightedScenario(scenarioId: string | null)
setPinnedScenarioId(scenarioId: string | null)

// Filtering
setSearchQuery(query: string)
setShowOnlyChosen(show: boolean)

// Display options
setShowDefinitions(show: boolean)

// Tier selection
setSelectedTier(tier: { strategy: string; outcome: string } | null)

// Reset functions
resetFilters()
resetSelections()
resetAll()
```

### Usage

```typescript
import { useScenarioExplorerStore } from "../store"

function MyComponent() {
  const { selectedScenarios, toggleScenario, searchQuery, setSearchQuery } =
    useScenarioExplorerStore()

  // Use state and actions...
}
```

### When to Use Zustand vs Local State

**Use Zustand for:**

- State shared across multiple components (e.g., `selectedScenarios`)
- Navigation state (e.g., `mainView`, `exploreMode`)
- State that needs to persist across view changes

**Use Local React State for:**

- UI-specific toggles (e.g., chart options, modal open/close)
- Hover states and ephemeral interactions
- Component-specific sorting and filtering
- Loading and error states

## How to Add a New Tool

Follow these steps to add a new exploration tool to the "Choose scenarios" view:

### Step 1: Add the Mode Type

In `store.ts`, add your new mode to the type:

```typescript
export type ExploreMode = "list" | "map" | "comparison" | "yourNewTool"
```

### Step 2: Add a Toolbar Button

In `ScenarioExplorer.tsx`, find the mode buttons array (around line 110) and add your tool:

```typescript
{[
  { mode: "list" as ExploreMode, icon: <ViewListIcon />, tip: "List view" },
  { mode: "map" as ExploreMode, icon: <MapIcon />, tip: "Map view" },
  { mode: "comparison" as ExploreMode, icon: <CompareArrowsIcon />, tip: "Comparison view" },
  // Add your new tool here:
  {
    mode: "yourNewTool" as ExploreMode,
    icon: <YourIcon sx={{ fontSize: "1.2rem" }} />,
    tip: "Your Tool Name"
  },
].map(({ mode, icon, tip }) => (
  // ... existing rendering code
))}
```

### Step 3: Create Your Tool Component

Create a new file `exploreView/YourNewToolPanel.tsx`:

```typescript
"use client"

import React, { useState } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"

export default function YourNewToolPanel() {
  const theme = useTheme()

  // Get shared state from store
  const {
    selectedScenarios,
    highlightedScenario,
    setHighlightedScenario,
    setPinnedScenarioId,
  } = useScenarioExplorerStore()

  // Local UI state
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Your tool implementation */}
      <Typography>Your New Tool</Typography>
    </Box>
  )
}
```

### Step 4: Add Conditional Rendering

In `ScenarioExplorer.tsx`, add rendering logic for your tool.

**For left panel tools** (like ComparisonPanel), add in the left column Box:

```typescript
{/* Left column — map or comparison panel */}
<Box sx={{ width: needsSplit ? "50%" : "0%", /* ... */ }}>
  {exploreMode === "comparison" && <ComparisonPanel />}
  {/* Add your tool here */}
  {exploreMode === "yourNewTool" && <YourNewToolPanel />}
</Box>
```

**Update the `needsSplit` logic** if your tool needs split layout:

```typescript
const needsSplit = mainView === "explorer" && exploreMode !== "list"
// Or be more specific:
const needsSplit =
  mainView === "explorer" &&
  (exploreMode === "map" ||
    exploreMode === "comparison" ||
    exploreMode === "yourNewTool")
```

### Step 5: Export from Barrel

In `exploreView/index.ts`, add your export:

```typescript
export { default } from "./ListPanel"
export { default as ListPanel } from "./ListPanel"
export { default as ComparisonPanel } from "./ComparisonPanel"
export { default as EquityPanel } from "./EquityPanel"
export { default as ListView } from "./ListView"
export { default as YourNewToolPanel } from "./YourNewToolPanel" // Add this
```

## Key Patterns

### Split-Panel Layout

Non-list modes use a 50/50 split layout:

- Left panel: Tool visualization (comparison chart, etc.)
- Right panel: Scenario list (compact mode)

```typescript
const needsSplit = mainView === "explorer" && exploreMode !== "list"

<Box sx={{ width: needsSplit ? "50%" : "0%" }}>
  {/* Left panel content */}
</Box>
<Box sx={{ width: needsSplit ? "50%" : "100%" }}>
  {/* Right panel content */}
</Box>
```

### Modal Expansion

Both ListView and ComparisonPanel support expandable modals using `MobileModal` from `@repo/ui`:

```typescript
import { MobileModal } from "@repo/ui"

<MobileModal
  open={isExpanded}
  onClose={() => setIsExpanded(false)}
  maxWidth="95vw"
  maxHeight="95vh"
  contentAriaLabel="Your content description"
>
  {/* Expanded content */}
</MobileModal>
```

### Map Integration

For map-related tools, use the map store actions:

```typescript
import { mapActions, useActiveOutcomeVisualization } from "../../map/store"

// Set map mode
mapActions.setMapMode("explore") // or "hidden"

// Visualize an outcome
mapActions.setOutcomeVisualization(outcomeCode, scenarioId)

// Clear visualization
mapActions.clearOutcomeVisualization()
```

### Data Hooks

Use existing hooks for scenario data:

```typescript
// Get comparison data for parallel coordinates
import { useComparisonData } from "../hooks/useComparisonData"
const { data, axes, lineColors, baselineScenario, isLoading } =
  useComparisonData()

// Get scenario list with metadata
import { useScenarioList } from "../../scenarios/hooks/useScenarioList"
const { scenarios, isLoading, error } = useScenarioList()

// Get tier data for multiple scenarios
import { useMultipleScenarioTiers } from "../../scenarios/hooks"
const { allChartData, outcomeNames, allScoreData, isLoading } =
  useMultipleScenarioTiers()
```

## Dependencies

The Scenario Explorer uses several internal packages:

| Package        | Purpose                                                 |
| -------------- | ------------------------------------------------------- |
| `@repo/ui`     | UI components (Box, Typography, MobileModal, etc.)      |
| `@repo/ui/mui` | Material-UI components                                  |
| `@repo/viz`    | Visualization components (VerticalParallelLinePlotPeak) |
| `@repo/map`    | Map components and store                                |
| `@repo/data`   | Data fetching utilities                                 |
| `@repo/state`  | Zustand with Immer                                      |
