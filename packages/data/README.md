# @repo/data

Shared data fetching package for COEQWAL applications. Provides a typed integration layer between external APIs and React components with SWR-based (stale-while-revalidate) caching. All API data is served through SWR.

Each Next.js app that consumes api data should wrap its tree in DataProvider (typically in `layout.tsx`), which sets SWRConfig once for the whole app.

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

**Active-scenario policy:** All tier endpoints filter server-side on `tier_result.is_active = TRUE`. API consumers (hooks, fetchers, prefetch routines) never need to filter retired scenarios on the client. If a scenario is retired, it will simply be absent from list endpoints and 404 from per-scenario endpoints.

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

## What is SWR?

The COEQWAL viz layer is highly interactive (toolbar toggles, hydroclimate switches, panels mounting and unmounting), so almost everything runs in Client Components (`"use client"`). That is the slice where we need a real client-side data layer. That slice is SWR.

SWR is a small data-fetching library from Vercel. The name is the strategy: **S**tale-**W**hile-**R**evalidate. You hand it a _key_ and a _fetcher_. It hands you back `{ data, error, isLoading }`.

```ts
const { data, error, isLoading } = useSWR(key, fetcher, options)
```

The mental model:

1. SWR keeps a process-wide cache, keyed by `key` (a string or a tuple).
2. When a component mounts and calls `useSWR("foo", fetchFoo)`, SWR checks the cache.
   - **Cache miss**: it calls `fetchFoo()`, stores the result under `"foo"`, returns it.
   - **Cache hit**: it returns the cached value immediately (`isLoading: false`), then optionally re-fetches in the background and re-renders if the value changed.
3. If 12 components all call `useSWR("foo", fetchFoo)` in the same render pass, SWR makes **one** HTTP request and broadcasts the result to all 12. That's deduplication, for free.
4. If you change the key, you get a new cache slot. If two components pass the same key, they share data.

That's the whole library. Everything else - revalidation, retry, preload, mutate - is policy on top of those four facts.

## Cache keys and hooks

A **cache key** is a string (or tuple) that identifies a slot in SWR's in-memory `Map`. Think of it like a memory address. Two components passing the same key are reading from the same slot. Two components passing different keys are looking at different slots, even if the underlying data overlaps.

A **hook** is a thin wrapper around `useSWR(key, fetcher, options)` that does three things:

1. Builds the cache key from its arguments
2. Closes over a fetcher that knows how to populate the slot
3. Subscribes the calling component to the slot so it re-renders when the value changes

### Anatomy of a hook

Every hook in this package is a variant of this five-line shape:

```ts
export function useScenarioTiers(scenarioId: string | null) {
  const { data, error, isLoading } = useSWR(
    scenarioId ? CACHE_KEYS.scenarioTiers(scenarioId) : null, // 1. key (null = skip)
    () => fetchScenarioTiers(scenarioId!), // 2. fetcher
    { revalidateOnFocus: false }, // 3. options
  )
  return { data, isLoading, error: error?.message ?? null }
}
```

Keys live in one file (`src/cache/keys.ts`), fetchers in another (`src/coeqwal/fetchers.ts`), and each hook combines them. Centralizing keys is what guarantees two callers that _think_ they're asking for the same data actually land on the same Map entry, instead of silently making two requests under almost-identical strings.

### Every cache key in the package

Defined in `packages/data/src/cache/keys.ts`. Static keys are plain strings (mirroring API paths so the global fetcher can prepend the base URL); dynamic keys are functions that return a string or tuple.

| Domain                   | Key                                                                                                                                                                              | Shape                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Tier metadata            | `TIER_LIST`                                                                                                                                                                      | `"/api/tiers/list"`                            |
| Scenarios                | `SCENARIOS`                                                                                                                                                                      | `"/api/scenarios"`                             |
| Tier scores (single)     | `scenarioTiers(id)`                                                                                                                                                              | `"/api/tiers/scenarios/{id}/tiers"`            |
| Tier scores (batch)      | `allScenarioTiers(ids)`                                                                                                                                                          | `["all-scenario-tiers", ...sortedIds]`         |
| Tier scores (lazy batch) | `lazyScenarioTiers(ids)`                                                                                                                                                         | `["lazy-scenario-tiers", ...ids]`              |
| Tier locations (single)  | `tierLocations(id, code)`                                                                                                                                                        | `["tier-locations", id, code]`                 |
| Tier locations (batch)   | `tierLocationsBatch(id, codes)`                                                                                                                                                  | `["tier-locations-batch", id, ...sortedCodes]` |
| Reservoir lists          | `STATISTICS_RESERVOIRS_ALL`                                                                                                                                                      | `"/api/statistics/reservoirs"`                 |
| Reservoir percentiles    | `allReservoirPercentiles(id)`, `reservoirPercentilesFiltered(id, ids)`, `groupedReservoirPercentiles(id, group)`                                                                 | per-scenario URLs                              |
| Reservoir spill          | `spillMonthly(id, group)`                                                                                                                                                        | per-scenario URL                               |
| M&I contractors          | `miContractorsMonthly(id, c?)`, `miContractorsPeriod(id, c?)`                                                                                                                    | per-scenario URLs                              |
| Urban demand units       | `DEMAND_UNITS_LIST`, `demandUnitsList(group?)`, `demandUnitsMonthly(id, duId?, group?)`, `demandUnitsShortageMonthly(id, duId?, group?)`, `demandUnitsPeriod(id, duId?, group?)` | static + per-scenario                          |
| AG demand units          | `agDemandUnitsList(filters?)`, `agDemandUnitsDeliveryMonthly(id, duIds?)`, `agDemandUnitsShortageMonthly(id, duIds?)`, `agDemandUnitsPeriod(id, duIds?)`                         | `duIds` sorted before encoding                 |
| Refuge demand units      | `REFUGE_DUS_LIST`, `refugeDusDeliveryMonthly(id, duId?)`, `refugeDusShortageMonthly(id, duId?)`, `refugeDusPeriod(id, duId?)`                                                    | static + per-scenario                          |
| Channels (env flows)     | `CHANNELS_LIST`                                                                                                                                                                  | `"/api/statistics/channels"`                   |
| Delta                    | `deltaMonthly(id, category?)`                                                                                                                                                    | per-scenario                                   |
| Batch statistics         | `batchStatistics(scenarios, types)`                                                                                                                                              | `["batch-statistics", ...scenarios, ...types]` |

