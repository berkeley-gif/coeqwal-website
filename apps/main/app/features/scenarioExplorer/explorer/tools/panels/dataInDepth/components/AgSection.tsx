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
import {
  Box,
  Typography,
  useTheme,
  CircularProgress,
  Button,
} from "@repo/ui/mui"
import { AddIcon } from "@repo/ui/mui"
import { CompactSelect, MobileModal } from "@repo/ui"
import { PercentileMatrix } from "@repo/viz"
import type {
  ReservoirData,
  MonthlyPercentiles,
  VolumeScaleMode,
} from "@repo/viz"
import { TierGlyphWithTooltip } from "../../../../../../tooltips/TierGlyphWithTooltip"
import type { ChartDataPoint } from "../../../../../../scenarios/components/shared"
import { GridScenarioHeader } from "./AlignedScenarioGrid"
import { ChartGridProvider } from "./ChartGridContext"
import { PercentileMatrixSkeleton } from "./PercentileMatrixSkeleton"
import { useMultiScenarioSlots } from "./useMultiScenarioSlots"
import {
  useAgDemandUnitsList,
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
  BatchStatisticsResponse,
  BatchAgData,
} from "@repo/data/coeqwal"
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

/** Compact chart size for tier distribution (1.5x scenario-explorer size) */
const TIER_CHART_SIZE = 90

// Get the agricultural tier metric (constant, safe to call outside component)
const AG_TIER_METRIC = getMetricsByCategory("agricultural-water").find(
  (m) => m.isTier,
)

const AG_SCALE_OPTIONS = [
  { value: "absolute" as const, label: "Absolute scale" },
  { value: "relative" as const, label: "Relative scale" },
]

/** Human-readable label for each hydrologic region code */
const AG_REGION_LABELS: Record<string, string> = {
  SAC: "Sacramento",
  SJR: "San Joaquin",
  TULARE: "Tulare",
}

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
  /** Sibling-group ids with no variant for the active hydroclimate */
  missingSet: Set<string>
  /** Active hydroclimate value, used to label the missing-variant placeholder */
  hydroclimate: string
  /** Whether this is inside a modal (affects tooltip z-index) */
  isModal?: boolean
}

