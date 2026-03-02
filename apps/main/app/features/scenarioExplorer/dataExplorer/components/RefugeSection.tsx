"use client"

/**
 * RefugeSection — Wildlife Refuge Environmental Water section for the Data Explorer
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
import {
  useRefugeDemandUnitsList,
  useRefugeDusDeliveryMonthly,
  useRefugeDusShortageMonthly,
  useRefugeDusPeriod,
} from "@repo/data/coeqwal/hooks"
import type {
  RefugeDemandUnitData,
  RefugeDeliveryMonthlyStats,
  RefugeShortageMonthlyStats,
  RefugePeriodSummary,
} from "@repo/data/coeqwal"

// ============================================================================
// Types
// ============================================================================

type MatrixDataType = Record<string, Record<string, MonthlyPercentiles | undefined>>
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

const RELIABILITY_THRESHOLDS = {
  good: 5,
  moderate: 20,
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format a DU's label for the PercentileMatrix label column.
 * Uses \n because the SVG label renderer has white-space: pre-line.
 * Line 1: refuge name (truncated)
 * Line 2: du_id · cs3_type label · managed_by
 */
function formatDuLabel(du: RefugeDemandUnitData): string {
  const name = du.refuge_or_wildlife_area ?? du.du_id
  const truncated = name.length > 26 ? name.slice(0, 24) + "…" : name
  const typeLabel = du.cs3_type === "PR" ? "Project" : du.cs3_type === "NR" ? "Non-project" : du.cs3_type
  const parts = [du.du_id, typeLabel, du.managed_by ?? ""].filter(Boolean)
  return `${truncated}\n${parts.join(" · ")}`
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
  const results = scenarios.map((scenarioId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useRefugeDusDeliveryMonthly(scenarioId)
  })

  const isLoading = results.some((r) => r.isLoading)
  const loadingScenarios = scenarios.filter((_, i) => results[i]?.isLoading ?? false)

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
  const results = scenarios.map((scenarioId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useRefugeDusShortageMonthly(scenarioId)
  })

  const isLoading = results.some((r) => r.isLoading)
  const loadingScenarios = scenarios.filter((_, i) => results[i]?.isLoading ?? false)

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
 * Builds a CellStatsMap (duId → scenarioId → {annualAvgTaf, reliabilityPct})
 * so PercentileMatrix can render per-cell stats below each chart.
 */
function useMultiScenarioRefugePeriod(scenarios: string[]) {
  const results = scenarios.map((scenarioId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useRefugeDusPeriod(scenarioId)
  })

  const isLoading = results.some((r) => r.isLoading)
  const cellStats: CellStatsMap = {}
  const allSummaries: Record<string, RefugePeriodSummary[]> = {}

  results.forEach((result, index) => {
    const scenarioId = scenarios[index]
    if (!scenarioId || !result.summaries.length) return
    allSummaries[scenarioId] = result.summaries
    for (const summary of result.summaries) {
      if (!cellStats[summary.du_id]) cellStats[summary.du_id] = {}
      cellStats[summary.du_id][scenarioId] = {
        annualAvgTaf: summary.annual_delivery_avg_taf ?? undefined,
        reliabilityPct: summary.reliability_pct_95 ?? undefined,
      }
    }
  })

  return { cellStats, allSummaries, isLoading }
}

// ============================================================================
// Reliability chart
// ============================================================================

interface ReliabilityChartProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
  allSummaries: Record<string, RefugePeriodSummary[]>
  filteredDUs: RefugeDemandUnitData[]
  isLoading: boolean
}