> **Why tuple keys?** SWR compares keys structurally, so a tuple lets the same logical request (e.g. "tier data for these N scenarios") share a slot regardless of array identity. List inputs are deduped and sorted inside the key builder so different caller orderings collapse to one entry.

### Every hook in the package

Exported from `@repo/data/coeqwal/hooks` (and `@repo/data/fetching` for `useLocalData`). One row per hook, paired with the cache key it owns and the data shape it returns.

| Domain               | Hook                                               | Cache key                           | What it fetches                                                                                                         |
| -------------------- | -------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Tier metadata        | `useTiers()`                                       | `TIER_LIST`                         | Outcome definitions: short codes, names, tier types, and tier counts for every outcome                                  |
| Tier metadata        | `useTierMapping()`                                 | derived from `useTiers`             | `short_code` -> display-name lookup table, derived in-memory from `useTiers`                                            |
| Scenarios            | `useScenarios()`                                   | `SCENARIOS`                         | Full scenario list: short codes, run names, descriptions, hydroclimate ids, sibling-group ids, and active flags         |
| Tier scores          | `useScenarioTiers(id)`                             | `scenarioTiers(id)`                 | All outcomes for one scenario: weighted score, normalized score, and tier distribution counts                           |
| Tier locations       | `useTierLocationAssignments(id, code)`             | `tierLocations(id, code)`           | Per-location `tier_level` for one scenario+outcome pair (e.g. the demand units for `CWS_DEL`). No geometry              |
| Tier locations       | `useTierLocationAssignmentsBatch(id, codes)`       | `tierLocationsBatch(id, codes)`     | Same as above for multiple outcomes in one HTTP request                                                                 |
| Reservoirs           | `useAllReservoirsList()`                           | `STATISTICS_RESERVOIRS_ALL`         | Full reservoir list with statistics, used to populate the "add reservoir" dropdown                                      |
| Reservoirs           | `useReservoirPercentiles(id, resId)`               | `reservoirPercentilesFiltered(...)` | Monthly storage percentiles (q0-q100) for one reservoir in one scenario                                                 |
| Reservoirs           | `useAllReservoirPercentiles(id)`                   | `allReservoirPercentiles(id)`       | Monthly storage percentiles for every reservoir in one scenario                                                         |
| Reservoirs           | `useGroupedReservoirPercentiles(id, group)`        | `groupedReservoirPercentiles(...)`  | Monthly storage percentiles for one reservoir group (e.g. `"major"`)                                                    |
| Reservoirs           | `useSpillMonthly(id, group)`                       | `spillMonthly(id, group)`           | Monthly spill frequency and spill magnitude statistics                                                                  |
| Reservoirs           | `useReservoirPercentilesByIds(id, reservoirIds)`   | `reservoirPercentilesFiltered(...)` | Percentiles for a list of reservoirs in one scenario (one request per scenario, callers fan out per scenario)           |
| M&I contractors      | `useMiContractorsMonthly(id, contractor?)`         | `miContractorsMonthly(...)`         | Monthly delivery and shortage stats per M&I contractor for one scenario                                                 |
| M&I contractors      | `useMiContractorsPeriod(id, contractor?)`          | `miContractorsPeriod(...)`          | Period-of-record summary per M&I contractor                                                                             |
| Urban demand units   | `useDemandUnitsList(group?)`                       | `demandUnitsList(group?)`           | List of urban demand units. Optional filter by group short_code (e.g. `var_wba`, `var_swp_contractor`)                  |
| Urban demand units   | `useDemandUnitsMonthly(id, duId?, group?)`         | `demandUnitsMonthly(...)`           | Monthly delivery and shortage percentiles per urban demand unit (merged `/monthly`)                                     |
| Urban demand units   | `useDemandUnitsShortageMonthly(id, duId?, group?)` | `demandUnitsShortageMonthly(...)`   | Monthly shortage band, companion to `useDemandUnitsMonthly`. Both hit `/demand-units/monthly`; SWR dedupes              |
| Urban demand units   | `useDemandUnitsPeriod(id, duId?, group?)`          | `demandUnitsPeriod(...)`            | Period-of-record summary per urban demand unit                                                                          |
| AG demand units      | `useAgDemandUnitsList(filters?)`                   | `agDemandUnitsList(filters?)`       | List of AG demand units. Optional filter by hydrologic region (SAC / SJR / TULARE), cs3 type, or provider               |
| AG demand units      | `useAgDemandUnitsDeliveryMonthly(id, duIds?)`      | `agDemandUnitsDeliveryMonthly(...)` | Monthly delivery, demand, GW pumping, and shortage per AG demand unit (merged `/monthly`)                               |
| AG demand units      | `useAgDemandUnitsShortageMonthly(id, duIds?)`      | `agDemandUnitsShortageMonthly(...)` | Monthly shortage band, companion to `useAgDemandUnitsDeliveryMonthly`. Both hit `/ag-demand-units/monthly`; SWR dedupes |
| AG demand units      | `useAgDemandUnitsPeriod(id, duIds?)`               | `agDemandUnitsPeriod(...)`          | Period-of-record summary per AG demand unit                                                                             |
| Refuge               | `useRefugeDemandUnitsList()`                       | `REFUGE_DUS_LIST`                   | List of wildlife refuge demand units                                                                                    |
| Refuge               | `useRefugeDusDeliveryMonthly(id, duId?)`           | `refugeDusDeliveryMonthly(...)`     | Monthly surface-water delivery percentile bands per refuge demand unit (merged `/monthly`)                              |
| Refuge               | `useRefugeDusShortageMonthly(id, duId?)`           | `refugeDusShortageMonthly(...)`     | Monthly shortage band, companion to `useRefugeDusDeliveryMonthly`. Both hit `/refuge-demand-units/monthly`; SWR dedupes |
| Refuge               | `useRefugeDusPeriod(id, duId?)`                    | `refugeDusPeriod(...)`              | Period-of-record summary per refuge demand unit                                                                         |
| Channels (env flows) | `useChannelsList(class?, watershed?)`              | `CHANNELS_LIST` (or filtered URL)   | All CalSim channel reaches with watershed and capability attributes                                                     |
| Delta                | `useDeltaMonthly(id, category?)`                   | `deltaMonthly(id, category?)`       | Monthly Delta statistics: X2 position, salinity compliance, salinity at pumps, outflow, by water-year month             |
| Batch stats          | `useBatchStatistics(scenarios, types?)`            | `batchStatistics(scenarios, types)` | Storage + CWS + AG + env-flow in **one** HTTP request for many scenarios; powers the Data in Depth tool                 |
| Local JSON           | `useLocalData(url, options?)`                      | URL or custom cache key             | Any JSON / GeoJSON file served from `public/` (markers, content files, static lookups)                                  |

