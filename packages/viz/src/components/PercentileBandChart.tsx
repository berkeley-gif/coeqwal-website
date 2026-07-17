"use client"

/**
 * PercentileBandChart - D3-based percentile band visualization
 *
 * Displays monthly percentile bands showing distribution of values
 * across water years. Used for reservoir storage percentile charts.
 *
 * Water months: 1=October, 2=November, ..., 12=September
 *
 */

import React, { useRef, useEffect, useState, useCallback } from "react"
import {
  area,
  axisBottom,
  axisLeft,
  curveLinear,
  line,
  pointer,
  scaleLinear,
  select,
} from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"

export interface PercentileValues {
  q0: number // Minimum
  q10: number // 10th percentile
  q30: number // 30th percentile
  q50: number // Median
  q70: number // 70th percentile
  q90: number // 90th percentile
  q100: number // Maximum
  mean: number
}

export interface MonthlyPercentiles {
  [month: string]: PercentileValues // Keys: "1" to "12" (water months)
}

export interface PercentileBandChartProps {
  /** Monthly percentile data: { "1": {q0, q10, q30, q50, q70, q90, q100, mean}, ... } */
  data: MonthlyPercentiles
  /** Chart title */
  title?: string
  /** Y-axis label */
  yAxisLabel?: string
  /** Whether to show the mean line (dashed) */
  showMean?: boolean
  /** Color scheme for bands */
  colorScheme?: "blues" | "greens" | "oranges" | "slate" | string
  /** Enable responsive sizing */
  responsive?: boolean
  /** Fixed width (when responsive=false) */
  width?: number
  /** Fixed height (when responsive=false) */
  height?: number
  /** Chart margins */
  margin?: { top: number; right: number; bottom: number; left: number }
  /** Show legend */
  showLegend?: boolean
}

// Water month labels in order (1=Oct, 2=Nov, ..., 12=Sep)
const WATER_MONTH_LABELS = [
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
]

// Color schemes for bands - NYT-inspired muted palettes
interface ColorScheme {
  outer: string // q10-q90 band
  inner: string // q30-q70 band
  median: string // q50 line
  mean: string // mean line
  range: string // min-max area (very subtle)
  text: string // axis and label text
  grid: string // gridline color
  hover: string // hover line color
}

// Single-hue blue palette (default). Stepped alphas keep the q30-q70 inner
// swath clearly darker than the q10-q90 outer swath; `range` is now the
// q0/q100 dashed min-max reference line color rather than a fill.
const DEFAULT_COLOR_SCHEME: ColorScheme = {
  outer: "rgba(49, 130, 189, 0.2)",
  inner: "rgba(49, 130, 189, 0.45)",
  median: "#08519c",
  mean: "#8b9da8",
  range: "#6baed6",
  text: "#5a6c7a",
  grid: "#e8edf0",
  hover: "#08519c",
}

const COLOR_SCHEMES: Record<string, ColorScheme> = {
  blues: DEFAULT_COLOR_SCHEME,
  slate: DEFAULT_COLOR_SCHEME,
  greens: {
    outer: "rgba(76, 127, 93, 0.2)",
    inner: "rgba(76, 127, 93, 0.45)",
    median: "#1d7a45",
    mean: "#8da898",
    range: "#74c69d",
    text: "#5a6c5e",
    grid: "#e8f0ea",
    hover: "#1d7a45",
  },
  oranges: {
    outer: "rgba(230, 85, 13, 0.2)",
    inner: "rgba(230, 85, 13, 0.45)",
    median: "#a63603",
    mean: "#c4a888",
    range: "#fdae6b",
    text: "#6c5a4a",
    grid: "#f0ebe8",
    hover: "#a63603",
  },
}

// Process data into array sorted by water month
const processData = (rawData: MonthlyPercentiles) => {
  const result: Array<
    { monthIndex: number; label: string } & PercentileValues
  > = []

  for (let i = 1; i <= 12; i++) {
    const monthStr = i.toString()
    const monthData = rawData[monthStr]

    if (monthData) {
      result.push({
        monthIndex: i - 1, // 0-indexed for x-scale
        label: WATER_MONTH_LABELS[i - 1] ?? "",
        ...monthData,
      })
    }
  }

  return result
}