function ReliabilityChart({
  scenarios,
  scenarioNames,
  allSummaries,
  filteredDUs,
  isLoading,
}: ReliabilityChartProps) {
  const theme = useTheme()
  const primaryScenario = scenarios[0] ?? ""

  // Index summaries by scenario → duId
  const byScenario = useMemo(() => {
    const map: Record<string, Record<string, RefugePeriodSummary>> = {}
    for (const [scenarioId, rows] of Object.entries(allSummaries)) {
      map[scenarioId] = {}
      for (const row of rows) {
        map[scenarioId][row.du_id] = row
      }
    }
    return map
  }, [allSummaries])

  // Sort DUs: worst reliability in primary scenario first (null/undefined last)
  const sortedDUs = useMemo(() => {
    return [...filteredDUs].sort((a, b) => {
      const ra = byScenario[primaryScenario]?.[a.du_id]?.reliability_pct_95
      const rb = byScenario[primaryScenario]?.[b.du_id]?.reliability_pct_95
      if (ra == null && rb == null) return 0
      if (ra == null) return 1
      if (rb == null) return -1
      return rb - ra // descending (worst first)
    })
  }, [filteredDUs, byScenario, primaryScenario])

  function reliabilityColor(pct: number | null): string {
    if (pct === null) return theme.palette.grey[300]
    if (pct <= RELIABILITY_THRESHOLDS.good) return theme.palette.success.main
    if (pct <= RELIABILITY_THRESHOLDS.moderate) return theme.palette.warning.main
    return theme.palette.error.main
  }

  function reliabilityBg(pct: number | null): string {
    if (pct === null) return theme.palette.grey[50]
    if (pct <= RELIABILITY_THRESHOLDS.good) return theme.palette.success.light + "22"
    if (pct <= RELIABILITY_THRESHOLDS.moderate) return theme.palette.warning.light + "22"
    return theme.palette.error.light + "22"
  }

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 2 }}>
        <Box
          sx={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: `2px solid ${theme.palette.primary.main}`,
            borderTopColor: "transparent",
            animation: "spin 0.7s linear infinite",
            "@keyframes spin": { to: { transform: "rotate(360deg)" } },
          }}
        />
        <Typography variant="body2" color="text.secondary">
          Loading reliability data…
        </Typography>
      </Box>
    )
  }

  if (Object.keys(allSummaries).length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No reliability data available for this scenario.
      </Typography>
    )
  }

  const multiScenario = scenarios.length > 1

  return (
    <Box sx={{ overflowX: "auto" }}>
      {/* Column headers */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `220px repeat(${scenarios.length}, 1fr)`,
          gap: 0,
          mb: 0.5,
        }}
      >
        <Box />
        {scenarios.map((scenarioId) => (
          <Box key={scenarioId} sx={{ px: 1.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 500,
                fontSize: "0.75rem",
              }}
            >
              {scenarioNames[scenarioId] ?? scenarioId}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Scale header row */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `220px repeat(${scenarios.length}, 1fr)`,
          gap: 0,
          mb: 1,
        }}
      >
        <Box />
        <Box sx={{ px: 1.5, gridColumn: `2 / ${scenarios.length + 2}` }}>
          <Box sx={{ position: "relative", height: 18 }}>
            {[0, 5, 20, 50, 100].map((mark) => (
              <Typography
                key={mark}
                variant="caption"
                sx={{
                  position: "absolute",
                  left: `${mark}%`,
                  transform: "translateX(-50%)",
                  fontSize: "0.65rem",
                  color: theme.palette.grey[400],
                  fontFeatureSettings: "'tnum' 1",
                }}
              >
                {mark}%
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Rows */}
      {sortedDUs.map((du, rowIndex) => {
        const typeLabel = du.cs3_type === "PR" ? "Project" : du.cs3_type === "NR" ? "Non-project" : du.cs3_type
        const isEven = rowIndex % 2 === 0

        return (
          <Box
            key={du.du_id}
            sx={{
              display: "grid",
              gridTemplateColumns: `220px repeat(${scenarios.length}, 1fr)`,
              gap: 0,
              alignItems: "stretch",
              backgroundColor: isEven ? theme.palette.background.paper : "transparent",
              borderRadius: theme.borderRadius.sm,
              mb: 0.25,
            }}
          >
            {/* DU label */}
            <Box
              sx={{
                px: 1.5,
                py: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, lineHeight: 1.3, fontSize: "0.8rem" }}
              >
                {du.refuge_or_wildlife_area ?? du.du_id}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: "0.7rem",
                  lineHeight: 1.4,
                }}
              >
                {du.du_id}
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.25 }}>
                {du.managed_by && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.65rem",
                      px: 0.5,
                      py: 0.1,
                      borderRadius: 0.5,
                      backgroundColor: theme.palette.grey[100],
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                    }}
                  >
                    {du.managed_by}
                  </Typography>
                )}
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.65rem",
                    px: 0.5,
                    py: 0.1,
                    borderRadius: 0.5,
                    backgroundColor:
                      du.cs3_type === "PR"
                        ? theme.palette.primary.main + "22"
                        : theme.palette.grey[100],
                    color:
                      du.cs3_type === "PR"
                        ? theme.palette.primary.dark
                        : theme.palette.text.secondary,
                    fontWeight: 500,
                  }}
                >
                  {typeLabel}
                </Typography>
              </Box>
            </Box>

            {/* Scenario cells */}
            {scenarios.map((scenarioId) => {
              const summary = byScenario[scenarioId]?.[du.du_id]
              const pct = summary?.reliability_pct_95 ?? null
              const avgTaf = summary?.annual_delivery_avg_taf ?? null

              return (
                <Box
                  key={scenarioId}
                  sx={{
                    px: 1.5,
                    py: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 0.5,
                    borderLeft: multiScenario
                      ? `1px solid ${theme.palette.divider}`
                      : "none",
                  }}
                >
                  {/* Bar track */}
                  <Box
                    sx={{
                      width: "100%",
                      height: 10,
                      backgroundColor: theme.palette.grey[100],
                      borderRadius: 1,
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {/* 5% reference line */}
                    <Box
                      sx={{
                        position: "absolute",
                        left: "5%",
                        top: 0,
                        bottom: 0,
                        width: 1,
                        backgroundColor: theme.palette.success.main + "88",
                      }}
                    />
                    {/* 20% reference line */}
                    <Box
                      sx={{
                        position: "absolute",
                        left: "20%",
                        top: 0,
                        bottom: 0,
                        width: 1,
                        backgroundColor: theme.palette.warning.main + "88",
                      }}
                    />
                    {pct !== null && (
                      <Box
                        sx={{
                          width: `${Math.min(pct, 100)}%`,
                          height: "100%",
                          backgroundColor: reliabilityColor(pct),
                          borderRadius: 1,
                          transition: "width 0.3s ease",
                        }}
                      />
                    )}
                  </Box>

                  {/* Stats row */}
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        fontFeatureSettings: "'tnum' 1",
                        fontSize: "0.8rem",
                        color: pct !== null ? reliabilityColor(pct) : theme.palette.text.disabled,
                        backgroundColor: pct !== null ? reliabilityBg(pct) : "transparent",
                        px: 0.5,
                        borderRadius: 0.5,
                        lineHeight: 1.6,
                      }}
                    >
                      {pct !== null ? `${pct.toFixed(1)}%` : "—"}
                    </Typography>
                    {avgTaf !== null && avgTaf > 0 && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontFeatureSettings: "'tnum' 1",
                          fontSize: "0.7rem",
                        }}
                      >
                        {avgTaf < 0.1
                          ? `${(avgTaf * 1000).toFixed(0)} AF/yr`
                          : `${avgTaf.toFixed(1)} TAF/yr`}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )
            })}
          </Box>
        )
      })}

      {/* Legend */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mt: 1.5,
          pt: 1,
          borderTop: `1px solid ${theme.palette.divider}`,
          flexWrap: "wrap",
        }}
      >
        {[
          { color: "success", label: "≤ 5% — Reliable" },
          { color: "warning", label: "5–20% — Moderate shortfall" },
          { color: "error", label: "> 20% — Chronic shortage" },
        ].map(({ color, label }) => (
          <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: 0.5,
                backgroundColor:
                  color === "success"
                    ? theme.palette.success.main
                    : color === "warning"
                      ? theme.palette.warning.main
                      : theme.palette.error.main,
              }}
            />
            <Typography variant="caption" sx={{ fontSize: "0.7rem", color: theme.palette.text.secondary }}>
              {label}
            </Typography>
          </Box>
        ))}
        <Typography variant="caption" sx={{ fontSize: "0.7rem", color: theme.palette.grey[400], ml: "auto" }}>
          Low values = reliable supply · sorted worst-first · {scenarios.length} scenario{scenarios.length > 1 ? "s" : ""}
        </Typography>
      </Box>
    </Box>
  )
}

