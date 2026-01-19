"use client"

import React, { useRef, useEffect, useState } from "react"
import * as d3 from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"

export interface MonthlyData {
  [key: string]: number // Month number (1-12) to value
}

export interface LineChartData {
  overall: MonthlyData
  dry: MonthlyData
  wet: MonthlyData
}

export interface LineChartProps {
  data: LineChartData
  title?: string
  subtitle?: string
  xAxisLabel?: string
  yAxisLabel?: string
  responsive?: boolean
  width?: number
  height?: number
  margin?: { top: number; right: number; bottom: number; left: number }
  showLegend?: boolean
  colors?: string[]
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  title = "",
  subtitle = "",
  xAxisLabel = "Month",
  yAxisLabel = "",
  responsive = true,
  width = 600,
  height = 400,
  margin = { top: 40, right: 30, bottom: 50, left: 60 },
  showLegend = true,
  colors = ["#4d79a8", "#e15759", "#76b7b2"],
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dimensions = useResizeObserver(
    containerRef as React.RefObject<HTMLElement>,
  )
  const [currentWidth, setCurrentWidth] = useState(width)
  const [currentHeight, setCurrentHeight] = useState(height)

  // Convert the data format to a more D3-friendly structure
  const processData = (data: LineChartData) => {
    // Water year order: Oct, Nov, Dec, Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep
    const waterYearMonths = [
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

    // Month number to water year index mapping (1=Jan → 3, 10=Oct → 0)
    const monthToWaterYearIndex: { [key: string]: number } = {
      "10": 0,
      "11": 1,
      "12": 2, // Oct, Nov, Dec
      "1": 3,
      "2": 4,
      "3": 5,
      "4": 6,
      "5": 7,
      "6": 8,
      "7": 9,
      "8": 10,
      "9": 11, // Jan to Sep
    }

    const result: Array<{
      month: string
      monthIndex: number
      waterYearIndex: number
      overall: number
      dry: number
      wet: number
    }> = []

    // Add data for each month in calendar order first
    for (let i = 1; i <= 12; i++) {
      const monthStr = i.toString()
      const waterYearIdx = monthToWaterYearIndex[monthStr] || 0

      result.push({
        month: waterYearMonths[waterYearIdx] || "Unknown",
        monthIndex: i,
        waterYearIndex: waterYearIdx,
        overall: data.overall[monthStr] || 0,
        dry: data.dry[monthStr] || 0,
        wet: data.wet[monthStr] || 0,
      })
    }

    // Sort by water year order
    result.sort((a, b) => a.waterYearIndex - b.waterYearIndex)

    return result
  }

  // Draw chart
  useEffect(() => {
    // Use responsive dimensions if available and responsive is true
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

    // Clear previous chart
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    // Set chart dimensions
    const innerWidth = currentWidth - margin.left - margin.right
    const innerHeight = currentHeight - margin.top - margin.bottom

    // Create scales
    const xScale = d3
      .scaleLinear()
      .domain([0, 11]) // 0-11 for water year months
      .range([0, innerWidth])

    // Find max value across all series to set y scale
    const maxValue = Math.max(
      d3.max(processedData, (d) => d.overall) || 0,
      d3.max(processedData, (d) => d.dry) || 0,
      d3.max(processedData, (d) => d.wet) || 0,
    )

    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue * 1.1]) // Add 10% padding
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
        .attr("font-size", "1.2em")
        .attr("font-weight", "bold")
        .text(title)
    }

    // Add subtitle
    if (subtitle) {
      g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", -margin.top / 2 + 20)
        .attr("text-anchor", "middle")
        .attr("font-size", "0.9em")
        .text(subtitle)
    }

    // Add X axis with month labels in water year order
    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(12)
          .tickFormat((d) => {
            const idx = Math.round(Number(d))
            if (idx >= 0 && idx < 12) {
              return (
                [
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
                ][idx] || ""
              )
            }
            return ""
          }),
      )

    // Style the x-axis
    xAxis.selectAll("line").attr("stroke", "#ccc")
    xAxis.selectAll("path").attr("stroke", "#ccc")
    xAxis.selectAll("text").attr("font-size", "0.8em")

    // Add X axis label
    if (xAxisLabel) {
      g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .text(xAxisLabel)
    }

    // Add Y axis
    const yAxis = g.append("g").call(d3.axisLeft(yScale))

    // Style the y-axis
    yAxis.selectAll("line").attr("stroke", "#ccc")
    yAxis.selectAll("path").attr("stroke", "#ccc")
    yAxis.selectAll("text").attr("font-size", "0.8em")

    // Add Y axis label
    if (yAxisLabel) {
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .text(yAxisLabel)
    }

    // Add grid lines
    g.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(yScale.ticks())
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "#e0e0e0")
      .attr("stroke-dasharray", "3,3")

    // Create line generators
    const line = d3
      .line<{ waterYearIndex: number; value: number }>()
      .x((d) => xScale(d.waterYearIndex))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX) // Smoothed line

    // Define series
    const series = [
      { name: "Overall", color: colors[0], key: "overall" },
      { name: "Dry", color: colors[1], key: "dry" },
      { name: "Wet", color: colors[2], key: "wet" },
    ]

    // Draw lines
    series.forEach((s) => {
      // Create data points for this series
      const seriesData = processedData.map((d) => ({
        waterYearIndex: d.waterYearIndex,
        value: d[s.key as keyof typeof d] as number,
      }))

      // Draw line
      g.append("path")
        .datum(seriesData)
        .attr("fill", "none")
        .attr("stroke", s.color || "#000")
        .attr("stroke-width", 2.5)
        .attr("d", line)

      // Add dots
      g.selectAll(`.dot-${s.key}`)
        .data(seriesData)
        .enter()
        .append("circle")
        .attr("class", `dot-${s.key}`)
        .attr("cx", (d) => xScale(d.waterYearIndex))
        .attr("cy", (d) => yScale(d.value))
        .attr("r", 4)
        .attr("fill", s.color || "#000")
        .append("title")
        .text((d) => `${s.name}: ${d.value.toFixed(1)}`)
    })

    // Add legend if enabled
    if (showLegend) {
      const legend = g
        .append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "start")
        .selectAll("g")
        .data(series)
        .enter()
        .append("g")
        .attr("transform", (d, i) => `translate(0,${i * 20})`)

      legend
        .append("rect")
        .attr("x", innerWidth - 19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", (d) => d.color || "#000")

      legend
        .append("text")
        .attr("x", innerWidth - 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .attr("text-anchor", "end")
        .text((d) => d.name)
    }
  }, [
    data,
    title,
    subtitle,
    xAxisLabel,
    yAxisLabel,
    currentWidth,
    currentHeight,
    margin,
    colors,
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

export default LineChart
