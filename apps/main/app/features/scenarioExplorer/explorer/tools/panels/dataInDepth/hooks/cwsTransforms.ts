/**
 * cwsTransforms - pure (non-React) data shaping for the Community Water
 * Systems section.
 *
 * These helpers turn the batched CWS response into the matrices, entity
 * metadata, and per-cell stats the charts consume. They are split out of
 * useCwsData so the hook file holds only the React fetching/fan-out layer
 * and this file holds the testable, side-effect-free transforms.
 */

import type {
  BatchCwsData,
  CwsAggregateData,
  CwsAggregatePeriodSummary,
  DemandUnit,
} from "@repo/data/coeqwal"
import type {
  MonthlyPercentiles,
  BreakdownDataMap,
  BreakdownComponentsMap,
} from "@repo/viz"

/** Display label overrides for CWS aggregates (API label to display label) */
const CWS_AGGREGATE_LABEL_MAP: Record<string, string> = {
  "CVP North": "CVP\nNorth of Delta",
  "CVP South": "CVP\nSouth of Delta",
  "SWP North": "SWP\nNorth of Delta",
  "SWP South": "SWP\nSouth of Delta",
  "SWP Total M&I": "SWP Total",
}

/** Custom sort order for CWS aggregates (short_code to sort index) */
const CWS_AGGREGATE_SORT_ORDER: Record<string, number> = {
  swp_nod: 0,
  swp_sod: 1,
  swp_sod_breakdown: 2, // Synthetic row showing MWD portion of SWP SOD
  mwd: 3,
  swp_total: 4,
  swp_total_breakdown: 5, // Synthetic row showing MWD portion of SWP Total
  cvp_nod: 6,
  cvp_sod: 7,
}

/**
 * Type guard: row has all the band edges and mean a `PercentileBandChart`
 * needs to render. A partial row (any of q10..q100 or avg_taf is null)
 * is treated as "no data" and skipped, because feeding a nulled band
 * edge into the chart would either crash d3 or draw a misleading zero
 * floor.
 *
 * q0 is intentionally tolerated as null and coerced to 0 by the caller,
 * since a CWS contractor that receives 0 delivery in the driest year
 * still has a valid row.
 */
export function isFullPercentileRow(stats: {
  q10: number | null
  q30: number | null
  q50: number | null
  q70: number | null
  q90: number | null
  q100: number | null
  avg_taf: number | null
}): stats is {
  q0?: number | null
  q10: number
  q30: number
  q50: number
  q70: number
  q90: number
  q100: number
  avg_taf: number
} {
  return (
    stats.q10 != null &&
    stats.q30 != null &&
    stats.q50 != null &&
    stats.q70 != null &&
    stats.q90 != null &&
    stats.q100 != null &&
    stats.avg_taf != null
  )
}

/** Common info structure for all entity types */
export interface EntityInfo {
  shortCode: string
  label: string
  annualDeliveryAvg?: number
  reliabilityPct?: number
  shortageFrequencyPct?: number
}

/** Matrix data structure for monthly percentiles */
export type MatrixDataType = Record<
  string,
  Record<
    string,
    { delivery: MonthlyPercentiles; shortage: MonthlyPercentiles } | undefined
  >
>

/** Per-cell summary statistics for CWS entities */
export interface CellStats {
  annualAvgTaf?: number
  reliabilityPct?: number
  shortageFrequencyPct?: number
  /** True if any month has q0=0 (contractor may receive no allocation in dry years) */
  hasDryYearMonths?: boolean
}

/** Cell stats mapping: entityId to scenarioId to stats */
export type CellStatsMap = Record<string, Record<string, CellStats>>

/**
 * Build the CWS aggregates view from the batch response.
 *
 * Sourced from `batchData.cws[scenarioId].monthly.aggregates` and
 * `.period.aggregates`. Loading state is owned by the batch hook upstream.
 */
