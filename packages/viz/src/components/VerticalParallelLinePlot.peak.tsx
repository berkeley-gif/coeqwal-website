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

/** Position of a single axis in container-relative pixels */
export interface AxisLayout {
  /** Axis display name (matches the string in the `axes` prop) */
  axis: string
  /** X position in container-relative pixels */
  x: number
  /** Y position in container-relative pixels */
  y: number
}

export interface VerticalParallelLinePlotProps {
  data: VerticalParallelLineData[]
  axes: string[]
  title?: string
  orientation?: "vertical" | "horizontal"
  responsive?: boolean
  width?: number
  height?: number
  /** Override default margins. Defaults vary by orientation. */
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
  /** When true, SVG text labels on axes are not rendered. Use with onAxesLayout for external HTML labels. */
  hideAxisLabels?: boolean
  /** Called after layout with the position of each axis in container-relative pixels. */
  onAxesLayout?: (layout: AxisLayout[]) => void
  onLineHover?: (data: VerticalParallelLineData | null) => void
  onLineClick?: (data: VerticalParallelLineData) => void
  /** IDs of scenarios the user has selected/chosen. Renders at full opacity in resting state. */
  chosenIds?: Set<string>
  /** IDs of scenarios currently highlighted (from any hover source). Full opacity, others dim. */
  highlightedIds?: Set<string> | null
  /** Scenario ID to render with a gold halo (e.g. the baseline scenario). */
  baselineId?: string
  /** Show tier tick labels on each axis. In relative mode, shows delta labels instead. */
  showTierLabels?: boolean
  /** When true, the data is relative-to-baseline (delta labels instead of tier labels). */
  relativeMode?: boolean
}

const ARROW_PATH =
  "M3 12 Q2 12 2 11 Q2 10.5 2.5 10 L7 3 Q8 2 8 2 Q8 2 9 3 L13.5 10 Q14 10.5 14 11 Q14 12 13 12 Z"

const DEFAULT_MARGIN_VERTICAL = { top: 40, right: 60, bottom: 50, left: 100 }
const DEFAULT_MARGIN_HORIZONTAL = { top: 30, right: 20, bottom: 90, left: 20 }
const BASELINE_HALO_COLOR = "#C5A135"
const BASELINE_HALO_WIDTH_EXTRA = 3

