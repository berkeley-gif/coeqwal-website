# Scenario Explorer

The Scenario Explorer is the main interface for exploring water allocation scenarios in the COEQWAL application. It provides multiple tools for viewing, comparing, and analyzing scenario data.

## Overview

- **Purpose**: Water allocation scenario exploration interface
- **Framework**: Next.js 15 (App Router) with React 19
- **State Management**: Zustand with Immer (`@repo/state`)
- **Styling**: MUI v7 (`@repo/ui/mui`)
- **Location**: `apps/main/app/features/scenarioExplorer/`

## Directory layout

The Explore tab has two surfaces (Get started, Tools). The directory tree mirrors that:

```
features/scenarioExplorer/
├── ScenarioExplorer.tsx          orchestrator. Routes by mainView + exploreMode.
├── store.ts                      Zustand store. Owns mainView, exploreMode, etc.
├── constants.ts                  BASELINE_SCENARIO_ID and other feature-wide constants.
│
├── getStarted/                   Sub-tab 1: onboarding. Self-contained.
│   ├── GetStartedView.tsx        Thin orchestrator: composes panels + animation.
│   ├── getStartedViewport.ts     Sizing helper used by both panels and animation.
│   ├── panels/                   The eight content panels + the shared PanelShell.
│   └── animation/                Tier animation surface (TierAnimationSection,
│       │                         BeatText/OutcomeMorph overlays, BeatEngine).
│       └── engine/               BeatEngine + arbiters + per-beat config.
│
├── tools/                        Sub-tab 2: the five Explore tools.
│   ├── index.ts                  Barrel imported by ScenarioExplorer.tsx.
│   ├── panels/                   The five tool implementations.
│   │   ├── list/                 List tool. ListView + the StrategyGrid widget.
│   │   │   ├── ListView.tsx
│   │   │   ├── grid/             The grid widget (StrategyGrid + headers + rows).
│   │   │   ├── listTour.ts
│   │   │   └── ListTour*Illustration.tsx
│   │   ├── radar/                Radar tool: panel, axis-detail controls, capture, theme hook.
│   │   ├── equity/               Distribution tool (store key "equity").
│   │   ├── resilience/           Resilience heatmap + controls + hooks.
│   │   └── dataInDepth/          "Data in depth". Has its own components/, hooks/, utils/, config/ (outcomeDefinitions metric catalog).
│   ├── chrome/                   Layout chrome shared by explorer tools (subfolders by role).
│   │   ├── hydroclimateBadgeDisplay.ts  Helper used by ToolToolbar + UnifiedToolLayout.
│   │   ├── layout/               Shell, chart-controls slot, tool title strip.
│   │   │   ├── UnifiedToolLayout.tsx
│   │   │   ├── ChartControlsBar.tsx, ToolJourneyStrip.tsx, TakeTheTourButton.tsx
│   │   │   ├── journey.ts        Per-mode purpose / "now try..." nudge config (consumed by ToolJourneyStrip).
│   │   ├── nav/
│   │   │   └── ExploreSubNav.tsx Get started / Tools nav + tool sub-tabs (also imported from SmoothTabs).
│   │   ├── toolbar/
│   │   │   └── ToolToolbar.tsx
│   │   ├── sidebar/              Scenario rail + list widgets also reused by the list grid.
│   │   │   ├── ScenarioSelectionSidebar.tsx
│   │   │   ├── ThemeGroupHeader.tsx, SearchAndChips.tsx
│   │   ├── overlays/
│   │   │   ├── ToolTour.tsx, KeyboardShortcuts.tsx
│   │   └── chips/
│   │       └── InlineToggleChip.tsx, ToggleChip.tsx, TogglePair.tsx
│   ├── tour/                     Cross-cutting tour primitives (anchors, types, content barrel).
│   └── hooks/                    Cross-cutting data hooks (useResolvedScenarioTiers, etc.).
│
├── share/                        Share drawer + capture pipeline + URL persist + cards.
└── utils/                        scenarioIdSort, scenarioThemeOrder.
```

Tool-specific code (panel components, offscreen captures, per-tool hooks, per-tool tour content, per-tool metric catalogs) lives inside its `tools/panels/<tool>/` folder. Cross-cutting code used across tools (layout chrome, tour primitives, data hooks) lives under `tools/`. Code shared with the top-level Share tab (the share pipeline) and feature-wide helpers (`utils/`) live at the feature root. Cross-cutting outcome metadata used by every tool lives in `apps/main/app/content/outcomes.ts` (not here).

### Error boundaries

`ScenarioExplorer.tsx` wraps each surface in its own `<ErrorBoundary>` (from `@repo/utils`):