Selectors (not hooks themselves) that pair with `useBatchStatistics`: `getStorageForScenario`, `getCwsForScenario`, `getAgForScenario`, `getEnvFlowForScenario` slice the batch response by scenario id.

Every hook returns the same envelope: `{ <data property>, isLoading, error }`. The data property name varies (`tiers`, `scenarios`, `data`, `tierMapping`, `aggregates`, `reservoirs`, `demandUnits`, ...) but `isLoading` and `error` are always there.

> **One key, one hook.** For every cache key, there is exactly one hook that owns it. If two unrelated places in the app want the same data, they call the same hook. They never build the key by hand and call `useSWR` directly. Adding a new endpoint always means a new `(key, fetcher, hook)` triple. Removing one always means removing all three.

## When does the fetch actually happen?

Short answer: **for most visualizations, the fetch already happened**.

Here is the flow for a typical Explore-tab panel:

1. App boots. `DataProvider` mounts. SWR's Map is empty.
2. User clicks the Explore tab. `ScenarioExplorer.tsx` mounts.
3. `usePrefetchTiers()` runs once, calling `preload(key, fetcher)` for every batch endpoint the explorer will need.
4. Those `fetch` calls hit the API. While they're in flight, the Map has an entry for each key holding the in-flight Promise.
5. Responses come back. SWR resolves the promises and writes results into the Map.
6. A panel mounts later. It calls `useScenarioTiers("s0020")` (or similar). The hook builds a key, asks the Map, gets a populated slot, returns the data **in the same render**.

That last step is the punchline. The hook is doing a Map lookup, not an HTTP request. The fetcher argument passed to `useSWR` is the **fallback** that runs only on a cache miss. For warmed keys, it never executes.

Hooks called _outside_ the warmup path (e.g. an outcome the prefetch didn't cover, or a statistics endpoint that isn't preloaded) work the other way around: the slot is empty, the fetcher runs, the result lands in the Map, and the first render shows `isLoading: true`. Subsequent calls with the same key are cache hits like everything else.

### Where preload happens in the codebase

All preload calls live in `apps/main`. The package never preloads (it only defines hooks); the app decides _when_ to fire requests because the app knows what the user is about to do.

#### The big one: `usePrefetchTiers`

The main cache-warming sweep. Lives in `apps/main/app/features/scenarioExplorer/explorer/tools/hooks/usePrefetchTiers.ts`. It is called **exactly once**, near the top of the Explore tab tree:

```tsx
// apps/main/app/features/scenarioExplorer/explorer/useExplorerLifecycle.ts
usePrefetchTiers()
```

That single hook call is what warms the cache for **every scenario in every hydroclimate** (the `allScenarioTiers` batch) plus the per-location batch for each scenario. By the time any panel under the Explore tab mounts, those keys are already populated or in flight.

Inside the hook, the two preload loops look like this:

```ts
for (const { resolvedIds } of perHc) {
  const key = CACHE_KEYS.allScenarioTiers(resolvedIds)
  preload(key, () => fetchAllScenarioTiers(resolvedIds))
}

for (const id of allScenarioIds) {
  const key = CACHE_KEYS.tierLocationsBatch(id, ALL_OUTCOME_CODES)
  preload(key, () => fetchTierLocationAssignmentsBatch(id, ALL_OUTCOME_CODES))
}
```

A `useRef` guard (`didPrefetch.current`) makes sure the warmup runs once per session, not on every store update.

#### The other four: panel-local "warm what I'm about to need"

Smaller, scoped preloads that run when a specific panel or interaction tells us a particular cache slot is about to be needed.

