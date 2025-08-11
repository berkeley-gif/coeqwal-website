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
      .attr("opacity", (d) => (d.highlighted ? 0.9 : 0.6))
      .style("cursor", "pointer")
      .on("mouseover", function (_event, d) {
        // Highlight line on hover
        d3.select(this).attr("stroke-width", 3).attr("opacity", 1)

        onLineHover?.(d)
      })
      .on("mouseout", function (_event, d) {
        // Reset line style
        d3.select(this)
          .attr("stroke-width", d.highlighted ? 2.5 : 1.5)
          .attr("opacity", d.highlighted ? 0.9 : 0.6)

        onLineHover?.(null)
      })
      .on("click", function (_event, d) {
        onLineClick?.(d)
      })

    // Draw circles at all intersection points
    data.forEach((d, dataIndex) => {
      axes.forEach((axis) => {
        g.append("circle")
          .attr("cx", scales[axis]?.(d.values[axis] || 0) ?? 0) // Value position on horizontal axis
          .attr("cy", yScale(axis)!) // Axis position vertically
          .attr("r", d.highlighted ? 4 : 3) // Larger circles for highlighted lines
          .attr("fill", () => {
            if (d.highlighted) return colors.highlighted
            return lineColors.length > dataIndex
              ? lineColors[dataIndex]!
              : colors.default
          })
          .attr("stroke", "white")
          .attr("stroke-width", 1.5)
          .style("cursor", "pointer")
          .on("mouseover", function () {
            onLineHover?.(d)
            d3.select(this).attr("r", d.highlighted ? 5 : 4) // Grow on hover
          })
          .on("mouseout", function () {
            onLineHover?.(null)
            d3.select(this).attr("r", d.highlighted ? 4 : 3) // Return to normal size
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

export default VerticalParallelLinePlot