| Boundary     | What it wraps                               | Reset                                | Fallback                                |
| ------------ | ------------------------------------------- | ------------------------------------ | --------------------------------------- |
| Get started  | `<GetStartedView />`                        | Auto via mount/unmount on `mainView` | `ErrorFallback` with retry              |
| Active tool  | tool component inside `<UnifiedToolLayout>` | `key={exploreMode}`                  | `ErrorFallback`, "try a different tool" |
| Share drawer | `<ShareDrawer />`                           | Auto on leaving explorer             | `null` (drawer disappears)              |
| Tool tour    | `<ToolTour />`                              | Auto on leaving explorer             | `null` (tour ends)                      |

The outer boundary in [apps/main/app/components/tabPanels/Explore.tsx](../../components/tabPanels/Explore.tsx) catches anything escaping these (e.g. `TourAnchorProvider`, prefetch hook, layout-level effects).

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
[Sidebar (optional, 320-480px)] [Toolbar + Tool content (flex 1)] [Map panel (optional, 25%)]
```

- **Sidebar** (optional): `ScenarioSelectionSidebar`. Scenario checkboxes, theme filter, pinning. Shown in non-list modes. Omitted in list mode.
- **Toolbar**: `ToolToolbar`. Search bar, visibility toggle chips (Definitions, Baselines, Key ops, Chosen only), distribution toggle, show-map toggle, location picker, hydroclimate chooser. In list mode, uses CSS Grid aligned with `StrategyGrid` columns. In other modes, uses inline flex layout.
- **Tool content**: The active tool component (ListView, RadarPanel, EquityPanel, etc.).
- **Map panel**: Optional transparent reveal area (25% width) that lets the persistent app-level map show through. Toggled by the "Show map" switch in the toolbar.

## Key components

### ScenarioExplorer.tsx (main orchestrator)

Renders the top-level tab bar and, when `mainView === "explorer"`, wraps everything in `UnifiedToolLayout`. Manages hover coordination between sidebar and tool panels.

**State from Store:** `mainView`, `exploreMode`, `showMap`

**Routing logic:**

```typescript
{exploreMode === "list" && <ListView />}
{exploreMode === "radar" && <RadarPanel />}
{exploreMode === "equity" && <EquityPanel />}
{exploreMode === "resilience" && <ResiliencePanel />}
{exploreMode === "data" && <DataExplorerView />}
```

### UnifiedToolLayout.tsx

Shared layout chrome for all explore modes. Receives `sidebar` (optional), `toolbar`, and `children` as props.

- Sidebar: omitted in list mode, 320px normally, 480px with key operations visible
- Map panel: transparent 25% reveal area when `showMap` is true
- Manages map mode via `mapActions` from the map store

### ListView.tsx

Renders scenarios using the `StrategyGrid` system. Supports search filtering, outcome sorting, and hover coordination with the comparison panel. It has a different layout scheme than the other tools, because of its dependence on the rows.

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

| Property       | Type     | Default        | Description                                                    |
| -------------- | -------- | -------------- | -------------------------------------------------------------- |
| `hydroclimate` | `string` | `"historical"` | Active hydroclimate (e.g., `"historical"`, `"cc50"`, `"cc95"`) |

#### Other

| Property            | Type                        | Default | Description                    |
| ------------------- | --------------------------- | ------- | ------------------------------ |
| `isSortActive`      | `boolean`                   | `false` | Whether outcome sort is active |
| `selectedTier`      | `{strategy, outcome}\|null` | `null`  | Selected tier for map viz      |
| `sharedScenarioIds` | `string[]`                  | `[]`    | Scenarios staged for sharing   |
| `showShareDrawer`   | `boolean`                   | `false` | Share drawer open state        |

### When to use Zustand vs local state

**Use Zustand for:**

- State shared across multiple components (e.g., `selectedScenarios`, `hydroclimate`)
- Navigation state (e.g., `mainView`, `exploreMode`)
- State that must persist across view changes

**Use local React state for:**

- UI-specific toggles (e.g., a chart mode, modal open/close)
- Hover states and ephemeral interactions
- Component-specific sorting and filtering

## Data flow

### Hydroclimate resolution

There is no separate hydroclimate API endpoint. The flow is:

1. User picks a hydroclimate in `HydroclimateChooser` -> store's `hydroclimate` (e.g., `"historical"`)
2. `HYDROCLIMATE_ID_MAP` in `content/scenarios.ts` maps the string to a numeric ID (e.g., `"historical"` -> `2`)
3. `GET /api/scenarios` returns all 72+ scenarios, each with `hydroclimate_id` and `sibling_group`
4. `useResolvedIdMapping()` resolves sibling group IDs -> actual scenario codes for the active hydroclimate
5. `useMultipleScenarioTiers(idMapping)` batch-fetches tier data for the resolved codes and re-keys results back to sibling group IDs

You do not need to do this manually. `useResolvedScenarioTiers()` wraps steps 1-5 into a single hook call. For tools that need raw resolved IDs (e.g. statistics or batch endpoints that don't go through the tier hook), call `useResolvedIdMapping()` (or `useResolvedIdMappings()` for all hydroclimates at once) directly. See `packages/data/README.md` for details.

### Data hooks

```typescript
// Primary hook - tier data with automatic hydroclimate resolution
import { useResolvedScenarioTiers } from "../tools/hooks/useResolvedScenarioTiers"
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
import { useTierChartData } from "../tools/hooks/useTierChartData"
const { data, axes, lineColors, baselineScenario, isLoading } =
  useTierChartData()

