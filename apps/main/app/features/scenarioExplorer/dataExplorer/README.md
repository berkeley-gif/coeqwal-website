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

The components use these data-fetching hooks:

- `useMetricData` - Tier data for metrics
- `useBatchStatistics` - Batch fetch for storage, CWS, and AG data (used in CategoryView)
- `useStorageMonthly` - Reservoir storage percentiles
- `useCwsAggregatesMonthly` - CWS aggregate delivery/shortage
- `useAgAggregatesMonthly` - Agricultural delivery data

## Performance optimization

The `CategoryView` component uses `useBatchStatistics` to prefetch data for all selected scenarios in a single API request. This dramatically reduces load time compared to making individual requests for each scenario and data type.

```typescript
// Example: Prefetch storage, CWS, and AG data for selected scenarios
const { data: batchData, isLoading } = useBatchStatistics(selectedScenarios)

// The batch data is passed to child components for faster rendering
<CwsSection scenarios={scenarios} batchData={batchData} />
<AgSection scenarios={scenarios} batchData={batchData} />
```

The batch endpoint (`/api/statistics/batch`) reduces ~24 individual API requests to just 1 request.
