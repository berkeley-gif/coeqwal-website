"use client"

/**
 * useCwsData - data layer for the Community Water Systems section.
 *
 * Owns all fetching and shaping for the CWS matrices and keeps CwsSection
 * focused on rendering. The single public entry point is
 * useMultiScenarioCwsData. The rest (aggregate builder, M&I contractor and
 * demand-unit fan-out hooks, individual demand-unit stitching) are internal.
 *
 * Data sources:
 *   - aggregates: the batched response (cwsBatch) built in CategoryView
 *   - M&I contractors / demand units: per-scenario fan-out via
 *     useMultiScenarioSlots (not covered by the batch endpoint)
 *   - added demand units: per-scenario fan-out via useMultiScenarioSlots with a
 *     du_id list filter
 */

import { useMemo } from "react"
import { useMultiScenarioSlots } from "./useMultiScenarioSlots"
import { useResolvedIdMapping } from "../../../../../../scenarios/hooks"
import {
  useMiContractorsMonthly,
  useMiContractorsPeriod,
  useDemandUnitsMonthly,
  useDemandUnitsShortageMonthly,
  useDemandUnitsPeriod,
} from "@repo/data/coeqwal/hooks"
import type {
  CwsDeliveryMonthlyStats,
  CwsShortageMonthlyStats,
  MiContractorData,
  MiContractorPeriodSummary,
  DemandUnitData,
  DemandUnitPeriodSummary,
  BatchCwsData,
} from "@repo/data/coeqwal"
import type {
  MonthlyPercentiles,
  BreakdownDataMap,
  BreakdownComponentsMap,
} from "@repo/viz"
import {
  isFullPercentileRow,
  buildCwsAggregatesData,
  type EntityInfo,
  type MatrixDataType,
  type CellStatsMap,
} from "./cwsTransforms"

/** Entity level for CWS data */
export type CwsEntityLevel = "aggregates" | "contractors" | "demand-units"

/**
 * Shape returned by `useIndividualDemandUnitsData` per (duId, scenarioId).
 * Stitches the decomposed urban DU endpoints into the same surface that the
 * matrix-builder downstream expects (`community_agency`, `period_summary`,
 * and per-month delivery / shortage rows)
 */
type StitchedDemandUnitStats = {
  community_agency: string | null
  period_summary: DemandUnitPeriodSummary | null
  monthly_delivery: Record<string, CwsDeliveryMonthlyStats> | null
  monthly_shortage: Record<string, CwsShortageMonthlyStats> | null
}

/**
 * Hook to fetch M&I contractor data for multiple scenarios
 */
