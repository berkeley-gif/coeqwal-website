# Scenario Explorer

The Scenario Explorer is the main interface for exploring water allocation scenarios in the COEQWAL website. It provides multiple tools for viewing, comparing, and analyzing scenario data.

## Table of contents

- [Architecture](#architecture)
  - [Main app navigation](#main-app-navigation)
  - [Tool modes](#tool-modes)
  - [Layout: UnifiedToolView](#layout-unifiedtoolview)
  - [Error boundaries](#error-boundaries)
- [Key components](#key-components)
  - [GetStartedView.tsx](#getstartedviewtsx)
  - [ScenarioExplorer.tsx](#scenarioexplorertsx)
  - [ExplorerToolView.tsx](#explorertoolviewtsx)
  - [ActiveToolPanel.tsx](#activetoolpaneltsx)
  - [UnifiedToolView.tsx](#unifiedtoolviewtsx)
  - [ListView.tsx](#listviewtsx)
- [State management](#state-management)
  - [Get-started state](#get-started-state)
  - [Cross-store coordination](#cross-store-coordination)
  - [Three types of state](#three-types-of-state)
  - [Persistence](#persistence)
  - [Store layout](#store-layout)
- [Data flow](#data-flow)
  - [Where the data comes from](#where-the-data-comes-from)
  - [Data hooks](#data-hooks)
  - [Tier score encoding: heatmap vs radar](#tier-score-encoding-heatmap-vs-radar)
  - [Hydroclimate resolution](#hydroclimate-resolution)
- [How to add a visualization tool](#how-to-add-a-visualization-tool)
  - [How a tool fits together](#how-a-tool-fits-together)
  - [Quickstart: a tool that renders](#quickstart-a-tool-that-renders)
    - [Make your directory](#make-your-directory)
    - [Minimal path checklist](#minimal-path-checklist)
    - [Chrome exceptions](#chrome-exceptions)
  - [Optional layers](#optional-layers)
    - [Hook up your data](#hook-up-your-data)
    - [Chart controls bar](#chart-controls-bar)
    - [Write your visualization](#write-your-visualization-repoviz)
    - [State: when to add a store slice](#state-when-to-add-a-store-slice)
    - [Avoiding hover flicker](#avoiding-hover-flicker)
    - [Share](#share)
    - [Tool tour](#tool-tour)
    - [Wire to the scenario sidebar](#wire-to-the-scenario-sidebar)
    - [Wire to the hydroclimate chooser](#wire-to-the-hydroclimate-chooser)
    - [Map integration](#map-integration)
  - [Tool reference](#tool-reference)
    - [Manual test checklist](#manual-test-checklist)
    - [Reference implementations](#reference-implementations)
- [How to add a hydroclimate](#how-to-add-a-hydroclimate)

## Architecture

### Main app navigation

The Explore tab's primary sub-nav (`ExploreSubNav`) has two entries controlled by `mainView` state:

| View          | Label       | Description                                  |
| ------------- | ----------- | -------------------------------------------- |
| `get-started` | Get started | Onboarding / intro view                      |
| `explorer`    | Tools       | All exploration tools via `ExplorerToolView` |

### Tool modes

When `mainView === "explorer"`, five tool tabs are shown in the Explore sub-nav (`ExploreSubNav`, lifted to the page shell), controlled by `exploreMode` state:

| Mode         | Label         | Description                                       |
| ------------ | ------------- | ------------------------------------------------- |
| `list`       | List          | Default grid view of all scenarios (StrategyGrid) |
| `radar`      | Radar         | Compare selected scenarios across outcomes        |
| `equity`     | Distribution  | Location-level outcome distribution               |
| `resilience` | Resilience    | Multi-hydroclimate resilience heatmap             |
| `data`       | Data in depth | Detailed data explorer with per-category sections |

### Layout: UnifiedToolView

All tools are rendered inside `UnifiedToolView`, which provides a persistent three-panel chrome:

```
[Sidebar (optional, 320-480px)] [Toolbar + active tool (flex 1)] [Map panel (optional, 25%)]
```

- **Sidebar** (optional): `ExplorerSidebar` wraps `ScenarioSelectionSidebar`. Shown in non-list modes. Omitted in list mode.
- **Toolbar**: `ToolToolbar`. Show-map toggle and hydroclimate chooser ("View by climate"). Search and visibility chips live in the sidebar (`SearchAndChips`), not here.
- **Active tool**: `ActiveToolPanel` - chart controls + panel paired per mode, each inside `ToolErrorBoundary`.
- **Map panel**: Optional transparent reveal area (25% width). Toggled by the "Show map" switch in the toolbar.

### Error boundaries

Each surface gets its own `<ErrorBoundary>` (from `@repo/utils`), placed where that surface mounts (Get started in `ScenarioExplorer.tsx`, the rest in `ExplorerToolView`/`ActiveToolPanel`):

| Boundary     | What it wraps                           | Reset                                       | Fallback                                |
| ------------ | --------------------------------------- | ------------------------------------------- | --------------------------------------- |
| Get started  | `<GetStartedView />`                    | Auto via mount/unmount on `mainView`        | `ErrorFallback` with retry              |
| Active tool  | controls + panel in `ActiveToolPanel`   | `key={exploreMode}` per `ToolErrorBoundary` | `ErrorFallback`, "try a different tool" |
| Share drawer | `<ShareDrawer />` in `ExplorerToolView` | Auto on leaving explorer                    | `null` (drawer disappears)              |
| Tool tour    | `<ToolTour />` in `ExplorerToolView`    | Auto on leaving explorer                    | `null` (tour ends)                      |

The outer boundary in [apps/main/app/components/tabPanels/Explore.tsx](../../components/tabPanels/Explore.tsx) catches anything escaping these.

## Key components

### GetStartedView.tsx

Scroll onboarding for the get-started sub-tab. Composes `getStarted/panels/*` and mounts `animation/TierAnimationSection` (the only place the get-started animation is mounted). It reads the map mode but does not set it. `TierAnimationSection` drives the map into `get-started` mode while it is mounted and resets it to `hidden` on unmount.

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

Renders scenarios using the `StrategyGrid` system. Supports search filtering, outcome sorting, and hover coordination with other tools.

## State management

Two Zustand stores (all use Immer via `@repo/state/zustand`):

| Store                      | File                                 | Owns                                                |
| -------------------------- | ------------------------------------ | --------------------------------------------------- |
| `useScenarioExplorerStore` | [`store.ts`](store.ts)               | Shell routing: `mainView` only                      |
| `useExplorerStore`         | [`explorer/store/`](explorer/store/) | Tools domain, composed from workspace + tool slices |

Get started and explorer **do not share fields**. They coordinate through intentional one-way reads (for example `useExplorerMapLayout` reads shell `mainView` plus explorer `showMap`), not a merged store.

### Get-started state

Get-started uses component-local React state and the app map store. No third Zustand store today:

| State today                               | Owner                             | Notes                           |
| ----------------------------------------- | --------------------------------- | ------------------------------- |
| Animation beat, play, pins, encoding mode | `TierAnimationSection` `useState` | Ephemeral scroll-through UI     |
| Outcome hover in Key outcomes panel       | `KeyOutcomesPanel` `useState`     | Panel-local                     |
| Fetched tier/geojson for animation        | `useTierAnimationData`            | Data loading, not journey flags |
| Get-started map visibility                | app map store (`useMapMode`)      | Shared map layer                |

Add a `getStarted/store.ts` only when a value must survive get-started panel navigation or hand off to explorer on first tools visit. Do **not** put `mainView` there. That is shell routing.

### Cross-store coordination

These are intentional one-way reads, not shared state:

| Caller                              | Reads                                  | Purpose                               |
| ----------------------------------- | -------------------------------------- | ------------------------------------- |
| `ScenarioExplorer`, `ExploreSubNav` | `useScenarioExplorerStore.mainView`    | Mount get-started vs tools surface    |
| `useExplorerMapLayout`              | shell `mainView` + explorer `showMap`  | Map pass-through styling per surface  |
| `useExplorerLifecycle`              | shell `mainView`                       | Scroll-to-tabs on get-started to tools |
| Share tab (app)                     | `useExplorerStore` + `explorer/share/` | Story canvas from captured cards      |
| Get-started panels / animation      | map store, local state                 | No explorer store reads today         |

### Three types of state

Within the tools surface, new fields belong in one of three types. Two are **Zustand** slices inside `useExplorerStore`. The third is **React local state** (`useState` in a panel or section).

| Type         | Mechanism | Where                                                         |
| ------------ | --------- | ------------------------------------------------------------- |
| Workspace    | Zustand   | `workspaceStoreSlice.ts`                                      |
| Tool session | Zustand   | `<tool>StoreSlice.ts` (list, radar, equity, resilience, …) |
| Ephemeral    | React     | `useState` in a panel or section                              |

`useExplorerStore` is one Zustand instance composed from colocated slice files under [`explorer/store/`](explorer/store/).

1. **Workspace** (Zustand, `workspaceStoreSlice.ts`) - anything multiple tools or chrome read/write

   - Navigation: `exploreMode`, `tour`
   - Selection: `selectedScenarios`, `highlightedScenario`, `equityFocusScenario` (Distribution-only single focus, separate from multi-select)
   - Share tray: `shareItems`, `storyItemIds`, `showShareDrawer`
   - Toolbar chrome: `showMap`, `outcomeDisplayMode`, `showDefinitions`, `showKeyOperations`, `showAlternativeBaselines`
   - Shared chart cosmetics: `highlightBaseline`, `showTierZones`, `relativeToBaseline`, etc.
   - `hydroclimate`

2. **Tool session** (Zustand, tool slices) - persists when switching tools within Explore, consumed by that tool (+ share for that tool)

   - **listStoreSlice**: pins, stash fields, search, sort, theme/icon filters
   - **radarStoreSlice**: `radarVisibleAxes`, `showRadarRange`, `radarShowAll`, etc.
   - **equityStoreSlice**: `showEquityComparison`, `equityVisibleOutcomes`
   - **resilienceStoreSlice**: all `resilience*` fields, individual setters

3. **Ephemeral** (React, `useState`) - view-only UI that should not survive a tool switch (equity objective picks, data-in-depth chart modes, hover, List layout mode)

Some Zustand tool-slice fields are kept out of sessionStorage on purpose (for example `showAxisSelector`, pin snackbar flags). They are still Zustand, not React state. See [Persistence](#persistence) for what gets restored on reload.

**Rule of thumb:** If only one panel reads it and it does not need to survive a tool switch, use React `useState`. If the sidebar, toolbar, or share layer needs it, add it to a Zustand slice (workspace or the relevant tool slice). Shell routing (`mainView`) belongs in `useScenarioExplorerStore`. Get-started-only UI belongs in local React state (see [Get-started state](#get-started-state)).

**Coordination:** Do not hide one tool's rules inside another tool's actions. Example: resilience view sync with sidebar selection lives in `useResilienceSelectionSync` in the resilience panel folder, not in `toggleScenario`.

To wire a new tool slice, see [State: when to add a store slice](#state-when-to-add-a-store-slice) under Optional layers.

### Persistence

Explore session state survives a page reload within the same tab. Closing the tab clears sessionStorage. Implementation and key lists: [`exploreSessionPersist.ts`](explorer/store/exploreSessionPersist.ts) (authoritative) and [`pickSlices.ts`](explorer/store/pickSlices.ts) (key index).

| Storage          | Scope                                                                         | Survives reload? | Survives tab close? |
| ---------------- | ----------------------------------------------------------------------------- | ---------------- | ------------------- |
| `localStorage`   | Share tray (`shareItems`, `storyItemIds`)                                     | Yes              | Yes                 |
| `sessionStorage` | Shell `mainView`, workspace selection/chrome/cosmetics, all tool store slices | Yes (same tab)   | No                  |

**sessionStorage key:** `coeqwal-explorer-tool-sessions-v2`

**Workspace fields restored:** `selectedScenarios`, `equityFocusScenario`, `exploreMode`, `hydroclimate`, toolbar chrome (`showMap`, `showDefinitions`, …), chart cosmetics, `highlightedScenario`, `showShareDrawer`, `tour`.

**Not in sessionStorage:** `shareItems`, `storyItemIds` (localStorage), `shareUrlVersionMismatch`, tool ephemeral flags (`showAxisSelector`, pin snackbars, …).

### Store layout

```
explorer/store/
  index.ts              re-exports store, slice hooks, persist helpers
  storeInstance.ts      create() merges slices + share/tool session subscriptions
  types.ts              ExploreMode, OutcomeDisplayMode
  workspaceStoreSlice.ts  exploreMode, selection, hydroclimate, share, chrome
  listStoreSlice.ts       pins, filters, sort
  radarStoreSlice.ts      axes, range, dots
  equityStoreSlice.ts     showEquityComparison, equityVisibleOutcomes
  resilienceStoreSlice.ts resilience* fields, DEFAULT_RESILIENCE_CONTROLS, selectResilienceControls
  resilienceTypes.ts    ResilienceControlsState and related types
  pickSlices.ts           persist key index + pickWorkspaceSlice / pickListSlice / …
  exploreSessionPersist.ts  load/save Explore session to sessionStorage (source of truth)
  useToolSlices.ts      useWorkspaceSlice(), useListSlice(), useRadarSlice(), …
```

Import `useExplorerStore` from [`explorer/store.ts`](explorer/store.ts) (shim) or [`explorer/store/index.ts`](explorer/store/index.ts). Field names, defaults, and types live in the slice files and `types.ts`. Read those files rather than a duplicated field table here.

When a component only touches one store slice, prefer the slice hook over bare `useExplorerStore`:

| Hook                   | Slice file                | Example consumers                                       |
| ---------------------- | ------------------------- | ------------------------------------------------------- |
| `useWorkspaceSlice()`  | `workspaceStoreSlice.ts`  | `SearchAndChips`, `RadarChartControls`, `ExploreSubNav` |
| `useListSlice()`       | `listStoreSlice.ts`       | `useOrderedScenarios`, `SearchAndChips` (list fields)   |
| `useRadarSlice()`      | `radarStoreSlice.ts`      | `RadarChartControls`                                    |
| `useEquitySlice()`     | `equityStoreSlice.ts`     | `EquityChartControls`                                   |
| `useResilienceSlice()` | `resilienceStoreSlice.ts` | resilience panel / controls                             |

Each hook accepts an optional selector: `useListSlice((s) => s.searchQuery)`. Multi-field selectors use shallow compare via `useShallow`. Share tray and URL mismatch flags still use `useExplorerStore` where needed.

**Tool-specific exceptions:** Resilience sentence controls batch several flat store fields through a read-plan-write layer in `panels/resilience/controls/`. New code outside `ResilienceControls.tsx` should use flat selectors and named setters from `resilienceStoreSlice.ts`, not partial patches. Share capture hooks live with each tool panel and compose in `useExploreShareCapture`. See [Share](#share) and [`explorer/share/README.md`](explorer/share/README.md).

## Data flow

### Where the data comes from

Pick a hook by the shape of data you need. None of these require manual hydroclimate handling.

| You need...                                                | Hook                                         | What you get back                                                      |
| ---------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| All 9 outcomes for every scenario, hydroclimate-resolved   | `useResolvedScenarioTiers()`                 | `allScoreData`, `allChartData`, `outcomeNames`, `getDisplayName`       |
| Same, plus radar transforms                                | `useTierChartData()`                         | `data`, `axes`, `axisRange`, `lineColors`, `baselineScenario`          |
| Per-location tier assignments for one outcome              | `useTierLocationAssignments(id, code)`       | `locations[]` with `tier_level`                                        |
| Many outcomes' locations at once for a single scenario     | `useTierLocationAssignmentsBatch(id, codes)` | batched response, splays into the single-outcome cache                 |
| Reservoir, CWS, AG, env-flow, or Delta statistics          | the matching domain hook in `@repo/data`     | see the "Every hook in the package" table in `packages/data/README.md` |
| Storage, CWS, AG, and env-flow in one call (Data in Depth) | `useBatchStatistics(scenarios, types?)`      | one bundle keyed by scenario                                           |
| A static local JSON or GeoJSON file from `public/`         | `useLocalData(url)`                          | parsed body                                                            |

Hard rules:

- Never call `fetch()` or a raw fetcher from inside a panel.
- Please don't read `hydroclimate` from the store and resolve scenario ids. The hooks above do it.
- The domain hooks that don't resolve hydroclimate themselves (reservoir, CWS, AG, env-flow, Delta, batch statistics) need resolved scenario codes. Resolve them once with `useResolvedIdMapping()` and pass its `resolvedIds` into the hook.

For everything caching-related (cache keys, preloading, `useLocalData` options), see `packages/data/README.md`.

### Data hooks

```typescript
// Primary hook - tier data with automatic hydroclimate resolution
import { useResolvedScenarioTiers } from "../tools/hooks/useResolvedScenarioTiers"
const {
  allScenariosData, // Record<scenarioId, ScenarioTiersResponse> - all 24 scenarios
  allChartData, // Pre-processed chart data, keyed by scenario then outcome code
  allScoreData, // Scores per outcome: weighted_score and normalized_score
  outcomeNames, // Display-ordered list of { shortCode, displayName }
  siblingGroups, // Scenario group metadata
  getDisplayName, // maps a scenario id to a human-readable name
  getThemeForScenario, // maps a scenario id to a theme key for color assignment
  isLoading, // True only on initial load
  error,
} = useResolvedScenarioTiers()

// Comparison chart data (extends useResolvedScenarioTiers with cross-HC ranges, radar plot transforms)
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

### Tier score encoding: heatmap vs radar

The resilience heatmap and the radar read the API's aggregate tier scores differently, because each chart encodes them differently:

- The **resilience heatmap** uses `weighted_score` (the 1-4 mean tier level). It rounds each cell into a tier band and paints it with the tier palette, so it needs the value on the native 1-4 scale.
- The **radar** uses `normalized_score` (0-1, higher = better). It plots every outcome on one shared axis where outward = better, mapping the score via `normalized_score * 2 - 1`.

They are the same quantity rescaled, each matched to its chart. See "Tier scores: `weighted_score` vs `normalized_score`" in `packages/data/README.md` for the full breakdown.

### Hydroclimate resolution

There is no separate hydroclimate API endpoint. The supported set is defined by the canonical `HYDROCLIMATE_DEFS` array in `content/scenarios.ts`. `HYDROCLIMATES` (the value list), `HYDROCLIMATE_ID_MAP`, and the other hydroclimate constants all derive from it. The resolution flow is:

1. User picks a hydroclimate in `HydroclimateChooser`, which sets the store's `hydroclimate` (e.g., `"historical"`)
2. `HYDROCLIMATE_ID_MAP` in `content/scenarios.ts` maps the string to a numeric ID (e.g., `"historical"` becomes `2`)
3. `GET /api/scenarios` returns all 72+ scenarios, each with `hydroclimate_id` and `sibling_group`
4. `useResolvedIdMapping()` resolves sibling group IDs to actual scenario codes for the active hydroclimate
5. `useMultipleScenarioTiers(idMapping)` batch-fetches tier data for the resolved codes and re-keys results back to sibling group IDs

You do not need to do this manually. `useResolvedScenarioTiers()` wraps steps 1-5 into a single hook call. For tools that need raw resolved IDs (e.g. statistics or batch endpoints that don't go through the tier hook), call `useResolvedIdMapping()` (or `useResolvedIdMappings()` for all hydroclimates at once) directly. See `packages/data/README.md` for details.

## How to add a visualization tool

This guide has four parts: the mental model, a quickstart that gets an empty tool tab rendered, optional layers you add as needed, and a handy checklist for before opening a PR.

### How a tool fits together

A tool is a single panel registered as an `ExploreMode`. The shell is already mounted around it, so you are adding a known shape rather than building a page from scratch.

**Two surfaces, two stores**

| Surface     | Store                            | Key field                 | Renders           |
| ----------- | -------------------------------- | ------------------------- | ----------------- |
| Get started | `useScenarioExplorerStore`       | `mainView: "get-started"` | `GetStartedView`  |
| Tools       | `useExplorerStore` via slice hooks (`useWorkspaceSlice`, etc.) | `exploreMode`             | `ActiveToolPanel` |

When `mainView === "explorer"`, shared chrome is already mounted around your panel:

`ExplorerToolView` -> `UnifiedToolView` -> (`ExplorerSidebar` + tool chrome rows + `ActiveToolPanel`)

The sidebar, hydroclimate chooser, and map model/reveal are set up for all tools.

**Tool chrome rows (top to bottom inside `UnifiedToolView`)**

These are separate components.

| Row | Component | What it shows | Typical tools |
| --- | --- | --- | --- |
| 1 | `ToolJourneyStrip` | Chart title + one-sentence purpose (+ "Take the tour" when a tour exists). Copy from `journey.ts`. | List, Radar, Distribution, Resilience |
| 2 | `ToolToolbar` | Shared view controls: "Show map", "Choose locations to track", hydroclimate chooser | All tools except list-specific title layout |
| 3 | `*ChartControls` (optional) | Tool-specific controls passed into `ToolIsland` (outcome pickers, share button, etc.) | Radar, Equity, Resilience |
| 4 | Panel | Your chart or data view (`YourToolPanel`, `DataExplorerView`, etc.) | Every tool |

`ToolJourneyStrip` sits directly under `ExploreSubNav` and above `ToolToolbar`. Hiding the journey strip (step 8) removes row 1 only. `ToolToolbar` and your panel still render.

Everything beyond the panel is an optional layer you add only if you need it: a data hook, a chart in `@repo/viz`, a controls row, persisted settings, share, sidebar hover, hydroclimate, map, or a tour. The [Quickstart](#quickstart-a-tool-that-renders) gets an empty tab on screen. [Optional layers](#optional-layers) covers everything else.

**Data guidelines**

- Use hooks from `explorer/tools/hooks/` and `@repo/data`. Never call `fetch()` from a panel.
- Please don't read `hydroclimate` from the store and resolve sibling-group ids manually. Use `useResolvedScenarioTiers()`, `useResolvedIdMapping()`, or a hook that accepts resolved ids.

**Viz guidelines**

- Charts belong in `@repo/viz` and take plain data props only (no store reads).
- Explorer-specific wiring (theme colors, share capture, sidebar hover) stays in the panel.

### Quickstart: a tool that renders

Work through these in order. When you finish, you should have a working (empty) tab in the Explore sub-nav, ready for data and a chart.

#### Make your directory

Create a folder for your tool under `explorer/tools/panels/`. A typical layout:

```
explorer/tools/panels/yourTool/
├── YourToolPanel.tsx              required
├── YourToolChartControls.tsx      optional (toolbar row above chart)
├── useYourToolData.ts             optional, a panel-local data hook (recommended)
├── OffscreenYourToolCapture.tsx   optional (share)
├── useYourToolShareCapture.ts     optional (share)
└── tour/                          optional (guided tour, see explorer/tools/tour/README.md)
```

**Concrete reference: `radar`:** (chart, controls, share, tour, slice). If your tool needs are similar, you can copy the layout in `tools/panels/radar/` rather than inventing a new structure:

```
explorer/tools/panels/radar/
├── RadarPanel.tsx                         panel: store reads, chart wiring, hover debounce
├── RadarChartControls.tsx                 controls row passed into ToolIsland
├── useRadarPlotTheme.ts                   panel-local theme adapter for @repo/viz
├── useRadarShareCapture.ts                share capture hook
├── OffscreenRadarCapture.tsx              offscreen DOM snapshot for share cards
└── tour/                                  guided tour (see explorer/tools/tour/README.md)
```

Tier data comes from `tools/hooks/useTierChartData.ts`. The chart lives in `packages/viz/src/components/RadarPlot.tsx`. Shell wiring is in `ActiveToolPanel` `case "radar"`. Panel-to-chart patterns are walked through in the `RadarPanel` worked example under [Write your visualization (`@repo/viz`)](#write-your-visualization-repo-viz).

#### Minimal path checklist

The table is the full registration checklist. Each row matches one numbered section below (steps 1 through 8). Open the file in that row, make the edit described in **What you do there**, then use the matching **Step N** section for details and copy-paste examples.

Steps 1-7 are required for every new tool. Step 8 is optional (only if your tool should hide `ToolJourneyStrip`, row 1 in the table above).

| #   | File to edit                                       | What you do there                                                                                                          |
| --- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | `explorer/tools/panels/<tool>/YourToolPanel.tsx`   | Create the panel component (plus optional data hook and chart controls in the same folder)                                 |
| 2   | `explorer/tools/index.ts`                          | Export the panel and controls from the tools barrel                                                                        |
| 3   | `explorer/ActiveToolPanel.tsx`                     | Add a `case` that mounts the panel inside `ToolErrorBoundary` + `ToolIsland`                                               |
| 4   | `explorer/store/types.ts`                          | Add your mode string to the `ExploreMode` union                                                                            |
| 5   | `explorer/tools/chrome/nav/ExploreSubNav.tsx`      | Add a sub-nav tab (icon, label, short purpose) so users can switch to your tool                                            |
| 6   | `explorer/tools/chrome/layout/journey.ts`          | Register chart title and purpose copy for `ToolJourneyStrip` (row 1)                                                       |
| 7   | `explorer/store/exploreSessionPersist.ts`          | Add your mode to the `EXPLORE_MODES` validation set so persisted sessions accept it                                        |
| 8   | `explorer/tools/chrome/layout/UnifiedToolView.tsx` | Optional. Skip rendering `ToolJourneyStrip` for your mode (see the `data` tool and [Chrome exceptions](#chrome-exceptions) below) |

**Step 1 - create the panel**

Import from `explorer/store`, not `scenarioExplorer/store.ts` (shell only):

```tsx
"use client"

import { Box } from "@repo/ui/mui"
import { useWorkspaceSlice } from "../../../store"
import { useYourToolData } from "./useYourToolData"

export default function YourToolPanel() {
  const selectedScenarios = useWorkspaceSlice((s) => s.selectedScenarios)
  const { data, isLoading } = useYourToolData()
  if (isLoading) return null
  return <Box sx={{ height: "100%" }}>{/* chart */}</Box>
}
```

- Start with `"use client"`.
- Read selection and hydroclimate via slice hooks (`useWorkspaceSlice`, `useRadarSlice`, etc.).
- Keep view-only UI (expanded sections, transient hover) in local `useState`.

**Step 2 - export from the tools barrel**

```ts
export { default as YourToolPanel } from "./panels/yourTool/YourToolPanel"
export { default as YourToolChartControls } from "./panels/yourTool/YourToolChartControls"
```

**Step 3 - mount in ActiveToolPanel**

```tsx
case "yourTool":
  return (
    <ToolErrorBoundary tool="yourTool">
      <ToolIsland
        controls={<YourToolChartControls share={share.yourTool} />}
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

**Step 4 - extend ExploreMode**

```ts
// explorer/store/types.ts
export type ExploreMode =
  | "list"
  | "radar"
  | "equity"
  | "resilience"
  | "data"
  | "yourTool"
```

**Step 5 - add the sub-nav tab**

This registers your tool in the Explore sub-nav (List, Radar, Distribution, etc.). Append one object to the `FLOW` array in `ExploreSubNav.tsx`:

```ts
// ExploreSubNav.tsx - append to the FLOW array
{
  mode: "yourTool",
  icon: <YourIcon sx={{ fontSize: "1.1rem" }} />,
  label: "Your tool",
  purpose: "One-sentence purpose",
},
```

**Step 6 - register `ToolJourneyStrip` copy**

This fills row 1 in the chrome stack: the title/purpose strip rendered by `ToolJourneyStrip`, above `ToolToolbar` and above your panel. In `journey.ts`, append to the `JOURNEY` object and `EXPLORE_MODE_VIEW_NAME`:

```ts
// journey.ts
yourTool: {
  mode: "yourTool",
  purpose: "Why this view exists",
  nextMode: null,
  nextLabel: "",
  nextRationale: "",
},
// EXPLORE_MODE_VIEW_NAME
yourTool: "Your tool title",
```

`ExploreSubNav` calls `setExploreMode`, which also clears an in-progress tool tour. `ToolJourneyStrip` reads `JOURNEY[exploreMode].purpose` for the purpose sentence and `EXPLORE_MODE_VIEW_NAME[exploreMode]` for the chart title on the left. The `nextMode` / `nextLabel` / `nextRationale` fields are required by the `JourneyStageConfig` type but are not rendered anywhere yet, so fill them in to satisfy the type.

Step 6 registers copy even when you plan to hide the strip in step 8. The `data` tool still has `journey.ts` entries. Hiding only affects whether `UnifiedToolView` mounts `ToolJourneyStrip`.

**Step 7 - allow persisted sessions for your mode**

```ts
// explorer/store/exploreSessionPersist.ts - add to EXPLORE_MODES
const EXPLORE_MODES = new Set<ExploreMode>([
  "list",
  "radar",
  "equity",
  "resilience",
  "data",
  "yourTool",
])
```

Without this, a reloaded session that had your tool active may fall back to a default mode.

**Step 8 - hide `ToolJourneyStrip` (optional)**

Skip unless your tool should omit row 1 (the chart title + purpose strip). Most chart tools keep it. Consider hiding when the sub-nav label is enough context, or when the tool is a multi-section browser rather than a single chart (the `data` tool is the reference).

Hiding `ToolJourneyStrip` does **not** remove `ToolToolbar`. Users will still see the map toggle, location hint, and hydroclimate chooser on Data in depth and on any other tool where step 8 applies.

```tsx
// UnifiedToolView.tsx - data tool today
{exploreMode !== "data" && (
  <Box sx={{ flexShrink: 0 }}>
    <ToolJourneyStrip mode={exploreMode} />
  </Box>
)}
```

To also hide the strip for your tool, extend the condition:

```tsx
{exploreMode !== "data" && exploreMode !== "yourTool" && (
  <Box sx={{ flexShrink: 0 }}>
    <ToolJourneyStrip mode={exploreMode} />
  </Box>
)}
```

If a tool is ever pre-registered as a placeholder (its `ExploreMode`, sub-nav tab, and chart copy already exist but `ActiveToolPanel` renders a stub), you only need steps 1-3 to swap in the real panel. A brand-new tool needs steps 1-7 (and 8 only when applicable).

#### Chrome exceptions

Most tools use the shell as-is. A few special-case it:

| Tool         | Exception                                                    |
| ------------ | ------------------------------------------------------------ |
| `list`       | No sidebar (`isListMode` in `ExplorerToolView`)              |
| `resilience` | Hydroclimate chooser hidden in `ToolToolbar`                 |
| `data`       | `ToolJourneyStrip` hidden in `UnifiedToolView`; `ToolToolbar` still shown (see step 8 above) |

Adjust `ExplorerToolView`, `ToolToolbar`, `ExplorerSidebar`, or `UnifiedToolView` when your tool needs similar behavior.

### Optional layers

Add only the layers your tool needs. Each is independent, so skip anything that does not apply.

#### Hook up your data

Panel-local data hooks compose shared hooks and return plain chart inputs:

```ts
"use client"

import { useMemo } from "react"
import { useResolvedScenarioTiers } from "../../hooks/useResolvedScenarioTiers"
import { useWorkspaceSlice } from "../../../store"

export function useYourToolData() {
  const { allScoreData, isLoading, error } = useResolvedScenarioTiers()
  const selectedScenarios = useWorkspaceSlice((s) => s.selectedScenarios)

  const data = useMemo(
    // shapeForChart is your own transform into chart-ready inputs
    () => selectedScenarios.map((id) => shapeForChart(allScoreData?.[id])),
    [allScoreData, selectedScenarios],
  )

  return { data, isLoading, error }
}
```

See [Where the data comes from](#where-the-data-comes-from) for the hook selection table. Tier data is warmed by `usePrefetchTiers()` in the Explore lifecycle, so tier-backed panel mounts hit SWR cache rather than the network. Non-tier statistics (the Data in Depth sections) are not prefetched and fetch on demand.

#### Chart controls bar

Tools with a control row above the chart use `*ChartControls.tsx` in the `ToolIsland` controls slot (see `RadarChartControls`, `EquityChartControls`, `ResilienceChartControls`). `ExplorerToolView` calls `useExploreShareCapture()` once and threads the result down through `ActiveToolPanel`, which passes each tool's slice (`share.radar`, etc.) into its controls as a prop.

#### Write your visualization (`@repo/viz`)

If the chart is generic (bars, lines, matrix, radar with plain props), add it under `packages/viz/src/components/`. Explorer-specific coloring and share wiring stay in the panel.

Short rules:

- `"use client"`, `React.memo`, exported `MyChartProps` in the same file
- Named D3 imports (`import { scaleLinear } from "d3"`), never `import * as d3`
- Responsive sizing via `useResizeObserver`, never `clientWidth`
- Export from `packages/viz/src/index.ts`

**Rule:** if the component imports a store hook, it belongs in a panel, not `@repo/viz`. Read [Avoiding hover flicker](#avoiding-hover-flicker) before writing interactive D3.

**Worked example (the panel side):** `RadarPanel` is the adapter for `@repo/viz`'s `RadarPlot`. It reads the store (`useWorkspaceSlice`, `useRadarSlice`), turns the MUI theme into a palette (`useRadarPlotTheme`), and passes the chart only memoized values (`filteredData`, `scenarioColorById`, `filteredLineColors`) so D3 does not tear down and rebuild on every parent render. Chart events come back through props: the panel debounces `onChartHover` and throttles the `axisPositions` the chart emits on each rebuild. The same `RadarPlot` is reused store-free by `RadarPlotSnapshot` inside `OffscreenRadarCapture` for share capture. For the chart-authoring side, see how `RadarPlot` implements each convention and hover-flicker rule under "A complete worked example" in `packages/viz/README.md`.

#### State: when to add a store slice

See [Three types of state](#three-types-of-state) for the full model:

| State kind                                              | Mechanism | Where                                 |
| ------------------------------------------------------- | --------- | ------------------------------------- |
| Selection, hydroclimate, explore mode, share tray       | Zustand   | `workspaceStoreSlice` (already there) |
| Tool settings that survive tab switch + same-tab reload | Zustand   | New `<tool>StoreSlice.ts`             |
| View-only UI (expanded row, local hover)                | React     | Local `useState` in panel             |

**Slice wiring checklist** (when your tool needs persisted settings):

| File                                      | Change                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `explorer/store/<tool>StoreSlice.ts`      | State fields + actions (+ optional types file)                                                                                                                                                                                                                                                                                         |
| `explorer/store/storeInstance.ts`         | Add slice to `ExplorerStore` intersection, compose in `create()` with `merge*InitialState(exploreSession.<tool>)`                                                                                                                                                                                                                      |
| `explorer/store/pickSlices.ts`            | `<TOOL>_PERSIST_KEYS`, optional `<TOOL>_EPHEMERAL_STATE_KEYS`, `<TOOL>_ACTION_KEYS`, `pick<Tool>Slice`, `pick<Tool>PersistedState`, then add a key to `pickExplorerPersistedSession`                                                                                                                                                   |
| `explorer/store/exploreSessionPersist.ts` | Import `<Tool>State` / `<tool>InitialState`, add `<tool>` to the `ExplorerStore` intersection + `PersistedExploreSession` + `ExploreSessionHydration` + `EMPTY_HYDRATION`, wire `<tool>` through `migrateEnvelope` / `readPersistedEnvelope` / `loadExploreSessionState` / `saveExploreSessionState`, export `merge<Tool>InitialState` |
| `explorer/store/useToolSlices.ts`         | `useYourToolSlice` hook                                                                                                                                                                                                                                                                                                                |
| `explorer/store/index.ts`                 | Re-export hook and types                                                                                                                                                                                                                                                                                                               |

**Store init constraint:** slice files must not import React hook modules (e.g. do not import constants from `useResilienceMatrix.ts`). Extract shared constants into a hook-free module (see `resilienceHydroclimates.ts`).

#### Avoiding hover flicker

D3 imperative charts re-render on every hover unless you follow a strict set of rules: tooltips via a `ref` (never React state), debounced and deduplicated parent notifications, default prop values hoisted to module scope, primitive `useMemo` dependencies, guarded entrance animations, and minimal `updateChart` dependency arrays. None of this is explorer-specific. The full explanation, code samples, and checklist live in `packages/viz/README.md` under "Avoiding hover flicker in D3 charts".

Explorer-specific note: the callback your panel debounces is `onChartHover` (payload typed `HoveredInteraction`), owned by `useExploreHoverCoordination` and threaded through `ActiveToolPanel`. Wrap the resulting sidebar state updates in `startTransition` (see [Two-way hover](#two-way-hover) below).

#### Share

Share is separate from `exploreMode`: items are a discriminated union by `ShareItem.type`. End-to-end pipeline: [share/README.md § How it flows](explorer/share/README.md#how-it-flows). Full detail in [share/README.md](explorer/share/README.md).

Summary:

1. Add a `ShareItem` arm in `explorer/share/types.ts`
2. Implement `explorer/share/variants/<tool>.ts` and register in `variants.ts`
3. Add capture dimensions in `share/capture/dimensions.ts`
4. Build `OffscreenYourToolCapture.tsx` + `useYourToolShareCapture.ts` (calls `stageShareItem`)
5. Compose the tool hook in `explorer/useExploreShareCapture.ts` and pass props through `ActiveToolPanel` into chart controls (and sidebar when applicable)

#### Tool tour

Tour-enabled tools today are list and radar. Each owns a `panels/<tool>/tour/` folder exporting a `TourModule` (steps, optional demo effects, optional illustrations). The runner, anchor registry, and entry button live under `tools/tour/`.

Adding a tour to a new tool is one folder plus one line each in `tour/registry.ts` and `tour/toolToTourMap.ts`. Full recipe and conventions: [`tools/tour/README.md`](explorer/tools/tour/README.md).

#### Wire to the scenario sidebar

The sidebar widget (`ScenarioSelectionSidebar`) is mounted by `UnifiedToolView` via `ExplorerSidebar` for every non-list tool. It writes scenario selection to the workspace slice. Your panel reads that selection via `useWorkspaceSlice()`:

```ts
const { selectedScenarios, pinnedScenarioIds, highlightedScenario } =
  useWorkspaceSlice()
```

That is it. You do not import the sidebar component. You do not pass selection through props.

##### Two-way hover

If you want sidebar row hover to highlight chart elements and chart hover to scroll/highlight sidebar rows, pass hover props from `useExploreHoverCoordination` (owned by `ExplorerToolView`) into your panel via `ActiveToolPanel`.

Two state buckets, two directions:

| State                | Direction       | Consumer                                                 |
| -------------------- | --------------- | -------------------------------------------------------- |
| `highlightedIds`     | Sidebar → chart | Panels emphasize matching scenario ids                   |
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
import type { HoveredInteraction } from "../../../useExploreHoverCoordination"

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

Wrapping the hook's state updates in `startTransition` keeps sidebar reflows low priority so chart hover visuals paint first. See "Avoiding hover flicker" above for D3-specific rules.

#### Wire to the hydroclimate chooser

The chooser lives in `ToolToolbar` and is controlled by `hydroclimate` and `setHydroclimate` in the store. It is visible in every mode except `"resilience"`.

You do not import the chooser. You do not read `hydroclimate` from the store and resolve scenario ids by hand. Use the right hook.

```tsx
// Wrong. This breaks the moment the user switches hydroclimate, because the
// scenario id you read from selectedScenarios is a sibling-group id, not the
// resolved variant id for the active hydroclimate.
const { hydroclimate, selectedScenarios } = useWorkspaceSlice()
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

#### Map integration

The app has a single persistent Mapbox map that lives behind the UI. When the user toggles "Show map" in the toolbar, a transparent 25% reveal area opens on the right side of the layout. The tools don't create or manage the map. Instead, they communicate with the map through the **map store** (`apps/main/app/features/map/store.ts`).

The pattern: user clicks an element in the visualization -> write to the map store -> the `VisualizationLayers` component (which is always mounted on the map) reads that state and renders the appropriate polygons, markers, or line layers.

##### How to show a tier outcome on the map

```typescript
// From a file under explorer/tools/panels/<tool>/:
import { mapActions, useActiveOutcomeVisualization } from "../../../../../map/store"

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

##### Custom dot markers

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

##### What your component should do

1. **Toggle the visualization**: call `mapActions.toggleOutcomeVisualization(outcomeCode, scenarioId)` when the user clicks an element. This single call handles both set and clear (if the same outcome is already active, it clears it. Otherwise it sets the new one).
2. **Clear tooltips**: call `mapActions.clearMapTooltips()` before toggling to dismiss any pinned map tooltips from a previous selection.
3. **Highlight the active element**: read `useActiveOutcomeVisualization()` and visually indicate which outcome is currently shown on the map (e.g., an element border or highlight color).
4. **Clear on navigate**: call `mapActions.clearOutcomeVisualization()` when the user navigates away from the view.
5. **Render custom markers** (optional): use `setMotionChildren` from `useMap()` to show your own dot markers on the map (see above).

##### What you do not need to do

- Create map layers, sources, or polygons
- Fetch GeoJSON geometry
- Handle the "Show map" toggle (the toolbar and `UnifiedToolView` manage that)

##### Map reference implementations

- **`KeyOutcomesPanel.tsx`** (`apps/main/app/features/map/overlays/scenarioPanels/`) - Learn mode glyph toggle using `mapActions.toggleOutcomeVisualization()`.
- **`TierAnimationSection.tsx`** (`apps/main/app/features/scenarioExplorer/animation/`) - Get-started animation with post-animation outcome toggle on both text labels and SVG distribution shapes.

For the `setMotionChildren` API, see `packages/map/src/context/MapContext.tsx` and `packages/map/src/Map.tsx` where the injected children are rendered inside `<AnimatePresence>`.

### Tool reference

Existing tools to copy from, and a final check before you open a PR.

#### Manual test checklist

Before opening a PR:

- [ ] Tab appears in Explore sub-nav and switches without console errors
- [ ] `ToolErrorBoundary` isolates crashes (temporarily throw in panel to verify)
- [ ] Scenario selection from sidebar reflects in panel (non-list tools)
- [ ] Hydroclimate switch updates data (if using tier hooks)
- [ ] Same-tab page reload restores tool session state (if slice added)
- [ ] Share capture produces card + URL (if share added)
- [ ] Explore tab loads without module cycle / TDZ errors (store slices must not import hook modules)

#### Reference implementations

| Tool            | Complexity   | Copy for                                                                       |
| --------------- | ------------ | ------------------------------------------------------------------------------ |
| **radar**       | Medium       | **Best folder-structure reference:** Chart + controls + share + tour + slice |
| **equity**      | Medium       | Distribution chart + share                                                     |
| **resilience**  | High         | Complex controls, multi-HC matrix, layered write model                         |
| **list**        | Special      | No sidebar; grid layout; barChart share from rows; tour with demo effects      |
| **dataInDepth** | Large module | Batched stats via `useBatchStatistics`; no share variant; `ToolJourneyStrip` hidden, `ToolToolbar` kept |

See [Make your directory](#make-your-directory) for the `radar` folder layout.

## How to add a hydroclimate

This walks through adding a new hydroclimate to the main app. The main idea is to:
- register it app-wide once, 
- the chooser and every tool pick it up, 
- and then a few tools need some local wiring.

### Before you start

The new climate's scenarios should already exist in the database and come back from the `GET /api/scenarios` endpoint with a numeric `hydroclimate_id`. The app does not call that endpoint directly. It reads scenarios through the `@repo/data` package (the `useScenarios` hook), which is where the `hydroclimate_id` field is found.

### 1. Register the new hydroclimate app-wide in `content/scenarios.ts`

```ts
// content/scenarios.ts
export const HYDROCLIMATE_DEFS = [
  // ...existing entries...
  {
    value: "cc_new",
    apiId: 5,
    label: "New climate risk",
    shortLabel: "New risk",
    description: "...",
  },
] as const satisfies readonly HydroclimateDef[]
```

The fields are:

- `value`: the frontend string key, for example `cc_new`. Used across the app and in share URLs.
- `apiId`: the numeric `hydroclimate_id` the API returns for this climate's scenarios.
- `label`: the full display label.
- `shortLabel`: a compact label for tight UI (chips, axis ticks).
- `description`: the long-form text for tooltips and info panels.

Note: the values for these fields could be sourced from the database/API instead of exist on the frontend. That would be nice. You could collaborate with the backend developers to maintain the `hydroclimate` table in the database and create and api endpoint to implement through the data package.

### 2. Give the new hydroclimate an icon and color

Add an entry to `HYDROCLIMATE_CONFIG` in `features/scenarios/hydroclimateConfig.ts`, keyed by the same string value:

```ts
cc_new: { icon: SomeMuiIcon, bgColor: "#6a1b9a" },
```

Not having this is not a blocker. A climate with no entry here still works. The chooser draws a plain neutral circle with no icon, and the chrome, map, and share-card badges fall back to a neutral grey accent (`HYDROCLIMATE_FALLBACK_ACCENT`) while still showing the label.

### 3. Per-tool wiring

Most tools need nothing here, including the two that hold data for every climate at once rather than the one selected in the toolbar. The resilience matrix loops `RESILIENCE_HYDROCLIMATES` (an alias of `HYDROCLIMATES` from step 1), and share fetches every climate through `ShareRadarLiveProvider`, which renders one fetcher per `HYDROCLIMATES` entry. Both pick up a new climate from step 1 with no code change.

A couple of spots still need a hand-edit, because the centralized list cannot generate them:

- Optional: add a short token to the `HC_SLUG` map in `share/utils/filename.ts`, for example `cc_new: "ccnew"`. This is the compact hydroclimate string used in download filenames. If you skip it, `hydroclimateSlug` falls back to `slugifyForFilename(value)`, so `cc_new` becomes `cc-new` in the filename and the download still works.
- By design: the get-started animation in `animation/TierAnimationSection.tsx` hard-codes the moderate (`cc50`) and high (`cc95`) climate columns with hand-written labels. It is a curated teaching sequence, not a general tool, so it does not auto-scale. Add a column there by hand only if you want the new climate in that animation.

### 4. The chooser and tools pick it up

Once the entry is in `HYDROCLIMATE_DEFS`, the derived constants update automatically. The toolbar chooser in `ToolToolbar` reads `hydroclimateOptions`, so the new climate appears in the UI. The resolver hooks read `HYDROCLIMATE_ID_MAP` to translate the store's hydroclimate string into the numeric `hydroclimate_id` and then into the correct variant `short_code` for each sibling group.

Most tools need no further changes. Any panel that fetches tier data through `useResolvedScenarioTiers()` or resolves ids through `useResolvedIdMapping()` picks up the new climate when the user selects it in the chooser. You do not import the chooser or resolve scenario ids by hand in those tools.



