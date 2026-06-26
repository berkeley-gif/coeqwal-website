"use client"

/**
 * RefugeSection.tsx - Wildlife Refuge Environmental Water section for the Data Explorer
 *
 * Displays delivery, shortage, and reliability data for 18 wildlife refuge and
 * wetland demand units in the Sacramento and San Joaquin hydrologic regions.
 *
 * Charts:
 *   - Monthly delivery OR shortage percentile bands (toggled by dropdown)
 *   - Period-of-record reliability display (reliability_pct_95)
 *
 * Layout follows the same CSS Grid patterns as AgSection and CwsSection.
 */

import React, { useState, useMemo } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { CompactSelect } from "@repo/ui"
import { PercentileMatrix } from "@repo/viz"
import type {
  ReservoirData,
  MonthlyPercentiles,
  VolumeScaleMode,
  CellStatsMap,
} from "@repo/viz"
import { GridScenarioHeader } from "../shared/AlignedScenarioGrid"
import { ChartGridProvider } from "../shared/ChartGridContext"
import { PercentileMatrixSkeleton } from "../shared/PercentileMatrixSkeleton"
import { SectionHeader } from "../shared/SectionHeader"
import { useMultiScenarioSlots } from "../../hooks/useMultiScenarioSlots"
import { BandLegend } from "../shared/BandsLegend"
import {
  DELIVERY_BAND_COLORS,
  SHORTAGE_BAND_COLORS,
} from "../../config/bandColors"
import type { FanoutSectionProps } from "../shared/sectionTypes"
import {
  useRefugeDemandUnitsList,
  useRefugeDusDeliveryMonthly,
  useRefugeDusShortageMonthly,
  useRefugeDusPeriod,
} from "@repo/data/coeqwal/hooks"
import type {
  RefugeDeliveryMonthlyStats,
  RefugeShortageMonthlyStats,
} from "@repo/data/coeqwal"

// ============================================================================
// Types
// ============================================================================

type MatrixDataType = Record<
  string,
  Record<string, MonthlyPercentiles | undefined>
>
type RegionFilter = "all" | "SAC" | "SJR" | "TULARE"
type ChartMode = "delivery" | "shortage"

// ============================================================================
// Constants
// ============================================================================

const CHART_MODE_OPTIONS = [
  { value: "delivery" as const, label: "Delivery" },
  { value: "shortage" as const, label: "Shortage" },
]

const SCALE_OPTIONS = [
  { value: "relative" as const, label: "Relative scale" },
  { value: "absolute" as const, label: "Absolute scale" },
]

const REGION_OPTIONS = [
  { value: "all" as const, label: "All regions" },
  { value: "SAC" as const, label: "Sacramento" },
  { value: "SJR" as const, label: "San Joaquin" },
  { value: "TULARE" as const, label: "Tulare" },
]

// ============================================================================
// Helpers
// ============================================================================

/** Map cs3_type code to a human-readable label */
function cs3TypeLabel(cs3_type: string): string {
  if (cs3_type === "PR") return "Project"
  if (cs3_type === "NR") return "Non-project"
  return cs3_type
}

function deliveryMonthsToPercentiles(
  monthlyDelivery: Record<string, RefugeDeliveryMonthlyStats> | undefined,
): MonthlyPercentiles {
  const monthly: MonthlyPercentiles = {}
  if (!monthlyDelivery) return monthly
  for (const [month, stats] of Object.entries(monthlyDelivery)) {
    // Skip months with any null percentile rather than coercing to zero.
    // A zero floor on the band chart implies a real measured 0 delivery
    // when in fact we have no row
    if (
      stats.q0 == null ||
      stats.q10 == null ||
      stats.q30 == null ||
      stats.q50 == null ||
      stats.q70 == null ||
      stats.q90 == null ||
      stats.q100 == null ||
      stats.avg_taf == null
    ) {
      continue
    }
    monthly[month] = {
      q0: stats.q0,
      q10: stats.q10,
      q30: stats.q30,
      q50: stats.q50,
      q70: stats.q70,
      q90: stats.q90,
      q100: stats.q100,
      mean: stats.avg_taf,
    }
  }
  return monthly
}

function shortageMonthsToPercentiles(
  monthlyShortage: Record<string, RefugeShortageMonthlyStats> | undefined,
): MonthlyPercentiles {
  const monthly: MonthlyPercentiles = {}
  if (!monthlyShortage) return monthly
  for (const [month, stats] of Object.entries(monthlyShortage)) {
    // Same rationale as `deliveryMonthsToPercentiles`: prefer a gap over a
    // fake zero baseline so the chart doesn't suggest "no shortage" when
    // really we have no data
    if (
      stats.q0 == null ||
      stats.q10 == null ||
      stats.q30 == null ||
      stats.q50 == null ||
      stats.q70 == null ||
      stats.q90 == null ||
      stats.q100 == null ||
      stats.avg_taf == null
    ) {
      continue
    }
    monthly[month] = {
      q0: stats.q0,
      q10: stats.q10,
      q30: stats.q30,
      q50: stats.q50,
      q70: stats.q70,
      q90: stats.q90,
      q100: stats.q100,
      mean: stats.avg_taf,
    }
  }
  return monthly
}

