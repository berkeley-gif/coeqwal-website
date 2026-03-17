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
  /** CWS-specific: Annual average delivery in TAF (shown instead of capacity when > 0) */
  annualAvgTaf?: number
  /** CWS-specific: Reliability percentage (shown when annualAvgTaf is set) */
  reliabilityPct?: number
  /** CWS-specific: Shortage frequency percentage (shown when annualAvgTaf is set) */
  shortageFrequencyPct?: number
  /**
   * Optional single-line subtitle rendered below the entity name in the label column.
   * Styled like the "CVP / SWP" system line in reservoir charts (medium weight, secondary color).
   * Used for secondary identifiers (e.g. demand unit ID or hydrologic region).
   */
  labelSubtitle?: string
  /**
   * Optional key→value attribute pairs rendered below the subtitle.
   * Each pair is displayed as a small uppercase key label + bold value,
   * matching the "Capacity / Dead pool" styling in reservoir charts.
   * Requires capacityTaf === 0 (no reservoir mode) to activate.
   */
  labelAttributes?: { key: string; value: string }[]
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
export type VolumeScaleMode = "absolute" | "relative"

/** Per-cell summary statistics (for CWS entities) */
export interface CellStats {
  annualAvgTaf?: number
  reliabilityPct?: number
  shortageFrequencyPct?: number
  /** True if any month has q0=0 (contractor may receive no allocation in dry years) */
  hasDryYearMonths?: boolean
}

/** Cell stats mapping: entityId -> scenarioId -> stats */
export type CellStatsMap = Record<string, Record<string, CellStats>>

/** Breakdown component definition for stacked charts */
export interface BreakdownComponent {
  id: string
  label: string
  color: string
}

/** Breakdown data: entityId -> scenarioId -> componentId -> percentile data */
export type BreakdownDataMap = Record<
  string,
  Record<string, Record<string, MonthlyPercentiles | undefined>>
>

/** Breakdown components: entityId -> array of components */
export type BreakdownComponentsMap = Record<string, BreakdownComponent[]>

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
  /** Y-axis scale mode for volume: absolute (shared scale) or relative (per-reservoir capacity) */
  volumeScaleMode?: VolumeScaleMode
  /** Color scheme: delivery (blue) or shortage (orange/amber) */
  colorScheme?: PercentileColorScheme
  /** Per-cell summary statistics (entityId -> scenarioId -> stats) */
  cellStats?: CellStatsMap
  /** Breakdown data for stacked charts (entityId -> scenarioId -> componentId -> data) */
  breakdownData?: BreakdownDataMap
  /** Breakdown component definitions (entityId -> components with id, label, color) */
  breakdownComponents?: BreakdownComponentsMap
  /** Scenario IDs that are still loading data (shows spinner in empty cells) */
  loadingScenarios?: string[]
  /**
   * Minimum value allowed for the y-axis maximum (TAF).
   * Default 100, which works well for reservoirs and CWS contractors.
   * Set to 0 for small-volume entities (e.g. wildlife refuges) so the axis
   * scales to the actual data range instead of being locked at ≥100 TAF.
   */
  minYMaxTaf?: number
  /**
   * Optional suffix appended to Y-axis tick labels in volume mode.
   * E.g. "%" for % unimpaired charts so ticks read "50%" not "50".
   * Has no effect when displayMode="percentage" (which always appends "%").
   */
  yAxisSuffix?: string
  /**
   * Y value to draw a bold reference gridline at (in addition to the default
   * highlight at val===50 for percentage mode).  Pass e.g. 100 for the
   * "= natural flow" reference on % unimpaired charts.
   */
  yAxisReferenceValue?: number
  /**
   * Hard ceiling for the Y-axis maximum in volume+absolute mode.
   * When set, the computed domain is capped at this value regardless of how
   * high the data goes.  Data above the cap is clipped by the chart boundary.
   * Use e.g. 120 for % unimpaired charts so the axis stays at 0–120%
   * even when a few regulated channels exceed 100%.
   */
  yAxisMax?: number
  /**
   * Unit string shown in hover tooltips. Defaults to " TAF" for volume mode
   * and "%" for percentage mode. Override for non-TAF data (e.g. " µmhos/cm").
   */
  tooltipUnit?: string
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

// Color scheme for percentile bands (delivery - blue)
const COLORS = {
  range: "#d9eafb", // q0-q100 (lightest)
  outer: "#c5dbf3", // q10-q90
  inner: "#a2bee1", // q30-q70
  median: "#2c5aa0", // q50 (darkest)
  text: "#5a6c7a",
  grid: "#e8edf0",
  gridStrong: "#d0d8dd",
  header: "#3d5a6c",
  capacity: "#4a7c59", // Green for capacity reference line
  deadPool: "#b85c38", // Rust/brown for dead pool reference line
  headerBg: "#f5f7f9",
}

// Color scheme for shortage - orange/amber
const COLORS_SHORTAGE = {
  range: "#fef3e2", // q0-q100 (lightest amber)
  outer: "#fdd49e", // q10-q90
  inner: "#fdae6b", // q30-q70
  median: "#e6550d", // q50 (darkest orange)
  text: "#5a6c7a",
  grid: "#e8edf0",
  gridStrong: "#d0d8dd",
  header: "#3d5a6c",
  capacity: "#4a7c59",
  deadPool: "#b85c38",
  headerBg: "#f5f7f9",
}

