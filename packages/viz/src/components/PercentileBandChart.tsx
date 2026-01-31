"use client"

/**
 * PercentileBandChart - D3-based percentile band visualization
 *
 * Displays monthly percentile bands showing distribution of values
 * across water years. Used for reservoir storage percentile charts.
 *
 * Water months: 1=October, 2=November, ..., 12=September
 */

import React, { useRef, useEffect, useState } from "react"
import * as d3 from "d3"
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
  /** Color scheme for bands (defaults to blues) */
  colorScheme?: "blues" | "greens" | "oranges" | string
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

// Color schemes for bands
interface ColorScheme {
  outer: string
  inner: string
  median: string
  mean: string
}

// Default color scheme (blues)
const DEFAULT_COLOR_SCHEME: ColorScheme = {
  outer: "rgba(66, 133, 244, 0.2)", // q10-q90
  inner: "rgba(66, 133, 244, 0.4)", // q30-q70
  median: "#1a73e8", // q50 line
  mean: "#5f6368", // mean line (gray)
}

const COLOR_SCHEMES: Record<string, ColorScheme> = {
  blues: DEFAULT_COLOR_SCHEME,
  greens: {
    outer: "rgba(52, 168, 83, 0.2)",
    inner: "rgba(52, 168, 83, 0.4)",
    median: "#1e8e3e",
    mean: "#5f6368",
  },
  oranges: {
    outer: "rgba(251, 188, 4, 0.2)",
    inner: "rgba(251, 188, 4, 0.4)",
    median: "#f9ab00",
    mean: "#5f6368",
  },
}

