"use client"

/**
 * ResilienceHeatmap
 *
 * D3 heatmap for the Scenario Explorer resilience tool.
 * X axis = hydroclimates, Y axis = outcomes or scenarios (driven by the
 * parent). Supports multiple cell-encoding modes:
 *   - "tier":         categorical tier fill + continuous value label.
 *   - "delta":        diverging fill around 0, signed value label.
 *   - "density_opp":  monochrome green ramp over fraction-acceptable (0..1).
 *   - "glyph":        sub-tile grid (one tile per scenario in distribution).
 *
 * Optional marginal strips summarize row/column means next to the grid.
 *
 * Color tokens and tier labels are injected by the parent so the viz
 * stays theme-agnostic; see ResiliencePanel for the wiring.
 *
 * Follows the @repo/viz hover-flicker rules:
 *  - Ref-based tooltip (no useState), two flavors: cell + axis label.
 *  - Debounced onCellHover via startTransition in the parent.
 *  - updateChart deps are minimal; callbacks live in refs.
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react"
import { scaleBand, interpolateRgb, select } from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"

export type ResilienceCellRender =
  | "tier"
  | "delta"
  | "density_opp"
  | "glyph"
  | "distribution"
  | "leverage"

export interface ResilienceAxisItem {
  key: string
  label: string
  /**
   * When `label` is shortened for layout, the native SVG `<title>` on the
   * tick can still show the full name (X-axis column ticks).
   */
  fullLabel?: string
  /** Shown in the axis-label tooltip (if provided). */
  definitionTooltip?: string
}

export interface ResilienceGlyphEntry {
  /** Tier level 1..4, or null for unavailable. */
  tierLevel: number | null
  /** Optional short label for sub-tile tooltips. */
  label?: string
  /** Scenario id, populated in distributionMode === "scenario". */
  scenarioId?: string
  /** LOI / location identifier, populated in distributionMode === "location". */
  loiId?: string
  /** Human-readable location name for the tooltip (location mode). */
  locationName?: string
  /** Continuous tier value for the tooltip (e.g. mean across scope). */
  tierValue?: number
}

export interface ResilienceHeatmapCell {
  rowKey: string
  colKey: string
  /** Arithmetic mean of LOI tier levels (e.g. 2.3) or single-value tier. */
  continuousValue: number | null
  /** Rounded tier (1-4). null if unavailable. */
  tierLevel: number | null
  available: boolean
  unavailableReason?: string
  /** Copy for the cell tooltip. */
  rowLabel: string
  colLabel: string
  subjectLabel: string
  /** Opaque passthrough for onClick handlers (e.g. scenarioId / outcomeCode). */
  scenarioId?: string
  outcomeCode?: string
  /**
   * Hydroclimate slice this cell represents, when the cell is pinned to a
   * single hydroclimate. Populated by the parent so click handlers can
   * route the map to the matching climate variant without re-deriving it
   * from `rowKey` / `colKey`. Left undefined when the axis the cell sits
   * on is not a hydroclimate (e.g. aggregateOver === "hydroclimates").
   */
  hydroclimate?: string
  /** Distinguishes aggregate outcome cells from single-value / NOD-SOD cells. */
  type?: "single_value" | "multi_value" | "nod_sod"
  /** Signed delta value (tier units); used when cellRender === "delta". */
  divergingValue?: number | null
  /** Fraction 0..1; used when cellRender === "density_opp". */
  densityValue?: number | null
  /** Per-scenario tier values; used when cellRender === "glyph". */
  distribution?: ReadonlyArray<ResilienceGlyphEntry>
  /**
   * Tier range (0..3) across sibling operations at this hydroclimate.
   * Used when cellRender === "leverage".
   */
  leverageValue?: number | null
  /** Optional override for the tooltip "value" line. */
  valueTooltipOverride?: string
}

/**
 * Neutral / chrome colors consumed by the heatmap. The parent should
 * derive these from the app theme so the component stays theme-agnostic.
 */
export interface ResilienceHeatmapPalette {
  /** Axis-label and default text color. */
  text: string
  /** Secondary / legend text color. */
  textMuted: string
  /** Hover outline color applied to the focused cell. */
  hoverStroke: string
  /** Text color painted on top of tier 1 / tier 2 (dark) swatches. */
  onDarkTier: string
  /** Text color painted on top of tier 3 / tier 4 (light) swatches. */
  onLightTier: string
  /** Fill behind the diagonal hatch for unavailable cells. */
  unavailableFill: string
  /** Border stroke for unavailable cells and their legend swatch. */
  unavailableStroke: string
  /** Hatch stroke color for unavailable cells. */
  unavailableHatch: string
  /** Color used for the dotted underline on axis labels with tooltips. */
  axisHintUnderline: string
  /** Tooltip surface background. */
  tooltipBg: string
  /** Tooltip border. */
  tooltipBorder: string
  /** Tooltip shadow (CSS box-shadow value). */
  tooltipShadow: string
  /** Diverging scale anchors for cellRender="delta" (-3 .. 0 .. +3 tiers). */
  divergingNegStrong: string
  divergingNegWeak: string
  divergingZero: string
  divergingPosWeak: string
  divergingPosStrong: string
  /** Monochrome ramp anchors for density_opp (0% .. 100%). */
  densityOppMin: string
  densityOppMax: string
  /** Monochrome ramp anchors for leverage (0 .. 3 tier range). */
  leverageMin: string
  leverageMax: string
}

export interface ResilienceHeatmapMarginals {
  /** One mean per row, in row order. null = no data. */
  row?: ReadonlyArray<number | null>
  /** One mean per column, in column order. null = no data. */
  col?: ReadonlyArray<number | null>
}

