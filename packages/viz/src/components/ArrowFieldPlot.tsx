"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import { scaleBand, scaleLinear, select, symbol, symbolDiamond } from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"
import type { VerticalParallelLineData } from "./VerticalParallelLinePlot.peak"

export interface ArrowFieldPlotProps {
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
const TIER_LABELS = ["Tier 4 (Worst)", "Tier 3", "Tier 2", "Tier 1 (Best)"]
const MARGIN = { top: 25, right: 30, bottom: 40, left: 150 }
const BASELINE_COLOR = "#C5A135"

interface TooltipState {
  x: number
  y: number
  scenarioName: string
  outcomeName: string
  baselinePct: string
  scenarioPct: string
  direction: string
}

/** Draw a triangular arrowhead at (tipX, tipY) pointing left or right */
function arrowheadPath(
  tipX: number,
  tipY: number,
  size: number,
  pointsRight: boolean,
): string {
  if (pointsRight) {
    return `M${tipX - size},${tipY - size * 0.6} L${tipX},${tipY} L${tipX - size},${tipY + size * 0.6} Z`
  }
  return `M${tipX + size},${tipY - size * 0.6} L${tipX},${tipY} L${tipX + size},${tipY + size * 0.6} Z`
}

const ArrowFieldPlot: React.FC<ArrowFieldPlotProps> = React.memo(
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

        const xScale = scaleLinear().domain([-1, 1]).range([0, innerW])
        const yScale = scaleBand<string>()
          .domain(axes)
          .range([0, innerH])
          .padding(0.25)

        const bandH = yScale.bandwidth()

        // Alternating row backgrounds
        axes.forEach((axis, i) => {
          if (i % 2 === 0) {
            g.append("rect")
              .attr("x", 0)
              .attr("y", yScale(axis)!)
              .attr("width", innerW)
              .attr("height", bandH)
              .attr("fill", colors.background)
              .attr("rx", 2)
          }
        })

        // Horizontal guide line per row
        axes.forEach((axis) => {
          const y = yScale(axis)! + bandH / 2
          g.append("line")
            .attr("x1", 0)
            .attr("y1", y)
            .attr("x2", innerW)
            .attr("y2", y)
            .attr("stroke", "#e8e8e8")
            .attr("stroke-width", 0.5)
        })

        // Vertical tier gridlines
        TIER_VALUES.forEach((v, i) => {
          g.append("line")
            .attr("x1", xScale(v))
            .attr("y1", 0)
            .attr("x2", xScale(v))
            .attr("y2", innerH)
            .attr("stroke", "#ddd")
            .attr("stroke-width", 0.5)
            .attr("stroke-dasharray", v === -1 || v === 1 ? "none" : "3,3")

          g.append("text")
            .attr("x", xScale(v))
            .attr("y", innerH + 18)
            .attr("text-anchor", "middle")
            .attr("font-size", 10)
            .attr("fill", "#999")
            .text(TIER_LABELS[i] ?? "")
        })

        // Y-axis outcome labels
        axes.forEach((axis) => {
          g.append("text")
            .attr("x", -12)
            .attr("y", yScale(axis)! + bandH / 2)
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "middle")
            .attr("font-size", 11)
            .attr("fill", "#555")
            .text(axis)
        })

        const getOpacity = (id: string) => {
          if (highlightedIds && highlightedIds.size > 0) {
            return highlightedIds.has(id) ? 1.0 : 0.12
          }
          if (chosenIds && chosenIds.size > 0) {
            return chosenIds.has(id) ? 0.85 : 0.2
          }
          return 0.7
        }

        // Vertical jitter
        const nonBaselineData = data.filter((s) => s.id !== baselineData.id)
        const scenarioCount = nonBaselineData.length
        const jitterMap = new Map<string, number>()
        nonBaselineData.forEach((s, idx) => {
          if (scenarioCount <= 1) {
            jitterMap.set(s.id, 0)
          } else {
            const spread = bandH * 0.55
            jitterMap.set(
              s.id,
              -spread / 2 + (idx / (scenarioCount - 1)) * spread,
            )
          }
        })

