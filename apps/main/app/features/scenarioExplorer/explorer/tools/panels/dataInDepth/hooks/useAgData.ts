"use client"

/**
 * useAgData - data layer for the Agricultural Water section.
 *
 * Owns all fetching and shaping for the AG matrices and keeps AgSection
 * focused on rendering. The single public entry point is
 * useMultiScenarioAgData. The rest (aggregate builder, demand-unit fan-out,
 * percentile projections) are internal.
 *
 * Data sources:
 *   - project aggregates: the batched response (agBatch) built in CategoryView
 *   - added demand units: per-scenario fan-out via useMultiScenarioSlots,
 *     scoped to the requested du ids (delivery + GW restriction shortage +
 *     period summary)
 */

import { useMemo } from "react"
import { useMultiScenarioSlots } from "./useMultiScenarioSlots"
import {
  useAgDemandUnitsDeliveryMonthly,
  useAgDemandUnitsShortageMonthly,
  useAgDemandUnitsPeriod,
} from "@repo/data/coeqwal/hooks"
import type {
  AgAggregateData,
  AgAggregatePeriodSummary,
  AgDemandUnitDeliveryData,
  AgDemandUnitListItem,
  AgDemandUnitPeriodSummary,
  AgDemandUnitShortageData,
  AgDemandUnitShortageMonthlyStats,
  CwsDeliveryMonthlyStats,
  BatchAgData,
} from "@repo/data/coeqwal"
import type { MonthlyPercentiles } from "@repo/viz"

/** Common info structure for all entity types */
interface EntityInfo {
  shortCode: string
  label: string
  annualDeliveryAvg?: number
  reliabilityPct?: number | null
  hydrologicRegion?: string | null
}

/** Matrix data structure for monthly percentiles */
type MatrixDataType = Record<
  string,
  Record<string, MonthlyPercentiles | undefined>
>

/** Per-cell summary statistics for AG entities */
export interface CellStats {
  annualAvgTaf?: number
  reliabilityPct?: number
}

/** Cell stats mapping: entityId to scenarioId to stats */
export type CellStatsMap = Record<string, Record<string, CellStats>>

/** Display label overrides for AG aggregates (API label to display label) */
const AG_AGGREGATE_LABEL_MAP: Record<string, string> = {
  "SWP Project AG": "SWP AG\nTotal",
  "SWP Project AG North": "SWP AG\nNorth of Delta",
  "SWP Project AG South": "SWP AG\nSouth of Delta",
  "CVP Project AG North": "CVP AG\nNorth of Delta",
  "CVP Project AG South": "CVP AG\nSouth of Delta",
}

/** Custom sort order for AG aggregates (short_code to sort index) */
const AG_AGGREGATE_SORT_ORDER: Record<string, number> = {
  swp_pag_n: 0,
  swp_pag_s: 1,
  swp_pag: 2,
  cvp_pag_n: 3,
  cvp_pag_s: 4,
}

/**
 * Convert an AG GW restriction shortage monthly row into the
 * `MonthlyPercentiles` shape the matrix renderer expects.
 *
 * The shortage row has a few extras (`shortage_frequency_pct`,
 * `shortage_pct_of_demand_avg`) that the matrix doesn't consume, so we
 * project down to the q0..q100 + mean fields. Rows are skipped when any
 * of q10..q100 or `avg_taf` is null, since feeding a partial band into
 * the chart would draw a misleading floor (matches the `isFullPercentileRow`
 * guard used for CWS data).
 *
 * `q0` is tolerated as null and coerced to 0. A DU with zero shortage
 * in the driest year is a valid row
 */
function shortageStatsToPercentiles(
  monthlyData: Record<string, AgDemandUnitShortageMonthlyStats>,
): MonthlyPercentiles {
  const result: MonthlyPercentiles = {}
  Object.entries(monthlyData).forEach(([month, stats]) => {
    if (!stats) return
    if (
      stats.q10 == null ||
      stats.q30 == null ||
      stats.q50 == null ||
      stats.q70 == null ||
      stats.q90 == null ||
      stats.q100 == null ||
      stats.avg_taf == null
    ) {
      return
    }
    result[month] = {
      q0: stats.q0 ?? 0,
      q10: stats.q10,
      q30: stats.q30,
      q50: stats.q50,
      q70: stats.q70,
      q90: stats.q90,
      q100: stats.q100,
      mean: stats.avg_taf,
    }
  })
  return result
}

