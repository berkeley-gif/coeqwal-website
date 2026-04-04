# `@repo/state`

Shared state management utilities for the COEQWAL monorepo. Re-exports Zustand and Immer so that all apps use the same version, and provides shared stores (e.g., the drawer store).

## Exports

```typescript
import { create, immer } from "@repo/state/zustand"
import { useDrawerStore } from "@repo/state/drawer"
```

## Store architecture

Stores in this project use **Zustand with Immer** for immutable updates. Each feature owns its own store file; `@repo/state` provides the shared primitives.

### Cross-cutting vs. local state

The Scenario Explorer store (`scenarioExplorer/store.ts`) demonstrates the pattern that all visualization tools should follow.

**Shared store** holds cross-cutting state that every tool panel needs:

- `selectedScenarios` - the sidebar checkboxes write to it; each tool panel reads it
- `hydroclimatePeriod` - the toolbar's `HydroclimateChooser` writes to it; data hooks use it to resolve the right scenario IDs automatically
- `searchQuery` - the sidebar handles search filtering before scenarios reach the panel
- `highlightedScenario`, `pinnedScenarioIds` - enable cross-component hover highlighting and pinning
- `showMap` - controls the map reveal panel

When a new visualization tool is added, it automatically gets all of these capabilities by reading from the store - no wiring required.

**Local component state** (`useState`) holds tool-specific settings:

- Chart mode (radar, parallel, parity, etc.)
- Per-chart toggle options (e.g., `radarShowPath`, `deviationShowStaircase`)
- Internal search or filter state within the visualization

This split keeps the store lean and avoids coupling between unrelated tools.

### Store properties for visualization tool developers

The table below lists which store properties a new tool panel should read from or write to.

#### Read from store

| Property              | Type             | Why your panel needs it                                                                       |
| --------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| `selectedScenarios`   | `string[]`       | Which scenarios to render. The sidebar checkboxes manage this.                                |
| `hydroclimatePeriod`  | `string`         | Passed to `useResolvedScenarioTiers()`, which handles hydroclimate resolution for you.        |
| `highlightedScenario` | `string \| null` | Scenario the user is hovering in the sidebar. Visually emphasize it in your visualization.    |
| `pinnedScenarioIds`   | `string[]`       | Pinned scenarios (persistent across views). Use for side-by-side comparison within your tool. |

#### Write to store (actions)

| Action                               | When to call it                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `setHighlightedScenario(id \| null)` | When the user hovers a scenario in your visualization, so the sidebar and other panels can highlight it too. |
| `togglePinnedScenario(id)`           | When the user clicks to pin/unpin a scenario for comparison.                                                 |

For map visualization, use `mapActions.setOutcomeVisualization()` from the **map store** (`features/map/store.ts`), not the explorer store. See the "Map integration" section in `apps/main/app/features/scenarioExplorer/README.md`.

#### Not needed by tool panels

Everything else is managed by the layout chrome (sidebar, toolbar, ScenarioExplorer routing) and transparent to your panel: `mainView`, `exploreMode`, `searchQuery`, `showOnlyChosen`, `selectedTheme`, `showThemeBadges`, `showAlternativeBaselines`, `showDefinitions`, `showKeyOperations`, `outcomeDisplayMode`, `sharedScenarioIds`, `showShareDrawer`, `relativeToBaseline`, `highlightBaseline`, `overlayTiers`, `defineOutcome`, `isSortActive`, `showMap`, `selectedTier`.

### When to use shared store vs. local state

| Use shared store when...                            | Use local state when...                         |
| --------------------------------------------------- | ----------------------------------------------- |
| Multiple components need the same value             | Only one component cares about the value        |
| State must persist across tool-tab switches         | State can reset when the user switches views    |
| Sidebar/toolbar and tool panel need to stay in sync | It's a UI-only toggle (modal open, hover, etc.) |

### Adding a new visualization tool

1. Read `selectedScenarios` and `hydroclimatePeriod` from the store
2. Use `useResolvedScenarioTiers()` to fetch tier data (handles hydroclimate resolution automatically). See `packages/data/README.md` for the full data-fetching walkthrough.
3. Keep all visualization-specific state (view mode, color mode, search within the viz) as local component state
4. Optionally write to `highlightedScenario` or call `togglePinnedScenario` for cross-panel coordination
5. To show data on the map, use `mapActions.setOutcomeVisualization()`. For custom dot markers, use `setMotionChildren` from `useMap()`. See the "Map integration" section in `apps/main/app/features/scenarioExplorer/README.md` for the full pattern and code examples.