// Lower-level: scenario list (sibling group metadata, display helpers)
import { useScenarioList } from "../../scenarios/hooks"
const { siblingGroups, getDisplayName } = useScenarioList()

// Lower-level: resolved IDs for the active hydroclimate
// (use when you need to call a non-tier endpoint with hc-correct scenario codes)
import { useResolvedIdMapping } from "../../scenarios/hooks"
const { idMapping, resolvedIds, missingScenarioIds, reverseMap } =
  useResolvedIdMapping()
```

## How to add a new visualization

There are four steps. Each one is a small, isolated change. The shared chrome (sidebar, toolbar, hydroclimate chooser, map reveal) is already mounted around your panel, so you do not build it yourself. You read from the Zustand store and feed plain data into a chart.

### 1. Set up your panel

Path: `apps/main/app/features/scenarioExplorer/tools/panels/<yourTool>/`

Create a folder named after your tool. Tool-specific captures, hooks, and tour content live next to the panel:

```
tools/panels/yourTool/
├── YourToolPanel.tsx              the panel component (required)
├── useYourToolData.ts             optional, a panel-local data hook (recommended)
├── OffscreenYourToolCapture.tsx   optional, for share/snapshot
└── yourToolTour.ts                optional, per-tool tour content
```

Minimum panel skeleton:

```tsx
"use client"

import { Box } from "@repo/ui/mui"
import { MyChart } from "@repo/viz"
import { useScenarioExplorerStore } from "../../../store"
import { useYourToolData } from "./useYourToolData"

export default function YourToolPanel() {
  const { selectedScenarios } = useScenarioExplorerStore()
  const { data, axes, colors, isLoading } = useYourToolData()

  if (isLoading) return null

  return (
    <Box sx={{ display: "flex", height: "100%" }}>
      <MyChart data={data} axes={axes} colors={colors} />
    </Box>
  )
}
```

Things to keep in mind:

- Start the file with `"use client"`. Panels read the store and use hooks.
- Read scenario state from `useScenarioExplorerStore()`. Do not accept it as a prop from `ScenarioExplorer.tsx`.
- Use MUI `sx` for layout. Import `Box`, `Typography`, etc. from `@repo/ui/mui`.
- Keep tool-only UI state (view mode, color mode, picked reservoir) in local `useState`. Only cross-cutting state goes in the store.

### 2. Hook up your data

Path: data hooks come from `@repo/data` and from the local `tools/hooks/` folder.

You do **not** call `fetch()` and you do **not** read `hydroclimate` yourself to resolve sibling-group ids. Use a data hook that handles hydroclimate resolution for you. The canonical entry points are `useResolvedScenarioTiers()` for tier data and `useResolvedIdMapping()` for resolved scenario codes that you can hand to any non-tier hook.

A typical panel-local data hook looks like this:

```ts
"use client"

import { useMemo } from "react"
import { useResolvedScenarioTiers } from "../../hooks/useResolvedScenarioTiers"
import { useScenarioExplorerStore } from "../../../store"

