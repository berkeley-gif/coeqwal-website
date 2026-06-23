# `@repo/state`

Shared state-management primitives for the COEQWAL monorepo. Re-exports Zustand and Immer so every app pins the same version, and ships shared stores.

Feature stores (the Scenario Explorer store, the map store, etc.) live in `apps/main` and are built on top of these primitives. This package only provides the shared pieces. See [Feature stores](#feature-stores) for where those are documented.

## Exports

### `@repo/state/zustand`

The Zustand/Immer building blocks every store in the repo composes from. Importing these here (instead of depending on `zustand`/`immer` directly in each app) keeps every package on one version.

| Export       | Re-exported from              | Reach for it when                                                       |
| ------------ | ----------------------------- | ----------------------------------------------------------------------- |
| `create`     | `zustand`                     | Creating a store                                                        |
| `immer`      | `zustand/middleware/immer`    | You want mutable-looking `set((state) => { ... })` immutable updates    |
| `persist`    | `zustand/middleware`          | A store should survive reloads (localStorage / sessionStorage)          |
| `useShallow` | `zustand/react/shallow`       | A selector returns an object/array and you want to skip equal re-renders |

```typescript
import { create, immer, persist, useShallow } from "@repo/state/zustand"
```

### `@repo/state/drawer`

A ready-made Zustand store for the global side drawer (glossary and other panels). Shared so any app or feature can open or close the drawer without owning its state.

```typescript
import { useDrawerStore } from "@repo/state/drawer"

const { isOpen, activeTab, openGlossaryPanel, closeDrawer } = useDrawerStore()
```

State:

| Field         | Type                       | Notes                          |
| ------------- | -------------------------- | ------------------------------ |
| `isOpen`      | `boolean`                  | Whether the drawer is open     |
| `activeTab`   | `TabKey \| null`           | The open tab, `null` if closed |
| `drawerWidth` | `number`                   | Pixel width, defaults to `360` |
| `content`     | `Record<string, unknown>`  | Per-tab content payload        |

Actions: `openDrawer(tab, width?)`, `closeDrawer()`, `setActiveTab(tab | null)`, `setDrawerWidth(width)`, `setDrawerContent(content)`, and the convenience `openGlossaryPanel()`.

## Conventions

Stores in this repo use **Zustand with Immer** for immutable updates. Each feature owns its own store file and builds it from the primitives above; `@repo/state` does not hold feature state itself.

For React subscriptions, prefer narrow selector or slice hooks over reading a whole store object, so components only re-render when the fields they use change.

### Shared store vs. local component state

A recurring decision when building a feature: does a value belong in a shared store, or in `useState` next to the component?

| Use a shared store when...                          | Use local state when...                         |
| --------------------------------------------------- | ----------------------------------------------- |
| Multiple components need the same value             | Only one component cares about the value        |
| State must persist across tool-tab switches         | State can reset when the user switches views    |
| Sidebar/toolbar and a panel need to stay in sync    | It's a UI-only toggle (modal open, hover, etc.) |

Keeping tool-specific settings (chart mode, per-chart toggles, in-view search) as local state keeps shared stores lean and avoids coupling unrelated features.

## Feature stores

The biggest consumer is the Scenario Explorer, which composes a sliced Zustand store from these primitives. That store, the fields a tool panel reads and writes, and the steps for adding a new tool are documented where the code lives, not here:

- **Explorer store overview and slices**: the ["State management"](../../apps/main/app/features/scenarioExplorer/README.md#state-management) section of the Scenario Explorer feature README
- **Which store fields a tool panel uses, and how to add a visualization tool**: the store sections and ["How to add a visualization tool"](../../apps/main/app/features/scenarioExplorer/README.md#how-to-add-a-visualization-tool) in the Scenario Explorer feature README
- **Fetching data for a panel** (`useResolvedScenarioTiers`, etc.): [`packages/data/README.md`](../data/README.md)
- **Map visualization** (`mapActions.setOutcomeVisualization`, etc.): the map store at `apps/main/app/features/map/store.ts`, plus the "Map integration" section of the Scenario Explorer feature README
