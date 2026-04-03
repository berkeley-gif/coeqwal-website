# `@repo/state`

Shared state management utilities for the COEQWAL monorepo. Re-exports Zustand and Immer so that all apps use the same version, and provides shared stores (e.g., the drawer store).

## Exports

```typescript
import { create, immer } from "@repo/state/zustand"
import { useDrawerStore } from "@repo/state/drawer"
```

## Store Architecture

Stores in this project use **Zustand with Immer** for immutable updates. Each feature owns its own store file; `@repo/state` provides the shared primitives.

### Cross-cutting vs. local state

The Scenario Explorer store (`scenarioExplorer/store.ts`) demonstrates the pattern that all visualization tools should follow.

**Shared store** holds cross-cutting state that every tool panel needs:

- `selectedScenarios`.the sidebar checkboxes write to it; each tool panel reads it
- `hydroclimatePeriod`.the toolbar's `HydroclimateChooser` writes to it; any panel can pass it to `buildIdMapping()` to get the right scenario IDs for fetching
- `searchQuery`.the sidebar handles search filtering before scenarios reach the panel
- `highlightedScenario`, `pinnedScenarioIds`.enable cross-component hover highlighting and pinning
- `showMap`.controls the map reveal panel
- `selectedTier`.`{ strategy, outcome } | null`, for telling the persistent map which outcome to visualize

When a new visualization tool is added, it automatically gets all of these capabilities by reading from the store.no wiring required.

**Local component state** (`useState`) holds tool-specific settings:

- Chart mode (radar, parallel, parity, etc.)
- Per-chart toggle options (e.g., `radarShowPath`, `deviationShowStaircase`)
- Internal search or filter state within the visualization

This split keeps the store lean and avoids coupling between unrelated tools.

### Store properties for visualization tool developers

The table below lists which store properties a new tool panel should read from or write to.

#### Read from store

| Property              | Type                            | Why your panel needs it                                                                                     |
| --------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `selectedScenarios`   | `string[]`                      | Which scenarios to render. The sidebar checkboxes manage this.                                              |
| `hydroclimatePeriod`  | `string`                        | Pass to `buildIdMapping()` to resolve sibling group IDs to the right scenario codes for the active climate. |
| `highlightedScenario` | `string \| null`                | Scenario the user is hovering in the sidebar. Visually emphasize it in your visualization.                  |
| `pinnedScenarioIds`   | `string[]`                      | Pinned scenarios (persistent across views). Use for side-by-side comparison within your tool.               |
| `selectedTier`        | `{ strategy, outcome } \| null` | Currently selected tier/outcome for map visualization. Read if you need to know what the map is showing.    |

#### Write to store (actions)

| Action                                           | When to call it                                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `setHighlightedScenario(id \| null)`             | When the user hovers a scenario in your visualization, so the sidebar and other panels can highlight it too. |
| `togglePinnedScenario(id)`                       | When the user clicks to pin/unpin a scenario for comparison.                                                 |
| `setSelectedTier({ strategy, outcome } \| null)` | When the user clicks an outcome category in your grid, to drive the persistent map's polygon visualization.  |

#### Not needed by tool panels

Everything else is managed by the layout chrome (sidebar, toolbar, ScenarioExplorer routing) and transparent to your panel: `mainView`, `exploreMode`, `searchQuery`, `showOnlyChosen`, `selectedTheme`, `showThemeBadges`, `showAlternativeBaselines`, `showDefinitions`, `showKeyOperations`, `outcomeDisplayMode`, `sharedScenarioIds`, `showShareDrawer`, `relativeToBaseline`, `highlightBaseline`, `overlayTiers`, `defineOutcome`, `isSortActive`, `showMap`.

### When to use shared store vs. local state

| Use shared store when...                            | Use local state when...                         |
| --------------------------------------------------- | ----------------------------------------------- |
| Multiple components need the same value             | Only one component cares about the value        |
| State must persist across tool-tab switches         | State can reset when the user switches views    |
| Sidebar/toolbar and tool panel need to stay in sync | It's a UI-only toggle (modal open, hover, etc.) |

### Adding a new visualization tool

