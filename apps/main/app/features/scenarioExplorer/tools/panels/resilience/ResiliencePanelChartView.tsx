"use client"

/**
 * Presentational view for the resilience panel's chart area. Renders
 * the empty states and either the small-multiples grid or the single
 * aggregate heatmap depending on the supplied `state`. The live
 * `ResiliencePanel` mounts this inside its motion.div for animation;
 * the off-screen capture mounts it directly in `OffscreenCaptureHost`
 * so toolbar shares produce the same chart at a fixed canvas size.
 *
 * The component is store-agnostic: every input it needs is on
 * `ResiliencePanelChartViewProps`. Handlers are optional so the
 * snapshot path can render the chart without interactive wiring.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import {
  ResilienceHeatmap,
  ResilienceHeatmapSmallMultiples,
  getResilienceSmallMultiplesTileHeight,
  RESILIENCE_SMALL_MULTIPLES_CAPTURE_COLUMNS,
  type ResilienceAxisItem,
  type ResilienceHeatmapCell,
  type ResilienceHeatmapMarginals,
  type ResilienceHeatmapPalette,
  type ResilienceCellRender,
  type ResilienceGlyphEntry,
  type ResilienceSmallMultiplesTile,
  type ResilienceSmallMultiplesTileAspect,
} from "@repo/viz"

export type ResiliencePanelChartViewState =
  | { kind: "noColumns" }
  | { kind: "noOutcomesSelected" }
  | {
      kind: "outcomeEmpty"
      eyebrow: string
      title: string
      body: string
    }
  | {
      kind: "smallMultiples"
      view: "scenario" | "outcome" | "hydroclimate"
      rows: ResilienceAxisItem[]
      columns: ResilienceAxisItem[]
      tiles: ResilienceSmallMultiplesTile[]
      tileAspect: ResilienceSmallMultiplesTileAspect
      columnLabelRotation?: number
      highlightedRowKeys?: Set<string> | null | undefined
      highlightedColKeys?: Set<string> | null | undefined
      highlightedTileIds?: Set<string> | null | undefined
    }
  | {
      kind: "aggregate"
      rows: ResilienceAxisItem[]
      columns: ResilienceAxisItem[]
      cells: ResilienceHeatmapCell[]
      marginals?: ResilienceHeatmapMarginals | undefined
      showMarginals?: boolean
      highlightedRowKeys?: Set<string> | null | undefined
      highlightedColKeys?: Set<string> | null | undefined
      highlightedTileIds?: Set<string> | null | undefined
      scenarioRowAxisHover?: boolean
      scenarioColAxisHover?: boolean
      columnLabelRotation?: number
    }

export interface ResiliencePanelChartViewHandlers {
  onCellHover?: (cell: ResilienceHeatmapCell | null) => void
  onCellClick?: (cell: ResilienceHeatmapCell) => void
  onTileHover?: (tileId: string | null) => void
  onRowKeyHover?: (rowKey: string | null) => void
  onColKeyHover?: (colKey: string | null) => void
  onSquareHover?: (
    info: { cell: ResilienceHeatmapCell; entry: ResilienceGlyphEntry } | null,
  ) => void
  onSquareClick?: (info: {
    cell: ResilienceHeatmapCell
    entry: ResilienceGlyphEntry
  }) => void
  renderTileActions?: (tile: ResilienceSmallMultiplesTile) => React.ReactNode
}

export interface ResiliencePanelChartViewProps {
  state: ResiliencePanelChartViewState
  tierColors: readonly [string, string, string, string]
  tierLabels: readonly [string, string, string, string]
  palette: ResilienceHeatmapPalette
  cellRender?: ResilienceCellRender
  showCellNumbers?: boolean
  formatRowTick?: (row: ResilienceAxisItem) => string
  distributionMode?: "scenario" | "location"
  handlers?: ResiliencePanelChartViewHandlers
  /**
   * When true, render the small-multiples grid for off-screen capture:
   * a fixed two-column layout, no scroll container, full content
   * height. Aggregate / single-heatmap views ignore this flag - they
   * already lay out at the host's fixed dims. Live mounts leave this
   * undefined so the responsive grid behaves as before.
   */
  captureMode?: boolean
}

/** Inter-tile gap (matches the live grid's `gap: 16`). */
const CAPTURE_GRID_GAP = 16
/** Outer padding around the grid in the capture canvas. */
const CAPTURE_OUTER_PADDING = 24

/**
 * Total height (in CSS pixels) the small-multiples grid will need in
 * capture mode for the given tile count, tile aspect, and row count.
 * The off-screen capture host sizes itself to this so the grid lays
 * out at full content height (no scroll, no clipping) and the composer
 * gathers every tile's bounding rect in the rendered output.
 *
 * Aggregate / single-heatmap captures do not call this; they keep the
 * fixed `CAPTURE_DIMENSIONS.resiliencePanel.height`.
 *
 * Reads `RESILIENCE_SMALL_MULTIPLES_CAPTURE_COLUMNS` from `@repo/viz`
 * so this height calc and the small-multiples grid layout cannot
 * drift out of sync.
 */
