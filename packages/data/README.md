# @repo/data

Shared data fetching package for COEQWAL applications. Provides a typed integration layer between external APIs and React components with SWR-based caching.

## Architecture

```
External API (api.coeqwal.org)
       |
@repo/data (fetchers, types, caching)
       |
App-level hooks (compose + enrich) <-- import and use these
       |
React components
```

**Features:**

- **Deduplication**: Multiple components requesting the same data make only 1 API call
- **Caching**: SWR caches responses with 60s deduplication window
- **Type safety**: Typed fetchers and responses, i.e. no type assertions at consumer level
- **Consistent pattern**: All hooks return `{ <data>, isLoading, error }` where the data property name varies by hook

**Active-scenario policy:** All tier and tier-map endpoints filter server-side on `tier_result.is_active = TRUE`. API consumers (hooks, fetchers, prefetch routines) never need to filter retired scenarios on the client. If a scenario is retired, it will simply be absent from list endpoints and 404 from per-scenario endpoints.

## Installation (for new apps)

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
// tiers: TierListItem[] - [{
//   short_code: "AG_REV",
//   name: "Agricultural Revenue",
//   description: "Revenue from agricultural water deliveries",
//   tier_type: "multi_value",
//   tier_count: 4
// }, ...]
```

#### `useScenarios()`

Fetches scenario definitions: IDs (e.g., `s0020`), names, and active status.

```tsx
import { useScenarios } from "@repo/data/coeqwal/hooks"

const { scenarios, isLoading, error } = useScenarios()
// scenarios: ScenarioListItem[] - [{
//   short_code: "s0020",
//   run_name: "s0020_DCRadjBL_2020LU_wTUCP",
//   name: "Current operations",
//   short_description: "Baseline scenario with current Delta regulations",
//   is_active: true,
//   hydroclimate_id: 2,
//   baseline_scenario: null,
//   sibling_group: "s0020"
// }, ...]
```

#### `useScenarioTiers(scenarioId)`

Fetches tier scores for a single scenario.

```tsx
import { useScenarioTiers } from "@repo/data/coeqwal/hooks"

const { chartData, scoreData, rawData, outcomeNames, isLoading, error } =
  useScenarioTiers("s0020")

// chartData: Record<outcomeCode, ChartDataPoint[]>
// chartData["CWS_DEL"] -> [{ name: "Tier 1", value: 70, color: "#2ecc71" }, ...]

// scoreData: Record<outcomeCode, OutcomeScoreData>
// scoreData["CWS_DEL"] -> {
//   shortCode: "CWS_DEL", type: "multi_value",
//   weighted_score: 1.8, normalized_score: 0.73,
//   gini: 0.12, band_upper: 0.85, band_lower: 0.61
// }

// rawData: ScenarioTiersResponse
// rawData.tiers["CWS_DEL"] -> {
//   name: "Community Water Systems Delivery", type: "multi_value",
//   weighted_score: 1.8, normalized_score: 0.73, gini: 0.12,
//   data: [{ tier: "tier1", value: 70, normalized: 0.7 },
//          { tier: "tier2", value: 20, normalized: 0.2 },
//          { tier: "tier3", value: 8, normalized: 0.08 },
//          { tier: "tier4", value: 2, normalized: 0.02 }],
//   total: 100
// }

// outcomeNames: OutcomeInfo[]
// [{ shortCode: "CWS_DEL", displayName: "Community Water Systems Delivery" }, ...]
```

#### `useMultipleScenarioTiers(idMapping?)`

Fetches tier scores for all scenarios in a single batched request via `/api/tiers/batch`. When `idMapping` is provided, fetches only the resolved IDs and re-keys output to sibling group IDs. Uses `keepPreviousData` to avoid loading flashes during hydroclimate switches.

```tsx
import { useMultipleScenarioTiers } from "../../scenarios/hooks"

