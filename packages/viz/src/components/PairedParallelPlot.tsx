"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import {
  type ScaleLinear,
  line,
  scaleLinear,
  scalePoint,
  select,
  symbol,
  symbolDiamond,
} from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"
import { isFullOpacityDuringSidebarHighlight } from "../utils/sidebarHighlightPolicy"
import type { VerticalParallelLineData } from "./VerticalParallelLinePlot.peak"

export interface PairedParallelPlotProps {
  data: VerticalParallelLineData[]
  axes: string[]
  baselineData?: VerticalParallelLineData
  responsive?: boolean
  width?: number
  height?: number
  colors?: { default: string; highlighted: string; background: string }
  lineColors?: string[]
  onLineHover?: (data: VerticalParallelLineData | null) => void
  onLineClick?: (data: VerticalParallelLineData) => void
  chosenIds?: Set<string>
  highlightedIds?: Set<string> | null
}

const TIER_VALUES = [-1, -1 / 3, 1 / 3, 1]
const TIER_LABELS = ["Tier 4", "Tier 3", "Tier 2", "Tier 1"]
const MARGIN = { top: 60, right: 30, bottom: 30, left: 30 }
const BASELINE_COLOR = "#C5A135"
const IMPROVE_COLOR = "#4caf50"
const DECLINE_COLOR = "#ef5350"

interface TooltipState {
  x: number
  y: number
  scenarioName: string
  isBaseline: boolean
}

/**
 * Compute filled polygon segments between two polylines on parallel axes.
 * Handles crossing points where one line overtakes the other.
 */
function computeFillSegments(
  axisXPositions: number[],
  baselineYValues: (number | null)[],
  scenarioYValues: (number | null)[],
  yScale: ScaleLinear<number, number>,
): Array<{ points: [number, number][]; improving: boolean }> {
  const segments: Array<{ points: [number, number][]; improving: boolean }> = []

  for (let i = 0; i < axisXPositions.length - 1; i++) {
    const b1 = baselineYValues[i]
    const b2 = baselineYValues[i + 1]
    const s1 = scenarioYValues[i]
    const s2 = scenarioYValues[i + 1]
    if (b1 == null || b2 == null || s1 == null || s2 == null) continue

    const x1 = axisXPositions[i] ?? 0
    const x2 = axisXPositions[i + 1] ?? 0
    const yB1 = yScale(b1)
    const yB2 = yScale(b2)
    const yS1 = yScale(s1)
    const yS2 = yScale(s2)

    // Gap in data space (positive = scenario better)
    const gap1 = s1 - b1
    const gap2 = s2 - b2

    const sameSign = gap1 * gap2 >= 0

    if (sameSign) {
      const improving = gap1 + gap2 >= 0
      segments.push({
        points: [
          [x1, yS1],
          [x2, yS2],
          [x2, yB2],
          [x1, yB1],
        ],
        improving,
      })
    } else {
      // Lines cross: find intersection fraction
      const t = gap1 / (gap1 - gap2)
      const xCross = x1 + t * (x2 - x1)
      const bCross = b1 + t * (b2 - b1)
      const yCross = yScale(bCross)

      // First sub-segment (axis i to crossing)
      segments.push({
        points: [
          [x1, yS1],
          [xCross, yCross],
          [x1, yB1],
        ],
        improving: gap1 >= 0,
      })

      // Second sub-segment (crossing to axis i+1)
      segments.push({
        points: [
          [xCross, yCross],
          [x2, yS2],
          [x2, yB2],
        ],
        improving: gap2 >= 0,
      })
    }
  }

  return segments
}

