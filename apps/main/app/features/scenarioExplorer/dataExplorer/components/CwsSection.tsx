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

import React, { useState, useMemo } from "react"
import { Box, Typography, useTheme, CircularProgress } from "@repo/ui/mui"
import { CompactSelect, MobileModal } from "@repo/ui"
import { VerticalBarChart, TierCircles, PercentileMatrix } from "@repo/viz"
import type { ReservoirData, MonthlyPercentiles, VolumeScaleMode } from "@repo/viz"
import { GridScenarioHeader } from "./AlignedScenarioGrid"
import {
  ChartGridProvider,
  useChartGridLayout,
  CHART_SIZING,
} from "./ChartGridContext"
import {
  useCwsAggregatesMonthly,
  useCwsAggregatesPeriod,
  useMiContractorsMonthly,
  useMiContractorsPeriod,
  useDemandUnitsMonthly,
  useDemandUnitsPeriod,
} from "@repo/data/coeqwal/hooks"
import type {
  CwsAggregateData,
  CwsAggregatePeriodSummary,
  MiContractorData,
  MiContractorPeriodSummary,
  DemandUnitData,
  DemandUnitPeriodSummary,
} from "@repo/data/coeqwal"
import {
  outcomeCategories,
  getOutcomeCategoryColor,
  getMetricsByCategory,
  type OutcomeMetric,
} from "../../config/outcomeDefinitions"
import { useMetricData } from "../hooks/useMetricData"

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
  { value: "aggregates" as const, label: "Large totals" },
  { value: "contractors" as const, label: "M&I Contractors" },
  { value: "demand-units" as const, label: "Demand units" },
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
}

// ============================================================================
// Section Header Component
// ============================================================================

interface SectionHeaderProps {
  title: string
  titleAdornment?: React.ReactNode
  description?: React.ReactNode
}

