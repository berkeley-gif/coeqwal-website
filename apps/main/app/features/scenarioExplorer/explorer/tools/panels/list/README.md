# List tool

Default scenario grid (`ListView`) and shared ordering with the sidebar.

| Piece          | Role                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `ListView.tsx` | Scroll container, pin cap, wires grid                                                                                                 |
| `grid/`        | StrategyGrid, rows, headers, tooltips (public API via `grid/index.ts`)                                                                |
| `tour/`        | List tour module: steps, illustrations, demo effects, info-tooltip sync hook. See [tour subsystem](../../tour/README.md) for context. |

**Ordering:** `../hooks/useOrderedScenarios.ts` (shared with `ScenarioSelectionSidebar`).

**Store:** list fields via `useListSlice()`; selection/share via `useWorkspaceSlice()`.

Full tool docs: [Developer guide](../../../README.md#developer-guide-adding-a-new-visualization-tool).