const PairedParallelPlot: React.FC<PairedParallelPlotProps> = React.memo(
  ({
    data,
    axes,
    baselineData,
    responsive = true,
    width = 800,
    height = 500,
    colors = { default: "#666", highlighted: "#1a3a5c", background: "#f8f9fa" },
    lineColors = [],
    onLineHover,
    onLineClick,
    chosenIds,
    highlightedIds,
  }) => {
    const svgRef = useRef<SVGSVGElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const dimensions = useResizeObserver(
      containerRef as React.RefObject<HTMLElement>,
    )
    const [currentWidth, setCurrentWidth] = useState(width)
    const [currentHeight, setCurrentHeight] = useState(height)
    const [tooltip, setTooltip] = useState<TooltipState | null>(null)

    const onLineHoverRef = useRef(onLineHover)
    useEffect(() => {
      onLineHoverRef.current = onLineHover
    }, [onLineHover])
    const onLineClickRef = useRef(onLineClick)
    useEffect(() => {
      onLineClickRef.current = onLineClick
    }, [onLineClick])

    useEffect(() => {
      if (responsive && dimensions.width > 0 && dimensions.height > 0) {
        setCurrentWidth(dimensions.width)
        setCurrentHeight(dimensions.height)
      } else if (!responsive) {
        setCurrentWidth(width)
        setCurrentHeight(height)
      }
    }, [dimensions, responsive, width, height])

    const updateChart = useCallback(
      (w: number, h: number) => {
        const svg = select(svgRef.current)
        svg.selectAll("*").remove()
        if (!baselineData || w <= 0 || h <= 0) return

        const innerW = w - MARGIN.left - MARGIN.right
        const innerH = h - MARGIN.top - MARGIN.bottom
        if (innerW <= 0 || innerH <= 0) return

        const g = svg
          .append("g")
          .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`)

        // Axes spread horizontally, values mapped vertically
        const xScale = scalePoint<string>()
          .domain(axes)
          .range([0, innerW])
          .padding(0.08)

        const yScale = scaleLinear().domain([-1, 1]).range([innerH, 0])

        const axisXPositions = axes.map((a) => xScale(a)!)

        // Background
        g.append("rect")
          .attr("width", innerW)
          .attr("height", innerH)
          .attr("fill", colors.background)
          .attr("rx", 4)

        // Horizontal tier gridlines
        TIER_VALUES.forEach((v, i) => {
          g.append("line")
            .attr("x1", 0)
            .attr("y1", yScale(v))
            .attr("x2", innerW)
            .attr("y2", yScale(v))
            .attr("stroke", "#e0e0e0")
            .attr("stroke-width", 0.5)
            .attr("stroke-dasharray", v === -1 || v === 1 ? "none" : "3,3")

          // Left-side tier label
          g.append("text")
            .attr("x", -8)
            .attr("y", yScale(v))
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "middle")
            .attr("font-size", 9)
            .attr("fill", "#bbb")
            .text(TIER_LABELS[i] ?? "")
        })

        // Vertical axis lines + top labels
        axes.forEach((axis) => {
          const x = xScale(axis)!

          g.append("line")
            .attr("x1", x)
            .attr("y1", 0)
            .attr("x2", x)
            .attr("y2", innerH)
            .attr("stroke", "#ddd")
            .attr("stroke-width", 0.5)

          // Axis label at top (rotated for long names)
          g.append("text")
            .attr("x", x)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .attr("font-size", 10)
            .attr("fill", "#666")
            .text(axis)
        })

        const getOpacity = (id: string) => {
          if (highlightedIds && highlightedIds.size > 0) {
            return isFullOpacityDuringSidebarHighlight(id, highlightedIds, chosenIds)
              ? 1.0
              : 0.08
          }
          if (chosenIds && chosenIds.size > 0) {
            return chosenIds.has(id) ? 0.85 : 0.15
          }
          return 0.65
        }

        const nonBaselineData = data.filter((s) => s.id !== baselineData.id)

        // Build baseline values array
        const baselineValues = axes.map((a) => baselineData.values[a] ?? null)

        // For each scenario: fill area, then lines
        nonBaselineData.forEach((scenario, _si) => {
          const origIdx = data.indexOf(scenario)
          const color = lineColors[origIdx] || colors.default
          const opacity = getOpacity(scenario.id)
          const scenarioValues = axes.map((a) => scenario.values[a] ?? null)

          // Fill segments between baseline and scenario
          const fillSegments = computeFillSegments(
            axisXPositions,
            baselineValues,
            scenarioValues,
            yScale,
          )

          const fillG = g.append("g").attr("class", `fill-${scenario.id}`)
          fillSegments.forEach((seg) => {
            const path = line<[number, number]>()(seg.points)
            if (!path) return
            fillG
              .append("path")
              .attr("d", path + "Z")
              .attr("fill", seg.improving ? IMPROVE_COLOR : DECLINE_COLOR)
              .attr("fill-opacity", opacity * 0.22)
              .attr("stroke", "none")
          })

          // Scenario polyline
          const scenarioLine = line<number>()
            .defined((_, i) => scenarioValues[i] != null)
            .x((_, i) => axisXPositions[i] ?? 0)
            .y((_, i) => yScale(scenarioValues[i]!))

          g.append("path")
            .datum(axes.map((_, i) => i))
            .attr("d", scenarioLine as unknown as string)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 2)
            .attr("stroke-opacity", opacity)
            .attr("cursor", "pointer")
            .on("mouseenter", (event: MouseEvent) => {
              const rect = containerRef.current?.getBoundingClientRect()
              if (rect) {
                setTooltip({
                  x: event.clientX - rect.left + 14,
                  y: event.clientY - rect.top - 14,
                  scenarioName: scenario.name,
                  isBaseline: false,
                })
              }
              onLineHoverRef.current?.(scenario)
            })
            .on("mouseleave", () => {
              setTooltip(null)
              onLineHoverRef.current?.(null)
            })
            .on("click", () => onLineClickRef.current?.(scenario))

          // Scenario dots at each axis
          axes.forEach((axis, i) => {
            const v = scenarioValues[i]
            if (v == null) return
            g.append("circle")
              .attr("cx", axisXPositions[i] ?? 0)
              .attr("cy", yScale(v))
              .attr("r", 3.5)
              .attr("fill", color)
              .attr("fill-opacity", opacity)
              .attr("stroke", "white")
              .attr("stroke-width", 1)
          })
        })

        // Baseline polyline (drawn on top, dashed gold)
        const baselineLine = line<number>()
          .defined((_, i) => baselineValues[i] != null)
          .x((_, i) => axisXPositions[i] ?? 0)
          .y((_, i) => yScale(baselineValues[i]!))

        g.append("path")
          .datum(axes.map((_, i) => i))
          .attr("d", baselineLine as unknown as string)
          .attr("fill", "none")
          .attr("stroke", BASELINE_COLOR)
          .attr("stroke-width", 2.5)
          .attr("stroke-dasharray", "6,4")
          .attr("stroke-opacity", 0.85)
          .attr("cursor", "pointer")
          .on("mouseenter", (event: MouseEvent) => {
            const rect = containerRef.current?.getBoundingClientRect()
            if (rect) {
              setTooltip({
                x: event.clientX - rect.left + 14,
                y: event.clientY - rect.top - 14,
                scenarioName: baselineData.name,
                isBaseline: true,
              })
            }
            onLineHoverRef.current?.(baselineData)
          })
          .on("mouseleave", () => {
            setTooltip(null)
            onLineHoverRef.current?.(null)
          })

        // Baseline dots at each axis
        axes.forEach((axis, i) => {
          const v = baselineValues[i]
          if (v == null) return

          const diamond = symbol().type(symbolDiamond).size(50)
          g.append("path")
            .attr("d", diamond()!)
            .attr("transform", `translate(${axisXPositions[i]},${yScale(v)})`)
            .attr("fill", BASELINE_COLOR)
            .attr("fill-opacity", 0.9)
            .attr("stroke", "#A08520")
            .attr("stroke-width", 1)
        })

        // Legend
        const legendG = g
          .append("g")
          .attr("transform", `translate(${innerW - 160},${innerH + 14})`)

        legendG
          .append("rect")
          .attr("width", 10)
          .attr("height", 10)
          .attr("fill", IMPROVE_COLOR)
          .attr("fill-opacity", 0.35)
        legendG
          .append("text")
          .attr("x", 14)
          .attr("y", 9)
          .attr("font-size", 9)
          .attr("fill", "#666")
          .text("Scenario improves")

        legendG
          .append("rect")
          .attr("x", 100)
          .attr("width", 10)
          .attr("height", 10)
          .attr("fill", DECLINE_COLOR)
          .attr("fill-opacity", 0.35)
        legendG
          .append("text")
          .attr("x", 114)
          .attr("y", 9)
          .attr("font-size", 9)
          .attr("fill", "#666")
          .text("Scenario declines")
      },
      [data, axes, baselineData, lineColors, colors, chosenIds, highlightedIds],
    )

    useEffect(() => {
      if (currentWidth > 0 && currentHeight > 0) {
        updateChart(currentWidth, currentHeight)
      }
    }, [currentWidth, currentHeight, updateChart])

    return (
      <div
        ref={containerRef}
        style={{
          width: responsive ? "100%" : currentWidth,
          height: responsive ? "100%" : currentHeight,
          minHeight: 300,
          position: "relative",
        }}
      >
        <svg
          ref={svgRef}
          width={currentWidth}
          height={currentHeight}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
        {tooltip && (
          <div
            style={{
              position: "absolute",
              left: tooltip.x,
              top: tooltip.y,
              background: "rgba(255,255,255,0.96)",
              border: `1px solid ${tooltip.isBaseline ? BASELINE_COLOR : "#ddd"}`,
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: 11,
              lineHeight: 1.5,
              pointerEvents: "none",
              zIndex: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              whiteSpace: "nowrap",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                color: tooltip.isBaseline ? "#A08520" : "#333",
              }}
            >
              {tooltip.scenarioName}
              {tooltip.isBaseline ? " (baseline)" : ""}
            </div>
          </div>
        )}
      </div>
    )
  },
)

PairedParallelPlot.displayName = "PairedParallelPlot"

export default PairedParallelPlot
