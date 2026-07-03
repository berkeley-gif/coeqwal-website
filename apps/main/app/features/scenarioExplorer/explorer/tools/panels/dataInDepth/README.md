# Data in Depth

The explore "Data in depth" tab. Given the user's selected scenarios, it
renders a stack of expandable category accordions (community water,
agricultural water, environmental flows, refuges, delta, reservoir storage,
groundwater, salmon). Each category owns a section component that draws the
charts for that outcome group.

## Folder layout

```
dataInDepth/
├── DataExplorerView.tsx        Entry point: empty state, or renders CategoryView
├── components/
│   ├── CategoryView.tsx        Thin orchestrator: accordions + batch fetch + routing
│   ├── sections/               One component per category (+ reservoir sub-pieces)
│   │   ├── ReservoirStorageSection.tsx   Reservoir storage section
│   │   ├── ReservoirPercentilesSection.tsx  Storage percentile matrix
│   │   ├── SpillFrequencySection.tsx        Spill matrix (see Planned features)
│   │   ├── CwsSection.tsx          Community water systems section
│   │   ├── AgSection.tsx           Agricultural water section
│   │   ├── EnvFlowSection.tsx      Environmental river flows section
│   │   ├── RefugeSection.tsx       Wildlife refuge section
│   │   ├── DeltaSection.tsx        Delta inflow/export/outflow/salinity/X2 section
│   │   └── MetricCard.tsx          Generic per-metric card (tier viz or "coming soon")
│   └── shared/                 Structural + shared building blocks
│       ├── ExpandableSection.tsx   Sticky header + expand-to-modal scaffolding
│       ├── BandsLegend.tsx         Shared percentile-band legend component
│       ├── SectionHeader.tsx       Section title + description
│       ├── AlignedScenarioGrid.tsx Grid header + row primitives
│       ├── ChartGridContext.tsx    ChartGridProvider: CSS grid context for alignment
│       ├── PercentileMatrixSkeleton.tsx  Loading skeleton
│       ├── chartConstants.ts       Shared layout constants (TIER_CHART_SIZE)
│       ├── categoryAccordionStyles.ts    Accordion/summary/icon-chip style helpers
│       └── sectionTypes.ts         Shared section prop contracts
├── hooks/
│   ├── useMetricData.ts        Tier data for a single metric across scenarios
│   ├── useResolvedSelectedScenarios.ts  Resolve workspace selection to ids
│   ├── useMultiScenarioSlots.ts      Stable per-scenario hook fan-out
│   ├── useCwsData.ts           CWS fetching + fan-out layer (React hooks)
│   ├── cwsTransforms.ts        CWS pure data shaping (no React)
│   ├── useAgData.ts            AG data layer (aggregates + demand units)
│   ├── useDeltaData.ts         Delta data layer (delta/monthly + channel flows)
│   └── useEnvFlowData.ts       Env-flow data layer (volume + % unimpaired matrices)
└── config/
    ├── outcomeDefinitions.ts   Pure config: metrics, types, color + lookup helpers
    ├── outcomeCategories.tsx   Category icons (JSX) paired with outcomeCategoryMeta
    └── bandColors.ts           Percentile-band color ramps (move to theme once final)
```

## How a section works

Each section is a thin orchestrator:

1. It receives `scenarios` + `scenarioNames`, and (for batch-backed sections)
   `batchData` + `isBatchLoading` (see the `sectionTypes.ts` contracts
   `FanoutSectionProps` / `BatchSectionProps`).
2. It calls a `use*Data` hook from `hooks/` to shape raw API rows into the
   `PercentileMatrix` / `SpillMatrix` data shapes.
3. It wires the resulting matrices + per-cell stats into the viz components,
   laying them out with `ChartGridProvider` so every scenario column lines up.

Data shaping lives in the `use*Data` hooks, not in the components. Band color
ramps are defined in `config/bandColors.ts` and the legend component is shared
via `BandsLegend.tsx`. This keeps each section file focused on layout and
wiring.

## Section status

| Category            | Section                   | Data source                       | Status    |
| ------------------- | ------------------------- | --------------------------------- | --------- |
| reservoir-storage   | `ReservoirStorageSection` | batch `storage`                   | live      |
| community-water     | `CwsSection`              | batch `cws` + per-DU              | live      |
| agricultural-water  | `AgSection`               | batch `ag` + per-DU               | live      |
| env-flow-statistics | `EnvFlowSection`          | batch `env_flow`                  | live      |
| environmental-water | `RefugeSection`           | fan-out (refuge)                  | live      |
| delta-salinity      | `DeltaSection`            | delta/monthly + env_flow channels | live      |
| groundwater-storage | tier `MetricCard`s        | tier API                          | tier only |
| salmon-abundance    | tier `MetricCard`s        | tier API                          | tier only |