export function buildCwsAggregatesData(
  scenarios: string[],
  cwsBatch: Record<string, BatchCwsData> | undefined,
) {
  const entityMap: Record<string, EntityInfo> = {}
  const matrixData: MatrixDataType = {}
  const cellStats: CellStatsMap = {}

  scenarios.forEach((scenarioId) => {
    const periodAggregates = cwsBatch?.[scenarioId]?.period?.aggregates
    if (!periodAggregates) return

    Object.entries(periodAggregates).forEach(
      ([shortCode, summary]: [string, CwsAggregatePeriodSummary]) => {
        // Build entity metadata from first scenario that has data
        if (!entityMap[shortCode]) {
          const displayLabel =
            CWS_AGGREGATE_LABEL_MAP[summary.label] ?? summary.label
          entityMap[shortCode] = {
            shortCode,
            label: displayLabel,
            annualDeliveryAvg: summary.annual_delivery_avg_taf,
            reliabilityPct: summary.reliability_pct,
            shortageFrequencyPct: summary.shortage_frequency_pct,
          }
        }

        // Build per-cell stats: entityId to scenarioId to stats
        if (!cellStats[shortCode]) {
          cellStats[shortCode] = {}
        }
        // P95 delivery fulfillment = delivery exceeded in 95% of years / annual demand × 100.
        const cwsDemand =
          summary.annual_delivery_avg_taf + summary.annual_shortage_avg_taf
        const cwsP95 = summary.delivery_exceedance?.["p95"]
        const cwsP95Fulfillment =
          cwsP95 !== undefined && cwsDemand > 0
            ? Math.min(100, (cwsP95 / cwsDemand) * 100)
            : undefined
        cellStats[shortCode][scenarioId] = {
          annualAvgTaf: summary.annual_delivery_avg_taf,
          reliabilityPct: cwsP95Fulfillment,
          shortageFrequencyPct: summary.shortage_frequency_pct,
        }
      },
    )
  })

  scenarios.forEach((scenarioId) => {
    const monthlyAggregates = cwsBatch?.[scenarioId]?.monthly?.aggregates
    if (!monthlyAggregates) return

    Object.entries(monthlyAggregates).forEach(
      ([shortCode, data]: [string, CwsAggregateData]) => {
        if (!data) return // Skip if data is null/undefined
        if (!entityMap[shortCode]) {
          // Apply label mapping if available, otherwise use API label
          const displayLabel = CWS_AGGREGATE_LABEL_MAP[data.label] ?? data.label
          entityMap[shortCode] = { shortCode, label: displayLabel }
        }
        if (!matrixData[shortCode]) {
          matrixData[shortCode] = {}
        }

        const deliveryPercentiles: MonthlyPercentiles = {}
        const shortagePercentiles: MonthlyPercentiles = {}

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
      },
    )
  })

  // Compute synthetic "Other SWP" data = SWP SOD - MWD for breakdown row
  const breakdownData: BreakdownDataMap = {}
  const breakdownComponents: BreakdownComponentsMap = {}

  // Only add breakdown if we have both swp_sod and mwd data
  if (matrixData["swp_sod"] && matrixData["mwd"]) {
    const breakdownId = "swp_sod_breakdown"

    // Define components with colors
    breakdownComponents[breakdownId] = [
      { id: "mwd", label: "MWD", color: "#5b9bd5" }, // Blue for MWD
      { id: "other_swp", label: "Other SWP", color: "#70ad47" }, // Green for Other SWP
    ]

    // Add synthetic entity info
    entityMap[breakdownId] = {
      shortCode: breakdownId,
      label: "MWD portion of\nSWP South of Delta",
    }

    // Compute breakdown data for each scenario
    breakdownData[breakdownId] = {}
    const breakdownEntry = breakdownData[breakdownId]
    if (breakdownEntry) {
      scenarios.forEach((scenarioId) => {
        const swpSodData = matrixData["swp_sod"]?.[scenarioId]
        const mwdData = matrixData["mwd"]?.[scenarioId]

        if (!swpSodData || !mwdData) return

        breakdownEntry[scenarioId] = {
          // MWD component (just use MWD data directly)
          mwd: mwdData.delivery,
          // Other SWP component = SWP SOD - MWD
          other_swp: computeOtherSwp(swpSodData.delivery, mwdData.delivery),
        }
      })
    }

    // Add empty entry to matrixData so the row renders
    // (actual rendering will use breakdownData)
    matrixData[breakdownId] = {}
    scenarios.forEach((scenarioId) => {
      const breakdownEntry = matrixData[breakdownId]
      if (breakdownEntry) {
        breakdownEntry[scenarioId] = {
          delivery: {}, // Empty - actual data from breakdownData
          shortage: {},
        }
      }
    })
  }

  // Add second breakdown: MWD as part of SWP Total (all SWP deliveries)
  if (matrixData["swp_total"] && matrixData["mwd"]) {
    const breakdownId = "swp_total_breakdown"

    // Define components with colors
    breakdownComponents[breakdownId] = [
      { id: "mwd", label: "MWD", color: "#5b9bd5" }, // Blue for MWD
      { id: "other_swp_total", label: "Other SWP", color: "#70ad47" }, // Green for SWP Total
    ]

    // Add synthetic entity info
    entityMap[breakdownId] = {
      shortCode: breakdownId,
      label: "MWD portion\nof SWP Total",
    }

    // Compute breakdown data for each scenario
    breakdownData[breakdownId] = {}
    const breakdownEntry = breakdownData[breakdownId]
    if (breakdownEntry) {
      scenarios.forEach((scenarioId) => {
        const swpTotalData = matrixData["swp_total"]?.[scenarioId]
        const mwdData = matrixData["mwd"]?.[scenarioId]

        if (!swpTotalData || !mwdData) return

        breakdownEntry[scenarioId] = {
          // MWD component (just use MWD data directly)
          mwd: mwdData.delivery,
          // Other SWP Total component = SWP Total - MWD
          other_swp_total: computeOtherSwp(
            swpTotalData.delivery,
            mwdData.delivery,
          ),
        }
      })
    }

    // Add empty entry to matrixData so the row renders
    matrixData[breakdownId] = {}
    scenarios.forEach((scenarioId) => {
      const breakdownEntry = matrixData[breakdownId]
      if (breakdownEntry) {
        breakdownEntry[scenarioId] = {
          delivery: {},
          shortage: {},
        }
      }
    })
  }

  const entities = Object.values(entityMap)
    .filter((e) => e && e.label) // Filter out entries with null labels
    .sort((a, b) => {
      // Use custom sort order for aggregates, fall back to alphabetical
      const orderA = CWS_AGGREGATE_SORT_ORDER[a.shortCode] ?? 999
      const orderB = CWS_AGGREGATE_SORT_ORDER[b.shortCode] ?? 999
      if (orderA !== orderB) return orderA - orderB
      return (a.label ?? "").localeCompare(b.label ?? "")
    })

  return {
    entities,
    matrixData,
    cellStats,
    breakdownData,
    breakdownComponents,
  }
}

