"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import * as d3 from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"

export interface VerticalParallelLineData {
  id: string
  name: string
  values: Record<string, number | null>
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
  lineColors?: string[]
  showBaseline?: boolean
  baselineData?: VerticalParallelLineData
  defineOutcome?: boolean
  overlayTiers?: boolean
  onLineHover?: (data: VerticalParallelLineData | null) => void
  onLineClick?: (data: VerticalParallelLineData) => void
}

const VerticalParallelLinePlot: React.FC<VerticalParallelLinePlotProps> = ({
  data,
  axes,
  title = "",
  responsive = true,
  width = 400,
  height = 400,
  margin = { top: 40, right: 60, bottom: 50, left: 100 }, // Increased right margin to prevent clipping
  colors = {
    default: "#1f77b4",
    highlighted: "#ff7f0e",
    background: "#f8f9fa",
  },
  lineColors = [],
  showBaseline = false,
  baselineData,
  defineOutcome = false, // eslint-disable-line @typescript-eslint/no-unused-vars
  overlayTiers = false,
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

  // Track filter ranges for each axis [min, max] approach as this summer.
  const filterRanges = useRef<Record<string, [number, number]>>({})
  
  // Track if any axis is currently being dragged (for connector line opacity)
  const isDragging = useRef<boolean>(false)

  // Track currently hovered scenario for dimming other lines
  const hoveredScenarioRef = useRef<number | null>(null)

  // Centralized filtering function - separate opacity for lines vs circles
  const getScenarioOpacity = useCallback(
    (scenario: VerticalParallelLineData, elementType: "line" | "circle") => {
      // Check if scenario passes all active filters
      const passesAllFilters = axes.every((axis) => {
        const filter = filterRanges.current[axis]
        if (!filter) return true

        const value = scenario.values[axis]
        if (value == null) return true // Null/undefined values pass filters
        return value >= filter[0] && value <= filter[1]
      })

      if (elementType === "circle") {
        // Dots: Full opacity if passes filters, dimmed if not
        return passesAllFilters ? 1.0 : 0.15
      } else {
        // Lines: Full opacity if passes filters, dimmed if not
        return passesAllFilters ? 1.0 : 0.2
      }
    },
    [axes],
  )

  // Check if scenario is active (passes all filters) - for hover eligibility
  const isScenarioActive = useCallback(
    (scenario: VerticalParallelLineData) => {
      return axes.every((axis) => {
        const filter = filterRanges.current[axis]
        if (!filter) return true

        const value = scenario.values[axis]
        if (value == null) return true // Null/undefined values pass filters
        return value >= filter[0] && value <= filter[1]
      })
    },
    [axes],
  )

  // Elegant filtering function - inspired by the old threshold approach
  const updateScenarioVisibility = useCallback(
    (g: d3.Selection<SVGGElement, unknown, null, undefined>) => {
      // Update line and circle opacity based on current filter ranges
      data.forEach((scenario, scenarioIndex) => {
        const lineOpacity = getScenarioOpacity(scenario, "line")
        const circleOpacity = getScenarioOpacity(scenario, "circle")

        // Smooth transitions for lines
        g.select(`.line-${scenarioIndex}`)
          .transition()
          .duration(300)
          .ease(d3.easeQuadOut)
          .attr("opacity", lineOpacity)

        // Smooth transitions for circles
        axes.forEach((axisName) => {
          g.select(`.circle-${scenarioIndex}-${axisName.replace(/\s+/g, "-")}`)
            .transition()
            .duration(300)
            .ease(d3.easeQuadOut)
            .attr("opacity", circleOpacity)
        })
      })
    },
    [data, axes, getScenarioOpacity],
  )

  // Apply hover dimming: dim all lines except the hovered one
  const applyHoverDimming = useCallback(
    (
      g: d3.Selection<SVGGElement, unknown, null, undefined>,
      hoveredIndex: number | null
    ) => {
      data.forEach((scenario, scenarioIndex) => {
        const isHovered = hoveredIndex === scenarioIndex
        const isActive = isScenarioActive(scenario)

        // Calculate opacity based on hover state
        let lineOpacity: number
        let circleOpacity: number

        if (hoveredIndex === null) {
          // No hover - use normal opacity
          lineOpacity = getScenarioOpacity(scenario, "line")
          circleOpacity = getScenarioOpacity(scenario, "circle")
        } else if (isHovered) {
          // This is the hovered line - keep fully visible
          lineOpacity = 1.0
          circleOpacity = 1.0
        } else {
          // Not hovered - dim this line significantly
          lineOpacity = isActive ? 0.15 : 0.05
          circleOpacity = isActive ? 0.2 : 0.1
        }

        // Calculate stroke width
        const strokeWidth = isHovered
          ? 3.5
          : isActive
            ? (scenario.highlighted ? 3 : 2.5)
            : 1.5

        // Apply to line (no transition for responsiveness)
        g.select(`.line-${scenarioIndex}`)
          .attr("opacity", lineOpacity)
          .attr("stroke-width", strokeWidth)

        // Calculate circle radius
        const circleRadius = isHovered
          ? (scenario.highlighted ? 6 : 5)
          : (scenario.highlighted ? 5 : 4)

        // Apply to circles
        axes.forEach((axisName) => {
          g.select(`.circle-${scenarioIndex}-${axisName.replace(/\s+/g, "-")}`)
            .attr("opacity", circleOpacity)
            .attr("r", circleRadius)
        })
      })
    },
    [data, axes, getScenarioOpacity, isScenarioActive]
  )

  // Handle responsive sizing
  useEffect(() => {
    if (responsive && dimensions) {
      setCurrentWidth(dimensions.width || width)
      setCurrentHeight(dimensions.height || height)
    } else {
      setCurrentWidth(width)
      setCurrentHeight(height)
    }
  }, [dimensions, responsive, width, height])

  // Handle explicit height changes (for expand/collapse)
  useEffect(() => {
    if (!responsive) {
      setCurrentHeight(height)
    }
  }, [height, responsive])

  // Observable pattern: Create update function for smooth resizing
  const updateChart = useCallback(
    (newWidth: number, newHeight: number, animate = true) => {
    if (!data || data.length === 0 || !axes || axes.length === 0) return

    const svg = d3.select(svgRef.current)
      const innerWidth = newWidth - margin.left - margin.right
      const innerHeight = newHeight - margin.top - margin.bottom

      // Set up transition for smooth animations
      const t = animate
        ? d3.transition().duration(500).ease(d3.easeCubicOut)
        : null

      // Update SVG viewBox for responsive scaling (Observable pattern)
      svg
        .attr("viewBox", `0 0 ${newWidth} ${newHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet")

      // Create or update scales
    const scales: Record<string, d3.ScaleLinear<number, number>> = {}
    axes.forEach((axis) => {
        scales[axis] = d3.scaleLinear().domain([-1, 1]).range([0, innerWidth])
    })

    const yScale = d3
      .scalePoint()
      .domain(axes)
      .range([0, innerHeight])
        .padding(0)

      // Update or create main group
      let g = svg.select<SVGGElement>(".chart-group")
      if (g.empty()) {
        g = svg
      .append("g")
          .attr("class", "chart-group")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      } else {
        const selection = animate ? g.transition(t as any) : g
        selection.attr("transform", `translate(${margin.left},${margin.top})`)
      }

      // Clean up ALL scenario lines and circles from previous renders
      // This ensures stale elements don't persist when data changes
      g.selectAll("[class^='line-']").remove()
      g.selectAll("[class^='circle-']").remove()

      // Update background
      let background = g.select<SVGRectElement>(".chart-background")
      if (background.empty()) {
        background = g
          .append("rect")
          .attr("class", "chart-background")
      .attr("fill", colors.background)
      .attr("opacity", 0.1)
      .attr("rx", 4)
      }

      const backgroundSelection = animate
        ? background.transition(t as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        : background
      ;(backgroundSelection as any)
        .attr("width", innerWidth)
        .attr("height", innerHeight) // eslint-disable-line @typescript-eslint/no-explicit-any

      // Update axes with smooth transitions
    axes.forEach((axis) => {
      const yPos = yScale(axis)!
        let axisGroup = g.select<SVGGElement>(
          `.axis-${axis.replace(/\s+/g, "-")}`,
        )

        if (axisGroup.empty()) {
          axisGroup = g
            .append("g")
            .attr("class", `axis-${axis.replace(/\s+/g, "-")}`)
        }

        const axisSelection = animate
          ? axisGroup.transition(t as any)
          : axisGroup
        axisSelection.attr("transform", `translate(0, ${yPos})`)

        // Tier overlay background (when enabled) - behind regular axis
        if (overlayTiers) {
          // Remove old tier segments first
          axisGroup.selectAll(".tier-segment").remove()

          const tierColors = ["#CD5C5C", "#FFB347", "#60aacb", "#7b9d3f"] // Red, Orange, Blue, Green (tier4 to tier1)

          // Vary segment proportions based on axis index for visual interest
          const axisIndex = axes.indexOf(axis)
          const segmentProportions = [
            [0.15, 0.25, 0.35, 0.25], // Axis 0: Smaller red, larger blue
            [0.2, 0.3, 0.3, 0.2], // Axis 1: Balanced
            [0.25, 0.2, 0.25, 0.3], // Axis 2: Larger green
            [0.3, 0.25, 0.25, 0.2], // Axis 3: Larger red
            [0.18, 0.32, 0.28, 0.22], // Axis 4: Varied
            [0.22, 0.28, 0.32, 0.18], // Axis 5: Different pattern
            [0.28, 0.22, 0.2, 0.3], // Axis 6: Green emphasis
            [0.2, 0.35, 0.25, 0.2], // Axis 7: Orange emphasis
          ]

          // Use modulo to cycle through patterns if more than 8 axes
          const proportions = segmentProportions[
            axisIndex % segmentProportions.length
          ] || [0.25, 0.25, 0.25, 0.25]

          // Calculate cumulative positions
          let currentPosition = 0

          // Draw thick colored segments with varied lengths
          tierColors.forEach((color, index) => {
            const segmentLength = proportions[index]! * innerWidth

            axisGroup
              .append("line")
              .attr("class", "tier-segment")
              .attr("x1", currentPosition)
              .attr("x2", currentPosition + segmentLength)
              .attr("y1", 0)
              .attr("y2", 0)
              .attr("stroke", color)
              .attr("stroke-width", 18) // Even thicker for better visibility
              .attr("opacity", 0.5) // Slightly more opaque

            currentPosition += segmentLength
          })
        } else {
          // Remove tier segments when overlay is disabled
          axisGroup.selectAll(".tier-segment").remove()
        }

        // Update axis line (original styling) - on top of tiers
        let axisLine = axisGroup.select<SVGLineElement>(".axis-line")
        if (axisLine.empty()) {
          axisLine = axisGroup
            .append("line")
            .attr("class", "axis-line")
            .attr("stroke", "#666") // Original color
            .attr("stroke-width", 2) // Original width
        }

        const lineSelection = animate ? axisLine.transition(t as any) : axisLine // eslint-disable-line @typescript-eslint/no-explicit-any
        ;(lineSelection as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .attr("x1", 0)
        .attr("x2", innerWidth)
          .attr("y1", 0)
          .attr("y2", 0)

        // Update axis label with text wrapping (original styling)
        axisGroup.selectAll(".axis-label").remove() // Remove old labels

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
          axisGroup
            .append("text")
            .attr("class", "axis-label")
          .attr("x", -10)
            .attr("y", 4 + (index - (lines.length - 1) / 2) * lineHeight) // Center multi-line text vertically
          .attr("text-anchor", "end") // Right align text
          .attr("font-size", "12px")
          .attr("font-weight", "500")
          .attr("fill", "#333")
          .text(line)
      })

        // Add tick marks (original styling)
        axisGroup.selectAll(".tick-line").remove()
        axisGroup.selectAll(".tick-label").remove()

        const ticks = [-1, -0.5, 0, 0.5, 1] // Original fixed ticks
      ticks.forEach((tick) => {
          const xPos = scales[axis]!(tick)

        // Tick mark
          axisGroup
            .append("line")
            .attr("class", "tick-line")
          .attr("x1", xPos)
          .attr("x2", xPos)
            .attr("y1", -5) // Above the line (original)
            .attr("y2", 5)
          .attr("stroke", "#666")
          .attr("stroke-width", 1)

        // Tick label
          axisGroup
            .append("text")
            .attr("class", "tick-label")
          .attr("x", xPos)
            .attr("y", -10) // Above the line (original)
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .attr("fill", "#666")
          .text(tick.toString()) // Show exact values including -0.5 and 0.5
        })

        // Add slider arrows using D3 join pattern for persistence (like old code)
        // Store current filter in ref to persist across re-renders
        if (!filterRanges.current[axis]) {
          filterRanges.current[axis] = [-1, 1]
        }

        const currentFilter = filterRanges.current[axis]

        // Left arrow using D3 join pattern for persistence
        const leftArrowData = [{ type: "left", position: currentFilter[0] }]
        const leftArrows = axisGroup
          .selectAll(".axis-arrow-left")
          .data(leftArrowData)

        const leftArrowEnter = leftArrows
      .enter()
      .append("g")
          .attr("class", "axis-arrow axis-arrow-left")
          .style("cursor", "grab")
          .style("filter", "drop-shadow(0 1px 3px rgba(0,0,0,0.12))")

        // Make arrows bigger in expanded view (height > 500)
        const isExpanded = currentHeight > 500
        const arrowScale = isExpanded ? 1.4 : 1.0
        const arrowOffset = isExpanded
          ? "translate(-11, -8)"
          : "translate(-8, -6)"

        // Add invisible larger touch target
        leftArrowEnter
          .append("circle")
          .attr("class", "touch-target")
          .attr("r", isExpanded ? 20 : 16) // Larger touch area
          .attr("fill", "transparent")
          .attr("stroke", "none") // No visible outline
          .style("cursor", "grab")

        // Add visible arrow path on top
        leftArrowEnter
      .append("path")
          .attr(
            "d",
            "M3 12 Q2 12 2 11 Q2 10.5 2.5 10 L7 3 Q8 2 8 2 Q8 2 9 3 L13.5 10 Q14 10.5 14 11 Q14 12 13 12 Z",
          )
          .attr("fill", "#449cd9")
          .attr("stroke", "none")
          .attr("transform", `${arrowOffset} scale(${arrowScale})`)
          .style("pointer-events", "none") // Let touch target handle events

        const leftArrowUpdate = leftArrowEnter.merge(leftArrows as any)
        
        // Update touch target size based on expansion state
        leftArrowUpdate
          .select(".touch-target")
          .attr("r", isExpanded ? 20 : 16)
        
        leftArrowUpdate
          .attr(
            "transform",
            (d: any) =>
              `translate(${scales[axis]!(d.position)}, 2) scale(${arrowScale})`,
          )
          .call(
            d3
              .drag<SVGGElement, any>() // eslint-disable-line @typescript-eslint/no-explicit-any
              .on("start", function () {
                d3.select(this).style("cursor", "grabbing")
                
                // Make connector line more visible when dragging starts
                axisGroup
                  .select(".filter-range")
                  .transition()
                  .duration(150)
                  .attr("opacity", 0.5)
              })
              .on("drag", function (event) {
                const newValue = scales[axis]!.invert(event.x)
                const currentRange = filterRanges.current[axis] || [-1, 1]
                const maxBound = currentRange[1] - 0.1
                const clampedValue = Math.max(-1, Math.min(maxBound, newValue))

                // Update position immediately (maintain scaling)
                d3.select(this).attr(
                  "transform",
                  `translate(${scales[axis]!(clampedValue)}, 2) scale(${arrowScale})`,
                )

                // Update filter range
                filterRanges.current[axis] = [clampedValue, currentRange[1]]

                // Update range indicator
                axisGroup
                  .select(".filter-range")
                  .attr("x1", scales[axis]!(clampedValue))
                  .attr("x2", scales[axis]!(currentRange[1]))

                // Update scenario visibility
                updateScenarioVisibility(g)
              })
              .on("end", function () {
                d3.select(this).style("cursor", "grab")
                
                // Make connector line more transparent when dragging ends
                axisGroup
                  .select(".filter-range")
                  .transition()
                  .duration(300)
                  .attr("opacity", 0.1)
              }),
          )

        // Right arrow using D3 join pattern for persistence
        const rightArrowData = [{ type: "right", position: currentFilter[1] }]
        const rightArrows = axisGroup
          .selectAll(".axis-arrow-right")
          .data(rightArrowData)

        const rightArrowEnter = rightArrows
          .enter()
          .append("g")
          .attr("class", "axis-arrow axis-arrow-right")
          .style("cursor", "grab")
          .style("filter", "drop-shadow(0 1px 3px rgba(0,0,0,0.12))")

        // Add invisible larger touch target
        rightArrowEnter
          .append("circle")
          .attr("class", "touch-target")
          .attr("r", isExpanded ? 20 : 16) // Larger touch area
          .attr("fill", "transparent")
          .attr("stroke", "none") // No visible outline
          .style("cursor", "grab")

        // Add visible arrow path on top
        rightArrowEnter
          .append("path")
          .attr(
            "d",
            "M3 12 Q2 12 2 11 Q2 10.5 2.5 10 L7 3 Q8 2 8 2 Q8 2 9 3 L13.5 10 Q14 10.5 14 11 Q14 12 13 12 Z",
          )
          .attr("fill", "#449cd9")
          .attr("stroke", "none")
          .attr("transform", `${arrowOffset} scale(${arrowScale})`)
          .style("pointer-events", "none") // Let touch target handle events

        const rightArrowUpdate = rightArrowEnter.merge(rightArrows as any)
        
        // Update touch target size based on expansion state
        rightArrowUpdate
          .select(".touch-target")
          .attr("r", isExpanded ? 20 : 16)
        
        rightArrowUpdate
          .attr(
            "transform",
            (d: any) =>
              `translate(${scales[axis]!(d.position)}, 2) scale(${arrowScale})`,
          )
          .call(
            d3
              .drag<SVGGElement, any>() // eslint-disable-line @typescript-eslint/no-explicit-any
              .on("start", function () {
                d3.select(this).style("cursor", "grabbing")
                
                // Make connector line more visible when dragging starts
                axisGroup
                  .select(".filter-range")
                  .transition()
                  .duration(150)
                  .attr("opacity", 0.5)
              })
              .on("drag", function (event) {
                const newValue = scales[axis]!.invert(event.x)
                const currentRange = filterRanges.current[axis] || [-1, 1]
                const minBound = currentRange[0] + 0.1
                const clampedValue = Math.min(1, Math.max(minBound, newValue))

                // Update position immediately (maintain scaling)
                d3.select(this).attr(
                  "transform",
                  `translate(${scales[axis]!(clampedValue)}, 2) scale(${arrowScale})`,
                )

                // Update filter range
                filterRanges.current[axis] = [currentRange[0], clampedValue]

                // Update range indicator
                axisGroup
                  .select(".filter-range")
                  .attr("x1", scales[axis]!(currentRange[0]))
                  .attr("x2", scales[axis]!(clampedValue))

                // Update scenario visibility
                updateScenarioVisibility(g)
              })
              .on("end", function () {
                d3.select(this).style("cursor", "grab")
                
                // Make connector line more transparent when dragging ends
                axisGroup
                  .select(".filter-range")
                  .transition()
                  .duration(300)
                  .attr("opacity", 0.1)
              }),
          )

        // Add visual range indicator only if there's an active filter (not just baseline highlighting)
        const hasActiveFilter = currentFilter[0] > -1 || currentFilter[1] < 1
        if (hasActiveFilter) {
          axisGroup
            .append("line")
            .attr("class", "filter-range")
            .attr("x1", scales[axis]!(currentFilter[0]))
            .attr("x2", scales[axis]!(currentFilter[1]))
            .attr("y1", 0)
            .attr("y2", 0)
            .attr("stroke", "#449cd9")
            .attr("stroke-width", 6)
            .attr("opacity", 0.1) // More transparent by default
        }
      })

      // Handle baseline - thick orange line for current operations
      if (showBaseline && baselineData) {
        const baselineColor = "#ff7f0e" // Bright orange for visibility
        const baselineLineGenerator = d3
          .line<[string, number]>()
          .x(([axis, value]) => scales[axis]!(value))
          .y(([axis]) => yScale(axis)!)
        // No curve - straight lines

        const baselinePathData = axes.map(
          (axis) => [axis, baselineData.values[axis] || 0] as [string, number],
        )

        let baselinePath = g.select<SVGPathElement>(".baseline-path")
        if (baselinePath.empty()) {
          baselinePath = g
            .append("path")
            .attr("class", "baseline-path")
            .attr("fill", "none")
            .attr("stroke", baselineColor)
            .attr("stroke-width", 4) // Thick line for prominence
            .attr("opacity", 0.9) // High opacity for visibility
          // No dash array - solid line
        }

        const pathSelection = animate
          ? baselinePath.transition(t as any) // eslint-disable-line @typescript-eslint/no-explicit-any
          : baselinePath
        ;(pathSelection as any).attr(
          "d",
          baselineLineGenerator(baselinePathData),
        ) // eslint-disable-line @typescript-eslint/no-explicit-any

        // Update baseline circles - orange to match line
        axes.forEach((axis) => {
          const value = baselineData.values[axis] || 0
          let circle = g.select<SVGCircleElement>(
            `.baseline-circle-${axis.replace(/\s+/g, "-")}`,
          )

          if (circle.empty()) {
            circle = g
              .append("circle")
              .attr("class", `baseline-circle-${axis.replace(/\s+/g, "-")}`)
              .attr("fill", baselineColor)
              .attr("stroke", "white")
              .attr("stroke-width", 2)
              .attr("r", 5) // Slightly larger for prominence
              .attr("opacity", 0.9)
          }

          const circleSelection = animate ? circle.transition(t as any) : circle // eslint-disable-line @typescript-eslint/no-explicit-any
          ;(circleSelection as any) // eslint-disable-line @typescript-eslint/no-explicit-any
            .attr("cx", scales[axis]!(value))
            .attr("cy", yScale(axis)!)
        })
      } else {
        // Remove baseline elements when showBaseline is false
        const baselineRemovalTransition = animate
          ? d3.transition().duration(300)
          : null

        // Remove baseline path
        const baselinePath = g.select(".baseline-path")
        if (!baselinePath.empty()) {
          if (animate) {
            baselinePath
              .transition(baselineRemovalTransition as any)
              .attr("opacity", 0)
              .remove()
          } else {
            baselinePath.remove()
          }
        }

        // Remove baseline circles
        axes.forEach((axis) => {
          const circle = g.select(
            `.baseline-circle-${axis.replace(/\s+/g, "-")}`,
          )
          if (!circle.empty()) {
            if (animate) {
              circle
                .transition(baselineRemovalTransition as any)
                .attr("opacity", 0)
                .remove()
            } else {
              circle.remove()
            }
          }
        })
      }

      // Update data lines with original styling
      // Line generator (no curves - original styling)
      // Uses .defined() to skip null values, creating gaps in the line
      const lineGenerator = d3
        .line<[string, number | null]>()
        .defined(([, value]) => value !== null)
        .x(([axis, value]) => scales[axis]!(value as number))
        .y(([axis]) => yScale(axis)!)
      // No curve - use straight angular lines (original)

    data.forEach((d, dataIndex) => {
        const lineColor =
          lineColors.length > dataIndex
              ? lineColors[dataIndex]!
            : d.highlighted
              ? colors.highlighted
              : colors.default

        // Check if scenario passes all filters for both opacity and stroke width
        const passesAllFilters = axes.every((axis) => {
          const filter = filterRanges.current[axis]
          if (!filter) return true

          const value = d.values[axis]
          if (value == null) return true // Null/undefined values pass filters
          return value >= filter[0] && value <= filter[1]
        })

        // Use centralized opacity calculation with separate values for lines vs circles
        const lineOpacity = getScenarioOpacity(d, "line")
        const circleOpacity = getScenarioOpacity(d, "circle")

        // Path data includes nulls (will be skipped by .defined(), creating gaps)
        const pathData = axes.map(
          (axis) => [axis, d.values[axis]] as [string, number | null],
        )

        // Create fresh path element (old ones were removed at start of render)
        const path = g
          .append("path")
          .attr("class", `line-${dataIndex}`)
          .attr("fill", "none")
          .attr("stroke", lineColor)
          .attr("stroke-width", passesAllFilters ? (d.highlighted ? 3 : 2.5) : 1.5)
          .attr("opacity", lineOpacity)
          .attr("d", lineGenerator(pathData))
          .style("cursor", "pointer")
          .on("mouseover", function () {
            // Only allow hover highlighting for active (unfiltered) scenarios
            if (!isScenarioActive(d)) return

            hoveredScenarioRef.current = dataIndex
            onLineHover?.(d)
            // Dim all other lines, keep this one prominent
            applyHoverDimming(g, dataIndex)
          })
          .on("mouseout", function () {
            hoveredScenarioRef.current = null
            onLineHover?.(null)
            // Restore all lines to normal state
            applyHoverDimming(g, null)
          })
          .on("click", function () {
            onLineClick?.(d)
          })

        // Create circles at intersection points (old ones were removed at start of render)
        // Skip circles for null values (missing data)
        axes.forEach((axis) => {
          const value = d.values[axis]

          // Skip null/undefined values
          if (value == null) return

          // Create fresh circle element
          g.append("circle")
            .attr("class", `circle-${dataIndex}-${axis.replace(/\s+/g, "-")}`)
            .datum(d as any) // eslint-disable-line @typescript-eslint/no-explicit-any
            .attr("fill", lineColor)
            .attr("stroke", "white")
            .attr("stroke-width", 1.5)
            .attr("r", d.highlighted ? 5 : 4)
            .attr("opacity", circleOpacity)
            .attr("cx", scales[axis]!(value))
            .attr("cy", yScale(axis)!)
            .style("cursor", "pointer")
            .on("mouseover", function () {
              // Only allow hover highlighting for active (unfiltered) scenarios
              if (!isScenarioActive(d)) return

              hoveredScenarioRef.current = dataIndex
              onLineHover?.(d)
              // Dim all other lines, keep this one prominent
              applyHoverDimming(g, dataIndex)
            })
            .on("mouseout", function () {
              hoveredScenarioRef.current = null
              onLineHover?.(null)
              // Restore all lines to normal state
              applyHoverDimming(g, null)
            })
            .on("click", function () {
              onLineClick?.(d)
            })
        })
    })

    // Add title if provided
    if (title) {
        let titleElement = svg.select<SVGTextElement>(".chart-title")
        if (titleElement.empty()) {
          titleElement = svg
        .append("text")
            .attr("class", "chart-title")
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "600")
        .attr("fill", "#333")
        .text(title)
    }

        titleElement.attr("x", newWidth / 2).attr("y", 20)
      }
    },
    [
    data,
    axes,
    margin,
    colors,
    lineColors,
    showBaseline,
    baselineData,
    title,
    onLineHover,
    onLineClick,
      getScenarioOpacity,
      isScenarioActive,
      overlayTiers,
      updateScenarioVisibility,
      applyHoverDimming,
    ],
  )

  // Initial render (no animation)
  useEffect(() => {
    updateChart(currentWidth, currentHeight, false)
  }, [updateChart, currentWidth, currentHeight])

  // Smooth animation when dimensions change
  useEffect(() => {
    updateChart(currentWidth, currentHeight, true)
  }, [currentWidth, currentHeight, updateChart])

  return (
    <div
      ref={containerRef}
      style={{
        width: responsive ? "100%" : currentWidth,
        height: responsive ? "100%" : currentHeight,
        minHeight: responsive ? "100%" : 300,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <svg
        ref={svgRef}
        width={currentWidth}
        height={currentHeight}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          transition: "all 0.3s ease-out",
        }}
      />
    </div>
  )
}

export default React.memo(VerticalParallelLinePlot)
export { VerticalParallelLinePlot as VerticalParallelLinePlotPeak }
