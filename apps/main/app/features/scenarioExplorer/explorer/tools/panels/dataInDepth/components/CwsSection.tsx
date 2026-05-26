"use client"

/**
 * CwsSection - Community Water Systems section for the Data Explorer
 *
 * Displays CWS aggregate delivery and shortage data:
 * - Delivery tier distribution (CWS_DEL)
 * - Monthly delivery/shortage percentile charts
 *
 * Uses the same CSS Grid layout patterns as ReservoirStorageSection.
 */

import React, { useState, useMemo, useEffect, useCallback } from "react"
import {
  Box,
  Typography,
  useTheme,
  CircularProgress,
  Button,
} from "@repo/ui/mui"
import { AddIcon } from "@repo/ui/mui"
import { CompactSelect, MobileModal } from "@repo/ui"
import { TierGlyphWithTooltip } from "../../../../../../tooltips/TierGlyphWithTooltip"
import { PercentileMatrix } from "@repo/viz"
import type { ChartDataPoint } from "../../../../../../scenarios/components/shared"
import type {
  ReservoirData,
  MonthlyPercentiles,
  VolumeScaleMode,
  BreakdownDataMap,
  BreakdownComponentsMap,
} from "@repo/viz"
import { GridScenarioHeader } from "./AlignedScenarioGrid"
import { ChartGridProvider } from "./ChartGridContext"
import { PercentileMatrixSkeleton } from "./PercentileMatrixSkeleton"
import { useMultiScenarioSlots } from "./useMultiScenarioSlots"
import useSWR from "swr"
import {
  useMiContractorsMonthly,
  useMiContractorsPeriod,
  useDemandUnitsList,
  useDemandUnitsMonthly,
  useDemandUnitsShortageMonthly,
  useDemandUnitsPeriod,
} from "@repo/data/coeqwal/hooks"
import {
  fetchDemandUnitsMonthly,
  fetchDemandUnitsShortageMonthly,
  fetchDemandUnitsPeriod,
} from "@repo/data/coeqwal"
import type {
  CwsAggregateData,
  CwsAggregatePeriodSummary,
  CwsDeliveryMonthlyStats,
  CwsShortageMonthlyStats,
  MiContractorData,
  MiContractorPeriodSummary,
  DemandUnitData,
  DemandUnitPeriodSummary,
  BatchStatisticsResponse,
  BatchCwsData,
} from "@repo/data/coeqwal"

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
import {
  outcomeCategories,
  getOutcomeCategoryColor,
  getMetricsByCategory,
  type OutcomeMetric,
} from "../config/outcomeDefinitions"
import { useMetricData } from "../hooks/useMetricData"
import { useHydroclimateAvailability } from "../../../../../../scenarios/hooks"
import { HydroclimateUnavailablePlaceholder } from "../../../../../../scenarios/components/HydroclimateUnavailablePlaceholder"
import { SectionHeader } from "./SectionHeader"

// ============================================================================
// Constants
// ============================================================================

/** Display mode for CWS charts */
type CwsDisplayMode = "delivery" | "shortage"

/** Entity level for CWS data */
type CwsEntityLevel = "aggregates" | "contractors" | "demand-units"

const CWS_DISPLAY_OPTIONS = [
  { value: "delivery" as const, label: "Delivery" },
  { value: "shortage" as const, label: "Shortage" },
]

const CWS_ENTITY_LEVEL_OPTIONS = [
  { value: "aggregates" as const, label: "Project totals" },
  { value: "contractors" as const, label: "M&I Contractors" },
]

const CWS_SCALE_OPTIONS = [
  { value: "absolute" as const, label: "Absolute scale" },
  { value: "relative" as const, label: "Relative scale" },
]

/** Color scheme for delivery percentile bands (blue) */
const DELIVERY_BAND_COLORS = {
  range: "#d9eafb", // q0-q100 (lightest)
  outer: "#c5dbf3", // q10-q90
  inner: "#a2bee1", // q30-q70
  median: "#2c5aa0", // q50 (darkest)
}