// ============================================================================
// Multi-scenario data hooks
// ============================================================================

function useMultiScenarioRefugeDelivery(scenarios: string[]) {
  const results = useMultiScenarioSlots(scenarios, useRefugeDusDeliveryMonthly)

  const isLoading = results.some((r) => r.isLoading)
  const loadingScenarios = scenarios.filter(
    (_, i) => results[i]?.isLoading ?? false,
  )

  const matrixData: MatrixDataType = {}
  results.forEach((result, index) => {
    const scenarioId = scenarios[index]
    if (!scenarioId) return
    for (const [duId, entry] of Object.entries(result.demandUnits)) {
      if (!matrixData[duId]) matrixData[duId] = {}
      matrixData[duId][scenarioId] = deliveryMonthsToPercentiles(
        entry.monthly_delivery,
      )
    }
  })

  return { matrixData, isLoading, loadingScenarios }
}

function useMultiScenarioRefugeShortage(scenarios: string[]) {
  const results = useMultiScenarioSlots(scenarios, useRefugeDusShortageMonthly)

  const isLoading = results.some((r) => r.isLoading)
  const loadingScenarios = scenarios.filter(
    (_, i) => results[i]?.isLoading ?? false,
  )

  const matrixData: MatrixDataType = {}
  results.forEach((result, index) => {
    const scenarioId = scenarios[index]
    if (!scenarioId) return
    for (const [duId, entry] of Object.entries(result.demandUnits)) {
      if (!matrixData[duId]) matrixData[duId] = {}
      matrixData[duId][scenarioId] = shortageMonthsToPercentiles(
        entry.monthly_shortage,
      )
    }
  })

  return { matrixData, isLoading, loadingScenarios }
}

/**
 * Fetch period-of-record summaries for all selected scenarios.
 * Builds a CellStatsMap (duId to scenarioId to {annualAvgTaf, reliabilityPct})
 * so PercentileMatrix can render per-cell stats below each chart.
 */
function useMultiScenarioRefugePeriod(scenarios: string[]) {
  const results = useMultiScenarioSlots(scenarios, useRefugeDusPeriod)

  const isLoading = results.some((r) => r.isLoading)
  const cellStats: CellStatsMap = {}

  results.forEach((result, index) => {
    const scenarioId = scenarios[index]
    if (!scenarioId) return
    for (const [duId, summary] of Object.entries(result.demandUnits)) {
      if (!cellStats[duId]) cellStats[duId] = {}
      const duStats = cellStats[duId]!
      duStats[scenarioId] = {
        annualAvgTaf: summary.annual_delivery_avg_taf ?? undefined,
        // Convert reliability_pct_95 (95th percentile of shortage %) to
        // fulfillment (higher = better, matches AG/CWS convention)
        reliabilityPct:
          summary.reliability_pct_95 != null
            ? 100 - summary.reliability_pct_95
            : undefined,
      }
    }
  })

  return { cellStats, isLoading }
}

// ============================================================================
// Main component
// ============================================================================