const {
  allChartData,
  allScoreData,
  allScenariosData,
  scenarioIds,
  outcomeNames,
  isLoading,
  isValidating,
  error,
} = useMultipleScenarioTiers(idMapping)
```

> **Prefer `useResolvedScenarioTiers()`** (below) over calling this directly.it handles hydroclimate resolution automatically.

#### `useResolvedScenarioTiers()`

Convenience hook that reads the active hydroclimate from the store, resolves sibling group IDs, and calls `useMultipleScenarioTiers` under the hood. This is the recommended hook for any tool panel that needs tier data.

```tsx
import { useResolvedScenarioTiers } from "../hooks/useResolvedScenarioTiers"

const {
  allChartData,
  allScoreData,
  allScenariosData,
  outcomeNames,
  siblingGroups,
  getDisplayName,
  getThemeForScenario,
  idMapping,
  isLoading,
  isValidating,
  error,
} = useResolvedScenarioTiers()
```

#### `useTierLocationAssignments(scenarioId, tierCode)`

Fetches per-location tier assignments for a single scenario+outcome pair. Returns location-level data (no geometry) — suitable for treemaps, tables, or any visualization that needs to know which locations fall into which tier. Pass `null` for either argument to skip fetching.

```tsx
import { useTierLocationAssignments } from "@repo/data/coeqwal/hooks"

const { data, isLoading, error } = useTierLocationAssignments(
  "s0020",
  "CWS_DEL",
)
// data.locations: TierLocationAssignment[] — all locations with tier_level, location_name, etc.
// data.tier_code: "CWS_DEL"
// data.metadata: { total_locations, tier_counts }

// Conditional fetching (pass null to skip)
const { data } = useTierLocationAssignments(
  selectedScenario ?? null,
  selectedOutcome ?? null,
)
```

#### `useTierLocationAssignmentsBatch(scenarioId, tierCodes)`

Fetches per-location tier assignments for **multiple outcomes** in a single request. Prefer this over calling `useTierLocationAssignments` N times when a panel needs several outcomes at once (equity heatmaps, tier animations, resilience distributions). One SQL query server-side instead of N parallel HTTP calls.

On success the hook also writes each per-code sub-response into the single-hook cache key, so any component using `useTierLocationAssignments(scenarioId, code)` elsewhere in the tree renders instantly from cache.

Pass an empty array or `null` scenario to skip fetching. Codes are deduplicated and sorted internally, so caller ordering does not fragment the cache.

```tsx
import { useTierLocationAssignmentsBatch } from "@repo/data/coeqwal/hooks"
import { OUTCOME_CODE_ORDER } from "@/content/outcomes"

const { data, isLoading, error } = useTierLocationAssignmentsBatch(
  "s0020",
  OUTCOME_CODE_ORDER, // ["CWS_DEL", "AG_REV", "ENV_FLOWS", ...]
)
// data.results["CWS_DEL"].locations: TierLocationAssignment[]
// data.results["AG_REV"].metadata.tier_counts
// data.missing: string[]  e.g. [] or ["WRC_SALMON_AB"] on s0065