function SectionHeader({
  title,
  titleAdornment,
  description,
}: SectionHeaderProps) {
  const theme = useTheme()

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      {/* Title row with optional inline adornment */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: theme.space.gap.sm,
        }}
      >
        <Typography
          variant="overline"
          sx={{
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </Typography>
        {titleAdornment}
      </Box>

      {/* Description line */}
      {description && (
        <Box
          sx={{
            color: theme.palette.grey[600],
            mt: 0.5,
            ...theme.typography.dashboard,
          }}
        >
          {description}
        </Box>
      )}
    </Box>
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

/**
 * Helper to check if tier data is single-value type
 */
function isSingleValueTierData(
  tierData: Array<{
    label: string
    color: string
    value: number
    tierType?: "single_value" | "multi_value"
  }>,
): boolean {
  if (!tierData || tierData.length === 0) return false
  return tierData[0]?.tierType === "single_value"
}

interface CwsTierRowProps {
  scenarios: string[]
}

function CwsTierRow({ scenarios }: CwsTierRowProps) {
  const theme = useTheme()
  const layout = useChartGridLayout()
  const { data, isLoading } = useMetricData(
    scenarios,
    CWS_TIER_METRIC as OutcomeMetric,
  )

  const chartSize = layout?.chartSize ?? CHART_SIZING.defaultSize
  const minHeight = chartSize + 16

  if (!CWS_TIER_METRIC) return null

  return (
    <>
      {/* Label column (empty for this row) */}
      <Box sx={{ gridColumn: 1, minHeight }} />

      {/* Chart cells - one per scenario */}
      {scenarios.map((scenarioId, index) => {
        if (isLoading) {
          return (
            <Box
              key={scenarioId}
              sx={{
                gridColumn: index + 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight,
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
                minHeight,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.palette.grey[100],
                  borderRadius: theme.borderRadius.md,
                  border: theme.border.medium,
                  width: chartSize,
                  height: chartSize,
                }}
              >
                <Typography
                  variant="outcomeLabel"
                  sx={{
                    color: theme.palette.grey[700],
                    px: theme.space.component.xs,
                    textAlign: "center",
                  }}
                >
                  Baseline for comparison
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
                minHeight,
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: theme.palette.grey[400] }}
              >
                —
              </Typography>
            </Box>
          )
        }

        return (
          <Box
            key={scenarioId}
            sx={{
              gridColumn: index + 2,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight,
            }}
          >
            {isSingleValueTierData(scenarioData.tierData) ? (
              <TierCircles tiers={scenarioData.tierData} size={chartSize} />
            ) : (
              <VerticalBarChart
                tiers={scenarioData.tierData}
                size={chartSize}
              />
            )}
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
}

/** Cell stats mapping: entityId -> scenarioId -> stats */
export type CellStatsMap = Record<string, Record<string, CellStats>>

/**
 * Hook to fetch CWS aggregate data for multiple scenarios
 */
function useMultiScenarioCwsAggregates(scenarios: string[]) {
  // Fetch monthly data for each scenario
  const monthlyResults = scenarios.map((scenarioId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCwsAggregatesMonthly(scenarioId)
  })

  // Fetch period summary for ALL scenarios (for per-cell stats)
  const periodResults = scenarios.map((scenarioId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCwsAggregatesPeriod(scenarioId)
  })

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
    if (!scenarioId || !periodResult.aggregates) return

    Object.entries(periodResult.aggregates).forEach(
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
        cellStats[shortCode][scenarioId] = {
          annualAvgTaf: summary.annual_delivery_avg_taf,
          reliabilityPct: summary.reliability_pct,
          shortageFrequencyPct: summary.shortage_frequency_pct,
        }
      },
    )
  })

  // Process monthly data for each scenario
  monthlyResults.forEach((result, index) => {
    const scenarioId = scenarios[index]
    if (!scenarioId || !result.aggregates) return

    Object.entries(result.aggregates).forEach(
      ([shortCode, data]: [string, CwsAggregateData]) => {
        if (!entityMap[shortCode]) {
          // Apply label mapping if available, otherwise use API label
          const displayLabel =
            CWS_AGGREGATE_LABEL_MAP[data.label] ?? data.label
          entityMap[shortCode] = { shortCode, label: displayLabel }
        }
        if (!matrixData[shortCode]) {
          matrixData[shortCode] = {}
        }

        const deliveryPercentiles: MonthlyPercentiles = {}
        const shortagePercentiles: MonthlyPercentiles = {}

        Object.entries(data.monthly_delivery).forEach(([month, stats]) => {
          // Skip if stats are null
          if (stats.q0 == null) return
          deliveryPercentiles[month] = {
            q0: stats.q0,
            q10: stats.q10,
            q30: stats.q30,
            q50: stats.q50,
            q70: stats.q70,
            q90: stats.q90,
            q100: stats.q100,
            mean: stats.avg_taf,
          }
        })

        Object.entries(data.monthly_shortage).forEach(([month, stats]) => {
          // Skip if stats are null (e.g., MWD has no shortage data)
          if (stats.q0 == null) return
          shortagePercentiles[month] = {
            q0: stats.q0,
            q10: stats.q10,
            q30: stats.q30,
            q50: stats.q50,
            q70: stats.q70,
            q90: stats.q90,
            q100: stats.q100,
            mean: stats.avg_taf,
          }
        })

        matrixData[shortCode][scenarioId] = {
          delivery: deliveryPercentiles,
          shortage: shortagePercentiles,
        }
      },
    )
  })

  const entities = Object.values(entityMap).sort((a, b) =>
    a.label.localeCompare(b.label),
  )

  return { entities, matrixData, cellStats, isLoading, error }
}

/**
 * Hook to fetch M&I contractor data for multiple scenarios
 */
function useMultiScenarioMiContractors(scenarios: string[]) {
  // Fetch monthly data for each scenario
  const monthlyResults = scenarios.map((scenarioId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMiContractorsMonthly(scenarioId)
  })

  // Fetch period summary for ALL scenarios (for per-cell stats)
  const periodResults = scenarios.map((scenarioId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMiContractorsPeriod(scenarioId)
  })

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
        cellStats[shortCode][scenarioId] = {
          annualAvgTaf: summary.annual_delivery_avg_taf,
          reliabilityPct: summary.reliability_pct,
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
        if (!entityMap[shortCode]) {
          entityMap[shortCode] = { shortCode, label: data.label }
        }
        if (!matrixData[shortCode]) {
          matrixData[shortCode] = {}
        }

        const deliveryPercentiles: MonthlyPercentiles = {}
        const shortagePercentiles: MonthlyPercentiles = {}

        Object.entries(data.monthly_delivery).forEach(([month, stats]) => {
          // Skip if stats are null
          if (stats.q0 == null) return
          deliveryPercentiles[month] = {
            q0: stats.q0,
            q10: stats.q10,
            q30: stats.q30,
            q50: stats.q50,
            q70: stats.q70,
            q90: stats.q90,
            q100: stats.q100,
            mean: stats.avg_taf,
          }
        })

        Object.entries(data.monthly_shortage).forEach(([month, stats]) => {
          // Skip if stats are null
          if (stats.q0 == null) return
          shortagePercentiles[month] = {
            q0: stats.q0,
            q10: stats.q10,
            q30: stats.q30,
            q50: stats.q50,
            q70: stats.q70,
            q90: stats.q90,
            q100: stats.q100,
            mean: stats.avg_taf,
          }
        })

        matrixData[shortCode][scenarioId] = {
          delivery: deliveryPercentiles,
          shortage: shortagePercentiles,
        }
      },
    )
  })

  const entities = Object.values(entityMap).sort((a, b) =>
    a.label.localeCompare(b.label),
  )

  return { entities, matrixData, cellStats, isLoading, error }
}

