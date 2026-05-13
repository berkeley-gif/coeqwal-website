"use client"

/**
 * EnvFlowSection.Environmental River Flows section for the Data Explorer
 *
 * Displays two chart modes selectable via dropdown:
 *   "volume"        .Monthly flow volume (TAF/month or CFS) percentile bands
 *   "pct_unimpaired".Monthly % of natural unimpaired flow percentile bands
 *
 * Both views share the same monthly data fetch (708 rows per scenario).
 * Per-cell stats: annual avg flow (TAF/yr, summed from 12 monthly averages)
 * and MIF compliance % (priority reaches only).
 *
 * Layout follows the same CSS Grid patterns as RefugeSection and AgSection.
 */

import React, { useState, useMemo } from "react"
import { Box, Typography, Tooltip, useTheme } from "@repo/ui/mui"
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
import { useChannelsList } from "@repo/data/coeqwal/hooks"
import type {
  ChannelMonthlyStats,
  ChannelPeriodSummary,
  BatchStatisticsResponse,
  BatchEnvFlowData,
} from "@repo/data/coeqwal"

// ============================================================================
// Types
// ============================================================================

type MatrixDataType = Record<
  string,
  Record<string, MonthlyPercentiles | undefined>
>
type ChannelFilter = "all" | "streams" | "eflows_only" | "mif_only"
type FlowUnit = "taf" | "cfs"
type ChartMode = "volume" | "pct_unimpaired"

// ============================================================================
// Constants
// ============================================================================

const CHART_MODE_OPTIONS = [
  { value: "volume" as const, label: "Monthly flow volume" },
  {
    value: "pct_unimpaired" as const,
    label: "% Unimpaired (coming soon)",
    disabled: true,
  },
]

/**
 * Channel filter groups for the dropdown.
 * Counts are approximate (from channel_entity seed data); live counts
 * are computed dynamically inside the component and used for display labels.
 */
const CHANNEL_FILTER_GROUPS = [
  {
    label: "Stream reaches",
    options: [
      { value: "streams" as const, label: "Stream reaches" },
      { value: "eflows_only" as const, label: "EFLOWS streams" },
      { value: "mif_only" as const, label: "MIF streams" },
    ],
  },
  {
    label: "All channels",
    options: [{ value: "all" as const, label: "All channels" }],
  },
]

const CHANNEL_FILTER_DESCRIPTIONS: Record<ChannelFilter, string> = {
  streams:
    "All CalSim stream reaches. Excludes reservoir releases (e.g. below Shasta, Oroville) and conveyance canals.",
  eflows_only:
    "17 streams with prescribed functional flow (EFLOWS) targets in the model SV input. These are the reaches used for tier results and the California Environmental Flows Framework analysis.",
  mif_only:
    "20 stream reaches with a binding minimum instream flow (MIF) companion variable (C_reach_MIF) in the model DV output. These are the primary environmental monitoring locations.",
  all: "All 59 CalSim channel reaches including stream reaches, reservoir releases (e.g. below dams), and conveyance canals (e.g. Delta Cross Channel, Clifton Court).",
}

const SCALE_OPTIONS = [
  { value: "absolute" as const, label: "Absolute scale" },
  { value: "relative" as const, label: "Relative scale" },
]

const UNIT_OPTIONS = [
  { value: "taf" as const, label: "TAF / month" },
  { value: "cfs" as const, label: "CFS" },
]

const DELIVERY_BAND_COLORS = {
  range: "#d9eafb",
  outer: "#c5dbf3",
  inner: "#a2bee1",
  median: "#2c5aa0",
}

const PCT_BAND_COLORS = {
  range: "#d5f0e2",
  outer: "#a8dcbe",
  inner: "#6ec297",
  median: "#1d7a45",
}

// ============================================================================
// Legend
// ============================================================================

