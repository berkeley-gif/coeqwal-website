"use client"

/**
 * ShareResilienceLiveChart
 *
 * Small aggregate-view heatmap thumbnail rendered from live tier data
 * when the share item has no cached PNG. URLs cannot carry the full
 * rasterized resilience chart, so the card falls back to a live
 * re-render scoped to the item's scenarios / outcomes / hydroclimates.
 *
 * Trade-off: regardless of the original view (scenario, outcome,
 * hydroclimate small-multiples, or aggregate), this component always
 * draws the aggregate reduction over the item's scenario scope so a
 * single compact viz can stand in for every resilience capture. The
 * card header and subtitle still describe what was actually captured,
 * so the thumbnail is a visual summary rather than a pixel-perfect
 * replay. Quadrant captures fall back to the text-only placeholder in
 * the parent card (no live render is attempted here).
 *
 * Uses `cellRender="tier"` for the thumbnail because alternate
 * encodings (delta, density_opp, leverage, distribution) require
 * additional controller state (baselines, modes, distribution mode)
 * that aren't round-tripped through the share URL today.
 */

import React, { useMemo } from "react"
import { Box, useTheme } from "@repo/ui/mui"
import {
  ResilienceHeatmap,
  type ResilienceAxisItem,
  type ResilienceHeatmapCell,
} from "@repo/viz"
import { useResilienceAggregate } from "../hooks/useResilienceAggregate"
import {
  RESILIENCE_HYDROCLIMATES,
  type ResilienceHydroclimate,
} from "../hooks/useResilienceMatrix"
import { useResilienceHeatmapTheme } from "../hooks/useResilienceHeatmapTheme"
import {
  OUTCOME_CODE_ORDER,
  NOD_SOD_OUTCOME_CODES,
  getOutcomeName,
  getOutcomeDefinition,
  type OutcomeCode,
} from "../../../content/outcomes"
import { HYDROCLIMATE_SHORT_LABELS } from "../../../content/scenarios"

export interface ShareResilienceLiveChartProps {
  scenarioIds: string[]
  outcomeCodes: string[]
  hydroclimates: string[]
  /** Optional fixed height; width follows the container. */
  height?: number
}

/** Aligned with share radar thumbnail: full card width and ~square visual weight. */
const DEFAULT_HEIGHT = 312

function hydroclimateLabel(hc: string): string {
  return HYDROCLIMATE_SHORT_LABELS[hc] ?? hc
}

/**
 * Restrict outcomes to the known display order so the thumbnail
 * reads the same way as the main panel regardless of the order the
 * URL encoded them in.
 */
function orderOutcomes(codes: string[]): string[] {
  const known = new Set(codes)
  const ordered: string[] = []
  for (const code of OUTCOME_CODE_ORDER) {
    if (known.has(code)) ordered.push(code)
  }
  for (const code of NOD_SOD_OUTCOME_CODES) {
    if (known.has(code)) ordered.push(code)
  }
  for (const code of codes) {
    if (!ordered.includes(code)) ordered.push(code)
  }
  return ordered
}

function orderHydroclimates(hcs: string[]): ResilienceHydroclimate[] {
  const known = new Set(hcs)
  const ordered: ResilienceHydroclimate[] = []
  for (const hc of RESILIENCE_HYDROCLIMATES) {
    if (known.has(hc)) ordered.push(hc)
  }
  return ordered
}

export default function ShareResilienceLiveChart({
  scenarioIds,
  outcomeCodes,
  hydroclimates,
  height = DEFAULT_HEIGHT,
}: ShareResilienceLiveChartProps) {
  const theme = useTheme()
  const { tierColors, tierLabels, palette } = useResilienceHeatmapTheme()

  const orderedOutcomes = useMemo(
    () => orderOutcomes(outcomeCodes),
    [outcomeCodes],
  )
  const orderedHydroclimates = useMemo(
    () => orderHydroclimates(hydroclimates),
    [hydroclimates],
  )

  const { cells, isLoading, error, matrix } = useResilienceAggregate({
    groupBy: "scenarios",
    scenarioIds,
    outcomeCodes: orderedOutcomes,
    hydroclimates: orderedHydroclimates,
  })

  const rows = useMemo<ResilienceAxisItem[]>(
    () =>
      orderedOutcomes.map((code) => ({
        key: code,
        label: getOutcomeName(code),
        fullLabel: getOutcomeName(code),
        definitionTooltip: getOutcomeDefinition(code as OutcomeCode),
      })),
    [orderedOutcomes],
  )

  const columns = useMemo<ResilienceAxisItem[]>(
    () =>
      orderedHydroclimates.map((hc) => ({
        key: hc,
        label: hydroclimateLabel(hc),
        fullLabel: hydroclimateLabel(hc),
      })),
    [orderedHydroclimates],
  )

  const heatmapCells = useMemo<ResilienceHeatmapCell[]>(() => {
    const out: ResilienceHeatmapCell[] = []
    for (const row of rows) {
      for (const col of columns) {
        const agg = cells[row.key]?.[col.key]
        const available = !!agg && agg.availableCount > 0
        out.push({
          rowKey: row.key,
          colKey: col.key,
          continuousValue: available ? (agg!.mean ?? null) : null,
          tierLevel:
            available && agg!.mean != null
              ? Math.min(4, Math.max(1, Math.round(agg!.mean)))
              : null,
          available,
          rowLabel: row.label,
          colLabel: col.label,
          subjectLabel: `${scenarioIds.length || "All"} scenarios`,
          outcomeCode: row.key,
          hydroclimate: col.key,
          unavailableReason: available ? undefined : "No data in scope",
        })
      }
    }
    return out
  }, [rows, columns, cells, scenarioIds.length])

  const showLoading =
    isLoading && matrix.scenarioIds.length === 0 && !error

  if (showLoading) {
    return (
      <Box
        sx={{
          mt: 1,
          minHeight: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.palette.grey[500],
          fontSize: "0.75rem",
          border: `1px dashed ${theme.palette.divider}`,
          borderRadius: "4px",
        }}
      >
        Loading heatmap...
      </Box>
    )
  }

  if (error || rows.length === 0 || columns.length === 0) {
    return (
      <Box
        sx={{
          mt: 1,
          minHeight: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.palette.grey[500],
          fontSize: "0.75rem",
          border: `1px dashed ${theme.palette.divider}`,
          borderRadius: "4px",
        }}
      >
        Heatmap unavailable
      </Box>
    )
  }

  return (
    <Box
      sx={{
        mt: 1,
        borderRadius: "4px",
        backgroundColor: theme.palette.common.white,
        border: `1px solid ${theme.palette.divider}`,
        overflow: "hidden",
      }}
    >
      <Box sx={{ width: "100%", height, pointerEvents: "none" }}>
        <ResilienceHeatmap
          rows={rows}
          columns={columns}
          cells={heatmapCells}
          tierColors={tierColors}
          tierLabels={tierLabels}
          palette={palette}
          cellRender="tier"
          showCellNumbers={false}
          responsive
          hideLegend
        />
      </Box>
    </Box>
  )
}