| Where                                                                                             | When                                                  | What it warms                                                                                                   |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `apps/main/app/features/scenarioExplorer/tools/panels/resilience/useResilienceLoiDistribution.ts` | Resilience LOI distribution panel mounts              | `tierLocationsBatch(id, outcomeCodesArr)` for each scenario in the matrix                                       |
| `apps/main/app/features/map/overlays/scenarioPanels/KeyOutcomesPanel.tsx`                         | Key Outcomes panel mounts in the Learn scrollytelling | `scenarioTiers(variantId)` for the panel's `scenarioId` (defaults to `s0020`) across every hydroclimate variant |
| `apps/main/app/features/map/hooks/useMapVisualizationAction.ts`                                   | User selects an outcome on a scenario via the map     | `tierLocationsBatch(id, PREFETCHABLE_TIER_CODES)` for the scenarios the user is about to compare                |

Every call has the same shape:

```ts
preload(CACHE_KEYS.someKey(args), () => fetchSomething(args))
```

The key the preloader passes and the key the consumer hook builds must be **byte-for-byte identical**. If they don't match, the warming silently does nothing and you're back to an on-demand fetch. That is why every key builder lives in one file and sorts list inputs.

### Worked example: the radar chart

`apps/main/app/features/scenarioExplorer/tools/panels/radar/RadarPanel.tsx` is a good case study because the data path is long but every step is a thin layer over the one below it.

How data gets from the API to the chart:

```
1. ScenarioExplorer.tsx mounts
       |
       v
2. usePrefetchTiers() fires
       |   preload(CACHE_KEYS.allScenarioTiers([...resolvedIds]),
       |           () => fetchAllScenarioTiers([...resolvedIds]))
       v
3. HTTP request goes out to /api/tiers/batch
       |
       v
4. Response lands in SWR's Map under the same key
       |
       v
5. RadarPanel.tsx mounts and calls useTierChartData()
       |
       v
6. useTierChartData calls useMultipleScenarioTiers(idMapping)
       |
       v
7. useMultipleScenarioTiers calls useSWR(CACHE_KEYS.allScenarioTiers(fetchIds), ...)
       |
       v
8. Map lookup hits. No network. data returned in the same render.
       |
       v
9. useTierChartData re-keys by sibling group, builds axes, applies theme colors
       |
       v
10. RadarPanel passes the result to <RadarPlot> and the chart paints
```

The two interesting transitions:

- **Step 5 -> 7.** The radar does not import a `@repo/data` hook directly. It imports `useTierChartData`, an app-level composer that calls the package hook plus does hydroclimate resolution, scenario filtering, and color assignment. The package stays pure. The app does the domain-specific shaping.
- **Step 7 -> 8.** This is the payoff. The radar never shows a loading spinner under normal use, because the preload in step 2 fired the instant the user clicked into Explore, and the `useSWR` call in step 7 is just reading what is already in the Map.

A user toggling hydroclimates is the same flow with a different `idMapping`. The new key already has its slot populated from the same step 2 preload (which warms _all_ hydroclimates up front), so the radar swaps datasets without an HTTP round trip. Combined with `keepPreviousData`, the user sees an instant chart swap.

## Data fetching in the Data in Depth tool

The Data in Depth tool (entry point `apps/main/app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/`, rendered by `CategoryView`) loads heavier statistics only after the user picks scenarios to compare. Tier data is light and shared, so the Explore tab prefetches it, but the statistics endpoints here (storage percentiles, CWS monthly delivery and shortage, AG aggregates, env flow, refuge, delta salinity, spill, etc.) are heavier and are visible once selected. The tool uses two fetch lanes plus lazy section rendering, and it does no preload.

### The batch lane

`CategoryView` reads the selected scenarios from the store, resolves them to short codes with `useResolvedSelectedScenarios()`, and makes one batched call.

```ts
const { data: rawBatchData, isLoading: isBatchLoading } = useBatchStatistics(
  resolved.resolvedIds,
  { types: ["storage", "cws", "ag", "env_flow"] },
)
```

`useBatchStatistics` returns four datasets in one response, keyed by API short code. `CategoryView` re-keys the response by sibling-group id with `rekeyByGroup` and passes `batchData` to each section. Re-keying lets the rest of the UI keep speaking sibling-group ids while the API and cache speak short codes. The categories that line up with the batch read from it directly, and the rest use the fan-out lane below.

| Category                | Section component         | Batch slice          |
| ----------------------- | ------------------------- | -------------------- |
| Reservoir storage       | `ReservoirStorageSection` | `batchData.storage`  |
| Community water systems | `CwsSection`              | `batchData.cws`      |
| Agricultural water      | `AgSection`               | `batchData.ag`       |
| Environmental flows     | `EnvFlowSection`          | `batchData.env_flow` |

### The fan-out lane

Everything the batch does not cover uses one shared idiom, `useMultiScenarioSlots`, in `apps/main/app/features/scenarioExplorer/explorer/tools/panels/dataInDepth/hooks/useMultiScenarioSlots.ts`. It calls one `@repo/data` hook per scenario in a stable order, so each scenario keeps its own SWR cache slot and React sees a fixed hook count across renders.

```ts
const results = useMultiScenarioSlots(fetchIds, useReservoirPercentilesByIds)
```

The one rule that matters is that `fetchIds` must be the resolved ids for the active hydroclimate, taken from `useResolvedIdMapping`, and never the raw sibling-group ids. Passing raw ids makes the charts ignore hydroclimate changes. Slots accepts `null` for a scenario that has no variant in the current hydroclimate, which keeps the hook order stable.

What uses the fan-out lane today

