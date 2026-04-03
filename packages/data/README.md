# @repo/data

Shared data fetching package for COEQWAL applications. Provides a typed integration layer between external APIs and React components with SWR-based caching.

## Architecture

```
External API (api.coeqwal.org)
       ↓
@repo/data (fetchers, types, caching)
       ↓
App-level hooks (compose + enrich) ← import and use these
       ↓
React components
```

**Features:**

- **Deduplication**: Multiple components requesting the same data make only 1 API call
- **Caching**: SWR caches responses with 60s deduplication window
- **Type safety**: Typed fetchers and responses, i.e. no type assertions at consumer level
- **Consistent pattern**: All hooks return `{ <data>, isLoading, error }` where the data property name varies by hook

## Installation

Install in monorepo apps via workspace dependencies.

```json
{
  "dependencies": {
    "@repo/data": "workspace:*"
  }
}
```

```shell
pnpm install
```

## Usage

### Setup

Wrap your app with DataProvider:

```tsx
// app/layout.tsx
import { DataProvider } from "@repo/data/providers"

export default function RootLayout({ children }) {
  return <DataProvider>{children}</DataProvider>
}
```

The DataProvider configures SWR with:

- 60-second deduplication window (data is relatively static)
- No revalidation on focus
- Revalidate on reconnect
- 2 retries with exponential backoff

### Using hooks

Use hooks directly in components:

```tsx
import { useTiers } from "@repo/data/coeqwal/hooks"

function MyComponent() {
  const { tiers, isLoading, error } = useTiers()

  if (isLoading) return <Spinner />
  if (error) return <Error message={error} />

  return <div>{/* render tiers */}</div>
}
```

## Package exports