export function useYourToolData() {
  const { allScoreData, isLoading, error } = useResolvedScenarioTiers()
  const { selectedScenarios } = useScenarioExplorerStore()

  const data = useMemo(
    () =>
      selectedScenarios.map((id) => shapeForChart(allScoreData?.[id])),
    [allScoreData, selectedScenarios],
  )

  return { data, isLoading, error }
}
```

The hook reads from the store, fetches via a shared hook, reshapes the result, and returns the plain inputs the chart needs. See "Where the data comes from" below for the full list of available hooks.

### 3. Write your visualization

Path: `packages/viz`. This is the reusable chart component.

If your chart is generic (any bar, line, matrix, or radar that takes `data + colors + dimensions`) it belongs here. If it is tightly bound to scenario explorer concepts (scenario theme coloring, capture for sharing, sidebar wiring), keep it inline in your panel.

Create a new file at `packages/viz/src/components/MyChart.tsx`. The package has a full skeleton in its own README, but the rules in short form are:

- File starts with `"use client"`.
- Component is `React.memo(({ ... }) => { ... })` with `MyChart.displayName = "MyChart"` and a default export.
- Props interface is named `MyChartProps`, exported, defined in the same file.
- D3 imports are named: `import { scaleLinear, select } from "d3"`. Never `import * as d3`.
- Imperative draws use `useCallback(updateChart)` plus `useEffect(() => updateChart(w, h), [w, h, updateChart])`. Never one big `useEffect` that mixes sizing and drawing.
- Responsive sizing uses `useResizeObserver` from `../hooks/useResizeObserver`. Never `clientWidth`.

Pure SVG glyphs (think `OutcomeGlyph` or `StickChart`) can skip the resize and `useEffect` plumbing and just render JSX.

Export from the barrel at `packages/viz/src/index.ts`:

```ts
export { default as MyChart } from "./components/MyChart"
export type { MyChartProps } from "./components/MyChart"
```

Apps then `import { MyChart } from "@repo/viz"`. If you need a new D3 helper that the barrel does not already export, add it to the curated re-export list in the same file. Do not add `d3` as a dependency in the app.

**Rule of thumb: viz takes no scenario IDs and no store reads.** A viz component receives plain data and emits plain events. If your draft chart imports `useScenarioExplorerStore`, it belongs in a panel, not in `@repo/viz`.

Read "Avoiding hover flicker" below before you write any interactive D3 chart. The rules there are not optional.

### 4. The store, the sub-nav, and the barrel

The three small edits that make your panel appear as a tab.

If you can copy `RadarPanel` or `EquityPanel` and change one of the inputs, you're already 80% done.

Edit one: export the panel from the tools barrel.

```ts
export { default as YourToolPanel } from "./panels/yourTool/YourToolPanel"
```

Edit two: mount the panel in `ScenarioExplorer.tsx`. Inside the existing `<ErrorBoundary>` (which uses `key={exploreMode}` to reset per tool):

```tsx
{exploreMode === "yourTool" && <YourToolPanel />}
```

Edit three: register the tab. This is the explicit "store" part, and it spans three files.

1. `apps/main/app/features/scenarioExplorer/store.ts`. Extend the `ExploreMode` union:

   ```ts
   export type ExploreMode =
     | "list"
     | "radar"
     | "equity"
     | "resilience"
     | "data"
     | "yourTool"
   ```

   You do not need to add any new state slice unless your tool stores tool-specific values in the store. If it does, add the fields next to existing ones (look at `equityFocusScenario`, `radarVisibleAxes`, `dimUnpinned`) and add setters to the store actions block.

2. `apps/main/app/features/scenarioExplorer/tools/chrome/nav/ExploreSubNav.tsx`. Append a step to the `FLOW` array:

   ```ts
   {
     mode: "yourTool",
     icon: <YourIcon sx={{ fontSize: "1.1rem" }} />,
     label: "Your tool",
     purpose: "One-sentence purpose",
   },
   ```

3. `apps/main/app/features/scenarioExplorer/tools/chrome/layout/journey.ts`. Append a `JOURNEY` entry:

   ```ts
   yourTool: {
     purpose: "Why this view exists, in one sentence",
     nudge: "Now try the next tool to ...",
   },
   ```

If you are replacing an existing placeholder (Equity or Resilience), the mode, FLOW step, and JOURNEY entry already exist. Skip edit three entirely.

That's the full set of files. Five touchpoints total for a new tab. Three for a replacement.

## Worked example: the radar chart

Here is how the four steps above play out for the radar chart.

### Step 1: the panel

Path: `apps/main/app/features/scenarioExplorer/tools/panels/radar/`

```
tools/panels/radar/
├── RadarPanel.tsx                         the panel
├── OffscreenRadarCapture.tsx              share capture
├── RadarAxisDetailScenarioControls.tsx    axis detail UI
├── useRadarPlotTheme.ts                   theme-derived colors
└── radarTour.ts                           per-tool tour
```

The panel reads from the store and then hands plain props to `RadarPlot`:

```tsx
"use client"

import { RadarPlot } from "@repo/viz"
import { useScenarioExplorerStore } from "../../../store"
import { useTierChartData } from "../../hooks/useTierChartData"

