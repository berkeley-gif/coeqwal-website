"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import * as d3 from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"
import type { VerticalParallelLineData } from "./VerticalParallelLinePlot.peak"

export interface BaselineScatterProps {
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
const MARGIN = { top: 20, right: 20, bottom: 55, left: 70 }

interface TooltipState {
  x: number
  y: number
  scenarioName: string
  outcomeName: string
  baselinePct: string
  scenarioPct: string
}

const BaselineScatter: React.FC<BaselineScatterProps> = ({
  data,
  axes,
  baselineData,
  responsive = true,
  width = 500,
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
      const svg = d3.select(svgRef.current)
      svg.selectAll("*").remove()
      if (!baselineData || w <= 0 || h <= 0) return

      const innerW = w - MARGIN.left - MARGIN.right
      const innerH = h - MARGIN.top - MARGIN.bottom
      const size = Math.min(innerW, innerH)
      if (size <= 0) return

      const offsetX = (innerW - size) / 2
      const offsetY = (innerH - size) / 2

      const g = svg
        .append("g")
        .attr(
          "transform",
          `translate(${MARGIN.left + offsetX},${MARGIN.top + offsetY})`,
        )

      const xScale = d3.scaleLinear().domain([-1, 1]).range([0, size])
      const yScale = d3.scaleLinear().domain([-1, 1]).range([size, 0])

      // Background
      g.append("rect")
        .attr("width", size)
        .attr("height", size)
        .attr("fill", colors.background)
        .attr("rx", 4)

      // Tier gridlines
      TIER_VALUES.forEach((v) => {
        g.append("line")
          .attr("x1", xScale(v))
          .attr("y1", 0)
          .attr("x2", xScale(v))
          .attr("y2", size)
          .attr("stroke", "#e0e0e0")
          .attr("stroke-width", 0.5)
        g.append("line")
          .attr("x1", 0)
          .attr("y1", yScale(v))
          .attr("x2", size)
          .attr("y2", yScale(v))
          .attr("stroke", "#e0e0e0")
          .attr("stroke-width", 0.5)
      })

      // Diagonal parity line
      g.append("line")
        .attr("x1", xScale(-1))
        .attr("y1", yScale(-1))
        .attr("x2", xScale(1))
        .attr("y2", yScale(1))
        .attr("stroke", "#aaa")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "6,4")
        .attr("opacity", 0.7)

      // Region labels
      g.append("text")
        .attr("x", size * 0.25)
        .attr("y", size * 0.2)
        .attr("text-anchor", "middle")
        .attr("font-size", 11)
        .attr("fill", "#ccc")
        .attr("font-style", "italic")
        .text("Better than baseline")
      g.append("text")
        .attr("x", size * 0.75)
        .attr("y", size * 0.8)
        .attr("text-anchor", "middle")
        .attr("font-size", 11)
        .attr("fill", "#ccc")
        .attr("font-style", "italic")
        .text("Worse than baseline")

      // X-axis tier labels
      TIER_VALUES.forEach((v, i) => {
        g.append("text")
          .attr("x", xScale(v))
          .attr("y", size + 18)
          .attr("text-anchor", "middle")
          .attr("font-size", 10)
          .attr("fill", "#999")
          .text(TIER_LABELS[i])
      })

      // Y-axis tier labels
      TIER_VALUES.forEach((v, i) => {
        g.append("text")
          .attr("x", -10)
          .attr("y", yScale(v))
          .attr("text-anchor", "end")
          .attr("dominant-baseline", "middle")
          .attr("font-size", 10)
          .attr("fill", "#999")
          .text(TIER_LABELS[i])
      })

      // Axis titles
      g.append("text")
        .attr("x", size / 2)
        .attr("y", size + 42)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("fill", "#666")
        .text("\u2190 Worse \u00b7 Baseline Performance \u00b7 Better \u2192")

      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -size / 2)
        .attr("y", -55)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("fill", "#666")
        .text("\u2190 Worse \u00b7 Scenario Performance \u00b7 Better \u2192")

      // Opacity logic
      const getOpacity = (id: string) => {
        if (highlightedIds && highlightedIds.size > 0) {
          return highlightedIds.has(id) ? 1.0 : 0.12
        }
        if (chosenIds && chosenIds.size > 0) {
          return chosenIds.has(id) ? 0.85 : 0.2
        }
        return 0.7
      }

      const baseRadius = data.length > 15 ? 3.5 : data.length > 8 ? 4.5 : 5.5

      // Draw dots
      const dotsG = g.append("g")
      data.forEach((scenario, si) => {
        const color = lineColors[si] || colors.default
        const opacity = getOpacity(scenario.id)

        axes.forEach((axis) => {
          const bv = baselineData.values[axis]
          const sv = scenario.values[axis]
          if (bv == null || sv == null) return

          const cx = xScale(bv)
          const cy = yScale(sv)

          dotsG
            .append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", baseRadius)
            .attr("fill", color)
            .attr("fill-opacity", opacity)
            .attr("stroke", color)
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", Math.min(opacity + 0.1, 1))
            .attr("cursor", "pointer")
            .on("mouseenter", function (event: MouseEvent) {
              d3.select(this)
                .attr("r", baseRadius + 3)
                .attr("fill-opacity", 1)
                .attr("stroke-opacity", 1)
                .raise()

              const rect = containerRef.current?.getBoundingClientRect()
              if (rect) {
                setTooltip({
                  x: event.clientX - rect.left + 14,
                  y: event.clientY - rect.top - 14,
                  scenarioName: scenario.name,
                  outcomeName: axis,
                  baselinePct: (((bv + 1) / 2) * 100).toFixed(0),
                  scenarioPct: (((sv + 1) / 2) * 100).toFixed(0),
                })
              }
              onLineHoverRef.current?.(scenario)
            })
            .on("mouseleave", function () {
              d3.select(this)
                .attr("r", baseRadius)
                .attr("fill-opacity", opacity)
                .attr("stroke-opacity", Math.min(opacity + 0.1, 1))
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
          <div style={{ color: "#666" }}>{tooltip.outcomeName}</div>
          <div style={{ color: "#888", fontSize: 10, marginTop: 2 }}>
            Baseline: {tooltip.baselinePct}% &middot; Scenario:{" "}
            {tooltip.scenarioPct}%
          </div>
        </div>
      )}
    </div>
  )
}

export default BaselineScatter
