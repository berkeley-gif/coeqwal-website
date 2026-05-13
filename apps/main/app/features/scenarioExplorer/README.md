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
│   │   ├── resilience/           Resilience heatmap + quadrant + controls + 5 hooks.
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

## How to add a new tool

### Step 1: Create the tool folder

Make `tools/panels/yourTool/` and put the panel in it. Tool-specific captures, hooks, and tour content live next to the panel:

```
tools/panels/yourTool/
├── YourToolPanel.tsx
├── OffscreenYourToolCapture.tsx     (if the tool offers a "save snapshot" share)
├── useYourToolFooBar.ts             (any tool-specific hooks)
└── yourToolTour.ts                  (optional, per-tool tour content)
```

```typescript
// tools/panels/yourTool/YourToolPanel.tsx
"use client"

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../../../store"
import { useResolvedScenarioTiers } from "../../hooks/useResolvedScenarioTiers"

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

### Step 2: Export from the tools barrel

Add to `tools/index.ts`:

```typescript
export { default as YourToolPanel } from "./panels/yourTool/YourToolPanel"
```

### Step 3: Add rendering in ScenarioExplorer.tsx

Inside the `UnifiedToolLayout` children (already wrapped in the active-tool `<ErrorBoundary>`):

```typescript
{exploreMode === "yourTool" && <YourToolPanel />}
```

### Step 4: Add the mode type (if creating a new tab)

If you need a new toolbar tab (rather than replacing an existing placeholder):

1. Add to `ExploreMode` in `store.ts`: `| "yourTool"`
2. Add to the FLOW config in `tools/chrome/nav/ExploreSubNav.tsx` so the tab appears in the sub-nav
3. Add an entry to `JOURNEY` in `journey.ts` so the "now try..." nudge works

If you're implementing one of the existing placeholders (equity or resilience), the mode and toolbar tab already exist. Just replace the placeholder component contents.

## Quick checklist: integrating a new visualization

For developers porting an external visualization:

- [ ] **Replace the placeholder content** in `EquityPanel.tsx` with your React component
- [ ] **Read shared state** from `useScenarioExplorerStore()`: `selectedScenarios`, `hydroclimate`, `highlightedScenario`, `pinnedScenarioIds` (see `packages/state/README.md` for the full property reference)
- [ ] **Fetch data via hooks**.use `useResolvedScenarioTiers()` (handles hydroclimate resolution automatically). Do not call `fetch()` or raw fetchers directly. (See `packages/data/README.md` "How to Get Data" section for the full walkthrough.)
- [ ] **Write back to store** when the user interacts: `setHighlightedScenario()` on hover, `togglePinnedScenario()` on click. For map visualization, use `mapActions.setOutcomeVisualization()` (see "Map integration" below).
- [ ] **Use MUI `sx` prop** for all styling. Please remember to remove any imports from other css. Import from `@repo/ui/mui`.
- [ ] **D3 rendering** goes in `useEffect` + `useRef<SVGSVGElement>`. Standard React + D3 pattern. The existing `@repo/viz` components do this. Use them as reference.
- [ ] **Port pure d3 visualizations as-is**. You can place them directly in your component, or if there is a case for reuse, in the `@repo/viz`package.
- [ ] **Please use the site persistent Mapbox map** See "Map integration" below. We can add an option to change the basemap.
- [ ] **Render custom dot markers** on the shared map using `setMotionChildren` from `useMap()`. Do not modify the existing marker components (`TierMarkers.tsx`, `TierLocationLabels.tsx`). See "Custom dot markers" under "Map integration" below.
- [ ] **Keep visualization-specific state local** i.e. view mode, color mode, internal search, etc. as `useState`. Only cross-cutting state goes in the store.
- [ ] **Export is already wired**.`EquityPanel` is already exported from `tools/index.ts` (via `tools/panels/equity/EquityPanel.tsx`) and rendered in `ScenarioExplorer.tsx` when `exploreMode === "equity"`.

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
