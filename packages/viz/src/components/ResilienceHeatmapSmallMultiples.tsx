"use client"

/**
 * ResilienceHeatmapSmallMultiples
 *
 * Trellis wrapper for the ResilienceHeatmap. Renders a responsive grid
 * of mini heatmap tiles, each sharing the same rows, columns, palette,
 * and color scale. One shared legend is drawn once at the bottom of the
 * grid; per-tile legends are suppressed (see `hideLegend` on
 * ResilienceHeatmap).
 *
 * The component is layout-only — all D3 work happens inside each
 * ResilienceHeatmap tile, so the anti-flicker rules carry through
 * unchanged.
 *
 * Tile sizing: a `tileAspect` prop ("wide" | "tall") chooses the
 * nominal height per tile. The grid auto-fits to the container width
 * with a configurable minimum tile width.
 */

import React, { useMemo } from "react"
import ResilienceHeatmap, {
  type ResilienceAxisItem,
  type ResilienceCellRender,
  type ResilienceGlyphEntry,
  type ResilienceHeatmapCell,
  type ResilienceHeatmapPalette,
} from "./ResilienceHeatmap"

export type ResilienceSmallMultiplesTileAspect = "wide" | "tall"

export interface ResilienceSmallMultiplesTile {
  /** Stable unique id (scenario id, outcome code, etc.). */
  id: string
  /** Tile title, drawn above the heatmap. */
  title: string
  /** Optional subtitle (e.g. short description). */
  subtitle?: string
  /** Cells for this tile. rowKey / colKey must match the shared axes. */
  cells: ResilienceHeatmapCell[]
}

export interface ResilienceHeatmapSmallMultiplesProps {
  /** Shared Y axis across all tiles. */
  rows: ResilienceAxisItem[]
  /** Shared X axis across all tiles. */
  columns: ResilienceAxisItem[]
  /** Tiles to render. Each provides its own `cells`. */
  tiles: ResilienceSmallMultiplesTile[]
  tierColors: readonly [string, string, string, string]
  tierLabels: readonly [string, string, string, string]
  palette: ResilienceHeatmapPalette
  cellRender?: ResilienceCellRender
  showCellNumbers?: boolean
  /** Chooses a portrait vs. landscape tile height. */
  tileAspect?: ResilienceSmallMultiplesTileAspect
  /** Minimum tile width in px; grid auto-fits into columns based on this. */
  minTileWidth?: number
  /** Maximum columns in the grid. Defaults to 4. */
  maxColumns?: number
  /** Emitted when the hovered cell in any tile changes. */
  onCellHover?: (cell: ResilienceHeatmapCell | null) => void
  /** Emitted when a cell is clicked. */
  onCellClick?: (cell: ResilienceHeatmapCell) => void
  /** Formatter passed to each tile. */
  formatRowTick?: (row: ResilienceAxisItem) => string
  /** Distribution sub-mode plumbed down to each tile. */
  distributionMode?: "scenario" | "location"
  /** Per-tile per-square hover (distribution encoding only). */
  onSquareHover?: (
    info: {
      tileId: string
      cell: ResilienceHeatmapCell
      entry: ResilienceGlyphEntry
    } | null,
  ) => void
  /** Per-tile per-square click (distribution encoding only). */
  onSquareClick?: (info: {
    tileId: string
    cell: ResilienceHeatmapCell
    entry: ResilienceGlyphEntry
  }) => void
}

/**
 * A compact, inline SVG replica of the tier legend used by
 * ResilienceHeatmap. Rendered once at the bottom of the small-multiples
 * grid so every tile can hide its own legend.
 */
