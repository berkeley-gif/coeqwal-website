"use client"

/**
 * PercentileMatrix - Matrix visualization for reservoir percentiles
 *
 * Displays a grid with:
 * - Scenarios as columns
 * - Reservoirs as rows
 * - Shared Y-axis (% capacity) on the left
 * - Shared X-axis (months) at the bottom
 * - Gridlines that extend across all cells for easy comparison
 */

import React, { useRef, useEffect, useState } from "react"
import * as d3 from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"
import type { MonthlyPercentiles } from "./PercentileBandChart"

export interface ReservoirData {
  reservoirId: string
  reservoirName: string
  capacityTaf: number
  deadPoolTaf: number
}

export interface MatrixCell {
  scenarioId: string
  scenarioName: string
  reservoirId: string
  data: MonthlyPercentiles | undefined
}

export interface PercentileMatrixProps {
  /** Array of reservoir metadata */
  reservoirs: ReservoirData[]
  /** Array of scenario IDs (column order) */
  scenarios: string[]
  /** Map of scenario ID to display name */
  scenarioNames: Record<string, string>
  /** Data for each cell: reservoirId -> scenarioId -> percentile data */
  data: Record<string, Record<string, MonthlyPercentiles | undefined>>
  /** Enable responsive sizing */
  responsive?: boolean
  /** Fixed width (when responsive=false) */
  width?: number
  /** Fixed height (when responsive=false) */
  height?: number
  /** Width of left label column (for alignment with other sections) */
  labelColumnWidth?: number
  /** Whether to show scenario headers (set false if parent shows them) */
  showScenarioHeaders?: boolean
  /** Map of scenarioId -> reservoirId -> tier color (for coloring individual cells) */
  cellColors?: Record<string, Record<string, string>>
}

// Water month labels
const WATER_MONTH_LABELS = [
  "O",
  "N",
  "D",
  "J",
  "F",
  "M",
  "A",
  "M",
  "J",
  "J",
  "A",
  "S",
]

// Color scheme
const COLORS = {
  outer: "rgba(99, 130, 150, 0.15)",
  inner: "rgba(99, 130, 150, 0.28)",
  median: "#3d5a6c",
  range: "rgba(99, 130, 150, 0.06)",
  text: "#5a6c7a",
  grid: "#e8edf0",
  gridStrong: "#d0d8dd",
  header: "#3d5a6c",
  headerBg: "#f5f7f9",
}

