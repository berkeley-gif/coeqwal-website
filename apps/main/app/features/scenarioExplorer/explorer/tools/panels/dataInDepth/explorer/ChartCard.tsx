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
import { linearTrendPerYear, MOCK_YEARS } from "../config/mockDataEngine"
import { toBars, toBoxes, toSeries } from "./chartMarks"
import { SaveSnapshotButton } from "../../../chrome/actions/SaveSnapshotButton"
import { useDataShareCapture } from "../hooks/useDataShareCapture"

const CHART_HEIGHT = 340

export default function ChartCard() {
  const theme = useTheme()
  const { compareBy, distKind, selectedWaterYearTypes } = useDataSlice()
  const data = useVariableData()

  // Standardized figure title, shared verbatim with the snapshot export.
  const figureTitle = dataFigureTitle({
    variableName: data.variable?.name ?? "",
    compareBy,
    memberCount: data.members.length,
    firstMemberLabel: data.members[0]?.label,
    locationTitleName: data.locationTitleName,
    climateName: data.climateName,
    scenarioName: data.scenarioName,
    waterYearTypeLabels: selectedWaterYearTypes.map(
      (c) => WYT_LABELS[c] ?? String(c),
    ),
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

  const summaryMembers: SummaryMember[] = data.members.map((m) => ({
    id: m.id,
    label: m.label,
    series: m.series,
    value: m.value,
    isReference: m.isReference,
  }))

  const ctx: SummaryContext = {
    view: data.view,
    compareBy,
    variableName: data.variable?.name ?? "",
    unit: data.unit,
    locationName: data.locationName,
    climateName: data.climateName,
    scenarioName: data.scenarioName,
  }

  const yLabel = data.view === "cv" ? "CV" : data.unit
  const hasMembers = data.members.length > 0

  // Dev-only (NEXT_PUBLIC_PERF_LOG=1): approximate when the explorer chart
  // hits the screen for the current members/variable/view combination.
  usePerfPaintMark(
    "paint:explorer-chart",
    hasMembers,
    `${data.members.map((m) => m.id).join(",")}|${data.variable?.name ?? ""}|${data.view}`,
  )

  let chart: React.ReactNode = null
  if (!hasMembers) {
    chart = (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: CHART_HEIGHT,
          color: theme.palette.grey[600],
        }}
      >
        <Typography variant="body2">
          Nothing to compare yet. Pick members in the controls above.
        </Typography>
      </Box>
    )
  } else if (data.view === "cv" || data.view === "value") {
    chart = (
      <CategoricalBarChart
        bars={toBars(data.members, memberColors)}
        yAxisLabel={yLabel}
        formatValue={fmt}
      />
    )
  } else if (distKind === "stats") {
    // Side-by-side summary statistics of the selected quantity view: mean
    // and CV everywhere, plus the linear level trend (ft/yr) on the
    // groundwater level view.
    const statPanels = [
      {
        key: "mean",
        title: `Mean (${data.unit})`,
        yLabel: data.unit,
        format: fmt,
        valueOf: (m: (typeof data.members)[number]) => m.stats.mean,
      },
      {
        key: "cv",
        title: "CV",
        yLabel: "CV",
        format: (v: number) => v.toFixed(2),
        valueOf: (m: (typeof data.members)[number]) => m.stats.cv,
      },
      ...(data.view === "level"
        ? [
            {
              key: "trend",
              title: "Trend (ft/yr)",
              yLabel: "ft/yr",
              format: (v: number) => formatValue(v, "ft/yr"),
              valueOf: (m: (typeof data.members)[number]) =>
                linearTrendPerYear(m.series),
            },
          ]
        : []),
    ]
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
              bars={data.members.map((m, i) => ({
                id: m.id,
                label: m.label,
                value: panel.valueOf(m),
                color: memberColors[i],
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
        boxes={toBoxes(data.members, memberColors)}
        whiskers="p10p90"
        yAxisLabel={yLabel}
        formatValue={fmt}
      />
    )
  } else {
    chart = (
      <ExceedanceChart
        series={toSeries(data.members, memberColors)}
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
        <SaveSnapshotButton
          disabled={!share.canSnapshot}
          onClick={share.onSaveSnapshot}
        />
      </Box>

      {/* Interpretive summary sentence */}
      {hasMembers && (
        <Typography
          variant="body2"
          sx={{ mb: 1.5, color: theme.palette.text.primary, lineHeight: 1.5 }}
        >
          {summarySentence(summaryMembers, ctx)}
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
            </Box>
          ))}
        </Box>
      )}

      {/* Provenance note */}
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
          ? "Live data from api.coeqwal.org (CalSim3 post-processed annual series)."
          : `Sample data (${MOCK_YEARS} simulated years, seeded): illustrative structure that mimics CalSim3 post-processed output, not model results.`}
      </Typography>
    </Box>
  )
}