export interface ResilienceHeatmapProps {
  rows: ResilienceAxisItem[]
  columns: ResilienceAxisItem[]
  cells: ResilienceHeatmapCell[]
  /** Tier colors (tier1..tier4) pulled from the app theme. */
  tierColors: readonly [string, string, string, string]
  /** Tier labels for the legend (e.g. ["Optimal", "Acceptable", "At-risk", "Critical"]). */
  tierLabels: readonly [string, string, string, string]
  /** Neutral / chrome colors from the parent theme. */
  palette: ResilienceHeatmapPalette
  /** How each cell is filled and labeled. Defaults to "tier". */
  cellRender?: ResilienceCellRender
  /** Print the continuous value inside each cell. */
  showCellNumbers?: boolean
  responsive?: boolean
  width?: number
  height?: number
  onCellHover?: (cell: ResilienceHeatmapCell | null) => void
  onCellClick?: (cell: ResilienceHeatmapCell) => void
  /**
   * Sub-mode for cellRender === "distribution". Controls sort + tooltip
   * copy, and routes per-square hover/click to different callbacks in the
   * parent (sidebar highlight vs map highlight).
   */
  distributionMode?: "scenario" | "location"
  /** Per-square hover inside a distribution cell. */
  onSquareHover?: (
    info: { cell: ResilienceHeatmapCell; entry: ResilienceGlyphEntry } | null,
  ) => void
  /** Per-square click inside a distribution cell. */
  onSquareClick?: (info: {
    cell: ResilienceHeatmapCell
    entry: ResilienceGlyphEntry
  }) => void
  /** Sidebar-hover highlighted scenarios; dims non-matching rows/cells. */
  highlightedRowKeys?: Set<string> | null
  /** Row key label formatter override (e.g. regional indent for NOD/SOD). */
  formatRowTick?: (row: ResilienceAxisItem) => string
  /** Optional row/col means for marginal strips. */
  marginals?: ResilienceHeatmapMarginals
  /** Whether to render marginal strips when `marginals` is provided. */
  showMarginals?: boolean
  /**
   * Hide the internal legend strip. Used by the small-multiples wrapper
   * which renders one shared legend outside the tile grid. When true, the
   * component also reclaims the vertical space that the legend would have
   * consumed.
   */
  hideLegend?: boolean
  /**
   * Optional grouped column header drawn above the per-column tick
   * labels. Each group is labelled with `label` and spans the next
   * `span` columns (in `columns` order). Spans must sum to
   * `columns.length`. When supplied, the x-axis area is extended to
   * fit a second header line with a subtle rule underneath each group.
   */
  columnGroups?: ResilienceColumnGroup[]
  /**
   * Callback ref invoked with the first rendered cell's DOM node so a
   * consumer can anchor a tour popper (or any other overlay) on an
   * actual tile rather than the entire chart wrapper. Fires with
   * `null` when the chart re-renders and before the new first cell is
   * available, so consumers should treat it like any callback ref.
   */
  firstCellRef?: (el: SVGRectElement | null) => void
  /**
   * When set (e.g. -90), column tick labels are rotated around the tick
   * anchor so dense scenario codes do not overlap. Use with hydroclimate
   * small-multiples (scenarios on X).
   */
  columnLabelRotation?: number
}

export interface ResilienceColumnGroup {
  key: string
  label: string
  span: number
}

// Hydroclimate (column) labels render ABOVE the plot, so the top
// margin owns the x-axis label band plus an optional column-group
// header; the bottom margin is just a small pad plus (when present)
// the shared tier legend. Left margin is sized for outcome row ticks;
// right margin is a small pad unless a row marginal strip needs room
// (extraRight is added dynamically).
const MARGIN = { top: 16, right: 16, bottom: 16, left: 168 }
/**
 * Horizontal gutter between the tile's left edge and the first column
 * of cells. Exported so the small-multiples wrapper can align its
 * shared legend (and any other tile-level chrome) to the leftmost
 * column across all tiles without re-deriving the band geometry.
 */
export const RESILIENCE_HEATMAP_LEFT_GUTTER = MARGIN.left
const MARGINAL_BAND = 22
const MARGINAL_GAP = 6
const LEGEND_HEIGHT = 48
const COLUMN_GROUP_BAND = 24
// Reserve between the plot top and the nearest hydroclimate tick
// label. Must cover `tickY` (18 within the x-axis group) plus enough
// ascender space for text at font-size 11 without clipping.
const X_AXIS_LABEL_RESERVE = 32
/** Extra top band when column tick labels are rotated (e.g. scenario codes). */
const X_AXIS_LABEL_RESERVE_ROTATED = 58
const HATCH_ID = "resilience-unavailable-hatch"

/**
 * Truncate end-aligned y-axis tick text so it fits in the left margin.
 * Preserves a leading space indent (e.g. NOD / SOD rows). Returns
 * whether the string was shortened so the caller can add a native
 * `<title>` with the full label.
 */
function truncateResilienceYAxisTick(
  textEl: SVGTextElement,
  maxWidth: number,
): boolean {
  if (textEl.getComputedTextLength() <= maxWidth) return false
  const full = textEl.textContent ?? ""
  const m = /^( +)/.exec(full)
  const prefix = m?.[1] ?? ""
  let rest = full.slice(prefix.length)
  for (;;) {
    textEl.textContent = prefix + rest + "…"
    if (textEl.getComputedTextLength() <= maxWidth) {
      return true
    }
    if (rest.length === 0) {
      return true
    }
    rest = rest.slice(0, -1)
  }
}

function clampTier(value: number): 1 | 2 | 3 | 4 {
  return Math.min(4, Math.max(1, Math.round(value))) as 1 | 2 | 3 | 4
}

