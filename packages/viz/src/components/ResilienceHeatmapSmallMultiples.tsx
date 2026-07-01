"use client"

/**
 * ResilienceHeatmapSmallMultiples
 *
 * Trellis wrapper for the ResilienceHeatmap. Renders a responsive grid
 * of mini heatmap tiles, each sharing the same rows, columns, palette,
 * and color scale. One shared legend is drawn once at the bottom of the
 * grid. Per-tile legends are suppressed (see `hideLegend` on
 * ResilienceHeatmap).
 *
 * The component is layout-only. All D3 work happens inside each
 * ResilienceHeatmap tile, so the anti-flicker rules carry through
 * unchanged.
 *
 * Tile sizing: a `tileAspect` prop ("wide" | "tall") chooses the
 * nominal height per tile. The grid auto-fits to the container width
 * with a configurable minimum tile width.
 */

import React, { useMemo } from "react"
import ResilienceHeatmap, {
  RESILIENCE_HEATMAP_LEFT_GUTTER,
  type ResilienceAxisItem,
  type ResilienceCellRender,
  type ResilienceGlyphEntry,
  type ResilienceHeatmapCell,
  type ResilienceHeatmapPalette,
} from "./ResilienceHeatmap"

export type ResilienceSmallMultiplesTileAspect = "wide" | "tall"

/**
 * Column count used by the small-multiples grid in capture mode.
 * Exported so external height-calculation helpers stay in sync with
 * the layout the component actually renders.
 */
export const RESILIENCE_SMALL_MULTIPLES_CAPTURE_COLUMNS = 2

/**
 * Per-tile height (in CSS pixels) used by the small-multiples grid.
 * Exported so callers laying out the grid in a fixed-size off-screen
 * host (capture path) can compute a content-aware total height that
 * matches the live grid's row pitch exactly.
 */
export function getResilienceSmallMultiplesTileHeight(
  tileAspect: ResilienceSmallMultiplesTileAspect,
  rowsCount: number,
): number {
  if (tileAspect === "tall") {
    const perRow = 16
    const chrome = 88
    return Math.max(300, chrome + rowsCount * perRow)
  }
  return 340
}

export interface ResilienceSmallMultiplesTile {
  /** Stable unique id (scenario id, outcome code, etc.). */
  id: string
  /** Tile title, drawn above the heatmap. */
  title: string
  /** Optional subtitle (e.g. short description). */
  subtitle?: string
  /** Longer text for the native `title` tooltip on the title line. */
  titleTooltip?: string
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
  /**
   * Reconfigure the grid for off-screen SVG capture. When true:
   *  - the column count is pinned to
   *    `RESILIENCE_SMALL_MULTIPLES_CAPTURE_COLUMNS` (2) instead of
   *    the responsive auto-fit, so the snapshot layout is
   *    deterministic regardless of the off-screen host width;
   *  - the scroll container is dropped so every tile lays out at
   *    full content height (the live grid's overflowY: auto would
   *    otherwise clip tiles below the host height);
   *  - each tile's title is rendered as an inline `<svg><text>`
   *    instead of an HTML `<span>` so the SVG composer (which only
   *    walks `<svg>` elements) picks the title up.
   *
   * Live mounts leave this off so the responsive grid, scroll, CSS
   * ellipsis on long titles, and the native `title` tooltip
   * continue to work.
   */
  captureMode?: boolean
  /** Emitted when the hovered cell in any tile changes. */
  onCellHover?: (cell: ResilienceHeatmapCell | null) => void
  /** Emitted when the pointer enters or leaves a tile title (tile id = scenario id in by-scenario view). */
  onTileHover?: (tileId: string | null) => void
  /** Tile ids to keep at full opacity; other tiles dim when the set is non-empty. */
  highlightedTileIds?: Set<string> | null
  /** Row keys to emphasize within each tile heatmap (sidebar → chart). */
  highlightedRowKeys?: Set<string> | null
  /** Column keys to emphasize within each tile heatmap (sidebar → chart). */
  highlightedColKeys?: Set<string> | null
  onRowKeyHover?: (rowKey: string | null) => void
  onColKeyHover?: (colKey: string | null) => void
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
  /**
   * Optional renderer for per-tile header actions (e.g. a share icon).
   * The consumer is responsible for stopping event propagation if the
   * surrounding tile has its own click handler.
   */
  renderTileActions?: (tile: ResilienceSmallMultiplesTile) => React.ReactNode
  /**
   * Callback ref forwarded to the first tile's heatmap so a consumer
   * can anchor a tour popper (or other overlay) on an actual cell.
   * Only the first tile wires this up. Subsequent tiles receive
   * `undefined` so the ref isn't overwritten.
   */
  firstCellRef?: (el: SVGRectElement | null) => void
  /** Passed through to each tile heatmap; see `ResilienceHeatmap`. */
  columnLabelRotation?: number
}

/** Vertical space for React tile title row (padding + one line + actions). */
const TILE_HEADER_RESERVE = 48

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
          <text x={20} y={17} fontSize={11} fill={palette.textMuted}>
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
        <text x={20} y={17} fontSize={11} fill={palette.textMuted}>
          Insufficient coverage
        </text>
      </g>
    </svg>
  )
}

