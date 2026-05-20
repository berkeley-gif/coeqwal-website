# Explorer store

One Zustand instance composed from slices. Organizational only at runtime.

| Slice file                | Scope                                              |
| ------------------------- | -------------------------------------------------- |
| `workspaceStoreSlice.ts`  | Selection, share tray, toolbar, hydroclimate, tour |
| `listStoreSlice.ts`       | Filters, sort, pins                                |
| `radarStoreSlice.ts`      | Radar axes and display toggles                     |
| `equityStoreSlice.ts`     | Distribution comparison                            |
| `resilienceStoreSlice.ts` | Heatmap control fields                             |

**Hooks:** `useWorkspaceSlice`, `useListSlice`, etc. in `useToolSlices.ts`.

**Persistence:** sessionStorage envelope in `exploreSessionPersist.ts`. Share tray in `share/persist.ts` (localStorage).

**Shell vs tools:** `scenarioExplorer/store.ts` holds `mainView` only. This folder is the tools store (`useExplorerStore`).

**Adding a new tool slice:** see [Developer guide: adding a new visualization tool](../../README.md#developer-guide-adding-a-new-visualization-tool) (State: when to add a store slice).

Full architecture: [feature README](../../README.md#explore-session-persistence-sessionstorage).