Categories without a custom section fall through to `MetricCard`, which renders
the tier glyphs for tier metrics and a "coming soon" placeholder for non-tier
metrics that have no chart yet.

## Data model: batched

`CategoryView` calls `useBatchStatistics(selectedScenarios)` once and threads
the result into the batch-backed sections. Each section reads its slice
(`batchData.storage`, `.cws`, `.ag`, `.env_flow`) instead of issuing N requests.

```typescript
const { data: batchData, isLoading: isBatchLoading } = useBatchStatistics(
  selectedScenarios,
  { types: ["storage", "cws", "ag", "env_flow"] },
)

<ReservoirStorageSection scenarios={...} batchData={batchData} isBatchLoading={isBatchLoading} />
<CwsSection scenarios={...} batchData={batchData} isBatchLoading={isBatchLoading} />
<AgSection scenarios={...} batchData={batchData} isBatchLoading={isBatchLoading} />
<EnvFlowSection scenarios={...} batchData={batchData} isBatchLoading={isBatchLoading} />
```

The batch endpoint (`/api/statistics/batch`) collapses N scenarios × M
sub-queries into a single request whose sub-queries fan out in parallel
server-side.

Sections (or rows) backed by other endpoints (refuge, delta `delta/monthly`,
M&I contractors, individual demand units, spill, additional reservoirs) use
`useMultiScenarioSlots`. It calls a fixed number of hook "slots" so the hook
order stays stable when the scenario list changes mid-render (Rules of Hooks).
The slot count (`MAX_FETCH_SLOTS`) must match `MAX_DATA_IN_DEPTH_SCENARIOS`
(`config/scenarioLimit.ts`), the cap on how many scenarios Data in Depth
compares at once. That cap is applied in `CategoryView` (column rendering) and
`useResolvedSelectedScenarios` (the batch fetch), and is local to Data in Depth
so other tools still see the full selection. The inner hooks self-gate on empty
id lists, so no request fires until data is actually requested.

## Shared building blocks

- `ExpandableSection` (`ExpandableSection.tsx`) - sticky scenario header plus the expand-to-fullscreen modal, shared by the CWS, AG, and reservoir storage sections via a `renderBody(isModal)` callback
- `ChartGridProvider` (`ChartGridContext.tsx`) - CSS grid context for column alignment
- `GridScenarioHeader` / `GridRow` (`AlignedScenarioGrid.tsx`) - sticky headers + rows
- `PercentileMatrix`, `SpillMatrix` (from `@repo/viz`) - the chart renderers
- `PercentileMatrixSkeleton` - loading skeleton for percentile charts
- `BandLegend` (`BandsLegend.tsx`) - shared legend, with band color ramps from `config/bandColors.ts`
- `OverlappingBandsLegend` (`OverlappingBandsLegend.tsx`) - the "Overlapping percentile bands" legend plus a caption, used in a section header description (`colors`, `caption`)
- `AddEntityPicker` (`AddEntityPicker.tsx`) - grouped select plus "Add" button for pulling an extra entity into a section (`value`, `onChange`, `groups`, `onAdd`)
- `AddedEntityChips` (`AddedEntityChips.tsx`) - removable chip row for entities a user has added (`items`, `onRemove`)
- `DataAvailabilityNotice` (`DataAvailabilityNotice.tsx`) - amber strip warning that the requested data is not available in the current view
- `TierGlyphWithTooltip` - tier visualization with tooltips

The CWS and AG sections share this kit. As other categories grow to the same
complexity, they should reuse these pieces rather than re-inlining the markup.

## Planned / incomplete features

These are intentionally kept (not deleted) and wired or stubbed for a future pass:

- **Spill magnitude** (`SpillFrequencySection.tsx`): the spill frequency bar
  renders today, but the CFS magnitude columns (`spill_avg_cfs`,
  `spill_max_cfs`, `spill_q50..q100`) are not yet populated in the ETL for most
  reservoirs, so `toVizMonthlySpill` defaults them to 0. Revisit once magnitude
  data lands.
- **Map integration** (`config/outcomeDefinitions.ts`): the `showOnMap`,
  `spatialType`, and `spatialLocation` metric fields and the `getMapMetrics` /
  `getMetricsBySpatialType` helpers back a planned Data Explorer to map
  hand-off. No caller wires them up yet.
- **Band colors to theme** (`config/bandColors.ts`): the percentile-band ramps
  live in a feature-local config for now. Once the palette is finalized they
  should move into the shared `@repo/ui` theme alongside the tier colors and be
  referenced from there. The `storage` ramp currently aliases `delivery` and the
  `outflow` blue differs slightly from `delivery`, both to reconcile at that time.
