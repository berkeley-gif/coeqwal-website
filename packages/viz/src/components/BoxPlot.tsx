"use client"

/**
 * BoxPlot - side-by-side distribution summaries, one box per comparison
 * member.
 *
 * Each box spans the 25th-75th percentile with a heavy median line; whiskers
 * default to the 10th/90th percentiles (the Data-in-Depth convention, and
 * what the percentile grid serves) and fall back to min/max per box when
 * p10/p90 are absent, so partial data never throws. Takes plain data props
 * only; colors follow the caller's member order (SERIES_PALETTE by default).
 */

import React, { useRef, useEffect, useState, useCallback } from "react"
import { select, scaleLinear } from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"
import { getSeriesColor } from "../seriesPalette"

export interface BoxPlotStats {
  min: number
  /** 25th percentile (box bottom) */
  q1: number
  median: number
  /** 75th percentile (box top) */
  q3: number
  max: number
  mean?: number
  /** 10th percentile; enables the default "p10p90" whisker convention */
  p10?: number
  /** 90th percentile; enables the default "p10p90" whisker convention */
  p90?: number
}

export interface BoxPlotDatum {
  /** Stable identity for the member (scenario, climate, or location id) */
  id: string
  /** Label under the box and in the tooltip */
  label: string
  /** Explicit color; falls back to the shared palette by index */
  color?: string
  stats: BoxPlotStats
  /** Individual outlier values, rendered as small open circles */
  outliers?: number[]
}

export type WhiskerMode = "p10p90" | "minmax"

export interface BoxPlotProps {
  /** One entry per comparison member */
  boxes: BoxPlotDatum[]
  /**
   * Whisker convention. "p10p90" (default) uses stats.p10/p90 and falls back
   * to min/max for boxes missing them; "minmax" always uses min/max.
   */
  whiskers?: WhiskerMode
  /** Y-axis unit label, e.g. "thousand acre-feet" */
  yAxisLabel?: string
  /** Value formatter for ticks and the tooltip */
  formatValue?: (v: number) => string
  /** Enable responsive sizing via ResizeObserver */
  responsive?: boolean
  /** Fixed width (when responsive=false) */
  width?: number
  /** Fixed height (when responsive=false) */
  height?: number
  /** Chart margins */
  margin?: { top: number; right: number; bottom: number; left: number }
  /** When false, skips hover listeners and the tooltip (capture mode) */
  interactive?: boolean
  /** Fires once after the first committed draw (off-screen capture waits on it) */
  onReady?: () => void
}

const DEFAULT_MARGIN = { top: 16, right: 20, bottom: 44, left: 64 }
const TEXT_COLOR = "#5a6c7a"
const GRID_COLOR = "#e8edf0"
const FONT = "'Inter', -apple-system, sans-serif"

const defaultFormatValue = (v: number): string => {
  const a = Math.abs(v)
  const d = a >= 100 ? 0 : a >= 10 ? 1 : 2
  return v.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  })
}

/** Resolve the whisker extents for one box under the requested mode. */
const whiskerExtent = (
  stats: BoxPlotStats,
  mode: WhiskerMode,
): { loWhisk: number; hiWhisk: number; usedFallback: boolean } => {
  if (mode === "p10p90" && stats.p10 != null && stats.p90 != null) {
    return { loWhisk: stats.p10, hiWhisk: stats.p90, usedFallback: false }
  }
  return {
    loWhisk: stats.min,
    hiWhisk: stats.max,
    usedFallback: mode === "p10p90",
  }
}