export default function RadarPanel({ highlightedIds, onChartHover }) {
  const { selectedScenarios, pinnedScenarioIds, showTierZones } =
    useScenarioExplorerStore()

  const { data, axes, axisRange, lineColors, baselineScenario, isLoading } =
    useTierChartData()

  if (isLoading) return null

  return (
    <RadarPlot
      scenarios={data}
      axes={axes}
      axisRange={axisRange}
      colors={lineColors}
      baselineData={baselineScenario}
      chosenIds={selectedScenarios}
      pinnedScenarioIds={pinnedScenarioIds}
      highlightedIds={highlightedIds}
      showTierZones={showTierZones}
      onDotHover={handleDotHover}
    />
  )
}
```

`RadarPanel` never touches `fetch`, never reads `hydroclimate`, and never builds an axis scale. It composes store reads and a data hook, then passes plain data to `RadarPlot`.

### Step 2: the data hook

Path: `apps/main/app/features/scenarioExplorer/tools/hooks/useTierChartData.ts`

This is the panel's data hook. It composes shared building blocks rather than calling fetchers directly:

```ts
export function useTierChartData() {
  const { getDisplayName, getThemeForScenario } = useScenarioList()

  const { showAlternativeBaselines, showOnlyChosen, selectedScenarios } =
    useScenarioExplorerStore()

  const { hydroclimate, idMapping } = useResolvedIdMapping()

  const {
    allScoreData,
    scenarioIds: allScenarioIds,
    isLoading,
    error,
  } = useMultipleScenarioTiers(idMapping)

  // shape allScoreData into chart data, build axes, pick colors, etc.
  return { data, axes, axisRange, lineColors, baselineScenario, isLoading, error }
}
```

The chain of calls is:

1. `useResolvedIdMapping()` reads the active `hydroclimate` from the store and resolves each sibling-group id to its variant's `short_code`.
2. `useMultipleScenarioTiers(idMapping)` batch-fetches tier data for those resolved codes through `useSWR`. Results are re-keyed back to sibling-group ids so downstream code stays hydroclimate-agnostic.
3. `useScenarioExplorerStore()` provides selection and display options (`selectedScenarios`, `showAlternativeBaselines`, `showOnlyChosen`).
4. `useScenarioList()` provides display helpers (`getDisplayName`, `getThemeForScenario`) that are used to color and label traces.

The fetch itself happens inside SWR. By the time `RadarPanel` mounts, the cache is already warm because `ScenarioExplorer.tsx` calls `usePrefetchTiers()` near the top of the Explore tree. The hook's `useSWR` call is a cache lookup, not a network request.

### Step 3: the chart

Path: `packages/viz/src/components/RadarPlot.tsx`

`RadarPlot` knows nothing about scenarios. Its props are plain data:

```ts
export interface RadarPlotProps {
  scenarios: VerticalParallelLineData[]
  axes: string[]
  axisRange: { min: number; max: number }
  colors: Record<string, string>
  baselineData?: VerticalParallelLineData
  chosenIds?: string[]
  pinnedScenarioIds?: string[]
  highlightedIds?: string[]
  showTierZones?: boolean
  onDotHover?: (scenarioId: string, outcome: string, tierValue: number) => void
  // interactive, animate, onReady for capture
}
```

It uses D3 to draw the polygons and labels, exposes a `ResizeObserver` for responsive sizing, and emits dot hover events through `onDotHover`. The panel maps those into `onChartHover` for sidebar coordination. It is exported by name from `packages/viz/src/index.ts` so apps can `import { RadarPlot } from "@repo/viz"`.

### Step 4: wire it up

In `apps/main/app/features/scenarioExplorer/tools/index.ts`:

```ts
export { default as RadarPanel } from "./panels/radar/RadarPanel"
```

In `apps/main/app/features/scenarioExplorer/ScenarioExplorer.tsx`:

```tsx
{exploreMode === "radar" && (
  <RadarPanel
    highlightedIds={highlightedIds}
    onChartHover={onChartHover}
  />
)}
```

The mode `"radar"` is already in `ExploreMode`. The `FLOW` step in `ExploreSubNav.tsx` already exists. The `JOURNEY["radar"]` entry already exists. The radar tab was added once. Today the only change a developer makes is to the panel itself or its data hook.

## Where the data comes from

Pick a hook by the shape of data you need. None of these require manual hydroclimate handling.

| You need...                                                    | Hook                                              | What you get back                                                          |
| -------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------- |
| All 9 outcomes for every scenario, hydroclimate-resolved       | `useResolvedScenarioTiers()`                      | `allScoreData`, `allChartData`, `outcomeNames`, `getDisplayName`           |
| Same, plus radar and parallel transforms                       | `useTierChartData()`                              | `data`, `axes`, `axisRange`, `lineColors`, `baselineScenario`              |
| Per-location tier assignments for one outcome                  | `useTierLocationAssignments(id, code)`            | `locations[]` with `tier_level`                                            |
| Many outcomes' locations at once for a single scenario         | `useTierLocationAssignmentsBatch(id, codes)`      | batched response, splays into the single-outcome cache                     |
| Reservoir, CWS, AG, env-flow, or Delta statistics              | the matching domain hook in `@repo/data`          | see the "Every hook in the package" table in `packages/data/README.md`     |
| Storage, CWS, AG, and env-flow in one call (Data in Depth)     | `useBatchStatistics(scenarios, types?)`           | one bundle keyed by scenario                                               |
| A static local JSON or GeoJSON file from `public/`             | `useLocalData(url)`                               | parsed body                                                                |

Hard rules:

- Never call `fetch()` or a raw fetcher from inside a panel.
- Never read `hydroclimate` from the store and resolve scenario ids yourself. The hooks above do it.
- If you need resolved scenario codes to hand to a non-tier domain hook, call `useResolvedIdMapping()` and pass the resulting `resolvedIds` through.

For everything caching-related (cache keys, preloading, `useLocalData` options), see `packages/data/README.md`.

## Wire it up

Once your panel exists and reads data, two edits make it visible.

`apps/main/app/features/scenarioExplorer/tools/index.ts`:

```ts
export { default as YourToolPanel } from "./panels/yourTool/YourToolPanel"
```

`apps/main/app/features/scenarioExplorer/ScenarioExplorer.tsx`, inside the existing active-tool `<ErrorBoundary>`:

```tsx
{exploreMode === "yourTool" && <YourToolPanel />}
```

That is the whole wire-up for a tool that reuses an existing placeholder mode like `"equity"` or `"resilience"`. The error boundary uses `key={exploreMode}`, so errors in your tool reset cleanly when the user switches tabs. The shared chrome (`UnifiedToolLayout`, `ToolToolbar`, `ScenarioSelectionSidebar`, map reveal) is already rendered around your panel.

## Add a new tab

Skip this section if you are reusing an existing placeholder mode.

Three edits, all in the scenario-explorer feature.

1. `apps/main/app/features/scenarioExplorer/store.ts`. Add to the `ExploreMode` union:

   ```ts
   export type ExploreMode =
     | "list"
     | "radar"
     | "equity"
     | "resilience"
     | "data"
     | "yourTool"
   ```

2. `apps/main/app/features/scenarioExplorer/tools/chrome/nav/ExploreSubNav.tsx`. Append a step to the `FLOW` array:

   ```ts
   {
     mode: "yourTool",
     icon: <YourIcon sx={{ fontSize: "1.1rem" }} />,
     label: "Your tool",
     purpose: "One-sentence purpose",
   },
   ```

3. `apps/main/app/features/scenarioExplorer/tools/chrome/layout/journey.ts`. Append a `JOURNEY` entry:

   ```ts
   yourTool: {
     purpose: "Why this view exists, in one sentence",
     nudge: "Now try ...",
   },
   ```

`ExploreSubNav` calls `setExploreMode(step.mode)` when the user clicks the tab. The store's `setExploreMode` also resets any in-flight tool tour for you. `ToolJourneyStrip` reads `JOURNEY[exploreMode]` to show the purpose line and the next-step nudge.

If your tool needs its own state slice (selected reservoir, focus scenario, axis visibility), add those fields and setters to `store.ts` next to the existing examples (`radarVisibleAxes`, `equityFocusScenario`, `showRadarRange`).

## Wire to the scenario sidebar

The sidebar (`ScenarioSelectionSidebar`) is mounted by `UnifiedToolLayout` for every non-list tool. It writes scenario selection directly to the Zustand store. Your panel reads that selection from the store.

```ts
const { selectedScenarios, pinnedScenarioIds, highlightedScenario } =
  useScenarioExplorerStore()