1. Read `selectedScenarios` and `hydroclimatePeriod` from the store
2. Use `useMultipleScenarioTiers(idMapping)` to fetch tier data for those scenarios
3. Keep all visualization-specific state (view mode, color mode, search within the viz) as local component state
4. Optionally write to `highlightedScenario` or call `togglePinnedScenario` for cross-panel coordination
5. To show data on the map, call `setSelectedTier()` from the explorer store and/or `mapActions.setOutcomeVisualization()` from the map store (see below)

## Persistent Map Integration

The main app has a **persistent Mapbox map** that is always mounted and shared across all views. Tool panels do not create their own map instance. Instead, they describe what to show and the map renders it.

### Architecture

```
EquityPanel
  ↓ calls setSelectedTier({ strategy, outcome })
  ↓ or mapActions.setOutcomeVisualization(outcomeCode, scenarioId)
  ↓
Map store (features/map/store.ts)
  ↓ activeOutcomeVisualization: { outcomeCode, scenarioId }
  ↓
VisualizationLayers (features/map/visualizationLayers/)
  ↓ useOutcomeVisualization() resolves config from OUTCOME_LAYER_REGISTRY
  ↓
OutcomePolygonLayer / TierMarkers / TierLocationLabels / HotspotMarkers
  ↓ applies tier-colored styling to Mapbox vector tile layers or renders React markers
```

### How it works

1. **`mapActions.setOutcomeVisualization(outcomeCode, scenarioId)`**.Sets which outcome to visualize on the map. The outcome code (e.g., `"CWS_DEL"`, `"GW_STOR"`, `"RES_STOR"`) is looked up in `OUTCOME_LAYER_REGISTRY` (`features/map/config/outcomeLayerRegistry.ts`), which defines:

   - Which Mapbox tileset layer to use (demand-units, WBA, delta, reservoir)
   - How to match feature IDs to tier data
   - Tooltip field definitions
   - Camera presets

2. **`VisualizationLayers`** reads from the map store, fetches tier data for the scenario+outcome, builds a `tierColorMap` (feature ID → hex color), and passes it to `OutcomePolygonLayer`, which applies Mapbox `setPaintProperty` calls to color the existing vector tile polygons.

3. **No deck.gl needed.** All polygon geometry is pre-loaded in Mapbox tilesets. The app colors and filters them via Mapbox GL expressions. Point data (env flows, pumping plants, compliance stations) is rendered as React components overlaid on the map.

### Supported outcome layers

| Outcome code    | Layer type   | Mapbox layer            | Geometry |
| --------------- | ------------ | ----------------------- | -------- |
| `CWS_DEL`       | demand-units | `demand-units`          | polygon  |
| `AG_REV`        | demand-units | `demand-units`          | polygon  |
| `GW_STOR`       | wba          | `calsim-wba`            | polygon  |
| `RES_STOR`      | reservoir    | `california-reservoir`  | polygon  |
| `DELTA_ECO`     | delta        | `delta-water`           | polygon  |
| `WRC_SALMON_AB` | river        | `sacramento-river-body` | line     |
| `ENV_FLOWS`     | marker       | (React markers)         | point    |
| `FW_DELTA_USES` | marker       | (React markers)         | point    |
| `FW_EXP`        | marker       | (React markers)         | point    |

### Map panel visibility

The map panel is a 25% transparent reveal area in `UnifiedToolLayout`, toggled by the "Show map" switch in the toolbar. When toggled on:

```typescript
// UnifiedToolLayout automatically does this:
mapActions.setMapMode("explore")
mapActions.setExplorePanelWidth(75) // 100 - 25%
```

Your panel does not need to manage map visibility. The user controls it from the toolbar. If you want the map to show specific data when visible, call `mapActions.setOutcomeVisualization()` in a `useEffect` that responds to user interaction within your panel.

### Example: connecting to the map

```typescript
import { useScenarioExplorerStore } from "../store"
import { mapActions } from "../../map/store"

export default function EquityPanel() {
  const { selectedScenarios, selectedTier, setSelectedTier } =
    useScenarioExplorerStore()

  const handleOutcomeClick = (outcomeCode: string) => {
    const scenarioId = selectedScenarios[0] // or whichever scenario to visualize
    if (!scenarioId) return

    setSelectedTier({ strategy: scenarioId, outcome: outcomeCode })
    mapActions.setOutcomeVisualization(outcomeCode, scenarioId)
  }

  // ...
}
```