/** Color scheme for shortage percentile bands (orange/amber) */
const SHORTAGE_BAND_COLORS = {
  range: "#fef3e2", // q0-q100 (lightest amber)
  outer: "#fdd49e", // q10-q90
  inner: "#fdae6b", // q30-q70
  median: "#e6550d", // q50 (darkest orange)
}

/** Display label overrides for CWS aggregates (API label -> display label) */
const CWS_AGGREGATE_LABEL_MAP: Record<string, string> = {
  "CVP North": "CVP\nNorth of Delta",
  "CVP South": "CVP\nSouth of Delta",
  "SWP North": "SWP\nNorth of Delta",
  "SWP South": "SWP\nSouth of Delta",
  "SWP Total M&I": "SWP Total",
}

/** Custom sort order for CWS aggregates (short_code -> sort index) */
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
function isFullPercentileRow(stats: {
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

// ============================================================================
// Legend Components
// ============================================================================

function DeliveryBandsLegend() {
  return (
    <>
      <Box
        component="span"
        sx={{
          width: 14,
          height: 14,
          backgroundColor: DELIVERY_BAND_COLORS.range,
          borderRadius: "2px",
        }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        Minimum to maximum range
      </Box>
      <Box
        component="span"
        sx={{
          width: 14,
          height: 14,
          backgroundColor: DELIVERY_BAND_COLORS.outer,
          borderRadius: "2px",
          ml: 0.75,
        }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        10–90th percentile
      </Box>
      <Box
        component="span"
        sx={{
          width: 14,
          height: 14,
          backgroundColor: DELIVERY_BAND_COLORS.inner,
          borderRadius: "2px",
          ml: 0.75,
        }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        30–70th percentile
      </Box>
      <Box
        component="span"
        sx={{
          width: 14,
          height: 3,
          backgroundColor: DELIVERY_BAND_COLORS.median,
          borderRadius: "1px",
          ml: 0.75,
        }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        Median
      </Box>
    </>
  )
}

function ShortageBandsLegend() {
  return (
    <>
      <Box
        component="span"
        sx={{
          width: 14,
          height: 14,
          backgroundColor: SHORTAGE_BAND_COLORS.range,
          borderRadius: "2px",
        }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        Minimum to maximum range
      </Box>
      <Box
        component="span"
        sx={{
          width: 14,
          height: 14,
          backgroundColor: SHORTAGE_BAND_COLORS.outer,
          borderRadius: "2px",
          ml: 0.75,
        }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        10–90th percentile
      </Box>
      <Box
        component="span"
        sx={{
          width: 14,
          height: 14,
          backgroundColor: SHORTAGE_BAND_COLORS.inner,
          borderRadius: "2px",
          ml: 0.75,
        }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        30–70th percentile
      </Box>
      <Box
        component="span"
        sx={{
          width: 14,
          height: 3,
          backgroundColor: SHORTAGE_BAND_COLORS.median,
          borderRadius: "1px",
          ml: 0.75,
        }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        Median
      </Box>
    </>
  )
}

// ============================================================================
// CWS Tier Row Component
// ============================================================================

// Get the CWS tier metric (constant, safe to call outside component)
const CWS_TIER_METRIC = getMetricsByCategory("community-water").find(
  (m) => m.isTier,
)

/** Compact chart size for tier distribution (1.5x scenario-explorer size) */
const TIER_CHART_SIZE = 90

/**
 * CwsTierCharts - Inline tier distribution charts for CWS
 * Renders charts horizontally to sit alongside section header
 * Uses TierGlyphWithTooltip for self-contained tooltip behavior
 */
interface CwsTierChartsProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
  /** Sibling-group ids with no variant for the active hydroclimate */
  missingSet: Set<string>
  /** Active hydroclimate value, used to label the missing-variant placeholder */
  hydroclimate: string
  /** Whether this is inside a modal (affects tooltip z-index) */
  isModal?: boolean
}

function CwsTierCharts({
  scenarios,
  scenarioNames,
  missingSet,
  hydroclimate,
  isModal = false,
}: CwsTierChartsProps) {
  const theme = useTheme()
  const { data, isLoading } = useMetricData(
    scenarios,
    CWS_TIER_METRIC as OutcomeMetric,
  )

  if (!CWS_TIER_METRIC) return null

  return (
    <>
      {scenarios.map((scenarioId, index) => {
        if (missingSet.has(scenarioId)) {
          return (
            <Box
              key={scenarioId}
              sx={{
                gridColumn: index + 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: TIER_CHART_SIZE,
              }}
            >
              <HydroclimateUnavailablePlaceholder
                hydroclimate={hydroclimate}
                groupId={scenarioId}
                variant="inline"
              />
            </Box>
          )
        }

        if (isLoading) {
          return (
            <Box
              key={scenarioId}
              sx={{
                gridColumn: index + 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CircularProgress size={20} />
            </Box>
          )
        }

        // Special case: s0011 is the baseline scenario
        if (scenarioId === "s0011") {
          return (
            <Box
              key={scenarioId}
              sx={{
                gridColumn: index + 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.palette.grey[100],
                  borderRadius: theme.borderRadius.sm,
                  border: theme.border.medium,
                  width: TIER_CHART_SIZE,
                  height: TIER_CHART_SIZE,
                  px: theme.space.component.xs,
                }}
              >
                <Typography
                  variant="compactMicro"
                  sx={{
                    color: theme.palette.grey[500],
                    textAlign: "center",
                    lineHeight: 1.3,
                  }}
                >
                  Baseline
                </Typography>
              </Box>
            </Box>
          )
        }

        const scenarioData = data?.find((d) => d.scenarioId === scenarioId)
        if (!scenarioData?.tierData) {
          return (
            <Box
              key={scenarioId}
              sx={{
                gridColumn: index + 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: theme.palette.grey[400] }}
              >
                -
              </Typography>
            </Box>
          )
        }

        // Convert tier data to ChartDataPoint format
        const chartData: ChartDataPoint[] = scenarioData.tierData.map(
          (tier) => ({
            label: tier.label,
            color: tier.color,
            value: tier.value,
            tierType: tier.tierType,
          }),
        )

        return (
          <Box
            key={scenarioId}
            sx={{
              gridColumn: index + 2,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <TierGlyphWithTooltip
              outcomeCode="CWS_DEL"
              chartData={chartData}
              scenarioLabel={scenarioNames[scenarioId] || scenarioId}
              size={TIER_CHART_SIZE}
              zIndex={isModal ? theme.zIndex.tooltipAboveModal : undefined}
            />
          </Box>
        )
      })}
    </>
  )
}

// ============================================================================
// CWS Data Matrix Hooks
// ============================================================================

/** Common info structure for all entity types */
interface EntityInfo {
  shortCode: string
  label: string
  annualDeliveryAvg?: number
  reliabilityPct?: number
  shortageFrequencyPct?: number
}

/** Matrix data structure for monthly percentiles */
type MatrixDataType = Record<
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

/** Cell stats mapping: entityId -> scenarioId -> stats */
export type CellStatsMap = Record<string, Record<string, CellStats>>

/**
 * Build the CWS aggregates view from the batch response.
 *
 * Sourced from `batchData.cws[scenarioId].monthly.aggregates` and
 * `.period.aggregates`. Loading state is owned by the batch hook upstream.
 */
function buildCwsAggregatesData(
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

        // Build per-cell stats: entityId -> scenarioId -> stats
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
function computeOtherSwp(
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

/**
 * Hook to fetch M&I contractor data for multiple scenarios
 */
function useMultiScenarioMiContractors(scenarios: string[]) {
  const monthlyResults = useMultiScenarioSlots(
    scenarios,
    useMiContractorsMonthly,
  )
  const periodResults = useMultiScenarioSlots(scenarios, useMiContractorsPeriod)

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
  const monthlyResults = useMultiScenarioSlots(scenarios, useDemandUnitsMonthly)
  const shortageResults = useMultiScenarioSlots(
    scenarios,
    useDemandUnitsShortageMonthly,
  )
  const periodResults = useMultiScenarioSlots(scenarios, useDemandUnitsPeriod)

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
            label: summary.label,
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
 * Hook to fetch individual demand unit statistics across multiple scenarios
 * Uses the single-unit endpoint for each (scenario, duId) combination
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
  // Create a stable cache key based on scenarios and demand unit IDs
  const cacheKey = useMemo(() => {
    if (demandUnitIds.length === 0) return null
    return ["individual-demand-units", ...scenarios, ...demandUnitIds].join("|")
  }, [scenarios, demandUnitIds])

  // Create a stable fetcher function that SWR can reliably call.
  // Fans out per (duId, scenarioId) to the three decomposed urban-DU endpoints
  // (delivery-monthly, shortage-monthly, period-summary) with `?du_id=X` and
  // stitches the results back into the per-DU shape the matrix builder
  // expects. Shortage 404s are tolerated. some DUs have no shortage data
  const fetcher = useCallback(async () => {
    const results: Record<string, Record<string, StitchedDemandUnitStats>> = {}

    const fetchPromises = demandUnitIds.flatMap((duId) =>
      scenarios.map(async (scenarioId) => {
        try {
          const [monthlyResp, shortageResp, periodResp] = await Promise.all([
            fetchDemandUnitsMonthly(scenarioId, duId).catch(() => null),
            fetchDemandUnitsShortageMonthly(scenarioId, duId).catch(() => null),
            fetchDemandUnitsPeriod(scenarioId, duId).catch(() => null),
          ])

          const monthlyEntry = monthlyResp?.demand_units?.[duId] ?? null
          const shortageEntry = shortageResp?.demand_units?.[duId] ?? null
          const periodEntry = periodResp?.demand_units?.[duId] ?? null

          if (!monthlyEntry && !shortageEntry && !periodEntry) {
            return { duId, scenarioId, data: null }
          }

          const data: StitchedDemandUnitStats = {
            community_agency:
              monthlyEntry?.community_agency ??
              shortageEntry?.community_agency ??
              null,
            period_summary: periodEntry,
            monthly_delivery: monthlyEntry?.monthly_delivery ?? null,
            monthly_shortage: shortageEntry?.monthly_shortage ?? null,
          }

          return { duId, scenarioId, data }
        } catch (err) {
          console.warn(`Failed to fetch stats for ${duId}/${scenarioId}:`, err)
          return { duId, scenarioId, data: null }
        }
      }),
    )

    const responses = await Promise.all(fetchPromises)

    responses.forEach(({ duId, scenarioId, data }) => {
      if (data) {
        if (!results[duId]) {
          results[duId] = {}
        }
        results[duId][scenarioId] = data
      }
    })

    return results
  }, [demandUnitIds, scenarios])

  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<Record<string, Record<string, StitchedDemandUnitStats>>>(
    cacheKey,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

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
function useMultiScenarioCwsData(
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

// ============================================================================
// Monthly CWS Section Component
// ============================================================================

interface MonthlyCwsSectionProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
  /** CWS slice of the batched response (keyed by scenario id) */
  cwsBatch: Record<string, BatchCwsData> | undefined
  /** Whether the batched fetch is still in flight */
  isBatchLoading: boolean
  /** Whether this section is inside a modal (affects dropdown z-index) */
  isModal?: boolean
}

function MonthlyCwsSection({
  scenarios,
  scenarioNames,
  cwsBatch,
  isBatchLoading,
  isModal = false,
}: MonthlyCwsSectionProps) {
  const theme = useTheme()
  const [displayMode, setDisplayMode] = useState<CwsDisplayMode>("delivery")
  const [entityLevel, setEntityLevel] = useState<CwsEntityLevel>("aggregates")
  const [scaleMode, setScaleMode] = useState<VolumeScaleMode>("absolute")
  const [selectedDemandUnit, setSelectedDemandUnit] = useState<string>("")
  const [additionalDemandUnits, setAdditionalDemandUnits] = useState<string[]>(
    [],
  )

  // Fetch list of demand units for the dropdown
  // Uses flat list endpoint and groups client-side by the 'group' field
  const { demandUnits: demandUnitsList, isLoading: demandUnitsLoading } =
    useDemandUnitsList()

  const {
    aggregates,
    matrixData,
    cellStats,
    breakdownData,
    breakdownComponents,
    error,
    addedDemandUnitsHaveShortageData,
    loadingScenarios,
  } = useMultiScenarioCwsData(
    scenarios,
    entityLevel,
    cwsBatch,
    isBatchLoading,
    additionalDemandUnits,
    demandUnitsList,
  )

  // Track when data first arrives to ensure skeleton shows on initial mount
  const [hasReceivedData, setHasReceivedData] = useState(false)
  useEffect(() => {
    if (aggregates.length > 0) {
      setHasReceivedData(true)
    }
  }, [aggregates.length])

  // Convert to PercentileMatrix format
  // Note: We don't pass summary stats in reservoirData because they vary by scenario.
  // Instead, we pass cellStats separately for per-cell rendering below each chart.
  const reservoirData: ReservoirData[] = useMemo(
    () =>
      aggregates.map((agg) => ({
        reservoirId: agg.shortCode,
        reservoirName: agg.label,
        capacityTaf: 0, // Not applicable for CWS
        deadPoolTaf: 0, // Not applicable for CWS
      })),
    [aggregates],
  )

  const percentileData = useMemo(() => {
    const data: Record<
      string,
      Record<string, MonthlyPercentiles | undefined>
    > = {}
    Object.entries(matrixData).forEach(([shortCode, scenarioData]) => {
      const shortCodeData: Record<string, MonthlyPercentiles | undefined> = {}
      Object.entries(scenarioData).forEach(([scenarioId, monthlyData]) => {
        shortCodeData[scenarioId] =
          displayMode === "delivery"
            ? monthlyData?.delivery
            : monthlyData?.shortage
      })
      data[shortCode] = shortCodeData
    })
    return data
  }, [matrixData, displayMode])

  const _bandColors =
    displayMode === "delivery" ? DELIVERY_BAND_COLORS : SHORTAGE_BAND_COLORS

  // Build grouped demand unit options for CompactSelect, excluding already-added ones
  // Groups the flat list by the 'group' field on each demand unit
  const demandUnitGroups = useMemo(() => {
    const excludedIds = new Set(additionalDemandUnits)

    if (demandUnitsList.length === 0) {
      return []
    }

    // Group demand units by their 'group' field (hydrologic region)
    const groupedByField: Record<string, typeof demandUnitsList> = {}
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
  }, [demandUnitsList, additionalDemandUnits])

  const handleAddDemandUnit = () => {
    if (
      selectedDemandUnit &&
      !additionalDemandUnits.includes(selectedDemandUnit)
    ) {
      setAdditionalDemandUnits((prev) => [...prev, selectedDemandUnit])
      setSelectedDemandUnit("")
    }
  }

  const handleRemoveDemandUnit = (duId: string) => {
    setAdditionalDemandUnits((prev) => prev.filter((id) => id !== duId))
  }

  return (
    <>
      {/* Header row */}
      <Box
        sx={{
          gridColumn: "1 / -1",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: theme.space.component.sm,
        }}
      >
        <SectionHeader
          title="Monthly deliveries"
          titleAdornment={
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: theme.space.gap.sm,
              }}
            >
              <CompactSelect
                value={entityLevel}
                onChange={setEntityLevel}
                options={CWS_ENTITY_LEVEL_OPTIONS}
                aria-label="Entity level"
                menuZIndex={isModal ? 9999 : undefined}
              />
              <CompactSelect
                value={displayMode}
                onChange={setDisplayMode}
                options={CWS_DISPLAY_OPTIONS}
                aria-label="Display mode"
                menuZIndex={isModal ? 9999 : undefined}
              />
              <Typography
                variant="compactCaption"
                sx={{ color: theme.palette.grey[500], ml: theme.space.gap.sm }}
              >
                shown on
              </Typography>
              <CompactSelect
                value={scaleMode}
                onChange={setScaleMode}
                options={CWS_SCALE_OPTIONS}
                aria-label="Scale mode"
                menuZIndex={isModal ? 9999 : undefined}
              />
            </Box>
          }
          description={
            <>
              Water year (Oct–Sep) · {scenarios.length} scenario
              {scenarios.length !== 1 ? "s" : ""}
              <Box
                component="span"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  mt: 1.5,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      color: "grey.500",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                    }}
                  >
                    Overlapping percentile bands:
                  </Box>
                  {displayMode === "delivery" ? (
                    <DeliveryBandsLegend />
                  ) : (
                    <ShortageBandsLegend />
                  )}
                </Box>
                <Box
                  component="span"
                  sx={{
                    color: "grey.400",
                    fontSize: "0.8rem",
                    fontStyle: "italic",
                  }}
                >
                  {displayMode === "delivery"
                    ? "Upper chart region = wetter-year delivery · Lower chart region = drier-year delivery"
                    : "Upper chart region = drier-year shortage · Lower chart region = wetter-year shortage (near zero)"}
                </Box>
              </Box>
            </>
          }
        />

        {/* Add demand unit controls */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: theme.space.gap.sm,
          }}
        >
          <CompactSelect
            value={selectedDemandUnit}
            onChange={setSelectedDemandUnit}
            groups={demandUnitGroups}
            placeholder="add a demand unit"
            disabled={demandUnitsLoading}
            minWidth={220}
            maxMenuHeight={400}
            aria-label="Select demand unit to add"
            menuZIndex={isModal ? 9999 : undefined}
          />
          <Button
            variant="text"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={handleAddDemandUnit}
            disabled={!selectedDemandUnit}
            sx={{
              ...theme.typography.dashboard,
              textTransform: "none",
              color: selectedDemandUnit
                ? theme.palette.blue.dark
                : theme.palette.grey[400],
              px: theme.space.component.md,
              "&:hover": {
                backgroundColor: theme.palette.blue.pale,
              },
              "&.Mui-disabled": {
                color: theme.palette.grey[300],
              },
            }}
          >
            Add
          </Button>
        </Box>
      </Box>

      {/* Show added demand unit chips */}
      {additionalDemandUnits.length > 0 && (
        <Box
          sx={{
            gridColumn: "1 / -1",
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            mb: theme.space.component.sm,
          }}
        >
          <Typography
            variant="compactCaption"
            sx={{
              color: theme.palette.grey[500],
              mr: 0.5,
              alignSelf: "center",
            }}
          >
            Added:
          </Typography>
          {additionalDemandUnits.map((id) => {
            const demandUnit = demandUnitsList.find((du) => du.du_id === id)
            return (
              <Box
                key={id}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1,
                  py: 0.25,
                  backgroundColor: theme.palette.grey[100],
                  borderRadius: theme.borderRadius.sm,
                  fontSize: "0.75rem",
                }}
              >
                {demandUnit?.label ?? id}
                <Box
                  component="button"
                  onClick={() => handleRemoveDemandUnit(id)}
                  sx={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    color: theme.palette.grey[500],
                    "&:hover": { color: theme.palette.grey[700] },
                  }}
                  aria-label={`Remove ${demandUnit?.label ?? id}`}
                >
                  ×
                </Box>
              </Box>
            )
          })}
        </Box>
      )}

      {/* Notice when shortage is selected but current view doesn't have shortage data */}
      {displayMode === "shortage" && entityLevel !== "aggregates" && (
        <Box
          sx={{
            gridColumn: "1 / -1",
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: theme.space.component.md,
            py: theme.space.component.sm,
            backgroundColor: "#fef3c7", // amber-100
            borderRadius: theme.borderRadius.sm,
            mb: theme.space.component.sm,
          }}
        >
          <Typography
            variant="compactCaption"
            sx={{ color: "#92400e" }} // amber-800
          >
            Monthly shortage data is only available in the &ldquo;Project
            totals&rdquo; view. Switch to Project totals to see shortage charts.
          </Typography>
        </Box>
      )}

      {/* Notice when shortage is selected in aggregates but added demand units don't have shortage data */}
      {displayMode === "shortage" &&
        entityLevel === "aggregates" &&
        additionalDemandUnits.length > 0 &&
        !addedDemandUnitsHaveShortageData && (
          <Box
            sx={{
              gridColumn: "1 / -1",
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: theme.space.component.md,
              py: theme.space.component.sm,
              backgroundColor: "#fef3c7", // amber-100
              borderRadius: theme.borderRadius.sm,
              mb: theme.space.component.sm,
            }}
          >
            <Typography
              variant="compactCaption"
              sx={{ color: "#92400e" }} // amber-800
            >
              Monthly shortage data is not available for the individually added
              demand units. Shortage charts for these units will appear empty.
            </Typography>
          </Box>
        )}

      {/* Loading state with skeleton - show until we've received data */}
      {!hasReceivedData && !error && (
        <Box sx={{ gridColumn: "1 / -1" }}>
          <PercentileMatrixSkeleton
            scenarios={scenarios}
            rowCount={8}
            message="Loading CWS data..."
            labelColumnWidth={140}
          />
        </Box>
      )}

      {/* Error state - only show if no data at all */}
      {error && aggregates.length === 0 && (
        <Box
          sx={{
            gridColumn: "1 / -1",
            py: theme.space.component.lg,
            px: theme.space.component.md,
            backgroundColor: theme.palette.grey[50],
            borderRadius: theme.borderRadius.sm,
          }}
        >
          <Typography
            variant="compactCaption"
            sx={{ color: theme.palette.grey[500] }}
          >
            Could not load CWS data: {error}
          </Typography>
        </Box>
      )}

      {/* Matrix visualization - show once we've received data */}
      {hasReceivedData && aggregates.length > 0 && (
        <Box sx={{ gridColumn: "1 / -1" }}>
          <PercentileMatrix
            reservoirs={reservoirData}
            scenarios={scenarios}
            scenarioNames={scenarioNames}
            data={percentileData}
            responsive
            labelColumnWidth={140}
            showScenarioHeaders={false}
            displayMode="volume"
            volumeScaleMode={scaleMode}
            colorScheme={displayMode}
            cellStats={cellStats}
            breakdownData={breakdownData}
            breakdownComponents={breakdownComponents}
            loadingScenarios={loadingScenarios}
          />
        </Box>
      )}
    </>
  )
}

// ============================================================================
// Main CWS Section Export
// ============================================================================

interface CwsSectionProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
  /** Pre-fetched batch response (storage/cws/ag/env_flow keyed by scenario) */
  batchData: BatchStatisticsResponse | undefined
  /** Whether the batched fetch is still in flight */
  isBatchLoading: boolean
}

export default function CwsSection({
  scenarios,
  scenarioNames,
  batchData,
  isBatchLoading,
}: CwsSectionProps) {
  const theme = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)
  const cwsBatch = batchData?.cws

  // Columns whose sibling-group id has no scenario variant for the active
  // hydroclimate. Used to swap the per-column tier glyph for the inline
  // placeholder, and to surface a small "Unavailable" strip above the
  // monthly-deliveries block. Stays empty in production today since every
  // group has all three variants
  const { missing, hydroclimate } = useHydroclimateAvailability(scenarios)
  const missingSet = useMemo(() => new Set(missing), [missing])

  return (
    <>
      {/* Sticky scenario header row */}
      <Box
        sx={{
          position: "sticky",
          top: 64,
          zIndex: 9,
          backgroundColor: theme.palette.background.paper,
          py: theme.space.component.sm,
          mx: -theme.space.component.xl,
          px: theme.space.component.xl,
        }}
      >
        <ChartGridProvider scenarios={scenarios}>
          <GridScenarioHeader
            scenarios={scenarios}
            scenarioNames={scenarioNames}
            onExpand={() => setIsExpanded(true)}
          />
        </ChartGridProvider>
      </Box>

      {/* Delivery tier section */}
      <Box sx={{ mt: theme.space.component.md }}>
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: theme.borderRadius.md,
            border: theme.border.light,
            boxShadow: theme.shadow.subtle,
            p: theme.space.component.lg,
            mb: theme.space.component.lg,
          }}
        >
          <ChartGridProvider scenarios={scenarios}>
            {/* Title in column 1, charts in scenario columns - all on same row */}
            <Box sx={{ gridColumn: 1, display: "flex", alignItems: "center" }}>
              <SectionHeader
                title="Delivery distribution"
                description="140 community water systems"
              />
            </Box>
            <CwsTierCharts
              scenarios={scenarios}
              scenarioNames={scenarioNames}
              missingSet={missingSet}
              hydroclimate={hydroclimate}
            />
          </ChartGridProvider>
        </Box>

        {/* Monthly delivery/shortage section */}
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: theme.borderRadius.md,
            border: theme.border.light,
            boxShadow: theme.shadow.subtle,
            p: theme.space.component.lg,
          }}
        >
          {missing.length > 0 && (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: theme.space.gap.sm,
                mb: theme.space.component.sm,
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: theme.palette.grey[600] }}
              >
                Unavailable in this hydroclimate:
              </Typography>
              {missing.map((groupId) => (
                <HydroclimateUnavailablePlaceholder
                  key={groupId}
                  hydroclimate={hydroclimate}
                  groupId={groupId}
                  variant="inline"
                />
              ))}
            </Box>
          )}
          <ChartGridProvider scenarios={scenarios}>
            <MonthlyCwsSection
              scenarios={scenarios}
              scenarioNames={scenarioNames}
              cwsBatch={cwsBatch}
              isBatchLoading={isBatchLoading}
            />
          </ChartGridProvider>
        </Box>
      </Box>

      {/* Expanded modal view */}
      <MobileModal
        open={isExpanded}
        onClose={() => setIsExpanded(false)}
        title={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: theme.space.gap.lg,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: theme.borderRadius.sm,
                backgroundColor: `${getOutcomeCategoryColor(theme, "community-water")}15`,
                color: getOutcomeCategoryColor(theme, "community-water"),
                fontSize: 20,
              }}
            >
              {outcomeCategories.find((c) => c.id === "community-water")?.icon}
            </Box>
            <Typography
              variant="subtitle2"
              sx={{ color: theme.palette.text.primary }}
            >
              Community water systems
            </Typography>
          </Box>
        }
        maxWidth="90vw"
        maxHeight="90vh"
        contentAriaLabel="Community water systems data visualization"
        stickyHeader={
          <ChartGridProvider scenarios={scenarios}>
            <GridScenarioHeader
              scenarios={scenarios}
              scenarioNames={scenarioNames}
            />
          </ChartGridProvider>
        }
      >
        <Box sx={{ p: theme.space.component.lg }}>
          {/* Delivery tier section */}
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.borderRadius.md,
              border: theme.border.light,
              boxShadow: theme.shadow.subtle,
              p: theme.space.component.lg,
              mb: theme.space.component.lg,
            }}
          >
            <ChartGridProvider scenarios={scenarios}>
              {/* Title in column 1, charts in scenario columns - all on same row */}
              <Box
                sx={{ gridColumn: 1, display: "flex", alignItems: "center" }}
              >
                <SectionHeader
                  title="Delivery distribution"
                  description="140 community water systems"
                />
              </Box>
              <CwsTierCharts
                scenarios={scenarios}
                scenarioNames={scenarioNames}
                missingSet={missingSet}
                hydroclimate={hydroclimate}
                isModal
              />
            </ChartGridProvider>
          </Box>

          {/* Monthly delivery/shortage section */}
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.borderRadius.md,
              border: theme.border.light,
              boxShadow: theme.shadow.subtle,
              p: theme.space.component.lg,
            }}
          >
            {missing.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: theme.space.gap.sm,
                  mb: theme.space.component.sm,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.grey[600] }}
                >
                  Unavailable in this hydroclimate:
                </Typography>
                {missing.map((groupId) => (
                  <HydroclimateUnavailablePlaceholder
                    key={groupId}
                    hydroclimate={hydroclimate}
                    groupId={groupId}
                    variant="inline"
                  />
                ))}
              </Box>
            )}
            <ChartGridProvider scenarios={scenarios}>
              <MonthlyCwsSection
                scenarios={scenarios}
                scenarioNames={scenarioNames}
                cwsBatch={cwsBatch}
                isBatchLoading={isBatchLoading}
                isModal
              />
            </ChartGridProvider>
          </Box>
        </Box>
      </MobileModal>
    </>
  )
}