export default function RefugeSection({
  scenarios,
  scenarioNames,
}: FanoutSectionProps) {
  const theme = useTheme()

  const [scaleMode, setScaleMode] = useState<"absolute" | "relative">(
    "absolute",
  )
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all")
  const [chartMode, setChartMode] = useState<ChartMode>("delivery")

  const { demandUnits, isLoading: isLoadingDUs } = useRefugeDemandUnitsList()

  const filteredDUs = useMemo(
    () =>
      demandUnits.filter(
        (du) => regionFilter === "all" || du.hydrologic_region === regionFilter,
      ),
    [demandUnits, regionFilter],
  )

  const filteredDuIds = filteredDUs.map((du) => du.du_id)

  // Build ReservoirData[] for PercentileMatrix.
  // Use labelSubtitle for the du_id + region identifier line,
  // and labelAttributes for managed_by / cs3_type.styled like reservoir chart labels.
  const reservoirData: ReservoirData[] = useMemo(
    () =>
      filteredDUs.map((du) => ({
        reservoirId: du.du_id,
        reservoirName: du.refuge_or_wildlife_area ?? du.du_id,
        capacityTaf: 0,
        deadPoolTaf: 0,
        labelSubtitle: `${du.du_id} · ${du.hydrologic_region}`,
        labelAttributes: [
          ...(du.managed_by ? [{ key: "AGENCY", value: du.managed_by }] : []),
          { key: "TYPE", value: cs3TypeLabel(du.cs3_type) },
        ],
      })),
    [filteredDUs],
  )

  const {
    matrixData: deliveryMatrix,
    isLoading: isLoadingDelivery,
    loadingScenarios: deliveryLoadingScenarios,
  } = useMultiScenarioRefugeDelivery(scenarios)

  const {
    matrixData: shortageMatrix,
    isLoading: isLoadingShortage,
    loadingScenarios: shortageLoadingScenarios,
  } = useMultiScenarioRefugeShortage(scenarios)

  const { cellStats } = useMultiScenarioRefugePeriod(scenarios)

  const primaryScenario = scenarios[0] ?? null

  const isActiveLoading =
    chartMode === "delivery" ? isLoadingDelivery : isLoadingShortage
  const activeMatrix =
    chartMode === "delivery" ? deliveryMatrix : shortageMatrix
  const activeLoadingScenarios =
    chartMode === "delivery"
      ? deliveryLoadingScenarios
      : shortageLoadingScenarios
  const hasActiveData = !isActiveLoading && Object.keys(activeMatrix).length > 0

  if (!primaryScenario) {
    return (
      <Box sx={{ p: theme.space.section.sm }}>
        <Typography color="text.secondary">
          Select a scenario to view refuge data.
        </Typography>
      </Box>
    )
  }

  return (
    <>
      {/* Sticky scenario header. Soft drop shadow matches the List view's
          pinned block so content reads as scrolling under a fixed header. */}
      <Box
        sx={theme.scenarios.stickyScenarioHeader}
      >
        <ChartGridProvider scenarios={scenarios}>
          <GridScenarioHeader
            scenarios={scenarios}
            scenarioNames={scenarioNames}
          />
        </ChartGridProvider>
      </Box>

      {/* Controls */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: theme.space.gap.md,
          mt: theme.space.component.md,
          mb: theme.space.component.xl,
          flexWrap: "wrap",
        }}
      >
        <CompactSelect
          aria-label="Chart content"
          value={chartMode}
          options={CHART_MODE_OPTIONS}
          onChange={(v) => setChartMode(v as ChartMode)}
        />
        <CompactSelect
          aria-label="Region filter"
          value={regionFilter}
          options={REGION_OPTIONS}
          onChange={(v) => setRegionFilter(v as RegionFilter)}
        />
        <CompactSelect
          aria-label="Scale mode"
          value={scaleMode}
          options={SCALE_OPTIONS}
          onChange={(v) => setScaleMode(v as "absolute" | "relative")}
        />
      </Box>

      {isLoadingDUs ? null : (
        <>
          {/* Monthly Chart (delivery OR shortage) */}
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
            <SectionHeader
              title={
                chartMode === "delivery"
                  ? "Monthly surface water delivery"
                  : "Monthly delivery shortage"
              }
              description={
                chartMode === "delivery" ? (
                  <>
                    Percentile distribution of monthly deliveries across all
                    simulated years (TAF). Each band shows a range of outcomes.
                    The center line is the median; outer bands are the extremes.
                    Per-scenario annual averages and P95 reliability are shown
                    below each chart. Relative scale normalizes each row to its
                    own maximum.useful when refuges receive very different
                    volumes.
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
                        <BandLegend colors={DELIVERY_BAND_COLORS} />
                      </Box>
                      <Box
                        component="span"
                        sx={{
                          color: "grey.400",
                          fontSize: "0.8rem",
                          fontStyle: "italic",
                        }}
                      >
                        Upper chart region = wetter-year delivery · Lower chart
                        region = drier-year delivery
                      </Box>
                    </Box>
                  </>
                ) : (
                  <>
                    Shortage = max(demand − delivery, 0), distributed across all
                    simulated years (TAF). A flat chart near zero means the
                    refuge consistently received its full allocation. Spikes
                    indicate dry-year cutbacks.
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
                        <BandLegend colors={SHORTAGE_BAND_COLORS} />
                      </Box>
                      <Box
                        component="span"
                        sx={{
                          color: "grey.400",
                          fontSize: "0.8rem",
                          fontStyle: "italic",
                        }}
                      >
                        Upper chart region = drier-year shortage · Lower chart
                        region = wetter-year shortage (near zero)
                      </Box>
                    </Box>
                  </>
                )
              }
            />
            <Box sx={{ mt: theme.space.component.lg }}>
              {isActiveLoading && !hasActiveData ? (
                <PercentileMatrixSkeleton
                  scenarios={scenarios}
                  rowCount={Math.min(filteredDuIds.length, 4)}
                  labelColumnWidth={160}
                />
              ) : !hasActiveData ? (
                <Typography color="text.secondary" variant="body2">
                  No {chartMode} data available for this scenario and region.
                </Typography>
              ) : (
                <PercentileMatrix
                  reservoirs={reservoirData}
                  scenarios={scenarios}
                  scenarioNames={scenarioNames}
                  data={activeMatrix}
                  responsive
                  labelColumnWidth={160}
                  showScenarioHeaders={false}
                  displayMode="volume"
                  volumeScaleMode={scaleMode as VolumeScaleMode}
                  colorScheme={
                    chartMode === "delivery" ? "delivery" : "shortage"
                  }
                  loadingScenarios={activeLoadingScenarios}
                  cellStats={cellStats}
                  minYMaxTaf={0}
                />
              )}
            </Box>
          </Box>
        </>
      )}
    </>
  )
}