export function computeResiliencePanelSmallMultiplesCaptureHeight(args: {
  tilesCount: number
  tileAspect: ResilienceSmallMultiplesTileAspect
  rowsCount: number
}): number {
  const { tilesCount, tileAspect, rowsCount } = args
  if (tilesCount <= 0) return 0
  const tileH = getResilienceSmallMultiplesTileHeight(tileAspect, rowsCount)
  const gridRows = Math.ceil(
    tilesCount / RESILIENCE_SMALL_MULTIPLES_CAPTURE_COLUMNS,
  )
  const gridContent = gridRows * tileH + (gridRows - 1) * CAPTURE_GRID_GAP
  return gridContent + CAPTURE_OUTER_PADDING * 2
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
      }}
    >
      {children}
    </Box>
  )
}

function EmptyState({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string
  title: string
  body: string
}) {
  const theme = useTheme()
  return (
    <CenteredMessage>
      <Box sx={{ maxWidth: 480, textAlign: "center" }}>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: theme.palette.grey[700],
            mb: 1,
          }}
        >
          {eyebrow}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: 1,
          }}
        >
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.grey[700] }}>
          {body}
        </Typography>
      </Box>
    </CenteredMessage>
  )
}

export default function ResiliencePanelChartView({
  state,
  tierColors,
  tierLabels,
  palette,
  cellRender,
  showCellNumbers,
  formatRowTick,
  distributionMode,
  handlers,
  captureMode = false,
}: ResiliencePanelChartViewProps) {
  if (state.kind === "noColumns") {
    return (
      <CenteredMessage>
        <Typography variant="body2" color="text.secondary">
          Select at least one hydroclimate in the chart controls.
        </Typography>
      </CenteredMessage>
    )
  }

  if (state.kind === "noOutcomesSelected") {
    return (
      <CenteredMessage>
        <Typography variant="body2" sx={{ textAlign: "center", maxWidth: 480 }}>
          No outcome rows selected. Open &ldquo;choose outcome rows&rdquo; in
          the chart controls above to pick which outcomes to display.
        </Typography>
      </CenteredMessage>
    )
  }

  if (state.kind === "outcomeEmpty") {
    return (
      <EmptyState
        eyebrow={state.eyebrow}
        title={state.title}
        body={state.body}
      />
    )
  }

  if (state.kind === "smallMultiples") {
    const onSquareHover = handlers?.onSquareHover
    const onSquareClick = handlers?.onSquareClick
    return (
      <ResilienceHeatmapSmallMultiples
        rows={state.rows}
        columns={state.columns}
        tiles={state.tiles}
        tierColors={tierColors}
        tierLabels={tierLabels}
        palette={palette}
        cellRender={cellRender}
        showCellNumbers={showCellNumbers}
        tileAspect={state.tileAspect}
        columnLabelRotation={state.columnLabelRotation}
        captureMode={captureMode}
        onCellHover={handlers?.onCellHover}
        onTileHover={handlers?.onTileHover}
        highlightedTileIds={state.highlightedTileIds ?? null}
        highlightedRowKeys={state.highlightedRowKeys ?? null}
        highlightedColKeys={state.highlightedColKeys ?? null}
        onRowKeyHover={handlers?.onRowKeyHover}
        onColKeyHover={handlers?.onColKeyHover}
        onCellClick={handlers?.onCellClick}
        formatRowTick={formatRowTick}
        distributionMode={distributionMode}
        onSquareHover={
          onSquareHover
            ? (info) =>
                onSquareHover(
                  info ? { cell: info.cell, entry: info.entry } : null,
                )
            : undefined
        }
        onSquareClick={
          onSquareClick
            ? (info) => onSquareClick({ cell: info.cell, entry: info.entry })
            : undefined
        }
        renderTileActions={handlers?.renderTileActions}
      />
    )
  }

  return (
    <ResilienceHeatmap
      rows={state.rows}
      columns={state.columns}
      cells={state.cells}
      tierColors={tierColors}
      tierLabels={tierLabels}
      palette={palette}
      cellRender={cellRender}
      showCellNumbers={showCellNumbers}
      onCellHover={handlers?.onCellHover}
      onCellClick={handlers?.onCellClick}
      highlightedRowKeys={state.highlightedRowKeys ?? null}
      highlightedColKeys={state.highlightedColKeys ?? null}
      onRowKeyHover={
        state.scenarioRowAxisHover ? handlers?.onRowKeyHover : undefined
      }
      onColKeyHover={
        state.scenarioColAxisHover ? handlers?.onColKeyHover : undefined
      }
      formatRowTick={formatRowTick}
      marginals={state.marginals}
      showMarginals={state.showMarginals}
      distributionMode={distributionMode}
      onSquareHover={handlers?.onSquareHover}
      onSquareClick={handlers?.onSquareClick}
      columnLabelRotation={state.columnLabelRotation}
    />
  )
}
