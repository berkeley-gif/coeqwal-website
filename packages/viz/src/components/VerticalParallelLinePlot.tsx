"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useEffect, useState, useCallback } from "react"
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
    axis?: string
  }
  lineColors?: string[]
  showBaseline?: boolean
  baselineData?: VerticalParallelLineData
  overlayTiers?: boolean
  onLineHover?: (data: VerticalParallelLineData | null) => void
  onLineClick?: (data: VerticalParallelLineData) => void
  /** Callback when axes are reordered via drag */
  onAxesReorder?: (newAxes: string[]) => void
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
    axis: "#666",
  },
  lineColors = [],
  showBaseline = false,
  baselineData,
  overlayTiers = false,
  onLineHover,
  onLineClick,
  onAxesReorder,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dimensions = useResizeObserver(
    containerRef as React.RefObject<HTMLElement>,
  )
  const [currentWidth, setCurrentWidth] = useState(width)
  const [currentHeight, setCurrentHeight] = useState(height)

  // Track current axis order (can be reordered by dragging)
  const [currentAxes, setCurrentAxes] = useState<string[]>(axes)

  // Update currentAxes when props.axes changes
  useEffect(() => {
    setCurrentAxes(axes)
  }, [axes])

  // Track filter ranges for each axis [min, max] approach as this summer.
  const filterRanges = useRef<Record<string, [number, number]>>({})

  // Detect overlapping scenarios and assign offsets
  const getScenarioOffsets = useCallback(() => {
    const SIMILARITY_THRESHOLD = 0.05 // Consider scenarios overlapping if values differ by less than this
    const OFFSET_AMOUNT = 3 // pixels to offset each overlapping line
    const offsets: Record<number, number> = {}

    // Group scenarios by similarity
    const groups: number[][] = []
    data.forEach((scenario, index) => {
      // Check if this scenario overlaps with any existing group
      let foundGroup = false
      for (const group of groups) {
        const representative = data[group[0]!]!
        const isSimilar = axes.every((axis) => {
          const val1 = scenario.values[axis]
          const val2 = representative.values[axis]
          // If either value is missing, consider them not overlapping on this axis
          if (val1 === undefined || val2 === undefined) return true
          return Math.abs(val1 - val2) < SIMILARITY_THRESHOLD
        })
        if (isSimilar) {
          group.push(index)
          foundGroup = true
          break
        }
      }
      if (!foundGroup) {
        groups.push([index])
      }
    })

    // Assign offsets to overlapping scenarios
    groups.forEach((group) => {
      if (group.length === 1) {
        // No overlap, no offset
        offsets[group[0]!] = 0
      } else {
        // Multiple scenarios overlap - distribute them with offsets
        const groupSize = group.length
        group.forEach((scenarioIndex, positionInGroup) => {
          // Center the group around 0
          const offset = (positionInGroup - (groupSize - 1) / 2) * OFFSET_AMOUNT
          offsets[scenarioIndex] = offset
        })
      }
    })

    return offsets
  }, [data, axes])

  const scenarioOffsets = getScenarioOffsets()

  // Centralized filtering function - separate opacity for lines vs circles
  const getScenarioOpacity = useCallback(
    (scenario: VerticalParallelLineData, elementType: "line" | "circle") => {
      // Check if scenario passes all active filters
      // Skip axes where the scenario has no value
      const passesAllFilters = axes.every((axis) => {
        const filter = filterRanges.current[axis]
        if (!filter) return true

        const value = scenario.values[axis]
        if (value === undefined) return true // Skip missing values
        return value >= filter[0] && value <= filter[1]
      })

      if (elementType === "circle") {
        // Dots: Full opacity when active, faint when filtered
        return passesAllFilters
          ? 1.0 // Active dots: full opacity
          : 0.15 // Filtered dots: faint but visible for experimentation
      } else {
        // Lines: Full opacity when active, faint when filtered
        return passesAllFilters
          ? 1.0 // Active lines: full opacity (thickness shows highlight)
          : 0.1 // Filtered lines: faint
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
        if (value === undefined) return true // Skip missing values
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

  // Handle axis reorder via drag
  const handleAxisReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newAxes = [...currentAxes]
      const [removed] = newAxes.splice(fromIndex, 1)
      newAxes.splice(toIndex, 0, removed!)
      setCurrentAxes(newAxes)
      onAxesReorder?.(newAxes)
    },
    [currentAxes, onAxesReorder],
  )

  // Observable pattern: Create update function for smooth resizing
  const updateChart = useCallback(
    (newWidth: number, newHeight: number, animate = true) => {
      if (
        !data ||
        data.length === 0 ||
        !currentAxes ||
        currentAxes.length === 0
      )
        return

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
      currentAxes.forEach((axis) => {
        scales[axis] = d3.scaleLinear().domain([-1, 1]).range([0, innerWidth])
      })

      const yScale = d3
        .scalePoint()
        .domain(currentAxes)
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
        ? background.transition(t as any)
        : background
      ;(backgroundSelection as any)
        .attr("width", innerWidth)
        .attr("height", innerHeight)

      // Update axes with smooth transitions
      currentAxes.forEach((axis, axisIndex) => {
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
            .attr("stroke", colors.axis || "#666")
            .attr("stroke-width", 2) // Original width
        }

        const lineSelection = animate ? axisLine.transition(t as any) : axisLine
        ;(lineSelection as any)
          .attr("x1", 0)
          .attr("x2", innerWidth)
          .attr("y1", 0)
          .attr("y2", 0)

        // Update axis label with text wrapping (original styling)
        axisGroup.selectAll(".axis-label").remove() // Remove old labels

        const words = axis.split(/\s+/)
        const lineHeight = 14 // pixels
        // Use 2 words per line for longer labels, 1 for others
        const longerLabels = [
          "Freshwater for Delta exports",
          "Freshwater for in-Delta uses",
          "Delta estuary ecology",
        ]
        const maxWordsPerLine = longerLabels.includes(axis) ? 2 : 1

        // Group words into lines
        const lines: string[] = []
        for (let i = 0; i < words.length; i += maxWordsPerLine) {
          lines.push(words.slice(i, i + maxWordsPerLine).join(" "))
        }

        // Create text element for each line
        lines.forEach((line, lineIdx) => {
          axisGroup
            .append("text")
            .attr("class", "axis-label")
            .attr("x", -10)
            .attr("y", 4 + (lineIdx - (lines.length - 1) / 2) * lineHeight) // Center multi-line text vertically
            .attr("text-anchor", "end") // Right align text
            .attr("font-size", "12px")
            .attr("font-weight", "500")
            .attr("fill", "#333")
            .text(line)
        })

        // Add drag handle for axis reordering
        axisGroup.selectAll(".drag-handle").remove()
        const dragHandle = axisGroup
          .append("g")
          .attr("class", "drag-handle")
          .attr("transform", `translate(-${margin.left - 15}, 0)`)
          .style("cursor", "grab")

        // Drag handle icon (≡ hamburger menu style)
        dragHandle
          .append("rect")
          .attr("x", -8)
          .attr("y", -10)
          .attr("width", 16)
          .attr("height", 20)
          .attr("fill", "transparent")

        for (let i = -1; i <= 1; i++) {
          dragHandle
            .append("line")
            .attr("x1", -5)
            .attr("x2", 5)
            .attr("y1", i * 4)
            .attr("y2", i * 4)
            .attr("stroke", "#999")
            .attr("stroke-width", 1.5)
            .attr("stroke-linecap", "round")
        }

        // Drag behavior for reordering axes
        const axisSpacing = innerHeight / (currentAxes.length - 1 || 1)
        let currentDragY = yPos
        let totalDragDelta = 0

        const dragBehavior = d3
          .drag<SVGGElement, unknown>()
          .on("start", function () {
            currentDragY = yPos
            totalDragDelta = 0
            d3.select(this.parentNode as SVGGElement)
              .raise()
              .select(".drag-handle")
              .style("cursor", "grabbing")
            d3.select(this.parentNode as SVGGElement).style("opacity", 0.7)
          })
          .on("drag", function (event) {
            // Use event.dy for smooth incremental updates
            totalDragDelta += event.dy
            currentDragY = yPos + totalDragDelta
            d3.select(this.parentNode as SVGGElement).attr(
              "transform",
              `translate(0, ${currentDragY})`,
            )
          })
          .on("end", function () {
            const newIndex = Math.round(
              Math.max(
                0,
                Math.min(
                  currentAxes.length - 1,
                  axisIndex + totalDragDelta / axisSpacing,
                ),
              ),
            )

            d3.select(this.parentNode as SVGGElement).style("opacity", 1)
            d3.select(this.parentNode as SVGGElement)
              .select(".drag-handle")
              .style("cursor", "grab")

            if (newIndex !== axisIndex) {
              handleAxisReorder(axisIndex, newIndex)
            } else {
              // Snap back to original position
              d3.select(this.parentNode as SVGGElement)
                .transition()
                .duration(200)
                .attr("transform", `translate(0, ${yPos})`)
            }
          })

        dragHandle.call(dragBehavior as any)

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
            .attr("stroke", colors.axis || "#666")
            .attr("stroke-width", 1)

          // Tick label
          axisGroup
            .append("text")
            .attr("class", "tick-label")
            .attr("x", xPos)
            .attr("y", -10) // Above the line (original)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", colors.axis || "#666")
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
        leftArrowUpdate.select(".touch-target").attr("r", isExpanded ? 20 : 16)

        leftArrowUpdate
          .attr(
            "transform",
            (d: any) =>
              `translate(${scales[axis]!(d.position)}, 2) scale(${arrowScale})`,
          )
          .call(
            d3
              .drag<SVGGElement, any>()
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
        rightArrowUpdate.select(".touch-target").attr("r", isExpanded ? 20 : 16)

        rightArrowUpdate
          .attr(
            "transform",
            (d: any) =>
              `translate(${scales[axis]!(d.position)}, 2) scale(${arrowScale})`,
          )
          .call(
            d3
              .drag<SVGGElement, any>()
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

        const baselinePathData = currentAxes.map(
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
          ? baselinePath.transition(t as any)
          : baselinePath
        ;(pathSelection as any).attr(
          "d",
          baselineLineGenerator(baselinePathData),
        )

        // Update baseline circles - orange to match line
        currentAxes.forEach((axis) => {
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

          const circleSelection = animate ? circle.transition(t as any) : circle
          ;(circleSelection as any)
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
        currentAxes.forEach((axis) => {
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
      // Line generator will be created per scenario to apply offsets
      data.forEach((d, dataIndex) => {
        const xOffset = scenarioOffsets[dataIndex] || 0

        // Line generator with offset applied (no curves - original styling)
        // Use defined() to skip missing values
        const lineGenerator = d3
          .line<[string, number | undefined]>()
          .defined(([, value]) => value !== undefined)
          .x(([axis, value]) => scales[axis]!(value as number) + xOffset)
          .y(([axis]) => yScale(axis)!)

        const lineColor =
          lineColors.length > dataIndex
            ? lineColors[dataIndex]!
            : d.highlighted
              ? colors.highlighted
              : colors.default

        // Check if scenario passes all filters for both opacity and stroke width
        // Only check axes that have values
        const passesAllFilters = currentAxes.every((axis) => {
          const filter = filterRanges.current[axis]
          if (!filter) return true

          const value = d.values[axis]
          if (value === undefined) return true // Skip missing values in filter check
          return value >= filter[0] && value <= filter[1]
        })

        // Use centralized opacity calculation with separate values for lines vs circles
        const lineOpacity = getScenarioOpacity(d, "line")
        const circleOpacity = getScenarioOpacity(d, "circle")

        // Include undefined for missing values so line generator can skip them
        const pathData = currentAxes.map(
          (axis) => [axis, d.values[axis]] as [string, number | undefined],
        )

        let path = g.select<SVGPathElement>(`.line-${dataIndex}`)
        if (path.empty()) {
          path = g
            .append("path")
            .attr("class", `line-${dataIndex}`)
            .attr("fill", "none")
            .attr("stroke", lineColor)
            .attr(
              "stroke-width",
              passesAllFilters ? (d.highlighted ? 4 : 2) : 1.5,
            ) // Highlighted lines are thicker
            .attr("opacity", lineOpacity) // Lines semi-transparent
            .style("cursor", onLineClick || onLineHover ? "pointer" : "default")
            .on("mouseover", function () {
              // Only allow hover highlighting for active (unfiltered) scenarios
              if (!isScenarioActive(d)) return

              onLineHover?.(d)
              // Highlight line on hover
              d3.select(this).attr("stroke-width", 3.5).attr("opacity", 1)

              // Highlight all corresponding circles for this line
              currentAxes.forEach((axisName) => {
                g.select(
                  `.circle-${dataIndex}-${axisName.replace(/\s+/g, "-")}`,
                )
                  .attr("r", d.highlighted ? 8 : 6)
                  .attr("opacity", 1)
              })
            })
            .on("mouseout", function () {
              onLineHover?.(null)
              const currentLineOpacity = getScenarioOpacity(d, "line")
              const currentCircleOpacity = getScenarioOpacity(d, "circle")

              // Check if scenario is currently active for stroke width
              const isActive = isScenarioActive(d)

              // Reset line style
              d3.select(this)
                .attr("stroke-width", isActive ? (d.highlighted ? 4 : 2) : 1.5)
                .attr("opacity", currentLineOpacity)

              // Reset all corresponding circles for this line
              currentAxes.forEach((axisName) => {
                g.select(
                  `.circle-${dataIndex}-${axisName.replace(/\s+/g, "-")}`,
                )
                  .attr("r", d.highlighted ? 7 : 4)
                  .attr("opacity", currentCircleOpacity)
              })
            })
            .on("click", function () {
              onLineClick?.(d)
            })
        }

        const pathSelection = animate ? path.transition(t as any) : path
        ;(pathSelection as any)
          .attr("d", lineGenerator(pathData))
          .attr(
            "stroke-width",
            passesAllFilters ? (d.highlighted ? 4 : 2) : 1.5,
          )
          .attr("opacity", lineOpacity) // Lines semi-transparent

        // Update circles at intersection points (original styling)
        // Only draw circles for axes that have values
        currentAxes.forEach((axis) => {
          const value = d.values[axis]
          const circleSelector = `.circle-${dataIndex}-${axis.replace(/\s+/g, "-")}`

          if (value === undefined) {
            // Remove circle if no value exists
            g.select(circleSelector).remove()
            return
          }

          let circle = g.select<SVGCircleElement>(circleSelector)

          if (circle.empty()) {
            circle = g
              .append("circle")
              .attr("class", `circle-${dataIndex}-${axis.replace(/\s+/g, "-")}`)
              .datum(d as any) // Store data reference for filtering (original)
              .attr("fill", lineColor)
              .attr("stroke", "white")
              .attr("stroke-width", 1.5) // Original width
              .attr("r", d.highlighted ? 7 : 4) // Highlighted dots are larger
              .attr("opacity", circleOpacity) // Dots opaque
              .style(
                "cursor",
                onLineClick || onLineHover ? "pointer" : "default",
              )
              .on("mouseover", function () {
                // Only allow hover highlighting for active (unfiltered) scenarios
                if (!isScenarioActive(d)) return

                onLineHover?.(d)
                // Highlight this circle
                d3.select(this)
                  .attr("r", d.highlighted ? 8 : 6)
                  .attr("opacity", 1)

                // Highlight the corresponding line for this circle
                g.select(`.line-${dataIndex}`)
                  .attr("stroke-width", 3.5)
                  .attr("opacity", 1)

                // Highlight all other circles for this same line/scenario
                currentAxes.forEach((otherAxis) => {
                  g.select(
                    `.circle-${dataIndex}-${otherAxis.replace(/\s+/g, "-")}`,
                  )
                    .attr("r", d.highlighted ? 8 : 6)
                    .attr("opacity", 1)
                })
              })
              .on("mouseout", function () {
                onLineHover?.(null)
                const currentLineOpacity = getScenarioOpacity(d, "line")
                const currentCircleOpacity = getScenarioOpacity(d, "circle")

                // Reset this circle
                d3.select(this)
                  .attr("r", d.highlighted ? 7 : 4)
                  .attr("opacity", currentCircleOpacity)

                // Reset the corresponding line for this circle
                const isActive = isScenarioActive(d)
                g.select(`.line-${dataIndex}`)
                  .attr(
                    "stroke-width",
                    isActive ? (d.highlighted ? 4 : 2) : 1.5,
                  )
                  .attr("opacity", currentLineOpacity)

                // Reset all other circles for this same line/scenario
                currentAxes.forEach((otherAxis) => {
                  g.select(
                    `.circle-${dataIndex}-${otherAxis.replace(/\s+/g, "-")}`,
                  )
                    .attr("r", d.highlighted ? 7 : 4)
                    .attr("opacity", currentCircleOpacity)
                })
              })
              .on("click", function () {
                onLineClick?.(d)
              })
          }

          const circleSelection = animate ? circle.transition(t as any) : circle
          ;(circleSelection as any)
            .attr("cx", scales[axis]!(value) + xOffset) // Apply offset to circles too
            .attr("cy", yScale(axis)!)
            .attr("opacity", circleOpacity) // Dots opaque
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
      currentAxes,
      margin,
      colors,
      lineColors,
      showBaseline,
      baselineData,
      title,
      onLineClick,
      onLineHover,
      getScenarioOpacity,
      isScenarioActive,
      overlayTiers,
      updateScenarioVisibility,
      currentHeight,
      scenarioOffsets,
      handleAxisReorder,
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