/**
 * Helper: convert CwsDeliveryMonthlyStats to MonthlyPercentiles
 */
function deliveryStatsToPercentiles(
  monthlyData: Record<string, CwsDeliveryMonthlyStats>,
): MonthlyPercentiles {
  const result: MonthlyPercentiles = {}
  Object.entries(monthlyData).forEach(([month, stats]) => {
    if (stats?.q50 == null) return
    result[month] = {
      q0: stats.q0 ?? 0,
      q10: stats.q10,
      q30: stats.q30,
      q50: stats.q50,
      q70: stats.q70,
      q90: stats.q90,
      q100: stats.q100,
      mean: stats.avg_taf,
    }
  })
  return result
}

/**
 * Build the AG aggregates view from the batch response.
 *
 * Sourced from `batchData.ag[scenarioId].monthly.aggregates` and
 * `.period.aggregates`. AG aggregates have delivery data only. Loading
 * state is owned by the batch hook upstream.
 */
function buildAgAggregatesData(
  scenarios: string[],
  agBatch: Record<string, BatchAgData> | undefined,
) {
  const entityMap: Record<string, EntityInfo> = {}
  const matrixData: MatrixDataType = {}
  const cellStats: CellStatsMap = {}

  scenarios.forEach((scenarioId) => {
    const periodAggregates = agBatch?.[scenarioId]?.period?.aggregates
    if (!periodAggregates) return

    Object.entries(periodAggregates).forEach(
      ([shortCode, summary]: [string, AgAggregatePeriodSummary]) => {
        if (!entityMap[shortCode]) {
          const displayLabel =
            AG_AGGREGATE_LABEL_MAP[summary.label] ?? summary.label
          entityMap[shortCode] = {
            shortCode,
            label: displayLabel,
            annualDeliveryAvg: summary.annual_delivery_avg_taf,
          }
        }

        if (!cellStats[shortCode]) {
          cellStats[shortCode] = {}
        }
        cellStats[shortCode][scenarioId] = {
          annualAvgTaf: summary.annual_delivery_avg_taf,
        }
      },
    )
  })

  scenarios.forEach((scenarioId) => {
    const monthlyAggregates = agBatch?.[scenarioId]?.monthly?.aggregates
    if (!monthlyAggregates) return

    Object.entries(monthlyAggregates).forEach(
      ([shortCode, data]: [string, AgAggregateData]) => {
        if (!data) return
        if (!entityMap[shortCode]) {
          const displayLabel = AG_AGGREGATE_LABEL_MAP[data.label] ?? data.label
          entityMap[shortCode] = { shortCode, label: displayLabel }
        }
        if (!matrixData[shortCode]) {
          matrixData[shortCode] = {}
        }

        matrixData[shortCode][scenarioId] = data.monthly_delivery
          ? deliveryStatsToPercentiles(data.monthly_delivery)
          : {}
      },
    )
  })

  const entities = Object.values(entityMap)
    .filter((e) => e && e.label)
    .sort((a, b) => {
      const orderA = AG_AGGREGATE_SORT_ORDER[a.shortCode] ?? 999
      const orderB = AG_AGGREGATE_SORT_ORDER[b.shortCode] ?? 999
      if (orderA !== orderB) return orderA - orderB
      return (a.label ?? "").localeCompare(b.label ?? "")
    })

  return { entities, matrixData, cellStats }
}

/**
 * Hook to fetch AG demand-unit delivery, GW restriction shortage, and
 * period data for multiple scenarios, scoped to a specific list of
 * demand-unit ids.
 *
 * The underlying hooks self-gate on `duIds.length > 0`. When the list is
 * empty (no DUs added yet) no network requests fire. Each fetch returns
 * only the requested rows via the backend's `du_id` filter, so adding
 * one DU pulls one DU per scenario instead of all 150.
 *
 * Returns:
 * - `matrixData` (monthly delivery percentiles) - the current visible band
 * - `shortageMatrixData` (monthly GW restriction shortage percentiles) -
 *   fetched alongside delivery so it's hot in the SWR cache for the
 *   forthcoming delivery/shortage toggle. Populated only for SJR / TULARE
 *   DUs (Sacramento DUs have no shortage data and 404s are tolerated)
 *
 * `error` and `isLoading` track the delivery + period fetches only. Shortage
 * failures are not surfaced here because the visible matrix still renders
 * correctly without shortage data
 */