// Memoize downstream objects like usual to avoid re-render churn.
const allAssignments = React.useMemo(() => data?.results ?? {}, [data])
```

#### `useScenarioTierByCode(scenarioId, tierCode)`

Parallel to `useScenarioTiers` but scoped to one outcome. Returns aggregate tier scores (weighted_score, normalized_score, gini, distribution data) for a single scenario+outcome pair. Use when a component only cares about one outcome and fetching the full scenario payload would be wasteful. Pass `null` for either argument to skip fetching.

### Fetchers

**Prefer hooks** in React components. They handle caching, deduplication, loading states, and errors automatically.

Use fetchers when you need to:

- Fetch data server-side (Next.js Server Components, `getServerSideProps`)
- Build custom hooks with different caching behavior
- Fetch data outside of React (scripts, tests)

| Fetcher                                          | Description                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetchTierList()`                                | Tier definitions (short codes, names, types)                                                                                                                                                                                                                                                                         |
| `fetchScenarioList()`                            | All scenario metadata. Includes `hydroclimate_short_code` on recent API deployments (prefer over the numeric `hydroclimate_id`).                                                                                                                                                                                     |
| `fetchScenarioTiers(id)`                         | Tier data for a single scenario                                                                                                                                                                                                                                                                                      |
| `fetchScenarioTierByCode(id, code)`              | Tier data for one outcome of one scenario.                                                                                                                                                                                                                                                                           |
| `fetchAllScenarioTiers(ids)`                     | **Batch** tier data for multiple scenarios. Hits `/api/tiers/batch` - one SQL query instead of N individual requests. Falls back to parallel per-scenario requests if the batch endpoint is unavailable.                                                                                                             |
| `fetchTierLocationAssignments(id, code)`         | Per-location tier assignments (no geometry) - lightweight. Use for treemap/tables (see Step 2).                                                                                                                                                                                                                      |
| `fetchTierLocationAssignmentsBatch(id, codes[])` | **Batch** per-location tier assignments for multiple outcomes in one request. Hits `/api/tier-map/{id}/locations?codes=...`. Falls back to parallel per-code requests if the batch endpoint is unavailable.                                                                                                          |
| `fetchTierLocationData(id, code)`                | **Reserved.** GeoJSON FeatureCollection with full polygon geometry - heavy on bandwidth. No current callers; the app uses Mapbox vector tiles for polygon geometry and pairs them with the lightweight `assignments` endpoint above. Retained for future consumers that need server-rendered GeoJSON (e.g. exports). |

```tsx
import {
  fetchTierList,
  fetchScenarioTiers,
  fetchAllScenarioTiers,
  fetchScenarioList,
} from "@repo/data/coeqwal"

const tiers = await fetchTierList()
const scenarios = await fetchScenarioList()
const scenarioData = await fetchScenarioTiers("s0020")
const allData = await fetchAllScenarioTiers(["s0020", "s0021", "s0029"])
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
CACHE_KEYS.tierLocations("s0020", "CWS_DEL")  // "/tier-map/s0020/CWS_DEL/locations"
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

## How to get data for a tier visualization tool

This section walks through the data-fetching flow for a new tool in the Scenario Explorer.

### Step 1: Subscribe to general scenario and tier data (already cached)

Tier data for **all 24 scenarios across all hydroclimates** is prefetched when the Explore tab mounts (via `usePrefetchTiers` in `ScenarioExplorer.tsx`, using the batch endpoint `/api/tiers/batch`). By the time your tool panel renders, everything is already in the SWR cache.

To access it, call `useResolvedScenarioTiers()`. This does not trigger additional API requests. It subscribes to the cached data, keyed to the active hydroclimate. Switching hydroclimate data is instant (should not see the loading spinner).

```typescript
import { useResolvedScenarioTiers } from "../hooks/useResolvedScenarioTiers"
import { useScenarioExplorerStore } from "../store"

const {
  allScenariosData, // Record<scenarioId, ScenarioTiersResponse> - all 24 scenarios
  allChartData, // Pre-processed chart data, keyed by scenario then outcome code
  allScoreData, // Scores per outcome: weighted_score, normalized_score, gini, etc.
  outcomeNames, // Display-ordered list of { shortCode, displayName }
  siblingGroups, // Scenario group metadata
  getDisplayName, // (id) => human-readable scenario name
  getThemeForScenario, // (id) => theme key for color assignment
  isLoading, // True only on initial load - NOT during hydroclimate switches
  isValidating, // True during background fetches (use for subtle "updating" indicator, not really used bc our data is relatively static)
  error,
} = useResolvedScenarioTiers()