function defaultRowTick(row: ResilienceAxisItem): string {
  return row.label
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

/**
 * Piecewise-linear interpolation across 5 diverging anchors. Input value
 * is a tier delta; domain clamps to [-3, +3].
 */
function divergingColor(
  value: number,
  palette: ResilienceHeatmapPalette,
): string {
  const v = clamp(value, -3, 3)
  if (v <= -1.5) {
    const t = (v + 3) / 1.5 // 0 at -3 (negStrong) -> 1 at -1.5 (negWeak)
    return interpolateRgb(
      palette.divergingNegStrong,
      palette.divergingNegWeak,
    )(t)
  }
  if (v < 0) {
    const t = (v + 1.5) / 1.5 // 0 at -1.5 -> 1 at 0
    return interpolateRgb(palette.divergingNegWeak, palette.divergingZero)(t)
  }
  if (v <= 1.5) {
    const t = v / 1.5 // 0 at 0 -> 1 at +1.5
    return interpolateRgb(palette.divergingZero, palette.divergingPosWeak)(t)
  }
  const t = (v - 1.5) / 1.5 // 0 at +1.5 -> 1 at +3
  return interpolateRgb(palette.divergingPosWeak, palette.divergingPosStrong)(t)
}

function densityOppColor(
  fraction: number,
  palette: ResilienceHeatmapPalette,
): string {
  const t = clamp(fraction, 0, 1)
  return interpolateRgb(palette.densityOppMin, palette.densityOppMax)(t)
}

/**
 * Monochromatic ramp over a tier range value (0..3). Input values above 3
 * clamp to the ramp endpoint.
 */
function leverageColor(
  value: number,
  palette: ResilienceHeatmapPalette,
): string {
  const t = clamp(value / 3, 0, 1)
  return interpolateRgb(palette.leverageMin, palette.leverageMax)(t)
}

function formatDelta(value: number): string {
  const rounded = Math.abs(value) < 0.05 ? 0 : value
  if (rounded === 0) return "0"
  const sign = rounded > 0 ? "+" : "−"
  return `${sign}${Math.abs(rounded).toFixed(1)}`
}

function formatPercent(fraction: number): string {
  return `${Math.round(clamp(fraction, 0, 1) * 100)}%`
}

function formatLeverage(value: number): string {
  if (value < 0.05) return "0"
  return value.toFixed(1)
}

const ResilienceHeatmap: React.FC<ResilienceHeatmapProps> = React.memo(
  ({
    rows,
    columns,
    cells,
    tierColors,
    tierLabels,
    palette,
    cellRender = "tier",
    showCellNumbers = true,
    responsive = true,
    width = 700,
    height = 500,
    onCellHover,
    onCellClick,
    distributionMode = "scenario",
    onSquareHover,
    onSquareClick,
    highlightedRowKeys = null,
    formatRowTick = defaultRowTick,
    marginals,
    showMarginals = false,
    hideLegend = false,
    columnGroups,
    firstCellRef,
    columnLabelRotation = 0,
  }) => {
    const svgRef = useRef<SVGSVGElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const cellTooltipRef = useRef<HTMLDivElement | null>(null)
    const axisTooltipRef = useRef<HTMLDivElement | null>(null)

    const dimensions = useResizeObserver(
      containerRef as React.RefObject<HTMLElement>,
    )
    const [currentWidth, setCurrentWidth] = useState(width)
    const [currentHeight, setCurrentHeight] = useState(height)

    const onCellHoverRef = useRef(onCellHover)
    useEffect(() => {
      onCellHoverRef.current = onCellHover
    }, [onCellHover])

    // Stash the firstCellRef callback in a ref so `updateChart` can
    // invoke it after it re-renders the cells without having to list
    // the callback in its dep array (which would thrash the draw on
    // every parent render that produced a new ref function).
    const firstCellRefCb = useRef(firstCellRef)
    useEffect(() => {
      firstCellRefCb.current = firstCellRef
    }, [firstCellRef])

    const onCellClickRef = useRef(onCellClick)
    useEffect(() => {
      onCellClickRef.current = onCellClick
    }, [onCellClick])

    const onSquareHoverRef = useRef(onSquareHover)
    useEffect(() => {
      onSquareHoverRef.current = onSquareHover
    }, [onSquareHover])

    const onSquareClickRef = useRef(onSquareClick)
    useEffect(() => {
      onSquareClickRef.current = onSquareClick
    }, [onSquareClick])

    const formatRowTickRef = useRef(formatRowTick)
    useEffect(() => {
      formatRowTickRef.current = formatRowTick
    }, [formatRowTick])

    useEffect(() => {
      if (responsive && dimensions.width > 0 && dimensions.height > 0) {
        setCurrentWidth(dimensions.width)
        setCurrentHeight(dimensions.height)
      } else if (!responsive) {
        setCurrentWidth(width)
        setCurrentHeight(height)
      }
    }, [dimensions, responsive, width, height])

    const cellIndex = useMemo(() => {
      const idx = new Map<string, ResilienceHeatmapCell>()
      for (const c of cells) {
        idx.set(`${c.rowKey}|${c.colKey}`, c)
      }
      return idx
    }, [cells])

    const [tier1, tier2, tier3, tier4] = tierColors
    const colorScale = useCallback(
      (tier: number) => {
        const t = clampTier(tier)
        if (t === 1) return tier1
        if (t === 2) return tier2
        if (t === 3) return tier3
        return tier4
      },
      [tier1, tier2, tier3, tier4],
    )

    const onDarkTier = palette.onDarkTier
    const onLightTier = palette.onLightTier
    const tierTextColor = useCallback(
      (tierLevel: number) => (tierLevel <= 2 ? onDarkTier : onLightTier),
      [onDarkTier, onLightTier],
    )

    // Primitives used inside updateChart; destructured so the memo dep
    // signature stays stable when palette object identity changes.
    const {
      text: paletteText,
      textMuted: paletteTextMuted,
      hoverStroke: paletteHoverStroke,
      unavailableFill: paletteUnavailFill,
      unavailableStroke: paletteUnavailStroke,
      unavailableHatch: paletteUnavailHatch,
      axisHintUnderline: paletteAxisHint,
    } = palette

    // Resolve the primary fill + inner-label text for a cell under the
    // active cellRender mode. Returns null fill when the cell should be
    // rendered as unavailable (hatch pattern).
    const resolveCellFill = useCallback(
      (
        cell: ResilienceHeatmapCell,
      ): { fill: string | null; text: string | null; textColor: string } => {
        if (!cell.available) {
          return { fill: null, text: null, textColor: paletteTextMuted }
        }

        if (cellRender === "delta") {
          const dv = cell.divergingValue
          if (dv == null) {
            return { fill: null, text: null, textColor: paletteTextMuted }
          }
          const fill = divergingColor(dv, palette)
          const text = formatDelta(dv)
          // Dark anchors only at large magnitudes; use dark-on-light for mid,
          // light-on-dark at the extremes.
          const absDv = Math.abs(dv)
          const textColor = absDv >= 2 ? onDarkTier : onLightTier
          return { fill, text, textColor }
        }

        if (cellRender === "density_opp") {
          const dv = cell.densityValue ?? 0
          const fill = densityOppColor(dv, palette)
          const text = formatPercent(dv)
          const textColor = dv >= 0.6 ? onDarkTier : onLightTier
          return { fill, text, textColor }
        }

        if (cellRender === "leverage") {
          const lv = cell.leverageValue
          if (lv == null) {
            return { fill: null, text: null, textColor: paletteTextMuted }
          }
          const fill = leverageColor(lv, palette)
          const text = formatLeverage(lv)
          const textColor = lv / 3 >= 0.55 ? onDarkTier : onLightTier
          return { fill, text, textColor }
        }

        // "distribution" uses a neutral backdrop (stacked tier bars are
        // drawn on top later). Suppress the numeric inside-cell label.
        if (cellRender === "distribution") {
          return {
            fill: palette.tooltipBg, // common white, neutral canvas
            text: null,
            textColor: paletteTextMuted,
          }
        }

        // "tier" and "glyph" share the tier-color basis (glyph paints
        // sub-tiles over this, but we still want an average fill to peek
        // through for sparse / degraded layouts).
        if (cell.tierLevel == null) {
          return { fill: null, text: null, textColor: paletteTextMuted }
        }
        const fill = colorScale(cell.tierLevel)
        const textColor = tierTextColor(cell.tierLevel)
        const continuousLabel =
          cell.continuousValue == null
            ? String(cell.tierLevel)
            : cell.type === "single_value" ||
                cell.tierLevel === cell.continuousValue
              ? String(cell.tierLevel)
              : cell.continuousValue.toFixed(1)
        return { fill, text: continuousLabel, textColor }
      },
      [
        cellRender,
        colorScale,
        tierTextColor,
        palette,
        paletteTextMuted,
        onDarkTier,
        onLightTier,
      ],
    )

    // Imperative tooltip helpers (refs only, no React state).
    const positionCellTooltip = useCallback((event: MouseEvent) => {
      const el = cellTooltipRef.current
      const container = containerRef.current
      if (!el || !container) return
      const rect = container.getBoundingClientRect()
      el.style.left = `${event.clientX - rect.left + 12}px`
      el.style.top = `${event.clientY - rect.top + 12}px`
    }, [])

    const showCellTooltip = useCallback(
      (event: MouseEvent, cell: ResilienceHeatmapCell) => {
        const el = cellTooltipRef.current
        if (!el) return

        let valueText: string
        if (cell.valueTooltipOverride) {
          valueText = cell.valueTooltipOverride
        } else if (!cell.available) {
          valueText = cell.unavailableReason ?? "No data"
        } else if (cellRender === "delta" && cell.divergingValue != null) {
          valueText = `Δ tier ${formatDelta(cell.divergingValue)}`
        } else if (cellRender === "density_opp" && cell.densityValue != null) {
          valueText = `${formatPercent(cell.densityValue)} at Tier 2 or better`
        } else if (cellRender === "leverage" && cell.leverageValue != null) {
          valueText = `Operational leverage ${formatLeverage(cell.leverageValue)} tiers`
        } else if (
          cellRender === "distribution" &&
          cell.distribution &&
          cell.distribution.length > 0
        ) {
          const counts: [number, number, number, number] = [0, 0, 0, 0]
          for (const entry of cell.distribution) {
            const t = entry.tierLevel
            if (t != null && t >= 1 && t <= 4) counts[t - 1]! += 1
          }
          const total = counts.reduce((a, b) => a + b, 0)
          const parts = counts
            .map((c, i) => {
              if (c === 0) return null
              const pct = Math.round((c / total) * 100)
              return `Tier ${i + 1}: ${c} (${pct}%)`
            })
            .filter((s): s is string => s != null)
          valueText = parts.length > 0 ? parts.join(" · ") : "No data"
        } else if (cell.tierLevel != null) {
          valueText = `Tier ${cell.tierLevel}${
            cell.continuousValue != null &&
            cell.type !== "single_value" &&
            cell.tierLevel !== cell.continuousValue
              ? ` (${cell.continuousValue.toFixed(2)})`
              : ""
          }`
        } else {
          valueText = cell.unavailableReason ?? "No data"
        }

        el.innerHTML = `
          <div style="font-weight:600;color:${paletteText}">${escapeHtml(cell.subjectLabel)}</div>
          <div style="color:${paletteText}">${escapeHtml(cell.rowLabel)}</div>
          <div style="color:${paletteTextMuted}">${escapeHtml(cell.colLabel)}</div>
          <div style="margin-top:4px;color:${paletteText};font-weight:500">${escapeHtml(valueText)}</div>
        `
        el.style.display = "block"
        positionCellTooltip(event)
      },
      [positionCellTooltip, paletteText, paletteTextMuted, cellRender],
    )

    const hideCellTooltip = useCallback(() => {
      const el = cellTooltipRef.current
      if (el) el.style.display = "none"
    }, [])

    // Per-square tooltip used when hovering an individual rounded square
    // inside a distribution cell. Branches copy by distributionMode.
    const showSquareTooltip = useCallback(
      (
        event: MouseEvent,
        cell: ResilienceHeatmapCell,
        entry: ResilienceGlyphEntry,
      ) => {
        const el = cellTooltipRef.current
        if (!el) return

        const tierLevel = entry.tierLevel
        const tierText =
          tierLevel != null
            ? `Tier ${tierLevel}${
                entry.tierValue != null && entry.tierValue !== tierLevel
                  ? ` (${entry.tierValue.toFixed(2)})`
                  : ""
              }`
            : "No data"

        let subjectLine = ""
        if (distributionMode === "location") {
          subjectLine = entry.locationName ?? entry.loiId ?? "Location"
        } else {
          subjectLine = entry.label ?? entry.scenarioId ?? cell.subjectLabel
        }

        el.innerHTML = `
          <div style="font-weight:600;color:${paletteText}">${escapeHtml(subjectLine)}</div>
          <div style="color:${paletteText}">${escapeHtml(cell.rowLabel)}</div>
          <div style="color:${paletteTextMuted}">${escapeHtml(cell.colLabel)}</div>
          <div style="margin-top:4px;color:${paletteText};font-weight:500">${escapeHtml(tierText)}</div>
        `
        el.style.display = "block"
        positionCellTooltip(event)
      },
      [positionCellTooltip, paletteText, paletteTextMuted, distributionMode],
    )

    const positionAxisTooltip = useCallback((event: MouseEvent) => {
      const el = axisTooltipRef.current
      const container = containerRef.current
      if (!el || !container) return
      const rect = container.getBoundingClientRect()
      el.style.left = `${event.clientX - rect.left + 12}px`
      el.style.top = `${event.clientY - rect.top + 12}px`
    }, [])

    const showAxisTooltip = useCallback(
      (event: MouseEvent, item: ResilienceAxisItem) => {
        const el = axisTooltipRef.current
        if (!el || !item.definitionTooltip) return
        const headline = item.fullLabel ?? item.label
        el.innerHTML = `
          <div style="font-weight:600;color:${paletteText};margin-bottom:4px">${escapeHtml(headline)}</div>
          <div style="color:${paletteText}">${escapeHtml(item.definitionTooltip)}</div>
        `
        el.style.display = "block"
        positionAxisTooltip(event)
      },
      [positionAxisTooltip, paletteText],
    )

    const hideAxisTooltip = useCallback(() => {
      const el = axisTooltipRef.current
      if (el) el.style.display = "none"
    }, [])

    // Marginal strip primitives captured once from palette for deps.
    const marginalRow = marginals?.row
    const marginalCol = marginals?.col
    const showMarginalRowStrip =
      showMarginals && !!marginalRow && marginalRow.length > 0
    const showMarginalColStrip =
      showMarginals && !!marginalCol && marginalCol.length > 0

    const updateChart = useCallback(
      (w: number, h: number) => {
        if (!svgRef.current) return
        const svg = select(svgRef.current)
        svg.selectAll("*").remove()
        if (rows.length === 0 || columns.length === 0 || w <= 0 || h <= 0) {
          return
        }

        // Reserve extra space for marginal strips when shown.
        const extraRight = showMarginalRowStrip
          ? MARGINAL_BAND + MARGINAL_GAP
          : 0
        const extraBottom = showMarginalColStrip
          ? MARGINAL_BAND + MARGINAL_GAP
          : 0

        // Hydroclimate labels live above the plot, so the top margin
        // grows by X_AXIS_LABEL_RESERVE (plus the grouped-column header
        // band, when columnGroups is set). The bottom margin holds the
        // legend (when !hideLegend) plus a small base pad.
        const hasColumnGroups = !!columnGroups && columnGroups.length > 0
        const groupBand = hasColumnGroups ? COLUMN_GROUP_BAND : 0
        const xAxisLabelReserve =
          columnLabelRotation !== 0
            ? X_AXIS_LABEL_RESERVE_ROTATED
            : X_AXIS_LABEL_RESERVE
        const effectiveMarginTop = MARGIN.top + xAxisLabelReserve + groupBand
        const effectiveMarginBottom =
          MARGIN.bottom + (hideLegend ? 0 : LEGEND_HEIGHT)

        const innerW = w - MARGIN.left - MARGIN.right - extraRight
        const innerH =
          h - effectiveMarginTop - effectiveMarginBottom - extraBottom
        if (innerW <= 0 || innerH <= 0) return

        // Diagonal-hatch pattern for unavailable cells.
        const defs = svg.append("defs")
        const pattern = defs
          .append("pattern")
          .attr("id", HATCH_ID)
          .attr("patternUnits", "userSpaceOnUse")
          .attr("width", 6)
          .attr("height", 6)
          .attr("patternTransform", "rotate(45)")
        pattern
          .append("rect")
          .attr("width", 6)
          .attr("height", 6)
          .attr("fill", paletteUnavailFill)
        pattern
          .append("line")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 0)
          .attr("y2", 6)
          .attr("stroke", paletteUnavailHatch)
          .attr("stroke-width", 1)

        const g = svg
          .append("g")
          .attr("transform", `translate(${MARGIN.left},${effectiveMarginTop})`)

        const xScale = scaleBand<string>()
          .domain(columns.map((c) => c.key))
          .range([0, innerW])
          .padding(0.08)

        const yScale = scaleBand<string>()
          .domain(rows.map((r) => r.key))
          .range([0, innerH])
          .padding(0.08)

        const bandW = xScale.bandwidth()
        const bandH = yScale.bandwidth()

        const rowOpacity = (rowKey: string) => {
          if (!highlightedRowKeys || highlightedRowKeys.size === 0) return 1
          return highlightedRowKeys.has(rowKey) ? 1 : 0.35
        }

        // Cells
        let firstCellEl: SVGRectElement | null = null
        rows.forEach((row) => {
          const y = yScale(row.key) ?? 0
          const opacity = rowOpacity(row.key)

          columns.forEach((col) => {
            const cell = cellIndex.get(`${row.key}|${col.key}`)
            if (!cell) return
            const x = xScale(col.key) ?? 0

            const resolved = resolveCellFill(cell)

            const rect = g
              .append("rect")
              .attr("class", "resilience-cell")
              .attr("data-row", row.key)
              .attr("data-col", col.key)
              .attr("x", x)
              .attr("y", y)
              .attr("width", bandW)
              .attr("height", bandH)
              .attr("rx", 2)
              .attr("stroke", "transparent")
              .attr("stroke-width", 2)
              .attr("cursor", onCellClick ? "pointer" : "default")

            if (!firstCellEl) {
              firstCellEl = rect.node() as SVGRectElement | null
            }

            if (cell.available && resolved.fill) {
              rect.attr("fill", resolved.fill).attr("fill-opacity", opacity)
            } else {
              rect
                .attr("fill", `url(#${HATCH_ID})`)
                .attr("stroke", paletteUnavailStroke)
                .attr("stroke-width", 1)
                .attr("fill-opacity", opacity)
            }

            // Distribution overlay: a grid of rounded squares, one per
            // distribution entry (e.g. one per scenario in aggregate view),
            // colored by that entry's tier. Matches the "distribution"
            // mode of MorphableDistributionGlyph used in the get-started
            // key-outcomes animated sequence. Scales with cell size.
            if (
              cellRender === "distribution" &&
              cell.available &&
              cell.distribution &&
              cell.distribution.length > 0
            ) {
              // Group ascending by tier so greens fill first row-by-row.
              // Entries without a tier sort last and paint in the
              // unavailable grey so readers see a contiguous "no data" tail.
              const sorted = [...cell.distribution].sort((a, b) => {
                const av = a.tierLevel ?? 5
                const bv = b.tierLevel ?? 5
                return av - bv
              })
              const total = sorted.length
              const hPad = 3
              const vPad = 3
              const innerGridW = bandW - hPad * 2
              const innerGridH = bandH - vPad * 2
              // Target 10 cols like the key-outcomes glyph, but don't
              // create empty columns when total < 10.
              const cols = Math.max(1, Math.min(10, total))
              const rows = Math.max(1, Math.ceil(total / cols))
              // gap ≈ 20% of square size. Solve for square size so the
              // grid fits both innerGridW and innerGridH:
              //   w: s * (cols + 0.2*(cols-1)) = innerGridW
              //   h: s * (rows + 0.2*(rows-1)) = innerGridH
              const sW = innerGridW / (1.2 * cols - 0.2)
              const sH = innerGridH / (1.2 * rows - 0.2)
              const squareSize = Math.min(sW, sH)
              if (squareSize >= 2 && innerGridW >= 6 && innerGridH >= 6) {
                const gap = Math.max(0.5, squareSize * 0.2)
                const corner = Math.max(1, squareSize * 0.2)
                const stride = squareSize + gap
                const gridW = cols * stride - gap
                const gridH = rows * stride - gap
                const gx = x + hPad + (innerGridW - gridW) / 2
                const gy = y + vPad + (innerGridH - gridH) / 2
                const interactive =
                  !!onSquareHoverRef.current || !!onSquareClickRef.current
                sorted.forEach((entry, i) => {
                  const col = i % cols
                  const rowIdx = Math.floor(i / cols)
                  const t = entry.tierLevel
                  const fill =
                    t != null && t >= 1 && t <= 4
                      ? (tierColors[t - 1] ?? paletteUnavailFill)
                      : paletteUnavailFill
                  const sq = g
                    .append("rect")
                    .attr("x", gx + col * stride)
                    .attr("y", gy + rowIdx * stride)
                    .attr("width", squareSize)
                    .attr("height", squareSize)
                    .attr("rx", corner)
                    .attr("ry", corner)
                    .attr("fill", fill)
                    .attr("fill-opacity", opacity * 0.9)
                    .attr("stroke", "transparent")
                    .attr("stroke-width", 1)

                  if (interactive) {
                    sq.attr(
                      "cursor",
                      onSquareClickRef.current ? "pointer" : "default",
                    )
                      .attr("pointer-events", "all")
                      .on("mouseenter", function (event: MouseEvent) {
                        event.stopPropagation()
                        select(this)
                          .attr("stroke", paletteHoverStroke)
                          .attr("stroke-width", 1.5)
                        showSquareTooltip(event, cell, entry)
                        onSquareHoverRef.current?.({ cell, entry })
                      })
                      .on("mousemove", function (event: MouseEvent) {
                        event.stopPropagation()
                        positionCellTooltip(event)
                      })
                      .on("mouseleave", function (event: MouseEvent) {
                        event.stopPropagation()
                        select(this).attr("stroke", "transparent")
                        hideCellTooltip()
                        onSquareHoverRef.current?.(null)
                      })
                      .on("click", function (event: MouseEvent) {
                        event.stopPropagation()
                        onSquareClickRef.current?.({ cell, entry })
                      })
                  } else {
                    sq.attr("pointer-events", "none")
                  }
                })
              }
            }

            // Glyph overlay: sub-tiles inside the cell, one per scenario.
            // Degrades to the base fill when the cell is too small.
            if (
              cellRender === "glyph" &&
              cell.available &&
              cell.distribution &&
              cell.distribution.length > 0
            ) {
              const n = cell.distribution.length
              const cols = Math.max(1, Math.ceil(Math.sqrt(n)))
              const gridRows = Math.max(1, Math.ceil(n / cols))
              const pad = 1
              const innerCellW = bandW - pad * 2
              const innerCellH = bandH - pad * 2
              const subW = innerCellW / cols
              const subH = innerCellH / gridRows
              const minSub = Math.min(subW, subH)
              if (minSub >= 3) {
                // Sort ascending by tier so dissent reads as a gradient.
                const sorted = [...cell.distribution].sort((a, b) => {
                  const av = a.tierLevel ?? 5 // unavailable sort last
                  const bv = b.tierLevel ?? 5
                  return av - bv
                })
                sorted.forEach((entry, i) => {
                  const col = i % cols
                  const rowIdx = Math.floor(i / cols)
                  const sx = x + pad + col * subW
                  const sy = y + pad + rowIdx * subH
                  g.append("rect")
                    .attr("x", sx)
                    .attr("y", sy)
                    .attr("width", Math.max(1, subW - 0.5))
                    .attr("height", Math.max(1, subH - 0.5))
                    .attr(
                      "fill",
                      entry.tierLevel != null
                        ? colorScale(entry.tierLevel)
                        : paletteUnavailFill,
                    )
                    .attr("fill-opacity", opacity)
                    .attr("pointer-events", "none")
                })
              }
            }

            rect
              .on("mouseenter", function (event: MouseEvent) {
                select(this)
                  .attr("stroke", paletteHoverStroke)
                  .attr("stroke-width", 2)
                showCellTooltip(event, cell)
                onCellHoverRef.current?.(cell)
              })
              .on("mousemove", function (event: MouseEvent) {
                positionCellTooltip(event)
              })
              .on("mouseleave", function () {
                if (cell.available) {
                  select(this).attr("stroke", "transparent")
                } else {
                  select(this).attr("stroke", paletteUnavailStroke)
                }
                hideCellTooltip()
                onCellHoverRef.current?.(null)
              })
              .on("click", () => {
                if (cell.available) onCellClickRef.current?.(cell)
              })

            // Print inner value when enabled + the cell has enough room.
            // Glyph and distribution modes suppress the inner number
            // (the sub-tiles / stacked bars carry the information).
            // The size floor keeps small tiles (dense layouts) labeled
            // too, with an 8px font-size floor so the text stays
            // legible when the cell would otherwise drive the font
            // below readability.
            if (
              showCellNumbers &&
              cellRender !== "glyph" &&
              cellRender !== "distribution" &&
              cell.available &&
              resolved.text != null &&
              bandW > 22 &&
              bandH > 14
            ) {
              g.append("text")
                .attr("x", x + bandW / 2)
                .attr("y", y + bandH / 2)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .attr(
                  "font-size",
                  Math.max(8, Math.min(Math.min(bandW, bandH) * 0.36, 14)),
                )
                .attr("font-weight", 600)
                .attr("fill", resolved.textColor)
                .attr("fill-opacity", opacity)
                .attr("pointer-events", "none")
                .text(resolved.text)
            }
          })
        })

        // Expose the first rendered cell to the consumer (used by the
        // resilience tour to anchor its "what is a cell" popper on an
        // actual tile). Fires with `null` first to let the consumer
        // drop references to the previous draw's cell before the new
        // one is attached.
        firstCellRefCb.current?.(null)
        firstCellRefCb.current?.(firstCellEl)

        // Marginal strips (row-summary on the right, col-summary below).
        if (showMarginalRowStrip && marginalRow) {
          const stripX = innerW + MARGINAL_GAP
          rows.forEach((row, i) => {
            const y = yScale(row.key) ?? 0
            const val = marginalRow[i] ?? null
            const rect = g
              .append("rect")
              .attr("x", stripX)
              .attr("y", y)
              .attr("width", MARGINAL_BAND)
              .attr("height", bandH)
              .attr("rx", 2)

            if (val == null) {
              rect
                .attr("fill", paletteUnavailFill)
                .attr("stroke", paletteUnavailStroke)
                .attr("stroke-width", 1)
            } else {
              // Use the active encoding's color semantics for marginals.
              let fill: string
              if (cellRender === "delta") {
                fill = divergingColor(val, palette)
              } else if (cellRender === "density_opp") {
                fill = densityOppColor(val, palette)
              } else if (cellRender === "leverage") {
                fill = leverageColor(val, palette)
              } else {
                fill = colorScale(val)
              }
              rect.attr("fill", fill)

              if (showCellNumbers && bandH > 14) {
                const label =
                  cellRender === "delta"
                    ? formatDelta(val)
                    : cellRender === "density_opp"
                      ? formatPercent(val)
                      : cellRender === "leverage"
                        ? formatLeverage(val)
                        : val.toFixed(1)
                g.append("text")
                  .attr("x", stripX + MARGINAL_BAND / 2)
                  .attr("y", y + bandH / 2)
                  .attr("text-anchor", "middle")
                  .attr("dominant-baseline", "central")
                  .attr("font-size", 10)
                  .attr("font-weight", 600)
                  .attr(
                    "fill",
                    cellRender === "tier" ||
                      cellRender === "glyph" ||
                      cellRender === "distribution"
                      ? tierTextColor(val)
                      : paletteText,
                  )
                  .attr("pointer-events", "none")
                  .text(label)
              }
            }
          })

          // "mean" annotation on top of the strip.
          g.append("text")
            .attr("x", stripX + MARGINAL_BAND / 2)
            .attr("y", -4)
            .attr("text-anchor", "middle")
            .attr("font-size", 9)
            .attr("font-weight", 600)
            .attr("fill", paletteTextMuted)
            .text("mean")
        }

        if (showMarginalColStrip && marginalCol) {
          const stripY = innerH + MARGINAL_GAP
          columns.forEach((col, i) => {
            const x = xScale(col.key) ?? 0
            const val = marginalCol[i] ?? null
            const rect = g
              .append("rect")
              .attr("x", x)
              .attr("y", stripY)
              .attr("width", bandW)
              .attr("height", MARGINAL_BAND)
              .attr("rx", 2)

            if (val == null) {
              rect
                .attr("fill", paletteUnavailFill)
                .attr("stroke", paletteUnavailStroke)
                .attr("stroke-width", 1)
            } else {
              let fill: string
              if (cellRender === "delta") {
                fill = divergingColor(val, palette)
              } else if (cellRender === "density_opp") {
                fill = densityOppColor(val, palette)
              } else if (cellRender === "leverage") {
                fill = leverageColor(val, palette)
              } else {
                fill = colorScale(val)
              }
              rect.attr("fill", fill)

              if (showCellNumbers && bandW > 24) {
                const label =
                  cellRender === "delta"
                    ? formatDelta(val)
                    : cellRender === "density_opp"
                      ? formatPercent(val)
                      : cellRender === "leverage"
                        ? formatLeverage(val)
                        : val.toFixed(1)
                g.append("text")
                  .attr("x", x + bandW / 2)
                  .attr("y", stripY + MARGINAL_BAND / 2)
                  .attr("text-anchor", "middle")
                  .attr("dominant-baseline", "central")
                  .attr("font-size", 10)
                  .attr("font-weight", 600)
                  .attr(
                    "fill",
                    cellRender === "tier" ||
                      cellRender === "glyph" ||
                      cellRender === "distribution"
                      ? tierTextColor(val)
                      : paletteText,
                  )
                  .attr("pointer-events", "none")
                  .text(label)
              }
            }
          })

          g.append("text")
            .attr("x", -6)
            .attr("y", stripY + MARGINAL_BAND / 2)
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "central")
            .attr("font-size", 9)
            .attr("font-weight", 600)
            .attr("fill", paletteTextMuted)
            .text("mean")
        }

        // Y axis (rows)
        const yAxis = g.append("g").attr("class", "resilience-y-axis")
        const yAxisTickMaxW = MARGIN.left - 16
        rows.forEach((row) => {
          const y = (yScale(row.key) ?? 0) + bandH / 2
          const label = formatRowTickRef.current(row)

          const node = yAxis
            .append("text")
            .attr("x", -12)
            .attr("y", y)
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "central")
            .attr("font-size", 11)
            .attr("font-weight", 500)
            .attr("fill", paletteText)
            .attr(
              "style",
              row.definitionTooltip
                ? `cursor: help; text-decoration: underline dotted ${paletteAxisHint};`
                : null,
            )
            .text(label)

          const textEl = node.node()
          if (textEl) {
            const truncated = truncateResilienceYAxisTick(textEl, yAxisTickMaxW)
            const wantNativeTitle =
              truncated ||
              (row.fullLabel != null && row.fullLabel.trim() !== label.trim())
            if (wantNativeTitle) {
              node.append("title").text(row.fullLabel ?? label)
            }
          }

          if (row.definitionTooltip) {
            node
              .on("mouseenter", function (event: MouseEvent) {
                showAxisTooltip(event, row)
              })
              .on("mousemove", function (event: MouseEvent) {
                positionAxisTooltip(event)
              })
              .on("mouseleave", hideAxisTooltip)
          }
        })

        // X axis (hydroclimates) — rendered ABOVE the plot. The xAxis
        // group's local origin sits X_AXIS_LABEL_RESERVE (plus the
        // grouped-header band, when present) above the plot top, so
        // existing relative y offsets (tickY=18, group text y=14, rule
        // y=30) land naturally above the plot with enough padding.
        const xAxisY = -(xAxisLabelReserve + groupBand)
        const xAxis = g
          .append("g")
          .attr("class", "resilience-x-axis")
          .attr("transform", `translate(0,${xAxisY})`)
        // Per-column tick labels (hydroclimate names). When column
        // groups are present the ticks sit below the group band so the
        // reading order top-down is group → rule → tick → plot.
        const tickY = hasColumnGroups ? 18 + COLUMN_GROUP_BAND : 18
        columns.forEach((col) => {
          const cx = (xScale(col.key) ?? 0) + bandW / 2
          const node = xAxis
            .append("text")
            .attr("x", cx)
            .attr("y", tickY)
            .attr("text-anchor", "middle")
            .attr(
              "dominant-baseline",
              columnLabelRotation !== 0 ? "middle" : "hanging",
            )
            .attr("font-size", 11)
            .attr("font-weight", 600)
            .attr("fill", paletteText)
            .attr(
              "style",
              col.definitionTooltip
                ? `cursor: help; text-decoration: underline dotted ${paletteAxisHint};`
                : null,
            )
            .text(col.label)

          if (columnLabelRotation !== 0) {
            node.attr(
              "transform",
              `rotate(${columnLabelRotation}, ${cx}, ${tickY})`,
            )
          }

          if (col.fullLabel && col.fullLabel !== col.label) {
            node.append("title").text(col.fullLabel)
          }

          if (col.definitionTooltip) {
            node
              .on("mouseenter", function (event: MouseEvent) {
                showAxisTooltip(event, col)
              })
              .on("mousemove", function (event: MouseEvent) {
                positionAxisTooltip(event)
              })
              .on("mouseleave", hideAxisTooltip)
          }
        })

        // Column group header band: one bold label per group, centered
        // over its span, with a thin rule spanning the group columns.
        if (hasColumnGroups && columnGroups) {
          const groupG = xAxis
            .append("g")
            .attr("class", "resilience-x-axis-groups")
          let cursor = 0
          for (const group of columnGroups) {
            const span = Math.max(0, group.span)
            if (span === 0 || cursor >= columns.length) {
              cursor += span
              continue
            }
            const firstCol = columns[cursor]
            const lastCol =
              columns[Math.min(cursor + span - 1, columns.length - 1)]
            if (!firstCol || !lastCol) {
              cursor += span
              continue
            }
            const x1 = xScale(firstCol.key) ?? 0
            const x2 = (xScale(lastCol.key) ?? 0) + bandW
            const midX = (x1 + x2) / 2
            groupG
              .append("text")
              .attr("x", midX)
              .attr("y", 14)
              .attr("text-anchor", "middle")
              .attr("dominant-baseline", "hanging")
              .attr("font-size", 11)
              .attr("font-weight", 700)
              .attr("fill", paletteText)
              .text(group.label)
            groupG
              .append("line")
              .attr("x1", x1 + 2)
              .attr("x2", x2 - 2)
              .attr("y1", 30)
              .attr("y2", 30)
              .attr("stroke", paletteAxisHint)
              .attr("stroke-width", 1)
            cursor += span
          }
        }

        // Legend — skipped entirely when the parent opts out (e.g., the
        // small-multiples wrapper renders one shared legend outside).
        if (hideLegend) return

        // Legend — varies by cellRender mode. Horizontal origin is the
        // left edge of the first column cell (MARGIN.left + the band's
        // outer-padding offset) so the legend visually lines up with the
        // leftmost heatmap column, not with the row-tick gutter.
        const firstColOffset = xScale(columns[0]?.key ?? "") ?? 0
        const legendG = svg
          .append("g")
          .attr(
            "transform",
            `translate(${MARGIN.left + firstColOffset}, ${effectiveMarginTop + innerH + extraBottom + LEGEND_HEIGHT - 4})`,
          )

        if (
          cellRender === "tier" ||
          cellRender === "glyph" ||
          cellRender === "distribution"
        ) {
          const legendEntryW = 80
          tierColors.forEach((color, i) => {
            const ox = i * legendEntryW
            legendG
              .append("rect")
              .attr("x", ox)
              .attr("y", -12)
              .attr("width", 14)
              .attr("height", 14)
              .attr("rx", 2)
              .attr("fill", color)
            legendG
              .append("text")
              .attr("x", ox + 20)
              .attr("y", -1)
              .attr("font-size", 10)
              .attr("fill", paletteTextMuted)
              .text(tierLabels[i] ?? "")
          })

          const unavailableOx = tierColors.length * legendEntryW
          legendG
            .append("rect")
            .attr("x", unavailableOx)
            .attr("y", -12)
            .attr("width", 14)
            .attr("height", 14)
            .attr("rx", 2)
            .attr("fill", `url(#${HATCH_ID})`)
            .attr("stroke", paletteUnavailStroke)
            .attr("stroke-width", 1)
          legendG
            .append("text")
            .attr("x", unavailableOx + 20)
            .attr("y", -1)
            .attr("font-size", 10)
            .attr("fill", paletteTextMuted)
            .text("No data")
        } else if (cellRender === "delta") {
          // Continuous horizontal gradient bar across [-3, +3].
          const barW = 260
          const barH = 10
          const gradId = "resilience-delta-gradient"
          const grad = defs
            .append("linearGradient")
            .attr("id", gradId)
            .attr("x1", "0%")
            .attr("x2", "100%")
            .attr("y1", "0%")
            .attr("y2", "0%")
          const stops: [number, string][] = [
            [0, palette.divergingNegStrong],
            [0.25, palette.divergingNegWeak],
            [0.5, palette.divergingZero],
            [0.75, palette.divergingPosWeak],
            [1, palette.divergingPosStrong],
          ]
          stops.forEach(([offset, color]) => {
            grad
              .append("stop")
              .attr("offset", `${offset * 100}%`)
              .attr("stop-color", color)
          })

          legendG
            .append("rect")
            .attr("x", 0)
            .attr("y", -12)
            .attr("width", barW)
            .attr("height", barH)
            .attr("rx", 2)
            .attr("fill", `url(#${gradId})`)

          const ticks: [number, string][] = [
            [0, "−3"],
            [barW / 2, "0"],
            [barW, "+3"],
          ]
          ticks.forEach(([x, label]) => {
            legendG
              .append("text")
              .attr("x", x)
              .attr("y", 10)
              .attr(
                "text-anchor",
                x === 0 ? "start" : x === barW ? "end" : "middle",
              )
              .attr("font-size", 10)
              .attr("fill", paletteTextMuted)
              .text(label)
          })

          legendG
            .append("text")
            .attr("x", barW + 16)
            .attr("y", -2)
            .attr("font-size", 10)
            .attr("fill", paletteTextMuted)
            .text("improving  ←  Δ tier  →  worsening")

          const unavailableOx = barW + 240
          legendG
            .append("rect")
            .attr("x", unavailableOx)
            .attr("y", -12)
            .attr("width", 14)
            .attr("height", 14)
            .attr("rx", 2)
            .attr("fill", `url(#${HATCH_ID})`)
            .attr("stroke", paletteUnavailStroke)
            .attr("stroke-width", 1)
          legendG
            .append("text")
            .attr("x", unavailableOx + 20)
            .attr("y", -1)
            .attr("font-size", 10)
            .attr("fill", paletteTextMuted)
            .text("No data")
        } else if (cellRender === "density_opp") {
          const barW = 220
          const barH = 10
          const gradId = "resilience-density-opp-gradient"
          const grad = defs
            .append("linearGradient")
            .attr("id", gradId)
            .attr("x1", "0%")
            .attr("x2", "100%")
          const minC = palette.densityOppMin
          const maxC = palette.densityOppMax
          grad.append("stop").attr("offset", "0%").attr("stop-color", minC)
          grad.append("stop").attr("offset", "100%").attr("stop-color", maxC)

          legendG
            .append("rect")
            .attr("x", 0)
            .attr("y", -12)
            .attr("width", barW)
            .attr("height", barH)
            .attr("rx", 2)
            .attr("fill", `url(#${gradId})`)

          const labelText = "fraction at Tier 2 or better"
          const ticks: [number, string][] = [
            [0, "0%"],
            [barW / 2, "50%"],
            [barW, "100%"],
          ]
          ticks.forEach(([x, label]) => {
            legendG
              .append("text")
              .attr("x", x)
              .attr("y", 10)
              .attr(
                "text-anchor",
                x === 0 ? "start" : x === barW ? "end" : "middle",
              )
              .attr("font-size", 10)
              .attr("fill", paletteTextMuted)
              .text(label)
          })

          legendG
            .append("text")
            .attr("x", barW + 16)
            .attr("y", -2)
            .attr("font-size", 10)
            .attr("fill", paletteTextMuted)
            .text(labelText)
        } else if (cellRender === "leverage") {
          const barW = 220
          const barH = 10
          const gradId = "resilience-leverage-gradient"
          const grad = defs
            .append("linearGradient")
            .attr("id", gradId)
            .attr("x1", "0%")
            .attr("x2", "100%")
          grad
            .append("stop")
            .attr("offset", "0%")
            .attr("stop-color", palette.leverageMin)
          grad
            .append("stop")
            .attr("offset", "100%")
            .attr("stop-color", palette.leverageMax)

          legendG
            .append("rect")
            .attr("x", 0)
            .attr("y", -12)
            .attr("width", barW)
            .attr("height", barH)
            .attr("rx", 2)
            .attr("fill", `url(#${gradId})`)

          const ticks: [number, string][] = [
            [0, "0"],
            [barW / 2, "1.5"],
            [barW, "3"],
          ]
          ticks.forEach(([x, label]) => {
            legendG
              .append("text")
              .attr("x", x)
              .attr("y", 10)
              .attr(
                "text-anchor",
                x === 0 ? "start" : x === barW ? "end" : "middle",
              )
              .attr("font-size", 10)
              .attr("fill", paletteTextMuted)
              .text(label)
          })

          legendG
            .append("text")
            .attr("x", barW + 16)
            .attr("y", -2)
            .attr("font-size", 10)
            .attr("fill", paletteTextMuted)
            .text("tier range across operations")

          const unavailableOx = barW + 220
          legendG
            .append("rect")
            .attr("x", unavailableOx)
            .attr("y", -12)
            .attr("width", 14)
            .attr("height", 14)
            .attr("rx", 2)
            .attr("fill", `url(#${HATCH_ID})`)
            .attr("stroke", paletteUnavailStroke)
            .attr("stroke-width", 1)
          legendG
            .append("text")
            .attr("x", unavailableOx + 20)
            .attr("y", -1)
            .attr("font-size", 10)
            .attr("fill", paletteTextMuted)
            .text("Insufficient coverage")
        }
      },
      [
        rows,
        columns,
        cellIndex,
        colorScale,
        tierColors,
        tierLabels,
        tierTextColor,
        resolveCellFill,
        cellRender,
        showCellNumbers,
        highlightedRowKeys,
        onCellClick,
        palette,
        paletteText,
        paletteTextMuted,
        paletteHoverStroke,
        paletteUnavailFill,
        paletteUnavailStroke,
        paletteUnavailHatch,
        paletteAxisHint,
        showCellTooltip,
        positionCellTooltip,
        hideCellTooltip,
        showSquareTooltip,
        showAxisTooltip,
        positionAxisTooltip,
        hideAxisTooltip,
        showMarginalRowStrip,
        showMarginalColStrip,
        marginalRow,
        marginalCol,
        hideLegend,
        columnGroups,
        columnLabelRotation,
      ],
    )

    useEffect(() => {
      if (currentWidth > 0 && currentHeight > 0) {
        updateChart(currentWidth, currentHeight)
      }
    }, [currentWidth, currentHeight, updateChart])

    return (
      <div
        ref={containerRef}
        style={{
          width: responsive ? "100%" : currentWidth,
          height: responsive ? "100%" : currentHeight,
          minHeight: 300,
          position: "relative",
        }}
      >
        <svg
          ref={svgRef}
          width={currentWidth}
          height={currentHeight}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
        <div
          ref={cellTooltipRef}
          style={{
            position: "absolute",
            display: "none",
            pointerEvents: "none",
            background: palette.tooltipBg,
            border: `1px solid ${palette.tooltipBorder}`,
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 11,
            lineHeight: 1.5,
            zIndex: 20,
            boxShadow: palette.tooltipShadow,
            maxWidth: 320,
            boxSizing: "border-box",
            overflowWrap: "break-word",
            wordBreak: "break-word",
          }}
        />
        <div
          ref={axisTooltipRef}
          style={{
            position: "absolute",
            display: "none",
            pointerEvents: "none",
            background: palette.tooltipBg,
            border: `1px solid ${palette.tooltipBorder}`,
            borderRadius: 6,
            padding: "8px 12px",
            fontSize: 11,
            lineHeight: 1.5,
            zIndex: 20,
            boxShadow: palette.tooltipShadow,
            maxWidth: 280,
            boxSizing: "border-box",
            overflowWrap: "break-word",
            wordBreak: "break-word",
          }}
        />
      </div>
    )
  },
)

ResilienceHeatmap.displayName = "ResilienceHeatmap"

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export default ResilienceHeatmap
