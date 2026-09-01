"use client"

/**
 * ChartCard - the explorer's main panel: an interpretive summary sentence, the
 * view-appropriate @repo/viz chart, a color legend, and the data-source label.
 *
 * The chart is chosen from the current view and distribution style:
 *  - annual distribution / percent of capacity -> ExceedanceChart or BoxPlot
 *  - year-to-year variability / summary value  -> CategoricalBarChart
 * Series colors are sticky per member id (seriesColorAssignment), so a member
 * keeps its color across selection changes and the legend swatches, the
 * chart marks, and the CompareControls chips all agree. Every card is labeled
 * "Sample data" while it runs on the deterministic sample-data engine.
 */

import React from "react"
import { Box, Chip, Tooltip, Typography, useTheme } from "@repo/ui/mui"
import { BoxPlot, CategoricalBarChart, ExceedanceChart } from "@repo/viz"
import { useDataSlice } from "../../../../store"
import { useVariableData } from "../hooks/useVariableData"
import { usePerfPaintMark } from "../hooks/usePerfPaintMark"
import { getStableSeriesColors } from "../config/seriesColorAssignment"
import {
  dataFigureTitle,
  formatValue,
  summarySentence,
  type SummaryContext,
  type SummaryMember,
} from "../hooks/interpretiveText"
import { WYT_LABELS } from "../config/wytFilter"
import { MOCK_YEARS } from "../config/mockDataEngine"
import {
  axisLabelFor,
  buildStatsPanels,
  toBars,
  toBoxes,
  toSeries,
} from "./chartMarks"
import { SaveSnapshotButton } from "../../../chrome/actions/SaveSnapshotButton"
import { InlineTourAnchor, useTourAnchor } from "../../../tour"
import { useDataShareCapture } from "../hooks/useDataShareCapture"

const CHART_HEIGHT = 340

