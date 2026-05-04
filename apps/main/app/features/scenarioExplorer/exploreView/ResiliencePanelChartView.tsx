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
    }
  | {
      kind: "aggregate"
      rows: ResilienceAxisItem[]
      columns: ResilienceAxisItem[]
      cells: ResilienceHeatmapCell[]
      marginals?: ResilienceHeatmapMarginals | undefined
      showMarginals?: boolean
      highlightedRowKeys?: Set<string> | null | undefined
      columnLabelRotation?: number
    }

export interface ResiliencePanelChartViewHandlers {
  onCellHover?: (cell: ResilienceHeatmapCell | null) => void
  onCellClick?: (cell: ResilienceHeatmapCell) => void
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
        <Typography
          variant="body2"
          sx={{ textAlign: "center", maxWidth: 480 }}
        >
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
        onCellHover={handlers?.onCellHover}
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
