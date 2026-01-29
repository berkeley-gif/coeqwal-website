# @repo/data

Shared data fetching package for COEQWAL applications. Provides a typed integration layer between external APIs and React components with SWR-based caching.

## Architecture

```
External API (api.coeqwal.org)
       ↓
@repo/data (fetchers, types, caching)
       ↓
App-level hooks (compose + enrich)
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

### 1. Wrap your app with DataProvider

```tsx
// app/layout.tsx
import { DataProvider } from "@repo/data/providers"

export default function RootLayout({ children }) {
  return (
    <DataProvider>
      {children}
    </DataProvider>
  )
}
```

The DataProvider configures SWR with our config:
- 60-second deduplication window (our data is relatively static)
- No revalidation on focus (same reason)
- Revalidate on reconnect
- 2 retries with exponential backoff

### 2. Use hooks in components

```tsx
import { useTiers, useScenarios } from "@repo/data/coeqwal/hooks"

function MyComponent() {
  const { tiers, isLoading, error } = useTiers()
  const { scenarios } = useScenarios()

  if (isLoading) return <Spinner />
  if (error) return <Error message={error} />

  return <div>{/* render data */}</div>
}
```

### 3. Compose with app-level hooks

App-level hooks combine data package hooks with local state and transformations. See [useTierData.ts](apps/main/app/features/scenarios/hooks/useTierData.ts) for a full example:

```tsx
// apps/main/app/features/scenarios/hooks/useTierData.ts
export function useScenarioTiers(scenarioId: string | null) {
  // Use shared hooks (cached, deduplicated)
  const { tiers } = useTiers()

  // Fetch scenario-specific data
  const { data: scenarioData } = useSWR(...)

  // Transform API data for UI
  const chartData = useMemo(() => {
    if (!scenarioData || !tiers) return {}
    return processScenarioData(scenarioData, tiers, themeColors)
  }, [scenarioData, tiers, themeColors])

  return { chartData, outcomeNames, isLoading, error }
}
```

## API reference (truncated for sample)

See also [api.coeqwal.org/docs](https://api.coeqwal.org/docs)

### Hooks

#### `useTiers()`
Fetches tier definitions: names, descriptions, and types (single_value vs multi_value). Use this to populate dropdowns, labels, or create a list of tiers.

```tsx
const { tiers, isLoading, error } = useTiers()
// tiers: TierListItem[] — [{ short_code: "AG_REV", name: "Agricultural Revenue", ... }]
```

#### `useScenarios()`
Fetches scenario metadata: IDs, names, and descriptions.

```tsx
const { scenarios, isLoading, error } = useScenarios()
// scenarios: ScenarioListItem[] — [{ scenario_id: "s0020", name: "Baseline", ... }]
```

#### `useScenarioTiers(scenarioId)`
Fetches tier scores for a specific scenario.

```tsx
const { data, isLoading, error } = useScenarioTiers("s0020")
// data: ScenarioTiersResponse — { scenario: "s0020", tiers: { AG_REV: { weighted_score, ... }, ... } }
```

### Fetchers

For potential server-side data fetching or building custom hooks:

```tsx
import { fetchTierList, fetchScenarioTiers, fetchScenarioList } from "@repo/data/coeqwal"

const tiers = await fetchTierList()
const scenarios = await fetchScenarioList()
const scenarioData = await fetchScenarioTiers("s0020")
```

### Cache keys

Cache keys are unique identifiers that SWR uses to store and retrieve cached responses. When multiple components request data with the same key, SWR deduplicates the requests and shares the cached result. Centralizing keys here prevents typos and ensures consistency across the app.

```tsx
import { CACHE_KEYS } from "@repo/data/cache"

// Static keys
CACHE_KEYS.TIER_LIST        // "/api/tiers/list"
CACHE_KEYS.SCENARIOS        // "/api/scenarios"

// Dynamic keys
CACHE_KEYS.scenarioTiers("s0020")           // "/api/tiers/scenarios/s0020/tiers"
CACHE_KEYS.allScenarioTiers(["s0020", ...]) // ["all-scenario-tiers", "s0020", ...]
```

### Types

```tsx
import type {
  TierListItem,        // Tier metadata from /api/tiers/list
  TierInfo,            // Full tier data including scores
  TierScores,          // weighted_score, normalized_score, gini, band_upper, band_lower
  ScenarioTiersResponse,  // Response from scenario tiers endpoint
  ScenarioListItem,    // Scenario metadata
  TierMapping,         // Record<string, string> for lookups
  MultiValueTier,      // Multi-value tier with name, type, data array, and total
  MultiValueTierData,  // Distribution data for multi-value tiers (tier, value, normalized)
} from "@repo/data/coeqwal"
```

## Error handling

The `apiFetcher` provides consistent error handling:

```tsx
import { FetchError } from "@repo/data/fetching"

try {
  const data = await apiFetcher(url)
} catch (err) {
  if (err instanceof FetchError) {
    console.log(err.status)     // HTTP status code
    console.log(err.endpoint)   // The URL that failed
    console.log(err.retryable)  // Whether retry might help (5xx, 429)
  }
}
```

Features:
- Configurable timeout (default 10s)
- Automatic retry on 5xx and 429 errors
- Exponential backoff (1s, 2s, 4s...)

## To add new data sources

1. **Add types** in `src/coeqwal/types.ts`
2. **Add fetcher** in `src/coeqwal/fetchers.ts`
3. **Add cache key** in `src/cache/keys.ts`
4. **Add hook** in `src/coeqwal/hooks/`
5. **Export** from the appropriate index file