const PercentileBandChart: React.FC<PercentileBandChartProps> = React.memo(
  ({
    data,
    title = "",
    yAxisLabel = "% of Capacity",
    showMean = false,
    colorScheme = "blues",
    responsive = true,
    width = 400,
    height = 250,
    margin = { top: 20, right: 16, bottom: 32, left: 42 },
    showLegend = false,
  }) => {
    const svgRef = useRef<SVGSVGElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const dimensions = useResizeObserver(
      containerRef as React.RefObject<HTMLElement>,
    )
    const [currentWidth, setCurrentWidth] = useState(width)
    const [currentHeight, setCurrentHeight] = useState(height)

    // Get colors for the scheme (with guaranteed fallback)
    const colors: ColorScheme =
      COLOR_SCHEMES[colorScheme] ?? DEFAULT_COLOR_SCHEME

    useEffect(() => {
      if (responsive && dimensions) {
        setCurrentWidth(dimensions.width)
        setCurrentHeight(dimensions.height)
      } else {
        setCurrentWidth(width)
        setCurrentHeight(height)
      }
    }, [responsive, dimensions, width, height])

    // Draw chart
    const updateChart = useCallback(
      (w: number, h: number) => {
        if (!svgRef.current || !data) return

        // Process the data
        const processedData = processData(data)
        if (processedData.length === 0) return

        // Clear previous chart
        const svg = select(svgRef.current)
        svg.selectAll("*").remove()

        // Set chart dimensions
        const innerWidth = w - margin.left - margin.right
        const innerHeight = h - margin.top - margin.bottom

        if (innerWidth <= 0 || innerHeight <= 0) return

        // Create scales
        const xScale = scaleLinear().domain([0, 11]).range([0, innerWidth])

        const yScale = scaleLinear()
          .domain([0, 100]) // Percent of capacity: 0-100%
          .range([innerHeight, 0])

        // Create main group element
        const g = svg
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`)

        // Add subtle horizontal gridlines (NYT style - very light, no vertical lines)
        g.append("g")
          .attr("class", "grid")
          .selectAll("line")
          .data([25, 50, 75])
          .enter()
          .append("line")
          .attr("x1", 0)
          .attr("x2", innerWidth)
          .attr("y1", (d) => yScale(d))
          .attr("y2", (d) => yScale(d))
          .attr("stroke", colors.grid)
          .attr("stroke-width", 1)

        // Add baseline at 0%
        g.append("line")
          .attr("x1", 0)
          .attr("x2", innerWidth)
          .attr("y1", yScale(0))
          .attr("y2", yScale(0))
          .attr("stroke", colors.grid)
          .attr("stroke-width", 1)

        // Create area generators for the filled swaths (q10-q90 and q30-q70).
        // q0/q100 (min/max) render as dashed reference lines instead of a fill.
        const outerArea = area<(typeof processedData)[0]>()
          .x((d) => xScale(d.monthIndex))
          .y0((d) => yScale(d.q10))
          .y1((d) => yScale(d.q90))
          .curve(curveLinear)

        const innerArea = area<(typeof processedData)[0]>()
          .x((d) => xScale(d.monthIndex))
          .y0((d) => yScale(d.q30))
          .y1((d) => yScale(d.q70))
          .curve(curveLinear)

        // Create line generators
        const minLine = line<(typeof processedData)[0]>()
          .x((d) => xScale(d.monthIndex))
          .y((d) => yScale(d.q0))
          .curve(curveLinear)

        const maxLine = line<(typeof processedData)[0]>()
          .x((d) => xScale(d.monthIndex))
          .y((d) => yScale(d.q100))
          .curve(curveLinear)

        const medianLine = line<(typeof processedData)[0]>()
          .x((d) => xScale(d.monthIndex))
          .y((d) => yScale(d.q50))
          .curve(curveLinear)

        const meanLine = line<(typeof processedData)[0]>()
          .x((d) => xScale(d.monthIndex))
          .y((d) => yScale(d.mean))
          .curve(curveLinear)

        // Draw outer band (q10-q90)
        g.append("path")
          .datum(processedData)
          .attr("fill", colors.outer)
          .attr("d", outerArea)

        // Draw inner band (q30-q70)
        g.append("path")
          .datum(processedData)
          .attr("fill", colors.inner)
          .attr("d", innerArea)

        // Draw min/max (q0/q100) as thin dashed reference lines
        g.append("path")
          .datum(processedData)
          .attr("fill", "none")
          .attr("stroke", colors.range)
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "3,3")
          .attr("opacity", 0.7)
          .attr("d", minLine)
        g.append("path")
          .datum(processedData)
          .attr("fill", "none")
          .attr("stroke", colors.range)
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "3,3")
          .attr("opacity", 0.7)
          .attr("d", maxLine)

        // Draw median line (q50) - the hero line
        g.append("path")
          .datum(processedData)
          .attr("fill", "none")
          .attr("stroke", colors.median)
          .attr("stroke-width", 2)
          .attr("stroke-linecap", "round")
          .attr("stroke-linejoin", "round")
          .attr("d", medianLine)

        // Draw mean line (optional, subtle dashed)
        if (showMean) {
          g.append("path")
            .datum(processedData)
            .attr("fill", "none")
            .attr("stroke", colors.mean)
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "3,3")
            .attr("stroke-linecap", "round")
            .attr("d", meanLine)
        }

        // Add X axis - minimal style, no line, just labels
        const xAxis = g
          .append("g")
          .attr("transform", `translate(0,${innerHeight + 8})`)
          .call(
            axisBottom(xScale)
              .ticks(12)
              .tickSize(0)
              .tickFormat((d) => {
                const idx = Math.round(Number(d))
                return WATER_MONTH_LABELS[idx] || ""
              }),
          )

        xAxis.select(".domain").remove() // Remove axis line
        xAxis
          .selectAll("text")
          .attr("font-size", "10px")
          .attr("font-family", "'Inter', -apple-system, sans-serif")
          .attr("fill", colors.text)
          .attr("font-weight", "400")

        // Add Y axis - minimal style
        const yAxis = g
          .append("g")
          .attr("transform", "translate(-8, 0)")
          .call(
            axisLeft(yScale)
              .ticks(4)
              .tickSize(0)
              .tickFormat((d) => `${d}%`),
          )

        yAxis.select(".domain").remove() // Remove axis line
        yAxis
          .selectAll("text")
          .attr("font-size", "10px")
          .attr("font-family", "'Inter', -apple-system, sans-serif")
          .attr("fill", colors.text)
          .attr("font-weight", "400")
          .attr("text-anchor", "end")

        // Add Y axis label (rotated, subtle)
        if (yAxisLabel) {
          g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -innerHeight / 2)
            .attr("y", -margin.left + 12)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("font-family", "'Inter', -apple-system, sans-serif")
            .attr("fill", colors.text)
            .attr("font-weight", "500")
            .attr("letter-spacing", "0.02em")
            .text(yAxisLabel)
        }

        // Add title if provided
        if (title) {
          g.append("text")
            .attr("x", 0)
            .attr("y", -8)
            .attr("text-anchor", "start")
            .attr("font-size", "12px")
            .attr("font-family", "'Inter', -apple-system, sans-serif")
            .attr("font-weight", "600")
            .attr("fill", colors.text)
            .text(title)
        }

        // Elegant inline legend (if enabled)
        if (showLegend) {
          const legendY = -8
          const legendItems = [
            { label: "Median", color: colors.median, type: "line" },
            { label: "30-70th", color: colors.inner, type: "rect" },
            { label: "10-90th", color: colors.outer, type: "rect" },
          ]

          let legendX = innerWidth

          legendItems.reverse().forEach((item) => {
            const itemWidth = item.label.length * 6 + 20
            legendX -= itemWidth

            const legendItem = g
              .append("g")
              .attr("transform", `translate(${legendX}, ${legendY})`)

            if (item.type === "line") {
              legendItem
                .append("line")
                .attr("x1", 0)
                .attr("x2", 12)
                .attr("y1", 0)
                .attr("y2", 0)
                .attr("stroke", item.color)
                .attr("stroke-width", 2)
                .attr("stroke-linecap", "round")
            } else {
              legendItem
                .append("rect")
                .attr("x", 0)
                .attr("y", -4)
                .attr("width", 12)
                .attr("height", 8)
                .attr("fill", item.color)
                .attr("rx", 1)
            }

            legendItem
              .append("text")
              .attr("x", 16)
              .attr("y", 0)
              .attr("dy", "0.32em")
              .attr("font-size", "9px")
              .attr("font-family", "'Inter', -apple-system, sans-serif")
              .attr("fill", colors.text)
              .attr("font-weight", "400")
              .text(item.label)
          })
        }

        // Create elegant tooltip
        const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`
        const tooltip = select("body")
          .append("div")
          .attr("id", tooltipId)
          .attr("class", "percentile-chart-tooltip")
          .style("position", "absolute")
          .style("visibility", "hidden")
          .style("background", "#fff")
          .style("border", "none")
          .style("border-radius", "6px")
          .style("padding", "12px 16px")
          .style("font-size", "12px")
          .style("font-family", "'Inter', -apple-system, sans-serif")
          .style("box-shadow", "0 4px 20px rgba(0,0,0,0.12)")
          .style("pointer-events", "none")
          .style("z-index", "1000")
          .style("min-width", "140px")
          .style("line-height", "1.5")

        // Add focus dot for hover state
        const focusDot = g
          .append("circle")
          .attr("r", 4)
          .attr("fill", colors.median)
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .style("visibility", "hidden")

        // Add vertical hover line - subtle
        const hoverLine = g
          .append("line")
          .attr("stroke", colors.hover)
          .attr("stroke-width", 1)
          .attr("stroke-opacity", 0.3)
          .style("visibility", "hidden")
          .attr("y1", 0)
          .attr("y2", innerHeight)

        // Add hover overlay
        g.append("rect")
          .attr("width", innerWidth)
          .attr("height", innerHeight)
          .attr("fill", "transparent")
          .style("cursor", "crosshair")
          .on("mousemove", (event) => {
            const [mouseX] = pointer(event)
            const monthIndex = Math.round(xScale.invert(mouseX))

            if (monthIndex >= 0 && monthIndex < 12) {
              const monthData = processedData.find(
                (d) => d.monthIndex === monthIndex,
              )

              if (monthData) {
                const xPos = xScale(monthIndex)

                hoverLine
                  .attr("x1", xPos)
                  .attr("x2", xPos)
                  .style("visibility", "visible")

                focusDot
                  .attr("cx", xPos)
                  .attr("cy", yScale(monthData.q50))
                  .style("visibility", "visible")

                tooltip
                  .style("visibility", "visible")
                  .style("left", `${event.pageX + 16}px`)
                  .style("top", `${event.pageY - 16}px`).html(`
                <div style="font-weight: 600; color: ${colors.text}; margin-bottom: 8px; font-size: 13px;">
                  ${monthData.label}
                </div>
                <div style="display: grid; grid-template-columns: auto auto; gap: 2px 12px; color: #6b7785;">
                  <span>Max</span><span style="text-align: right; font-variant-numeric: tabular-nums;">${monthData.q100.toFixed(0)}%</span>
                  <span>90th</span><span style="text-align: right; font-variant-numeric: tabular-nums;">${monthData.q90.toFixed(0)}%</span>
                  <span>70th</span><span style="text-align: right; font-variant-numeric: tabular-nums;">${monthData.q70.toFixed(0)}%</span>
                  <span style="font-weight: 600; color: ${colors.median};">Median</span><span style="text-align: right; font-weight: 600; color: ${colors.median}; font-variant-numeric: tabular-nums;">${monthData.q50.toFixed(0)}%</span>
                  <span>30th</span><span style="text-align: right; font-variant-numeric: tabular-nums;">${monthData.q30.toFixed(0)}%</span>
                  <span>10th</span><span style="text-align: right; font-variant-numeric: tabular-nums;">${monthData.q10.toFixed(0)}%</span>
                  <span>Min</span><span style="text-align: right; font-variant-numeric: tabular-nums;">${monthData.q0.toFixed(0)}%</span>
                </div>
              `)
              }
            }
          })
          .on("mouseout", () => {
            hoverLine.style("visibility", "hidden")
            focusDot.style("visibility", "hidden")
            tooltip.style("visibility", "hidden")
          })

        return tooltipId
      },
      [data, title, yAxisLabel, showMean, colors, margin, showLegend],
    )

    useEffect(() => {
      if (currentWidth > 0 && currentHeight > 0) {
        const tooltipId = updateChart(currentWidth, currentHeight)
        return () => {
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
          minHeight: responsive ? "200px" : undefined,
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

PercentileBandChart.displayName = "PercentileBandChart"

export default PercentileBandChart