const BoxPlot: React.FC<BoxPlotProps> = React.memo(
  ({
    boxes,
    whiskers = "p10p90",
    yAxisLabel = "",
    formatValue = defaultFormatValue,
    responsive = true,
    width = 600,
    height = 320,
    margin = DEFAULT_MARGIN,
    interactive = true,
    onReady,
  }) => {
    const svgRef = useRef<SVGSVGElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const dimensions = useResizeObserver(
      containerRef as React.RefObject<HTMLElement>,
    )
    const [currentWidth, setCurrentWidth] = useState(width)
    const [currentHeight, setCurrentHeight] = useState(height)
    const onReadyRef = useRef(onReady)
    useEffect(() => {
      onReadyRef.current = onReady
    }, [onReady])
    const hasFiredOnReadyRef = useRef(false)

    useEffect(() => {
      if (responsive && dimensions && dimensions.width > 0) {
        setCurrentWidth(dimensions.width)
        setCurrentHeight(dimensions.height || height)
      } else {
        setCurrentWidth(width)
        setCurrentHeight(height)
      }
    }, [responsive, dimensions, width, height])

    const updateChart = useCallback(
      (w: number, h: number) => {
        if (!svgRef.current) return
        const svg = select(svgRef.current)
        svg.selectAll("*").remove()

        const innerWidth = w - margin.left - margin.right
        const innerHeight = h - margin.top - margin.bottom
        if (innerWidth <= 0 || innerHeight <= 0) return

        const g = svg
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`)

        if (boxes.length === 0) {
          g.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-family", FONT)
            .attr("fill", TEXT_COLOR)
            .text("No data available")
          return
        }

        const drawable = boxes.map((b, i) => ({
          ...b,
          color: b.color ?? getSeriesColor(i),
          extent: whiskerExtent(b.stats, whiskers),
        }))

        let lo = Infinity
        let hi = -Infinity
        drawable.forEach((b) => {
          lo = Math.min(lo, b.extent.loWhisk, ...(b.outliers ?? []))
          hi = Math.max(hi, b.extent.hiWhisk, ...(b.outliers ?? []))
        })
        // Same zero-baseline rule as the exceedance chart: include zero when
        // the data floor is near it, so box separation is not exaggerated.
        if (lo > 0 && lo / (hi || 1) < 0.25) lo = 0
        else if (lo > 0) lo *= 0.95
        hi *= 1.06
        if (lo === hi) hi = lo + 1

        const yScale = scaleLinear().domain([lo, hi]).range([innerHeight, 0])
        const band = innerWidth / drawable.length

        yScale.ticks(5).forEach((t) => {
          g.append("line")
            .attr("x1", 0)
            .attr("x2", innerWidth)
            .attr("y1", yScale(t))
            .attr("y2", yScale(t))
            .attr("stroke", GRID_COLOR)
            .attr("stroke-width", 1)
          g.append("text")
            .attr("x", -9)
            .attr("y", yScale(t) + 4)
            .attr("text-anchor", "end")
            .attr("font-size", "10px")
            .attr("font-family", FONT)
            .attr("fill", TEXT_COLOR)
            .text(formatValue(t))
        })
        g.append("line")
          .attr("x1", 0)
          .attr("x2", innerWidth)
          .attr("y1", innerHeight)
          .attr("y2", innerHeight)
          .attr("stroke", "#c9d4dd")

        if (yAxisLabel) {
          g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -innerHeight / 2)
            .attr("y", -margin.left + 14)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("font-family", FONT)
            .attr("fill", TEXT_COLOR)
            .attr("font-weight", "500")
            .text(yAxisLabel)
        }

        const tooltipId = interactive
          ? `tooltip-${Math.random().toString(36).slice(2, 11)}`
          : null
        const tooltip = tooltipId
          ? select("body")
              .append("div")
              .attr("id", tooltipId)
              .style("position", "absolute")
              // Pinned to the page origin while hidden: with no initial
              // position the absolutely-placed box lands after the page
              // content and its padding extends the document height.
              .style("left", "0px")
              .style("top", "0px")
              .style("visibility", "hidden")
              .style("background", "#fff")
              .style("border-radius", "6px")
              .style("padding", "10px 14px")
              .style("font-size", "12px")
              .style("font-family", FONT)
              .style("box-shadow", "0 4px 20px rgba(0,0,0,0.12)")
              .style("pointer-events", "none")
              .style("z-index", "1000")
              .style("line-height", "1.5")
          : null

        drawable.forEach((b, i) => {
          const cx = band * (i + 0.5)
          const boxWidth = Math.min(64, band * 0.42)
          const capWidth = boxWidth * 0.77
          const { loWhisk, hiWhisk, usedFallback } = b.extent
          const s = b.stats
          const boxG = g.append("g")

          // Whisker stem + caps
          boxG
            .append("line")
            .attr("x1", cx)
            .attr("x2", cx)
            .attr("y1", yScale(loWhisk))
            .attr("y2", yScale(hiWhisk))
            .attr("stroke", b.color)
            .attr("stroke-width", 1.6)
          ;[loWhisk, hiWhisk].forEach((v) => {
            boxG
              .append("line")
              .attr("x1", cx - capWidth / 2)
              .attr("x2", cx + capWidth / 2)
              .attr("y1", yScale(v))
              .attr("y2", yScale(v))
              .attr("stroke", b.color)
              .attr("stroke-width", 1.6)
          })

          // Box (q1-q3)
          boxG
            .append("rect")
            .attr("x", cx - boxWidth / 2)
            .attr("y", yScale(s.q3))
            .attr("width", boxWidth)
            .attr("height", Math.max(2, yScale(s.q1) - yScale(s.q3)))
            .attr("fill", b.color)
            .attr("fill-opacity", 0.18)
            .attr("stroke", b.color)
            .attr("stroke-width", 1.6)
            .attr("rx", 3)

          // Median: the hero line
          boxG
            .append("line")
            .attr("x1", cx - boxWidth / 2)
            .attr("x2", cx + boxWidth / 2)
            .attr("y1", yScale(s.median))
            .attr("y2", yScale(s.median))
            .attr("stroke", b.color)
            .attr("stroke-width", 3)

          // Optional mean marker (subtle dashed tick)
          if (s.mean != null) {
            boxG
              .append("line")
              .attr("x1", cx - boxWidth / 2)
              .attr("x2", cx + boxWidth / 2)
              .attr("y1", yScale(s.mean))
              .attr("y2", yScale(s.mean))
              .attr("stroke", b.color)
              .attr("stroke-width", 1.2)
              .attr("stroke-dasharray", "3,3")
              .attr("opacity", 0.8)
          }

          // Outliers as open circles
          ;(b.outliers ?? []).forEach((v) => {
            boxG
              .append("circle")
              .attr("cx", cx)
              .attr("cy", yScale(v))
              .attr("r", 3)
              .attr("fill", "none")
              .attr("stroke", b.color)
              .attr("stroke-width", 1.2)
          })

          // Member label
          const label =
            b.label.length > 20 ? `${b.label.slice(0, 19)}…` : b.label
          boxG
            .append("text")
            .attr("x", cx)
            .attr("y", innerHeight + 18)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("font-family", FONT)
            .attr("fill", TEXT_COLOR)
            .text(label)

          // Hover target: full band column
          const whiskLabel =
            usedFallback || whiskers === "minmax"
              ? ["Max", "Min"]
              : ["90th", "10th"]
          boxG
            .append("rect")
            .attr("x", band * i)
            .attr("y", 0)
            .attr("width", band)
            .attr("height", innerHeight)
            .attr("fill", "transparent")
            .on("mousemove", (event: MouseEvent) => {
              if (!tooltip) return
              tooltip
                .style("visibility", "visible")
                .style("left", `${event.pageX + 16}px`)
                .style("top", `${event.pageY - 16}px`)
                .html(
                  `<div style="font-weight:600;color:${TEXT_COLOR};margin-bottom:6px">${b.label}</div>` +
                    `<div style="display:grid;grid-template-columns:auto auto;gap:2px 12px;color:#6b7785">` +
                    `<span>${whiskLabel[0]}</span><span style="text-align:right;font-variant-numeric:tabular-nums">${formatValue(hiWhisk)}</span>` +
                    `<span>75th</span><span style="text-align:right;font-variant-numeric:tabular-nums">${formatValue(s.q3)}</span>` +
                    `<span style="font-weight:600;color:${b.color}">Median</span><span style="text-align:right;font-weight:600;color:${b.color};font-variant-numeric:tabular-nums">${formatValue(s.median)}</span>` +
                    `<span>25th</span><span style="text-align:right;font-variant-numeric:tabular-nums">${formatValue(s.q1)}</span>` +
                    `<span>${whiskLabel[1]}</span><span style="text-align:right;font-variant-numeric:tabular-nums">${formatValue(loWhisk)}</span>` +
                    (s.mean != null
                      ? `<span>Mean</span><span style="text-align:right;font-variant-numeric:tabular-nums">${formatValue(s.mean)}</span>`
                      : "") +
                    `</div>`,
                )
            })
            .on("mouseout", () => {
              if (!tooltip) return
              tooltip.style("visibility", "hidden")
            })
        })

        return tooltipId
      },
      [boxes, whiskers, yAxisLabel, formatValue, margin, interactive],
    )

    useEffect(() => {
      if (currentWidth > 0 && currentHeight > 0) {
        const tooltipId = updateChart(currentWidth, currentHeight)
        // TierGrid's ordering: the fired flag is set inside the frame, so a
        // frame cancelled by a re-render re-schedules on the next effect run
        // instead of losing the only onReady the capture host waits for.
        let readyFrame: number | undefined
        if (!hasFiredOnReadyRef.current) {
          readyFrame = requestAnimationFrame(() => {
            if (hasFiredOnReadyRef.current) return
            hasFiredOnReadyRef.current = true
            onReadyRef.current?.()
          })
        }
        return () => {
          if (readyFrame != null) cancelAnimationFrame(readyFrame)
          if (tooltipId) select(`#${tooltipId}`).remove()
        }
      }
    }, [currentWidth, currentHeight, updateChart])

    return (
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: responsive ? "100%" : `${height}px`,
          minHeight: responsive ? "220px" : undefined,
        }}
      >
        <svg
          ref={svgRef}
          width={responsive ? "100%" : width}
          height={responsive ? "100%" : height}
          style={{ display: "block" }}
        />
      </div>
    )
  },
)

BoxPlot.displayName = "BoxPlot"

export default BoxPlot