export type PercentileColorScheme = "delivery" | "shortage"

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
  volumeScaleMode = "absolute",
  colorScheme = "delivery",
  cellStats,
  breakdownData,
  breakdownComponents,
  loadingScenarios,
  minYMaxTaf = 100,
  yAxisSuffix,
  yAxisReferenceValue,
  yAxisMax,
  tooltipUnit,
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
      // Scale row height based on number of scenarios
      // Fewer scenarios = taller rows (bigger charts)
      // CWS charts (with cellStats) add extra height for statistics below the chart
      const baseRowHeight =
        scenarios.length <= 2
          ? 280 // Large charts for 1-2 scenarios
          : scenarios.length <= 4
            ? 230 // Medium charts for 3-4 scenarios
            : 190 // Compact charts for 5+ scenarios
      const statsExtraHeight = cellStats ? 96 : 0
      const rowHeight = baseRowHeight + statsExtraHeight
      const calculatedHeight = Math.max(400, reservoirs.length * rowHeight + 80)
      // Use full calculated height - let parent scroll container handle overflow
      // This prevents charts from being "smooshed" in modal/expanded views
      setCurrentHeight(calculatedHeight)
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
    const colHeaderHeight = showScenarioHeaders ? 40 : 10 // Height for scenario names

    const innerWidth = currentWidth - margin.left - margin.right
    const innerHeight = currentHeight - margin.top - margin.bottom

    // Calculate cell dimensions with even distribution (space-evenly approach)
    // Each scenario gets an equal "slot" of the available width
    const slotWidth = innerWidth / scenarios.length
    // Scale maxCellWidth based on scenario count - fewer scenarios = wider cells allowed
    // With 1-2 scenarios, no constraint. With 3-4, generous limit. With 5+, compact.
    const effectiveMaxCellWidth =
      maxCellWidth !== undefined
        ? maxCellWidth
        : scenarios.length <= 2
          ? undefined // No constraint for 1-2 scenarios
          : scenarios.length <= 4
            ? 400 // Generous limit for 3-4 scenarios
            : 300 // Moderate limit for 5+ scenarios
    const cellWidth =
      effectiveMaxCellWidth !== undefined
        ? Math.min(slotWidth, effectiveMaxCellWidth)
        : slotWidth
    // Offset within each slot to center the cell (0 when cell fills slot)
    const cellOffsetInSlot = (slotWidth - cellWidth) / 2
    const cellHeight = (innerHeight - colHeaderHeight) / reservoirs.length
    // Bottom padding: 24 for x-axis labels + 96 for per-cell stats (when cellStats provided)
    // Stats: 4 lines × 20px = 80px content + 16px breathing room = 96px
    const statsAreaHeight = cellStats ? 96 : 0
    const chartPadding = {
      top: 8,
      right: 8,
      bottom: 24 + statsAreaHeight,
      left: 4,
    }

    // Chart area within each cell
    const chartWidth = cellWidth - chartPadding.left - chartPadding.right
    const chartHeight = cellHeight - chartPadding.top - chartPadding.bottom

    // Helper to get cell X position (evenly distributed)
    const getCellX = (colIndex: number) =>
      slotWidth * colIndex + cellOffsetInSlot

    if (chartWidth <= 0 || chartHeight <= 0) return

    // Calculate Y domain based on display mode and scale mode
    // For volume + relative: each entity has its own domain based on its max data value
    // For volume + absolute: shared domain based on max across all
    // For percentage: shared domain (0-100)
    let sharedYDomain: [number, number] = [0, 100]
    const perReservoirYDomains: Record<string, [number, number]> = {}

    if (displayMode === "volume") {
      if (volumeScaleMode === "relative") {
        // Each entity uses its own max value from the data
        reservoirs.forEach((reservoir) => {
          let maxValue = 0
          // Find max across all scenarios for this entity
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

            // Also check breakdownData for breakdown rows (MWD breakdown charts)
            // Breakdown rows have empty main data but store values in breakdownData
            const componentData =
              breakdownData?.[reservoir.reservoirId]?.[scenarioId]
            if (componentData) {
              Object.values(componentData).forEach((monthlyData) => {
                if (monthlyData) {
                  for (let i = 1; i <= 12; i++) {
                    const monthData = monthlyData[i.toString()]
                    if (monthData?.q100) {
                      maxValue = Math.max(maxValue, monthData.q100)
                    }
                  }
                }
              })
            }
          })
          // Also consider capacity if available (for reservoir charts)
          if (reservoir.capacityTaf > 0) {
            maxValue = Math.max(maxValue, reservoir.capacityTaf)
          }
          // Apply caller-supplied minimum (default 100 TAF for reservoirs/CWS;
          // pass 0 for small-volume entities like wildlife refuges).
          maxValue = Math.max(maxValue, minYMaxTaf)
          // Round up to a nice increment with 5% headroom.
          // Handles sub-1 TAF ranges (e.g. refuge deliveries in tenths of TAF).
          const increment =
            maxValue > 1000
              ? 500
              : maxValue > 100
                ? 50
                : maxValue > 10
                  ? 10
                  : maxValue > 1
                    ? 1
                    : maxValue > 0.1
                      ? 0.1
                      : 0.01
          const rawMaxY = Math.ceil((maxValue * 1.05) / increment) * increment
          // Guard against degenerate [0,0] domain (all data = 0 and minYMaxTaf = 0).
          // A flat domain causes D3 to place every value at 50% height.
          // Use a tiny non-zero ceiling so the zero line sits correctly at the bottom.
          const maxY = rawMaxY > 0 ? rawMaxY : 0.001
          perReservoirYDomains[reservoir.reservoirId] = [0, maxY]
        })
      } else {
        // Absolute mode: find max value across all data
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

            // Also check breakdownData for breakdown rows
            const componentData =
              breakdownData?.[reservoir.reservoirId]?.[scenarioId]
            if (componentData) {
              Object.values(componentData).forEach((monthlyData) => {
                if (monthlyData) {
                  for (let i = 1; i <= 12; i++) {
                    const monthData = monthlyData[i.toString()]
                    if (monthData?.q100) {
                      maxValue = Math.max(maxValue, monthData.q100)
                    }
                  }
                }
              })
            }
          })
          // Also consider capacity as a reference
          maxValue = Math.max(maxValue, reservoir.capacityTaf)
        })
        // Apply caller-supplied minimum, then round up with 10% headroom.
        maxValue = Math.max(maxValue, minYMaxTaf)
        const absIncrement =
          maxValue > 1000
            ? 500
            : maxValue > 100
              ? 50
              : maxValue > 10
                ? 10
                : maxValue > 1
                  ? 1
                  : maxValue > 0.1
                    ? 0.1
                    : 0.01
        const absRawMax =
          Math.ceil((maxValue * 1.1) / absIncrement) * absIncrement
        // Guard against degenerate [0,0] domain — same as relative mode.
        // A flat domain causes D3 to place every value at 50% height.
        const absComputedMax = absRawMax > 0 ? absRawMax : 0.001
        // If caller supplied a hard ceiling (e.g. 120 for % unimpaired), honour it.
        sharedYDomain = [0, yAxisMax !== undefined ? yAxisMax : absComputedMax]
      }
    }

    // Helper to get Y domain for a reservoir
    const getYDomain = (reservoirId: string): [number, number] => {
      if (displayMode === "volume" && volumeScaleMode === "relative") {
        return perReservoirYDomains[reservoirId] || [0, 5000]
      }
      return sharedYDomain
    }

    // Helper to get Y scale for a reservoir.
    // .clamp(true) ensures values outside the domain map to the range boundary
    // rather than overflowing the chart area (important when yAxisMax caps the
    // domain below the actual data maximum, e.g. % unimpaired charts).
    const getYScale = (reservoirId: string) => {
      const domain = getYDomain(reservoirId)
      return d3.scaleLinear().domain(domain).range([chartHeight, 0]).clamp(true)
    }

    // X scale (shared across all cells)
    const xScale = d3.scaleLinear().domain([0, 11]).range([0, chartWidth])

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

    // Draw row headers (reservoir names, system, and capacity/CWS stats)
    // Positioned at far left to align with section header above
    const labelX = -margin.left + 5 // Start at left edge of SVG with small padding
    // Max width for entity names - leave room for Y-axis labels (approx 35px)
    const entityNameMaxWidth = labelColumnWidth - 40
    reservoirs.forEach((reservoir, rowIndex) => {
      const rowTop = colHeaderHeight + rowIndex * cellHeight + chartPadding.top

      // Reservoir/entity name - use foreignObject for text wrapping on long names
      const nameGroup = g
        .append("foreignObject")
        .attr("x", labelX)
        .attr("y", rowTop)
        .attr("width", entityNameMaxWidth)
        .attr("height", 66) // Allow up to 4 lines of text for long entity names

      nameGroup
        .append("xhtml:div")
        .style("font-size", "0.875rem")
        .style("font-family", "'Inter', -apple-system, sans-serif")
        .style("font-weight", "600")
        .style("color", COLORS.header)
        .style("line-height", "1.2")
        .style("white-space", "pre-line") // Respect newline characters in label
        .style("overflow", "hidden")
        .text(reservoir.reservoirName)

      // Check data type:
      // - CWS with stats: has annualAvgTaf > 0 (show delivery/reliability/shortage)
      // - Entity with attributes: capacityTaf === 0, labelAttributes present (reservoir-style key→value rows)
      // - CWS without stats: capacityTaf === 0 and no annualAvgTaf, no labelAttributes (show name only)
      // - Reservoir: has capacityTaf > 0 (show system/capacity/dead pool)
      const isCwsWithStats =
        reservoir.annualAvgTaf !== undefined && reservoir.annualAvgTaf > 0
      const hasLabelAttributes =
        reservoir.capacityTaf === 0 &&
        !isCwsWithStats &&
        (reservoir.labelAttributes?.length ?? 0) > 0
      const isCwsWithoutStats =
        reservoir.capacityTaf === 0 && !isCwsWithStats && !hasLabelAttributes

      if (isCwsWithStats) {
        // CWS-specific labels: Annual average, Reliability, Shortage frequency
        // Start below the entity name (which can wrap to 3 lines, ~54px)
        let currentY = rowTop + 68

        // Annual average delivery
        g.append("text")
          .attr("x", labelX)
          .attr("y", currentY)
          .attr("text-anchor", "start")
          .attr("dominant-baseline", "hanging")
          .attr("font-size", "0.6875rem")
          .attr("font-family", "'Inter', -apple-system, sans-serif")
          .attr("font-weight", "400")
          .attr("fill", COLORS.text)
          .attr("text-transform", "uppercase")
          .attr("letter-spacing", "0.05em")
          .text("Avg delivery")
        g.append("text")
          .attr("x", labelX)
          .attr("y", currentY + 14)
          .attr("text-anchor", "start")
          .attr("dominant-baseline", "hanging")
          .attr("font-size", "0.875rem")
          .attr("font-family", "'Inter', -apple-system, sans-serif")
          .attr("font-weight", "600")
          .attr("font-feature-settings", "'tnum' 1")
          .attr("fill", COLORS.header)
          .text(
            `${Math.round(reservoir.annualAvgTaf!).toLocaleString()} TAF/yr`,
          )
        currentY += 32

        // Reliability percentage
        if (reservoir.reliabilityPct !== undefined) {
          g.append("text")
            .attr("x", labelX)
            .attr("y", currentY)
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "hanging")
            .attr("font-size", "0.6875rem")
            .attr("font-family", "'Inter', -apple-system, sans-serif")
            .attr("font-weight", "400")
            .attr("fill", COLORS.text)
            .attr("text-transform", "uppercase")
            .attr("letter-spacing", "0.05em")
            .text("P95 reliability")
          g.append("text")
            .attr("x", labelX)
            .attr("y", currentY + 14)
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "hanging")
            .attr("font-size", "0.875rem")
            .attr("font-family", "'Inter', -apple-system, sans-serif")
            .attr("font-weight", "600")
            .attr("font-feature-settings", "'tnum' 1")
            .attr("fill", COLORS.capacity) // Green for good metric
            .text(`${Math.round(reservoir.reliabilityPct)}%`)
          currentY += 32
        }

        // Shortage frequency percentage
        if (
          reservoir.shortageFrequencyPct !== undefined &&
          reservoir.shortageFrequencyPct > 0
        ) {
          g.append("text")
            .attr("x", labelX)
            .attr("y", currentY)
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "hanging")
            .attr("font-size", "0.6875rem")
            .attr("font-family", "'Inter', -apple-system, sans-serif")
            .attr("font-weight", "400")
            .attr("fill", COLORS.text)
            .attr("text-transform", "uppercase")
            .attr("letter-spacing", "0.05em")
            .text("Shortage freq")
          g.append("text")
            .attr("x", labelX)
            .attr("y", currentY + 14)
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "hanging")
            .attr("font-size", "0.875rem")
            .attr("font-family", "'Inter', -apple-system, sans-serif")
            .attr("font-weight", "600")
            .attr("font-feature-settings", "'tnum' 1")
            .attr("fill", COLORS.deadPool) // Orange/red for concerning metric
            .text(`${Math.round(reservoir.shortageFrequencyPct)}%`)
        }
      } else if (hasLabelAttributes) {
        // Entity with custom label attributes (e.g. refuge demand units).
        // Renders a subtitle line + key→value pairs in reservoir-label style.
        let attrY = rowTop + 68

        if (reservoir.labelSubtitle) {
          g.append("text")
            .attr("x", labelX)
            .attr("y", rowTop + 68)
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "hanging")
            .attr("font-size", "0.75rem")
            .attr("font-family", "'Inter', -apple-system, sans-serif")
            .attr("font-weight", "500")
            .attr("fill", COLORS.text)
            .attr("letter-spacing", "0.02em")
            .text(reservoir.labelSubtitle)
          attrY = rowTop + 68 + 20
        }

        reservoir.labelAttributes!.forEach(({ key, value }) => {
          // Key — small uppercase label
          g.append("text")
            .attr("x", labelX)
            .attr("y", attrY)
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "hanging")
            .attr("font-size", "0.6875rem")
            .attr("font-family", "'Inter', -apple-system, sans-serif")
            .attr("font-weight", "400")
            .attr("fill", COLORS.text)
            .attr("letter-spacing", "0.05em")
            .text(key)
          // Value — bold, tabular figures
          g.append("text")
            .attr("x", labelX)
            .attr("y", attrY + 14)
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "hanging")
            .attr("font-size", "0.875rem")
            .attr("font-family", "'Inter', -apple-system, sans-serif")
            .attr("font-weight", "600")
            .attr("font-feature-settings", "'tnum' 1")
            .attr("fill", COLORS.header)
            .text(value)
          attrY += 32
        })
      } else if (isCwsWithoutStats) {
        // CWS entity without per-scenario stats - just show name (already rendered above)
        // No additional labels needed since stats vary by scenario
      } else {
        // Standard reservoir labels: System, Capacity, Dead pool
        // Start below the entity name (which can wrap to 3 lines, ~54px)
        const labelStartY = rowTop + 68
        // System info (SWP/CVP) - secondary metadata
        const system =
          reservoir.system || RESERVOIR_SYSTEMS[reservoir.reservoirId] || ""
        if (system) {
          g.append("text")
            .attr("x", labelX)
            .attr("y", labelStartY)
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
        // Position below system label if present, otherwise at labelStartY
        const capacityY = system ? labelStartY + 18 : labelStartY
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

        // Dead pool - shown if value exists
        const deadPoolY = capacityY + 32
        if (reservoir.deadPoolTaf > 0) {
          // Label
          g.append("text")
            .attr("x", labelX)
            .attr("y", deadPoolY)
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "hanging")
            .attr("font-size", "0.6875rem") // 11px - small label
            .attr("font-family", "'Inter', -apple-system, sans-serif")
            .attr("font-weight", "400")
            .attr("fill", COLORS.text)
            .attr("text-transform", "uppercase")
            .attr("letter-spacing", "0.05em")
            .text("Dead pool")
          // Value
          g.append("text")
            .attr("x", labelX)
            .attr("y", deadPoolY + 14)
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "hanging")
            .attr("font-size", "0.875rem") // 14px
            .attr("font-family", "'Inter', -apple-system, sans-serif")
            .attr("font-weight", "600")
            .attr("font-feature-settings", "'tnum' 1") // Tabular numbers
            .attr("fill", COLORS.header)
            .text(`${reservoir.deadPoolTaf.toLocaleString()} TAF`)
        }

        // Context note with tooltip (for reservoirs with special context)
        const contextNote = RESERVOIR_CONTEXT[reservoir.reservoirId]
        if (contextNote) {
          const contextY =
            reservoir.deadPoolTaf > 0 ? deadPoolY + 34 : capacityY + 34
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
      }
    })

    // Draw horizontal gridlines within chart cells
    const gridStartX = getCellX(0) // Start at first chart cell
    const gridEndX = getCellX(scenarios.length - 1) + cellWidth // End at last chart cell
    const fullLeftX = -margin.left + 5 // Full width for row dividers (aligned with title block)

    // Draw per-reservoir gridlines and Y-axis labels
    reservoirs.forEach((reservoir, rowIndex) => {
      const reservoirYDomain = getYDomain(reservoir.reservoirId)
      const reservoirYScale = getYScale(reservoir.reservoirId)

      // Generate tick values for this reservoir
      const yAxisTicks =
        displayMode === "percentage"
          ? [0, 20, 40, 60, 80, 100]
          : d3.ticks(reservoirYDomain[0], reservoirYDomain[1], 5)

      yAxisTicks.forEach((val) => {
        const y =
          colHeaderHeight +
          rowIndex * cellHeight +
          chartPadding.top +
          reservoirYScale(val)

        // Gridline (spans all scenario columns for this row)
        const isRefLine =
          (displayMode === "percentage" && val === 50) ||
          (yAxisReferenceValue !== undefined && val === yAxisReferenceValue)
        g.append("line")
          .attr("x1", gridStartX)
          .attr("x2", gridEndX)
          .attr("y1", y)
          .attr("y2", y)
          .attr("stroke", isRefLine ? COLORS.gridStrong : COLORS.grid)
          .attr("stroke-width", isRefLine ? 1 : 0.5)

        // Y-axis label — use enough decimal places for the domain range
        const domainMax = reservoirYDomain[1]
        const rawLabel =
          displayMode === "percentage"
            ? `${val}%`
            : domainMax < 0.1
              ? val.toFixed(3)
              : domainMax < 1
                ? val.toFixed(2)
                : domainMax < 10
                  ? val.toFixed(1)
                  : `${Math.round(val).toLocaleString()}`
        const labelText =
          yAxisSuffix && displayMode !== "percentage"
            ? `${rawLabel}${yAxisSuffix}`
            : rawLabel
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

    // Select base color scheme based on colorScheme prop
    const baseColors = colorScheme === "shortage" ? COLORS_SHORTAGE : COLORS

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
      // Default colors based on selected color scheme
      return {
        range: baseColors.range,
        outer: baseColors.outer,
        inner: baseColors.inner,
        median: baseColors.median,
      }
    }

    // Draw each cell's chart
    reservoirs.forEach((reservoir, rowIndex) => {
      // Get the Y scale for this reservoir (different for each in relative mode)
      const cellYScale = getYScale(reservoir.reservoirId)

      scenarios.forEach((scenarioId, colIndex) => {
        const cellX = getCellX(colIndex) + chartPadding.left
        const cellY = colHeaderHeight + rowIndex * cellHeight + chartPadding.top

        const cellG = g
          .append("g")
          .attr("transform", `translate(${cellX},${cellY})`)

        // Check if this scenario is still loading and has no data for this cell
        if (loadingScenarios?.includes(scenarioId)) {
          const mainCellData = data[reservoir.reservoirId]?.[scenarioId]
          const breakdownCellData =
            breakdownData?.[reservoir.reservoirId]?.[scenarioId]
          const hasMainData =
            mainCellData && Object.keys(mainCellData).length > 0
          const hasBreakdown =
            breakdownCellData && Object.keys(breakdownCellData).length > 0

          if (!hasMainData && !hasBreakdown) {
            // Draw animated loading spinner (SVG-native animation)
            const cx = chartWidth / 2
            const cy = chartHeight / 2
            const spinnerR = 8

            const spinner = cellG
              .append("circle")
              .attr("cx", cx)
              .attr("cy", cy)
              .attr("r", spinnerR)
              .attr("fill", "none")
              .attr("stroke", COLORS.gridStrong)
              .attr("stroke-width", 2)
              .attr("stroke-dasharray", `${spinnerR * 1.5} ${spinnerR * 4.7}`)
              .attr("stroke-linecap", "round")

            spinner
              .append("animateTransform")
              .attr("attributeName", "transform")
              .attr("type", "rotate")
              .attr("from", `0 ${cx} ${cy}`)
              .attr("to", `360 ${cx} ${cy}`)
              .attr("dur", "1s")
              .attr("repeatCount", "indefinite")

            return
          }
        }

        // Check if this is a breakdown row (stacked chart)
        const components = breakdownComponents?.[reservoir.reservoirId]
        const componentData =
          breakdownData?.[reservoir.reservoirId]?.[scenarioId]

        if (components && componentData && components.length >= 2) {
          // Render stacked percentile bands
          // Components are rendered bottom-to-top, so first component is at y=0
          const bottomComponent = components[0]
          const topComponent = components[1]

          // Type guard - these should exist since we checked length >= 2
          if (!bottomComponent || !topComponent) return

          const bottomData = componentData[bottomComponent.id]
          const topData = componentData[topComponent.id]

          if (bottomData && topData) {
            // Overlay chart: Gray SWP SOD shadow with blue MWD overlay
            // This shows MWD as a portion of total SWP SOD

            // Get SWP SOD total data (MWD + Other SWP = SWP SOD)
            // bottomData = MWD, topData = Other SWP
            type OverlayDataItem = {
              monthIndex: number
              // SWP SOD totals (gray background)
              totalQ100: number
              totalMedian: number
              // MWD values (blue overlay)
              mwdQ100: number
              mwdMedian: number
            }
            const overlayData: OverlayDataItem[] = []

            for (let i = 1; i <= 12; i++) {
              const monthStr = i.toString()
              const mwdMonth = bottomData[monthStr]
              const otherSwpMonth = topData[monthStr]
              if (mwdMonth && otherSwpMonth) {
                overlayData.push({
                  monthIndex: i - 1,
                  // Total SWP SOD = MWD + Other SWP
                  totalQ100: mwdMonth.q100 + otherSwpMonth.q100,
                  totalMedian: mwdMonth.q50 + otherSwpMonth.q50,
                  // MWD values
                  mwdQ100: mwdMonth.q100,
                  mwdMedian: mwdMonth.q50,
                })
              }
            }

            if (overlayData.length > 0) {
              const mwdColor = bottomComponent.color // Blue for MWD
              const totalColor = topComponent.color // Green for total (SWP SOD or SWP Total)

              // Derive total label from reservoir name (e.g., "MWD portion\nof SWP SOD" -> "SWP SOD")
              const totalLabel =
                reservoir.reservoirName.split("of ").pop()?.trim() || "Total"

              // 1. Draw total as green shadow (0 to q100)
              const totalArea = d3
                .area<OverlayDataItem>()
                .x((d) => xScale(d.monthIndex))
                .y0(() => cellYScale(0))
                .y1((d) => cellYScale(d.totalQ100))
                .curve(d3.curveLinear)

              cellG
                .append("path")
                .datum(overlayData)
                .attr("fill", hexToRgba(totalColor, 0.2))
                .attr("d", totalArea)

              // 2. Draw SWP SOD median line (green, dashed)
              const totalMedianLine = d3
                .line<OverlayDataItem>()
                .x((d) => xScale(d.monthIndex))
                .y((d) => cellYScale(d.totalMedian))
                .curve(d3.curveLinear)

              cellG
                .append("path")
                .datum(overlayData)
                .attr("fill", "none")
                .attr("stroke", totalColor)
                .attr("stroke-width", 1.5)
                .attr("stroke-dasharray", "4,2")
                .attr("d", totalMedianLine)

              // 3. Draw MWD as blue overlay (0 to q100)
              const mwdArea = d3
                .area<OverlayDataItem>()
                .x((d) => xScale(d.monthIndex))
                .y0(() => cellYScale(0))
                .y1((d) => cellYScale(d.mwdQ100))
                .curve(d3.curveLinear)

              cellG
                .append("path")
                .datum(overlayData)
                .attr("fill", hexToRgba(mwdColor, 0.4))
                .attr("d", mwdArea)

              // 4. Draw MWD median line (blue, solid)
              const mwdMedianLine = d3
                .line<OverlayDataItem>()
                .x((d) => xScale(d.monthIndex))
                .y((d) => cellYScale(d.mwdMedian))
                .curve(d3.curveLinear)

              cellG
                .append("path")
                .datum(overlayData)
                .attr("fill", "none")
                .attr("stroke", mwdColor)
                .attr("stroke-width", 1.5)
                .attr("d", mwdMedianLine)

              // 5. Add legend with 2x2 grid layout
              const legendPadding = 8
              const legendY = chartHeight + 16 + legendPadding
              const legendRowHeight = 20
              const col1X = legendPadding
              const col2X = 120 // Fixed column for alignment (adjusted for larger font)
              const iconWidth = 18
              const labelGap = 6
              const legendFontSize = "12px"

              // Draw legend background
              cellG
                .append("rect")
                .attr("x", 0)
                .attr("y", chartHeight + 14)
                .attr("width", chartWidth)
                .attr("height", legendRowHeight * 2 + legendPadding * 2 + 4)
                .attr("fill", hexToRgba("#f8f9fa", 0.9))
                .attr("rx", 4)

              // Row 1, Col 1: Total range (e.g., "SWP SOD range" or "SWP Total range")
              cellG
                .append("rect")
                .attr("x", col1X)
                .attr("y", legendY)
                .attr("width", iconWidth)
                .attr("height", 10)
                .attr("fill", hexToRgba(totalColor, 0.2))
                .attr("stroke", totalColor)
                .attr("stroke-width", 0.5)
              cellG
                .append("text")
                .attr("x", col1X + iconWidth + labelGap)
                .attr("y", legendY + 8)
                .attr("font-size", legendFontSize)
                .attr("font-family", "'Inter', -apple-system, sans-serif")
                .attr("fill", COLORS.text)
                .text(`${totalLabel} range`)

              // Row 1, Col 2: Total median (e.g., "SWP SOD median" or "SWP Total median")
              cellG
                .append("line")
                .attr("x1", col2X)
                .attr("x2", col2X + iconWidth)
                .attr("y1", legendY + 5)
                .attr("y2", legendY + 5)
                .attr("stroke", totalColor)
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "4,2")
              cellG
                .append("text")
                .attr("x", col2X + iconWidth + labelGap)
                .attr("y", legendY + 8)
                .attr("font-size", legendFontSize)
                .attr("font-family", "'Inter', -apple-system, sans-serif")
                .attr("fill", COLORS.text)
                .text(`${totalLabel} median`)

              // Row 2, Col 1: MWD range
              const row2Y = legendY + legendRowHeight
              cellG
                .append("rect")
                .attr("x", col1X)
                .attr("y", row2Y)
                .attr("width", iconWidth)
                .attr("height", 10)
                .attr("fill", hexToRgba(mwdColor, 0.4))
                .attr("stroke", mwdColor)
                .attr("stroke-width", 0.5)
              cellG
                .append("text")
                .attr("x", col1X + iconWidth + labelGap)
                .attr("y", row2Y + 8)
                .attr("font-size", legendFontSize)
                .attr("font-family", "'Inter', -apple-system, sans-serif")
                .attr("fill", COLORS.text)
                .text("MWD range")

              // Row 2, Col 2: MWD median
              cellG
                .append("line")
                .attr("x1", col2X)
                .attr("x2", col2X + iconWidth)
                .attr("y1", row2Y + 5)
                .attr("y2", row2Y + 5)
                .attr("stroke", mwdColor)
                .attr("stroke-width", 2)
              cellG
                .append("text")
                .attr("x", col2X + iconWidth + labelGap)
                .attr("y", row2Y + 8)
                .attr("font-size", legendFontSize)
                .attr("font-family", "'Inter', -apple-system, sans-serif")
                .attr("fill", COLORS.text)
                .text("MWD median")
            }
          }
        } else {
          // Standard single-entity percentile band rendering
          const cellData = data[reservoir.reservoirId]?.[scenarioId]
          if (!cellData) return

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

          // Area generators (using per-reservoir Y scale)
          const rangeArea = d3
            .area<(typeof processedData)[0]>()
            .x((d) => xScale(d.monthIndex))
            .y0((d) => cellYScale(d.q0))
            .y1((d) => cellYScale(d.q100))
            .curve(d3.curveLinear)

          const outerArea = d3
            .area<(typeof processedData)[0]>()
            .x((d) => xScale(d.monthIndex))
            .y0((d) => cellYScale(d.q10))
            .y1((d) => cellYScale(d.q90))
            .curve(d3.curveLinear)

          const innerArea = d3
            .area<(typeof processedData)[0]>()
            .x((d) => xScale(d.monthIndex))
            .y0((d) => cellYScale(d.q30))
            .y1((d) => cellYScale(d.q70))
            .curve(d3.curveLinear)

          const medianLine = d3
            .line<(typeof processedData)[0]>()
            .x((d) => xScale(d.monthIndex))
            .y((d) => cellYScale(d.q50))
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
        }
      })
    })

    // Draw per-cell summary statistics below each chart (when cellStats provided)
    if (cellStats) {
      reservoirs.forEach((reservoir, rowIndex) => {
        scenarios.forEach((scenarioId, colIndex) => {
          const stats = cellStats[reservoir.reservoirId]?.[scenarioId]
          if (!stats) return

          const cellX = getCellX(colIndex) + chartPadding.left
          // Position stats below x-axis labels
          const statsY =
            colHeaderHeight +
            rowIndex * cellHeight +
            chartPadding.top +
            chartHeight +
            22 // Below x-axis month labels

          const statsG = g
            .append("g")
            .attr("transform", `translate(${cellX},${statsY})`)

          let currentY = 0
          const lineHeight = 20
          const labelFontSize = "12px"
          const valueFontSize = "13px"

          // Layout: labels on left, values aligned on right
          const valueX = 90 // Right-aligned value column

          // Avg delivery
          if (stats.annualAvgTaf !== undefined && stats.annualAvgTaf > 0) {
            statsG
              .append("text")
              .attr("x", 0)
              .attr("y", currentY)
              .attr("text-anchor", "start")
              .attr("dominant-baseline", "hanging")
              .attr("font-size", labelFontSize)
              .attr("font-family", "'Inter', -apple-system, sans-serif")
              .attr("fill", COLORS.text)
              .text("Avg delivery")
            statsG
              .append("text")
              .attr("x", valueX)
              .attr("y", currentY)
              .attr("text-anchor", "start")
              .attr("dominant-baseline", "hanging")
              .attr("font-size", valueFontSize)
              .attr("font-family", "'Inter', -apple-system, sans-serif")
              .attr("font-weight", "600")
              .attr("font-feature-settings", "'tnum' 1")
              .attr("fill", COLORS.header)
              .text(
                (() => {
                  const taf = stats.annualAvgTaf!
                  if (taf < 0.1) return `${Math.round(taf * 1000)} AF/yr`
                  if (taf < 10) return `${taf.toFixed(1)} TAF/yr`
                  return `${Math.round(taf).toLocaleString()} TAF/yr`
                })(),
              )
            currentY += lineHeight
          }

          // Reliability (green for good metric)
          if (stats.reliabilityPct !== undefined) {
            statsG
              .append("text")
              .attr("x", 0)
              .attr("y", currentY)
              .attr("text-anchor", "start")
              .attr("dominant-baseline", "hanging")
              .attr("font-size", labelFontSize)
              .attr("font-family", "'Inter', -apple-system, sans-serif")
              .attr("fill", COLORS.text)
              .text("P95 reliability")
            statsG
              .append("text")
              .attr("x", valueX)
              .attr("y", currentY)
              .attr("text-anchor", "start")
              .attr("dominant-baseline", "hanging")
              .attr("font-size", valueFontSize)
              .attr("font-family", "'Inter', -apple-system, sans-serif")
              .attr("font-weight", "600")
              .attr("font-feature-settings", "'tnum' 1")
              .attr("fill", COLORS.capacity) // Green
              .text(`${Math.round(stats.reliabilityPct)}%`)
            currentY += lineHeight
          }

          // Shortage frequency (orange/red for concerning metric)
          if (
            stats.shortageFrequencyPct !== undefined &&
            stats.shortageFrequencyPct > 0
          ) {
            statsG
              .append("text")
              .attr("x", 0)
              .attr("y", currentY)
              .attr("text-anchor", "start")
              .attr("dominant-baseline", "hanging")
              .attr("font-size", labelFontSize)
              .attr("font-family", "'Inter', -apple-system, sans-serif")
              .attr("fill", COLORS.text)
              .text("Shortage freq")
            statsG
              .append("text")
              .attr("x", valueX)
              .attr("y", currentY)
              .attr("text-anchor", "start")
              .attr("dominant-baseline", "hanging")
              .attr("font-size", valueFontSize)
              .attr("font-family", "'Inter', -apple-system, sans-serif")
              .attr("font-weight", "600")
              .attr("font-feature-settings", "'tnum' 1")
              .attr("fill", COLORS.deadPool) // Orange/red
              .text(`${Math.round(stats.shortageFrequencyPct)}%`)
            currentY += lineHeight
          }

          // Dry-year indicator with tooltip (for M&I contractors with q0=0 months)
          if (stats.hasDryYearMonths) {
            const dryYearText = statsG
              .append("text")
              .attr("x", 0)
              .attr("y", currentY)
              .attr("text-anchor", "start")
              .attr("dominant-baseline", "hanging")
              .attr("font-size", labelFontSize)
              .attr("font-family", "'Inter', -apple-system, sans-serif")
              .attr("font-weight", "500")
              .attr("fill", "#b45309") // Amber-700 for warning
              .attr("cursor", "help")
              .text("⚠ Dry year note")

            // Add dotted underline
            const dryYearTextWidth = dryYearText.node()?.getBBox().width ?? 85
            statsG
              .append("line")
              .attr("x1", 14) // Start after the warning icon
              .attr("x2", dryYearTextWidth)
              .attr("y1", currentY + 14)
              .attr("y2", currentY + 14)
              .attr("stroke", "#b45309")
              .attr("stroke-width", 1)
              .attr("stroke-dasharray", "2,2")
              .attr("cursor", "help")

            // Invisible hover area for tooltip
            statsG
              .append("rect")
              .attr("x", -2)
              .attr("y", currentY - 2)
              .attr("width", dryYearTextWidth + 4)
              .attr("height", 18)
              .attr("fill", "transparent")
              .attr("cursor", "help")
              .on("mouseenter", (event) => {
                let tooltipEl = d3.select<HTMLDivElement, unknown>(
                  "#dry-year-tooltip",
                )
                if (tooltipEl.empty()) {
                  tooltipEl = d3
                    .select("body")
                    .append<HTMLDivElement>("div")
                    .attr("id", "dry-year-tooltip")
                    .style("position", "absolute")
                    .style("background", "#fffbeb") // Amber-50 background
                    .style("border", "1px solid #fcd34d") // Amber-300 border
                    .style("border-radius", "6px")
                    .style("padding", "12px 16px")
                    .style("font-size", "13px")
                    .style("font-family", "'Inter', -apple-system, sans-serif")
                    .style("box-shadow", "0 4px 20px rgba(0,0,0,0.15)")
                    .style("pointer-events", "none")
                    .style("z-index", "1000")
                    .style("max-width", "320px")
                    .style("line-height", "1.5")
                    .style("color", "#92400e") // Amber-800 text
                }
                tooltipEl
                  .style("visibility", "visible")
                  .style("left", `${event.pageX + 12}px`)
                  .style("top", `${event.pageY - 10}px`)
                  .text(
                    "In dry years, this contractor may receive no Table A allocation for some months. The chart's lower band touching zero reflects these zero-delivery months in the driest historical scenarios.",
                  )
              })
              .on("mouseleave", () => {
                d3.select<HTMLDivElement, unknown>("#dry-year-tooltip").style(
                  "visibility",
                  "hidden",
                )
              })

            currentY += lineHeight
          }

          // Context tooltip for CWS statistics explanation
          // Build dynamic context text based on entity and stats (HTML formatted)
          let cwsContextNote: string
          if (reservoir.reservoirId === "cvp_sod") {
            // CVP South of Delta has a special context explaining its frequent but tiny shortages
            const shortageYears = Math.round(stats.shortageFrequencyPct ?? 0)
            const avgDelivery = stats.annualAvgTaf ?? 0
            const reliability = stats.reliabilityPct ?? 100
            // Calculate avg shortage: avgShortage = avgDelivery * (1 - reliability/100)
            const avgShortage = avgDelivery * (1 - reliability / 100)
            const shortagePct = (100 - reliability).toFixed(2)
            cwsContextNote = `CVP South of Delta has frequent but tiny shortages. ${shortageYears} out of 100 years have some shortage (>0.1 TAF). But avg shortage is only ${avgShortage.toFixed(2)} TAF/yr out of ${Math.round(avgDelivery).toLocaleString()} TAF delivered. That's only ${shortagePct}% of delivery! To see shortage amounts toggle the controls above.`
          } else {
            cwsContextNote = `<p style="margin: 0 0 10px 0;"><strong>P95 reliability</strong> = in 95 of 100 simulated years, at least this % of annual demand was delivered. Computed as (delivery at exceedance p95) ÷ annual demand × 100. Higher is better; 95–100 % = fully reliable.</p><p style="margin: 0;"><strong>Shortage frequency</strong> = percentage of years with any shortage (&gt;0.1 TAF threshold). This filters CalSim solver noise.</p>`
          }

          const contextText = statsG
            .append("text")
            .attr("x", 0)
            .attr("y", currentY)
            .attr("text-anchor", "start")
            .attr("dominant-baseline", "hanging")
            .attr("font-size", labelFontSize)
            .attr("font-family", "'Inter', -apple-system, sans-serif")
            .attr("font-weight", "500")
            .attr("fill", COLORS.text)
            .attr("cursor", "help")
            .text("Context")

          // Add dotted underline
          const textWidth = contextText.node()?.getBBox().width ?? 42
          statsG
            .append("line")
            .attr("x1", 0)
            .attr("x2", textWidth)
            .attr("y1", currentY + 14)
            .attr("y2", currentY + 14)
            .attr("stroke", COLORS.text)
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "2,2")
            .attr("cursor", "help")

          // Invisible hover area for tooltip
          statsG
            .append("rect")
            .attr("x", -2)
            .attr("y", currentY - 2)
            .attr("width", textWidth + 4)
            .attr("height", 18)
            .attr("fill", "transparent")
            .attr("cursor", "help")
            .on("mouseenter", (event) => {
              let tooltipEl = d3.select<HTMLDivElement, unknown>(
                "#cws-context-tooltip",
              )
              if (tooltipEl.empty()) {
                tooltipEl = d3
                  .select("body")
                  .append<HTMLDivElement>("div")
                  .attr("id", "cws-context-tooltip")
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
                .html(cwsContextNote)
            })
            .on("mouseleave", () => {
              d3.select<HTMLDivElement, unknown>("#cws-context-tooltip").style(
                "visibility",
                "hidden",
              )
            })
        })
      })
    }

    // Draw capacity and dead pool reference lines for each reservoir
    // Only for reservoir storage charts (not CWS charts which have cellStats)
    // Drawn AFTER chart shapes so they appear on top and aren't occluded
    if (!cellStats) {
      reservoirs.forEach((reservoir, rowIndex) => {
        const reservoirYScale = getYScale(reservoir.reservoirId)
        const cellTop =
          colHeaderHeight + rowIndex * cellHeight + chartPadding.top

        // Calculate capacity and dead pool values based on display mode
        const capacityValue =
          displayMode === "percentage" ? 100 : reservoir.capacityTaf
        const deadPoolValue =
          displayMode === "percentage"
            ? reservoir.capacityTaf > 0
              ? (reservoir.deadPoolTaf / reservoir.capacityTaf) * 100
              : 0
            : reservoir.deadPoolTaf

        // Draw capacity line (spans all scenario columns)
        const capacityY = cellTop + reservoirYScale(capacityValue)
        // Only draw if capacity line is within visible chart area
        if (capacityY >= cellTop && capacityY <= cellTop + chartHeight) {
          g.append("line")
            .attr("x1", gridStartX + chartPadding.left)
            .attr("x2", gridEndX - chartPadding.right)
            .attr("y1", capacityY)
            .attr("y2", capacityY)
            .attr("stroke", COLORS.capacity)
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "6,3")
            .attr("opacity", 0.8)
        }

        // Draw dead pool line if dead pool value exists
        if (reservoir.deadPoolTaf > 0) {
          const deadPoolY = cellTop + reservoirYScale(deadPoolValue)
          // Only draw if dead pool line is within visible chart area
          if (deadPoolY >= cellTop && deadPoolY <= cellTop + chartHeight) {
            g.append("line")
              .attr("x1", gridStartX + chartPadding.left)
              .attr("x2", gridEndX - chartPadding.right)
              .attr("y1", deadPoolY)
              .attr("y2", deadPoolY)
              .attr("stroke", COLORS.deadPool)
              .attr("stroke-width", 1.5)
              .attr("stroke-dasharray", "4,2")
              .attr("opacity", 0.8)
          }
        }
      })
    }

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
      .attr("stroke", baseColors.median)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,2")
      .style("visibility", "hidden")
      .style("pointer-events", "none")

    // Hover rectangles for each cell
    reservoirs.forEach((reservoir, rowIndex) => {
      scenarios.forEach((scenarioId, colIndex) => {
        const cellData = data[reservoir.reservoirId]?.[scenarioId]
        const components = breakdownComponents?.[reservoir.reservoirId]
        const componentData =
          breakdownData?.[reservoir.reservoirId]?.[scenarioId]
        const isBreakdownRow =
          components && componentData && components.length >= 2

        // Skip if no data (but allow breakdown rows)
        if (!cellData && !isBreakdownRow) return

        const cellX = getCellX(colIndex)
        const cellY = colHeaderHeight + rowIndex * cellHeight
        const cellTop = cellY + chartPadding.top
        const cellBottom = cellTop + chartHeight

        // Only cover the chart area, not the stats area below (where "Context" link is)
        const hoverHeight = cellStats
          ? chartPadding.top + chartHeight + 20 // Just chart + x-axis labels
          : cellHeight // Full cell for non-CWS charts
        g.append("rect")
          .attr("x", cellX)
          .attr("y", cellY)
          .attr("width", cellWidth)
          .attr("height", hoverHeight)
          .attr("fill", "transparent")
          .style("cursor", "crosshair")
          .on("mousemove", (event) => {
            const [mouseX] = d3.pointer(event, g.node())
            const relativeX = mouseX - cellX - chartPadding.left
            const monthIndex = Math.round(xScale.invert(relativeX))

            if (monthIndex >= 0 && monthIndex < 12) {
              const unit =
                tooltipUnit ?? (displayMode === "volume" ? " TAF" : "%")
              const _yMax = getYDomain(reservoir.reservoirId)[1]
              const formatValue = (v: number) =>
                displayMode === "volume"
                  ? _yMax < 0.1
                    ? v.toFixed(3)
                    : _yMax < 1
                      ? v.toFixed(2)
                      : _yMax < 10
                        ? v.toFixed(1)
                        : v.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })
                  : v.toFixed(0)

              // Update playhead position (snapped to month)
              const playheadX = cellX + chartPadding.left + xScale(monthIndex)
              playhead
                .attr("x1", playheadX)
                .attr("x2", playheadX)
                .attr("y1", cellTop)
                .attr("y2", cellBottom)
                .style("visibility", "visible")

              if (isBreakdownRow && components && componentData) {
                // Breakdown row tooltip: show SWP SOD total and MWD values
                const bottomComponent = components[0]
                const topComponent = components[1]
                if (!bottomComponent || !topComponent) return

                const mwdData = componentData[bottomComponent.id]
                const otherSwpData = componentData[topComponent.id]
                const monthStr = (monthIndex + 1).toString()
                const mwdMonth = mwdData?.[monthStr]
                const otherSwpMonth = otherSwpData?.[monthStr]

                if (mwdMonth && otherSwpMonth) {
                  const mwdColor = bottomComponent.color
                  const totalColor = topComponent.color
                  const totalMedian = mwdMonth.q50 + otherSwpMonth.q50
                  const totalQ90 = mwdMonth.q90 + otherSwpMonth.q90
                  const totalQ10 = mwdMonth.q10 + otherSwpMonth.q10

                  // Derive total label from reservoir name (e.g., "MWD portion\nof SWP SOD" -> "SWP SOD")
                  const totalLabel =
                    reservoir.reservoirName.split("of ").pop()?.trim() ||
                    "Total"

                  tooltip
                    .style("visibility", "visible")
                    .style("left", `${event.pageX + 12}px`)
                    .style("top", `${event.pageY - 10}px`).html(`
                      <div style="font-weight: 600; color: ${COLORS.header}; margin-bottom: 6px;">
                        MWD portion of ${totalLabel} · ${WATER_MONTH_NAMES[monthIndex]}
                      </div>
                      <div style="color: ${COLORS.text}; font-size: 10px; margin-bottom: 8px;">
                        ${scenarioNames[scenarioId] || scenarioId}
                      </div>
                      <div style="margin-bottom: 6px;">
                        <div style="font-weight: 600; color: ${totalColor}; margin-bottom: 2px;">${totalLabel}</div>
                        <div style="display: grid; grid-template-columns: auto auto; gap: 1px 10px; color: #6b7785; padding-left: 8px;">
                          <span>90th</span><span style="text-align: right;">${formatValue(totalQ90)}${unit}</span>
                          <span style="font-weight: 600; color: ${totalColor};">Median</span>
                          <span style="text-align: right; font-weight: 600; color: ${totalColor};">${formatValue(totalMedian)}${unit}</span>
                          <span>10th</span><span style="text-align: right;">${formatValue(totalQ10)}${unit}</span>
                        </div>
                      </div>
                      <div>
                        <div style="font-weight: 600; color: ${mwdColor}; margin-bottom: 2px;">MWD</div>
                        <div style="display: grid; grid-template-columns: auto auto; gap: 1px 10px; color: #6b7785; padding-left: 8px;">
                          <span>90th</span><span style="text-align: right;">${formatValue(mwdMonth.q90)}${unit}</span>
                          <span style="font-weight: 600; color: ${mwdColor};">Median</span>
                          <span style="text-align: right; font-weight: 600; color: ${mwdColor};">${formatValue(mwdMonth.q50)}${unit}</span>
                          <span>10th</span><span style="text-align: right;">${formatValue(mwdMonth.q10)}${unit}</span>
                        </div>
                      </div>
                    `)
                }
              } else if (cellData) {
                // Standard cell tooltip
                const monthData = cellData[(monthIndex + 1).toString()]
                if (monthData) {
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
                        <span style="font-weight: 600; color: ${baseColors.median};">Median</span>
                        <span style="text-align: right; font-weight: 600; color: ${baseColors.median};">${formatValue(monthData.q50)}${unit}</span>
                        <span>10th</span><span style="text-align: right;">${formatValue(monthData.q10)}${unit}</span>
                      </div>
                    `)
                }
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
    volumeScaleMode,
    colorScheme,
    cellStats,
    breakdownData,
    breakdownComponents,
    loadingScenarios,
    minYMaxTaf,
    tooltipUnit,
    yAxisMax,
    yAxisReferenceValue,
    yAxisSuffix,
  ])

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        // Use auto height to allow content to determine size, letting parent scroll
        // This ensures charts aren't compressed in modal/expanded views
        height: responsive ? "auto" : `${height}px`,
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