const PercentileMatrix: React.FC<PercentileMatrixProps> = ({
  reservoirs,
  scenarios,
  scenarioNames,
  data,
  responsive = true,
  width = 800,
  height = 600,
  labelColumnWidth = 100,
  showScenarioHeaders = true,
  cellColors,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dimensions = useResizeObserver(
    containerRef as React.RefObject<HTMLElement>,
  )
  const [currentWidth, setCurrentWidth] = useState(width)
  const [currentHeight, setCurrentHeight] = useState(height)

  useEffect(() => {
    if (responsive && dimensions) {
      setCurrentWidth(dimensions.width)
      // Calculate height based on number of reservoirs
      const calculatedHeight = Math.max(
        400,
        reservoirs.length * 120 + 80, // 120px per row + header/footer
      )
      setCurrentHeight(
        Math.min(calculatedHeight, dimensions.height || calculatedHeight),
      )
    } else {
      setCurrentWidth(width)
      setCurrentHeight(height)
    }

    if (!svgRef.current || reservoirs.length === 0 || scenarios.length === 0)
      return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    // Layout constants
    const margin = {
      top: showScenarioHeaders ? 50 : 20,
      right: 20,
      bottom: 45,
      left: labelColumnWidth,
    }
    const rowHeaderWidth = labelColumnWidth - 10 // Width for reservoir names
    const colHeaderHeight = showScenarioHeaders ? 40 : 10 // Height for scenario names

    const innerWidth = currentWidth - margin.left - margin.right
    const innerHeight = currentHeight - margin.top - margin.bottom

    // Calculate cell dimensions
    const cellWidth = innerWidth / scenarios.length
    const cellHeight = (innerHeight - colHeaderHeight) / reservoirs.length
    const chartPadding = { top: 8, right: 8, bottom: 4, left: 4 }

    // Chart area within each cell
    const chartWidth = cellWidth - chartPadding.left - chartPadding.right
    const chartHeight = cellHeight - chartPadding.top - chartPadding.bottom

    if (chartWidth <= 0 || chartHeight <= 0) return

    // Scales (shared across all cells)
    const xScale = d3.scaleLinear().domain([0, 11]).range([0, chartWidth])
    const yScale = d3.scaleLinear().domain([0, 100]).range([chartHeight, 0])

    // Main group
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // Draw column headers (scenario names) - only if enabled
    if (showScenarioHeaders) {
      scenarios.forEach((scenarioId, colIndex) => {
        const x = colIndex * cellWidth + cellWidth / 2
        g.append("text")
          .attr("x", x)
          .attr("y", -15)
          .attr("text-anchor", "middle")
          .attr("font-size", "11px")
          .attr("font-family", "'Inter', -apple-system, sans-serif")
          .attr("font-weight", "600")
          .attr("fill", COLORS.header)
          .text(scenarioNames[scenarioId] || scenarioId)
      })
    }

    // Draw row headers (reservoir names) and Y-axis labels
    reservoirs.forEach((reservoir, rowIndex) => {
      const y = colHeaderHeight + rowIndex * cellHeight + cellHeight / 2

      // Reservoir name
      g.append("text")
        .attr("x", -10)
        .attr("y", y)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "11px")
        .attr("font-family", "'Inter', -apple-system, sans-serif")
        .attr("font-weight", "500")
        .attr("fill", COLORS.header)
        .text(reservoir.reservoirName)

      // Capacity info (smaller, below name)
      g.append("text")
        .attr("x", -10)
        .attr("y", y + 12)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "9px")
        .attr("font-family", "'Inter', -apple-system, sans-serif")
        .attr("fill", COLORS.text)
        .text(`${reservoir.capacityTaf.toLocaleString()} TAF`)
    })

    // Draw shared Y-axis labels on the far left (only once)
    const yAxisLabels = [0, 25, 50, 75, 100]
    yAxisLabels.forEach((val) => {
      const y = colHeaderHeight + yScale(val) + chartPadding.top
      g.append("text")
        .attr("x", -rowHeaderWidth - 5)
        .attr("y", y)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "9px")
        .attr("font-family", "'Inter', -apple-system, sans-serif")
        .attr("fill", COLORS.text)
        .text(`${val}%`)
    })

    // Draw horizontal gridlines (extend across all columns)
    yAxisLabels.forEach((val) => {
      reservoirs.forEach((_, rowIndex) => {
        const y =
          colHeaderHeight +
          rowIndex * cellHeight +
          chartPadding.top +
          yScale(val)
        g.append("line")
          .attr("x1", 0)
          .attr("x2", innerWidth)
          .attr("y1", y)
          .attr("y2", y)
          .attr("stroke", val === 50 ? COLORS.gridStrong : COLORS.grid)
          .attr("stroke-width", val === 50 ? 1 : 0.5)
      })
    })

    // Draw vertical gridlines at cell boundaries
    for (let i = 0; i <= scenarios.length; i++) {
      const x = i * cellWidth
      g.append("line")
        .attr("x1", x)
        .attr("x2", x)
        .attr("y1", colHeaderHeight)
        .attr("y2", innerHeight)
        .attr("stroke", COLORS.gridStrong)
        .attr("stroke-width", 0.5)
    }

    // Draw horizontal lines at row boundaries
    for (let i = 0; i <= reservoirs.length; i++) {
      const y = colHeaderHeight + i * cellHeight
      g.append("line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", y)
        .attr("y2", y)
        .attr("stroke", COLORS.gridStrong)
        .attr("stroke-width", 0.5)
    }

    // Draw shared X-axis labels at the bottom
    WATER_MONTH_LABELS.forEach((label, i) => {
      const x = chartPadding.left + xScale(i)
      // Only draw for first column, but position to align with grid
      g.append("text")
        .attr("x", x)
        .attr("y", innerHeight + 15)
        .attr("text-anchor", "middle")
        .attr("font-size", "9px")
        .attr("font-family", "'Inter', -apple-system, sans-serif")
        .attr("fill", COLORS.text)
        .text(label)
    })

    // Draw vertical month gridlines (subtle, extend across all rows)
    for (let i = 0; i < 12; i++) {
      scenarios.forEach((_, colIndex) => {
        const x = colIndex * cellWidth + chartPadding.left + xScale(i)
        g.append("line")
          .attr("x1", x)
          .attr("x2", x)
          .attr("y1", colHeaderHeight)
          .attr("y2", innerHeight)
          .attr("stroke", COLORS.grid)
          .attr("stroke-width", 0.5)
          .attr("stroke-dasharray", "2,2")
          .attr("opacity", 0.5)
      })
    }

    // Helper to convert hex color to rgba
    const hexToRgba = (hex: string, alpha: number): string => {
      // Remove # if present
      const cleanHex = hex.replace("#", "")
      const r = parseInt(cleanHex.substring(0, 2), 16)
      const g = parseInt(cleanHex.substring(2, 4), 16)
      const b = parseInt(cleanHex.substring(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }

    // Helper to get colors for a specific cell (scenario + reservoir)
    const getCellColors = (scenarioId: string, reservoirId: string) => {
      const tierColor = cellColors?.[scenarioId]?.[reservoirId]
      if (tierColor) {
        // Create color variants from the tier color using rgba for SVG compatibility
        return {
          range: hexToRgba(tierColor, 0.06), // Very light
          outer: hexToRgba(tierColor, 0.18), // Light
          inner: hexToRgba(tierColor, 0.32), // Medium
          median: tierColor, // Full color for median line
        }
      }
      // Default colors if no tier color provided
      return {
        range: COLORS.range,
        outer: COLORS.outer,
        inner: COLORS.inner,
        median: COLORS.median,
      }
    }

    // Draw each cell's chart
    reservoirs.forEach((reservoir, rowIndex) => {
      scenarios.forEach((scenarioId, colIndex) => {
        const cellData = data[reservoir.reservoirId]?.[scenarioId]
        if (!cellData) return

        const cellX = colIndex * cellWidth + chartPadding.left
        const cellY = colHeaderHeight + rowIndex * cellHeight + chartPadding.top

        const cellG = g
          .append("g")
          .attr("transform", `translate(${cellX},${cellY})`)

        // Get colors for this specific cell (scenario + reservoir)
        const colors = getCellColors(scenarioId, reservoir.reservoirId)

        // Process data
        const processedData: Array<
          { monthIndex: number } & {
            q0: number
            q10: number
            q30: number
            q50: number
            q70: number
            q90: number
            q100: number
            mean: number
          }
        > = []
        for (let i = 1; i <= 12; i++) {
          const monthData = cellData[i.toString()]
          if (monthData) {
            processedData.push({ monthIndex: i - 1, ...monthData })
          }
        }

        if (processedData.length === 0) return

        // Area generators
        const rangeArea = d3
          .area<(typeof processedData)[0]>()
          .x((d) => xScale(d.monthIndex))
          .y0((d) => yScale(d.q0))
          .y1((d) => yScale(d.q100))
          .curve(d3.curveLinear)

        const outerArea = d3
          .area<(typeof processedData)[0]>()
          .x((d) => xScale(d.monthIndex))
          .y0((d) => yScale(d.q10))
          .y1((d) => yScale(d.q90))
          .curve(d3.curveLinear)

        const innerArea = d3
          .area<(typeof processedData)[0]>()
          .x((d) => xScale(d.monthIndex))
          .y0((d) => yScale(d.q30))
          .y1((d) => yScale(d.q70))
          .curve(d3.curveLinear)

        const medianLine = d3
          .line<(typeof processedData)[0]>()
          .x((d) => xScale(d.monthIndex))
          .y((d) => yScale(d.q50))
          .curve(d3.curveLinear)

        // Draw bands and line with scenario-specific colors
        cellG
          .append("path")
          .datum(processedData)
          .attr("fill", colors.range)
          .attr("d", rangeArea)
        cellG
          .append("path")
          .datum(processedData)
          .attr("fill", colors.outer)
          .attr("d", outerArea)
        cellG
          .append("path")
          .datum(processedData)
          .attr("fill", colors.inner)
          .attr("d", innerArea)
        cellG
          .append("path")
          .datum(processedData)
          .attr("fill", "none")
          .attr("stroke", colors.median)
          .attr("stroke-width", 1.5)
          .attr("d", medianLine)
      })
    })

    // Add tooltip functionality
    const tooltipId = `matrix-tooltip-${Math.random().toString(36).substr(2, 9)}`
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("id", tooltipId)
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "#fff")
      .style("border-radius", "6px")
      .style("padding", "10px 14px")
      .style("font-size", "11px")
      .style("font-family", "'Inter', -apple-system, sans-serif")
      .style("box-shadow", "0 4px 20px rgba(0,0,0,0.12)")
      .style("pointer-events", "none")
      .style("z-index", "1000")
      .style("line-height", "1.4")

    // Add hover rectangles for each cell
    reservoirs.forEach((reservoir, rowIndex) => {
      scenarios.forEach((scenarioId, colIndex) => {
        const cellData = data[reservoir.reservoirId]?.[scenarioId]
        if (!cellData) return

        const cellX = colIndex * cellWidth
        const cellY = colHeaderHeight + rowIndex * cellHeight

        g.append("rect")
          .attr("x", cellX)
          .attr("y", cellY)
          .attr("width", cellWidth)
          .attr("height", cellHeight)
          .attr("fill", "transparent")
          .style("cursor", "crosshair")
          .on("mousemove", (event) => {
            const [mouseX] = d3.pointer(event, g.node())
            const relativeX = mouseX - cellX - chartPadding.left
            const monthIndex = Math.round(xScale.invert(relativeX))

            if (monthIndex >= 0 && monthIndex < 12) {
              const monthData = cellData[(monthIndex + 1).toString()]
              if (monthData) {
                tooltip
                  .style("visibility", "visible")
                  .style("left", `${event.pageX + 12}px`)
                  .style("top", `${event.pageY - 10}px`).html(`
                    <div style="font-weight: 600; color: ${COLORS.header}; margin-bottom: 6px;">
                      ${reservoir.reservoirName} · ${WATER_MONTH_LABELS[monthIndex]}
                    </div>
                    <div style="color: ${COLORS.text}; font-size: 10px; margin-bottom: 4px;">
                      ${scenarioNames[scenarioId] || scenarioId}
                    </div>
                    <div style="display: grid; grid-template-columns: auto auto; gap: 1px 10px; color: #6b7785;">
                      <span>90th</span><span style="text-align: right;">${monthData.q90.toFixed(0)}%</span>
                      <span style="font-weight: 600; color: ${COLORS.median};">Median</span>
                      <span style="text-align: right; font-weight: 600; color: ${COLORS.median};">${monthData.q50.toFixed(0)}%</span>
                      <span>10th</span><span style="text-align: right;">${monthData.q10.toFixed(0)}%</span>
                    </div>
                  `)
              }
            }
          })
          .on("mouseout", () => {
            tooltip.style("visibility", "hidden")
          })
      })
    })

    return () => {
      d3.select(`#${tooltipId}`).remove()
    }
  }, [
    reservoirs,
    scenarios,
    scenarioNames,
    data,
    currentWidth,
    currentHeight,
    responsive,
    dimensions,
    width,
    height,
    labelColumnWidth,
    showScenarioHeaders,
    cellColors,
  ])

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: responsive ? "100%" : `${height}px`,
        minHeight: responsive
          ? `${reservoirs.length * 100 + 100}px`
          : undefined,
      }}
    >
      <svg
        ref={svgRef}
        width={responsive ? "100%" : width}
        height={currentHeight}
        style={{ display: "block" }}
      />
    </div>
  )
}

export default React.memo(PercentileMatrix)