/**
 * Compute "Other SWP" = SWP SOD - MWD for each percentile
 */
export function computeOtherSwp(
  swpSod: MonthlyPercentiles,
  mwd: MonthlyPercentiles,
): MonthlyPercentiles {
  const result: MonthlyPercentiles = {}

  for (let month = 1; month <= 12; month++) {
    const monthStr = month.toString()
    const swpSodMonth = swpSod[monthStr]
    const mwdMonth = mwd[monthStr]

    if (swpSodMonth && mwdMonth) {
      result[monthStr] = {
        q0: Math.max(0, swpSodMonth.q0 - mwdMonth.q0),
        q10: Math.max(0, swpSodMonth.q10 - mwdMonth.q10),
        q30: Math.max(0, swpSodMonth.q30 - mwdMonth.q30),
        q50: Math.max(0, swpSodMonth.q50 - mwdMonth.q50),
        q70: Math.max(0, swpSodMonth.q70 - mwdMonth.q70),
        q90: Math.max(0, swpSodMonth.q90 - mwdMonth.q90),
        q100: Math.max(0, swpSodMonth.q100 - mwdMonth.q100),
        mean: Math.max(0, (swpSodMonth.mean ?? 0) - (mwdMonth.mean ?? 0)),
      }
    }
  }

  return result
}

/** A select option group: a label with a flat list of value/label options. */
export interface SelectOptionGroup {
  label: string
  options: { value: string; label: string }[]
}

/**
 * Group the flat demand-unit list into CompactSelect option groups, keyed by
 * each unit's hydrologic-region `group`. Already-added units are excluded so
 * they cannot be added twice. Empty groups are dropped and the rest sorted
 * alphabetically.
 */
export function buildDemandUnitGroupOptions(
  demandUnitsList: DemandUnit[],
  excludeIds: string[],
): SelectOptionGroup[] {
  if (demandUnitsList.length === 0) return []

  const excludedIds = new Set(excludeIds)

  const groupedByField: Record<string, DemandUnit[]> = {}
  demandUnitsList.forEach((du) => {
    if (!du) return // Skip null/undefined entries
    const groupKey = du.group ?? "Other"
    if (!groupedByField[groupKey]) {
      groupedByField[groupKey] = []
    }
    groupedByField[groupKey].push(du)
  })

  return Object.entries(groupedByField)
    .map(([groupKey, units]) => ({
      label: groupKey,
      options: units
        .filter((du) => du && du.du_id && !excludedIds.has(du.du_id))
        .map((du) => {
          const displayLabel = du.label ?? du.du_id
          return {
            value: du.du_id,
            label: `${displayLabel} (${du.du_id})`,
          }
        })
        .sort((a, b) => (a.label ?? "").localeCompare(b.label ?? "")),
    }))
    .filter((group) => group.options.length > 0)
    .sort((a, b) => (a.label ?? "").localeCompare(b.label ?? ""))
}
