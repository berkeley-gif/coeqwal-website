"use client"

/**
 * PercentileMatrix - Matrix visualization for reservoir percentiles
 *
 * Displays a grid with:
 * - Scenarios as columns
 * - Reservoirs as rows
 * - Shared Y-axis (% capacity) on the left
 * - Shared X-axis (months) at the bottom
 * - Gridlines that extend across all cells for comparison
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
  /** Water system: "CVP", "SWP", or "CVP & SWP" */
  system?: string
}

// Mapping of reservoir IDs to water systems (for major California reservoirs)
const RESERVOIR_SYSTEMS: Record<string, string> = {
  SHSTA: "CVP",
  TRNTY: "CVP",
  FOLSM: "CVP",
  NWMLN: "CVP",
  MLRTN: "CVP",
  OROVL: "SWP",
  SLUIS_CVP: "CVP",
  SLUIS_SWP: "SWP",
  SLUIS: "CVP & SWP",
}

// Context notes for specific reservoirs (shown with tooltip)
const RESERVOIR_CONTEXT: Record<string, string> = {
  FOLSM:
    "Folsom has strict flood control rule curves that cap storage at specific levels during winter months to protect the Sacramento River from flooding. This is why the median is at the top of the percentile band.",
}

export interface MatrixCell {
  scenarioId: string
  scenarioName: string
  reservoirId: string
  data: MonthlyPercentiles | undefined
}

export type MatrixDisplayMode = "percentage" | "volume"

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
  /** Maximum width per scenario cell to prevent elongated charts (default: 250) */
  maxCellWidth?: number
  /** Display mode: percentage (0-100% of capacity) or volume (TAF values) */
  displayMode?: MatrixDisplayMode
}

// Water month labels (short - for axis)
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

// Full month names (for tooltips)
const WATER_MONTH_NAMES = [
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
]

