"use client"

/**
 * ResilienceHeatmap
 *
 * D3 heatmap for the Scenario Explorer resilience tool.
 * X axis = hydroclimates, Y axis = outcomes or scenarios (driven by the
 * parent). Cells are colored by rounded tier (1-4) and optionally display
 * the continuous arithmetic-mean value (e.g. 2.3) inside.
 *
 * Color tokens and tier labels are injected by the parent so the viz
 * stays theme-agnostic; see ResiliencePanel for the wiring.
 *
 * Follows the @repo/viz hover-flicker rules:
 *  - Ref-based tooltip (no useState), two flavors: cell + axis label.
 *  - Debounced onCellHover via startTransition in the parent.
 *  - updateChart deps are minimal; callbacks live in refs.
 *  - Entrance animations guarded by hasAnimatedRef.
 */

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react"
import { scaleBand, select } from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"

export interface ResilienceAxisItem {
  key: string
  label: string
  /** Shown in the axis-label tooltip (if provided). */
  definitionTooltip?: string
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
  /** Distinguishes aggregate outcome cells from single-value / NOD-SOD cells. */
  type?: "single_value" | "multi_value" | "nod_sod"
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
  /** Print the continuous value inside each cell. */
  showCellNumbers?: boolean
  responsive?: boolean
  width?: number
  height?: number
  onCellHover?: (cell: ResilienceHeatmapCell | null) => void
  onCellClick?: (cell: ResilienceHeatmapCell) => void
  /** Sidebar-hover highlighted scenarios; dims non-matching rows/cells. */
  highlightedRowKeys?: Set<string> | null
  /** Row key label formatter override (e.g. regional indent for NOD/SOD). */
  formatRowTick?: (row: ResilienceAxisItem) => string
}

const MARGIN = { top: 16, right: 24, bottom: 72, left: 200 }
const LEGEND_HEIGHT = 48
const HATCH_ID = "resilience-unavailable-hatch"

function clampTier(value: number): 1 | 2 | 3 | 4 {
  return Math.min(4, Math.max(1, Math.round(value))) as 1 | 2 | 3 | 4
}

function defaultRowTick(row: ResilienceAxisItem): string {
  return row.label
}

const ResilienceHeatmap: React.FC<ResilienceHeatmapProps> = React.memo(
  ({
    rows,
    columns,
    cells,
    tierColors,
    tierLabels,
    palette,
    showCellNumbers = true,
    responsive = true,
    width = 700,
    height = 500,
    onCellHover,
    onCellClick,
    highlightedRowKeys = null,
    formatRowTick = defaultRowTick,
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

    const onCellClickRef = useRef(onCellClick)
    useEffect(() => {
      onCellClickRef.current = onCellClick
    }, [onCellClick])

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
        const tierText =
          cell.available && cell.tierLevel != null
            ? `Tier ${cell.tierLevel}${
                cell.continuousValue != null &&
                cell.type !== "single_value" &&
                cell.tierLevel !== cell.continuousValue
                  ? ` (${cell.continuousValue.toFixed(2)})`
                  : ""
              }`
            : cell.unavailableReason ?? "No data"

        el.innerHTML = `
          <div style="font-weight:600;color:${paletteText}">${escapeHtml(cell.subjectLabel)}</div>
          <div style="color:${paletteText}">${escapeHtml(cell.rowLabel)}</div>
          <div style="color:${paletteTextMuted}">${escapeHtml(cell.colLabel)}</div>
          <div style="margin-top:4px;color:${paletteText};font-weight:500">${escapeHtml(tierText)}</div>
        `
        el.style.display = "block"
        positionCellTooltip(event)
      },
      [positionCellTooltip, paletteText, paletteTextMuted],
    )

    const hideCellTooltip = useCallback(() => {
      const el = cellTooltipRef.current
      if (el) el.style.display = "none"
    }, [])

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
        el.innerHTML = `
          <div style="font-weight:600;color:${paletteText};margin-bottom:4px">${escapeHtml(item.label)}</div>
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

    const updateChart = useCallback(
      (w: number, h: number) => {
        if (!svgRef.current) return
        const svg = select(svgRef.current)
        svg.selectAll("*").remove()
        if (rows.length === 0 || columns.length === 0 || w <= 0 || h <= 0) {
          return
        }

        const innerW = w - MARGIN.left - MARGIN.right
        const innerH = h - MARGIN.top - MARGIN.bottom
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
          .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`)

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
        rows.forEach((row) => {
          const y = yScale(row.key) ?? 0
          const opacity = rowOpacity(row.key)

          columns.forEach((col) => {
            const cell = cellIndex.get(`${row.key}|${col.key}`)
            if (!cell) return
            const x = xScale(col.key) ?? 0

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

            if (cell.available && cell.tierLevel != null) {
              rect
                .attr("fill", colorScale(cell.tierLevel))
                .attr("fill-opacity", opacity)
            } else {
              rect
                .attr("fill", `url(#${HATCH_ID})`)
                .attr("stroke", paletteUnavailStroke)
                .attr("stroke-width", 1)
                .attr("fill-opacity", opacity)
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
                if (cell.available && cell.tierLevel != null) {
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

            // Print continuous value inside cell when enabled + cell is big
            // enough. Only when cell is available.
            if (
              showCellNumbers &&
              cell.available &&
              cell.continuousValue != null &&
              bandW > 28 &&
              bandH > 18
            ) {
              const label =
                cell.type === "single_value" ||
                cell.tierLevel === cell.continuousValue
                  ? String(cell.tierLevel)
                  : cell.continuousValue.toFixed(1)
              g.append("text")
                .attr("x", x + bandW / 2)
                .attr("y", y + bandH / 2)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                .attr(
                  "font-size",
                  Math.min(Math.min(bandW, bandH) * 0.36, 14),
                )
                .attr("font-weight", 600)
                .attr(
                  "fill",
                  cell.tierLevel != null
                    ? tierTextColor(cell.tierLevel)
                    : paletteTextMuted,
                )
                .attr("fill-opacity", opacity)
                .attr("pointer-events", "none")
                .text(label)
            }
          })
        })

        // Y axis (rows)
        const yAxis = g.append("g").attr("class", "resilience-y-axis")
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

        // X axis (hydroclimates)
        const xAxis = g
          .append("g")
          .attr("class", "resilience-x-axis")
          .attr("transform", `translate(0,${innerH})`)
        columns.forEach((col) => {
          const cx = (xScale(col.key) ?? 0) + bandW / 2
          const node = xAxis
            .append("text")
            .attr("x", cx)
            .attr("y", 18)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "hanging")
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

        // Legend
        const legendG = svg
          .append("g")
          .attr(
            "transform",
            `translate(${MARGIN.left}, ${MARGIN.top + innerH + LEGEND_HEIGHT - 4})`,
          )

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
      },
      // Hover/click callbacks are held in refs; tooltip helpers are
      // stable useCallback identities, so deps stay minimal.
      [
        rows,
        columns,
        cellIndex,
        colorScale,
        tierColors,
        tierLabels,
        tierTextColor,
        showCellNumbers,
        highlightedRowKeys,
        onCellClick,
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
        showAxisTooltip,
        positionAxisTooltip,
        hideAxisTooltip,
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
            whiteSpace: "nowrap",
            maxWidth: 320,
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