const { selectedScenarios, pinnedScenarioIds } = useScenarioExplorerStore()
```

Do not call `useMultipleScenarioTiers`, `fetchAllScenarioTiers`, or `fetchScenarioTiers` for individual scenarios. Just index into `allScenariosData`.

**How hydroclimates work (behind the scenes):**

The app has three hydroclimates currently. Each hydroclimate has its own set of ~24 scenario IDs. These are different model runs but share "sibling group" IDs (e.g., sibling group `s0020` has scenario `s0020` in historical, `s0028` in another, and `s0052` in another hydroclimate).

When the user switches hydroclimates via the toolbar `HydroclimateChooser`, `useResolvedScenarioTiers()` automatically:

1. Reads the active hydroclimate from the store (`hydroclimate`)
2. Looks up which scenario IDs belong to that hydroclimate (via `HYDROCLIMATE_ID_MAP` -> `buildIdMapping`)
3. Returns tier data keyed by sibling group IDs (not the raw scenario IDs)

This means your component code doesn't change when the user switches hydroclimates. `allScenariosData["s0020"]` always returns data for the _active_ hydroclimate's version of that scenario. The hook handles the resolution transparently.

> **Future:** The hydroclimate options and `HYDROCLIMATE_ID_MAP` are currently hardcoded in `apps/main/app/content/scenarios.ts`. A planned `/api/hydroclimates` endpoint will replace this with database-driven metadata (once the team decides it). This won't affect this code. `useResolvedScenarioTiers()` will be updated internally.

### Step 2: Use the data

**Pre-cached (available instantly, loaded on Explore tab activation):**

| Data                                                | How to access                                    | What it contains                                                 |
| --------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| Scenario list + display names                       | `scenarioIds`, `getDisplayName("s0020")`         | Scenario IDs and human-readable names                            |
| Aggregate tier scores (all scenarios, all outcomes) | `allScenariosData?.["s0020"]?.tiers["CWS_DEL"]`  | weighted_score, normalized_score, gini, tier distribution counts |
| Tier list (outcome definitions)                     | `outcomeNames` from `useResolvedScenarioTiers()` | Outcome codes, names, types, display order                       |

**Fetched on demand (first access triggers an API call, then cached by SWR):**

| Data                          | How to access                                      | What it contains                                                                         |
| ----------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Per-location tier assignments | `useTierLocationAssignments(scenarioId, tierCode)` | Every location's tier_level for one scenario+outcome (one request returns all locations) |

All data goes through SWR. Once fetched, everything is cached for subsequent renders. Pre-cached data is bulk-fetched before your component renders; per-location assignments are fetched the first time your component requests a specific scenario+outcome pair.

```typescript
import { useTierLocationAssignments } from "@repo/data/coeqwal/hooks"

// All scenario IDs for the active hydroclimate
const scenarioIds = allScenariosData ? Object.keys(allScenariosData) : []
// ["s0020", "s0021", "s0029", ...]

// Human-readable name for display
getDisplayName("s0020") // "Current operations"

// --- Aggregate scores (pre-cached, instant access) ---

const tiersA = allScenariosData?.["s0020"]
const tiersB = allScenariosData?.["s0021"]

const cwsA = tiersA?.tiers["CWS_DEL"]
// cwsA.weighted_score: 2.5      - average tier level (used for sorting scenarios)
// cwsA.normalized_score: 0.5    - 0-1 normalized (no longer used)
// cwsA.gini: 0.292              - inequality measure (not sure if team wants to use)
// cwsA.total: 76                - total locations
// cwsA.data: [                  - tier distribution counts (used in bar chart glyphs)
//   { tier: "tier1", value: 31, normalized: 0.408 },
//   { tier: "tier2", value: 6, normalized: 0.079 },
//   { tier: "tier3", value: 9, normalized: 0.118 },
//   { tier: "tier4", value: 30, normalized: 0.395 },
// ]

// --- Per-location tier values (fetched on first access, then cached by SWR) ---