function SharedTierLegend({
  tierColors,
  tierLabels,
  palette,
}: {
  tierColors: readonly [string, string, string, string]
  tierLabels: readonly [string, string, string, string]
  palette: ResilienceHeatmapPalette
}) {
  const entryW = 92
  const unavailOx = tierColors.length * entryW + 8
  const totalW = unavailOx + 140
  return (
    <svg
      width={totalW}
      height={28}
      role="img"
      aria-label="Tier legend"
      style={{ overflow: "visible" }}
    >
      {tierColors.map((color, i) => (
        <g key={i} transform={`translate(${i * entryW}, 0)`}>
          <rect x={0} y={6} width={14} height={14} rx={2} fill={color} />
          <text
            x={20}
            y={17}
            fontSize={11}
            fill={palette.textMuted}
          >
            {tierLabels[i] ?? ""}
          </text>
        </g>
      ))}
      <g transform={`translate(${unavailOx}, 0)`}>
        <rect
          x={0}
          y={6}
          width={14}
          height={14}
          rx={2}
          fill={palette.unavailableFill}
          stroke={palette.unavailableStroke}
          strokeWidth={1}
        />
        <text
          x={20}
          y={17}
          fontSize={11}
          fill={palette.textMuted}
        >
          Insufficient coverage
        </text>
      </g>
    </svg>
  )
}

const ResilienceHeatmapSmallMultiples: React.FC<
  ResilienceHeatmapSmallMultiplesProps
> = React.memo(
  ({
    rows,
    columns,
    tiles,
    tierColors,
    tierLabels,
    palette,
    cellRender = "tier",
    showCellNumbers = false,
    tileAspect = "wide",
    minTileWidth = 360,
    maxColumns = 4,
    onCellHover,
    onCellClick,
    formatRowTick,
    distributionMode,
    onSquareHover,
    onSquareClick,
  }) => {
    const tileHeight = useMemo(() => {
      if (tileAspect === "tall") {
        // Tall tiles: scenarios on Y (up to 24 rows). Scale with row count
        // so 24-row tiles still breathe, but cap it so 6-row tiles aren't
        // absurdly stubby.
        const perRow = 16
        const chrome = 96 // top margin + x-axis labels
        return Math.max(320, chrome + rows.length * perRow)
      }
      // Wide tiles: outcomes on Y (19 rows). More uniform height.
      return 360
    }, [tileAspect, rows.length])

    // Compute a display column count the CSS grid can respect. We let
    // auto-fit handle the actual responsive behavior, but clamp the max.
    const gridTemplate = useMemo(
      () =>
        `repeat(auto-fit, minmax(${minTileWidth}px, 1fr))`,
      [minTileWidth],
    )

    if (tiles.length === 0) {
      return null
    }

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          minHeight: 0,
          gap: 12,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: gridTemplate,
            gap: 16,
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            // Enforce a soft cap on columns via max-width.
            maxWidth: `${maxColumns * 560}px`,
            alignContent: "start",
          }}
        >
          {tiles.map((tile) => (
            <div
              key={tile.id}
              style={{
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                minHeight: tileHeight,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  padding: "0 4px 4px",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: palette.text,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={tile.title}
                >
                  {tile.title}
                </span>
                {tile.subtitle && (
                  <span
                    style={{
                      fontSize: 11,
                      color: palette.textMuted,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {tile.subtitle}
                  </span>
                )}
              </div>
              <div style={{ flex: 1, minHeight: tileHeight - 24 }}>
                <ResilienceHeatmap
                  rows={rows}
                  columns={columns}
                  cells={tile.cells}
                  tierColors={tierColors}
                  tierLabels={tierLabels}
                  palette={palette}
                  cellRender={cellRender}
                  showCellNumbers={showCellNumbers}
                  hideLegend
                  onCellHover={onCellHover}
                  onCellClick={onCellClick}
                  formatRowTick={formatRowTick}
                  distributionMode={distributionMode}
                  onSquareHover={
                    onSquareHover
                      ? (info) =>
                          onSquareHover(
                            info ? { tileId: tile.id, ...info } : null,
                          )
                      : undefined
                  }
                  onSquareClick={
                    onSquareClick
                      ? (info) => onSquareClick({ tileId: tile.id, ...info })
                      : undefined
                  }
                />
              </div>
            </div>
          ))}
        </div>

        {/* One shared legend at the bottom of the trellis. */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            padding: "4px 4px 0",
          }}
        >
          <SharedTierLegend
            tierColors={tierColors}
            tierLabels={tierLabels}
            palette={palette}
          />
        </div>
      </div>
    )
  },
)

ResilienceHeatmapSmallMultiples.displayName = "ResilienceHeatmapSmallMultiples"

export default ResilienceHeatmapSmallMultiples
