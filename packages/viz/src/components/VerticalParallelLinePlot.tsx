import React, { useRef, useEffect, useState } from "react"
import * as d3 from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"

export interface VerticalParallelLineData {
  id: string
  name: string
  values: Record<string, number>
  highlighted?: boolean
}

export interface VerticalParallelLinePlotProps {
  data: VerticalParallelLineData[]
  axes: string[]
  title?: string
  responsive?: boolean
  width?: number
  height?: number
  margin?: { top: number; right: number; bottom: number; left: number }
  colors?: {
    default: string
    highlighted: string
    background: string
  }
  lineColors?: string[] // Array of colors for individual lines
  showBaseline?: boolean
  baselineData?: VerticalParallelLineData
  onLineHover?: (data: VerticalParallelLineData | null) => void
  onLineClick?: (data: VerticalParallelLineData) => void
}

const VerticalParallelLinePlot: React.FC<VerticalParallelLinePlotProps> = ({
  data,
  axes,
  title = "",
  responsive = true,
  width = 400, // Default
  height = 400, // Default height
  margin = { top: 40, right: 20, bottom: 50, left: 100 },
  colors = {
    default: "#1f77b4",
    highlighted: "#ff7f0e",
    background: "#f8f9fa",
  },
  lineColors = [], // Default to empty array
  showBaseline = false,
  baselineData,
  onLineHover,
  onLineClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dimensions = useResizeObserver(
    containerRef as React.RefObject<HTMLElement>,
  )
  const [currentWidth, setCurrentWidth] = useState(width)
  const [currentHeight, setCurrentHeight] = useState(height)

  // Handle responsive sizing
  useEffect(() => {
    if (responsive && dimensions) {
      // Use full available width and height from container
      setCurrentWidth(dimensions.width || width)
      setCurrentHeight(dimensions.height || height)
    } else {
      // Use default dimensions if not responsive
      setCurrentWidth(width)
      setCurrentHeight(height)
    }
  }, [dimensions, responsive, width, height])

  useEffect(() => {
    if (!data || data.length === 0 || !axes || axes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const innerWidth = currentWidth - margin.left - margin.right
    const innerHeight = currentHeight - margin.top - margin.bottom

    // Create scales for each axis (horizontal orientation)
    // Use consistent scale across all axes: -1 to 1
    const scales: Record<string, d3.ScaleLinear<number, number>> = {}
    axes.forEach((axis) => {
      scales[axis] = d3
        .scaleLinear()
        .domain([-1, 1]) // Fixed domain for all axes
        .range([0, innerWidth]) // Horizontal range
    })

    // Position scales along y-axis (stacked vertically) for maximum spacing between axes
    const yScale = d3
      .scalePoint()
      .domain(axes)
      .range([0, innerHeight])
      .padding(0) // Use full height for maximum axis spacing

    // Create main group
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // Add background
    g.append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", colors.background)
      .attr("opacity", 0.1)
      .attr("rx", 4)

    // Create scenario range bands (hidden by default, shown on hover)
    const scenarioRangeGroup = g.append("g").attr("class", "scenario-ranges")

    // Function to show scenario range for a specific scenario
    const showScenarioRange = (
      scenario: VerticalParallelLineData,
      dataIndex: number,
    ) => {
      // Clear existing ranges
      scenarioRangeGroup.selectAll("*").remove()

      axes.forEach((axis) => {
        const value = scenario.values[axis] ?? 0
        const yPos = yScale(axis)! - 4
        const bandHeight = 12
        const xPos = scales[axis]!(value)
        const bandWidth = 8 // Small band around the specific value

        scenarioRangeGroup
          .append("rect")
          .attr("x", xPos - bandWidth / 2)
          .attr("y", yPos - (bandHeight - 8) / 2)
          .attr("width", bandWidth)
          .attr("height", bandHeight)
          .attr(
            "fill",
            lineColors.length > dataIndex
              ? lineColors[dataIndex]!
              : colors.default,
          )
          .attr("opacity", 0.3)
          .attr("rx", 3)
      })
    }

    // Function to hide scenario ranges
    const hideScenarioRange = () => {
      scenarioRangeGroup.selectAll("*").remove()
    }

    // Draw horizontal axes
    axes.forEach((axis) => {
      const yPos = yScale(axis)!

      // Horizontal axis line
      g.append("line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", yPos)
        .attr("y2", yPos)
        .attr("stroke", "#666")
        .attr("stroke-width", 2)

      // Axis label with text wrapping
      const words = axis.split(/\s+/)
      const lineHeight = 14 // pixels
      const maxWordsPerLine = 1 // One word per line for better wrapping

      // Group words into lines
      const lines = []
      for (let i = 0; i < words.length; i += maxWordsPerLine) {
        lines.push(words.slice(i, i + maxWordsPerLine).join(" "))
      }

      // Create text element for each line
      lines.forEach((line, index) => {
        g.append("text")
          .attr("x", -10)
          .attr("y", yPos + 4 + (index - (lines.length - 1) / 2) * lineHeight) // Center multi-line text vertically
          .attr("text-anchor", "end") // Right align text
          .attr("font-size", "12px")
          .attr("font-weight", "500")
          .attr("fill", "#333")
          .text(line)
      })

      // Tick marks and labels
      const scale = scales[axis]
      if (!scale) return
      const ticks = [-1, -0.5, 0, 0.5, 1]

      ticks.forEach((tick) => {
        const xPos = scale(tick)

        // Tick mark
        g.append("line")
          .attr("x1", xPos)
          .attr("x2", xPos)
          .attr("y1", yPos - 5)
          .attr("y2", yPos + 5)
          .attr("stroke", "#666")
          .attr("stroke-width", 1)

        // Tick label
        g.append("text")
          .attr("x", xPos)
          .attr("y", yPos - 10)
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .attr("fill", "#666")
          .text(tick.toString()) // Show exact values including -0.5 and 0.5
      })
    })

    // Line generator (for horizontal axes)
    const line = d3
      .line<[string, number]>()
      .x((d) => scales[d[0]]?.(d[1]) ?? 0) // Value position on horizontal axis
      .y((d) => yScale(d[0])!) // Axis position vertically
    // No curve - use straight angular lines

    // Draw baseline if provided
    if (showBaseline && baselineData) {
      const baselinePoints: [string, number][] = axes.map((axis) => [
        axis,
        baselineData.values[axis] || 0,
      ])

      g.append("path")
        .datum(baselinePoints)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "#333")
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", "5,5")
        .attr("opacity", 0.8)
    }

    // Draw data lines
    const lines = g
      .selectAll(".data-line")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "data-line")

    lines
      .append("path")
      .attr("class", "data-path") // Add class for debugging
      .attr("d", (d) => {
        const points: [string, number][] = axes.map((axis) => [
          axis,
          d.values[axis] || 0,
        ])
        return line(points)
      })
      .attr("fill", "none")
      .attr("stroke", (d, i) => {
        if (d.highlighted) return colors.highlighted
        return lineColors.length > i ? lineColors[i]! : colors.default
      })
      .attr("stroke-width", (d) => (d.highlighted ? 2.5 : 1.5))
      .attr("opacity", (d) => (d.highlighted ? 0.9 : 0.2)) // Transparent data lines
      .style("cursor", "pointer")
      .on("mouseover", function (_event, d) {
        const dataIndex = data.findIndex((item) => item.id === d.id)

        // Highlight line on hover
        d3.select(this).attr("stroke-width", 3).attr("opacity", 1)

        // Highlight all corresponding circles
        g.selectAll("circle")
          .filter(
            (circleData) =>
              (circleData as VerticalParallelLineData).id === d.id,
          )
          .attr("r", d.highlighted ? 6 : 5)
          .attr("opacity", 1)

        // Show scenario range
        showScenarioRange(d, dataIndex)

        onLineHover?.(d)
      })
      .on("mouseout", function (_event, d) {
        // Reset line style
        d3.select(this)
          .attr("stroke-width", d.highlighted ? 2.5 : 1.5)
          .attr("opacity", d.highlighted ? 0.9 : 0.2)

        // Reset all corresponding circles
        g.selectAll("circle")
          .filter(
            (circleData) =>
              (circleData as VerticalParallelLineData).id === d.id,
          )
          .attr("r", d.highlighted ? 5 : 4)
          .attr("opacity", d.highlighted ? 1 : 0.8)

        // Hide scenario range
        hideScenarioRange()

        onLineHover?.(null)
      })
      .on("click", function (_event, d) {
        onLineClick?.(d)
      })

    // Draw circles at all intersection points
    data.forEach((d, dataIndex) => {
      axes.forEach((axis) => {
        g.append("circle")
          .datum(d) // Store data reference for filtering
          .attr("cx", scales[axis]?.(d.values[axis] || 0) ?? 0) // Value position on horizontal axis
          .attr("cy", yScale(axis)!) // Axis position vertically
          .attr("r", d.highlighted ? 5 : 4) // Larger circles for highlighted lines
          .attr("fill", () => {
            if (d.highlighted) return colors.highlighted
            return lineColors.length > dataIndex
              ? lineColors[dataIndex]!
              : colors.default
          })
          .attr("stroke", "white")
          .attr("stroke-width", 1.5)
          .attr("opacity", d.highlighted ? 1 : 0.8)
          .style("cursor", "pointer")
          .on("mouseover", function () {
            onLineHover?.(d)
            // Make both circle and corresponding line fully opaque
            d3.select(this)
              .attr("r", d.highlighted ? 6 : 5)
              .attr("opacity", 1)
            // Find and highlight the corresponding line
            g.selectAll(".data-line path")
              .filter(
                (lineData) =>
                  (lineData as VerticalParallelLineData).id === d.id,
              )
              .attr("stroke-width", 3)
              .attr("opacity", 1)

            // Show scenario range
            showScenarioRange(d, dataIndex)
          })
          .on("mouseout", function () {
            onLineHover?.(null)
            // Reset circle
            d3.select(this)
              .attr("r", d.highlighted ? 5 : 4)
              .attr("opacity", d.highlighted ? 1 : 0.8)
            // Reset corresponding line
            g.selectAll(".data-line path")
              .filter(
                (lineData) =>
                  (lineData as VerticalParallelLineData).id === d.id,
              )
              .attr("stroke-width", d.highlighted ? 2.5 : 1.5)
              .attr("opacity", d.highlighted ? 0.9 : 0.2)

            // Hide scenario range
            hideScenarioRange()
          })
          .on("click", function () {
            onLineClick?.(d)
          })
      })
    })

    // Add title if provided
    if (title) {
      svg
        .append("text")
        .attr("x", currentWidth / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "600")
        .attr("fill", "#333")
        .text(title)
    }

    // 👉 Add legend explaining band meaning
    const legendGroup = svg.append("g")
    const legendX = currentWidth - margin.right - 120
    const legendY = margin.top - 10

    legendGroup
      .append("rect")
      .attr("x", legendX)
      .attr("y", legendY)
      .attr("width", 18)
      .attr("height", 10)
      .attr("fill", colors.default)
      .attr("opacity", 0.25)
      .attr("rx", 2)

    legendGroup
      .append("text")
      .attr("x", legendX + 24)
      .attr("y", legendY + 9)
      .attr("font-size", "12px")
      .attr("fill", "#333")
      .text("Scenario range")
  }, [
    data,
    axes,
    currentWidth,
    currentHeight,
    margin,
    colors,
    lineColors,
    showBaseline,
    baselineData,
    title,
    onLineHover,
    onLineClick,
  ])

  return (
    <div
      ref={containerRef}
      style={{
        width: responsive ? "100%" : currentWidth,
        height: responsive ? "100%" : currentHeight,
        minHeight: 300,
      }}
    >
      <svg
        ref={svgRef}
        width={currentWidth}
        height={currentHeight}
        style={{ display: "block" }}
      />
    </div>
  )
}

export default React.memo(VerticalParallelLinePlot)