// One request per scenario+outcome returns all locations at once.
// Uses the lightweight /locations endpoint (no polygon geometry).
// Do not use fetchTierLocationData. That returns full GeoJSON and is much heavier.
// Pass null to skip fetching conditionally.
const { data: locationsA } = useTierLocationAssignments("s0020", "CWS_DEL")
const { data: locationsB } = useTierLocationAssignments("s0021", "CWS_DEL")
// First call fetches from API; subsequent renders with the same
// scenario+outcome return the cached response instantly.

// locationsA response shape (all 121 locations in one response):
// {
//   scenario: "s0020",
//   tier_code: "CWS_DEL",
//   tier_name: "Community water system deliveries",
//   tier_type: "multi_value",
//   locations: [
//     { location_id: "02_NU", location_name: "02_NU",
//       location_type: "demand_unit", tier_level: 1, tier_value: null, display_order: 1 },
//     { location_id: "03_PU1", location_name: "03_PU1",
//       location_type: "demand_unit", tier_level: 2, tier_value: 1, display_order: 80 },
//     ...121 locations total
//   ],
//   metadata: {
//     total_locations: 121,
//     location_types: ["demand_unit"],
//     tier_counts: { 1: 73, 2: 6, 3: 9, 4: 33 }
//   }
// }
```

### Step 3: Map integration (coloring polygons)

The persistent Mapbox map already has polygon geometry baked into its vector tiles. You do not need to fetch GeoJSON. To color map polygons by tier level, use the map store actions:

```typescript
import { mapActions } from "../../map/store"

// Tell the map to color polygons for a specific outcome (positional args)
mapActions.setOutcomeVisualization("CWS_DEL", "s0020")

// Toggle on/off (clears if the same outcome is already active)
mapActions.toggleOutcomeVisualization("CWS_DEL", "s0020")

// Clear
mapActions.clearOutcomeVisualization()
```

The map layer system reads this state, looks up tier colors from the theme, and applies fill colors to the pre-existing Mapbox vector tile polygons. Tier colors are determined by the theme palette (`theme.palette.tiers.tier1` through `tier4`), not passed by the caller. See the Scenario Explorer README for the full map integration pattern with examples.

**How each outcome type renders on the map:**

| Outcome         | Geometry source                                       | Rendering                                    |
| --------------- | ----------------------------------------------------- | -------------------------------------------- |
| CWS_DEL, AG_REV | Mapbox `demand-units` tileset                         | Polygon fill via `setOutcomeVisualization()` |
| GW_STOR         | Mapbox `calsim-wba` tileset                           | Polygon fill via `setOutcomeVisualization()` |
| RES_STOR        | Mapbox `california-reservoir` tileset                 | Polygon fill + labeled markers               |
| DELTA_ECO       | Mapbox `delta-water` tileset                          | Polygon fill                                 |
| WRC_SALMON_AB   | Mapbox `sacramento-river-body` tileset                | Line layer coloring                          |
| ENV_FLOWS       | **Hardcoded coordinates** in `TierMarkers.tsx`        | React diamond markers                        |
| FW_DELTA_USES   | **Hardcoded coordinates** in `TierLocationLabels.tsx` | React labeled markers                        |
| FW_EXP          | **Hardcoded coordinates** in `TierLocationLabels.tsx` | React labeled markers                        |

> **TODO:** Incorporate **ENV_FLOWS**, **FW_DELTA_USES**, and **FW_EXP** hardcoded coordinates into Mapbox tilesets as dedicated point layers, then remove the hardcoded coordinates from `TierMarkers.tsx` and `TierLocationLabels.tsx` and use `setOutcomeVisualization()` like the other outcomes.

No outcome should fetch GeoJSON from the API for map rendering. The `fetchTierLocationData` (GeoJSON) fetcher exists in `@repo/data` but is currently not called anywhere in the app.

## To add new data sources

1. **Add types** in `src/coeqwal/types.ts`
2. **Add fetcher** in `src/coeqwal/fetchers.ts`
3. **Add cache key** in `src/cache/keys.ts`
4. **Add hook** in `src/coeqwal/hooks/`
5. **Export** from the appropriate index file