export default function ChartCard() {
  const theme = useTheme()
  const chartAnchorRef = useTourAnchor("data.chart")
  const { compareBy, distKind, selectedWaterYearTypes } = useDataSlice()
  const data = useVariableData()

  // Standardized figure title, shared verbatim with the snapshot export.
  const figureTitle = dataFigureTitle({
    variableName: data.variable?.name ?? "",
    figureTitleHead: data.variable?.figureTitleHead,
    compareBy,
    memberCount: data.members.length,
    firstMemberLabel: data.members[0]?.label,
    locationTitleName: data.locationTitleName,
    climateName: data.climateName,
    scenarioName: data.scenarioName,
    // The WYT clause stays in value-view titles on purpose: the capture
    // exports the FILTERED series (mock filters in every view), so title,
    // provenance, and exported data agree even though the on-screen summary
    // value does not derive from the filtered series (see the did-wyt spec
    // "value-view capture" case).
    waterYearTypeLabels: data.wytApplicable
      ? selectedWaterYearTypes.map((c) => WYT_LABELS[c] ?? String(c))
      : null,
  })

  // One sticky color per member id, shared with the CompareControls chips
  // (same scope key + same ordered member ids on both surfaces).
  const colorScope =
    compareBy === "locations"
      ? `locations:${data.variable?.locationGroup ?? ""}`
      : compareBy
  const memberColors = getStableSeriesColors(
    colorScope,
    data.members.map((m) => m.id),
  )

  const share = useDataShareCapture(data, memberColors)

  const fmt = (v: number) => formatValue(v, data.unit)

  // Small outlined chip shared by the per-curve provenance labels; matches
  // the existing "reference" chip so the legend reads as one vocabulary.
  const memberChipSx = {
    fontSize: "0.62rem",
    fontWeight: 600,
    color: theme.palette.grey[600],
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: "4px",
    px: 0.5,
    cursor: "help",
  } as const

  const liveMemberCount = data.members.filter((m) => m.isLive).length

  const summaryMembers: SummaryMember[] = data.members.map((m) => ({
    id: m.id,
    label: m.label,
    series: m.series,
    value: m.value,
    isReference: m.isReference,
    isLive: m.isLive,
    liveDataMissing: m.liveDataMissing,
    pending: m.pending,
  }))

  const ctx: SummaryContext = {
    view: data.view,
    distKind,
    compareBy,
    variableName: data.variable?.name ?? "",
    variableId: data.variable?.id,
    proseName: data.variable?.proseName,
    unit: data.unit,
    locationName: data.locationName,
    locationTitleName: data.locationTitleName,
    climateName: data.climateName,
    scenarioName: data.scenarioName,
  }

  const yLabel = axisLabelFor(data.variable, data.view, data.unit)
  const hasMembers = data.members.length > 0

  // Members whose scenario is not modeled for this variable keep their legend
  // entry (with a "no data" chip and an explanation) but are NOT drawn. Their
  // series exists only because the sample engine always produces one, and
  // drawing it would put a fabricated curve on a chart labeled "Live data".
  // A member whose live request is still in flight is held back the same
  // way (legend chip "loading") so the stand-in never shows, even briefly.
  // Colors are positional, so the subset carries its own aligned colors.
  const plotted = data.members
    .map((m, i) => ({ member: m, color: memberColors[i] ?? "" }))
    .filter((p) => !p.member.liveDataMissing && !p.member.pending)
  const plottedMembers = plotted.map((p) => p.member)
  const plottedColors = plotted.map((p) => p.color)
  const hasPlotted = plottedMembers.length > 0
  const anyPending = data.members.some((m) => m.pending)
  const missingMembers = data.members.filter((m) => m.liveDataMissing)
  // One visible line, in addition to the per-curve chip, whenever a compared
  // member is not modeled for this variable and the chart still draws others.
  const noDataNotice =
    hasPlotted && missingMembers.length > 0
      ? (data.variable?.noLiveDataExplanation ??
        `Live data is not available for ${missingMembers
          .map((m) => m.label)
          .join(", ")}.`)
      : null

  // Dev-only (NEXT_PUBLIC_PERF_LOG=1): approximate when the explorer chart
  // hits the screen for the current members/variable/view combination.
  usePerfPaintMark(
    "paint:explorer-chart",
    hasMembers,
    `${data.members.map((m) => m.id).join(",")}|${data.variable?.name ?? ""}|${data.view}`,
  )

  let chart: React.ReactNode = null
  if (data.unavailableReason) {
    chart = (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: CHART_HEIGHT,
          color: theme.palette.grey[600],
          px: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="body2">{data.unavailableReason}</Typography>
      </Box>
    )
  } else if (!hasPlotted && anyPending) {
    // Nothing has answered yet: say so, rather than showing the sample
    // engine's stand-in or the no-data explanation for a result still coming.
    chart = (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: CHART_HEIGHT,
          color: theme.palette.grey[600],
          px: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="body2">Loading model results.</Typography>
      </Box>
    )
  } else if (!hasMembers || !hasPlotted) {
    chart = (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: CHART_HEIGHT,
          color: theme.palette.grey[600],
          px: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="body2">
          {hasMembers
            ? (data.variable?.noLiveDataExplanation ??
              "Live data is not available for the selected scenarios.")
            : "Nothing to compare yet. Pick members in the controls above."}
        </Typography>
      </Box>
    )
  } else if (data.view === "cv" || data.view === "value") {
    chart = (
      <CategoricalBarChart
        bars={toBars(plottedMembers, plottedColors)}
        yAxisLabel={yLabel}
        formatValue={fmt}
      />
    )
  } else if (distKind === "stats") {
    // Side-by-side summary statistics of the selected quantity view: mean
    // and CV everywhere, plus the linear level trend (ft/yr) on the
    // groundwater level view.
    const statPanels = buildStatsPanels(
      data.view,
      data.unit,
      axisLabelFor(data.variable, data.view, data.unit),
    )
    chart = (
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: { xs: "wrap", md: "nowrap" },
        }}
      >
        {statPanels.map((panel) => (
          <Box key={panel.key} sx={{ flex: 1, minWidth: 220 }}>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                textAlign: "center",
                color: theme.palette.grey[600],
                mb: 0.5,
              }}
            >
              {panel.title}
            </Typography>
            <CategoricalBarChart
              bars={plottedMembers.map((m, i) => ({
                id: m.id,
                label: m.label,
                value: panel.valueOf(m),
                color: plottedColors[i],
              }))}
              yAxisLabel={panel.yLabel}
              formatValue={panel.format}
            />
          </Box>
        ))}
      </Box>
    )
  } else if (distKind === "box") {
    chart = (
      <BoxPlot
        boxes={toBoxes(plottedMembers, plottedColors)}
        whiskers="p10p90"
        yAxisLabel={yLabel}
        formatValue={fmt}
      />
    )
  } else {
    chart = (
      <ExceedanceChart
        series={toSeries(plottedMembers, plottedColors)}
        yAxisLabel={yLabel}
        formatValue={fmt}
      />
    )
  }

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        p: { xs: 2, md: 2.5 },
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {/* Data-source labels */}
      <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
        {/* Nothing is claimed when nothing is shown, or not yet known */}
        {!data.unavailableReason && !(anyPending && !hasPlotted) && (
          <Chip
            size="small"
            label={data.source === "live" ? "Live data" : "Sample data"}
            sx={{
              backgroundColor:
                data.source === "live"
                  ? theme.palette.info.light
                  : theme.palette.grey[100],
              color:
                data.source === "live"
                  ? theme.palette.info.dark
                  : theme.palette.grey[600],
              fontWeight: 600,
            }}
          />
        )}
        {data.provisional && (
          <Tooltip title="Scope still under discussion (deck vs. outcomes sheet)">
            <Chip
              size="small"
              label="Provisional"
              variant="outlined"
              sx={{
                color: theme.palette.warning.main,
                borderColor: theme.palette.warning.main,
                fontWeight: 600,
              }}
            />
          </Tooltip>
        )}
        <Box sx={{ flex: 1 }} />
        <InlineTourAnchor anchorId="data.saveSnapshot">
          <SaveSnapshotButton
            disabled={!share.canSnapshot}
            onClick={share.onSaveSnapshot}
          />
        </InlineTourAnchor>
      </Box>

      {/* Interpretive summary sentence (never from series that cannot be shown) */}
      {hasMembers && !data.unavailableReason && (
        <Typography
          variant="body2"
          sx={{ mb: 1.5, color: theme.palette.text.primary, lineHeight: 1.5 }}
        >
          {summarySentence(summaryMembers, ctx)}
        </Typography>
      )}

      {/* Visible no-data notice for a compared member the model does not
          cover (the per-curve chip alone is easy to miss) */}
      {noDataNotice && !data.unavailableReason && (
        <Typography
          role="status"
          variant="body2"
          sx={{
            mb: 1.5,
            color: theme.palette.grey[700],
            fontStyle: "italic",
            lineHeight: 1.5,
          }}
        >
          {noDataNotice}
        </Typography>
      )}

      {/* Standardized figure title (mirrored on snapshot exports) */}
      {hasMembers && (
        <Typography
          variant="subtitle2"
          component="h3"
          sx={{
            mb: 1,
            color: theme.palette.text.primary,
            fontWeight: 600,
          }}
        >
          {figureTitle}
        </Typography>
      )}

      {/* Chart. With members, the region reads as one labeled figure:
          the D3 internals carry no accessible semantics of their own,
          and the per-chart data alternative is the CSV export. */}
      <Box
        ref={chartAnchorRef}
        {...(hasMembers ? { role: "img", "aria-label": figureTitle } : {})}
        sx={{ width: "100%", height: CHART_HEIGHT }}
      >
        {chart}
      </Box>

      {/* Legend */}
      {hasMembers && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
            mt: 1.5,
          }}
        >
          {data.members.map((m, i) => (
            <Box
              key={m.id}
              sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "3px",
                  backgroundColor: memberColors[i],
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.primary }}
              >
                {m.label}
              </Typography>
              {m.isReference && (
                <Box
                  component="span"
                  sx={{
                    fontSize: "0.62rem",
                    fontWeight: 600,
                    color: theme.palette.grey[600],
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: "4px",
                    px: 0.5,
                  }}
                >
                  reference
                </Box>
              )}
              {/* Per-curve provenance. The chart-level badge above describes
                  the figure as a whole; once one series is live and another
                  is not, only a per-curve label is honest. "No data" and
                  "sample" are deliberately different words: the first means
                  the scenario is not modeled for this variable at all, the
                  second means it is not wired to live data yet. */}
              {m.pending ? (
                <Tooltip title="Waiting for model results for this series.">
                  <Box component="span" sx={memberChipSx}>
                    loading
                  </Box>
                </Tooltip>
              ) : m.liveDataMissing ? (
                <Tooltip
                  title={
                    data.variable?.noLiveDataExplanation ??
                    "Live data is not available for this scenario."
                  }
                >
                  <Box component="span" sx={memberChipSx}>
                    no data
                  </Box>
                </Tooltip>
              ) : (
                data.mixedSource &&
                !m.isLive && (
                  <Tooltip title="This series is sample data, not model results.">
                    <Box component="span" sx={memberChipSx}>
                      sample
                    </Box>
                  </Tooltip>
                )
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Variable footnote: the detailed reading of the metric */}
      {data.variable?.footnote && (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 1.5,
            color: theme.palette.grey[600],
          }}
        >
          {data.variable.footnote}
        </Typography>
      )}

      {/* Provenance note */}
      {!data.unavailableReason && (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 1.5,
            color: theme.palette.grey[500],
            fontStyle: "italic",
          }}
        >
          {data.source === "live"
            ? data.mixedSource
              ? `Live data from api.coeqwal.org (CalSim3 post-processed annual series) for ${liveMemberCount} of ${data.members.length} series; see the legend for series shown as sample or without data.`
              : "Live data from api.coeqwal.org (CalSim3 post-processed annual series)."
            : `Sample data (${MOCK_YEARS} simulated years, seeded): illustrative structure that mimics CalSim3 post-processed output, not model results.`}
        </Typography>
      )}
    </Box>
  )
}