// ============================================================================
// Section header
// ============================================================================

interface SectionHeaderProps {
  title: string
  titleAdornment?: React.ReactNode
  description?: React.ReactNode
}

function SectionHeader({ title, titleAdornment, description }: SectionHeaderProps) {
  const theme = useTheme()
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: theme.space.gap.sm }}>
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

  // "relative" is the default because many refuges receive very small volumes
  // that appear flat on an absolute scale shared with high-delivery DUs.
  const [scaleMode, setScaleMode] = useState<"absolute" | "relative">("relative")
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
  // reservoirName uses \n because the SVG renderer sets white-space: pre-line.
  const reservoirData: ReservoirData[] = useMemo(
    () =>
      filteredDUs.map((du) => ({
        reservoirId: du.du_id,
        reservoirName: formatDuLabel(du),
        capacityTaf: 0,
        deadPoolTaf: 0,
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

  const {
    cellStats,
    allSummaries,
    isLoading: isLoadingPeriod,
  } = useMultiScenarioRefugePeriod(scenarios)

  const primaryScenario = scenarios[0] ?? null

  const isActiveLoading = chartMode === "delivery" ? isLoadingDelivery : isLoadingShortage
  const activeMatrix = chartMode === "delivery" ? deliveryMatrix : shortageMatrix
  const activeLoadingScenarios = chartMode === "delivery" ? deliveryLoadingScenarios : shortageLoadingScenarios
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
          {/* ── Monthly Chart (delivery OR shortage) ─────────────────── */}
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.borderRadius.md,
              border: theme.border.light,
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
                    Percentile distribution of monthly deliveries across all simulated
                    years (TAF). Each band shows a range of outcomes. The center line is
                    the median; outer bands are the extremes. Per-scenario annual averages
                    and worst-case shortage % are shown below each chart.{" "}
                    <Box
                      component="span"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      Relative scale normalizes each row to its own maximum. This is
                      useful when refuges receive very different volumes.
                    </Box>
                  </>
                ) : (
                  <>
                    Shortage = max(demand − delivery, 0), distributed across all
                    simulated years (TAF). A flat chart near zero means the refuge
                    consistently received its full allocation. Spikes indicate dry-year
                    cutbacks.
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
                  colorScheme={chartMode === "delivery" ? "delivery" : "shortage"}
                  loadingScenarios={activeLoadingScenarios}
                  cellStats={cellStats}
                  minYMaxTaf={0}
                />
              )}
            </Box>
          </Box>

          {/* ── Reliability ──────────────────────────────────────────── */}
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.borderRadius.md,
              border: theme.border.light,
              p: theme.space.component.lg,
              mb: theme.space.component.lg,
            }}
          >
            <SectionHeader
              title="Delivery reliability"
              description={
                <>
                  Annual delivery shortage (% of demand) at the 95th exceedance
                  percentile. In other words: in 95 out of 100 simulated years, the
                  demand unit&rsquo;s annual shortage was{" "}
                  <em>at or below</em> this value.{" "}
                  <Box component="span" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                    0%
                  </Box>{" "}
                  = no shortage in 95% of years (fully reliable).{" "}
                  <Box component="span" sx={{ color: theme.palette.error.main, fontWeight: 600 }}>
                    50%
                  </Box>{" "}
                  = even in &ldquo;normal&rdquo; years the DU is chronically
                  under-supplied. Lower is better. Rows sorted worst-first.
                </>
              }
            />
            <Box sx={{ mt: theme.space.component.lg }}>
              <ReliabilityChart
                scenarios={scenarios}
                scenarioNames={scenarioNames}
                allSummaries={allSummaries}
                filteredDUs={filteredDUs}
                isLoading={isLoadingPeriod}
              />
            </Box>
          </Box>
        </>
      )}
    </>
  )
}