function useMultiScenarioAgDemandUnits(scenarios: string[], duIds: string[]) {
  const deliveryResults = useMultiScenarioSlots(scenarios, (id) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks -- helper guarantees stable hook order
    useAgDemandUnitsDeliveryMonthly(id, duIds),
  )
  const shortageResults = useMultiScenarioSlots(scenarios, (id) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks -- helper guarantees stable hook order
    useAgDemandUnitsShortageMonthly(id, duIds),
  )
  const periodResults = useMultiScenarioSlots(scenarios, (id) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks -- helper guarantees stable hook order
    useAgDemandUnitsPeriod(id, duIds),
  )

  const isLoading =
    deliveryResults.some((r) => r.isLoading) ||
    periodResults.some((r) => r.isLoading)
  const error =
    deliveryResults.find((r) => r.error)?.error ??
    periodResults.find((r) => r.error)?.error ??
    null

  const entityMap: Record<string, EntityInfo> = {}
  const matrixData: MatrixDataType = {}
  const shortageMatrixData: MatrixDataType = {}
  const cellStats: CellStatsMap = {}

  // Process period summaries for all scenarios to build cell stats
  periodResults.forEach((periodResult, index) => {
    const scenarioId = scenarios[index]
    if (!scenarioId || !periodResult.demandUnits) return

    Object.entries(periodResult.demandUnits).forEach(
      ([duId, summary]: [string, AgDemandUnitPeriodSummary]) => {
        // `annual_sw_delivery_avg_taf` is the average annual surface-water
        // delivery. We display it as the cell's "TAF/yr" line because that's
        // the same quantity the monthly bands above show
        const swDeliveryAvg = summary.annual_sw_delivery_avg_taf ?? undefined

        // `reliability_pct` is precomputed by the backend as
        // (annual_demand - annual_shortage) / annual_demand × 100,
        // i.e. average % of demand met across the simulation period
        const reliabilityPct = summary.reliability_pct ?? undefined

        if (!entityMap[duId]) {
          entityMap[duId] = {
            shortCode: duId,
            label: summary.label || summary.agency || duId,
            annualDeliveryAvg: swDeliveryAvg,
            reliabilityPct,
            hydrologicRegion: summary.hydrologic_region,
          }
        }

        if (!cellStats[duId]) {
          cellStats[duId] = {}
        }
        cellStats[duId][scenarioId] = {
          annualAvgTaf: swDeliveryAvg,
          reliabilityPct,
        }
      },
    )
  })

  // Process delivery monthly data for each scenario
  deliveryResults.forEach((result, index) => {
    const scenarioId = scenarios[index]
    if (!scenarioId || !result.demandUnits) return

    Object.entries(result.demandUnits).forEach(
      ([duId, data]: [string, AgDemandUnitDeliveryData]) => {
        if (!data) return
        if (!entityMap[duId]) {
          entityMap[duId] = {
            shortCode: duId,
            label: data.label || data.agency || duId,
            hydrologicRegion: data.hydrologic_region,
          }
        }
        if (!matrixData[duId]) {
          matrixData[duId] = {}
        }

        matrixData[duId][scenarioId] = data.monthly_sw_delivery
          ? deliveryStatsToPercentiles(data.monthly_sw_delivery)
          : {}
      },
    )
  })

  // Process GW restriction shortage monthly data for each scenario. Shortage
  // is available only for SJR / TULARE DUs. The fetch fires alongside delivery
  // so the data is hot in the SWR cache when a delivery/shortage toggle ships.
  // Sacramento DUs are absent from the response (and the endpoint 404s when
  // none of the requested DUs have shortage data) so we treat both as empty
  // rather than surfacing as a section-level error
  shortageResults.forEach((result, index) => {
    const scenarioId = scenarios[index]
    if (!scenarioId || !result.demandUnits) return

    Object.entries(result.demandUnits).forEach(
      ([duId, data]: [string, AgDemandUnitShortageData]) => {
        if (!data) return
        if (!shortageMatrixData[duId]) {
          shortageMatrixData[duId] = {}
        }

        shortageMatrixData[duId][scenarioId] = data.monthly_shortage
          ? shortageStatsToPercentiles(data.monthly_shortage)
          : {}
      },
    )
  })

  // Track which scenarios are still loading
  const loadingScenarios = scenarios.filter(
    (_, index) => deliveryResults[index]?.isLoading ?? false,
  )

  const entities = Object.values(entityMap)
    .filter((e) => e && e.label)
    .sort((a, b) => (a.label ?? "").localeCompare(b.label ?? ""))

  return {
    entities,
    matrixData,
    shortageMatrixData,
    cellStats,
    isLoading,
    error,
    loadingScenarios,
  }
}

