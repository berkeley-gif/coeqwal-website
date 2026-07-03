"use client"

/**
 * ChartCard - the explorer's main panel: an interpretive summary sentence, the
 * view-appropriate @repo/viz chart, a color legend, and the data-source label.
 *
 * The chart is chosen from the current view and distribution style:
 *  - annual distribution / percent of capacity -> ExceedanceChart or BoxPlot
 *  - year-to-year variability / summary value  -> CategoricalBarChart
 * Series colors follow member order via the shared @repo/viz palette, so the
 * legend swatches match the chart. Every card is labeled "Sample data" while
 * the explorer runs on the deterministic sample-data engine.
 */

import React from "react"
import { Box, Chip, Tooltip, Typography, useTheme } from "@repo/ui/mui"
import {
  BoxPlot,
  CategoricalBarChart,
  ExceedanceChart,
  getSeriesColor,
  type BoxPlotDatum,
  type CategoricalBarDatum,
  type ExceedanceSeries,
} from "@repo/viz"
import { useDataSlice } from "../../../../store"
import { useVariableData } from "../hooks/useVariableData"
import {
  formatValue,
  summarySentence,
  type SummaryContext,
  type SummaryMember,
} from "../hooks/interpretiveText"
import { MOCK_YEARS, toExceedancePoints } from "../config/mockDataEngine"

const CHART_HEIGHT = 340

export default function ChartCard() {
  const theme = useTheme()
  const { compareBy, distKind } = useDataSlice()
  const data = useVariableData()

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

  let chart: React.ReactNode = null
  if (!hasMembers) {
    chart = (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: CHART_HEIGHT,
          color: theme.palette.text.secondary,
        }}
      >
        <Typography variant="body2">
          Nothing to compare yet. Pick members in the controls above.
        </Typography>
      </Box>
    )
  } else if (data.view === "cv" || data.view === "value") {
    const bars: CategoricalBarDatum[] = data.members.map((m) => ({
      id: m.id,
      label: m.label,
      value: m.value,
    }))
    chart = (
      <CategoricalBarChart bars={bars} yAxisLabel={yLabel} formatValue={fmt} />
    )
  } else if (distKind === "box") {
    const boxes: BoxPlotDatum[] = data.members.map((m) => ({
      id: m.id,
      label: m.label,
      stats: {
        min: m.stats.min,
        q1: m.stats.p25,
        median: m.stats.p50,
        q3: m.stats.p75,
        max: m.stats.max,
        mean: m.stats.mean,
        p10: m.stats.p10,
        p90: m.stats.p90,
      },
    }))
    chart = (
      <BoxPlot
        boxes={boxes}
        whiskers="p10p90"
        yAxisLabel={yLabel}
        formatValue={fmt}
      />
    )
  } else {
    const series: ExceedanceSeries[] = data.members.map((m) => ({
      id: m.id,
      label: m.label,
      points: toExceedancePoints(m.series),
    }))
    chart = (
      <ExceedanceChart series={series} yAxisLabel={yLabel} formatValue={fmt} />
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
          label="Sample data"
          sx={{
            backgroundColor: theme.palette.grey[100],
            color: theme.palette.text.secondary,
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

      {/* Chart */}
      <Box sx={{ width: "100%", height: CHART_HEIGHT }}>{chart}</Box>

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
                  backgroundColor: getSeriesColor(i),
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
                    color: theme.palette.text.secondary,
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
          color: theme.palette.text.disabled,
          fontStyle: "italic",
        }}
      >
        Sample data ({MOCK_YEARS} simulated years, seeded): illustrative
        structure that mimics CalSim3 post-processed output, not model results.
      </Typography>
    </Box>
  )
}
