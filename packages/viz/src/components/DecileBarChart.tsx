"use client"
// mockup for now
import React, { useRef, useEffect, useMemo } from "react"
import * as d3 from "d3"
import { DecileChartProps, DecileData } from "../types"
import {
  parseDecileData,
  createDecileColorScale,
  calculateChartDimensions,
  formatValue,
} from "../utils/d3-utils"

const defaultMargin = { top: 40, right: 30, bottom: 50, left: 60 }

export const DecileBarChart: React.FC<DecileChartProps> = ({
  data,
  width = 60,
  height = 280,
  margin = defaultMargin,
  title = "Decile Distribution",
  xAxisLabel = "",
  yAxisLabel = "Value",
  colorScheme = "blues",
  showValues = true,
  showLegend = true,
  compact = false,
  showTickLabels = true,
  axisColor = "#999",
  responsive = true,
  barWidthPixels = 30,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Parse data
  const decileData: DecileData[] = useMemo(() => {
    try {
      return parseDecileData(data)
    } catch (err) {
      console.error("Error parsing decile data:", err)
      return []
    }
  }, [data])

  // Create visualization
  useEffect(() => {
    if (!svgRef.current) return

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove()

    // If no data, show a message
    if (decileData.length === 0) {
      const svg = d3
        .select(svgRef.current)
        .attr("width", width)
        .attr("height", height)

      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("fill", "#999")
        .text("No data available")

      return
    }

    // Get dimensions from container (for responsive)
    let chartWidth = width
    const chartHeight = height

    if (responsive && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth
      chartWidth = containerWidth > 0 ? containerWidth : width
    }

    // Calculate dimensions
    const { innerWidth, innerHeight } = calculateChartDimensions(
      chartWidth,
      chartHeight,
      margin,
    )

    // Create SVG element
    const svg = d3
      .select(svgRef.current)
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // Sort data by decile
    const sortedData = [...decileData].sort((a, b) => a.decile - b.decile)

    // Get max value for scaling
    const maxValue = d3.max(sortedData, (d) => d.value) || 100

    // Update barWidth calculation to use fixed pixel width
    const barWidth = Math.min(barWidthPixels, innerWidth * 0.8) // Use fixed pixel width but limit to 80% of inner width
    const barX = (innerWidth - barWidth) / 2 // Center the bar

    // Create Y scale
    const y = d3
      .scaleLinear()
      .domain([0, maxValue * 1.05]) // Add 5% padding at top
      .nice()
      .range([innerHeight, 0])

    // Create color scale for segments
    const colorScale = createDecileColorScale(colorScheme, sortedData.length)

    // Create a container for segments
    const segmentsGroup = svg.append("g").attr("class", "segments")

    // Add a faint grid
    svg
      .append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(y.ticks(5))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => y(d))
      .attr("y2", (d) => y(d))
      .attr("stroke", "#eee")
      .attr("stroke-width", 1)

    // Draw the bar segments (from bottom to top)
    for (let i = 0; i < sortedData.length; i++) {
      const current = sortedData[i]
      if (!current) continue // Skip if undefined

      // For first decile, use 0 as the base
      const prevValue = i > 0 ? (sortedData[i - 1]?.value ?? 0) : 0

      // Calculate segment height based on the difference between current and previous values
      const segmentHeight = Math.max(0, y(prevValue) - y(current.value))

      // Draw segment
      segmentsGroup
        .append("rect")
        .attr("x", barX)
        .attr("y", y(current.value))
        .attr("width", barWidth)
        .attr("height", segmentHeight)
        .attr("fill", colorScale(sortedData.length - current.decile + 1)) // Reverse the color scale
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .attr("data-decile", current.decile)
        .attr("data-value", current.value)
        .on("mouseover", function () {
          d3.select(this).attr("stroke", "#333").attr("stroke-width", 2)
        })
        .on("mouseout", function () {
          d3.select(this).attr("stroke", "white").attr("stroke-width", 1)
        })

      // Add value labels if enabled
      if (showValues) {
        const labelY = y(current.value) + (i > 0 ? segmentHeight / 2 : 10)

        // Add line connecting to label
        svg
          .append("line")
          .attr("x1", barX + barWidth)
          .attr("x2", barX + barWidth + 15)
          .attr("y1", labelY)
          .attr("y2", labelY)
          .attr("stroke", "#999")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "3,2")

        svg
          .append("text")
          .attr("x", barX + barWidth + 20)
          .attr("y", labelY)
          .attr("dy", "0.35em")
          .attr("text-anchor", "start")
          .attr("font-size", "10px")
          .attr("fill", "#555")
          .text(`D${current.decile}: ${formatValue(current.value)}`)
      }

      // Add decile markers on the left side (only if tick labels are shown)
      if (showTickLabels) {
        svg
          .append("line")
          .attr("x1", barX - 10)
          .attr("x2", barX)
          .attr("y1", y(current.value))
          .attr("y2", y(current.value))
          .attr("stroke", axisColor)
          .attr("stroke-width", 1)

        svg
          .append("text")
          .attr("x", barX - 12)
          .attr("y", y(current.value))
          .attr("dy", "0.35em")
          .attr("text-anchor", "end")
          .attr("font-size", "10px")
          .attr("fill", axisColor)
          .attr("font-weight", "bold")
          .text(`D${current.decile}`)
      }
    }

    // Add a baseline
    svg
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", innerHeight)
      .attr("y2", innerHeight)
      .attr("stroke", axisColor)
      .attr("stroke-width", 1)

    // Add Y axis
    const yAxisGroup = svg.append("g").call(
      d3
        .axisLeft(y)
        .ticks(5)
        .tickFormat(
          showTickLabels ? (d) => formatValue(d as number) : () => "",
        ),
    )

    yAxisGroup
      .selectAll("text")
      .attr("font-size", "10px")
      .attr("fill", axisColor)

    yAxisGroup.selectAll("line").attr("stroke", axisColor)

    yAxisGroup.select(".domain").attr("stroke", axisColor)

    // Add Y axis label
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 15)
      .attr("x", -innerHeight / 2)
      .attr("fill", "currentColor")
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .attr("font-size", "12px")
      .text(yAxisLabel)

    // Add title
    svg
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text(title)

    // Add legend (conditional)
    if (!compact && showLegend) {
      const legendX = 0
      const legendY = innerHeight + 25

      // Add legend title
      svg
        .append("text")
        .attr("x", legendX)
        .attr("y", legendY - 10)
        .attr("text-anchor", "start")
        .attr("font-size", "11px")
        .attr("font-weight", "bold")
        .text("Legend:")

      // Add legend items with clear groupings
      const legendItems = [
        { decile: 1, label: "D1 (10th percentile)" },
        { decile: 3, label: "D3 (30th percentile)" },
        { decile: 5, label: "D5 (50th percentile)" },
        { decile: 7, label: "D7 (70th percentile)" },
        { decile: 9, label: "D9 (90th percentile)" },
      ]

      // Create two columns for legend items
      const itemsPerColumn = 3
      const columnWidth = innerWidth / 2

      legendItems.forEach((item, i) => {
        const column = Math.floor(i / itemsPerColumn)
        const row = i % itemsPerColumn

        svg
          .append("rect")
          .attr("x", legendX + column * columnWidth)
          .attr("y", legendY + row * 15)
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", colorScale(sortedData.length - item.decile + 1)) // Reverse the color scale in legend too
          .attr("stroke", "white")
          .attr("stroke-width", 0.5)

        svg
          .append("text")
          .attr("x", legendX + column * columnWidth + 18)
          .attr("y", legendY + row * 15 + 6)
          .attr("dy", "0.35em")
          .attr("text-anchor", "start")
          .attr("font-size", "10px")
          .text(item.label)
      })
    }
  }, [
    data,
    decileData,
    width,
    height,
    margin,
    title,
    xAxisLabel,
    yAxisLabel,
    colorScheme,
    showValues,
    showLegend,
    compact,
    showTickLabels,
    axisColor,
    responsive,
    barWidthPixels,
  ])

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        minHeight: "260px",
      }}
    >
      <svg
        ref={svgRef}
        style={{
          width: responsive ? "100%" : width,
          height: responsive ? "100%" : height,
          aspectRatio: responsive ? `${width} / ${height}` : "auto",
          display: "block",
          overflow: "visible",
        }}
      />
    </div>
  )
}

export default DecileBarChart
