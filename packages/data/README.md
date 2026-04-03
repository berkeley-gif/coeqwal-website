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

Fetches tier scores for a specific scenario.

```tsx
import { useScenarioTiers } from "@repo/data/coeqwal/hooks"

const { data, isLoading, error } = useScenarioTiers("s0020")
// data: ScenarioTiersResponse - { scenario: "s0020", tiers: { AG_REV: { weighted_score, ... }, ... } }
```

### Fetchers

**Prefer hooks** in React components. They handle caching, deduplication, loading states, and errors automatically.

Use fetchers when you need to:

- Fetch data server-side (Next.js Server Components, `getServerSideProps`)
- Build custom hooks with different caching behavior
- Fetch data outside of React (scripts, tests)

```tsx
import {
  fetchTierList,
  fetchScenarioTiers,
  fetchScenarioList,
} from "@repo/data/coeqwal"

const tiers = await fetchTierList()
const scenarios = await fetchScenarioList()
const scenarioData = await fetchScenarioTiers("s0020")
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

This section walks through the full data-fetching flow for a new tool panel in the Scenario Explorer (e.g., the Equity panel).

### Step 1: Get the scenario list and hydroclimate mapping

The sidebar shows 24 "sibling groups" (one per strategy). The user picks a hydroclimate period from the toolbar. You need to resolve the selected sibling group IDs to the actual scenario short codes for that hydroclimate.

```typescript
import { useScenarioList } from "../../scenarios/hooks"
import { useScenarioExplorerStore } from "../store"

const { selectedScenarios, hydroclimatePeriod } = useScenarioExplorerStore()
const { buildIdMapping, getDisplayName, siblingGroups } = useScenarioList()

// Resolve sibling group IDs -> actual scenario codes for the active climate
// e.g., { "s0020": "s0020", "s0021": "s0047", ... }
const idMapping = buildIdMapping(hydroclimatePeriod)
```

`buildIdMapping` takes a hydroclimate string (`"historical"`, `"warmer-wetter"`, `"warmer-drier-i"`, etc.) and uses `HYDROCLIMATE_ID_MAP` to look up the numeric ID, then resolves each sibling group to the correct variant's short code. Falls back to the historical variant when a climate variant doesn't exist.

### Step 2: Fetch tier data for the selected scenarios

Pass `idMapping` to `useMultipleScenarioTiers`. It fetches in bulk, caches with SWR, and re-keys the results from resolved IDs back to sibling group IDs so you can look up data using the same IDs as `selectedScenarios`.

```typescript
import { useMultipleScenarioTiers } from "../../scenarios/hooks"

const {
  allChartData,
  allScoreData,
  allScenariosData,
  outcomeNames,
  isLoading,
  error,
} = useMultipleScenarioTiers(idMapping)
```

**What you get back:**

| Property           | Type                                                        | Contents                                                                                     |
| ------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `allChartData`     | `Record<scenarioId, Record<outcomeCode, ChartDataPoint[]>>` | Pre-processed data for bar/distribution charts, keyed by scenario then outcome code          |
| `allScoreData`     | `Record<scenarioId, Record<outcomeCode, OutcomeScoreData>>` | Scores per outcome: `weighted_score`, `normalized_score`, `gini`, `band_upper`, `band_lower` |
| `allScenariosData` | `Record<scenarioId, ScenarioTiersResponse>`                 | Raw API response per scenario (tiers with type, level, data array)                           |
| `outcomeNames`     | `OutcomeInfo[]`                                             | Display-ordered list of `{ shortCode, displayName }`                                         |
| `isLoading`        | `boolean`                                                   | True while any data is being fetched                                                         |
| `error`            | `string \| null`                                            | Error message if any fetch failed                                                            |

### Step 3: Use the data

Filter to the scenarios the user has selected:

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

Access individual outcome data:

```typescript
// Raw tier info for one scenario + one outcome
const cwsTier = allScenariosData["s0020"]?.tiers["CWS_DEL"]
// cwsTier.type: "multi_value" | "single_value"
// cwsTier.weighted_score: number
// cwsTier.normalized_score: number
// cwsTier.data: MultiValueTierData[] (for multi_value types)
// cwsTier.level: number (for single_value types)

// Pre-processed chart data
const chartPoints = allChartData["s0020"]?.["CWS_DEL"]
// ChartDataPoint[] ready for D3 rendering

// Score data for comparisons
const score = allScoreData["s0020"]?.["CWS_DEL"]
// { weighted_score, normalized_score, gini, band_upper, band_lower }
```

### Step 4: Single-scenario fetching (if needed)

For detail views where you need data for just one scenario:

```typescript
import { useScenarioTiers } from "../../scenarios/hooks"

const { chartData, scoreData, rawData, outcomeNames, isLoading, error } =
  useScenarioTiers("s0020")

// chartData["CWS_DEL"] -> ChartDataPoint[]
// scoreData["CWS_DEL"] -> OutcomeScoreData
```

### Important: don't fetch directly

Do **not** call `fetch()` or the raw fetchers from `@repo/data/coeqwal` in your component. Always use the app-level hooks (`useMultipleScenarioTiers`, `useScenarioTiers`, `useScenarioList`) because they:

- Resolve hydroclimate variants via `idMapping`
- Re-key data from resolved IDs back to sibling group IDs
- Pre-populate the SWR cache so individual scenario lookups are instant
- Apply theme colors to chart data
- Return outcomes in the canonical display order

## To add new data sources

1. **Add types** in `src/coeqwal/types.ts`
2. **Add fetcher** in `src/coeqwal/fetchers.ts`
3. **Add cache key** in `src/cache/keys.ts`
4. **Add hook** in `src/coeqwal/hooks/`
5. **Export** from the appropriate index file