/**
 * Hook to fetch urban demand unit data for multiple scenarios
 */
function useMultiScenarioDemandUnits(scenarios: string[]) {
  // Fetch monthly data for each scenario
  const monthlyResults = scenarios.map((scenarioId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useDemandUnitsMonthly(scenarioId)
  })

  // Fetch period summary for ALL scenarios (for per-cell stats)
  const periodResults = scenarios.map((scenarioId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useDemandUnitsPeriod(scenarioId)
  })

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
        cellStats[duId][scenarioId] = {
          annualAvgTaf: summary.annual_delivery_avg_taf,
          reliabilityPct: summary.reliability_pct,
          shortageFrequencyPct: summary.shortage_frequency_pct,
        }
      },
    )
  })

  // Process monthly data for each scenario
  monthlyResults.forEach((result, index) => {
    const scenarioId = scenarios[index]
    if (!scenarioId || !result.demandUnits) return

    Object.entries(result.demandUnits).forEach(
      ([duId, data]: [string, DemandUnitData]) => {
        if (!entityMap[duId]) {
          entityMap[duId] = { shortCode: duId, label: data.label }
        }
        if (!matrixData[duId]) {
          matrixData[duId] = {}
        }

        const deliveryPercentiles: MonthlyPercentiles = {}
        const shortagePercentiles: MonthlyPercentiles = {}

        Object.entries(data.monthly_delivery).forEach(([month, stats]) => {
          // Skip if stats are null
          if (stats.q0 == null) return
          deliveryPercentiles[month] = {
            q0: stats.q0,
            q10: stats.q10,
            q30: stats.q30,
            q50: stats.q50,
            q70: stats.q70,
            q90: stats.q90,
            q100: stats.q100,
            mean: stats.avg_taf,
          }
        })

        Object.entries(data.monthly_shortage).forEach(([month, stats]) => {
          // Skip if stats are null
          if (stats.q0 == null) return
          shortagePercentiles[month] = {
            q0: stats.q0,
            q10: stats.q10,
            q30: stats.q30,
            q50: stats.q50,
            q70: stats.q70,
            q90: stats.q90,
            q100: stats.q100,
            mean: stats.avg_taf,
          }
        })

        matrixData[duId][scenarioId] = {
          delivery: deliveryPercentiles,
          shortage: shortagePercentiles,
        }
      },
    )
  })

  const entities = Object.values(entityMap).sort((a, b) =>
    a.label.localeCompare(b.label),
  )

  return { entities, matrixData, cellStats, isLoading, error }
}

/**
 * Combined hook that delegates to the appropriate entity-level hook
 */
function useMultiScenarioCwsData(
  scenarios: string[],
  entityLevel: CwsEntityLevel,
) {
  const aggregatesData = useMultiScenarioCwsAggregates(scenarios)
  const contractorsData = useMultiScenarioMiContractors(scenarios)
  const demandUnitsData = useMultiScenarioDemandUnits(scenarios)

  // Return data based on selected entity level
  switch (entityLevel) {
    case "contractors":
      return {
        aggregates: contractorsData.entities,
        matrixData: contractorsData.matrixData,
        cellStats: contractorsData.cellStats,
        isLoading: contractorsData.isLoading,
        error: contractorsData.error,
      }
    case "demand-units":
      return {
        aggregates: demandUnitsData.entities,
        matrixData: demandUnitsData.matrixData,
        cellStats: demandUnitsData.cellStats,
        isLoading: demandUnitsData.isLoading,
        error: demandUnitsData.error,
      }
    case "aggregates":
    default:
      return {
        aggregates: aggregatesData.entities,
        matrixData: aggregatesData.matrixData,
        cellStats: aggregatesData.cellStats,
        isLoading: aggregatesData.isLoading,
        error: aggregatesData.error,
      }
  }
}

// ============================================================================
// Monthly CWS Section Component
// ============================================================================

