"use client"

/**
 * CategoricalBarChart - one labeled bar per comparison member, anchored to a
 * zero baseline.
 *
 * Used for single-number-per-member views (year-to-year variability, summary
 * values). Supports negative values (bars extend below the baseline, e.g.
 * declining groundwater trends). Takes plain data props only; colors follow
 * the caller's member order (SERIES_PALETTE by default). Each bar carries a
 * direct value label plus a hover tooltip with the untruncated member name.
 */

import React, { useRef, useEffect, useState, useCallback } from "react"
import { select, scaleLinear } from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"
import { getSeriesColor } from "../seriesPalette"

export interface CategoricalBarDatum {
  /** Stable identity for the member (scenario, climate, or location id) */
  id: string
  /** Label under the bar and in the tooltip */
  label: string
  value: number
  /** Explicit color; falls back to the shared palette by index */
  color?: string
}

export interface CategoricalBarChartProps {
  /** One entry per comparison member */
  bars: CategoricalBarDatum[]
  /** Y-axis unit label, e.g. "CV" or "billion $/yr" */
  yAxisLabel?: string
  /** Value formatter for ticks, bar labels, and the tooltip */
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

const DEFAULT_MARGIN = { top: 20, right: 20, bottom: 44, left: 64 }
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

const CategoricalBarChart: React.FC<CategoricalBarChartProps> = React.memo(
  ({
    bars,
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

        if (bars.length === 0) {
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

        const drawable = bars.map((b, i) => ({
          ...b,
          color: b.color ?? getSeriesColor(i),
        }))

        // Zero is always in the domain: bars are read from the baseline.
        let lo = 0
        let hi = 0
        drawable.forEach((b) => {
          lo = Math.min(lo, b.value)
          hi = Math.max(hi, b.value)
        })
        if (hi > 0) hi *= 1.12
        if (lo < 0) lo *= 1.12
        if (lo === 0 && hi === 0) hi = 1

        const yScale = scaleLinear().domain([lo, hi]).range([innerHeight, 0])
        const band = innerWidth / drawable.length
        const y0 = yScale(0)

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

        // Zero baseline, visually distinct from gridlines
        g.append("line")
          .attr("x1", 0)
          .attr("x2", innerWidth)
          .attr("y1", y0)
          .attr("y2", y0)
          .attr("stroke", "#9aa9b6")

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
              .style("visibility", "hidden")
              .style("background", "#fff")
              .style("border-radius", "6px")
              .style("padding", "8px 12px")
              .style("font-size", "12px")
              .style("font-family", FONT)
              .style("box-shadow", "0 4px 20px rgba(0,0,0,0.12)")
              .style("pointer-events", "none")
              .style("z-index", "1000")
              .style("line-height", "1.5")
          : null

        drawable.forEach((b, i) => {
          const cx = band * (i + 0.5)
          const barWidth = Math.min(70, band * 0.5)
          const yv = yScale(b.value)
          const top = Math.min(y0, yv)
          const barHeight = Math.max(2, Math.abs(y0 - yv))
          const barG = g.append("g")

          barG
            .append("rect")
            .attr("x", cx - barWidth / 2)
            .attr("y", top)
            .attr("width", barWidth)
            .attr("height", barHeight)
            .attr("fill", b.color)
            .attr("fill-opacity", 0.75)
            .attr("rx", 3)

          // Direct value label just past the bar's data end
          barG
            .append("text")
            .attr("x", cx)
            .attr("y", b.value >= 0 ? top - 6 : top + barHeight + 14)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("font-weight", "600")
            .attr("font-family", FONT)
            .attr("fill", "#1a2733")
            .text(formatValue(b.value))

          const label =
            b.label.length > 20 ? `${b.label.slice(0, 19)}…` : b.label
          barG
            .append("text")
            .attr("x", cx)
            .attr("y", innerHeight + 18)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("font-family", FONT)
            .attr("fill", TEXT_COLOR)
            .text(label)

          barG
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
                  `<div style="font-weight:600;color:${TEXT_COLOR}">${b.label}</div>` +
                    `<div style="font-variant-numeric:tabular-nums"><b>${formatValue(b.value)}</b>${yAxisLabel ? ` ${yAxisLabel}` : ""}</div>`,
                )
            })
            .on("mouseout", () => {
              if (!tooltip) return
              tooltip.style("visibility", "hidden")
            })
        })

        return tooltipId
      },
      [bars, yAxisLabel, formatValue, margin, interactive],
    )

    useEffect(() => {
      if (currentWidth > 0 && currentHeight > 0) {
        const tooltipId = updateChart(currentWidth, currentHeight)
        let readyFrame: number | undefined
        if (!hasFiredOnReadyRef.current) {
          hasFiredOnReadyRef.current = true
          readyFrame = requestAnimationFrame(() => onReadyRef.current?.())
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

CategoricalBarChart.displayName = "CategoricalBarChart"

export default CategoricalBarChart
