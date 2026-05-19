# List tool

Default scenario grid (`ListView`) and shared ordering with the sidebar.

| Piece           | Role                                                                   |
| --------------- | ---------------------------------------------------------------------- |
| `ListView.tsx`  | Scroll container, pin cap, wires grid                                  |
| `grid/`         | StrategyGrid, rows, headers, tooltips (public API via `grid/index.ts`) |
| `listTour.ts`   | Tour step definitions                                                  |
| `ListTour*.tsx` | Tour illustrations                                                     |

**Ordering:** `../hooks/useOrderedScenarios.ts` (shared with `ScenarioSelectionSidebar`).

**Store:** list fields via `useListSlice()`; selection/share via `useWorkspaceSlice()`.

Full tool docs: [feature README](../../../README.md).
