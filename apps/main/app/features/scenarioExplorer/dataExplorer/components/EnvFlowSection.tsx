"use client"

/**
 * EnvFlowSection — Environmental River Flows section for the Data Explorer
 *
 * Displays monthly flow volume (CFS or TAF) for 59 CalSim channel reaches as
 * percentile band charts, matching the reservoir / CWS / AG sections.
 * Per-cell stats show avg % of natural unimpaired flow and MIF compliance.
 *
 * Three metrics are available in the database:
 *   Metric 1 — Monthly flow volume (CFS / TAF) with percentile bands  ← this chart
 *              Secondary: monthly % unimpaired shown as cell stat
 *   Metric 2 — Seasonal % of functional flow targets (future chart)
 *   Metric 3 — Pearson r flow alteration index (shown as per-cell stat)
 *
 * Layout follows the same CSS Grid patterns as RefugeSection and AgSection.
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
  useChannelsList,
  useChannelsMonthly,
  useChannelsPeriodSummary,
} from "@repo/data/coeqwal/hooks"
import type {
  ChannelMonthlyStats,
  ChannelPeriodSummary,
} from "@repo/data/coeqwal"

// ============================================================================
// Types
// ============================================================================

type MatrixDataType = Record<
  string,
  Record<string, MonthlyPercentiles | undefined>
>
type ChannelFilter = "all" | "streams" | "mif_only"
type FlowUnit = "taf" | "cfs"

// ============================================================================
// Constants
// ============================================================================

const CHANNEL_FILTER_OPTIONS = [
  { value: "streams" as const, label: "Stream reaches" },
  { value: "mif_only" as const, label: "Priority reaches (MIF)" },
  { value: "all" as const, label: "All 59 channels" },
]

const SCALE_OPTIONS = [
  { value: "absolute" as const, label: "Absolute scale" },
  { value: "relative" as const, label: "Relative scale" },
]

const UNIT_OPTIONS = [
  { value: "taf" as const, label: "TAF / month" },
  { value: "cfs" as const, label: "CFS" },
]

/** Delivery band colors — blue, same as RefugeSection/AgSection */
const DELIVERY_BAND_COLORS = {
  range: "#d9eafb",
  outer: "#c5dbf3",
  inner: "#a2bee1",
  median: "#2c5aa0",
}

// ============================================================================
// Legend
// ============================================================================