```

That is it. You do not import the sidebar component. You do not pass selection through props.

### Two-way hover

If you want sidebar row hover to highlight chart elements and chart hover to scroll/highlight sidebar rows, route both through `useExploreHoverCoordination` in the orchestrator. `ScenarioExplorer.tsx` already wires this for Radar, Resilience, and Distribution (equity).

Two state buckets, two directions:

| State | Direction | Consumer |
|-------|-----------|----------|
| `highlightedIds` | Sidebar → chart | Panels emphasize matching scenario ids |
| `hoveredInteraction` | Chart → sidebar | Sidebar scrolls and shows optional outcome + tier detail |

In `ScenarioExplorer.tsx`:

```tsx
const {
  highlightedIds,
  hoveredInteraction,
  onSidebarRowHover,
  onChartHover,
} = useExploreHoverCoordination()

return (
  <UnifiedToolLayout
    sidebar={
      <ScenarioSelectionSidebar
        onRowHover={onSidebarRowHover}
        hoveredInteraction={hoveredInteraction}
      />
    }
    toolbar={<ToolToolbar />}
  >
    {exploreMode === "yourTool" && (
      <YourToolPanel
        highlightedIds={highlightedIds}
        onChartHover={onChartHover}
      />
    )}
  </UnifiedToolLayout>
)
```

In your panel:

```tsx
import type { HoveredInteraction } from "../orchestration/useExploreHoverCoordination"