For external API documentation, see [api.coeqwal.org/docs](https://api.coeqwal.org/docs).

### Hooks

#### `useTiers()`

Fetches tier definitions: short codes (e.g., `AG_REV`), names, and types.

```tsx
import { useTiers } from "@repo/data/coeqwal/hooks"

const { tiers, isLoading, error } = useTiers()
// tiers: TierListItem[] - [{ short_code: "AG_REV", name: "Agricultural Revenue", ... }]
```

#### `useScenarios()`

Fetches scenario definitions: IDs (e.g., `s0020`), names, and active status.

```tsx
import { useScenarios } from "@repo/data/coeqwal/hooks"

const { scenarios, isLoading, error } = useScenarios()
// scenarios: ScenarioListItem[] - [{ scenario_id: "s0020", name: "Baseline", ... }]
```

#### `useScenarioTiers(scenarioId)`

Fetches tier scores for a single scenario.

```tsx
import { useScenarioTiers } from "@repo/data/coeqwal/hooks"

const { chartData, scoreData, rawData, outcomeNames, isLoading, error } =
  useScenarioTiers("s0020")
```

#### `useMultipleScenarioTiers(idMapping?)`

Fetches tier scores for all scenarios in a single batched request via `/api/tiers/batch`. When `idMapping` is provided, fetches only the resolved IDs and re-keys output to sibling group IDs. Uses `keepPreviousData` to avoid loading flashes during hydroclimate switches.

```tsx
import { useMultipleScenarioTiers } from "../../scenarios/hooks"

const { allChartData, allScoreData, allScenariosData, scenarioIds, outcomeNames, isLoading, isValidating, error } =
  useMultipleScenarioTiers(idMapping)
```

> **Prefer `useResolvedScenarioTiers()`** (below) over calling this directly.it handles hydroclimate resolution automatically.

#### `useResolvedScenarioTiers()`

Convenience hook that reads the active hydroclimate from the store, resolves sibling group IDs, and calls `useMultipleScenarioTiers` under the hood. This is the recommended hook for any tool panel that needs tier data.

```tsx
import { useResolvedScenarioTiers } from "../hooks/useResolvedScenarioTiers"

const {
  allChartData, allScoreData, allScenariosData, outcomeNames,
  siblingGroups, getDisplayName, getThemeForScenario,
  idMapping, isLoading, isValidating, error,
} = useResolvedScenarioTiers()
```

### Fetchers

**Prefer hooks** in React components. They handle caching, deduplication, loading states, and errors automatically.

Use fetchers when you need to:

- Fetch data server-side (Next.js Server Components, `getServerSideProps`)
- Build custom hooks with different caching behavior
- Fetch data outside of React (scripts, tests)

| Fetcher | Description |
| --- | --- |
| `fetchTierList()` | Tier definitions (short codes, names, types) |
| `fetchScenarioList()` | All scenario metadata |
| `fetchScenarioTiers(id)` | Tier data for a single scenario |
| `fetchAllScenarioTiers(ids)` | **Batch** tier data for multiple scenarios. Hits `/api/tiers/batch` — one SQL query instead of N individual requests. Falls back to parallel per-scenario requests if the batch endpoint is unavailable. |
| `fetchTierLocationData(id, code)` | Per-location tier assignments for a scenario + outcome (for map/treemap) |

```tsx
import {
  fetchTierList,
  fetchScenarioTiers,
  fetchAllScenarioTiers,
  fetchScenarioList,
  fetchTierLocationData,
} from "@repo/data/coeqwal"

const tiers = await fetchTierList()
const scenarios = await fetchScenarioList()
const scenarioData = await fetchScenarioTiers("s0020")
const allData = await fetchAllScenarioTiers(["s0020", "s0021", "s0029"])
const locations = await fetchTierLocationData("s0020", "CWS_DEL")
```

Fetchers throw `FetchError` on failure:

```tsx
import { FetchError } from "@repo/data/fetching"

try {
  const data = await fetchTierList()
} catch (err) {
  if (err instanceof FetchError) {
    console.log(err.status) // HTTP status code
    console.log(err.endpoint) // The endpoint that failed
    console.log(err.retryable) // Whether retry might help (5xx, 429)
  }
}
```

Fetchers include automatic retry (2 attempts) with exponential backoff for 5xx and 429 errors.

### Cache keys

Cache keys are unique identifiers that SWR uses to store and retrieve cached responses. When multiple components request data with the same key, SWR deduplicates the requests and shares the cached result. Centralizing keys here prevents typos and ensures consistency across the app.

```tsx
import { CACHE_KEYS } from "@repo/data/cache"

// Static keys
CACHE_KEYS.TIER_LIST        // "/api/tiers/list"
CACHE_KEYS.SCENARIOS        // "/api/scenarios"

// Dynamic keys
CACHE_KEYS.scenarioTiers("s0020")              // "/api/tiers/scenarios/s0020/tiers"
CACHE_KEYS.allScenarioTiers(["s0020", ...])    // ["all-scenario-tiers", "s0020", ...]
```

### Types

```tsx
import type {
  TierListItem, // Tier metadata from /api/tiers/list
  TierInfo, // Full tier data including scores
  TierScores, // weighted_score, normalized_score, gini, band_upper, band_lower
  ScenarioTiersResponse, // Response from scenario tiers endpoint
  ScenarioListItem, // Scenario metadata
  TierMapping, // Record<string, string> for lookups
  MultiValueTier, // Multi-value tier with name, type, data array, and total
  MultiValueTierData, // Distribution data for multi-value tiers (tier, value, normalized)
} from "@repo/data/coeqwal"
```

## How to Get Data for a Visualization Tool

This section walks through the full data-fetching flow for a new tool panel in the Scenario Explorer (e.g., the distribution/equity panel).

### Step 1: Get tier data with `useResolvedScenarioTiers`

The sidebar shows 24 scenario strategies. Hydroclimate chooser is on the toolbar. Each strategy has variants for different hydroclimates, which we call "siblings" in the codebase. The `useResolvedScenarioTiers` hook handles all of this automatically. It reads the active hydroclimate from the store, resolves sibling group IDs to the correct variant, fetches tier data in bulk via SWR, and re-keys results back to sibling group IDs.

```typescript
import { useResolvedScenarioTiers } from "../hooks/useResolvedScenarioTiers"

const {
  allChartData,
  allScoreData,
  allScenariosData,
  outcomeNames,
  siblingGroups,
  getDisplayName,
  getThemeForScenario,
  isLoading,
  error,
} = useResolvedScenarioTiers()
```

No need to call `buildIdMapping` or `useMultipleScenarioTiers` directly.

> **Prefetching:** When the Explore tab mounts, tier data for all three hydroclimates is prefetched in the background via `usePrefetchTiers` (in `ScenarioExplorer.tsx`). This uses the batch endpoint (`/api/tiers/batch`) to fetch ~24 scenarios per hydroclimate in a single request. By the time a user switches hydroclimates from the toolbar, the data is already cached.no loading spinner.

> **TODO:** The hydroclimate options and the `HYDROCLIMATE_ID_MAP` mapping are currently hardcoded in `apps/main/app/content/scenarios.ts`. A planned `/api/hydroclimates` endpoint will return the list of hydroclimate options with their metadata (`id`, `short_code`, `name`, `description`, `has_data` flag) directly from the database, making this a single source of truth. This will be implemented once the team finalizes naming and descriptions for the hydroclimates. Until then, the client-side `buildIdMapping()` approach is the correct pattern (encapsulated inside `useResolvedScenarioTiers`).

**What you get back (in addition to `siblingGroups`, `getDisplayName`, `getThemeForScenario`):**

| Property           | Type                                                        | Contents                                                                                     |
| ------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `allChartData`     | `Record<scenarioId, Record<outcomeCode, ChartDataPoint[]>>` | Pre-processed data for bar/distribution charts, keyed by scenario then outcome code          |
| `allScoreData`     | `Record<scenarioId, Record<outcomeCode, OutcomeScoreData>>` | Scores per outcome: `weighted_score`, `normalized_score`, `gini`, `band_upper`, `band_lower` |
| `allScenariosData` | `Record<scenarioId, ScenarioTiersResponse>`                 | Raw API response per scenario (tiers with type, level, data array)                           |
| `outcomeNames`     | `OutcomeInfo[]`                                             | Display-ordered list of `{ shortCode, displayName }`                                         |
| `isLoading`        | `boolean`                                                   | True only on initial load (no data at all). **Not** true during hydroclimate switches.stale data is displayed while the new data loads in the background. |
| `isValidating`     | `boolean`                                                   | True whenever a background fetch is in flight (including HC switches). Use this for a subtle "updating" indicator if desired. |
| `error`            | `string \| null`                                            | Error message if any fetch failed                                                            |

### Step 2: Use the data...it's already cached!

The SWR cache holds tier data for **all available hydroclimates** (prefetched when the Explore tab mounts), so switching hydroclimates returns data instantly from cache too. By the time your tool panel renders, everything is already loaded. Calling `useResolvedScenarioTiers()` just subscribes to that cached data; it does **not** trigger additional API requests.

**Do not** call `useMultipleScenarioTiers`, `fetchAllScenarioTiers`, or `fetchScenarioTiers` to get data for individual scenarios. Just index into `allScenariosData`.

For a tool that compares two scenarios at a time (like the distributional tier visualization):

```typescript
import { useScenarioExplorerStore } from "../store"

const { selectedScenarios, pinnedScenarioIds } = useScenarioExplorerStore()

// Pick the two scenarios to compare
const [scenarioA, scenarioB] = useMemo(() => {
  const pinned = [...pinnedScenarioIds]
  const selected = [...selectedScenarios]
  return [pinned[0] ?? selected[0], selected.find((id) => id !== pinned[0]) ?? selected[1]]
}, [pinnedScenarioIds, selectedScenarios])

// All tier data for both is already in cache. Just index into it.
const tiersA = allScenariosData?.[scenarioA]
const tiersB = allScenariosData?.[scenarioB]

// Access a specific outcome
const cwsA = tiersA?.tiers["CWS_DEL"]
```

For filtering to all selected scenarios:

```typescript
const selectedData = useMemo(() => {
  if (!allScenariosData) return {}
  const result: Record<string, ScenarioTiersResponse> = {}
  for (const id of selectedScenarios) {
    if (allScenariosData[id]) {
      result[id] = allScenariosData[id]
    }
  }
  return result
}, [allScenariosData, selectedScenarios])
```

### Step 3: Map integration (coloring polygons)

The persistent Mapbox map already has polygon geometry baked into its vector tiles — you do **not** need to fetch GeoJSON. To color map polygons by tier level, use the map store:

```typescript
import { useMapActions } from "../../map/store"

const mapActions = useMapActions()

// Tell the map to color polygons for a specific outcome
mapActions.setOutcomeVisualization({
  outcomeCode: "CWS_DEL",
  scenarioId: "s0020",
  tierColorMap: { 1: "#2ecc71", 2: "#3498db", 3: "#e67e22", 4: "#e74c3c" },
})
```

The map layer system reads this state and applies fill colors to the pre-existing Mapbox vector tile polygons. See `@repo/state` README for full map integration details.

> **`fetchTierLocationData`** exists in `@repo/data` for cases where you need the raw per-location tier assignments (location_id, tier_level, location_name) outside the map — e.g., for building a data table or a non-map visualization of individual locations. It returns tier-level metadata, **not** polygon geometry.

### Step 4: Single-scenario fetching (if needed)

For detail views where you need data for just one scenario:

```typescript
import { useScenarioTiers } from "../../scenarios/hooks"

const { chartData, scoreData, rawData, outcomeNames, isLoading, error } =
  useScenarioTiers("s0020")

// chartData["CWS_DEL"] -> ChartDataPoint[]
// scoreData["CWS_DEL"] -> OutcomeScoreData
```

### Migration from standalone fetch calls

If you're porting a standalone prototype (like the distributional tier visualization), here's what replaces each raw `fetch()` call:

| Old (raw fetch)                                | New (turborepo hooks/fetchers)                                |
| ---------------------------------------------- | ------------------------------------------------------------- |
| `fetch('/api/tiers/scenarios/{id}/tiers')`     | `useResolvedScenarioTiers()`.all scenarios, pre-fetched     |
| `fetch('/api/tiers/list')`                     | `useTiers()` from `@repo/data/coeqwal/hooks`                 |
| `fetch('/api/tier-map/{id}/{code}')`           | Not needed.polygon geometry is in the Mapbox vector tiles. Use `mapActions.setOutcomeVisualization()` to color them. |
| `fetch('/api/tier-map/{id}/{code}/locations')` | `fetchTierLocationData(id, code)`.returns per-location tier assignments (no geometry) |
| `fetch('/api/tier-map/scenarios')`             | `siblingGroups` + `getDisplayName()` from `useResolvedScenarioTiers()` |
| Hardcoded scenario ID/title map                | `getDisplayName(id)` from `useResolvedScenarioTiers()`        |
| Fuse.js search index                           | `searchQuery` from `useScenarioExplorerStore()`.sidebar handles filtering |
| Own scenario dropdown                          | Sidebar checkboxes write to `selectedScenarios` in the store  |
| Own hydroclimate picker                        | Toolbar `HydroclimateChooser` writes to `hydroclimatePeriod` in the store |

### Important: don't fetch directly

Do **not** call `fetch()` or the raw fetchers from `@repo/data/coeqwal` directly in your component for tier scores. Use `useResolvedScenarioTiers()` for multi-scenario data (the common case), or `useScenarioTiers(id)` for single-scenario detail views. These hooks:

- Resolve hydroclimate variants automatically (no manual `buildIdMapping` calls)
- Re-key data from resolved IDs back to sibling group IDs
- Use the batch endpoint (`/api/tiers/batch`) under the hood.one SQL query for all scenarios instead of N individual requests
- Pre-populate the SWR cache so individual scenario lookups are instant
- Apply theme colors to chart data
- Return outcomes in the canonical display order

For map polygon coloring, use `mapActions.setOutcomeVisualization()` as shown in Step 3 — the geometry is already in the Mapbox vector tiles.

For advanced use cases like cross-hydroclimate comparisons (fetching data for multiple climates simultaneously), use `buildIdMapping` directly via `useScenarioList`. See `useComparisonData.ts` for an example.

## To add new data sources

1. **Add types** in `src/coeqwal/types.ts`
2. **Add fetcher** in `src/coeqwal/fetchers.ts`
3. **Add cache key** in `src/cache/keys.ts`
4. **Add hook** in `src/coeqwal/hooks/`
5. **Export** from the appropriate index file
