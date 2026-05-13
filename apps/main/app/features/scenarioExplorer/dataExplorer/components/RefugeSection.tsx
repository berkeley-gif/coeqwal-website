"use client"

/**
 * RefugeSection.Wildlife Refuge Environmental Water section for the Data Explorer
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
import { GridScenarioHeader } from "./AlignedScenarioGrid"
import { ChartGridProvider } from "./ChartGridContext"
import { PercentileMatrixSkeleton } from "./PercentileMatrixSkeleton"
import { SectionHeader } from "./SectionHeader"
import { useMultiScenarioSlots } from "./useMultiScenarioSlots"
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

/** Delivery band colors.blue, matching COLORS in PercentileMatrix */
const DELIVERY_BAND_COLORS = {
  range: "#d9eafb", // q0-q100 (lightest)
  outer: "#c5dbf3", // q10-q90
  inner: "#a2bee1", // q30-q70
  median: "#2c5aa0", // q50 (darkest)
}

/** Shortage band colors.orange/amber, matching COLORS_SHORTAGE in PercentileMatrix */
const SHORTAGE_BAND_COLORS = {
  range: "#fef3e2",
  outer: "#fdd49e",
  inner: "#fdae6b",
  median: "#e6550d",
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
        Min–max range
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
        Min–max range
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
// Helpers
// ============================================================================

/** Map cs3_type code to a human-readable label */
function cs3TypeLabel(cs3_type: string): string {
  if (cs3_type === "PR") return "Project"
  if (cs3_type === "NR") return "Non-project"
  return cs3_type
}

function deliveryRowsToMonthlyPercentiles(
  rows: RefugeDeliveryMonthlyStats[],
): MonthlyPercentiles {
  const monthly: MonthlyPercentiles = {}
  for (const row of rows) {
    monthly[String(row.water_month)] = {
      q0: row.q0 ?? 0,
      q10: row.q10 ?? 0,
      q30: row.q30 ?? 0,
      q50: row.q50 ?? 0,
      q70: row.q70 ?? 0,
      q90: row.q90 ?? 0,
      q100: row.q100 ?? 0,
      mean: row.delivery_avg_taf ?? 0,
    }
  }
  return monthly
}

function shortageRowsToMonthlyPercentiles(
  rows: RefugeShortageMonthlyStats[],
): MonthlyPercentiles {
  const monthly: MonthlyPercentiles = {}
  for (const row of rows) {
    monthly[String(row.water_month)] = {
      q0: row.q0 ?? 0,
      q10: row.q10 ?? 0,
      q30: row.q30 ?? 0,
      q50: row.q50 ?? 0,
      q70: row.q70 ?? 0,
      q90: row.q90 ?? 0,
      q100: row.q100 ?? 0,
      mean: row.shortage_avg_taf ?? 0,
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
    if (!scenarioId || !result.rows.length) return

    const byDu = new Map<string, RefugeDeliveryMonthlyStats[]>()
    for (const row of result.rows) {
      if (!byDu.has(row.du_id)) byDu.set(row.du_id, [])
      byDu.get(row.du_id)!.push(row)
    }
    for (const [duId, duRows] of byDu.entries()) {
      if (!matrixData[duId]) matrixData[duId] = {}
      matrixData[duId][scenarioId] = deliveryRowsToMonthlyPercentiles(duRows)
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
    if (!scenarioId || !result.rows.length) return

    const byDu = new Map<string, RefugeShortageMonthlyStats[]>()
    for (const row of result.rows) {
      if (!byDu.has(row.du_id)) byDu.set(row.du_id, [])
      byDu.get(row.du_id)!.push(row)
    }
    for (const [duId, duRows] of byDu.entries()) {
      if (!matrixData[duId]) matrixData[duId] = {}
      matrixData[duId][scenarioId] = shortageRowsToMonthlyPercentiles(duRows)
    }
  })

  return { matrixData, isLoading, loadingScenarios }
}

/**
 * Fetch period-of-record summaries for all selected scenarios.
 * Builds a CellStatsMap (duId -> scenarioId -> {annualAvgTaf, reliabilityPct})
 * so PercentileMatrix can render per-cell stats below each chart.
 */
function useMultiScenarioRefugePeriod(scenarios: string[]) {
  const results = useMultiScenarioSlots(scenarios, useRefugeDusPeriod)

  const isLoading = results.some((r) => r.isLoading)
  const cellStats: CellStatsMap = {}

  results.forEach((result, index) => {
    const scenarioId = scenarios[index]
    if (!scenarioId || !result.summaries.length) return
    for (const summary of result.summaries) {
      if (!cellStats[summary.du_id]) cellStats[summary.du_id] = {}
      const duStats = cellStats[summary.du_id]!
      duStats[scenarioId] = {
        annualAvgTaf: summary.annual_delivery_avg_taf ?? undefined,
        // Convert shortage_pct_95 -> fulfillment (higher = better, matches AG/CWS convention)
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

interface RefugeSectionProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
}

export default function RefugeSection({
  scenarios,
  scenarioNames,
}: RefugeSectionProps) {
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
      {/* Sticky scenario header */}
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
                        <ShortageBandsLegend />
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