function AgTierCharts({
  scenarios,
  scenarioNames,
  missingSet,
  hydroclimate,
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
 * `q0` is tolerated as null and coerced to 0 - a DU with zero shortage
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
            label: summary.agency,
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
function useMultiScenarioAgData(
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

// ============================================================================
// Monthly Ag Section Component
// ============================================================================

interface MonthlyAgSectionProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
  /** AG slice of the batched response (keyed by scenario id) */
  agBatch: Record<string, BatchAgData> | undefined
  /** Whether the batched fetch is still in flight */
  isBatchLoading: boolean
  isModal?: boolean
}

function MonthlyAgSection({
  scenarios,
  scenarioNames,
  agBatch,
  isBatchLoading,
  isModal = false,
}: MonthlyAgSectionProps) {
  const theme = useTheme()
  const [scaleMode, setScaleMode] = useState<VolumeScaleMode>("absolute")
  const [selectedDemandUnit, setSelectedDemandUnit] = useState<string>("")
  const [additionalDemandUnits, setAdditionalDemandUnits] = useState<string[]>(
    [],
  )

  const { demandUnits: demandUnitsList, isLoading: demandUnitsLoading } =
    useAgDemandUnitsList()

  const { entities, matrixData, cellStats, error, loadingScenarios } =
    useMultiScenarioAgData(
      scenarios,
      agBatch,
      isBatchLoading,
      additionalDemandUnits,
      demandUnitsList,
    )

  // Track when data arrives. We flip false once entities are empty so the
  // skeleton can re-appear if scenarios change
  const [hasReceivedData, setHasReceivedData] = useState(false)
  useEffect(() => {
    if (entities.length > 0) {
      setHasReceivedData(true)
    } else {
      setHasReceivedData(false)
    }
  }, [entities.length])

  // Group options for the "Add a demand unit" CompactSelect: by hydrologic
  // region (Sacramento / San Joaquin / Tulare / Other), with already-added
  // ids removed. Label format is "Agency (du_id)" to disambiguate
  const demandUnitGroups = useMemo(() => {
    if (demandUnitsList.length === 0) return []
    const excludedIds = new Set(additionalDemandUnits)

    const groupedByRegion: Record<string, AgDemandUnitListItem[]> = {}
    demandUnitsList.forEach((du) => {
      if (!du || !du.du_id) return
      const regionLabel = du.hydrologic_region
        ? (AG_REGION_LABELS[du.hydrologic_region] ?? du.hydrologic_region)
        : "Other"
      if (!groupedByRegion[regionLabel]) {
        groupedByRegion[regionLabel] = []
      }
      groupedByRegion[regionLabel].push(du)
    })

    return Object.entries(groupedByRegion)
      .map(([regionLabel, units]) => ({
        label: regionLabel,
        options: units
          .filter((du) => !excludedIds.has(du.du_id))
          .map((du) => ({
            value: du.du_id,
            // Agency strings can already contain "(X% of total)" to mark
            // entities split across multiple model DUs by acreage. No need
            // to append the du_id, which would produce two parentheticals
            label: du.agency ?? du.du_id,
          }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      }))
      .filter((g) => g.options.length > 0)
      .sort((a, b) => a.label.localeCompare(b.label))
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

  const reservoirData: ReservoirData[] = useMemo(
    () =>
      entities.map((entity) => ({
        reservoirId: entity.shortCode,
        reservoirName: entity.label,
        capacityTaf: 0,
        deadPoolTaf: 0,
      })),
    [entities],
  )

  return (
    <>
      {/* Header row: title/legend on the left, "add a demand unit" controls on the right */}
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
              <Typography
                variant="compactCaption"
                sx={{ color: theme.palette.grey[500] }}
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
                  <DeliveryBandsLegend />
                </Box>
                <Box
                  component="span"
                  sx={{
                    color: "grey.400",
                    fontSize: "0.8rem",
                    fontStyle: "italic",
                  }}
                >
                  Upper chart region = wetter-year delivery · Lower chart region
                  = drier-year delivery
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

      {/* Added demand-unit chips */}
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
            const du = demandUnitsList.find((d) => d.du_id === id)
            const label = du?.agency ?? id
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
                {label}
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
                  aria-label={`Remove ${label}`}
                >
                  ×
                </Box>
              </Box>
            )
          })}
        </Box>
      )}

      {/* Loading state with skeleton. Five aggregate rows plus any added DUs */}
      {!hasReceivedData && !error && (
        <Box sx={{ gridColumn: "1 / -1" }}>
          <PercentileMatrixSkeleton
            scenarios={scenarios}
            rowCount={5 + additionalDemandUnits.length}
            message="Loading AG data..."
            labelColumnWidth={140}
          />
        </Box>
      )}

      {/* Error state, only when there's nothing to show */}
      {error && entities.length === 0 && (
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

      {/* Matrix */}
      {hasReceivedData && entities.length > 0 && (
        <Box sx={{ gridColumn: "1 / -1" }}>
          <PercentileMatrix
            reservoirs={reservoirData}
            scenarios={scenarios}
            scenarioNames={scenarioNames}
            data={matrixData}
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
  /** Pre-fetched batch response (storage/cws/ag/env_flow keyed by scenario) */
  batchData: BatchStatisticsResponse | undefined
  /** Whether the batched fetch is still in flight */
  isBatchLoading: boolean
}

export default function AgSection({
  scenarios,
  scenarioNames,
  batchData,
  isBatchLoading,
}: AgSectionProps) {
  const theme = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)
  const agBatch = batchData?.ag

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

      {/* Revenue tier section */}
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
                title="Revenue distribution"
                description="134 agricultural demand units"
              />
            </Box>
            <AgTierCharts
              scenarios={scenarios}
              scenarioNames={scenarioNames}
              missingSet={missingSet}
              hydroclimate={hydroclimate}
            />
          </ChartGridProvider>
        </Box>

        {/* Monthly delivery section */}
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
            <MonthlyAgSection
              scenarios={scenarios}
              scenarioNames={scenarioNames}
              agBatch={agBatch}
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
                  title="Revenue distribution"
                  description="134 agricultural demand units"
                />
              </Box>
              <AgTierCharts
                scenarios={scenarios}
                scenarioNames={scenarioNames}
                missingSet={missingSet}
                hydroclimate={hydroclimate}
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
              <MonthlyAgSection
                scenarios={scenarios}
                scenarioNames={scenarioNames}
                agBatch={agBatch}
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