function BandLegend({ colors }: { colors: typeof DELIVERY_BAND_COLORS }) {
  return (
    <>
      <Box
        component="span"
        sx={{
          width: 14,
          height: 14,
          backgroundColor: colors.range,
          borderRadius: "2px",
        }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        Min–max
      </Box>
      <Box
        component="span"
        sx={{
          width: 14,
          height: 14,
          backgroundColor: colors.outer,
          borderRadius: "2px",
          ml: 0.75,
        }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        10–90th pct
      </Box>
      <Box
        component="span"
        sx={{
          width: 14,
          height: 14,
          backgroundColor: colors.inner,
          borderRadius: "2px",
          ml: 0.75,
        }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        30–70th pct
      </Box>
      <Box
        component="span"
        sx={{
          width: 14,
          height: 3,
          backgroundColor: colors.median,
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

function channelClassLabel(cls: string | null): string {
  if (cls === "stream") return "Stream"
  if (cls === "canal") return "Canal"
  if (cls === "reservoir_release") return "Reservoir release"
  return cls ?? "Unknown"
}

/**
 * Flow volume percentile bands (CFS or TAF) from migration-28 columns.
 * Skips months where the median is null/undefined (missing or old API).
 */
function rowsToVolumePercentiles(
  rows: ChannelMonthlyStats[],
  unit: FlowUnit,
): MonthlyPercentiles {
  const monthly: MonthlyPercentiles = {}
  for (const row of rows) {
    if (unit === "taf") {
      if (row.flow_q50_taf == null) continue
      monthly[String(row.water_month)] = {
        q0: row.flow_q0_taf ?? 0,
        q10: row.flow_q10_taf ?? 0,
        q30: row.flow_q30_taf ?? 0,
        q50: row.flow_q50_taf,
        q70: row.flow_q70_taf ?? 0,
        q90: row.flow_q90_taf ?? 0,
        q100: row.flow_q100_taf ?? 0,
        mean: row.flow_avg_taf ?? 0,
      }
    } else {
      if (row.flow_q50_cfs == null) continue
      monthly[String(row.water_month)] = {
        q0: row.flow_q0_cfs ?? 0,
        q10: row.flow_q10_cfs ?? 0,
        q30: row.flow_q30_cfs ?? 0,
        q50: row.flow_q50_cfs,
        q70: row.flow_q70_cfs ?? 0,
        q90: row.flow_q90_cfs ?? 0,
        q100: row.flow_q100_cfs ?? 0,
        mean: row.flow_avg_cfs ?? 0,
      }
    }
  }
  return monthly
}

/**
 * % Unimpaired percentile bands from the q0-q100 / pct_unimpaired columns.
 * NULL where no unimpaired reference exists (Mokelumne, some canals).
 * Values are percentages (0-infinity); highly regulated reaches can exceed 100%.
 */
function rowsToPctUnimpairedPercentiles(
  rows: ChannelMonthlyStats[],
): MonthlyPercentiles {
  const monthly: MonthlyPercentiles = {}
  for (const row of rows) {
    if (row.q50 == null) continue
    monthly[String(row.water_month)] = {
      q0: row.q0 ?? 0,
      q10: row.q10 ?? 0,
      q30: row.q30 ?? 0,
      q50: row.q50,
      q70: row.q70 ?? 0,
      q90: row.q90 ?? 0,
      q100: row.q100 ?? 0,
      mean: row.pct_unimpaired_avg ?? 0,
    }
  }
  return monthly
}

/**
 * Annual average flow in TAF/yr = sum of 12 monthly flow_avg_taf values.
 * Returns null if any monthly value is missing (no data for that channel).
 */
function computeAnnualAvgTaf(rows: ChannelMonthlyStats[]): number | null {
  if (!rows.length) return null
  let total = 0
  let count = 0
  for (const row of rows) {
    if (row.flow_avg_taf != null) {
      total += row.flow_avg_taf
      count++
    }
  }
  return count === 12 ? total : count > 0 ? total * (12 / count) : null
}

/**
 * Annual average flow in CFS = mean of 12 monthly flow_avg_cfs values.
 */
function computeAnnualAvgCfs(rows: ChannelMonthlyStats[]): number | null {
  const vals = rows
    .map((r) => r.flow_avg_cfs)
    .filter((v): v is number => v != null)
  return vals.length === 12 ? vals.reduce((a, b) => a + b, 0) / 12 : null
}

// ============================================================================
// Multi-scenario data hooks
// ============================================================================

/**
 * Fetches monthly data for all scenarios and derives:
 *   - volumeMatrix .flow volume percentiles (TAF or CFS)
 *   - pctMatrix    .% unimpaired percentiles
 *   - annualCellStats.per-cell annual avg flow (TAF/yr) + annual avg CFS
 *
 * A single fetch powers both chart modes.
 */
/**
 * Build the monthly volume / % unimpaired matrices and annual per-cell
 * stats from the batched env_flow response.
 */
function buildMonthlyMatrices(
  scenarios: string[],
  envFlowBatch: Record<string, BatchEnvFlowData> | undefined,
  unit: FlowUnit,
) {
  const volumeMatrix: MatrixDataType = {}
  const pctMatrix: MatrixDataType = {}
  const annualCellStats: CellStatsMap = {}

  scenarios.forEach((scenarioId) => {
    const rows = envFlowBatch?.[scenarioId]?.monthly?.data
    if (!rows?.length) return

    const byChannel = new Map<string, ChannelMonthlyStats[]>()
    for (const row of rows) {
      if (!byChannel.has(row.network_arc_id))
        byChannel.set(row.network_arc_id, [])
      byChannel.get(row.network_arc_id)!.push(row)
    }

    for (const [arcId, arcRows] of byChannel.entries()) {
      if (!volumeMatrix[arcId]) volumeMatrix[arcId] = {}
      volumeMatrix[arcId][scenarioId] = rowsToVolumePercentiles(arcRows, unit)

      if (!pctMatrix[arcId]) pctMatrix[arcId] = {}
      pctMatrix[arcId][scenarioId] = rowsToPctUnimpairedPercentiles(arcRows)

      // Annual avg flow for per-cell stats. PercentileMatrix has two slots,
      // so we show TAF/yr in the primary slot when unit is taf, otherwise
      // CFS avg.
      const annualTaf = computeAnnualAvgTaf(arcRows)
      const annualCfs = computeAnnualAvgCfs(arcRows)
      if (!annualCellStats[arcId]) annualCellStats[arcId] = {}
      annualCellStats[arcId]![scenarioId] = {
        annualAvgTaf:
          unit === "taf" ? (annualTaf ?? undefined) : (annualCfs ?? undefined),
      }
    }
  })

  return { volumeMatrix, pctMatrix, annualCellStats }
}

/** MIF compliance % from period-of-record summaries in the batch response. */
function buildMifStats(
  scenarios: string[],
  envFlowBatch: Record<string, BatchEnvFlowData> | undefined,
): CellStatsMap {
  const mifStats: CellStatsMap = {}
  scenarios.forEach((scenarioId) => {
    const summaries = envFlowBatch?.[scenarioId]?.period?.data
    if (!summaries?.length) return
    for (const summary of summaries as ChannelPeriodSummary[]) {
      if (!mifStats[summary.network_arc_id])
        mifStats[summary.network_arc_id] = {}
      mifStats[summary.network_arc_id]![scenarioId] = {
        reliabilityPct: summary.mif_met_pct ?? undefined,
      }
    }
  })
  return mifStats
}

// ============================================================================
// Main component
// ============================================================================

interface EnvFlowSectionProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
  /** Pre-fetched batch response (storage/cws/ag/env_flow keyed by scenario) */
  batchData: BatchStatisticsResponse | undefined
  /** Whether the batched fetch is still in flight */
  isBatchLoading: boolean
}

export default function EnvFlowSection({
  scenarios,
  scenarioNames,
  batchData,
  isBatchLoading,
}: EnvFlowSectionProps) {
  const theme = useTheme()
  const envFlowBatch = batchData?.env_flow

  const [chartMode, setChartMode] = useState<ChartMode>("volume")
  const [channelFilter, setChannelFilter] =
    useState<ChannelFilter>("eflows_only")
  // Each chart mode remembers its own scale preference independently.
  // % unimpaired defaults to relative because pct_unimpaired varies enormously
  // across channels (downstream routing nodes have values >> 100% while
  // headwater reaches may be < 100%), making a shared absolute axis impractical.
  const [volumeScaleMode, setVolumeScaleMode] = useState<
    "absolute" | "relative"
  >("absolute")
  const [pctScaleMode, setPctScaleMode] = useState<"absolute" | "relative">(
    "relative",
  )
  const [flowUnit, setFlowUnit] = useState<FlowUnit>("taf")

  const scaleMode = chartMode === "volume" ? volumeScaleMode : pctScaleMode
  function setScaleMode(v: "absolute" | "relative") {
    if (chartMode === "volume") setVolumeScaleMode(v)
    else setPctScaleMode(v)
  }

  const { channels, isLoading: isLoadingChannels } = useChannelsList()

  const filteredChannels = useMemo(() => {
    if (channelFilter === "streams")
      return channels.filter((c) => c.channel_class === "stream")
    if (channelFilter === "eflows_only")
      return channels.filter((c) => c.has_eflows)
    if (channelFilter === "mif_only") return channels.filter((c) => c.has_mif)
    return channels
  }, [channels, channelFilter])

  // Dynamic counts for dropdown labels (updated once channels load)
  const channelCounts = useMemo(
    () => ({
      streams: channels.filter((c) => c.channel_class === "stream").length,
      eflows_only: channels.filter((c) => c.has_eflows).length,
      mif_only: channels.filter((c) => c.has_mif).length,
      all: channels.length,
    }),
    [channels],
  )

  // Build groups with live counts appended to labels
  const channelFilterGroups = useMemo(() => {
    if (!channels.length) return CHANNEL_FILTER_GROUPS
    return CHANNEL_FILTER_GROUPS.map((group) => ({
      ...group,
      options: group.options.map((opt) => ({
        ...opt,
        label: `${opt.label} (${channelCounts[opt.value]})`,
      })),
    }))
  }, [channels.length, channelCounts])

  const filteredArcIds = useMemo(
    () => new Set(filteredChannels.map((c) => c.network_arc_id)),
    [filteredChannels],
  )

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
          ...(ch.watershed_name
            ? [{ key: "WATERSHED", value: ch.watershed_name }]
            : []),
        ],
      })),
    [filteredChannels],
  )

  const { volumeMatrix, pctMatrix, annualCellStats } = useMemo(
    () => buildMonthlyMatrices(scenarios, envFlowBatch, flowUnit),
    [scenarios, envFlowBatch, flowUnit],
  )

  const mifStats = useMemo(
    () => buildMifStats(scenarios, envFlowBatch),
    [scenarios, envFlowBatch],
  )

  const isLoadingMonthly = isBatchLoading
  const loadingScenarios = isBatchLoading ? scenarios : []

  // Merge annual avg flow + MIF compliance into one CellStatsMap
  const cellStats: CellStatsMap = useMemo(() => {
    const merged: CellStatsMap = {}
    const arcIds = new Set([
      ...Object.keys(annualCellStats),
      ...Object.keys(mifStats),
    ])
    for (const arcId of arcIds) {
      merged[arcId] = {}
      for (const scenarioId of scenarios) {
        merged[arcId]![scenarioId] = {
          annualAvgTaf: annualCellStats[arcId]?.[scenarioId]?.annualAvgTaf,
          reliabilityPct: mifStats[arcId]?.[scenarioId]?.reliabilityPct,
        }
      }
    }
    return merged
  }, [annualCellStats, mifStats, scenarios])

  // Filter matrices to the visible channel subset
  const activeMatrix: MatrixDataType = useMemo(() => {
    const raw = chartMode === "volume" ? volumeMatrix : pctMatrix
    const result: MatrixDataType = {}
    for (const [arcId, scenarioMap] of Object.entries(raw)) {
      if (filteredArcIds.has(arcId)) result[arcId] = scenarioMap
    }
    return result
  }, [chartMode, volumeMatrix, pctMatrix, filteredArcIds])

  const primaryScenario = scenarios[0] ?? null
  const hasData = !isLoadingMonthly && Object.keys(activeMatrix).length > 0

  const isVolume = chartMode === "volume"
  const unitLabel = flowUnit === "taf" ? "TAF / month" : "CFS"
  const annualStatLabel = flowUnit === "taf" ? "TAF/yr" : "CFS avg"

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
          aria-label="Chart mode"
          value={chartMode}
          options={CHART_MODE_OPTIONS}
          onChange={(v) => setChartMode(v as ChartMode)}
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <CompactSelect
            aria-label="Channel filter"
            value={channelFilter}
            groups={channelFilterGroups}
            onChange={(v) => setChannelFilter(v as ChannelFilter)}
            minWidth={200}
          />
          <Tooltip
            title={
              <Box sx={{ maxWidth: 300, fontSize: "0.8rem", lineHeight: 1.5 }}>
                <Box sx={{ fontWeight: 600, mb: 0.5 }}>Channel subsets</Box>
                <Box sx={{ mb: 0.75 }}>
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    Stream reaches:{" "}
                  </Box>
                  {CHANNEL_FILTER_DESCRIPTIONS.streams}
                </Box>
                <Box sx={{ mb: 0.75 }}>
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    EFLOWS streams:{" "}
                  </Box>
                  {CHANNEL_FILTER_DESCRIPTIONS.eflows_only}
                </Box>
                <Box sx={{ mb: 0.75 }}>
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    MIF streams:{" "}
                  </Box>
                  {CHANNEL_FILTER_DESCRIPTIONS.mif_only}
                </Box>
                <Box>
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    All channels:{" "}
                  </Box>
                  {CHANNEL_FILTER_DESCRIPTIONS.all}
                </Box>
              </Box>
            }
            placement="bottom-start"
            arrow
          >
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 18,
                height: 18,
                borderRadius: "50%",
                border: "1.5px solid",
                borderColor: "grey.400",
                color: "grey.500",
                fontSize: "0.7rem",
                fontWeight: 700,
                lineHeight: 1,
                cursor: "help",
                userSelect: "none",
                flexShrink: 0,
              }}
            >
              ?
            </Box>
          </Tooltip>
        </Box>
        {isVolume && (
          <CompactSelect
            aria-label="Flow unit"
            value={flowUnit}
            options={UNIT_OPTIONS}
            onChange={(v) => setFlowUnit(v as FlowUnit)}
          />
        )}
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
            boxShadow: theme.shadow.subtle,
            p: theme.space.component.lg,
            mb: theme.space.component.lg,
          }}
        >
          <SectionHeader
            title={
              isVolume
                ? `Monthly river flows (${unitLabel})`
                : "Monthly % of natural unimpaired flow"
            }
            description={
              isVolume ? (
                <>
                  Percentile distribution of monthly flow volume ({unitLabel})
                  across all simulated years, per CalSim channel reach.{" "}
                  <Box component="span" sx={{ color: "grey.500" }}>
                    {CHANNEL_FILTER_DESCRIPTIONS[channelFilter]}
                  </Box>
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 1,
                      flexWrap: "wrap",
                      mt: 1,
                      ml: 0.5,
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
                      Bands:
                    </Box>
                    <BandLegend colors={DELIVERY_BAND_COLORS} />
                  </Box>
                  <Box
                    component="span"
                    sx={{
                      display: "block",
                      color: "grey.400",
                      fontSize: "0.8rem",
                      mt: 0.75,
                    }}
                  >
                    <strong>{annualStatLabel}</strong> = annual average flow
                    (sum of 12 monthly means). <strong>MIF met</strong> = % of
                    months at or above binding minimum instream flow (priority
                    reaches only).
                  </Box>
                </>
              ) : (
                <>
                  Monthly flow as a percentage of the natural unimpaired
                  reference (C_{"{reach}"} / UNIMP_{"{watershed}"} x 100).
                  Percentile distribution across 100 simulated years. Each chart
                  is scaled independently (relative mode) because downstream
                  routing nodes accumulate multiple watersheds and can far
                  exceed 100%. A bold gridline marks 100% (= natural flow) where
                  it falls within range. NULL where no unimpaired reference
                  exists (Mokelumne, some canals).
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 1,
                      flexWrap: "wrap",
                      mt: 1,
                      ml: 0.5,
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
                      Bands:
                    </Box>
                    <BandLegend colors={PCT_BAND_COLORS} />
                  </Box>
                  <Box
                    component="span"
                    sx={{
                      display: "block",
                      color: "grey.400",
                      fontSize: "0.8rem",
                      mt: 0.75,
                    }}
                  >
                    Y-axis unit is % per channel (not TAF).{" "}
                    <strong>MIF met</strong> = % of months at or above binding
                    minimum instream flow (priority reaches only).
                  </Box>
                </>
              )
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
                data={activeMatrix}
                responsive
                labelColumnWidth={180}
                showScenarioHeaders={false}
                displayMode="volume"
                volumeScaleMode={scaleMode as VolumeScaleMode}
                colorScheme="delivery"
                loadingScenarios={loadingScenarios}
                cellStats={cellStats}
                minYMaxTaf={isVolume ? 0 : 100}
                yAxisSuffix={isVolume ? undefined : "%"}
                yAxisReferenceValue={isVolume ? undefined : 100}
              />
            )}
          </Box>
        </Box>
      )}
    </>
  )
}