/**
 * Combined hook for the monthly AG matrix.
 *
 * Project aggregates source from the batched response (`agBatch`).
 * When `additionalDemandUnitIds` has entries, the per-DU fetch fires
 * scoped to just those ids, and the resulting rows are spliced on top
 * of the aggregate rows. The inner hooks self-gate when the id list is
 * empty, so no network calls fire until a DU is added.
 *
 * `addedDemandUnitsList` is used purely as a label fallback so the row
 * label and chip render immediately while the per-DU fetch is in flight
 */
export function useMultiScenarioAgData(
  scenarios: string[],
  agBatch: Record<string, BatchAgData> | undefined,
  isBatchLoading: boolean,
  additionalDemandUnitIds: string[],
  addedDemandUnitsList: AgDemandUnitListItem[],
) {
  const aggregatesData = useMemo(
    () => buildAgAggregatesData(scenarios, agBatch),
    [scenarios, agBatch],
  )

  const demandUnitsData = useMultiScenarioAgDemandUnits(
    scenarios,
    additionalDemandUnitIds,
  )

  const hasAddedDus = additionalDemandUnitIds.length > 0

  // Order the added rows by the user's add-order, falling back to a stub
  // entity from the list endpoint when the per-DU response hasn't landed
  // yet so the row appears immediately
  const addedEntities = useMemo<EntityInfo[]>(() => {
    if (!hasAddedDus) return []
    return additionalDemandUnitIds.map((duId) => {
      const fromFanOut = demandUnitsData.entities.find(
        (e) => e.shortCode === duId,
      )
      if (fromFanOut) return fromFanOut
      const fromList = addedDemandUnitsList.find((du) => du.du_id === duId)
      return {
        shortCode: duId,
        label: fromList?.agency ?? duId,
        hydrologicRegion: fromList?.hydrologic_region ?? null,
      }
    })
  }, [
    hasAddedDus,
    additionalDemandUnitIds,
    addedDemandUnitsList,
    demandUnitsData.entities,
  ])

  if (!hasAddedDus) {
    // Aggregates have no shortage data (it's a per-DU SGMA-style concept).
    // Expose an empty shortage matrix so downstream callers don't have to
    // probe for the field
    return {
      entities: aggregatesData.entities,
      matrixData: aggregatesData.matrixData,
      shortageMatrixData: {} as MatrixDataType,
      cellStats: aggregatesData.cellStats,
      isLoading: isBatchLoading,
      error: null,
      loadingScenarios: isBatchLoading ? scenarios : [],
    }
  }

  return {
    entities: [...addedEntities, ...aggregatesData.entities],
    matrixData: { ...aggregatesData.matrixData, ...demandUnitsData.matrixData },
    // Aggregates contribute no shortage rows. Only the per-DU fetch does
    shortageMatrixData: demandUnitsData.shortageMatrixData,
    cellStats: { ...aggregatesData.cellStats, ...demandUnitsData.cellStats },
    isLoading: isBatchLoading || demandUnitsData.isLoading,
    error: demandUnitsData.error,
    loadingScenarios: isBatchLoading
      ? scenarios
      : demandUnitsData.loadingScenarios,
  }
}