// Color scheme for percentile bands
const COLORS = {
  range: "#d9eafb", // q0-q100 (lightest)
  outer: "#c5dbf3", // q10-q90
  inner: "#a2bee1", // q30-q70
  median: "#2c5aa0", // q50 (darkest)
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
  maxCellWidth = 250,
  displayMode = "percentage",
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
        reservoirs.length * 190 + 80, // 190px per row + header/footer
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

    // Calculate cell dimensions with even distribution (space-evenly approach)
    // Each scenario gets an equal "slot" of the available width
    const slotWidth = innerWidth / scenarios.length
    // When maxCellWidth is undefined, use full slot width (no constraint)
    const cellWidth =
      maxCellWidth !== undefined ? Math.min(slotWidth, maxCellWidth) : slotWidth
    // Offset within each slot to center the cell
    const cellOffsetInSlot = (slotWidth - cellWidth) / 2
    const cellHeight = (innerHeight - colHeaderHeight) / reservoirs.length
    const chartPadding = { top: 8, right: 8, bottom: 24, left: 4 }

    // Chart area within each cell
    const chartWidth = cellWidth - chartPadding.left - chartPadding.right
    const chartHeight = cellHeight - chartPadding.top - chartPadding.bottom

    // Helper to get cell X position (evenly distributed)
    const getCellX = (colIndex: number) =>
      slotWidth * colIndex + cellOffsetInSlot

    if (chartWidth <= 0 || chartHeight <= 0) return

    // Calculate Y domain based on display mode
    let yDomain: [number, number]
    if (displayMode === "volume") {
      // Find max value across all data for volume mode
      let maxValue = 0
      reservoirs.forEach((reservoir) => {
        scenarios.forEach((scenarioId) => {
          const cellData = data[reservoir.reservoirId]?.[scenarioId]
          if (cellData) {
            for (let i = 1; i <= 12; i++) {
              const monthData = cellData[i.toString()]
              if (monthData?.q100) {
                maxValue = Math.max(maxValue, monthData.q100)
              }
            }
          }
        })
        // Also consider capacity as a reference
        maxValue = Math.max(maxValue, reservoir.capacityTaf)
      })
      // Round up to a nice number with 10% headroom
      yDomain = [0, Math.ceil((maxValue * 1.1) / 500) * 500]
    } else {
      yDomain = [0, 100]
    }

    // Scales (shared across all cells)
    const xScale = d3.scaleLinear().domain([0, 11]).range([0, chartWidth])
    const yScale = d3.scaleLinear().domain(yDomain).range([chartHeight, 0])

    // Main group
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // Draw column headers (scenario names) - only if enabled
    if (showScenarioHeaders) {
      scenarios.forEach((scenarioId, colIndex) => {
        const x = getCellX(colIndex) + cellWidth / 2
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

    // Draw row headers (reservoir names, system, and capacity)
    // Positioned at far left to align with section header above
    const labelX = -margin.left + 5 // Start at left edge of SVG with small padding
    reservoirs.forEach((reservoir, rowIndex) => {
      const rowTop = colHeaderHeight + rowIndex * cellHeight + chartPadding.top

      // Reservoir name - primary label, bold
      g.append("text")
        .attr("x", labelX)
        .attr("y", rowTop + 2)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "hanging")
        .attr("font-size", "0.875rem") // 14px
        .attr("font-family", "'Inter', -apple-system, sans-serif")
        .attr("font-weight", "600")
        .attr("fill", COLORS.header)
        .text(reservoir.reservoirName)

      // System info (SWP/CVP) - secondary metadata
      const system =
        reservoir.system || RESERVOIR_SYSTEMS[reservoir.reservoirId] || ""
      if (system) {
        g.append("text")
          .attr("x", labelX)
          .attr("y", rowTop + 20)
          .attr("text-anchor", "start")
          .attr("dominant-baseline", "hanging")
          .attr("font-size", "0.75rem") // 12px - smaller for metadata
          .attr("font-family", "'Inter', -apple-system, sans-serif")
          .attr("font-weight", "500")
          .attr("fill", COLORS.text)
          .attr("letter-spacing", "0.02em")
          .text(system)
      }

      // Capacity - key metric with value emphasis
      const capacityY = rowTop + (system ? 38 : 20)
      // Label in lighter weight
      g.append("text")
        .attr("x", labelX)
        .attr("y", capacityY)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "hanging")
        .attr("font-size", "0.6875rem") // 11px - small label
        .attr("font-family", "'Inter', -apple-system, sans-serif")
        .attr("font-weight", "400")
        .attr("fill", COLORS.text)
        .attr("text-transform", "uppercase")
        .attr("letter-spacing", "0.05em")
        .text("Capacity")
      // Value in tabular figures, prominent
      g.append("text")
        .attr("x", labelX)
        .attr("y", capacityY + 14)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "hanging")
        .attr("font-size", "0.875rem") // 14px
        .attr("font-family", "'Inter', -apple-system, sans-serif")
        .attr("font-weight", "600")
        .attr("font-feature-settings", "'tnum' 1") // Tabular numbers
        .attr("fill", COLORS.header)
        .text(`${reservoir.capacityTaf.toLocaleString()} TAF`)

      // Context note with tooltip (for reservoirs with special context)
      const contextNote = RESERVOIR_CONTEXT[reservoir.reservoirId]
      if (contextNote) {
        const contextY = capacityY + 34
        const contextText = g
          .append("text")
          .attr("x", labelX)
          .attr("y", contextY)
          .attr("text-anchor", "start")
          .attr("dominant-baseline", "hanging")
          .attr("font-size", "0.75rem") // 12px
          .attr("font-family", "'Inter', -apple-system, sans-serif")
          .attr("font-weight", "500")
          .attr("fill", COLORS.text)
          .attr("cursor", "help")
          .text("Context")

        // Add dotted underline
        const textWidth = contextText.node()?.getBBox().width ?? 40
        g.append("line")
          .attr("x1", labelX)
          .attr("x2", labelX + textWidth)
          .attr("y1", contextY + 14)
          .attr("y2", contextY + 14)
          .attr("stroke", COLORS.text)
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "2,2")
          .attr("cursor", "help")

        // Invisible hover area for tooltip
        g.append("rect")
          .attr("x", labelX - 2)
          .attr("y", contextY - 2)
          .attr("width", textWidth + 4)
          .attr("height", 18)
          .attr("fill", "transparent")
          .attr("cursor", "help")
          .on("mouseenter", (event) => {
            // Create or show tooltip
            let tooltipEl = d3.select<HTMLDivElement, unknown>(
              "#context-tooltip",
            )
            if (tooltipEl.empty()) {
              tooltipEl = d3
                .select("body")
                .append<HTMLDivElement>("div")
                .attr("id", "context-tooltip")
                .style("position", "absolute")
                .style("background", "#fff")
                .style("border-radius", "6px")
                .style("padding", "12px 16px")
                .style("font-size", "13px")
                .style("font-family", "'Inter', -apple-system, sans-serif")
                .style("box-shadow", "0 4px 20px rgba(0,0,0,0.15)")
                .style("pointer-events", "none")
                .style("z-index", "1000")
                .style("max-width", "320px")
                .style("line-height", "1.5")
                .style("color", COLORS.text)
            }
            tooltipEl
              .style("visibility", "visible")
              .style("left", `${event.pageX + 12}px`)
              .style("top", `${event.pageY - 10}px`)
              .text(contextNote)
          })
          .on("mouseleave", () => {
            d3.select<HTMLDivElement, unknown>("#context-tooltip").style(
              "visibility",
              "hidden",
            )
          })
      }
    })

    // Y-axis tick values for gridlines within charts
    const yAxisTicks =
      displayMode === "volume"
        ? d3.ticks(yDomain[0], yDomain[1], 5) // Generate ~5 nice tick values
        : [0, 20, 40, 60, 80, 100] // Percentage gridlines at 20% intervals

    // Draw horizontal gridlines within chart cells
    const gridStartX = getCellX(0) // Start at first chart cell
    const gridEndX = getCellX(scenarios.length - 1) + cellWidth // End at last chart cell
    const fullLeftX = -margin.left + 5 // Full width for row dividers (aligned with title block)
    yAxisTicks.forEach((val) => {
      reservoirs.forEach((_, rowIndex) => {
        const y =
          colHeaderHeight +
          rowIndex * cellHeight +
          chartPadding.top +
          yScale(val)

        // Gridline
        g.append("line")
          .attr("x1", gridStartX)
          .attr("x2", gridEndX)
          .attr("y1", y)
          .attr("y2", y)
          .attr("stroke", val === 50 ? COLORS.gridStrong : COLORS.grid)
          .attr("stroke-width", val === 50 ? 1 : 0.5)

        // Y-axis label (for both percentage and volume modes)
        const labelText =
          displayMode === "percentage" ? `${val}%` : `${val.toLocaleString()}`
        g.append("text")
          .attr("x", gridStartX - 4)
          .attr("y", y)
          .attr("text-anchor", "end")
          .attr("dominant-baseline", "middle")
          .attr("font-size", "9px")
          .attr("font-family", "'Inter', -apple-system, sans-serif")
          .attr("fill", COLORS.text)
          .text(labelText)
      })
    })

    // Row dividers
    for (let i = 0; i <= reservoirs.length; i++) {
      const y = colHeaderHeight + i * cellHeight
      g.append("line")
        .attr("x1", fullLeftX)
        .attr("x2", gridEndX)
        .attr("y1", y)
        .attr("y2", y)
        .attr("stroke", COLORS.gridStrong)
        .attr("stroke-width", 1)
    }

    // Vertical dividers
    scenarios.forEach((_, colIndex) => {
      const leftEdge = getCellX(colIndex) // Left edge of chart cell
      const rightEdge = getCellX(colIndex) + cellWidth // Right edge of chart cell

      // Left edge line
      g.append("line")
        .attr("x1", leftEdge)
        .attr("x2", leftEdge)
        .attr("y1", colHeaderHeight)
        .attr("y2", innerHeight)
        .attr("stroke", COLORS.gridStrong)
        .attr("stroke-width", 1)

      // Right edge line
      g.append("line")
        .attr("x1", rightEdge)
        .attr("x2", rightEdge)
        .attr("y1", colHeaderHeight)
        .attr("y2", innerHeight)
        .attr("stroke", COLORS.gridStrong)
        .attr("stroke-width", 1)
    })

    // x-axis labels for each individual chart cell (months Oct-Sep)
    reservoirs.forEach((_, rowIndex) => {
      scenarios.forEach((__, colIndex) => {
        const cellBottom =
          colHeaderHeight +
          rowIndex * cellHeight +
          chartPadding.top +
          chartHeight
        WATER_MONTH_LABELS.forEach((label, i) => {
          const x = getCellX(colIndex) + chartPadding.left + xScale(i)
          g.append("text")
            .attr("x", x)
            .attr("y", cellBottom + 10)
            .attr("text-anchor", "middle")
            .attr("font-size", "9px")
            .attr("font-family", "'Inter', -apple-system, sans-serif")
            .attr("fill", COLORS.text)
            .text(label)
        })
      })
    })

    // Vertical month gridlines for each individual chart cell
    reservoirs.forEach((_, rowIndex) => {
      const cellTop = colHeaderHeight + rowIndex * cellHeight + chartPadding.top
      const cellBottom = cellTop + chartHeight
      scenarios.forEach((__, colIndex) => {
        for (let i = 0; i < 12; i++) {
          const x = getCellX(colIndex) + chartPadding.left + xScale(i)
          g.append("line")
            .attr("x1", x)
            .attr("x2", x)
            .attr("y1", cellTop)
            .attr("y2", cellBottom)
            .attr("stroke", COLORS.grid)
            .attr("stroke-width", 0.5)
        }
      })
    })

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

        const cellX = getCellX(colIndex) + chartPadding.left
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

        // Bands and line with scenario-specific colors
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

    // Tooltip functionality
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

    // Vertical playhead line (initially hidden)
    const playhead = g
      .append("line")
      .attr("class", "playhead")
      .attr("stroke", COLORS.median)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,2")
      .style("visibility", "hidden")
      .style("pointer-events", "none")

    // Hover rectangles for each cell
    reservoirs.forEach((reservoir, rowIndex) => {
      scenarios.forEach((scenarioId, colIndex) => {
        const cellData = data[reservoir.reservoirId]?.[scenarioId]
        if (!cellData) return

        const cellX = getCellX(colIndex)
        const cellY = colHeaderHeight + rowIndex * cellHeight
        const cellTop = cellY + chartPadding.top
        const cellBottom = cellTop + chartHeight

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
                const unit = displayMode === "volume" ? " TAF" : "%"
                const formatValue = (v: number) =>
                  displayMode === "volume"
                    ? v.toLocaleString(undefined, { maximumFractionDigits: 0 })
                    : v.toFixed(0)

                // Update playhead position (snapped to month)
                const playheadX = cellX + chartPadding.left + xScale(monthIndex)
                playhead
                  .attr("x1", playheadX)
                  .attr("x2", playheadX)
                  .attr("y1", cellTop)
                  .attr("y2", cellBottom)
                  .style("visibility", "visible")

                tooltip
                  .style("visibility", "visible")
                  .style("left", `${event.pageX + 12}px`)
                  .style("top", `${event.pageY - 10}px`).html(`
                    <div style="font-weight: 600; color: ${COLORS.header}; margin-bottom: 6px;">
                      ${reservoir.reservoirName} · ${WATER_MONTH_NAMES[monthIndex]}
                    </div>
                    <div style="color: ${COLORS.text}; font-size: 10px; margin-bottom: 4px;">
                      ${scenarioNames[scenarioId] || scenarioId}
                    </div>
                    <div style="display: grid; grid-template-columns: auto auto; gap: 1px 10px; color: #6b7785;">
                      <span>90th</span><span style="text-align: right;">${formatValue(monthData.q90)}${unit}</span>
                      <span style="font-weight: 600; color: ${COLORS.median};">Median</span>
                      <span style="text-align: right; font-weight: 600; color: ${COLORS.median};">${formatValue(monthData.q50)}${unit}</span>
                      <span>10th</span><span style="text-align: right;">${formatValue(monthData.q10)}${unit}</span>
                    </div>
                  `)
              }
            }
          })
          .on("mouseout", () => {
            tooltip.style("visibility", "hidden")
            playhead.style("visibility", "hidden")
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
    maxCellWidth,
    displayMode,
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