- Extra reservoirs added by the user, through `useReservoirPercentilesByIds`
- M&I contractors and urban demand units in `CwsSection`
- Individually added demand units in `CwsSection` and `AgSection`, through the list-filtered urban and ag hooks
- Refuge delivery and shortage in `RefugeSection`
- Spill frequency in `SpillFrequencySection`, through `useSpillMonthly`
- Delta monthly statistics in `DeltaSection`

### The design logic behind two lanes

The split follows the size of the entity pool and how sure we are about the data shape.

- Small bounded pool, so fetch the whole set: Reservoirs, CWS aggregates, AG aggregates, and env flow are small and shared, so the batch pulls the whole set once.
- Large pool, so fetch a small headline set and add individuals on demand: There are many demand units, so the tool shows a headline set and fans out one request per scenario only for the individual entities a user adds.

Concurrent fan-out fires N requests in parallel and leans on HTTP/2 multiplexing over one connection, so a handful of scenarios stays cheap. SWR dedupes repeats across panels, and the batch lane already covers the common categories, so the total request count stays low for a normal session.

### Lazy rendering and no preload

The batch fires as soon as scenarios are selected, but each section mounts only the first time its accordion opens. `CategoryView` tracks `hasBeenExpanded` and gates rendering on it, so a category that is never opened never registers its fan-out hooks. There is no prefetch (yet, until this tool is understood better).

The tier glyphs are the one exception that does preload. They read the tier cache that the Explore tab already warmed with `usePrefetchTiers`, through `useMetricData`, so they render with no extra request.

### Where the fan-out lane could go next

The fan-out lane is deliberately simple, and some of it can be upgraded to a true batch call later, once we understand the data shape for this tool better. A likely model is the tier fetching path, which is set-based on the server (`WHERE tr.scenario_short_code = ANY($1)` in `tier_endpoints.py:383`) and sits behind a server-side cache, so one request covers many scenarios.

The open question is what the sets should be. Tier data reached an optimal shape because the entity set for an outcome is well defined. Until that is settled we do not know which entities should form a default set that is batch-fetched for every scenario, and which should stay on demand through the fan-out lane.

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
//   name: "Current operations",
//   short_description: "Baseline scenario with current Delta regulations",
//   is_active: true,
//   hydroclimate_id: 2,
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
//   weighted_score: 1.8, normalized_score: 0.73
// }

// rawData: ScenarioTiersResponse
// rawData.tiers["CWS_DEL"] -> {
//   name: "Community Water Systems Delivery", type: "multi_value",
//   weighted_score: 1.8, normalized_score: 0.73,
//   data: [
//     { value: 70, normalized: 0.7 },   // index 0 = tier1 (best)
//     { value: 20, normalized: 0.2 },   // index 1 = tier2
//     { value: 8,  normalized: 0.08 },  // index 2 = tier3
//     { value: 2,  normalized: 0.02 },  // index 3 = tier4 (worst)
//   ],
//   total: 100
// }

// outcomeNames: OutcomeInfo[]
// [{ shortCode: "CWS_DEL", displayName: "Community Water Systems Delivery" }, ...]
```

#### `useTierLocationAssignments(scenarioId, tierCode)`

Fetches per-location tier assignments for a single scenario+outcome pair. Returns location-level data (no geometry), suitable for treemaps, tables, or any visualization that needs to know which locations fall into which tier. Pass `null` for either argument to skip fetching.

```tsx
import { useTierLocationAssignments } from "@repo/data/coeqwal/hooks"

const { data, isLoading, error } = useTierLocationAssignments(
  "s0020",
  "CWS_DEL",
)
// data.locations: TierLocationAssignment[], all locations with tier_level, location_name, etc.
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

### App-level tier hooks

These two hooks live in `apps/main`, not in `@repo/data`. They wrap the package hooks with hydroclimate resolution and are the recommended entry point for tier data in a tool panel.

#### `useResolvedScenarioTiers()` (app-level)

Convenience hook that reads the active hydroclimate from the store, resolves sibling group IDs, and calls `useMultipleScenarioTiers` under the hood. This is the recommended hook for any tool panel that needs tier data. It handles hydroclimate resolution automagicically.

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

#### `useMultipleScenarioTiers(idMapping?)` (app-level)

Fetches tier scores for all scenarios in a single batched request via `/api/tiers/batch`. When `idMapping` is provided, fetches only the resolved IDs and re-keys output to sibling group IDs. Uses `keepPreviousData` to avoid loading flashes during hydroclimate switches. Prefer `useResolvedScenarioTiers()` over calling this directly.

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

### Fetchers

**Prefer hooks** in React components. They handle caching, deduplication, loading states, and errors automatically.

Use fetchers when you need to:

- Fetch data server-side (Next.js Server Components, `getServerSideProps`)
- Build custom hooks with different caching behavior
- Fetch data outside of React (scripts, tests)

| Fetcher                                          | Description                                                                                                                                                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fetchTierList()`                                | Tier definitions (short codes, names, types)                                                                                                                                                                       |
| `fetchScenarioList()`                            | Active scenario list. Six fields per row: `short_code`, `name`, `short_description`, `hydroclimate_id`, `sibling_group`, `is_active`.                                                                              |
| `fetchScenarioTiers(id)`                         | Tier data for a single scenario                                                                                                                                                                                    |
| `fetchAllScenarioTiers(ids)`                     | **Batch** tier data for multiple scenarios. Hits `/api/tiers/batch` - one SQL query instead of N individual requests. Falls back to parallel per-scenario requests if the batch endpoint is unavailable.           |
| `fetchTierLocationAssignments(id, code)`         | Per-location tier assignments (no geometry) - lightweight. Use for treemap/tables (see Step 2).                                                                                                                    |
| `fetchTierLocationAssignmentsBatch(id, codes[])` | **Batch** per-location tier assignments for multiple outcomes in one request. Hits `/api/tiers/scenarios/{id}/locations?codes=...`. Falls back to parallel per-code requests if the batch endpoint is unavailable. |

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
CACHE_KEYS.tierLocations("s0020", "CWS_DEL")  // ["tier-locations", "s0020", "CWS_DEL"]
```

