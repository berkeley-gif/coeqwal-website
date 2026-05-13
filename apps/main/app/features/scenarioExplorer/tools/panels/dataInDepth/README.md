# Data explorer

Component hierarchy for the "Explore data in depth" tab.

## Component hierarchy

```
ScenarioExplorer
└── DataExplorerView
    └── CategoryView
        ├── ReservoirStorageSection
        │   ├── StorageTierCharts
        │   └── MonthlyStorageSection
        ├── CwsSection
        │   ├── CwsTierCharts
        │   └── MonthlyCwsSection
        └── AgSection
            ├── AgTierCharts
            └── MonthlyAgSection
```

## Shared components

- `ChartGridProvider` - CSS grid context for chart alignment
- `GridScenarioHeader` - Sticky scenario column headers
- `TierGlyphWithTooltip` - Tier visualization with tooltips
- `PercentileMatrix` (from `@repo/viz`) - Monthly percentile band charts
- `PercentileMatrixSkeleton` - Loading skeleton for percentile charts

## Data hooks

- `useMetricData` - tier data for metrics
- `useBatchStatistics` - batched fetch for storage, CWS, AG, and env_flow.
  Called once in `CategoryView` and threaded into the section components
  that consume the corresponding slices.
- `useMultiScenarioSlots` - stable per-scenario hook fan-out for sections
  not covered by the batch endpoint (refuge, delta, M&I contractors,
  demand units, spill, additional reservoirs)

## Performance: batched fetches

`CategoryView` calls `useBatchStatistics(selectedScenarios)` once and
passes the result down to the sections backed by the batch endpoint
(storage, CWS aggregates, AG aggregates, env_flow). Each section reads
its slice from `batchData` instead of fanning out N individual requests.

```typescript
const { data: batchData, isLoading: isBatchLoading } = useBatchStatistics(
  selectedScenarios,
  { types: ["storage", "cws", "ag", "env_flow"] },
)

<ReservoirStorageSection scenarios={scenarios} batchData={batchData} isBatchLoading={isBatchLoading} />
<CwsSection scenarios={scenarios} batchData={batchData} isBatchLoading={isBatchLoading} />
<AgSection scenarios={scenarios} batchData={batchData} isBatchLoading={isBatchLoading} />
<EnvFlowSection scenarios={scenarios} batchData={batchData} isBatchLoading={isBatchLoading} />
```

The batch endpoint (`/api/statistics/batch`) collapses what was N
scenarios × M sub-queries into a single request whose sub-queries fan
out in parallel server-side.

Sections backed by other endpoints (M&I contractors, demand units,
refuge, delta, spill, additional reservoirs) keep using
`useMultiScenarioSlots`, which calls a fixed number of hook slots so the
hook order stays stable when the scenario list changes mid-render.