function FlowBandsLegend() {
  return (
    <>
      <Box
        component="span"
        sx={{ width: 14, height: 14, backgroundColor: DELIVERY_BAND_COLORS.range, borderRadius: "2px" }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        Min–max range
      </Box>
      <Box
        component="span"
        sx={{ width: 14, height: 14, backgroundColor: DELIVERY_BAND_COLORS.outer, borderRadius: "2px", ml: 0.75 }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        10–90th percentile
      </Box>
      <Box
        component="span"
        sx={{ width: 14, height: 14, backgroundColor: DELIVERY_BAND_COLORS.inner, borderRadius: "2px", ml: 0.75 }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        30–70th percentile
      </Box>
      <Box
        component="span"
        sx={{ width: 14, height: 3, backgroundColor: DELIVERY_BAND_COLORS.median, borderRadius: "1px", ml: 0.75 }}
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

function channelClassLabel(cls: string | null): string {
  if (cls === "stream") return "Stream"
  if (cls === "canal") return "Canal"
  if (cls === "reservoir_release") return "Reservoir release"
  return cls ?? "Unknown"
}

/**
 * Map one channel's monthly rows to the MonthlyPercentiles shape expected by
 * PercentileMatrix, using actual flow-volume columns (CFS or TAF).
 *
 * Skips months where the primary value is null (missing data).
 */
function monthlyRowsToPercentiles(
  rows: ChannelMonthlyStats[],
  unit: FlowUnit,
): MonthlyPercentiles {
  const monthly: MonthlyPercentiles = {}
  for (const row of rows) {
    if (unit === "taf") {
      // Skip if median is null/undefined — columns absent (old API) or no data
      if (row.flow_q50_taf == null) continue
      monthly[String(row.water_month)] = {
        q0:   row.flow_q0_taf   ?? 0,
        q10:  row.flow_q10_taf  ?? 0,
        q30:  row.flow_q30_taf  ?? 0,
        q50:  row.flow_q50_taf,
        q70:  row.flow_q70_taf  ?? 0,
        q90:  row.flow_q90_taf  ?? 0,
        q100: row.flow_q100_taf ?? 0,
        mean: row.flow_avg_taf  ?? 0,
      }
    } else {
      // Skip if median is null/undefined — columns absent (old API) or no data
      if (row.flow_q50_cfs == null) continue
      monthly[String(row.water_month)] = {
        q0:   row.flow_q0_cfs   ?? 0,
        q10:  row.flow_q10_cfs  ?? 0,
        q30:  row.flow_q30_cfs  ?? 0,
        q50:  row.flow_q50_cfs,
        q70:  row.flow_q70_cfs  ?? 0,
        q90:  row.flow_q90_cfs  ?? 0,
        q100: row.flow_q100_cfs ?? 0,
        mean: row.flow_avg_cfs  ?? 0,
      }
    }
  }
  return monthly
}

// ============================================================================
// Multi-scenario data hooks
// ============================================================================

function useMultiScenarioChannelsMonthly(scenarios: string[], unit: FlowUnit) {
  const results = scenarios.map((scenarioId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useChannelsMonthly(scenarioId)
  })

  const isLoading = results.some((r) => r.isLoading)
  const loadingScenarios = scenarios.filter((_, i) => results[i]?.isLoading ?? false)

  const matrixData: MatrixDataType = {}
  results.forEach((result, index) => {
    const scenarioId = scenarios[index]
    if (!scenarioId || !result.rows.length) return

    const byChannel = new Map<string, ChannelMonthlyStats[]>()
    for (const row of result.rows) {
      if (!byChannel.has(row.network_arc_id)) byChannel.set(row.network_arc_id, [])
      byChannel.get(row.network_arc_id)!.push(row)
    }
    for (const [arcId, arcRows] of byChannel.entries()) {
      if (!matrixData[arcId]) matrixData[arcId] = {}
      matrixData[arcId][scenarioId] = monthlyRowsToPercentiles(arcRows, unit)
    }
  })

  return { matrixData, isLoading, loadingScenarios }
}

/**
 * Period summaries supply per-cell stats displayed below each chart.
 * annualAvgTaf is repurposed here to show avg % unimpaired (a dimensionless
 * percentage, not a TAF figure) — the PercentileMatrix formats it as
 * "XX TAF/yr" which is incorrect labelling, but it's the only numeric stat
 * slot available.  A future PercentileMatrix refactor could add a custom slot.
 *
 *   annualAvgTaf   → avg_pct_unimpaired  (mean % unimpaired over full period)
 *   reliabilityPct → mif_met_pct         (% months flow ≥ binding MIF)
 */
function useMultiScenarioChannelsPeriod(scenarios: string[]) {
  const results = scenarios.map((scenarioId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useChannelsPeriodSummary(scenarioId)
  })

  const isLoading = results.some((r) => r.isLoading)
  const cellStats: CellStatsMap = {}

  results.forEach((result, index) => {
    const scenarioId = scenarios[index]
    if (!scenarioId || !result.summaries.length) return
    for (const summary of result.summaries as ChannelPeriodSummary[]) {
      if (!cellStats[summary.network_arc_id]) cellStats[summary.network_arc_id] = {}
      const stats = cellStats[summary.network_arc_id]!
      stats[scenarioId] = {
        annualAvgTaf: summary.avg_pct_unimpaired ?? undefined,
        reliabilityPct: summary.mif_met_pct ?? undefined,
      }
    }
  })

  return { cellStats, isLoading }
}

// ============================================================================
// Section header (local — same pattern as RefugeSection)
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
          sx={{ textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}
        >
          {title}
        </Typography>
        {titleAdornment}
      </Box>
      {description && (
        <Box sx={{ color: theme.palette.grey[600], mt: 0.5, ...theme.typography.dashboard }}>
          {description}
        </Box>
      )}
    </Box>
  )
}

// ============================================================================
// Main component
// ============================================================================

interface EnvFlowSectionProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
}

export default function EnvFlowSection({ scenarios, scenarioNames }: EnvFlowSectionProps) {
  const theme = useTheme()

  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("streams")
  const [scaleMode, setScaleMode] = useState<"absolute" | "relative">("absolute")
  const [flowUnit, setFlowUnit] = useState<FlowUnit>("taf")

  // Fetch all 59 channel entities (static, cached 24 h)
  const { channels, isLoading: isLoadingChannels } = useChannelsList()

  // Apply channel filter
  const filteredChannels = useMemo(() => {
    if (channelFilter === "streams") return channels.filter((c) => c.channel_class === "stream")
    if (channelFilter === "mif_only") return channels.filter((c) => c.has_mif)
    return channels
  }, [channels, channelFilter])

  const filteredArcIds = new Set(filteredChannels.map((c) => c.network_arc_id))

  // Build ReservoirData[] for PercentileMatrix rows
  const reservoirData: ReservoirData[] = useMemo(
    () =>
      filteredChannels.map((ch) => ({
        reservoirId: ch.network_arc_id,
        reservoirName: ch.label ?? ch.network_arc_id,
        capacityTaf: 0,
        deadPoolTaf: 0,
        labelSubtitle: [ch.network_arc_id, ch.watershed_short_code]
          .filter(Boolean)
          .join(" · "),
        labelAttributes: [
          { key: "CLASS", value: channelClassLabel(ch.channel_class) },
          ...(ch.watershed_name ? [{ key: "WATERSHED", value: ch.watershed_name }] : []),
        ],
      })),
    [filteredChannels],
  )

  // Monthly data for all selected scenarios — recomputed when flowUnit changes
  const {
    matrixData: rawMatrix,
    isLoading: isLoadingMonthly,
    loadingScenarios,
  } = useMultiScenarioChannelsMonthly(scenarios, flowUnit)

  // Filter matrix to only include the selected channel subset
  const filteredMatrix: MatrixDataType = useMemo(() => {
    const result: MatrixDataType = {}
    for (const [arcId, scenarioMap] of Object.entries(rawMatrix)) {
      if (filteredArcIds.has(arcId)) result[arcId] = scenarioMap
    }
    return result
  }, [rawMatrix, filteredArcIds])

  // Period summaries for per-cell stats (avg % unimpaired + MIF compliance)
  const { cellStats } = useMultiScenarioChannelsPeriod(scenarios)

  const primaryScenario = scenarios[0] ?? null
  const hasData = !isLoadingMonthly && Object.keys(filteredMatrix).length > 0

  if (!primaryScenario) {
    return (
      <Box sx={{ p: theme.space.section.sm }}>
        <Typography color="text.secondary">
          Select a scenario to view river flow data.
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
          aria-label="Channel filter"
          value={channelFilter}
          options={CHANNEL_FILTER_OPTIONS}
          onChange={(v) => setChannelFilter(v as ChannelFilter)}
        />
        <CompactSelect
          aria-label="Flow unit"
          value={flowUnit}
          options={UNIT_OPTIONS}
          onChange={(v) => setFlowUnit(v as FlowUnit)}
        />
        <CompactSelect
          aria-label="Scale mode"
          value={scaleMode}
          options={SCALE_OPTIONS}
          onChange={(v) => setScaleMode(v as "absolute" | "relative")}
        />
      </Box>

      {isLoadingChannels ? null : (
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
            title={`Monthly river flows — ${flowUnit === "taf" ? "TAF / month" : "CFS"}`}
            description={
              <>
                Percentile distribution of monthly flow volume across all simulated
                years, per CalSim channel reach.
                Toggle between TAF/month and CFS using the control above.
                <Box
                  component="span"
                  sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1.5 }}
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
                      sx={{ color: "grey.500", fontSize: "0.875rem", fontWeight: 600 }}
                    >
                      Overlapping percentile bands:
                    </Box>
                    <FlowBandsLegend />
                  </Box>
                  <Box
                    component="span"
                    sx={{ color: "grey.400", fontSize: "0.8rem", fontStyle: "italic" }}
                  >
                    Upper chart region = wetter years (higher flow) · Lower region =
                    drier years (lower flow). Wet years = P10–P30; dry years = P70–P90.{" "}
                    <strong>Avg %</strong> = mean % of natural unimpaired flow over the
                    full simulation period.{" "}
                    <strong>MIF met</strong> = % of months where flow met the binding
                    minimum instream flow requirement (priority reaches only).
                  </Box>
                </Box>
              </>
            }
          />

          <Box sx={{ mt: theme.space.component.lg }}>
            {isLoadingMonthly && !hasData ? (
              <PercentileMatrixSkeleton
                scenarios={scenarios}
                rowCount={Math.min(filteredChannels.length, 5)}
                labelColumnWidth={180}
              />
            ) : !hasData ? (
              <Typography color="text.secondary" variant="body2">
                No river flow data available for this scenario.
              </Typography>
            ) : (
              <PercentileMatrix
                reservoirs={reservoirData}
                scenarios={scenarios}
                scenarioNames={scenarioNames}
                data={filteredMatrix}
                responsive
                labelColumnWidth={180}
                showScenarioHeaders={false}
                displayMode="volume"
                volumeScaleMode={scaleMode as VolumeScaleMode}
                colorScheme="delivery"
                loadingScenarios={loadingScenarios}
                cellStats={cellStats}
                minYMaxTaf={0}
              />
            )}
          </Box>
        </Box>
      )}
    </>
  )
}