### Types

```tsx
import type {
  TierListItem, // Tier metadata from /api/tiers/list
  TierInfo, // Full tier data including scores
  TierScores, // weighted_score and normalized_score
  ScenarioTiersResponse, // Response from scenario tiers endpoint
  ScenarioListItem, // Scenario metadata
  TierMapping, // Record<string, string> for lookups
  MultiValueTier, // Multi-value tier with name, type, data array, and total
  MultiValueTierData, // Distribution entry for multi-value tiers (value, normalized; positional)
} from "@repo/data/coeqwal"
```

## Local files: `useLocalData`

Not every piece of data lives on the API. GeoJSON for map overlays, static marker lists, and content JSON live in `apps/main/public/` and are served as static assets. `useLocalData` is the SWR-flavored loader for those.

```tsx
import { useLocalData } from "@repo/data/fetching"

const { data, isLoading, error } =
  useLocalData<MarkerData[]>("/data/markers.json")
```

It uses the same `useSWR` machinery as the API hooks, so you get the same `{ data, isLoading, error }` envelope and the same automatic deduplication: two components asking for the same file share one `fetch`.

### What it does differently from the API hooks

| Behavior                | API hooks                                  | `useLocalData`                                 |
| ----------------------- | ------------------------------------------ | ---------------------------------------------- |
| Cache key               | `CACHE_KEYS.x(...)` from `cache/keys.ts`   | The URL itself (or a custom `cacheKey` option) |
| Fetcher                 | `apiFetcher` (with retries, `FetchError`)  | Plain `fetch` + `response.json()`              |
| `revalidateOnFocus`     | off                                        | off                                            |
| `revalidateOnReconnect` | on                                         | **off** (local files do not change)            |
| `revalidateIfStale`     | varies by hook                             | **off**                                        |
| `shouldRetryOnError`    | on (file might be transiently unavailable) | **off** (file either exists or it does not)    |

### Options

```tsx
interface UseLocalDataOptions<T, R = T> {
  transform?: (data: T) => R // shape the raw JSON before returning it
  cacheKey?: string // override the default (which is the URL)
  skip?: boolean // conditional fetching, equivalent to passing null
}
```

### Examples

```tsx
// Simple JSON load
const { data, isLoading } = useLocalData<MarkerData[]>("/data/markers.json")

// With a transform (runs in useMemo, so it's stable across renders)
const { data } = useLocalData<RawConfig, ParsedConfig>("/data/config.json", {
  transform: (raw) => parseConfig(raw),
})

// Conditional fetch
const { data } = useLocalData<TileSchema>(ready ? "/data/tiles.json" : null)

// Or equivalently with the skip flag
const { data } = useLocalData<TileSchema>("/data/tiles.json", { skip: !ready })
```

### When to use it (and when not to)

Use `useLocalData` for:

- GeoJSON / TopoJSON consumed by the map (where it is not already in a Mapbox tileset)
- Bundled JSON content like outcome metadata that the team wants the _frontend_ to own
- Configuration files served from `public/`
- Anything that's a real HTTP request to your own origin and benefits from React-level dedup

Do not use it for:

- Data that lives in the database. Add a fetcher and an API hook instead.
- Static constants. If the data is small and never changes, just `import data from "./data.json"` and ship it in the bundle. SWR is overhead you do not need.

The browser's HTTP cache already handles caching for static files. The value `useLocalData` adds is the React-level `{ data, isLoading, error }` shape and the in-process dedup. If you do not need those, a plain `fetch` is fine.

## Tier scores: `weighted_score` vs `normalized_score`

Every multi-value tier row carries two scores. They hold the same information in two presentations, not two different measurements. The choice between them comes down to what encoding each chart needs.

