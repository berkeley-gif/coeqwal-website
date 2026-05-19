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
├── ScenarioExplorer.tsx          Routes mainView (get-started vs tools)
├── store.ts                      useScenarioExplorerStore (mainView only)
├── constants.ts                  BASELINE_SCENARIO_ID and other feature-wide constants.
│
├── getStarted/                   Sub-tab 1: onboarding. Self-contained.
│   ├── GetStartedView.tsx
│   ├── getStartedViewport.ts
│   ├── panels/
│   └── animation/                TierAnimationSection, BeatEngine, arbiters
│
├── explorer/                     Sub-tab 2: tools surface + store + share
│   ├── index.ts                  Entry for ScenarioExplorer (ExplorerToolView, lifecycle)
│   ├── ExplorerToolView.tsx      Tools surface: hooks, tour, overlays, layout compose
│   ├── ActiveToolPanel.tsx       exploreMode switch: controls + panel per tool
│   ├── ExplorerSidebar.tsx       Adapter: hover + share → ScenarioSelectionSidebar
│   ├── ToolErrorBoundary.tsx
│   ├── useExploreHoverCoordination.ts
│   ├── useExploreShareCapture.ts Composes per-tool share hooks (see panels/*/use*ShareCapture)
│   ├── useExplorerLifecycle.ts
│   ├── useExplorerMapLayout.ts
│   ├── store.ts                  Shim → store/index.ts
│   ├── store/                    Sliced useExplorerStore
│   ├── share/                    Share drawer, capture pipeline, URL persist, cards
│   └── tools/
│       ├── index.ts              Panel barrels
│       ├── panels/               list, radar, equity, resilience, dataInDepth
│       ├── chrome/               UnifiedToolView, ToolToolbar, sidebar widgets, overlays
│       ├── tour/
│       └── hooks/                useResolvedScenarioTiers, usePrefetchTiers, etc.
│
└── utils/                        scenarioIdSort, scenarioThemeOrder
```

Tool-specific code lives under `explorer/tools/panels/<tool>/` (panels, captures, per-tool share hooks, tour content). Cross-cutting chrome lives under `explorer/tools/chrome/`. The app Share tab imports from `explorer/store` and `explorer/share/`. Outcome metadata lives in `apps/main/app/content/outcomes.ts`.

### Error boundaries

`ScenarioExplorer.tsx` wraps each surface in its own `<ErrorBoundary>` (from `@repo/utils`):

| Boundary     | What it wraps                               | Reset                                | Fallback                                |
| ------------ | ------------------------------------------- | ------------------------------------ | --------------------------------------- |
| Get started  | `<GetStartedView />`                        | Auto via mount/unmount on `mainView` | `ErrorFallback` with retry              |
| Active tool  | controls + panel in `ActiveToolPanel`       | `key={exploreMode}` per `ToolErrorBoundary` | `ErrorFallback`, "try a different tool" |
| Share drawer | `<ShareDrawer />` in `ExplorerToolView`     | Auto on leaving explorer             | `null` (drawer disappears)              |
| Tool tour    | `<ToolTour />` in `ExplorerToolView`        | Auto on leaving explorer             | `null` (tour ends)                      |

The outer boundary in [apps/main/app/components/tabPanels/Explore.tsx](../../components/tabPanels/Explore.tsx) catches anything escaping these.

### Runtime component tree

```
ScenarioExplorer                    useExplorerLifecycle, useExplorerMapLayout
├── GetStartedView                  (error boundary)
└── ExplorerToolView                useExploreHoverCoordination, useExploreShareCapture
    ├── TourAnchorProvider
    ├── UnifiedToolView             sidebar, toolbar, activeTool slot
    │   ├── ExplorerSidebar → ScenarioSelectionSidebar  (non-list modes)
    │   ├── ToolToolbar
    │   └── ActiveToolPanel         one ToolErrorBoundary per exploreMode
    │       ├── list: ListView
    │       ├── radar: RadarChartControls + RadarPanel
    │       ├── equity: EquityChartControls + EquityPanel
    │       ├── resilience: ResilienceChartControls + ResiliencePanel
    │       └── data: DataExplorerView
    ├── KeyboardShortcuts
    ├── ShareDrawer                 (error boundary, fallback null)
    └── ToolTour                    (error boundary, fallback null)
```

Page shell: `ExploreSubNav` (writes `mainView` via feature store, `exploreMode` via explorer store), Mapbox map layer.

## Architecture

### Main app navigation

The top-level tab bar has two entries controlled by `mainView` state:

| View          | Label       | Description                                 |
| ------------- | ----------- | ------------------------------------------- |
| `get-started` | Get started | Onboarding / intro view                     |
| `explorer`    | Go to tools | All exploration tools via `ExplorerToolView` |

### Tool modes

When `mainView === "explorer"`, five tool tabs are currently shown in the toolbar (controlled by `exploreMode` state):

| Mode         | Label         | Description                                       |
| ------------ | ------------- | ------------------------------------------------- |
| `list`       | List          | Default grid view of all scenarios (StrategyGrid) |
| `comparison` | Tradeoffs     | Radar plot                                        |
| `equity`     | Equity        | Equity analysis tool (placeholder)                |
| `resilience` | Resilience    | Resilience analysis tool (placeholder)            |
| `data`       | Data in depth | Detailed data explorer with per-category sections |

### Layout: UnifiedToolView

All tools are rendered inside `UnifiedToolView`, which provides a persistent three-panel chrome:

```
[Sidebar (optional, 320-480px)] [Toolbar + active tool (flex 1)] [Map panel (optional, 25%)]
```

- **Sidebar** (optional): `ExplorerSidebar` wraps `ScenarioSelectionSidebar`. Shown in non-list modes. Omitted in list mode.
- **Toolbar**: `ToolToolbar`. Search bar, visibility toggle chips, show-map toggle, hydroclimate chooser.
- **Active tool**: `ActiveToolPanel` — chart controls + panel paired per mode, each inside `ToolErrorBoundary`.
- **Map panel**: Optional transparent reveal area (25% width). Toggled by the "Show map" switch in the toolbar.

## Key components

### ScenarioExplorer.tsx

Routes by `mainView`. Runs lifecycle effects (tier prefetch, scroll-on-tab-switch) and map pass-through layout. Delegates the tools surface to `ExplorerToolView`.

**State from store:** `mainView` (`useScenarioExplorerStore`)

### ExplorerToolView.tsx

Tools surface. Owns hover/share hooks, `TourAnchorProvider`, `UnifiedToolView`, and overlay siblings (`KeyboardShortcuts`, `ShareDrawer`, `ToolTour`).

### ActiveToolPanel.tsx

Single `exploreMode` switch. Each branch wraps that tool's chart controls and panel in `ToolErrorBoundary`:

```typescript
case "radar":
  return (
    <ToolErrorBoundary tool="radar">
      <RadarChartControls ... />
      <RadarPanel ... />
    </ToolErrorBoundary>
  )
```

### UnifiedToolView.tsx

Shared layout chrome. Receives `sidebar` (optional), `toolbar`, and `activeTool` as props.

- Sidebar: omitted in list mode, 320px normally, 480px with key operations visible
- Map panel: transparent 25% reveal area when `showMap` is true
- Manages map mode via `mapActions` from the map store

### ListView.tsx

Renders scenarios using the `StrategyGrid` system. Supports search filtering, outcome sorting, and hover coordination with the comparison panel. It has a different layout scheme than the other tools, because of its dependence on the rows.

## State management

Two Zustand stores (all use Immer via `@repo/state/zustand`):

| Store | File | Owns |
| ----- | ---- | ---- |
| `useScenarioExplorerStore` | [`store.ts`](store.ts) | Shell routing: `mainView` only |
| `useExplorerStore` | [`explorer/store/`](explorer/store/) | Tools domain, composed from workspace + tool slices |

Get started and explorer **do not share fields**. They coordinate through intentional one-way reads (for example `useExplorerMapLayout` reads shell `mainView` plus explorer `showMap`), not a merged store.

#### Get-started state (no dedicated store)

Get-started uses component-local React state and the app map store. No third Zustand store today:

| State today | Owner | Notes |
| ----------- | ----- | ----- |
| Animation beat, play, pins, encoding mode | `TierAnimationSection` `useState` | Ephemeral scroll-through UI |
| Outcome hover in Key outcomes panel | `KeyOutcomesPanel` `useState` | Panel-local |
| Fetched tier/geojson for animation | `useTierAnimationData` | Data loading, not journey flags |
| Get-started map visibility | app map store (`useMapMode`) | Shared map layer |

Add a `getStarted/store.ts` only when a value must survive get-started panel navigation or hand off to explorer on first tools visit. Do **not** put `mainView` there - that is shell routing.

#### Cross-store coordination (not shared state)

| Caller | Reads | Purpose |
| ------ | ----- | ------- |
| `ScenarioExplorer`, `ExploreSubNav` | `useScenarioExplorerStore.mainView` | Mount get-started vs tools surface |
| `useExplorerMapLayout` | shell `mainView` + explorer `showMap` | Map pass-through styling per surface |
| `useExplorerLifecycle` | shell `mainView` | Scroll-to-tabs on get-started → tools |
| Share tab (app) | `useExplorerStore` + `explorer/share/` | Story canvas from captured cards |
| Get-started panels / animation | map store, local state | No explorer store reads today |

### Three tiers (where new state goes)

`useExplorerStore` is one Zustand instance composed from colocated slice files under [`explorer/store/`](explorer/store/). Fields belong in one of three tiers:

1. **Workspace** (`workspaceSlice.ts`) - anything multiple tools or chrome read/write
   - Navigation: `exploreMode`, `tour`
   - Selection: `selectedScenarios`, `highlightedScenario`, `equityFocusScenario` (Distribution-only single focus, separate from multi-select)
   - Share tray: `shareItems`, `storyItemIds`, `showShareDrawer`
   - Toolbar chrome: `showMap`, `outcomeDisplayMode`, `showDefinitions`, `showKeyOperations`, `showAlternativeBaselines`
   - Shared chart cosmetics: `highlightBaseline`, `showTierZones`, `relativeToBaseline`, etc.
   - `hydroclimate`

2. **Tool session** - persists when switching tools within Explore, consumed by that tool (+ share for that tool)
   - **listSlice**: pins, stash fields, search, sort, theme/icon filters
   - **radarSlice**: `radarVisibleAxes`, `showRadarRange`, `radarShowAll`, etc.
   - **equitySlice**: `showEquityComparison`, `equityVisibleOutcomes`
   - **resilienceSlice**: all `resilience*` fields, individual setters

3. **Ephemeral** - `useState` in a panel or section (equity objective picks, data-in-depth chart modes, hover, List layout mode)

**Rule of thumb:** If only one panel reads it and it does not need to survive a tool switch, keep it local. If the sidebar, toolbar, or share layer needs it, put it in workspace or the relevant tool slice.

**Coordination:** Do not hide one tool's rules inside another tool's actions. Example: resilience view sync with sidebar selection lives in `useResilienceSelectionSync` in the resilience panel folder, not in `toggleScenario`.

### Slice map

```
explorer/store/
  index.ts           create() merges slices, re-exports useExplorerStore
  types.ts           ExploreMode, OutcomeDisplayMode
  workspaceSlice.ts  exploreMode, selection, hydroclimate, share, chrome
  listSlice.ts       pins, filters, sort
  radarSlice.ts      axes, range, dots
  equitySlice.ts     showEquityComparison, equityVisibleOutcomes
  resilienceSlice.ts resilience* fields, DEFAULT_RESILIENCE_CONTROLS, selectResilienceControls
  resilienceTypes.ts ResilienceControlsState and related types
```

Import `useExplorerStore` from [`explorer/store.ts`](explorer/store.ts) (shim) or [`explorer/store/index.ts`](explorer/store/index.ts).

#### Resilience controls write model

Resilience uses the same flat store as radar, but the sentence control surface changes several fields together:

- **Store (public API):** flat `resilience*` fields and individual setters in `resilienceSlice.ts`
- **ResilienceControls domain** (`panels/resilience/controls/`): read → plan → write layering
  - `readSnapshot.ts` — `readControlsSnapshot`: flat store fields → `ResilienceControlsState`
  - `planPivotChange.ts` — `planPivotPatch`: sentence pivot UI → partial patch (no store write)
  - `writeChange.ts` — `writeControlsChange`: partial patch → flat store (atomic)
- **`useResilienceControlsWriter`:** READ (`controlsSnapshot`) + WRITE (`writeChange`) facade used only by `ResilienceControls.tsx`
- **`ResiliencePanel`:** flat `useExplorerStore` selectors only (like `RadarPanel`)
- **Share:** `selectResilienceControls(useExplorerStore.getState())` at click time only

New code outside `ResilienceControls` should use flat selectors and named setters, not partial patches.

#### Share capture (per-tool hooks)

Share buttons live in chart controls and the scenario sidebar, away from the panels that snapshot them. Each tool owns its capture logic:

| Tool | Hook | Notes |
| ---- | ---- | ----- |
| Radar | `panels/radar/useRadarShareCapture.ts` | Panel registers capture refs on mount |
| Equity | `panels/equity/useEquityShareCapture.ts` | Offscreen capture in the hook (no panel ref) |
| Resilience | `panels/resilience/useResilienceShareCapture.ts` | Panel refs + `buildResilienceShareItem` |

`useExploreShareCapture` in `explorer/` composes the three hooks and returns `{ radar, equity, resilience }` grouped by consumer (`panelProps`, `sidebarProps`, `chartControlsProps`).

#### Shell store (`useScenarioExplorerStore`)

| Property   | Type       | Default         | Description            |
| ---------- | ---------- | --------------- | ---------------------- |
| `mainView` | `MainView` | `"get-started"` | Get started vs Tools surface |

#### Explorer store (`useExplorerStore`) - selected fields

| Property | Type | Default | Description |
| -------- | ---- | ------- | ----------- |
| `exploreMode` | `ExploreMode` | `"list"` | Active tool tab |
| `selectedScenarios` | `string[]` | `[]` | Checked scenario IDs |
| `pinnedScenarioIds` | `string[]` | `[]` | List-only: sticky comparison rows at top of grid |
| `stashedPinnedScenarioIds` | `string[] \| null` | `null` | Pin stash when wrapped List layout caps pins |
| `pinsTrimmedForMap` | `boolean` | `false` | Snackbar flag after auto-trim |
| `selectedIconId` | `string \| null` | `null` | Key-ops icon filter (List tool) |
| `shareItems` | `ShareItem[]` | `[]` | Captured cards in the share tray |
| `storyItemIds` | `string[]` | `[]` | Ordered IDs for the Share tab story canvas |
| `resilienceView`, `resilienceCellEncoding`, … | flat fields in resilienceSlice | see `DEFAULT_RESILIENCE_CONTROLS` |
| `equityVisibleOutcomes` | `string[]` | `OUTCOME_CODE_ORDER` | Outcome codes staged on equity share cards |
| `hydroclimate` | `string` | `"historical"` | Active hydroclimate |

Sort state uses `sortBy` / `sortDirection` (`sortBy !== null` means sort is active).

### When to use Zustand vs local state

**Use Zustand for:**

- Shell routing (`mainView`) via `useScenarioExplorerStore`
- Tools domain shared across chrome, panels, and share via `useExplorerStore`

**Use local React state for:**

- UI-specific toggles (e.g., a chart mode, modal open/close)
- Hover states and ephemeral interactions
- Component-specific sorting and filtering
- Get-started animation beat/progress and other scroll-through UI in `TierAnimationSection`

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

Path: `apps/main/app/features/scenarioExplorer/explorer/tools/panels/<yourTool>/`

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

   You do not need to add any new state slice unless your tool stores tool-specific values in the store. If it does, add the fields next to existing ones (look at `equityFocusScenario`, `radarVisibleAxes`) and add setters to the store actions block.

2. `apps/main/app/features/scenarioExplorer/explorer/tools/chrome/nav/ExploreSubNav.tsx`. Append a step to the `FLOW` array:

   ```ts
   {
     mode: "yourTool",
     icon: <YourIcon sx={{ fontSize: "1.1rem" }} />,
     label: "Your tool",
     purpose: "One-sentence purpose",
   },
   ```

3. `apps/main/app/features/scenarioExplorer/explorer/tools/chrome/layout/journey.ts`. Append a `JOURNEY` entry:

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

Path: `apps/main/app/features/scenarioExplorer/explorer/tools/panels/radar/`

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

Path: `apps/main/app/features/scenarioExplorer/explorer/tools/hooks/useTierChartData.ts`

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

In `apps/main/app/features/scenarioExplorer/explorer/tools/index.ts`:

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

`apps/main/app/features/scenarioExplorer/explorer/tools/index.ts`:

```ts
export { default as YourToolPanel } from "./panels/yourTool/YourToolPanel"
```

`apps/main/app/features/scenarioExplorer/explorer/ActiveToolPanel.tsx` — add a branch inside `ToolErrorBoundary`:

```tsx
case "yourTool":
  return (
    <ToolErrorBoundary tool="yourTool">
      <ToolIsland panel={<YourToolPanel />} />
    </ToolErrorBoundary>
  )
```

Also add chart controls in the same branch if the tool has a toolbar row. Register the mode in `ExploreSubNav` and `journey.ts` (see below). The shared chrome (`UnifiedToolView`, `ToolToolbar`, `ScenarioSelectionSidebar` via `ExplorerSidebar`, map reveal) is already composed by `ExplorerToolView`.

## Add a new tab

Skip this section if you are reusing an existing placeholder mode.

Three edits, all in the scenario-explorer feature.

1. `apps/main/app/features/scenarioExplorer/explorer/store/types.ts`. Add to the `ExploreMode` union:

   ```ts
   export type ExploreMode =
     | "list"
     | "radar"
     | "equity"
     | "resilience"
     | "data"
     | "yourTool"
   ```

2. `apps/main/app/features/scenarioExplorer/explorer/tools/chrome/nav/ExploreSubNav.tsx`. Append a step to the `FLOW` array:

   ```ts
   {
     mode: "yourTool",
     icon: <YourIcon sx={{ fontSize: "1.1rem" }} />,
     label: "Your tool",
     purpose: "One-sentence purpose",
   },
   ```

3. `apps/main/app/features/scenarioExplorer/explorer/tools/chrome/layout/journey.ts`. Append a `JOURNEY` entry:

   ```ts
   yourTool: {
     purpose: "Why this view exists, in one sentence",
     nudge: "Now try ...",
   },
   ```

`ExploreSubNav` calls `setExploreMode(step.mode)` when the user clicks the tab. The store's `setExploreMode` also resets any in-flight tool tour for you. `ToolJourneyStrip` reads `JOURNEY[exploreMode]` to show the purpose line and the next-step nudge.

If your tool needs its own state slice, add fields and setters to the relevant file under `explorer/store/` (see `radarSlice.ts`, `equitySlice.ts`, `resilienceSlice.ts`).

## Wire to the scenario sidebar

The sidebar widget (`ScenarioSelectionSidebar`) is mounted by `UnifiedToolView` via `ExplorerSidebar` for every non-list tool. It writes scenario selection directly to `useExplorerStore`. Your panel reads that selection from the store.

```ts
const { selectedScenarios, pinnedScenarioIds, highlightedScenario } =
  useExplorerStore()
```

That is it. You do not import the sidebar component. You do not pass selection through props.

### Two-way hover

If you want sidebar row hover to highlight chart elements and chart hover to scroll/highlight sidebar rows, pass hover props from `useExploreHoverCoordination` (owned by `ExplorerToolView`) into your panel via `ActiveToolPanel`.

Two state buckets, two directions:

| State | Direction | Consumer |
|-------|-----------|----------|
| `highlightedIds` | Sidebar → chart | Panels emphasize matching scenario ids |
| `hoveredInteraction` | Chart → sidebar | Sidebar scrolls and shows optional outcome + tier detail |

`ExplorerToolView` wires hover into `ExplorerSidebar` and `ActiveToolPanel`. Add props to your panel branch in `ActiveToolPanel.tsx`:

```tsx
case "yourTool":
  return (
    <ToolErrorBoundary tool="yourTool">
      <ToolIsland
        panel={
          <YourToolPanel
            highlightedIds={hover.highlightedIds}
            onChartHover={hover.onChartHover}
          />
        }
      />
    </ToolErrorBoundary>
  )
```

In your panel:

```tsx
import type { HoveredInteraction } from "../useExploreHoverCoordination"

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

If your tool should hide the hydroclimate chooser (Resilience is the only one today), add your mode to the `showToolbarHydroclimateChooser` check in `apps/main/app/features/scenarioExplorer/explorer/tools/chrome/toolbar/ToolToolbar.tsx`.

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
- Handle the "Show map" toggle (the toolbar and `UnifiedToolView` manage that)

### Reference implementations

- **`KeyOutcomesPanel.tsx`** (`apps/main/app/features/map/overlays/scenarioPanels/`) - Learn mode glyph toggle using `mapActions.toggleOutcomeVisualization()`.
- **`TierAnimationSection.tsx`** (`apps/main/app/features/scenarioExplorer/getStarted/animation/`) - Get-started animation with post-animation outcome toggle on both text labels and SVG distribution shapes.

For the `setMotionChildren` API, see `packages/map/src/context/MapContext.tsx` and `packages/map/src/Map.tsx` where the injected children are rendered inside `<AnimatePresence>`.