const ResilienceHeatmapSmallMultiples: React.FC<ResilienceHeatmapSmallMultiplesProps> =
  React.memo(
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
      captureMode = false,
      onCellHover,
      onTileHover,
      highlightedTileIds = null,
      highlightedRowKeys = null,
      highlightedColKeys = null,
      onRowKeyHover,
      onColKeyHover,
      onCellClick,
      formatRowTick,
      distributionMode,
      onSquareHover,
      onSquareClick,
      renderTileActions,
      firstCellRef,
      columnLabelRotation = 0,
    }) => {
      const tileHeight = useMemo(
        // Tall tiles (scenarios on Y, up to 24 rows): scale with row
        // count so 24-row tiles still breathe, but cap so 6-row tiles
        // aren't absurdly stubby. The chrome accounts for the React
        // tile header plus the inner chart margins (top pad +
        // hydroclimate label band above the plot + bottom pad).
        // Wide tiles (outcomes on Y, 19 rows) are uniform height.
        () => getResilienceSmallMultiplesTileHeight(tileAspect, rows.length),
        [tileAspect, rows.length],
      )

      // Live grid: auto-fit responsiveness clamped by maxColumns. Capture
      // grid: a fixed column count so the snapshot layout is deterministic
      // and not dependent on the off-screen host's width.
      const gridTemplate = useMemo(
        () =>
          captureMode
            ? `repeat(${RESILIENCE_SMALL_MULTIPLES_CAPTURE_COLUMNS}, 1fr)`
            : `repeat(auto-fit, minmax(${minTileWidth}px, 1fr))`,
        [minTileWidth, captureMode],
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
            // Live mode: grid scrolls inside the panel and claims the
            // parent's full height. Capture mode: grid lays out at
            // full content height so every tile lands in the
            // rasterized output.
            height: captureMode ? "auto" : "100%",
            minHeight: 0,
            gap: 12,
          }}
        >
          <style>{`
          .resilience-tile-action { opacity: 0.8; }
          .resilience-tile-action.is-active { opacity: 1; }
          .resilience-smt-tile:hover .resilience-tile-action,
          .resilience-smt-tile:focus-within .resilience-tile-action { opacity: 1; }
          .resilience-tile-action:hover { background-color: rgba(127,127,127,0.12); opacity: 1; }
          .resilience-tile-action:focus-visible { outline: 2px solid currentColor; outline-offset: 1px; opacity: 1; }
        `}</style>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: gridTemplate,
              gap: 16,
              flex: 1,
              minHeight: 0,
              overflowY: captureMode ? "visible" : "auto",
              overflowX: "hidden",
              // Live mode caps via max-width to avoid stretching the
              // tiles too wide on huge screens. Capture mode leaves the
              // grid free to fill the off-screen host width that the
              // caller chose deliberately.
              maxWidth: captureMode ? "none" : `${maxColumns * 560}px`,
              alignContent: "start",
            }}
          >
            {tiles.map((tile, tileIdx) => {
              const extraActions = renderTileActions?.(tile)
              const hasActions = extraActions != null
              const tileDimmed =
                highlightedTileIds != null &&
                highlightedTileIds.size > 0 &&
                !highlightedTileIds.has(tile.id)
              return (
                <div
                  key={tile.id}
                  className="resilience-smt-tile"
                  data-tile-id={tile.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    minHeight: tileHeight,
                    opacity: tileDimmed ? 0.45 : 1,
                    transition: "opacity 0.12s ease-out",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "0 4px 4px",
                      minHeight: 40,
                    }}
                    onMouseEnter={
                      onTileHover ? () => onTileHover(tile.id) : undefined
                    }
                    onMouseLeave={
                      onTileHover ? () => onTileHover(null) : undefined
                    }
                  >
                    {captureMode ? (
                      // Inline SVG so the off-screen SVG composer (which only
                      // collects `<svg>` elements) picks the title up. Live
                      // mounts use the HTML branch below for ellipsis,
                      // accessibility, and tooltip behavior.
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="100%"
                        height={36}
                        style={{ display: "block", flex: 1, minWidth: 0 }}
                        aria-hidden
                      >
                        <text
                          x={0}
                          y={tile.subtitle ? 14 : 22}
                          fontSize={13}
                          fontWeight={600}
                          fill={palette.text}
                        >
                          {tile.title}
                        </text>
                        {tile.subtitle && (
                          <text
                            x={0}
                            y={30}
                            fontSize={11}
                            fill={palette.textMuted}
                          >
                            {tile.subtitle}
                          </text>
                        )}
                      </svg>
                    ) : (
                      <>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: palette.text,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            flex: 1,
                            minWidth: 0,
                          }}
                          title={tile.titleTooltip ?? tile.title}
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
                      </>
                    )}
                    {hasActions && (
                      <div
                        className="resilience-tile-actions"
                        data-capture-exclude="true"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          flexShrink: 0,
                        }}
                      >
                        {extraActions}
                      </div>
                    )}
                  </div>
                  <div
                    data-resilience-tile-body="true"
                    style={{
                      flex: 1,
                      minHeight: tileHeight - TILE_HEADER_RESERVE,
                    }}
                  >
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
                      columnLabelRotation={columnLabelRotation}
                      onCellHover={onCellHover}
                      onCellClick={onCellClick}
                      highlightedRowKeys={highlightedRowKeys}
                      highlightedColKeys={highlightedColKeys}
                      onRowKeyHover={onRowKeyHover}
                      onColKeyHover={onColKeyHover}
                      formatRowTick={formatRowTick}
                      distributionMode={distributionMode}
                      firstCellRef={tileIdx === 0 ? firstCellRef : undefined}
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
                          ? (info) =>
                              onSquareClick({ tileId: tile.id, ...info })
                          : undefined
                      }
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* One shared legend at the bottom of the trellis. Left-padded
              by the tile's row-tick gutter so the legend's left edge
              lines up with the leftmost heatmap column across all
              tiles, rather than with the outer tile padding. */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              padding: `4px 4px 0 ${RESILIENCE_HEATMAP_LEFT_GUTTER}px`,
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