Both are derived from the four normalized tier proportions (`n1..n4`, the share of a scenario's locations in each tier) by `calculate_tier_scores` in the API (`api/coeqwal-api/routes/tier_endpoints.py`):

- **`weighted_score`** - the count-weighted mean tier level, `1.0` (best) to `4.0` (worst):
  `(1·n1 + 2·n2 + 3·n3 + 4·n4) / Σn`. It stays on the native 1-4 tier scale, so **lower is better**.
- **`normalized_score`** - `weighted_score` rescaled to `0.0` (worst) to `1.0` (best) via `(4 - weighted_score) / 3`. The direction is flipped so **higher is better**. No new information, just a uniform axis for visualizations like the radar chart.

Single-value outcomes carry the same pair, derived from the tier level directly.

### Which visualization uses which, and why

| Score              | Used by                                                        | Why                                                                                                                                                                                                                                                   |
| ------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `weighted_score`   | Scenario **sort / comparison**, and the **resilience heatmap** | The heatmap paints each cell one of four tier colors, so it rounds the value into a tier band and looks up the tier palette. It needs the value on the native 1-4 tier scale.                                                                         |
| `normalized_score` | The **radar plot** axes                                        | The radar plots every outcome on one shared axis where outward = better. It maps the score to `[-1, 1]` via `normalized_score * 2 - 1`, so it needs the 0-1, higher-is-better orientation. `weighted_score` would render inverted and need rescaling. |

The bar chart glyph on the List tab and the per-location map coloring use neither aggregate score. They read the raw tier proportions (`data[].normalized`) and the per-location `tier_level` respectively.

## How to get data for a tier visualization tool

This section walks through the data-fetching flow for a new tool in the Scenario Explorer.

### Step 1: Subscribe to general scenario and tier data (already cached)

Tier data for **every scenario across every hydroclimate** is prefetched when the Explore tab mounts (via `usePrefetchTiers` in `ScenarioExplorer.tsx`, using the batch endpoint `/api/tiers/batch`). By the time your tool panel renders, everything is already in the SWR cache.

To access it, call `useResolvedScenarioTiers()`. This does not trigger additional API requests. It subscribes to the cached data, keyed to the active hydroclimate. Switching hydroclimate data is instant (should not see the loading spinner).

```typescript
import { useResolvedScenarioTiers } from "../hooks/useResolvedScenarioTiers"
import { useScenarioExplorerStore } from "../store"

const {
  allScenariosData, // Record<scenarioId, ScenarioTiersResponse> - every scenario
  allChartData, // Pre-processed chart data, keyed by scenario then outcome code
  allScoreData, // Scores per outcome: weighted_score and normalized_score
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

The hydroclimates the app supports are listed in the canonical `HYDROCLIMATES` const in `apps/main/app/content/scenarios.ts` (every other hydroclimate constant and type derives from it). Each hydroclimate has its own set of scenario IDs. These are different model runs but share "sibling group" IDs (e.g., sibling group `s0020` has scenario `s0020` in historical, and other scenario IDs in the other hydroclimates).

When the user switches hydroclimates via the toolbar `HydroclimateChooser`, `useResolvedScenarioTiers()` automatically:

1. Reads the active hydroclimate from the store (`hydroclimate`)
2. Looks up which scenario IDs belong to that hydroclimate (via `HYDROCLIMATE_ID_MAP` and `useResolvedIdMapping`)
3. Returns tier data keyed by sibling group IDs (not the raw scenario IDs)

This means your component code doesn't change when the user switches hydroclimates. `allScenariosData["s0020"]` always returns data for the _active_ hydroclimate's version of that scenario. The hook handles the resolution transparently.

> **Future:** The canonical list (`HYDROCLIMATES`), its string-to-id map (`HYDROCLIMATE_ID_MAP`), and the chooser options are all currently hardcoded in `apps/main/app/content/scenarios.ts`. A planned `/api/hydroclimates` endpoint will replace these with database-driven metadata (once the team decides it). This won't affect this code. `useResolvedScenarioTiers()` will be updated internally.

### Step 2: Use the data

**Pre-cached (available instantly, loaded on Explore tab activation):**

| Data                                                | How to access                                    | What it contains                                               |
| --------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| Scenario list + display names                       | `scenarioIds`, `getDisplayName("s0020")`         | Scenario IDs and human-readable names                          |
| Aggregate tier scores (all scenarios, all outcomes) | `allScenariosData?.["s0020"]?.tiers["CWS_DEL"]`  | weighted_score, normalized_score, and tier distribution counts |
| Tier list (outcome definitions)                     | `outcomeNames` from `useResolvedScenarioTiers()` | Outcome codes, names, types, display order                     |

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
// cwsA.normalized_score: 0.5    - 0-1 normalized (radar plot Y-axis)
// cwsA.total: 76                - total locations
// cwsA.data: [                  - tier distribution counts (used in bar chart glyphs)
//   { value: 31, normalized: 0.408 },  // index 0 = tier1 (best)
//   { value: 6,  normalized: 0.079 },  // index 1 = tier2
//   { value: 9,  normalized: 0.118 },  // index 2 = tier3
//   { value: 30, normalized: 0.395 },  // index 3 = tier4 (worst)
// ]

// Per-location tier values (fetched on first access, then cached by SWR)

// One request per scenario+outcome returns all locations at once.
// Uses the lightweight /locations endpoint (no polygon geometry).
// Polygon geometry is served by Mapbox vector tiles. The API never returns geometry.
// Pass null to skip fetching conditionally.
const { data: locationsA } = useTierLocationAssignments("s0020", "CWS_DEL")
const { data: locationsB } = useTierLocationAssignments("s0021", "CWS_DEL")
// First call fetches from API; subsequent renders with the same
// scenario+outcome return the cached response instantly.

// locationsA response shape (all locations in one response):
// {
//   scenario: "s0020",
//   tier_code: "CWS_DEL",
//   tier_name: "Community water system deliveries",
//   tier_type: "multi_value",
//   locations: [
//     { location_id: "02_NU", location_name: "02_NU",
//       location_type: "demand_unit", tier_level: 1, tier_value: null },
//     { location_id: "03_PU1", location_name: "03_PU1",
//       location_type: "demand_unit", tier_level: 2, tier_value: 1 },
//     ...all locations
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

No outcome can fetch GeoJSON from the API for map rendering. The API does not serve geometry. Polygon and point geometry comes from Mapbox vector tiles (see [packages/map/README.md](../map/README.md#adding-new-tile-data-via-mapbox-tiling-service)), joined to the lightweight `/locations` assignments by `location_id`.

## TL;DR: bringing data into a visualization

If you are building a new panel and need data, here is the checklist.

### If the data is already in `@repo/data`

1. Pick the right hook from `@repo/data/coeqwal/hooks`.
2. For tier data, the answer is almost always `useResolvedScenarioTiers()`. Do not call `useMultipleScenarioTiers` or `fetchAllScenarioTiers` directly. The "resolved" wrapper handles hydroclimate.
3. Destructure `{ data, isLoading, error }`. Render the three states.

```tsx
"use client"
import { useResolvedScenarioTiers } from "../hooks/useResolvedScenarioTiers"

export function MyPanel() {
  const { allScenariosData, outcomeNames, isLoading, error } =
    useResolvedScenarioTiers()

  if (isLoading) return <Spinner />
  if (error) return <ErrorState message={error} />

  return <MyChart data={allScenariosData} outcomes={outcomeNames} />
}
```

That is it. Caching, dedup, hydroclimate resolution, and batch write-back all happen for you.

### If you need a new endpoint

Five steps, all inside `packages/data`:

1. **Add types** in `src/coeqwal/types.ts`
2. **Add fetcher** in `src/coeqwal/fetchers.ts` (it should call `apiFetcher` and throw `FetchError`)
3. **Add cache key** in `src/cache/keys.ts` (mirror the URL path; sort and dedupe list inputs)
4. **Add hook** in `src/coeqwal/hooks/` (use `useSWR(key, fetcher)`, return `{ <data>, isLoading, error }`, accept `null` to skip)
5. **Export** from the appropriate index file

If the new endpoint will be heavily used at the top of the Explore tab tree, add a `preload(key, fetcher)` call to `usePrefetchTiers` so consumers get instant cache hits.

## What else to know

A grab bag of patterns and pitfalls worth internalizing.

### Things to do

- **Pass `null` as the input to skip a fetch.** Every hook supports this. It is the canonical way to gate a request behind a condition. Never write `if (cond) useSWR(...)` - that breaks the rules of hooks.
- **Sort and dedupe list inputs before they reach a cache key.** This is done automatically inside the key builders that take arrays. If you write a new one, do the same. Different orderings of the same list must map to the same slot.
- **Memoize the data returned from a hook.** `data` from SWR is a stable reference between identical responses, but objects derived from it inside a component re-create each render. Wrap them in `useMemo` if they feed downstream `useEffect` or memoized children.
- **Prefer hooks over fetchers in React components.** Fetchers are for server-side rendering, scripts, tests, or anywhere outside React. Inside React, hooks give you dedup, caching, and loading state for free.
- **Use `mutate(key, value, { revalidate: false })` to write batch results back to single-item slots.** This is what `useTierLocationAssignmentsBatch` and `useMultipleScenarioTiers` already do internally. If you add a new batch hook, do the same.

### Things to avoid

- **Do not build URLs in components.** Always go through a hook or, when you must, a fetcher. The cache-key file is the only source of truth for URL shapes.
- **Do not put server data in Zustand.** The store is for UI state (selections, toggles, hovered IDs). SWR is for server data. Crossing these wires creates a race between two caches.
- **Do not call `useScenarioTiers` for every scenario in a loop.** Use `useMultipleScenarioTiers` (or its app-level wrapper `useResolvedScenarioTiers`), which hits the batch endpoint.
- **Do not fetch GeoJSON from the API for map rendering.** The API does not serve geometry. The map uses Mapbox vector tiles for geometry and pairs them with the lightweight `assignments` endpoint to color polygons.

### Loading states

- **`isLoading`** is `true` only on the very first fetch for a key. Use it for the initial spinner.
- **`isValidating`** flips to `true` during background refetches (e.g. after `mutate(key)` triggers a revalidation). Use it for subtle "updating" indicators, not the main spinner. Most COEQWAL panels never show it because we have revalidation turned off.
- **`keepPreviousData: true`** keeps the prior value visible while a new fetch resolves. Use this when the key changes during user interaction (hydroclimate switching is the canonical case) so the chart does not flash empty.

### Errors

- Fetchers throw `FetchError` with `{ status, endpoint, retryable }` properties. Use `err instanceof FetchError` to handle API failures with granularity (e.g. show a different message for 404 vs 500).
- Hooks coerce the SWR error to a string and return it as `error`. The string is `err.message` or `String(err)`. If you need the structured `FetchError`, call the fetcher directly.
- Retries (2 attempts, exponential backoff) happen inside the fetcher for 5xx and 429. By the time an error reaches the hook, the retry budget is already spent.

### Server Components

`@repo/data` is built primarily for Client Components (the `useSWR` hooks need a browser). For Server Component data (e.g. SEO content, layout-time data), import the fetchers directly:

```tsx
// app/some-route/page.tsx (Server Component)
import { fetchScenarioList } from "@repo/data/coeqwal"

export default async function Page() {
  const scenarios = await fetchScenarioList()
  return <ScenarioListServer scenarios={scenarios} />
}
```

Server-rendered data does not hydrate into the SWR cache automatically. If you need both, fetch in the Server Component and pass the result as the `fallback` option on a child `<SWRConfig>`.

### Hydroclimates

Hydroclimate resolution is an app-level concern, not a package one. The `@repo/data` hooks operate on raw scenario short codes. The app-level hooks (`useResolvedScenarioTiers`, `useTierChartData`, etc.) read the active hydroclimate from the store and re-key results to sibling group IDs. Component code should always go through the app-level wrappers and treat sibling group IDs as the canonical identifier.

### Adding a new app

Workspace setup for a new app in `apps/*`:

1. Add `"@repo/data": "workspace:*"` to the app's `package.json`.
2. Run `pnpm install`.
3. Wrap the app's `layout.tsx` (or equivalent) in `<DataProvider>`.
4. Import hooks from `@repo/data/coeqwal/hooks` and use them as documented above.

The package is environment-agnostic. The `apiBaseUrl` defaults to `DEFAULT_API_BASE` but can be overridden per app via `<DataProvider apiBaseUrl={...}>`.