type YourToolPanelProps = {
  highlightedIds?: Set<string> | null
  onChartHover?: (info: HoveredInteraction | null) => void
}

export default function YourToolPanel({
  highlightedIds,
  onChartHover,
}: YourToolPanelProps) {
  // Emphasize chart elements whose id is in highlightedIds.
  // Call onChartHover({ scenarioId, outcome?, tierValue? }) on pointer enter,
  // and onChartHover(null) on leave.
}
```

Wrapping the hook's state updates in `startTransition` keeps sidebar reflows low priority so chart hover visuals paint first. See "Avoiding hover flicker" below for D3-specific rules.

## Wire to the hydroclimate chooser

The chooser lives in `ToolToolbar` and is controlled by `hydroclimate` and `setHydroclimate` in the store. It is visible in every mode except `"resilience"`.

You do not import the chooser. You do not read `hydroclimate` from the store and resolve scenario ids by hand. Use the right hook.

```tsx
// Wrong. This breaks the moment the user switches hydroclimate, because the
// scenario id you read from selectedScenarios is a sibling-group id, not the
// resolved variant id for the active hydroclimate.
const { hydroclimate, selectedScenarios } = useScenarioExplorerStore()
const { data } = useScenarioTiers(selectedScenarios[0])

// Right. The hook reads hydroclimate and does the resolution for you.
const { allScoreData } = useResolvedScenarioTiers()
```

If you are calling a non-tier hook (reservoir, AG, env-flow, Delta, batch statistics), resolve ids once with `useResolvedIdMapping()` and pass `resolvedIds` into the domain hook:

```ts
const { resolvedIds } = useResolvedIdMapping()
const { data } = useBatchStatistics(resolvedIds, { types: ["storage"] })
```

That is the entire contract. The hydroclimate chooser updates the store, the resolver hooks pick up the change, and your panel re-renders with the new data.

If your tool should hide the hydroclimate chooser (Resilience is the only one today), add your mode to the `showToolbarHydroclimateChooser` check in `apps/main/app/features/scenarioExplorer/tools/chrome/toolbar/ToolToolbar.tsx`.

## Avoiding hover flicker

D3 imperative charts are sensitive to unnecessary React re-renders. Each render of the `updateChart` callback triggers `svg.selectAll("*").remove()`, which is a full tear-down and rebuild. Even with `hasAnimatedRef` guards that skip entrance animations on subsequent draws, the remove-and-rebuild cycle causes visible flicker.

Follow all of these rules for any chart that has hover or tooltip interactions.

### 1. Never use React state for tooltips

`useState<TooltipState>` inside a chart component causes a React re-render on every mouseenter and mouseleave. Even if `updateChart` does not re-fire, React still reconciles the JSX tree, and the conditional `{tooltip && <div>...</div>}` causes DOM churn.

Mount a permanent tooltip `<div>` with `display: none` and a `ref`. Toggle it imperatively from the D3 event handlers.

```tsx
const tooltipRef = useRef<HTMLDivElement>(null)

// In D3 mouseenter handler:
tooltipRef.current!.style.display = "block"
tooltipRef.current!.style.left = `${x}px`
tooltipRef.current!.innerHTML = "..."

// In D3 mouseleave handler:
tooltipRef.current!.style.display = "none"
```

### 2. Debounce parent notifications

When a chart calls `onChartHover?.(info)`, that typically triggers `setState` in the orchestrator, which re-renders the entire tree. Even if `React.memo` prevents the chart from re-rendering, the parent reconciliation can block the main thread and delay paint of the D3 hover visuals.

- Debounce the notify (80 ms works well) so rapid dot-to-dot movement fires at most one callback.
- Deduplicate. Track the last notified id in a ref. Skip the callback if hovering a different dot of the same scenario.
- Use `startTransition` in the parent's handler so the sidebar update is low priority.

```tsx
// In the chart:
const lastNotifiedIdRef = useRef<string | null>(null)

