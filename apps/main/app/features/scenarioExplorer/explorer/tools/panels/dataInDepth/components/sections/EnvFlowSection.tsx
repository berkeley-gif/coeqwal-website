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
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { CompactSelect, HoverTip } from "@repo/ui"
import { PercentileMatrix } from "@repo/viz"
import type {
  ReservoirData,
  MonthlyPercentiles,
  VolumeScaleMode,
} from "@repo/viz"
import { GridScenarioHeader } from "../shared/AlignedScenarioGrid"
import { ChartGridProvider } from "../shared/ChartGridContext"
import { PercentileMatrixSkeleton } from "../shared/PercentileMatrixSkeleton"
import { SectionHeader } from "../shared/SectionHeader"
import { BandLegend, COMPACT_BAND_LABELS } from "../shared/BandsLegend"
import { DELIVERY_BAND_COLORS, PCT_BAND_COLORS } from "../../config/bandColors"
import type { BatchSectionProps } from "../shared/sectionTypes"
import { useChannelsList } from "@repo/data/coeqwal/hooks"
import { useEnvFlowData, type FlowUnit } from "../../hooks/useEnvFlowData"

// ============================================================================
// Types
// ============================================================================

type MatrixDataType = Record<
  string,
  Record<string, MonthlyPercentiles | undefined>
>
type ChannelFilter = "all" | "streams" | "eflows_only" | "mif_only"
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
 * Counts are approximate (from channel_entity seed data). Live counts
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

// ============================================================================
// Helpers
// ============================================================================

function channelClassLabel(cls: string | null): string {
  if (cls === "stream") return "Stream"
  if (cls === "canal") return "Canal"
  if (cls === "reservoir_release") return "Reservoir release"
  return cls ?? "Unknown"
}

// ============================================================================
// Main component
// ============================================================================

export default function EnvFlowSection({
  scenarios,
  scenarioNames,
  batchData,
  isBatchLoading,
}: BatchSectionProps) {
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

  const { volumeMatrix, pctMatrix, cellStats, loadingScenarios } =
    useEnvFlowData(scenarios, envFlowBatch, flowUnit, isBatchLoading)

  const isLoadingMonthly = isBatchLoading

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
      {/* Sticky scenario header. Soft drop shadow matches the List view's
          pinned block so content reads as scrolling under a fixed header. */}
      <Box sx={theme.scenarios.stickyScenarioHeader}>
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
          <HoverTip
            content={
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
          </HoverTip>
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
                        typography: "dashboardBold",
                      }}
                    >
                      Bands:
                    </Box>
                    <BandLegend
                      colors={DELIVERY_BAND_COLORS}
                      labels={COMPACT_BAND_LABELS}
                    />
                  </Box>
                  <Box
                    component="span"
                    sx={{
                      display: "block",
                      color: "grey.400",
                      typography: "compactSubtitle",
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
                        typography: "dashboardBold",
                      }}
                    >
                      Bands:
                    </Box>
                    <BandLegend
                      colors={PCT_BAND_COLORS}
                      labels={COMPACT_BAND_LABELS}
                    />
                  </Box>
                  <Box
                    component="span"
                    sx={{
                      display: "block",
                      color: "grey.400",
                      typography: "compactSubtitle",
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