const VerticalParallelLinePlot: React.FC<VerticalParallelLinePlotProps> = ({
  data,
  axes,
  title = "",
  orientation = "vertical",
  responsive = true,
  width = 400,
  height = 400,
  margin: marginProp,
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
  hideAxisLabels = false,
  onAxesLayout,
  onLineHover,
  onLineClick,
  chosenIds,
  highlightedIds,
  baselineId,
  showTierLabels = false,
  relativeMode = false,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevAxisLayoutRef = useRef<string>("")
  const dimensions = useResizeObserver(
    containerRef as React.RefObject<HTMLElement>,
  )
  const [currentWidth, setCurrentWidth] = useState(width)
  const [currentHeight, setCurrentHeight] = useState(height)

  // Effective margin — caller can override, otherwise orientation-specific defaults apply.
  const margin =
    marginProp ??
    (orientation === "horizontal"
      ? DEFAULT_MARGIN_HORIZONTAL
      : DEFAULT_MARGIN_VERTICAL)

  // Track filter ranges for each axis [min, max].
  const filterRanges = useRef<Record<string, [number, number]>>({})

  // Reset filter ranges when orientation changes so stale positions don't carry over.
  useEffect(() => {
    filterRanges.current = {}
  }, [orientation])

  // Track if any axis is currently being dragged (for connector line opacity)
  const isDragging = useRef<boolean>(false)

  // Track currently hovered scenario for dimming other lines
  const hoveredScenarioRef = useRef<number | null>(null)

  // Debounce mouseout so micro-movements between a line and its circles
  // (or between adjacent path segments) don't cause rapid dim/undim flicker.
  const hoverOutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Unified style resolver ──────────────────────────────────────────────────
  // Single source of truth for every visual property of a scenario line/circle.
  // `hoveredIndex` is the D3-level chart hover (by array index); `highlightedIds`
  // covers sidebar hover, theme hover, or any external source (by scenario ID).

  const passesFilters = useCallback(
    (scenario: VerticalParallelLineData) => {
      return axes.every((axis) => {
        const filter = filterRanges.current[axis]
        if (!filter) return true
        if (filter[0] === -1 && filter[1] === 1) return true
        const value = scenario.values[axis]
        if (value == null) return true
        return value >= filter[0] && value <= filter[1]
      })
    },
    [axes],
  )

  interface LineStyle {
    lineOpacity: number
    circleOpacity: number
    strokeWidth: number
    circleRadius: number
  }

  const getLineStyle = useCallback(
    (
      scenario: VerticalParallelLineData,
      scenarioIndex: number,
      hoveredIndex: number | null,
    ): LineStyle => {
      const active = passesFilters(scenario)
      const chosen = chosenIds ? chosenIds.has(scenario.id) : false
      const hasHighlight =
        hoveredIndex !== null ||
        (highlightedIds != null && highlightedIds.size > 0)
      const isHovered =
        hoveredIndex === scenarioIndex ||
        (highlightedIds != null && highlightedIds.has(scenario.id))

      // ── Opacity ──────────────────────────────────────────────
      let lineOpacity: number
      let circleOpacity: number

      if (hasHighlight) {
        if (isHovered) {
          lineOpacity = 1.0; circleOpacity = 1.0
        } else if (chosen && active) {
          lineOpacity = 0.35; circleOpacity = 0.4
        } else {
          lineOpacity = active ? 0.1 : 0.04
          circleOpacity = active ? 0.12 : 0.06
        }
      } else {
        // Resting state: three tiers
        if (!active) {
          lineOpacity = 0.22; circleOpacity = 0.28
        } else if (chosen) {
          lineOpacity = 1.0; circleOpacity = 1.0
        } else {
          lineOpacity = 0.55; circleOpacity = 0.7
        }
      }

      // ── Stroke width ─────────────────────────────────────────
      const strokeWidth = isHovered
        ? 3.5
        : chosen
          ? (scenario.highlighted ? 3 : 2.2)
          : active ? 1.8 : 0.8

      // ── Circle radius ────────────────────────────────────────
      const circleRadius = isHovered
        ? (scenario.highlighted ? 6 : 5)
        : (scenario.highlighted ? 5 : 4)

      return { lineOpacity, circleOpacity, strokeWidth, circleRadius }
    },
    [passesFilters, chosenIds, highlightedIds],
  )

  // Apply styles to all scenarios in the SVG group (used after brush, hover, and sidebar changes)
  const applyStyles = useCallback(
    (
      g: d3.Selection<SVGGElement, unknown, null, undefined>,
      hoveredIndex: number | null,
      animate = false,
    ) => {
      data.forEach((scenario, i) => {
        const s = getLineStyle(scenario, i, hoveredIndex)
        const line = g.select(`.line-${i}`)
        const sel = animate
          ? (line.transition().duration(300).ease(d3.easeQuadOut) as any)
          : line
        sel.attr("opacity", s.lineOpacity).attr("stroke-width", s.strokeWidth)

        // Keep the gold halo in sync
        const halo = g.select(`.line-halo-${i}`)
        if (!halo.empty()) {
          const hSel = animate
            ? (halo.transition().duration(300).ease(d3.easeQuadOut) as any)
            : halo
          hSel
            .attr("opacity", s.lineOpacity)
            .attr("stroke-width", s.strokeWidth + BASELINE_HALO_WIDTH_EXTRA)
        }

        axes.forEach((axisName) => {
          const circle = g.select(
            `.circle-${i}-${axisName.replace(/\s+/g, "-")}`,
          )
          const cSel = animate
            ? (circle.transition().duration(300).ease(d3.easeQuadOut) as any)
            : circle
          cSel.attr("opacity", s.circleOpacity).attr("r", s.circleRadius)
        })
      })
    },
    [data, axes, getLineStyle],
  )

  const scheduleHoverClear = useCallback(
    (g: d3.Selection<SVGGElement, unknown, null, undefined>) => {
      if (hoverOutTimer.current) clearTimeout(hoverOutTimer.current)
      hoverOutTimer.current = setTimeout(() => {
        if (hoveredScenarioRef.current !== null) return
        onLineHover?.(null)
        applyStyles(g, null)
      }, 180)
    },
    [onLineHover, applyStyles],
  )

  const commitHoverIn = useCallback(
    (
      g: d3.Selection<SVGGElement, unknown, null, undefined>,
      d: VerticalParallelLineData,
      dataIndex: number,
    ) => {
      if (hoverOutTimer.current) {
        clearTimeout(hoverOutTimer.current)
        hoverOutTimer.current = null
      }
      hoveredScenarioRef.current = dataIndex
      onLineHover?.(d)
      applyStyles(g, dataIndex)
    },
    [onLineHover, applyStyles],
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

  useEffect(() => {
    if (!responsive) {
      setCurrentHeight(height)
    }
  }, [height, responsive])

  const updateChart = useCallback(
    (newWidth: number, newHeight: number, animate = true) => {
      if (!data || data.length === 0 || !axes || axes.length === 0) return

      const isHoriz = orientation === "horizontal"
      const svg = d3.select(svgRef.current)
      const innerWidth = newWidth - margin.left - margin.right
      const innerHeight = newHeight - margin.top - margin.bottom

      const t = animate
        ? d3.transition().duration(500).ease(d3.easeCubicOut)
        : null

      svg
        .attr("viewBox", `0 0 ${newWidth} ${newHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet")

      // ── Scales ──────────────────────────────────────────────────────────────
      //
      // Vertical mode:
      //   axisScale = scalePoint → maps axis name to a y-position (top→bottom)
      //   scales[axis] = scaleLinear → maps value [-1,1] to an x-position (left→right)
      //
      // Horizontal mode:
      //   axisScale = scalePoint → maps axis name to an x-position (left→right)
      //   scales[axis] = scaleLinear → maps value [-1,1] to a y-position (bottom→top, inverted)

      const scales: Record<string, d3.ScaleLinear<number, number>> = {}
      axes.forEach((axis) => {
        scales[axis] = isHoriz
          ? d3.scaleLinear().domain([-1, 1]).range([innerHeight, 0]) // inverted: high = top
          : d3.scaleLinear().domain([-1, 1]).range([0, innerWidth])
      })

      const axisScale = d3
        .scalePoint()
        .domain(axes)
        .range(isHoriz ? [0, innerWidth] : [0, innerHeight])
        .padding(0)

      // ── Chart group ─────────────────────────────────────────────────────────
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

      // Clear hover state before removing elements — the old DOM nodes won't
      // fire mouseout once removed, so we must reset manually.
      if (hoveredScenarioRef.current !== null) {
        hoveredScenarioRef.current = null
        onLineHover?.(null)
      }
      if (hoverOutTimer.current) {
        clearTimeout(hoverOutTimer.current)
        hoverOutTimer.current = null
      }

      g.selectAll("[class^='line-']").remove()
      g.selectAll("[class^='circle-']").remove()

      // ── Background ──────────────────────────────────────────────────────────
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

      // ── Per-axis rendering ──────────────────────────────────────────────────
      const isExpanded = newHeight > 500
      const arrowScale = isExpanded ? 1.4 : 1.0
      // Vertical mode: arrow above axis (y=2). Horizontal mode: arrow right of axis (x=4).
      const arrowGroupOffset = isHoriz ? 4 : 2

      axes.forEach((axis) => {
        const axisPos = axisScale(axis)!
        const axisIndex = axes.indexOf(axis)
        let axisGroup = g.select<SVGGElement>(
          `.axis-${axis.replace(/\s+/g, "-")}`,
        )

        if (axisGroup.empty()) {
          axisGroup = g
            .append("g")
            .attr("class", `axis-${axis.replace(/\s+/g, "-")}`)
        }

        const axisSelection = animate ? axisGroup.transition(t as any) : axisGroup
        axisSelection.attr(
          "transform",
          isHoriz
            ? `translate(${axisPos}, 0)`  // vertical axis at x-position
            : `translate(0, ${axisPos})`, // horizontal axis at y-position
        )

        // ── Tier overlay ─────────────────────────────────────────────────────
        if (overlayTiers) {
          axisGroup.selectAll(".tier-segment").remove()

          const tierColors = ["#CD5C5C", "#FFB347", "#60aacb", "#7b9d3f"]
          const axisIndex = axes.indexOf(axis)
          const segmentProportions = [
            [0.15, 0.25, 0.35, 0.25],
            [0.2, 0.3, 0.3, 0.2],
            [0.25, 0.2, 0.25, 0.3],
            [0.3, 0.25, 0.25, 0.2],
            [0.18, 0.32, 0.28, 0.22],
            [0.22, 0.28, 0.32, 0.18],
            [0.28, 0.22, 0.2, 0.3],
            [0.2, 0.35, 0.25, 0.2],
          ]
          const proportions =
            segmentProportions[axisIndex % segmentProportions.length] ||
            [0.25, 0.25, 0.25, 0.25]

          let currentPosition = 0
          tierColors.forEach((color, index) => {
            const segmentLength =
              proportions[index]! * (isHoriz ? innerHeight : innerWidth)

            axisGroup
              .append("line")
              .attr("class", "tier-segment")
              .attr("x1", isHoriz ? 0 : currentPosition)
              .attr("x2", isHoriz ? 0 : currentPosition + segmentLength)
              .attr("y1", isHoriz ? currentPosition : 0)
              .attr("y2", isHoriz ? currentPosition + segmentLength : 0)
              .attr("stroke", color)
              .attr("stroke-width", 18)
              .attr("opacity", 0.5)

            currentPosition += segmentLength
          })
        } else {
          axisGroup.selectAll(".tier-segment").remove()
        }

        // ── Axis line ────────────────────────────────────────────────────────
        let axisLine = axisGroup.select<SVGLineElement>(".axis-line")
        if (axisLine.empty()) {
          axisLine = axisGroup
            .append("line")
            .attr("class", "axis-line")
            .attr("stroke", "#666")
            .attr("stroke-width", 2)
        }

        const lineSelection = animate ? axisLine.transition(t as any) : axisLine
        ;(lineSelection as any)
          .attr("x1", 0)
          .attr("x2", isHoriz ? 0 : innerWidth)
          .attr("y1", 0)
          .attr("y2", isHoriz ? innerHeight : 0)

        // ── Labels ───────────────────────────────────────────────────────────
        axisGroup.selectAll(".axis-label").remove()

        if (!hideAxisLabels) {
          if (isHoriz) {
            // Single rotated label below the axis bottom
            axisGroup
              .append("text")
              .attr("class", "axis-label")
              .attr(
                "transform",
                `translate(0, ${innerHeight + 8}) rotate(-40)`,
              )
              .attr("text-anchor", "end")
              .attr("font-size", "11px")
              .attr("font-weight", "500")
              .attr("fill", "#333")
              .text(axis)
          } else {
            // Word-wrapped label to the left
            const words = axis.split(/\s+/)
            const lineHeight = 14
            const maxWordsPerLine = 1
            const lines: string[] = []
            for (let i = 0; i < words.length; i += maxWordsPerLine) {
              lines.push(words.slice(i, i + maxWordsPerLine).join(" "))
            }
            lines.forEach((line, index) => {
              axisGroup
                .append("text")
                .attr("class", "axis-label")
                .attr("x", -10)
                .attr(
                  "y",
                  4 + (index - (lines.length - 1) / 2) * lineHeight,
                )
                .attr("text-anchor", "end")
                .attr("font-size", "12px")
                .attr("font-weight", "500")
                .attr("fill", "#333")
                .text(line)
            })
          }
        }

        // ── Tick marks ───────────────────────────────────────────────────────
        axisGroup.selectAll(".tick-line").remove()
        axisGroup.selectAll(".tick-label").remove()

        const tierTicks: { value: number; label: string }[] =
          showTierLabels && !relativeMode
            ? [
                { value: -1, label: "Tier 4" },
                { value: -1 / 3, label: "Tier 3" },
                { value: 1 / 3, label: "Tier 2" },
                { value: 1, label: "Tier 1" },
              ]
            : showTierLabels && relativeMode
              ? [
                  { value: -1, label: "−3 tiers" },
                  { value: -2 / 3, label: "−2" },
                  { value: -1 / 3, label: "−1" },
                  { value: 0, label: "baseline" },
                  { value: 1 / 3, label: "+1" },
                  { value: 2 / 3, label: "+2" },
                  { value: 1, label: "+3 tiers" },
                ]
              : [
                  { value: -1, label: "-1" },
                  { value: -0.5, label: "-0.5" },
                  { value: 0, label: "0" },
                  { value: 0.5, label: "0.5" },
                  { value: 1, label: "1" },
                ]

        tierTicks.forEach(({ value: tick, label: tickLabel }) => {
          const pos = scales[axis]!(tick)

          if (isHoriz) {
            axisGroup
              .append("line")
              .attr("class", "tick-line")
              .attr("x1", -4)
              .attr("x2", 4)
              .attr("y1", pos)
              .attr("y2", pos)
              .attr("stroke", "#999")
              .attr("stroke-width", 1)

            if (axisIndex === 0) {
              axisGroup
                .append("text")
                .attr("class", "tick-label")
                .attr("x", -8)
                .attr("y", pos)
                .attr("text-anchor", "end")
                .attr("dominant-baseline", "middle")
                .attr("font-size", "9px")
                .attr("fill", "#999")
                .text(tickLabel)
            }
          } else {
            axisGroup
              .append("line")
              .attr("class", "tick-line")
              .attr("x1", pos)
              .attr("x2", pos)
              .attr("y1", -5)
              .attr("y2", 5)
              .attr("stroke", "#666")
              .attr("stroke-width", 1)

            axisGroup
              .append("text")
              .attr("class", "tick-label")
              .attr("x", pos)
              .attr("y", -10)
              .attr("text-anchor", "middle")
              .attr("font-size", "10px")
              .attr("fill", "#666")
              .text(tickLabel)
          }
        })

        // ── Filter handles ───────────────────────────────────────────────────
        if (!filterRanges.current[axis]) {
          filterRanges.current[axis] = [-1, 1]
        }
        const currentFilter = filterRanges.current[axis]

        // Arrow path visual transform: in horizontal mode rotate to point right (→)
        // so the handle visually suggests it sits on a vertical axis.
        const arrowPathTransform = isHoriz
          ? `translate(-8, -6) rotate(-90, 8, 6)` // points right, placed right of axis
          : `translate(-8, -6)` // points up, placed above axis

        // Helper to build group position transform
        const groupTransform = (value: number) =>
          isHoriz
            ? `translate(${arrowGroupOffset}, ${scales[axis]!(value)}) scale(${arrowScale})`
            : `translate(${scales[axis]!(value)}, ${arrowGroupOffset}) scale(${arrowScale})`

        // Helper to invert event position to value
        const invertEvent = (event: any) =>
          scales[axis]!.invert(isHoriz ? event.y : event.x)

        // Helper to update range indicator
        const updateRangeIndicator = (min: number, max: number) => {
          if (isHoriz) {
            axisGroup
              .select(".filter-range")
              .attr("x1", 0)
              .attr("x2", 0)
              .attr("y1", scales[axis]!(min))
              .attr("y2", scales[axis]!(max))
          } else {
            axisGroup
              .select(".filter-range")
              .attr("x1", scales[axis]!(min))
              .attr("x2", scales[axis]!(max))
              .attr("y1", 0)
              .attr("y2", 0)
          }
        }

        // ── Min (left / bottom) handle ───────────────────────────────────────
        const leftArrowData = [{ type: "left", position: currentFilter[0] }]
        const leftArrows = axisGroup
          .selectAll(".axis-arrow-left")
          .data(leftArrowData)

        const leftArrowEnter = leftArrows
          .enter()
          .append("g")
          .attr("class", "axis-arrow axis-arrow-left")
          .style("cursor", isHoriz ? "ns-resize" : "grab")
          .style("filter", "drop-shadow(0 1px 3px rgba(0,0,0,0.12))")

        leftArrowEnter
          .append("circle")
          .attr("class", "touch-target")
          .attr("r", isExpanded ? 20 : 16)
          .attr("fill", "transparent")
          .attr("stroke", "none")
          .style("cursor", isHoriz ? "ns-resize" : "grab")

        leftArrowEnter
          .append("path")
          .attr("d", ARROW_PATH)
          .attr("fill", "#449cd9")
          .attr("stroke", "none")
          .attr("transform", `${arrowPathTransform} scale(${arrowScale})`)
          .style("pointer-events", "none")

        const leftArrowUpdate = leftArrowEnter.merge(leftArrows as any)
        leftArrowUpdate.select(".touch-target").attr("r", isExpanded ? 20 : 16)
        leftArrowUpdate
          .attr("transform", (d: any) => groupTransform(d.position))
          .call(
            d3
              .drag<SVGGElement, any>()
              .on("start", function () {
                isDragging.current = true
                d3.select(this).style("cursor", isHoriz ? "ns-resize" : "grabbing")
                axisGroup
                  .select(".filter-range")
                  .transition()
                  .duration(150)
                  .attr("opacity", 0.5)
              })
              .on("drag", function (event) {
                const newValue = invertEvent(event)
                const currentRange = filterRanges.current[axis] || [-1, 1]
                const maxBound = currentRange[1] - 0.1
                const clampedValue = Math.max(-1, Math.min(maxBound, newValue))

                d3.select(this).attr("transform", groupTransform(clampedValue))
                filterRanges.current[axis] = [clampedValue, currentRange[1]]
                updateRangeIndicator(clampedValue, currentRange[1])
                applyStyles(g, hoveredScenarioRef.current, true)
              })
              .on("end", function () {
                isDragging.current = false
                d3.select(this).style("cursor", isHoriz ? "ns-resize" : "grab")
                axisGroup
                  .select(".filter-range")
                  .transition()
                  .duration(300)
                  .attr("opacity", 0.1)
              }),
          )

        // ── Max (right / top) handle ─────────────────────────────────────────
        const rightArrowData = [{ type: "right", position: currentFilter[1] }]
        const rightArrows = axisGroup
          .selectAll(".axis-arrow-right")
          .data(rightArrowData)

        const rightArrowEnter = rightArrows
          .enter()
          .append("g")
          .attr("class", "axis-arrow axis-arrow-right")
          .style("cursor", isHoriz ? "ns-resize" : "grab")
          .style("filter", "drop-shadow(0 1px 3px rgba(0,0,0,0.12))")

        rightArrowEnter
          .append("circle")
          .attr("class", "touch-target")
          .attr("r", isExpanded ? 20 : 16)
          .attr("fill", "transparent")
          .attr("stroke", "none")
          .style("cursor", isHoriz ? "ns-resize" : "grab")

        rightArrowEnter
          .append("path")
          .attr("d", ARROW_PATH)
          .attr("fill", "#449cd9")
          .attr("stroke", "none")
          .attr("transform", `${arrowPathTransform} scale(${arrowScale})`)
          .style("pointer-events", "none")

        const rightArrowUpdate = rightArrowEnter.merge(rightArrows as any)
        rightArrowUpdate.select(".touch-target").attr("r", isExpanded ? 20 : 16)
        rightArrowUpdate
          .attr("transform", (d: any) => groupTransform(d.position))
          .call(
            d3
              .drag<SVGGElement, any>()
              .on("start", function () {
                isDragging.current = true
                d3.select(this).style("cursor", isHoriz ? "ns-resize" : "grabbing")
                axisGroup
                  .select(".filter-range")
                  .transition()
                  .duration(150)
                  .attr("opacity", 0.5)
              })
              .on("drag", function (event) {
                const newValue = invertEvent(event)
                const currentRange = filterRanges.current[axis] || [-1, 1]
                const minBound = currentRange[0] + 0.1
                const clampedValue = Math.min(1, Math.max(minBound, newValue))

                d3.select(this).attr("transform", groupTransform(clampedValue))
                filterRanges.current[axis] = [currentRange[0], clampedValue]
                updateRangeIndicator(currentRange[0], clampedValue)
                applyStyles(g, hoveredScenarioRef.current, true)
              })
              .on("end", function () {
                isDragging.current = false
                d3.select(this).style("cursor", isHoriz ? "ns-resize" : "grab")
                axisGroup
                  .select(".filter-range")
                  .transition()
                  .duration(300)
                  .attr("opacity", 0.1)
              }),
          )

        // ── Range indicator line ─────────────────────────────────────────────
        const hasActiveFilter = currentFilter[0] > -1 || currentFilter[1] < 1
        if (hasActiveFilter) {
          if (isHoriz) {
            axisGroup
              .append("line")
              .attr("class", "filter-range")
              .attr("x1", 0)
              .attr("x2", 0)
              .attr("y1", scales[axis]!(currentFilter[0]))
              .attr("y2", scales[axis]!(currentFilter[1]))
              .attr("stroke", "#449cd9")
              .attr("stroke-width", 6)
              .attr("opacity", 0.1)
          } else {
            axisGroup
              .append("line")
              .attr("class", "filter-range")
              .attr("x1", scales[axis]!(currentFilter[0]))
              .attr("x2", scales[axis]!(currentFilter[1]))
              .attr("y1", 0)
              .attr("y2", 0)
              .attr("stroke", "#449cd9")
              .attr("stroke-width", 6)
              .attr("opacity", 0.1)
          }
        }

      })

      // ── Report axis positions to parent for external HTML labels ────────────
      if (onAxesLayout) {
        const layoutPositions: AxisLayout[] = axes.map((axis) => {
          const axisPos = axisScale(axis)!
          return isHoriz
            ? { axis, x: margin.left + axisPos, y: margin.top }
            : { axis, x: margin.left, y: margin.top + axisPos }
        })
        // Only fire callback when positions actually change to prevent re-render loops
        const key = layoutPositions
          .map((p) => `${p.axis}:${p.x}:${p.y}`)
          .join("|")
        if (key !== prevAxisLayoutRef.current) {
          prevAxisLayoutRef.current = key
          onAxesLayout(layoutPositions)
        }
      }

      // ── Line generators ──────────────────────────────────────────────────────
      const baselineLineGen = isHoriz
        ? d3
            .line<[string, number]>()
            .x(([axisName]) => axisScale(axisName)!)
            .y(([axisName, value]) => scales[axisName]!(value))
        : d3
            .line<[string, number]>()
            .x(([axisName, value]) => scales[axisName]!(value))
            .y(([axisName]) => axisScale(axisName)!)

      // ── Baseline ─────────────────────────────────────────────────────────────
      if (showBaseline && baselineData) {
        const baselineColor = "#ff7f0e"
        const baselinePathData = axes.map(
          (axis) =>
            [axis, baselineData.values[axis] || 0] as [string, number],
        )

        let baselinePath = g.select<SVGPathElement>(".baseline-path")
        if (baselinePath.empty()) {
          baselinePath = g
            .append("path")
            .attr("class", "baseline-path")
            .attr("fill", "none")
            .attr("stroke", baselineColor)
            .attr("stroke-width", 4)
            .attr("opacity", 0.9)
        }

        const pathSelection = animate
          ? baselinePath.transition(t as any)
          : baselinePath
        ;(pathSelection as any).attr("d", baselineLineGen(baselinePathData))

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
              .attr("r", 5)
              .attr("opacity", 0.9)
          }

          const circleSelection = animate ? circle.transition(t as any) : circle
          ;(circleSelection as any)
            .attr("cx", isHoriz ? axisScale(axis)! : scales[axis]!(value))
            .attr("cy", isHoriz ? scales[axis]!(value) : axisScale(axis)!)
        })
      } else {
        const baselineRemovalTransition = animate
          ? d3.transition().duration(300)
          : null

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

      // ── Jitter for single-value axes ──────────────────────────────────────────
      // The last 4 axes are single-value tier outcomes with limited discrete
      // values, causing heavy line overlap. A small deterministic pixel offset
      // per scenario fans overlapping lines apart so each remains hoverable.
      const JITTER_AXIS_COUNT = 4
      const JITTER_MAX_PX = 4
      const jitterAxes = new Set(axes.slice(-JITTER_AXIS_COUNT))

      const jitterPxForIndex = (i: number) => {
        if (data.length <= 1) return 0
        return ((i / (data.length - 1)) * 2 - 1) * JITTER_MAX_PX
      }

      // ── Data lines and circles ────────────────────────────────────────────────
      data.forEach((d, dataIndex) => {
        const lineColor =
          lineColors.length > dataIndex
            ? lineColors[dataIndex]!
            : d.highlighted
              ? colors.highlighted
              : colors.default

        const style = getLineStyle(d, dataIndex, null)
        const isBaseline = baselineId != null && d.id === baselineId

        const pathData = axes.map(
          (axis) => [axis, d.values[axis]] as [string, number | null],
        )

        const jPx = jitterPxForIndex(dataIndex)
        const jitterFor = (axisName: string) =>
          jitterAxes.has(axisName) ? jPx : 0

        const jitteredLineGen = isHoriz
          ? d3
              .line<[string, number | null]>()
              .defined(([, v]) => v !== null)
              .x(([axisName]) => axisScale(axisName)!)
              .y(
                ([axisName, value]) =>
                  scales[axisName]!(value as number) + jitterFor(axisName),
              )
          : d3
              .line<[string, number | null]>()
              .defined(([, v]) => v !== null)
              .x(
                ([axisName, value]) =>
                  scales[axisName]!(value as number) + jitterFor(axisName),
              )
              .y(([axisName]) => axisScale(axisName)!)

        // Gold halo rendered behind the normal line for the baseline scenario
        if (isBaseline) {
          g.append("path")
            .attr("class", `line-halo-${dataIndex}`)
            .attr("fill", "none")
            .attr("stroke", BASELINE_HALO_COLOR)
            .attr("stroke-width", style.strokeWidth + BASELINE_HALO_WIDTH_EXTRA)
            .attr("opacity", style.lineOpacity)
            .attr("d", jitteredLineGen(pathData))
            .attr("stroke-linecap", "round")
            .attr("stroke-linejoin", "round")
            .style("pointer-events", "none")
        }

        g.append("path")
          .attr("class", `line-${dataIndex}`)
          .attr("fill", "none")
          .attr("stroke", lineColor)
          .attr("stroke-width", style.strokeWidth)
          .attr("opacity", style.lineOpacity)
          .attr("d", jitteredLineGen(pathData))
          .style("cursor", "pointer")
          .on("mouseover", function () {
            if (!passesFilters(d)) return
            commitHoverIn(g, d, dataIndex)
          })
          .on("mouseout", function () {
            hoveredScenarioRef.current = null
            scheduleHoverClear(g)
          })
          .on("click", function () {
            onLineClick?.(d)
          })

        axes.forEach((axis) => {
          const value = d.values[axis]
          if (value == null) return

          const j = jitterFor(axis)

          g.append("circle")
            .attr("class", `circle-${dataIndex}-${axis.replace(/\s+/g, "-")}`)
            .datum(d as any)
            .attr("fill", lineColor)
            .attr("stroke", "white")
            .attr("stroke-width", 1.5)
            .attr("r", style.circleRadius)
            .attr("opacity", style.circleOpacity)
            .attr(
              "cx",
              isHoriz ? axisScale(axis)! : scales[axis]!(value) + j,
            )
            .attr(
              "cy",
              isHoriz ? scales[axis]!(value) + j : axisScale(axis)!,
            )
            .style("cursor", "pointer")
            .on("mouseover", function () {
              if (!passesFilters(d)) return
              commitHoverIn(g, d, dataIndex)
            })
            .on("mouseout", function () {
              hoveredScenarioRef.current = null
              scheduleHoverClear(g)
            })
            .on("click", function () {
              onLineClick?.(d)
            })
        })
      })

      // ── Title ─────────────────────────────────────────────────────────────────
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
      orientation,
      margin,
      colors,
      lineColors,
      showBaseline,
      baselineData,
      title,
      onLineClick,
      passesFilters,
      baselineId,
      overlayTiers,
      hideAxisLabels,
      showTierLabels,
      relativeMode,
      onAxesLayout,
      getLineStyle,
      applyStyles,
      commitHoverIn,
      scheduleHoverClear,
      onLineHover,
    ],
  )

  useEffect(() => {
    updateChart(currentWidth, currentHeight, false)
  }, [updateChart, currentWidth, currentHeight])

  useEffect(() => {
    updateChart(currentWidth, currentHeight, true)
  }, [currentWidth, currentHeight, updateChart])

  // Re-apply styles when external highlight changes (sidebar hover / selection)
  useEffect(() => {
    const svg = d3.select(svgRef.current)
    const g = svg.select<SVGGElement>("g")
    if (g.empty()) return
    applyStyles(g, hoveredScenarioRef.current)
  }, [highlightedIds, applyStyles])


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
        onMouseLeave={() => {
          if (hoveredScenarioRef.current === null && !hoverOutTimer.current) return
          hoveredScenarioRef.current = null
          if (hoverOutTimer.current) {
            clearTimeout(hoverOutTimer.current)
            hoverOutTimer.current = null
          }
          onLineHover?.(null)
          const svg = d3.select(svgRef.current)
          const g = svg.select<SVGGElement>("g")
          if (!g.empty()) applyStyles(g, null)
        }}
      />
    </div>
  )
}

export default React.memo(VerticalParallelLinePlot)
export { VerticalParallelLinePlot as VerticalParallelLinePlotPeak }