        const arrowHeadSize = scenarioCount > 15 ? 4 : scenarioCount > 8 ? 5 : 6

        // Draw arrows per outcome
        axes.forEach((axis) => {
          const bv = baselineData.values[axis]
          if (bv == null) return

          const bx = xScale(bv)
          const cy = yScale(axis)! + bandH / 2

          // Baseline origin dot (small, visible as arrow tails converge here)
          const diamond = symbol().type(symbolDiamond).size(40)
          g.append("path")
            .attr("d", diamond()!)
            .attr("transform", `translate(${bx},${cy})`)
            .attr("fill", BASELINE_COLOR)
            .attr("fill-opacity", 0.85)
            .attr("stroke", "#A08520")
            .attr("stroke-width", 1.2)

          // Arrows for each scenario
          nonBaselineData.forEach((scenario) => {
            const sv = scenario.values[axis]
            if (sv == null) return

            const origIdx = data.indexOf(scenario)
            const color = lineColors[origIdx] || colors.default
            const opacity = getOpacity(scenario.id)
            const jitter = jitterMap.get(scenario.id) || 0
            const sy = cy + jitter
            const sx = xScale(sv)
            const pointsRight = sv > bv

            // Minimum arrow length threshold to avoid degenerate arrows
            const arrowLen = Math.abs(sx - bx)
            if (arrowLen < 2) return

            // Arrow shaft
            const shaftEndX = pointsRight
              ? sx - arrowHeadSize
              : sx + arrowHeadSize
            g.append("line")
              .attr("x1", bx)
              .attr("y1", sy)
              .attr("x2", shaftEndX)
              .attr("y2", sy)
              .attr("stroke", color)
              .attr("stroke-width", 1.8)
              .attr("stroke-opacity", opacity)

            // Arrowhead
            g.append("path")
              .attr("d", arrowheadPath(sx, sy, arrowHeadSize, pointsRight))
              .attr("fill", color)
              .attr("fill-opacity", opacity)

            // Invisible hit area for hover (wider than the visible arrow)
            g.append("line")
              .attr("x1", bx)
              .attr("y1", sy)
              .attr("x2", sx)
              .attr("y2", sy)
              .attr("stroke", "transparent")
              .attr("stroke-width", 12)
              .attr("cursor", "pointer")
              .on("mouseenter", (event: MouseEvent) => {
                const baselinePct = (((bv + 1) / 2) * 100).toFixed(0)
                const scenarioPct = (((sv + 1) / 2) * 100).toFixed(0)
                const rect = containerRef.current?.getBoundingClientRect()
                if (rect) {
                  setTooltip({
                    x: event.clientX - rect.left + 14,
                    y: event.clientY - rect.top - 14,
                    scenarioName: scenario.name,
                    outcomeName: axis,
                    baselinePct,
                    scenarioPct,
                    direction: pointsRight ? "improves" : "declines",
                  })
                }
                onLineHoverRef.current?.(scenario)
              })
              .on("mouseleave", () => {
                setTooltip(null)
                onLineHoverRef.current?.(null)
              })
              .on("click", () => onLineClickRef.current?.(scenario))
          })
        })
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
              border: "1px solid #ddd",
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
            <div style={{ fontWeight: 600, color: "#333" }}>
              {tooltip.scenarioName}
            </div>
            <div style={{ color: "#666" }}>
              {tooltip.outcomeName} &mdash;{" "}
              <span
                style={{
                  color:
                    tooltip.direction === "improves" ? "#4caf50" : "#ef5350",
                }}
              >
                {tooltip.direction}
              </span>
            </div>
            <div style={{ color: "#888", fontSize: 10, marginTop: 2 }}>
              Baseline: {tooltip.baselinePct}% &rarr; Scenario:{" "}
              {tooltip.scenarioPct}%
            </div>
          </div>
        )}
      </div>
    )
  },
)

ArrowFieldPlot.displayName = "ArrowFieldPlot"

export default ArrowFieldPlot
