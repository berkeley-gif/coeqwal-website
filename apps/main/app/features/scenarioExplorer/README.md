# Scenario Explorer

The Scenario Explorer is the main interface for exploring water allocation scenarios in the COEQWAL website. It provides multiple tools for viewing, comparing, and analyzing scenario data.

## Overview

- **Purpose**: Water allocation scenario exploration interface
- **Adding a tool**: [Developer guide: adding a new visualization tool](#developer-guide-adding-a-new-visualization-tool)
- **Framework**: Next.js 15 (App Router) with React 19
- **State Management**: Zustand with Immer (`@repo/state`)
- **Styling**: MUI v7 (`@repo/ui/mui`)
- **Location**: `apps/main/app/features/scenarioExplorer/`

## Directory layout

The Explore tab has two surfaces (Get started, Tools). On disk, **get started** and **tools** map to `getStarted/` and `explorer/`. The scrollytelling stack lives in a third top-level folder, `animation/`, because it is large, map-coupled, and imported from `features/map/` as well as from `GetStartedView`.

```
features/scenarioExplorer/
├── ScenarioExplorer.tsx          Routes mainView (get-started vs tools)
├── store.ts                      useScenarioExplorerStore (mainView only)
├── constants.ts                  BASELINE_SCENARIO_ID and other feature-wide constants.
│
├── getStarted/                   Sub-tab 1: onboarding scroll panels
│   ├── GetStartedView.tsx        mounts TierAnimationSection from ../animation
│   ├── getStartedViewport.ts
│   └── panels/                   Welcome, Key outcomes, Choose scenarios, etc.
│
├── animation/                    Get-started scrollytelling (runtime: get-started only)
│   ├── TierAnimationSection.tsx  beat-driven tier story + map coordination
│   ├── BeatTextOverlay.tsx, OutcomeMorphOverlay.tsx, useTierAnimationData.ts
│   └── engine/                   BeatEngine, beats, arbiters (map paint, camera, popups)
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

Tool-specific code lives under `explorer/tools/panels/<tool>/` (panels, captures, per-tool share hooks, tour content). Cross-cutting chrome lives under `explorer/tools/chrome/`. Get-started scroll copy lives under `getStarted/panels/`; the beat-driven map story lives under `animation/` (mounted only from `GetStartedView`). The app Share tab imports from `explorer/store` and `explorer/share/`. Outcome attribute data lives in `apps/main/app/content/outcomes.ts`.

### Panel layout convention

| Size / shape                      | Convention                                                               | Example                                        |
| --------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------- |
| Small tool (≤8 files)             | Flat under `panels/<tool>/`                                              | `equity/`, `radar/`                            |
| Medium tool with one hot sub-area | Panel root + one subfolder                                               | `list/` + `grid/`, `resilience/` + `controls/` |
| Large multi-section tool          | Mini-module: `components/`, `hooks/`, `config/`, `utils/` + local README | `dataInDepth/`                                 |

**Naming alias (data tool):** folder `dataInDepth/`, component `DataExplorerView`, explore mode `"data"`, toolbar label "Data in depth".

### Import paths

| Caller                                | Import from                                                                                  |
| ------------------------------------- | -------------------------------------------------------------------------------------------- |
| Outside the feature (tabs, map hooks) | `scenarioExplorer/store` (shell `mainView`), `scenarioExplorer/explorer/store` (tools store) |
| Map visualization layers              | `scenarioExplorer/animation/engine` (beat-engine helpers shared with get-started storyboard) |
| Inside `explorer/`                    | Relative `../../../store` shim or slice hooks (`useWorkspaceSlice`, etc.)                    |
| Do not                                | Import `store/storeInstance` or deep slice files from UI (use the shim)                      |

Share tab UI lives in `explorer/share/tab/` (see share README). Prefer `explorer/share/index.ts` for share types and utilities.

### Error boundaries

`ScenarioExplorer.tsx` wraps each surface in its own `<ErrorBoundary>` (from `@repo/utils`):

| Boundary     | What it wraps                           | Reset                                       | Fallback                                |
| ------------ | --------------------------------------- | ------------------------------------------- | --------------------------------------- |
| Get started  | `<GetStartedView />`                    | Auto via mount/unmount on `mainView`        | `ErrorFallback` with retry              |
| Active tool  | controls + panel in `ActiveToolPanel`   | `key={exploreMode}` per `ToolErrorBoundary` | `ErrorFallback`, "try a different tool" |
| Share drawer | `<ShareDrawer />` in `ExplorerToolView` | Auto on leaving explorer                    | `null` (drawer disappears)              |
| Tool tour    | `<ToolTour />` in `ExplorerToolView`    | Auto on leaving explorer                    | `null` (tour ends)                      |

The outer boundary in [apps/main/app/components/tabPanels/Explore.tsx](../../components/tabPanels/Explore.tsx) catches anything escaping these.

### Runtime component tree

```
ScenarioExplorer                    useExplorerLifecycle, useExplorerMapLayout
├── GetStartedView                  (error boundary)
│   ├── getStarted/panels/*         scroll sections
│   └── animation/TierAnimationSection   beat engine, map mode get-started
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

| View          | Label       | Description                                  |
| ------------- | ----------- | -------------------------------------------- |
| `get-started` | Get started | Onboarding / intro view                      |
| `explorer`    | Go to tools | All exploration tools via `ExplorerToolView` |

### Tool modes

When `mainView === "explorer"`, five tool tabs are currently shown in the toolbar (controlled by `exploreMode` state):

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
- **Toolbar**: `ToolToolbar`. Search bar, visibility toggle chips, show-map toggle, hydroclimate chooser.
- **Active tool**: `ActiveToolPanel` - chart controls + panel paired per mode, each inside `ToolErrorBoundary`.
- **Map panel**: Optional transparent reveal area (25% width). Toggled by the "Show map" switch in the toolbar.

## Key components

### GetStartedView.tsx

Scroll onboarding for the get-started sub-tab. Composes `getStarted/panels/*` and mounts `animation/TierAnimationSection` (the only runtime entry point for the animation folder). Sets map mode to `get-started` while the animation is active.

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

#### Get-started state (no dedicated store)

Get-started uses component-local React state and the app map store. No third Zustand store today:

| State today                               | Owner                             | Notes                           |
| ----------------------------------------- | --------------------------------- | ------------------------------- |
| Animation beat, play, pins, encoding mode | `TierAnimationSection` `useState` | Ephemeral scroll-through UI     |
| Outcome hover in Key outcomes panel       | `KeyOutcomesPanel` `useState`     | Panel-local                     |
| Fetched tier/geojson for animation        | `useTierAnimationData`            | Data loading, not journey flags |
| Get-started map visibility                | app map store (`useMapMode`)      | Shared map layer                |

Add a `getStarted/store.ts` only when a value must survive get-started panel navigation or hand off to explorer on first tools visit. Do **not** put `mainView` there - that is shell routing.

#### Cross-store coordination (not shared state)

| Caller                              | Reads                                  | Purpose                               |
| ----------------------------------- | -------------------------------------- | ------------------------------------- |
| `ScenarioExplorer`, `ExploreSubNav` | `useScenarioExplorerStore.mainView`    | Mount get-started vs tools surface    |
| `useExplorerMapLayout`              | shell `mainView` + explorer `showMap`  | Map pass-through styling per surface  |
| `useExplorerLifecycle`              | shell `mainView`                       | Scroll-to-tabs on get-started → tools |
| Share tab (app)                     | `useExplorerStore` + `explorer/share/` | Story canvas from captured cards      |
| Get-started panels / animation      | map store, local state                 | No explorer store reads today         |

### Three tiers (where new state goes)

`useExplorerStore` is one Zustand instance composed from colocated slice files under [`explorer/store/`](explorer/store/). Fields belong in one of three tiers:

1. **Workspace** (`workspaceStoreSlice.ts`) - anything multiple tools or chrome read/write

   - Navigation: `exploreMode`, `tour`
   - Selection: `selectedScenarios`, `highlightedScenario`, `equityFocusScenario` (Distribution-only single focus, separate from multi-select)
   - Share tray: `shareItems`, `storyItemIds`, `showShareDrawer`
   - Toolbar chrome: `showMap`, `outcomeDisplayMode`, `showDefinitions`, `showKeyOperations`, `showAlternativeBaselines`
   - Shared chart cosmetics: `highlightBaseline`, `showTierZones`, `relativeToBaseline`, etc.
   - `hydroclimate`

2. **Tool session** - persists when switching tools within Explore, consumed by that tool (+ share for that tool)

   - **listStoreSlice**: pins, stash fields, search, sort, theme/icon filters
   - **radarStoreSlice**: `radarVisibleAxes`, `showRadarRange`, `radarShowAll`, etc.
   - **equityStoreSlice**: `showEquityComparison`, `equityVisibleOutcomes`
   - **resilienceStoreSlice**: all `resilience*` fields, individual setters

3. **Ephemeral** - `useState` in a panel or section (equity objective picks, data-in-depth chart modes, hover, List layout mode)

**Rule of thumb:** If only one panel reads it and it does not need to survive a tool switch, keep it local. If the sidebar, toolbar, or share layer needs it, put it in workspace or the relevant tool slice.

**Coordination:** Do not hide one tool's rules inside another tool's actions. Example: resilience view sync with sidebar selection lives in `useResilienceSelectionSync` in the resilience panel folder, not in `toggleScenario`.

### Slice map

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

Import `useExplorerStore` from [`explorer/store.ts`](explorer/store.ts) (shim) or [`explorer/store/index.ts`](explorer/store/index.ts).

#### Tool slice facades

When a component only touches one store slice, prefer the slice hook over bare `useExplorerStore`:

| Hook                   | Slice file                | Example consumers                                       |
| ---------------------- | ------------------------- | ------------------------------------------------------- |
| `useWorkspaceSlice()`  | `workspaceStoreSlice.ts`  | `SearchAndChips`, `RadarChartControls`, `ExploreSubNav` |
| `useListSlice()`       | `listStoreSlice.ts`       | `useOrderedScenarios`, `SearchAndChips` (list fields)   |
| `useRadarSlice()`      | `radarStoreSlice.ts`      | `RadarChartControls`                                    |
| `useEquitySlice()`     | `equityStoreSlice.ts`     | `EquityChartControls`                                   |
| `useResilienceSlice()` | `resilienceStoreSlice.ts` | resilience panel / controls                             |

Each hook accepts an optional selector: `useListSlice((s) => s.searchQuery)`. Multi-field selectors use shallow compare via `useShallow`.

Share tray and URL mismatch flags still use `useExplorerStore` where needed.

#### Explore session persistence (sessionStorage)

**Explore session state survives a page reload within the same tab.** Closing the tab clears sessionStorage. Implementation and key lists: [`exploreSessionPersist.ts`](explorer/store/exploreSessionPersist.ts) (authoritative) and [`pickSlices.ts`](explorer/store/pickSlices.ts) (key index).

| Storage          | Scope                                                                         | Survives reload? | Survives tab close? |
| ---------------- | ----------------------------------------------------------------------------- | ---------------- | ------------------- |
| `localStorage`   | Share tray (`shareItems`, `storyItemIds`)                                     | Yes              | Yes                 |
| `sessionStorage` | Shell `mainView`, workspace selection/chrome/cosmetics, all tool store slices | Yes (same tab)   | No                  |

**sessionStorage key:** `coeqwal-explorer-tool-sessions-v2`

**Workspace fields restored:** `selectedScenarios`, `equityFocusScenario`, `exploreMode`, `hydroclimate`, toolbar chrome (`showMap`, `showDefinitions`, …), chart cosmetics, `highlightedScenario`, `showShareDrawer`, `tour`.

**Not in sessionStorage:** `shareItems`, `storyItemIds` (localStorage), `shareUrlVersionMismatch`, tool ephemeral flags (`showAxisSelector`, pin snackbars, …).

#### Resilience controls write model

Resilience uses the same flat store as radar, but the sentence control surface changes several fields together:

- **Store (public API):** flat `resilience*` fields and individual setters in `resilienceStoreSlice.ts`
- **ResilienceControls domain** (`panels/resilience/controls/`): read → plan → write layering
  - `readSnapshot.ts` - `readControlsSnapshot`: flat store fields → `ResilienceControlsState`
  - `planPivotChange.ts` - `planPivotPatch`: sentence pivot UI → partial patch (no store write)
  - `writeChange.ts` - `writeControlsChange`: partial patch → flat store (atomic)
- **`useResilienceControlsWriter`:** READ (`controlsSnapshot`) + WRITE (`writeChange`) facade used only by `ResilienceControls.tsx`
- **`ResiliencePanel`:** flat `useExplorerStore` selectors only (like `RadarPanel`)
- **Share:** `selectResilienceControls(useExplorerStore.getState())` at click time only

New code outside `ResilienceControls` should use flat selectors and named setters, not partial patches.

#### Share capture (per-tool hooks)

Share buttons live in chart controls and the scenario sidebar, away from the panels that snapshot them. Each tool owns its capture logic:

| Tool       | Hook                                                   | Notes                                        |
| ---------- | ------------------------------------------------------ | -------------------------------------------- |
| Radar      | `panels/radar/useRadarShareCapture.ts`                 | Panel registers capture refs on mount        |
| Equity     | `panels/equity/useEquityShareCapture.ts`               | Offscreen capture in the hook (no panel ref) |
| Resilience | `panels/resilience/hooks/useResilienceShareCapture.ts` | Panel refs + `buildResilienceShareItem`      |

`useExploreShareCapture` in `explorer/` composes the three hooks and returns `{ radar, equity, resilience }` grouped by consumer (`panelProps`, `sidebarProps`, `chartControlsProps`).

#### Shell store (`useScenarioExplorerStore`)

| Property   | Type       | Default         | Description                  |
| ---------- | ---------- | --------------- | ---------------------------- |
| `mainView` | `MainView` | `"get-started"` | Get started vs Tools surface |

#### Explorer store (`useExplorerStore`) - selected fields

| Property                                      | Type                                | Default                           | Description                                      |
| --------------------------------------------- | ----------------------------------- | --------------------------------- | ------------------------------------------------ |
| `exploreMode`                                 | `ExploreMode`                       | `"list"`                          | Active tool tab                                  |
| `selectedScenarios`                           | `string[]`                          | `[]`                              | Checked scenario IDs                             |
| `pinnedScenarioIds`                           | `string[]`                          | `[]`                              | List-only: sticky comparison rows at top of grid |
| `stashedPinnedScenarioIds`                    | `string[] \| null`                  | `null`                            | Pin stash when wrapped List layout caps pins     |
| `pinsTrimmedForMap`                           | `boolean`                           | `false`                           | Snackbar flag after auto-trim                    |
| `selectedIconId`                              | `string \| null`                    | `null`                            | Key-ops icon filter (List tool)                  |
| `shareItems`                                  | `ShareItem[]`                       | `[]`                              | Captured cards in the share tray                 |
| `storyItemIds`                                | `string[]`                          | `[]`                              | Ordered IDs for the Share tab story canvas       |
| `resilienceView`, `resilienceCellEncoding`, … | flat fields in resilienceStoreSlice | see `DEFAULT_RESILIENCE_CONTROLS` |
| `equityVisibleOutcomes`                       | `string[]`                          | `OUTCOME_CODE_ORDER`              | Outcome codes staged on equity share cards       |
| `hydroclimate`                                | `string`                            | `"historical"`                    | Active hydroclimate                              |

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
  allScoreData, // Scores per outcome: weighted_score and normalized_score
  outcomeNames, // Display-ordered list of { shortCode, displayName }
  siblingGroups, // Scenario group metadata
  getDisplayName, // (id) -> human-readable scenario name
  getThemeForScenario, // (id) -> theme key for color assignment
  isLoading, // True only on initial load
  isValidating, // True during background revalidation
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

## Developer guide: adding a new visualization tool

This is the checklist for wiring a new tool into the Explore tools. Other READMEs ([store](explorer/store/README.md), [share](explorer/share/README.md), [chrome](explorer/tools/chrome/README.md)) cover deep dives if you need them. Start here.

### Prerequisites

**Two surfaces, two stores**

| Surface     | Store                            | Key field                 | Renders           |
| ----------- | -------------------------------- | ------------------------- | ----------------- |
| Get started | `useScenarioExplorerStore`       | `mainView: "get-started"` | `GetStartedView`  |
| Tools       | `useExplorerStore` (slice hooks) | `exploreMode`             | `ActiveToolPanel` |

When `mainView === "explorer"`, shared chrome is already mounted around your panel:

`ExplorerToolView` -> `UnifiedToolView` -> (`ExplorerSidebar` + `ToolToolbar` + `ActiveToolPanel`)

The sidebar, hydroclimate chooser, and map model/reveal are set up for all tools.

**Data guidelines**

- Use hooks from `explorer/tools/hooks/` and `@repo/data`. Never call `fetch()` from a panel.
- Never read `hydroclimate` and resolve sibling-group ids by hand. Use `useResolvedScenarioTiers()`, `useResolvedIdMapping()`, or a hook that accepts resolved ids.

**Viz guidelines**

- Charts belong in `@repo/viz` and take plain data props only (no store reads).
- Explorer-specific wiring (theme colors, share capture, sidebar hover) stays in the panel.

### Make your directory

Reuse the [panel layout convention](#panel-layout-convention) above:

| Size                | Convention                    | Example                                                       |
| ------------------- | ----------------------------- | ------------------------------------------------------------- |
| Small (≤8 files)    | Flat under `panels/<tool>/`   | `equity/`, `radar/`                                           |
| Medium              | Panel root + one subfolder    | `list/grid/`, `resilience/controls/`                          |
| Large multi-section | Mini-module with local README | [`dataInDepth/`](explorer/tools/panels/dataInDepth/README.md) |

Typical new-tool folder:

```
explorer/tools/panels/yourTool/
├── YourToolPanel.tsx              required
├── YourToolChartControls.tsx      optional (toolbar row above chart)
├── useYourToolData.ts             optional (recommended)
├── OffscreenYourToolCapture.tsx   optional (share)
├── useYourToolShareCapture.ts     optional (share)
└── tour/                          optional (guided tour, see explorer/tools/tour/README.md)
```

### Minimal path checklist

Every new tool needs these seven steps. Step 8 is conditional.

| Step            | File                                               | Change                                                                                                                     |
| --------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1               | `explorer/tools/panels/<tool>/YourToolPanel.tsx`   | Panel (+ optional data hook, chart controls)                                                                               |
| 2               | `explorer/tools/index.ts`                          | Export panel and controls                                                                                                  |
| 3               | `explorer/ActiveToolPanel.tsx`                     | New `case` with `ToolErrorBoundary` + `ToolIsland`                                                                         |
| 4               | `explorer/store/types.ts`                          | Extend `ExploreMode` union                                                                                                 |
| 5               | `explorer/tools/chrome/nav/ExploreSubNav.tsx`      | Add `FLOW` step (icon, label, purpose)                                                                                     |
| 6               | `explorer/tools/chrome/layout/journey.ts`          | Add `JOURNEY` entry + `EXPLORE_MODE_VIEW_NAME`                                                                             |
| 7               | `explorer/store/exploreSessionPersist.ts`          | Add mode to `EXPLORE_MODES` validation set                                                                                 |
| 8 (conditional) | `explorer/tools/chrome/layout/UnifiedToolView.tsx` | Add a mode branch around `<ToolJourneyStrip />` only if your tool should hide the journey strip (see the `data` exception) |

**Step 1 - panel skeleton**

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

**Step 2 - tools barrel**

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

**Steps 4-7 - register the tab**

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

```ts
// ExploreSubNav.tsx - append to FLOW
{
  mode: "yourTool",
  icon: <YourIcon sx={{ fontSize: "1.1rem" }} />,
  label: "Your tool",
  purpose: "One-sentence purpose",
},
```

```ts
// journey.ts - append to JOURNEY and EXPLORE_MODE_VIEW_NAME
yourTool: {
  mode: "yourTool",
  purpose: "Why this view exists",
  nextMode: null,
  nextLabel: "",
  nextRationale: "",
},
// EXPLORE_MODE_VIEW_NAME: yourTool: "Your tool title",
```

`ExploreSubNav` calls `setExploreMode`, which also clears an in-progress tool tour. `ToolJourneyStrip` reads `JOURNEY[exploreMode]` for the purpose line and next-step nudge.

If you are **replacing a placeholder** that already has a mode, FLOW step, and JOURNEY entry, skip steps 4-7 and only implement the panel.

### Hook up your data

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
    () => selectedScenarios.map((id) => shapeForChart(allScoreData?.[id])),
    [allScoreData, selectedScenarios],
  )

  return { data, isLoading, error }
}
```

See [Where the data comes from](#where-the-data-comes-from) for the hook selection table. Tier cache is warmed by `usePrefetchTiers()` in the Explore lifecycle, so most panel mounts hit SWR cache rather than the network.

### Chart controls bar

Tools with a control row above the chart use `*ChartControls.tsx` in the `ToolIsland` controls slot (see `RadarChartControls`, `EquityChartControls`, `ResilienceChartControls`). Controls receive share capture functions from `useExploreShareCapture` via props from `ActiveToolPanel`.

### Write your visualization (`@repo/viz`)

If the chart is generic (bars, lines, matrix, radar with plain props), add it under `packages/viz/src/components/`. Explorer-specific coloring and share wiring stay in the panel.

Short rules:

- `"use client"`, `React.memo`, exported `MyChartProps` in the same file
- Named D3 imports (`import { scaleLinear } from "d3"`), never `import * as d3`
- Responsive sizing via `useResizeObserver`, never `clientWidth`
- Export from `packages/viz/src/index.ts`

**Rule:** if the component imports a store hook, it belongs in a panel, not `@repo/viz`. Read [Avoiding hover flicker](#avoiding-hover-flicker) before writing interactive D3.

### State: when to add a store slice

See [Three tiers](#three-tiers-where-new-state-goes) for the full model:

| State kind                                              | Where                                 |
| ------------------------------------------------------- | ------------------------------------- |
| Selection, hydroclimate, explore mode, share tray       | `workspaceStoreSlice` (already there) |
| Tool settings that survive tab switch + same-tab reload | New `<tool>StoreSlice.ts`             |
| View-only UI (expanded row, local hover)                | Local `useState` in panel             |

**Slice wiring checklist** (when your tool needs persisted settings):

| File                                      | Change                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `explorer/store/<tool>StoreSlice.ts`      | State fields + actions (+ optional types file)                                                                                                                                                                                                                                                                                         |
| `explorer/store/storeInstance.ts`         | Add slice to `ExplorerStore` intersection, compose in `create()` with `merge*InitialState(exploreSession.<tool>)`                                                                                                                                                                                                                      |
| `explorer/store/pickSlices.ts`            | `<TOOL>_PERSIST_KEYS`, optional `<TOOL>_EPHEMERAL_STATE_KEYS`, `<TOOL>_ACTION_KEYS`, `pick<Tool>Slice`, `pick<Tool>PersistedState`, then add a key to `pickExplorerPersistedSession`                                                                                                                                                   |
| `explorer/store/exploreSessionPersist.ts` | Import `<Tool>State` / `<tool>InitialState`, add `<tool>` to the `ExplorerStore` intersection + `PersistedExploreSession` + `ExploreSessionHydration` + `EMPTY_HYDRATION`, wire `<tool>` through `migrateEnvelope` / `readPersistedEnvelope` / `loadExploreSessionState` / `saveExploreSessionState`, export `merge<Tool>InitialState` |
| `explorer/store/useToolSlices.ts`         | `useYourToolSlice` hook                                                                                                                                                                                                                                                                                                                |
| `explorer/store/index.ts`                 | Re-export hook and types                                                                                                                                                                                                                                                                                                               |

**Store init constraint:** slice files must not import React hook modules (e.g. do not import constants from `useResilienceMatrix.ts`). Extract shared constants into a hook-free module (see `resilienceHydroclimates.ts`). Details: [explorer/store/README.md](explorer/store/README.md).

### Optional subsystems

Skip any block you do not need.

**Share** (radar, equity, resilience are references)

Share is separate from `exploreMode`: items are a discriminated union by `ShareItem.type`. Full pipeline: [share/README.md § Adding share to a new visualization](explorer/share/README.md#adding-share-to-a-new-visualization).

Summary:

1. Add a `ShareItem` arm in `explorer/share/types.ts`
2. Implement `explorer/share/variants/<tool>.ts` and register in `variants.ts`
3. Add capture dimensions in `share/capture/dimensions.ts`
4. Build `OffscreenYourToolCapture.tsx` + `useYourToolShareCapture.ts`
5. Compose into `explorer/useExploreShareCapture.ts`

**Sidebar hover** (radar pattern)

Pass `highlightedIds` and `onChartHover` from `ActiveToolPanel` into your panel. See [Wire to the scenario sidebar](#wire-to-the-scenario-sidebar).

**Tool tour** (list and radar today)

Each tour-enabled tool owns a `panels/<tool>/tour/` folder exporting a `TourModule` (steps, optional demo effects, optional illustrations). The runner, anchor registry, and entry button live under `tools/tour/`.

Adding a tour to a new tool is one folder plus one line each in `tour/registry.ts` and `tour/toolToTourMap.ts`. Full recipe and conventions: [`tools/tour/README.md`](explorer/tools/tour/README.md).

**Map integration** (list pattern)

See [Map integration](#map-integration). Panels call `mapActions` from the map context; they do not mount the map themselves.

**Toolbar exceptions**

| Tool         | Exception                                                    |
| ------------ | ------------------------------------------------------------ |
| `list`       | No sidebar (`isListMode` in `ExplorerToolView`)              |
| `resilience` | Hydroclimate chooser hidden in `ToolToolbar`                 |
| `data`       | Journey strip hidden in `UnifiedToolView` (see step 8 above) |

Adjust `ExplorerToolView`, `ToolToolbar`, `ExplorerSidebar`, or `UnifiedToolView` when your tool needs similar behavior.

### Manual test checklist

Before opening a PR:

- [ ] Tab appears in Explore sub-nav and switches without console errors
- [ ] `ToolErrorBoundary` isolates crashes (temporarily throw in panel to verify)
- [ ] Scenario selection from sidebar reflects in panel (non-list tools)
- [ ] Hydroclimate switch updates data (if using tier hooks)
- [ ] Same-tab page reload restores tool session state (if slice added)
- [ ] Share capture produces card + URL (if share added)
- [ ] Explore tab loads without module cycle / TDZ errors (store slices must not import hook modules)

### Reference implementations

| Tool            | Complexity   | Copy for                                                                       |
| --------------- | ------------ | ------------------------------------------------------------------------------ |
| **radar**       | Medium       | Chart + controls + share + tour + slice                                        |
| **equity**      | Medium       | Distribution chart + share                                                     |
| **resilience**  | High         | Complex controls, multi-HC matrix, layered write model                         |
| **list**        | Special      | No sidebar; grid layout; barChart share from rows; tour with demo effects      |
| **dataInDepth** | Large module | Batched stats via `useBatchStatistics`; no share variant; journey strip hidden |

**Radar file tree** (medium-complexity reference):

```
tools/panels/radar/
├── RadarPanel.tsx
├── RadarChartControls.tsx
├── OffscreenRadarCapture.tsx
├── useRadarPlotTheme.ts
└── tour/                       see explorer/tools/tour/README.md
```

Data: `tools/hooks/useTierChartData.ts`. Chart: `packages/viz/src/components/RadarPlot.tsx`. Wiring: `ActiveToolPanel` `case "radar"`.

## Tier score encoding: heatmap vs radar

The resilience heatmap and the radar read the API's aggregate tier scores differently, because each chart encodes them differently:

- The **resilience heatmap** uses `weighted_score` (the 1-4 mean tier level). It rounds each cell into a tier band and paints it with the tier palette, so it needs the value on the native 1-4 scale.
- The **radar** uses `normalized_score` (0-1, higher = better). It plots every outcome on one shared axis where outward = better, mapping the score via `normalized_score * 2 - 1`.

They are the same quantity rescaled, each matched to its chart. See "Tier scores: `weighted_score` vs `normalized_score`" in `packages/data/README.md` for the full breakdown.

## Where the data comes from

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
- Never read `hydroclimate` from the store and resolve scenario ids yourself. The hooks above do it.
- If you need resolved scenario codes to hand to a non-tier domain hook, call `useResolvedIdMapping()` and pass the resulting `resolvedIds` through.

For everything caching-related (cache keys, preloading, `useLocalData` options), see `packages/data/README.md`.

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
const chartColors = useMemo(() => ({ default: grey600 }), [grey600])
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
- **`TierAnimationSection.tsx`** (`apps/main/app/features/scenarioExplorer/animation/`) - Get-started animation with post-animation outcome toggle on both text labels and SVG distribution shapes.

For the `setMotionChildren` API, see `packages/map/src/context/MapContext.tsx` and `packages/map/src/Map.tsx` where the injected children are rendered inside `<AnimatePresence>`.
