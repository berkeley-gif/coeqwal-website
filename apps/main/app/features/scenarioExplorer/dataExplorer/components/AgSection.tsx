"use client"

/**
 * AgSection - Agricultural Water section for the Data Explorer
 *
 * Displays agricultural delivery and productivity data:
 * - Revenue tier distribution (AG_REV)
 * - Monthly delivery percentile charts for AG aggregates and demand units
 *
 * Uses the same CSS Grid layout patterns as CwsSection and ReservoirStorageSection.
 */

import React, { useState, useMemo, useEffect } from "react"
import { Box, Typography, useTheme, CircularProgress } from "@repo/ui/mui"
import { CompactSelect, MobileModal } from "@repo/ui"
import { PercentileMatrix } from "@repo/viz"
import type {
  ReservoirData,
  MonthlyPercentiles,
  VolumeScaleMode,
} from "@repo/viz"
import { TierGlyphWithTooltip } from "../../../tooltips/TierGlyphWithTooltip"
import type { ChartDataPoint } from "../../../scenarios/components/shared"
import { GridScenarioHeader } from "./AlignedScenarioGrid"
import { ChartGridProvider } from "./ChartGridContext"
import { PercentileMatrixSkeleton } from "./PercentileMatrixSkeleton"
import {
  useAgAggregatesMonthly,
  useAgAggregatesPeriod,
  useAgDemandUnitsDeliveryMonthly,
  useAgDemandUnitsPeriod,
} from "@repo/data/coeqwal/hooks"
import type {
  AgAggregateData,
  AgAggregatePeriodSummary,
  AgDemandUnitDeliveryData,
  AgDemandUnitPeriodSummary,
  CwsDeliveryMonthlyStats,
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

/** Compact chart size for tier distribution (1.5x scenario-explorer size) */
const TIER_CHART_SIZE = 90

// Get the agricultural tier metric (constant, safe to call outside component)
const AG_TIER_METRIC = getMetricsByCategory("agricultural-water").find(
  (m) => m.isTier,
)

/** Entity level for AG data */
type AgEntityLevel = "aggregates" | "demand-units"

/** Region filter for demand units */
type AgRegionFilter = "all" | "SAC" | "SJR" | "TULARE"

const AG_ENTITY_LEVEL_OPTIONS = [
  { value: "aggregates" as const, label: "Project totals" },
  { value: "demand-units" as const, label: "Demand units" },
]

const AG_SCALE_OPTIONS = [
  { value: "absolute" as const, label: "Absolute scale" },
  { value: "relative" as const, label: "Relative scale" },
]

const AG_REGION_OPTIONS = [
  { value: "all" as const, label: "All regions" },
  { value: "SAC" as const, label: "Sacramento" },
  { value: "SJR" as const, label: "San Joaquin" },
  { value: "TULARE" as const, label: "Tulare" },
]

/** Color scheme for delivery percentile bands (blue) */
const DELIVERY_BAND_COLORS = {
  range: "#d9eafb",
  outer: "#c5dbf3",
  inner: "#a2bee1",
  median: "#2c5aa0",
}

/** Display label overrides for AG aggregates (API label -> display label) */
const AG_AGGREGATE_LABEL_MAP: Record<string, string> = {
  "SWP Project AG": "SWP AG\nTotal",
  "SWP Project AG North": "SWP AG\nNorth of Delta",
  "SWP Project AG South": "SWP AG\nSouth of Delta",
  "CVP Project AG North": "CVP AG\nNorth of Delta",
  "CVP Project AG South": "CVP AG\nSouth of Delta",
}

/** Custom sort order for AG aggregates (short_code -> sort index) */
const AG_AGGREGATE_SORT_ORDER: Record<string, number> = {
  swp_pag_n: 0,
  swp_pag_s: 1,
  swp_pag: 2,
  cvp_pag_n: 3,
  cvp_pag_s: 4,
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
        10-90th percentile
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
        30-70th percentile
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

// ============================================================================
// Ag Tier Row Component
// ============================================================================

interface AgTierChartsProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
  /** Whether this is inside a modal (affects tooltip z-index) */
  isModal?: boolean
}

function AgTierCharts({
  scenarios,
  scenarioNames,
  isModal = false,
}: AgTierChartsProps) {
  const theme = useTheme()
  const { data, isLoading } = useMetricData(
    scenarios,
    AG_TIER_METRIC as OutcomeMetric,
  )

  if (!AG_TIER_METRIC) return null

  return (
    <>
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
                —
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
              outcomeCode="AG_REV"
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
// AG Data Matrix Hooks
// ============================================================================

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
interface CellStats {
  annualAvgTaf?: number
  reliabilityPct?: number
}

/** Cell stats mapping: entityId -> scenarioId -> stats */
type CellStatsMap = Record<string, Record<string, CellStats>>

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
 * Hook to fetch AG aggregate data for multiple scenarios
 *
 * AG aggregates have delivery data only.
 */
function useMultiScenarioAgAggregates(scenarios: string[]) {
  // Fetch monthly data for each scenario
  const monthlyResults = scenarios.map((scenarioId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useAgAggregatesMonthly(scenarioId)
  })

  // Fetch period summary for ALL scenarios (for per-cell stats)
  const periodResults = scenarios.map((scenarioId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useAgAggregatesPeriod(scenarioId)
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

  // Process monthly data for each scenario
  monthlyResults.forEach((result, index) => {
    const scenarioId = scenarios[index]
    if (!scenarioId || !result.aggregates) return

    Object.entries(result.aggregates).forEach(
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

  // Track which scenarios are still loading
  const loadingScenarios = scenarios.filter(
    (_, index) => monthlyResults[index]?.isLoading ?? false,
  )

  const entities = Object.values(entityMap)
    .filter((e) => e && e.label)
    .sort((a, b) => {
      const orderA = AG_AGGREGATE_SORT_ORDER[a.shortCode] ?? 999
      const orderB = AG_AGGREGATE_SORT_ORDER[b.shortCode] ?? 999
      if (orderA !== orderB) return orderA - orderB
      return (a.label ?? "").localeCompare(b.label ?? "")
    })

  return { entities, matrixData, cellStats, isLoading, error, loadingScenarios }
}

/**
 * Hook to fetch AG demand unit delivery data for multiple scenarios.
 * Also fetches period summary for cell stats.
 *
 * Note: AG shortage is not reported because CalSim assumes AG demand units
 * make up any shortage with groundwater pumping.
 */
function useMultiScenarioAgDemandUnits(scenarios: string[]) {
  // Fetch delivery monthly for each scenario
  const deliveryResults = scenarios.map((scenarioId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useAgDemandUnitsDeliveryMonthly(scenarioId)
  })

  // Fetch period summary for ALL scenarios (for per-cell stats)
  const periodResults = scenarios.map((scenarioId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useAgDemandUnitsPeriod(scenarioId)
  })

  const isLoading =
    deliveryResults.some((r) => r.isLoading) ||
    periodResults.some((r) => r.isLoading)
  const error =
    deliveryResults.find((r) => r.error)?.error ??
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
      ([duId, summary]: [string, AgDemandUnitPeriodSummary]) => {
        if (!entityMap[duId]) {
          entityMap[duId] = {
            shortCode: duId,
            label: summary.agency,
            annualDeliveryAvg: summary.annual_delivery_avg_taf,
            reliabilityPct: summary.reliability_pct,
            hydrologicRegion: summary.hydrologic_region,
          }
        }

        if (!cellStats[duId]) {
          cellStats[duId] = {}
        }
        cellStats[duId][scenarioId] = {
          annualAvgTaf: summary.annual_delivery_avg_taf,
          reliabilityPct: summary.reliability_pct ?? undefined,
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
            label: data.agency,
            hydrologicRegion: data.hydrologic_region,
          }
        }
        if (!matrixData[duId]) {
          matrixData[duId] = {}
        }

        matrixData[duId][scenarioId] = data.monthly_delivery
          ? deliveryStatsToPercentiles(data.monthly_delivery)
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

  return { entities, matrixData, cellStats, isLoading, error, loadingScenarios }
}

/**
 * Combined hook that delegates to the appropriate entity-level hook
 */
function useMultiScenarioAgData(
  scenarios: string[],
  entityLevel: AgEntityLevel,
) {
  const aggregatesData = useMultiScenarioAgAggregates(scenarios)
  const demandUnitsData = useMultiScenarioAgDemandUnits(scenarios)

  switch (entityLevel) {
    case "demand-units":
      return {
        entities: demandUnitsData.entities,
        matrixData: demandUnitsData.matrixData,
        cellStats: demandUnitsData.cellStats,
        isLoading: demandUnitsData.isLoading,
        error: demandUnitsData.error,
        loadingScenarios: demandUnitsData.loadingScenarios,
      }
    case "aggregates":
    default:
      return {
        entities: aggregatesData.entities,
        matrixData: aggregatesData.matrixData,
        cellStats: aggregatesData.cellStats,
        isLoading: aggregatesData.isLoading,
        error: aggregatesData.error,
        loadingScenarios: aggregatesData.loadingScenarios,
      }
  }
}

// ============================================================================
// Monthly Ag Section Component
// ============================================================================

interface MonthlyAgSectionProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
  isModal?: boolean
}

function MonthlyAgSection({
  scenarios,
  scenarioNames,
  isModal = false,
}: MonthlyAgSectionProps) {
  const theme = useTheme()
  const [entityLevel, setEntityLevel] = useState<AgEntityLevel>("aggregates")
  const [scaleMode, setScaleMode] = useState<VolumeScaleMode>("absolute")
  const [regionFilter, setRegionFilter] = useState<AgRegionFilter>("all")

  const { entities, matrixData, cellStats, error, loadingScenarios } =
    useMultiScenarioAgData(scenarios, entityLevel)

  // Track when data arrives - set true when entities load, false when empty
  // (e.g., switching entity level before data loads)
  const [hasReceivedData, setHasReceivedData] = useState(false)
  useEffect(() => {
    if (entities.length > 0) {
      setHasReceivedData(true)
    } else {
      setHasReceivedData(false)
    }
  }, [entities.length])

  // Filter entities by region
  const filteredEntities = useMemo(() => {
    if (entityLevel === "demand-units" && regionFilter !== "all") {
      return entities.filter((e) => e.hydrologicRegion === regionFilter)
    }
    return entities
  }, [entities, entityLevel, regionFilter])

  // Convert to PercentileMatrix format
  const reservoirData: ReservoirData[] = useMemo(
    () =>
      filteredEntities.map((entity) => ({
        reservoirId: entity.shortCode,
        reservoirName: entity.label,
        capacityTaf: 0,
        deadPoolTaf: 0,
      })),
    [filteredEntities],
  )

  // matrixData is already in the correct format for PercentileMatrix
  const percentileData = matrixData

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
              <Typography variant="compactCaption" sx={{ fontWeight: 500 }}>
                Project totals
              </Typography>
              <Typography
                variant="compactCaption"
                sx={{ color: theme.palette.grey[500], ml: theme.space.gap.sm }}
              >
                shown on
              </Typography>
              <CompactSelect
                value={scaleMode}
                onChange={setScaleMode}
                options={AG_SCALE_OPTIONS}
                aria-label="Scale mode"
                menuZIndex={isModal ? 9999 : undefined}
              />
            </Box>
          }
          description={
            <>
              Water year (Oct-Sep) · {scenarios.length} scenario
              {scenarios.length !== 1 ? "s" : ""} · {filteredEntities.length}{" "}
              project aggregates
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
                  <DeliveryBandsLegend />
                </Box>
              </Box>
            </>
          }
        />
      </Box>

      {/* Loading state with skeleton - show until we've received data */}
      {!hasReceivedData && !error && (
        <Box sx={{ gridColumn: "1 / -1" }}>
          <PercentileMatrixSkeleton
            scenarios={scenarios}
            rowCount={entityLevel === "aggregates" ? 5 : 8}
            message="Loading AG data..."
            labelColumnWidth={140}
          />
        </Box>
      )}

      {/* Error state - only show if no data at all */}
      {error && filteredEntities.length === 0 && (
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
            Could not load AG data: {error}
          </Typography>
        </Box>
      )}

      {/* Empty state for filtered demand units */}
      {hasReceivedData &&
        filteredEntities.length === 0 &&
        !error &&
        entityLevel === "demand-units" && (
          <Box
            sx={{
              gridColumn: "1 / -1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 200,
              backgroundColor: theme.palette.grey[50],
              borderRadius: theme.borderRadius.sm,
              border: `1px dashed ${theme.palette.grey[300]}`,
            }}
          >
            <Typography
              variant="compactCaption"
              sx={{ color: theme.palette.grey[400] }}
            >
              No demand units found for the selected region.
            </Typography>
          </Box>
        )}

      {/* Matrix visualization - show once we've received data */}
      {hasReceivedData && filteredEntities.length > 0 && (
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
            colorScheme="delivery"
            cellStats={cellStats}
            loadingScenarios={loadingScenarios}
          />
        </Box>
      )}
    </>
  )
}

// ============================================================================
// Main Ag Section Export
// ============================================================================

interface AgSectionProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
  /** Pre-fetched batch data for performance (optional) */
  batchData?: import("@repo/data/coeqwal").BatchStatisticsResponse
}

export default function AgSection({
  scenarios,
  scenarioNames,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  batchData,
}: AgSectionProps) {
  const theme = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)

  // Note: batchData contains pre-fetched AG aggregate data
  // It can be used to speed up initial rendering (future enhancement)

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

      {/* Revenue tier section */}
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
            {/* Title in column 1, charts in scenario columns - all on same row */}
            <Box sx={{ gridColumn: 1, display: "flex", alignItems: "center" }}>
              <SectionHeader
                title="Revenue distribution"
                description="134 agricultural demand units"
              />
            </Box>
            <AgTierCharts scenarios={scenarios} scenarioNames={scenarioNames} />
          </ChartGridProvider>
        </Box>

        {/* Monthly delivery section */}
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: theme.borderRadius.md,
            border: theme.border.light,
            p: theme.space.component.lg,
          }}
        >
          <ChartGridProvider scenarios={scenarios}>
            <MonthlyAgSection
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
                backgroundColor: `${getOutcomeCategoryColor(theme, "agricultural-water")}15`,
                color: getOutcomeCategoryColor(theme, "agricultural-water"),
                fontSize: 20,
              }}
            >
              {
                outcomeCategories.find((c) => c.id === "agricultural-water")
                  ?.icon
              }
            </Box>
            <Typography
              variant="subtitle2"
              sx={{ color: theme.palette.text.primary }}
            >
              Agricultural water
            </Typography>
          </Box>
        }
        maxWidth="90vw"
        maxHeight="90vh"
        contentAriaLabel="Agricultural water data visualization"
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
          {/* Revenue tier section */}
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
              {/* Title in column 1, charts in scenario columns - all on same row */}
              <Box
                sx={{ gridColumn: 1, display: "flex", alignItems: "center" }}
              >
                <SectionHeader
                  title="Revenue distribution"
                  description="134 agricultural demand units"
                />
              </Box>
              <AgTierCharts
                scenarios={scenarios}
                scenarioNames={scenarioNames}
                isModal
              />
            </ChartGridProvider>
          </Box>

          {/* Monthly delivery section */}
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.borderRadius.md,
              border: theme.border.light,
              p: theme.space.component.lg,
            }}
          >
            <ChartGridProvider scenarios={scenarios}>
              <MonthlyAgSection
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