interface MonthlyCwsSectionProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
  /** Whether this section is inside a modal (affects dropdown z-index) */
  isModal?: boolean
}

function MonthlyCwsSection({
  scenarios,
  scenarioNames,
  isModal = false,
}: MonthlyCwsSectionProps) {
  const theme = useTheme()
  const [displayMode, setDisplayMode] = useState<CwsDisplayMode>("delivery")
  const [entityLevel, setEntityLevel] =
    useState<CwsEntityLevel>("aggregates")
  const [scaleMode, setScaleMode] = useState<VolumeScaleMode>("absolute")

  const { aggregates, matrixData, cellStats, isLoading, error } =
    useMultiScenarioCwsData(scenarios, entityLevel)

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
    const data: Record<string, Record<string, MonthlyPercentiles | undefined>> =
      {}
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

  const bandColors =
    displayMode === "delivery" ? DELIVERY_BAND_COLORS : SHORTAGE_BAND_COLORS

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
            <Box sx={{ display: "flex", alignItems: "center", gap: theme.space.gap.sm }}>
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
              </Box>
            </>
          }
        />
      </Box>

      {/* Loading state */}
      {isLoading && aggregates.length === 0 && (
        <Box
          sx={{
            gridColumn: "1 / -1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            py: theme.space.section.md,
          }}
        >
          <CircularProgress size={20} sx={{ color: theme.palette.grey[300] }} />
          <Typography
            variant="compactCaption"
            sx={{ ml: theme.space.component.md, color: theme.palette.grey[400] }}
          >
            Loading CWS data...
          </Typography>
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

      {/* Matrix visualization - show if we have data, even with partial errors */}
      {!isLoading && aggregates.length > 0 && (
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
          />
        </Box>
      )}

      {/* No data state */}
      {!isLoading && aggregates.length === 0 && !error && (
        <Typography
          variant="compactCaption"
          sx={{
            gridColumn: "1 / -1",
            color: theme.palette.grey[400],
            fontStyle: "italic",
            textAlign: "center",
            py: theme.space.section.sm,
          }}
        >
          No CWS data available for the selected scenarios.
        </Typography>
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
}

export default function CwsSection({
  scenarios,
  scenarioNames,
}: CwsSectionProps) {
  const theme = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      {/* Sticky scenario header row */}
      <Box
        sx={{
          position: "sticky",
          top: 64,
          zIndex: 9,
          backgroundColor: theme.palette.background.default,
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
            p: theme.space.component.lg,
            mb: theme.space.component.lg,
          }}
        >
          <ChartGridProvider scenarios={scenarios}>
            <Box sx={{ gridColumn: 1, mb: theme.space.component.sm }}>
              <SectionHeader
                title="Delivery distribution"
                description="140 community water systems"
              />
            </Box>
            {scenarios.map((_, index) => (
              <Box
                key={`header-spacer-${index}`}
                sx={{ gridColumn: index + 2 }}
              />
            ))}
            <CwsTierRow scenarios={scenarios} />
          </ChartGridProvider>
        </Box>

        {/* Monthly delivery/shortage section */}
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: theme.borderRadius.md,
            border: theme.border.light,
            p: theme.space.component.lg,
          }}
        >
          <ChartGridProvider scenarios={scenarios}>
            <MonthlyCwsSection
              scenarios={scenarios}
              scenarioNames={scenarioNames}
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
              {
                outcomeCategories.find((c) => c.id === "community-water")
                  ?.icon
              }
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
              p: theme.space.component.lg,
              mb: theme.space.component.lg,
            }}
          >
            <ChartGridProvider scenarios={scenarios}>
              <Box sx={{ gridColumn: 1, mb: theme.space.component.sm }}>
                <SectionHeader
                  title="Delivery distribution"
                  description="140 community water systems"
                />
              </Box>
              {scenarios.map((_, index) => (
                <Box
                  key={`modal-header-spacer-${index}`}
                  sx={{ gridColumn: index + 2 }}
                />
              ))}
              <CwsTierRow scenarios={scenarios} />
            </ChartGridProvider>
          </Box>

          {/* Monthly delivery/shortage section */}
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.borderRadius.md,
              border: theme.border.light,
              p: theme.space.component.lg,
            }}
          >
            <ChartGridProvider scenarios={scenarios}>
              <MonthlyCwsSection
                scenarios={scenarios}
                scenarioNames={scenarioNames}
                isModal
              />
            </ChartGridProvider>
          </Box>
        </Box>
      </MobileModal>
    </>
  )
}
