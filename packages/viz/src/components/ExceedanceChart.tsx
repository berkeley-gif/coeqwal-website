"use client"

/**
 * ExceedanceChart - multi-series exceedance-probability curves.
 *
 * Answers "in what share of years is the value at least this big?": the
 * horizontal axis is the percent of years a value is equaled or exceeded
 * (left = wet/abundant years, right = dry/scarce years), the vertical axis
 * the value itself. Takes plain data props only; series colors follow the
 * caller's member order (SERIES_PALETTE by default). Hovering shows a
 * vertical probe line with each series' interpolated value at that
 * probability.
 */

import React, { useRef, useEffect, useState, useCallback } from "react"
import { select, scaleLinear, line, curveLinear, pointer } from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"
import { getSeriesColor } from "../seriesPalette"

export interface ExceedancePoint {
  /** Exceedance probability in [0, 1]: share of years the value is equaled or exceeded */
  probability: number
  /** The metric value at that probability */
  value: number
}

export interface ExceedanceSeries {
  /** Stable identity for the member (scenario, climate, or location id) */
  id: string
  /** Legend/tooltip label; falls back to id */
  label?: string
  /** Explicit series color; falls back to the shared palette by index */
  color?: string
  /** Curve points; the chart sorts them by probability defensively */
  points: ExceedancePoint[]
}

export interface ExceedanceChartProps {
  /** One entry per comparison member */
  series: ExceedanceSeries[]
  /** Y-axis unit label, e.g. "thousand acre-feet" */
  yAxisLabel?: string
  /** Value formatter for ticks and the hover readout */
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

const DEFAULT_MARGIN = { top: 16, right: 20, bottom: 48, left: 64 }
const X_TICKS = [0, 10, 25, 50, 75, 90, 100]
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

/** Linear interpolation of a series' value at probability p (points sorted ascending). */
const valueAt = (points: ExceedancePoint[], p: number): number | null => {
  if (points.length === 0) return null
  const first = points[0] as ExceedancePoint
  const last = points[points.length - 1] as ExceedancePoint
  if (p <= first.probability) return first.value
  if (p >= last.probability) return last.value
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as ExceedancePoint
    const b = points[i] as ExceedancePoint
    if (p <= b.probability) {
      const t = (p - a.probability) / (b.probability - a.probability || 1)
      return a.value + t * (b.value - a.value)
    }
  }
  return last.value
}

const ExceedanceChart: React.FC<ExceedanceChartProps> = React.memo(
  ({
    series,
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

        const drawable = series
          .map((s, i) => ({
            ...s,
            color: s.color ?? getSeriesColor(i),
            points: [...s.points].sort((a, b) => a.probability - b.probability),
          }))
          .filter((s) => s.points.length >= 2)

        const g = svg
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`)

        if (drawable.length === 0) {
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

        let lo = Infinity
        let hi = -Infinity
        drawable.forEach((s) =>
          s.points.forEach((p) => {
            lo = Math.min(lo, p.value)
            hi = Math.max(hi, p.value)
          }),
        )
        // Extend to a zero baseline when the data floor is within reach of it,
        // so curve separation is not exaggerated by a cropped axis.
        if (lo > 0 && lo / (hi || 1) < 0.25) lo = 0
        else if (lo > 0) lo *= 0.95
        hi *= 1.05
        if (lo === hi) hi = lo + 1

        const xScale = scaleLinear().domain([0, 100]).range([0, innerWidth])
        const yScale = scaleLinear().domain([lo, hi]).range([innerHeight, 0])

        // Gridlines + y tick labels
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

        // X axis ticks (fixed exceedance stops) + baseline
        X_TICKS.forEach((t) => {
          g.append("text")
            .attr("x", xScale(t))
            .attr("y", innerHeight + 18)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("font-family", FONT)
            .attr("fill", TEXT_COLOR)
            .text(`${t}%`)
        })
        g.append("line")
          .attr("x1", 0)
          .attr("x2", innerWidth)
          .attr("y1", innerHeight)
          .attr("y2", innerHeight)
          .attr("stroke", "#c9d4dd")

        g.append("text")
          .attr("x", innerWidth / 2)
          .attr("y", innerHeight + 38)
          .attr("text-anchor", "middle")
          .attr("font-size", "11px")
          .attr("font-family", FONT)
          .attr("fill", TEXT_COLOR)
          .text("Percent of years value is equaled or exceeded")

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

        // Series curves
        const lineGen = line<ExceedancePoint>()
          .x((p) => xScale(p.probability * 100))
          .y((p) => yScale(p.value))
          .curve(curveLinear)

        drawable.forEach((s) => {
          g.append("path")
            .datum(s.points)
            .attr("fill", "none")
            .attr("stroke", s.color)
            .attr("stroke-width", 2)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("d", lineGen)
        })

        // Hover probe: vertical line + per-series readout tooltip
        if (!interactive) return null
        const tooltipId = `tooltip-${Math.random().toString(36).slice(2, 11)}`
        const tooltip = select("body")
          .append("div")
          .attr("id", tooltipId)
          .style("position", "absolute")
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

        const hoverLine = g
          .append("line")
          .attr("y1", 0)
          .attr("y2", innerHeight)
          .attr("stroke", "#1a2733")
          .attr("stroke-dasharray", "3,3")
          .attr("stroke-opacity", 0.5)
          .style("visibility", "hidden")

        // rAF-coalesced mousemove: at most one DOM/tooltip update per frame,
        // so rapid pointer events never queue redundant work.
        let rafId = 0
        g.append("rect")
          .attr("width", innerWidth)
          .attr("height", innerHeight)
          .attr("fill", "transparent")
          .style("cursor", "crosshair")
          .on("mousemove", (event: MouseEvent) => {
            if (rafId) return
            rafId = requestAnimationFrame(() => {
              rafId = 0
              const [mouseX] = pointer(event, g.node())
              const pct = Math.max(0, Math.min(100, xScale.invert(mouseX)))
              hoverLine
                .attr("x1", xScale(pct))
                .attr("x2", xScale(pct))
                .style("visibility", "visible")
              const rows = drawable
                .map((s) => {
                  const v = valueAt(s.points, pct / 100)
                  return `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${s.color};margin-right:6px"></span>${s.label ?? s.id}: <b style="font-variant-numeric:tabular-nums">${v == null ? "-" : formatValue(v)}</b>`
                })
                .join("<br/>")
              tooltip
                .style("visibility", "visible")
                .style("left", `${event.pageX + 16}px`)
                .style("top", `${event.pageY - 16}px`)
                .html(
                  `<div style="font-weight:600;color:${TEXT_COLOR};margin-bottom:6px">${pct.toFixed(0)}% of years</div>${rows}`,
                )
            })
          })
          .on("mouseout", () => {
            hoverLine.style("visibility", "hidden")
            tooltip.style("visibility", "hidden")
          })

        return tooltipId
      },
      [series, yAxisLabel, formatValue, margin, interactive],
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

ExceedanceChart.displayName = "ExceedanceChart"

export default ExceedanceChart