if (lastNotifiedIdRef.current !== scenario.id) {
  hoverTimer = setTimeout(() => {
    lastNotifiedIdRef.current = scenario.id
    onChartHoverRef.current?.({
      scenarioId: scenario.id,
      outcome: axis,
      tierValue,
    })
  }, 80)
}

// In the parent:
import { startTransition } from "react"
startTransition(() => setHighlightedIds([id]))
```

### 3. Hoist default prop values to module scope

Default values in destructuring (`colors = { default: "#666" }`) create new object references every render. That defeats `React.memo` and recreates the `updateChart` callback.

```tsx
// Bad. New object identity every render.
({ colors = { default: "#666", highlighted: "#1a3a5c" } }) => { ... }

// Good. Stable reference.
const DEFAULT_COLORS = { default: "#666", highlighted: "#1a3a5c" }
({ colors = DEFAULT_COLORS }) => { ... }
```

### 4. Use primitive `useMemo` dependencies for theme colors

MUI's `useTheme()` returns objects (`theme.palette.grey`, `theme.palette.waterThemes`) with new identity on every render even though the values inside have not changed. If you pass these through `useMemo`, the memo recomputes every render.

```tsx
// Bad. theme.palette.grey is a new object ref each render.
const chartColors = useMemo(
  () => ({ default: theme.palette.grey[600] }),
  [theme.palette.grey],
)

// Good. Extract primitive strings first.
const grey600 = theme.palette.grey[600]
const chartColors = useMemo(
  () => ({ default: grey600 }),
  [grey600],
)
```

### 5. Guard entrance animations

Use a `hasAnimatedRef` so entrance transitions only play once. Subsequent `updateChart` calls should use `duration(0)`.

```tsx
const hasAnimatedRef = useRef(false)
// inside updateChart:
const T_DUR = hasAnimatedRef.current ? 0 : 500
hasAnimatedRef.current = true
```

### 6. Keep `updateChart` deps minimal

Every value in `updateChart`'s `useCallback` dependency array is a potential re-render trigger. For callbacks like `onChartHover` and `onScenarioClick`, use refs instead of putting them in the dep array.

```tsx
const onChartHoverRef = useRef(onChartHover)
useEffect(() => {
  onChartHoverRef.current = onChartHover
}, [onChartHover])

// Inside updateChart, use onChartHoverRef.current, not onChartHover.
```

### Quick checklist for new D3 charts

- [ ] Tooltip via ref, not `useState`
- [ ] `onChartHover` and `onScenarioClick` stored in refs, not in `updateChart` deps
- [ ] Default prop values hoisted to module constants
- [ ] Parent uses `startTransition` for hover state updates
- [ ] `hasAnimatedRef` guards entrance animations
- [ ] All `useMemo` deps are primitives (strings, numbers, booleans), not theme objects

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

// On click, toggle the outcome on/off (single call handles the compare-and-toggle)
const handleOutcomeClick = (outcomeCode: string) => {
  mapActions.clearMapTooltips()
  mapActions.toggleOutcomeVisualization(outcomeCode, scenarioId)
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

1. **Toggle the visualization**: call `mapActions.toggleOutcomeVisualization(outcomeCode, scenarioId)` when the user clicks an element. This single call handles both set and clear (if the same outcome is already active, it clears it. Otherwise it sets the new one).
2. **Clear tooltips**: call `mapActions.clearMapTooltips()` before toggling to dismiss any pinned map tooltips from a previous selection.
3. **Highlight the active element**: read `useActiveOutcomeVisualization()` and visually indicate which outcome is currently shown on the map (e.g., an element border or highlight color).
4. **Clear on navigate**: call `mapActions.clearOutcomeVisualization()` when the user navigates away from the view.
5. **Render custom markers** (optional): use `setMotionChildren` from `useMap()` to show your own dot markers on the map (see above).

### What you do not need to do

- Create map layers, sources, or polygons
- Fetch GeoJSON geometry
- Handle the "Show map" toggle (the toolbar and `UnifiedToolLayout` manage that)

### Reference implementations

- **`KeyOutcomesPanel.tsx`** (`apps/main/app/features/map/overlays/scenarioPanels/`) - Learn mode glyph toggle using `mapActions.toggleOutcomeVisualization()`.
- **`TierAnimationSection.tsx`** (`apps/main/app/features/scenarioExplorer/getStarted/animation/`) - Get-started animation with post-animation outcome toggle on both text labels and SVG distribution shapes.

For the `setMotionChildren` API, see `packages/map/src/context/MapContext.tsx` and `packages/map/src/Map.tsx` where the injected children are rendered inside `<AnimatePresence>`.