function useMultiScenarioMiContractors(scenarios: string[]) {
  const { idMapping } = useResolvedIdMapping()
  const fetchIds = useMemo(
    () => scenarios.map((id) => idMapping[id] ?? null),
    [scenarios, idMapping],
  )
  const monthlyResults = useMultiScenarioSlots(
    fetchIds,
    useMiContractorsMonthly,
  )
  const periodResults = useMultiScenarioSlots(fetchIds, useMiContractorsPeriod)

  const isLoading =
    monthlyResults.some((r) => r.isLoading) ||
    periodResults.some((r) => r.isLoading)
  const error =
    monthlyResults.find((r) => r.error)?.error ??
    periodResults.find((r) => r.error)?.error ??
    null

  const entityMap: Record<string, EntityInfo> = {}
  const matrixData: MatrixDataType = {}
  const cellStats: CellStatsMap = {}

  // Process period summaries for all scenarios to build cell stats
  periodResults.forEach((periodResult, index) => {
    const scenarioId = scenarios[index]
    if (!scenarioId || !periodResult.contractors) return

    Object.entries(periodResult.contractors).forEach(
      ([shortCode, summary]: [string, MiContractorPeriodSummary]) => {
        if (!entityMap[shortCode]) {
          entityMap[shortCode] = {
            shortCode,
            label: summary.label,
            annualDeliveryAvg: summary.annual_delivery_avg_taf,
            reliabilityPct: summary.reliability_pct,
            shortageFrequencyPct: summary.shortage_frequency_pct,
          }
        }

        // Build per-cell stats
        if (!cellStats[shortCode]) {
          cellStats[shortCode] = {}
        }
        const miDemand =
          summary.annual_delivery_avg_taf + summary.annual_shortage_avg_taf
        const miP95 = summary.delivery_exceedance?.["p95"]
        const miP95Fulfillment =
          miP95 !== undefined && miDemand > 0
            ? Math.min(100, (miP95 / miDemand) * 100)
            : undefined
        cellStats[shortCode][scenarioId] = {
          annualAvgTaf: summary.annual_delivery_avg_taf,
          reliabilityPct: miP95Fulfillment,
          shortageFrequencyPct: summary.shortage_frequency_pct,
        }
      },
    )
  })

  // Process monthly data for each scenario
  monthlyResults.forEach((result, index) => {
    const scenarioId = scenarios[index]
    if (!scenarioId || !result.contractors) return

    Object.entries(result.contractors).forEach(
      ([shortCode, data]: [string, MiContractorData]) => {
        if (!data) return // Skip if data is null/undefined
        if (!entityMap[shortCode]) {
          entityMap[shortCode] = { shortCode, label: data.label }
        }
        if (!matrixData[shortCode]) {
          matrixData[shortCode] = {}
        }

        const deliveryPercentiles: MonthlyPercentiles = {}
        const shortagePercentiles: MonthlyPercentiles = {}
        let hasDryYearMonths = false

        if (data.monthly_delivery) {
          Object.entries(data.monthly_delivery).forEach(([month, stats]) => {
            if (!stats || !isFullPercentileRow(stats)) return
            // Detect dry-year months: q0=0 means no allocation in the driest years
            if ((stats.q0 ?? 0) === 0) {
              hasDryYearMonths = true
            }
            deliveryPercentiles[month] = {
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
        }

        if (data.monthly_shortage) {
          Object.entries(data.monthly_shortage).forEach(([month, stats]) => {
            if (!stats || !isFullPercentileRow(stats)) return
            shortagePercentiles[month] = {
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
        }

        matrixData[shortCode][scenarioId] = {
          delivery: deliveryPercentiles,
          shortage: shortagePercentiles,
        }

        // Update cellStats with dry-year flag if detected
        if (hasDryYearMonths) {
          if (!cellStats[shortCode]) {
            cellStats[shortCode] = {}
          }
          if (!cellStats[shortCode][scenarioId]) {
            cellStats[shortCode][scenarioId] = {}
          }
          cellStats[shortCode][scenarioId].hasDryYearMonths = true
        }
      },
    )
  })

  // Track which scenarios are still loading
  const loadingScenarios = scenarios.filter(
    (_, index) => monthlyResults[index]?.isLoading ?? false,
  )

  const entities = Object.values(entityMap)
    .filter((e) => e && e.label) // Filter out entries with null labels
    .sort((a, b) => (a.label ?? "").localeCompare(b.label ?? ""))

  return { entities, matrixData, cellStats, isLoading, error, loadingScenarios }
}

/**
 * Hook to fetch urban demand unit data for multiple scenarios.
 *
 * Fans out three per-scenario calls (delivery-monthly, shortage-monthly,
 * period-summary) and stitches them into the matrix shape the renderer
 * expects. Delivery and shortage live on separate backend routes, so this
 * hook keeps a parallel results array for each
 */
function useMultiScenarioDemandUnits(scenarios: string[]) {
  const { idMapping } = useResolvedIdMapping()
  const fetchIds = useMemo(
    () => scenarios.map((id) => idMapping[id] ?? null),
    [scenarios, idMapping],
  )
  const monthlyResults = useMultiScenarioSlots(fetchIds, useDemandUnitsMonthly)
  const shortageResults = useMultiScenarioSlots(
    fetchIds,
    useDemandUnitsShortageMonthly,
  )
  const periodResults = useMultiScenarioSlots(fetchIds, useDemandUnitsPeriod)

  const isLoading =
    monthlyResults.some((r) => r.isLoading) ||
    shortageResults.some((r) => r.isLoading) ||
    periodResults.some((r) => r.isLoading)
  const error =
    monthlyResults.find((r) => r.error)?.error ??
    shortageResults.find((r) => r.error)?.error ??
    periodResults.find((r) => r.error)?.error ??
    null

  const entityMap: Record<string, EntityInfo> = {}
  const matrixData: MatrixDataType = {}
  const cellStats: CellStatsMap = {}

  // Process period summaries for all scenarios to build cell stats
  periodResults.forEach((periodResult, index) => {
    const scenarioId = scenarios[index]
    if (!scenarioId || !periodResult.demandUnits) return

    Object.entries(periodResult.demandUnits).forEach(
      ([duId, summary]: [string, DemandUnitPeriodSummary]) => {
        if (!entityMap[duId]) {
          entityMap[duId] = {
            shortCode: duId,
            label: summary.community_agency ?? duId,
            annualDeliveryAvg: summary.annual_delivery_avg_taf,
            reliabilityPct: summary.reliability_pct,
            shortageFrequencyPct: summary.shortage_frequency_pct,
          }
        }

        // Build per-cell stats
        if (!cellStats[duId]) {
          cellStats[duId] = {}
        }
        const duDemand =
          summary.annual_delivery_avg_taf + summary.annual_shortage_avg_taf
        const duP95 = summary.delivery_exceedance?.["p95"]
        const duP95Fulfillment =
          duP95 !== undefined && duDemand > 0
            ? Math.min(100, (duP95 / duDemand) * 100)
            : undefined
        cellStats[duId][scenarioId] = {
          annualAvgTaf: summary.annual_delivery_avg_taf,
          reliabilityPct: duP95Fulfillment,
          shortageFrequencyPct: summary.shortage_frequency_pct,
        }
      },
    )
  })

  // Helper that ensures a matrix cell exists before either the delivery or
  // shortage loop populates its half. Cells default to empty band maps so a
  // missing half still renders cleanly.
  const ensureMatrixCell = (duId: string, scenarioId: string) => {
    if (!matrixData[duId]) {
      matrixData[duId] = {}
    }
    if (!matrixData[duId][scenarioId]) {
      matrixData[duId][scenarioId] = { delivery: {}, shortage: {} }
    }
    return matrixData[duId][scenarioId]
  }

  // Delivery half of the matrix (one row per water month per DU).
  monthlyResults.forEach((result, index) => {
    const scenarioId = scenarios[index]
    if (!scenarioId || !result.demandUnits) return

    Object.entries(result.demandUnits).forEach(
      ([duId, data]: [string, DemandUnitData]) => {
        if (!data) return // Skip if data is null/undefined
        if (!entityMap[duId]) {
          entityMap[duId] = {
            shortCode: duId,
            label: data.community_agency ?? duId,
          }
        }

        const cell = ensureMatrixCell(duId, scenarioId)
        const deliveryPercentiles: MonthlyPercentiles = {}

        if (data.monthly_delivery) {
          Object.entries(data.monthly_delivery).forEach(([month, stats]) => {
            if (!stats || !isFullPercentileRow(stats)) return
            deliveryPercentiles[month] = {
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
        }

        cell.delivery = deliveryPercentiles
      },
    )
  })

  // Shortage half of the matrix. Backend serves these on a separate route
  // (`/demand-units/shortage-monthly`), so we hydrate it independently from
  // the delivery loop above.
  shortageResults.forEach((result, index) => {
    const scenarioId = scenarios[index]
    if (!scenarioId || !result.demandUnits) return

    Object.entries(result.demandUnits).forEach(([duId, data]) => {
      if (!data) return
      if (!entityMap[duId]) {
        entityMap[duId] = {
          shortCode: duId,
          label: data.community_agency ?? duId,
        }
      }

      const cell = ensureMatrixCell(duId, scenarioId)
      const shortagePercentiles: MonthlyPercentiles = {}

      if (data.monthly_shortage) {
        Object.entries(data.monthly_shortage).forEach(([month, stats]) => {
          if (!stats || !isFullPercentileRow(stats)) return
          shortagePercentiles[month] = {
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
      }

      cell.shortage = shortagePercentiles
    })
  })

  // Track which scenarios are still loading. A scenario is "loading" if any
  // of its three slot fetches is in flight, so the table doesn't flash a
  // half-populated row while one half is still resolving.
  const loadingScenarios = scenarios.filter(
    (_, index) =>
      (monthlyResults[index]?.isLoading ?? false) ||
      (shortageResults[index]?.isLoading ?? false) ||
      (periodResults[index]?.isLoading ?? false),
  )

  const entities = Object.values(entityMap)
    .filter((e) => e && e.label) // Filter out entries with null labels
    .sort((a, b) => (a.label ?? "").localeCompare(b.label ?? ""))

  return { entities, matrixData, cellStats, isLoading, error, loadingScenarios }
}

/**
 * Hook to fetch individual demand unit statistics across multiple scenarios.
 * Fans out per scenario via useMultiScenarioSlots, filtering each request to
 * the requested du_id list (the endpoint accepts a comma-separated list).
 *
 * @param scenarios - Array of scenario IDs to fetch data for
 * @param demandUnitIds - Array of demand unit IDs to fetch
 * @param demandUnitsList - Optional list of demand units with labels for immediate display
 */
function useIndividualDemandUnitsData(
  scenarios: string[],
  demandUnitIds: string[],
  demandUnitsList: Array<{ du_id: string; label: string; group?: string }> = [],
) {
  // Resolve the user's sibling-group ids to the active hydroclimate's
  // short_codes for fetching, while keying results back by group id (by slot
  // index) so the matrix stays in group-id space. Resolving before the fetch is
  // what makes a hydroclimate toggle refetch instead of returning stale
  // historical data.
  const { idMapping } = useResolvedIdMapping()
  const hasIds = demandUnitIds.length > 0
  // The urban-DU endpoints accept a comma-separated du_id list, so we fan out
  // once per scenario (not per scenario-DU pair) via the shared slots idiom.
  const joinedDuIds = hasIds ? [...demandUnitIds].sort().join(",") : undefined
  const fetchIds = useMemo(
    () => scenarios.map((id) => (hasIds ? (idMapping[id] ?? null) : null)),
    [scenarios, idMapping, hasIds],
  )

  const monthlyResults = useMultiScenarioSlots(fetchIds, (id) =>
    useDemandUnitsMonthly(id, joinedDuIds),
  )
  const shortageResults = useMultiScenarioSlots(fetchIds, (id) =>
    useDemandUnitsShortageMonthly(id, joinedDuIds),
  )
  const periodResults = useMultiScenarioSlots(fetchIds, (id) =>
    useDemandUnitsPeriod(id, joinedDuIds),
  )

  const isLoading =
    monthlyResults.some((r) => r.isLoading) ||
    shortageResults.some((r) => r.isLoading) ||
    periodResults.some((r) => r.isLoading)
  const error =
    monthlyResults.find((r) => r.error)?.error ??
    shortageResults.find((r) => r.error)?.error ??
    periodResults.find((r) => r.error)?.error ??
    null

  // Stitch the three per-scenario responses back into the per-DU shape the
  // matrix builder expects (keyed by duId, then group id). The merged
  // `/demand-units/monthly` endpoint serves both delivery and shortage, so the
  // shortage slot is deduped by SWR and never costs an extra request.
  const data = useMemo(() => {
    if (!hasIds) return undefined
    const out: Record<string, Record<string, StitchedDemandUnitStats>> = {}
    scenarios.forEach((groupId, index) => {
      const monthlyDU = monthlyResults[index]?.demandUnits
      const shortageDU = shortageResults[index]?.demandUnits
      const periodDU = periodResults[index]?.demandUnits
      demandUnitIds.forEach((duId) => {
        const monthlyEntry = monthlyDU?.[duId] ?? null
        const shortageEntry = shortageDU?.[duId] ?? null
        const periodEntry = periodDU?.[duId] ?? null
        if (!monthlyEntry && !shortageEntry && !periodEntry) return
        if (!out[duId]) out[duId] = {}
        out[duId][groupId] = {
          community_agency:
            monthlyEntry?.community_agency ??
            shortageEntry?.community_agency ??
            null,
          period_summary: periodEntry,
          monthly_delivery: monthlyEntry?.monthly_delivery ?? null,
          monthly_shortage: shortageEntry?.monthly_shortage ?? null,
        }
      })
    })
    return out
  }, [
    hasIds,
    scenarios,
    demandUnitIds,
    monthlyResults,
    shortageResults,
    periodResults,
  ])

  // Transform data into the format expected by useMultiScenarioCwsData
  const entityMap: Record<string, EntityInfo> = {}
  const matrixData: MatrixDataType = {}
  const cellStats: CellStatsMap = {}
  // Track whether shortage data is available from the API
  let hasShortageData = false

  // ALWAYS pre-populate entities for all requested demand unit IDs
  // This ensures rows appear immediately, even before API data loads.
  // Use demandUnitsList for labels if available, otherwise use duId as fallback.
  demandUnitIds.forEach((duId) => {
    const duInfo = demandUnitsList.find((du) => du.du_id === duId)
    entityMap[duId] = {
      shortCode: duId,
      // Use label from demandUnitsList if available, otherwise use the duId
      label: duInfo?.label ?? duId,
      // Stats will be populated when data loads
    }
  })

  if (data) {
    Object.entries(data).forEach(([duId, scenarioData]) => {
      Object.entries(scenarioData).forEach(([scenarioId, stats]) => {
        // Update entity info with actual data (overwrite placeholder).
        // community_agency can be null when the entity row has no display
        // name. Fall back to duId so the matrix still renders a label
        entityMap[duId] = {
          shortCode: duId,
          label: stats.community_agency ?? duId,
          annualDeliveryAvg: stats.period_summary?.annual_delivery_avg_taf,
          reliabilityPct: stats.period_summary?.reliability_pct,
          shortageFrequencyPct: stats.period_summary?.shortage_frequency_pct,
        }

        // Build per-cell stats. Reliability is reported as P95 delivery as
        // a fraction of demand, where demand is delivery + shortage. Every
        // input must be numeric to compute it. Falling back to undefined
        // when any piece is null is more honest than dividing by an
        // estimated-but-wrong denominator.
        if (!cellStats[duId]) {
          cellStats[duId] = {}
        }
        const ps = stats.period_summary
        const psDelivery = ps?.annual_delivery_avg_taf
        const psShortage = ps?.annual_shortage_avg_taf
        const psDemand =
          psDelivery != null && psShortage != null
            ? psDelivery + psShortage
            : null
        const psP95 = ps?.delivery_exceedance?.["p95"]
        const psP95Fulfillment =
          psP95 != null && psDemand != null && psDemand > 0
            ? Math.min(100, (psP95 / psDemand) * 100)
            : undefined
        cellStats[duId][scenarioId] = {
          annualAvgTaf: ps?.annual_delivery_avg_taf ?? undefined,
          reliabilityPct: psP95Fulfillment,
          shortageFrequencyPct: ps?.shortage_frequency_pct ?? undefined,
        }

        // Build matrix data
        if (!matrixData[duId]) {
          matrixData[duId] = {}
        }

        const deliveryPercentiles: MonthlyPercentiles = {}
        const shortagePercentiles: MonthlyPercentiles = {}

        if (stats.monthly_delivery) {
          Object.entries(stats.monthly_delivery).forEach(
            ([month, monthStats]) => {
              if (!monthStats || !isFullPercentileRow(monthStats)) return
              deliveryPercentiles[month] = {
                q0: monthStats.q0 ?? 0,
                q10: monthStats.q10,
                q30: monthStats.q30,
                q50: monthStats.q50,
                q70: monthStats.q70,
                q90: monthStats.q90,
                q100: monthStats.q100,
                mean: monthStats.avg_taf,
              }
            },
          )
        }

        if (stats.monthly_shortage) {
          Object.entries(stats.monthly_shortage).forEach(
            ([month, monthStats]) => {
              if (!monthStats || !isFullPercentileRow(monthStats)) return
              hasShortageData = true
              shortagePercentiles[month] = {
                q0: monthStats.q0 ?? 0,
                q10: monthStats.q10,
                q30: monthStats.q30,
                q50: monthStats.q50,
                q70: monthStats.q70,
                q90: monthStats.q90,
                q100: monthStats.q100,
                mean: monthStats.avg_taf,
              }
            },
          )
        }

        matrixData[duId][scenarioId] = {
          delivery: deliveryPercentiles,
          shortage: shortagePercentiles,
        }
      })
    })
  }

  // Preserve the order from demandUnitIds (user's add order) instead of sorting alphabetically
  // Include all requested demand units, using duId as fallback label if not in demandUnitsList
  const entities = demandUnitIds
    .map((duId) => entityMap[duId] ?? { shortCode: duId, label: duId })
    .filter((e): e is EntityInfo => e != null && !!e.label)

  return { entities, matrixData, cellStats, isLoading, error, hasShortageData }
}

/**
 * Combined hook that delegates to the appropriate entity-level hook
 * Also supports adding individual demand units from any entity level.
 *
 * The "aggregates" view sources from the batched response (`cwsBatch`).
 * The other views (M&I contractors, demand units) still fan out per
 * scenario because the batch API doesn't cover them.
 */
export function useMultiScenarioCwsData(
  scenarios: string[],
  entityLevel: CwsEntityLevel,
  cwsBatch: Record<string, BatchCwsData> | undefined,
  isBatchLoading: boolean,
  additionalDemandUnitIds: string[] = [],
  demandUnitsList: Array<{ du_id: string; label: string; group?: string }> = [],
) {
  const aggregatesData = useMemo(
    () => buildCwsAggregatesData(scenarios, cwsBatch),
    [scenarios, cwsBatch],
  )
  const contractorsData = useMultiScenarioMiContractors(scenarios)
  const demandUnitsData = useMultiScenarioDemandUnits(scenarios)

  // Fetch individual demand unit data for additional demand units
  // This uses the single-unit endpoint which returns actual data
  // Pass demandUnitsList so entities appear immediately (before API data loads)
  const individualDemandUnitsData = useIndividualDemandUnitsData(
    scenarios,
    additionalDemandUnitIds,
    demandUnitsList,
  )

  // Get base data for the selected entity level
  let baseEntities: EntityInfo[]
  let baseMatrixData: MatrixDataType
  let baseCellStats: CellStatsMap
  let breakdownData: BreakdownDataMap | undefined
  let breakdownComponents: BreakdownComponentsMap | undefined
  let isLoading: boolean
  let error: string | null
  let loadingScenarios: string[]

  switch (entityLevel) {
    case "contractors":
      baseEntities = contractorsData.entities
      baseMatrixData = contractorsData.matrixData
      baseCellStats = contractorsData.cellStats
      breakdownData = undefined
      breakdownComponents = undefined
      isLoading =
        contractorsData.isLoading || individualDemandUnitsData.isLoading
      error = contractorsData.error ?? individualDemandUnitsData.error ?? null
      loadingScenarios = contractorsData.loadingScenarios
      break
    case "demand-units":
      baseEntities = demandUnitsData.entities
      baseMatrixData = demandUnitsData.matrixData
      baseCellStats = demandUnitsData.cellStats
      breakdownData = undefined
      breakdownComponents = undefined
      isLoading = demandUnitsData.isLoading
      error = demandUnitsData.error ?? null
      loadingScenarios = demandUnitsData.loadingScenarios
      break
    case "aggregates":
    default:
      baseEntities = aggregatesData.entities
      baseMatrixData = aggregatesData.matrixData
      baseCellStats = aggregatesData.cellStats
      breakdownData = aggregatesData.breakdownData
      breakdownComponents = aggregatesData.breakdownComponents
      isLoading = isBatchLoading || individualDemandUnitsData.isLoading
      error = individualDemandUnitsData.error ?? null
      loadingScenarios = isBatchLoading ? scenarios : []
      break
  }

  // Track whether added demand units have shortage data available
  // The individual demand unit API endpoint doesn't return monthly_shortage data
  const addedDemandUnitsHaveShortageData =
    individualDemandUnitsData.hasShortageData

  // If there are additional demand units and we're not in demand-units view,
  // prepend them (at top) using data from the individual demand unit fetch
  if (additionalDemandUnitIds.length > 0 && entityLevel !== "demand-units") {
    // Merge additional demand units with base data (demand units first, at top)
    return {
      aggregates: [...individualDemandUnitsData.entities, ...baseEntities],
      matrixData: {
        ...baseMatrixData,
        ...individualDemandUnitsData.matrixData,
      },
      cellStats: { ...baseCellStats, ...individualDemandUnitsData.cellStats },
      breakdownData,
      breakdownComponents,
      isLoading,
      error,
      addedDemandUnitsHaveShortageData,
      loadingScenarios,
    }
  }

  return {
    aggregates: baseEntities,
    matrixData: baseMatrixData,
    cellStats: baseCellStats,
    breakdownData,
    breakdownComponents,
    isLoading,
    error,
    addedDemandUnitsHaveShortageData,
    loadingScenarios,
  }
}