const PercentileBandChart: React.FC<PercentileBandChartProps> = ({
  data,
  title = "",
  yAxisLabel = "% of Capacity",
  showMean = false,
  colorScheme = "blues",
  responsive = true,
  width = 400,
  height = 250,
  margin = { top: 30, right: 20, bottom: 40, left: 50 },
  showLegend = true,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dimensions = useResizeObserver(
    containerRef as React.RefObject<HTMLElement>,
  )
  const [currentWidth, setCurrentWidth] = useState(width)
  const [currentHeight, setCurrentHeight] = useState(height)

  // Get colors for the scheme (with guaranteed fallback)
  const colors: ColorScheme = COLOR_SCHEMES[colorScheme] ?? DEFAULT_COLOR_SCHEME

  // Process data into array sorted by water month
  const processData = (rawData: MonthlyPercentiles) => {
    const result: Array<{ monthIndex: number; label: string } & PercentileValues> = []

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

  // Draw chart
  useEffect(() => {
    // Handle responsive sizing
    if (responsive && dimensions) {
      setCurrentWidth(dimensions.width)
      setCurrentHeight(dimensions.height)
    } else {
      setCurrentWidth(width)
      setCurrentHeight(height)
    }

    if (!svgRef.current || !data) return

    // Process the data
    const processedData = processData(data)
    if (processedData.length === 0) return

    // Clear previous chart
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    // Set chart dimensions
    const innerWidth = currentWidth - margin.left - margin.right
    const innerHeight = currentHeight - margin.top - margin.bottom

    if (innerWidth <= 0 || innerHeight <= 0) return

    // Create scales
    const xScale = d3
      .scaleLinear()
      .domain([0, 11])
      .range([0, innerWidth])

    const yScale = d3
      .scaleLinear()
      .domain([0, 100]) // Percent of capacity: 0-100%
      .range([innerHeight, 0])

    // Create main group element
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // Add title
    if (title) {
      g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "0.9em")
        .attr("font-weight", "600")
        .attr("fill", "#202124")
        .text(title)
    }

    // Add grid lines
    g.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data([0, 25, 50, 75, 100])
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 1)

    // Create area generators for bands
    const outerArea = d3
      .area<typeof processedData[0]>()
      .x((d) => xScale(d.monthIndex))
      .y0((d) => yScale(d.q10))
      .y1((d) => yScale(d.q90))
      .curve(d3.curveMonotoneX)

    const innerArea = d3
      .area<typeof processedData[0]>()
      .x((d) => xScale(d.monthIndex))
      .y0((d) => yScale(d.q30))
      .y1((d) => yScale(d.q70))
      .curve(d3.curveMonotoneX)

    // Create line generators
    const medianLine = d3
      .line<typeof processedData[0]>()
      .x((d) => xScale(d.monthIndex))
      .y((d) => yScale(d.q50))
      .curve(d3.curveMonotoneX)

    const meanLine = d3
      .line<typeof processedData[0]>()
      .x((d) => xScale(d.monthIndex))
      .y((d) => yScale(d.mean))
      .curve(d3.curveMonotoneX)

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

    // Draw median line (q50)
    g.append("path")
      .datum(processedData)
      .attr("fill", "none")
      .attr("stroke", colors.median)
      .attr("stroke-width", 2)
      .attr("d", medianLine)

    // Draw mean line (optional, dashed)
    if (showMean) {
      g.append("path")
        .datum(processedData)
        .attr("fill", "none")
        .attr("stroke", colors.mean)
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "4,4")
        .attr("d", meanLine)
    }

    // Add X axis
    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(12)
          .tickFormat((d) => {
            const idx = Math.round(Number(d))
            return WATER_MONTH_LABELS[idx] || ""
          }),
      )

    xAxis.selectAll("line").attr("stroke", "#bdbdbd")
    xAxis.selectAll("path").attr("stroke", "#bdbdbd")
    xAxis
      .selectAll("text")
      .attr("font-size", "0.7em")
      .attr("fill", "#5f6368")

    // Add Y axis
    const yAxis = g.append("g").call(
      d3
        .axisLeft(yScale)
        .ticks(5)
        .tickFormat((d) => `${d}%`),
    )

    yAxis.selectAll("line").attr("stroke", "#bdbdbd")
    yAxis.selectAll("path").attr("stroke", "#bdbdbd")
    yAxis
      .selectAll("text")
      .attr("font-size", "0.7em")
      .attr("fill", "#5f6368")

    // Add Y axis label
    if (yAxisLabel) {
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "0.75em")
        .attr("fill", "#5f6368")
        .text(yAxisLabel)
    }

    // Add legend
    if (showLegend) {
      const legendData = [
        { label: "10th-90th percentile", color: colors.outer, type: "rect" },
        { label: "30th-70th percentile", color: colors.inner, type: "rect" },
        { label: "Median (50th)", color: colors.median, type: "line" },
        ...(showMean
          ? [{ label: "Mean", color: colors.mean, type: "dashed" }]
          : []),
      ]

      const legend = g
        .append("g")
        .attr("transform", `translate(${innerWidth - 120}, 0)`)

      legendData.forEach((item, i) => {
        const legendItem = legend
          .append("g")
          .attr("transform", `translate(0, ${i * 14})`)

        if (item.type === "rect") {
          legendItem
            .append("rect")
            .attr("width", 12)
            .attr("height", 8)
            .attr("fill", item.color)
        } else if (item.type === "line") {
          legendItem
            .append("line")
            .attr("x1", 0)
            .attr("x2", 12)
            .attr("y1", 4)
            .attr("y2", 4)
            .attr("stroke", item.color)
            .attr("stroke-width", 2)
        } else if (item.type === "dashed") {
          legendItem
            .append("line")
            .attr("x1", 0)
            .attr("x2", 12)
            .attr("y1", 4)
            .attr("y2", 4)
            .attr("stroke", item.color)
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "3,3")
        }

        legendItem
          .append("text")
          .attr("x", 16)
          .attr("y", 4)
          .attr("dy", "0.35em")
          .attr("font-size", "0.6em")
          .attr("fill", "#5f6368")
          .text(item.label)
      })
    }

    // Add invisible overlay for tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "percentile-chart-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(255, 255, 255, 0.95)")
      .style("border", "1px solid #dadce0")
      .style("border-radius", "4px")
      .style("padding", "8px 12px")
      .style("font-size", "12px")
      .style("box-shadow", "0 2px 6px rgba(0,0,0,0.15)")
      .style("pointer-events", "none")
      .style("z-index", "1000")

    // Add vertical hover line
    const hoverLine = g
      .append("line")
      .attr("stroke", "#5f6368")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4")
      .style("visibility", "hidden")
      .attr("y1", 0)
      .attr("y2", innerHeight)

    // Add hover overlay
    g.append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "transparent")
      .on("mousemove", (event) => {
        const [mouseX] = d3.pointer(event)
        const monthIndex = Math.round(xScale.invert(mouseX))

        if (monthIndex >= 0 && monthIndex < 12) {
          const monthData = processedData.find((d) => d.monthIndex === monthIndex)

          if (monthData) {
            hoverLine
              .attr("x1", xScale(monthIndex))
              .attr("x2", xScale(monthIndex))
              .style("visibility", "visible")

            tooltip
              .style("visibility", "visible")
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 10}px`)
              .html(
                `<strong>${monthData.label}</strong><br/>
                Max: ${monthData.q100.toFixed(1)}%<br/>
                90th: ${monthData.q90.toFixed(1)}%<br/>
                70th: ${monthData.q70.toFixed(1)}%<br/>
                <strong>Median: ${monthData.q50.toFixed(1)}%</strong><br/>
                30th: ${monthData.q30.toFixed(1)}%<br/>
                10th: ${monthData.q10.toFixed(1)}%<br/>
                Min: ${monthData.q0.toFixed(1)}%<br/>
                Mean: ${monthData.mean.toFixed(1)}%`,
              )
          }
        }
      })
      .on("mouseout", () => {
        hoverLine.style("visibility", "hidden")
        tooltip.style("visibility", "hidden")
      })

    // Cleanup tooltip on unmount
    return () => {
      d3.select(".percentile-chart-tooltip").remove()
    }
  }, [
    data,
    title,
    yAxisLabel,
    showMean,
    colors,
    currentWidth,
    currentHeight,
    margin,
    showLegend,
    responsive,
    dimensions,
    width,
    height,
  ])

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
}

export default React.memo(PercentileBandChart)
