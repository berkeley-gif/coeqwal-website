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
  showConnectLines?: boolean
  showOutcomeLabels?: boolean
  showSpreadDots?: boolean
  scenarioThemes?: Record<string, string>
  showThemeGrouping?: boolean
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

const JITTER_PX = 14
function hashJitter(id: string, axis: string): number {
  const s = id + ":" + axis
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return ((h & 0xffff) / 0xffff) * 2 - 1
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
  showConnectLines = false,
  showOutcomeLabels = false,
  showSpreadDots = false,
  scenarioThemes,
  showThemeGrouping = false,
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

      // ── Background ──────────────────────────────────────────────────
      g.append("rect")
        .attr("width", size)
        .attr("height", size)
        .attr("fill", colors.background)
        .attr("rx", 4)

      // ── Tier gridlines ──────────────────────────────────────────────
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

      // ── Diagonal parity line ────────────────────────────────────────
      g.append("line")
        .attr("x1", xScale(-1))
        .attr("y1", yScale(-1))
        .attr("x2", xScale(1))
        .attr("y2", yScale(1))
        .attr("stroke", "#aaa")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "6,4")
        .attr("opacity", 0.7)

      // ── Region labels ───────────────────────────────────────────────
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

      // ── Axis labels ─────────────────────────────────────────────────
      TIER_VALUES.forEach((v, i) => {
        g.append("text")
          .attr("x", xScale(v))
          .attr("y", size + 18)
          .attr("text-anchor", "middle")
          .attr("font-size", 10)
          .attr("fill", "#999")
          .text(TIER_LABELS[i] ?? "")
      })
      TIER_VALUES.forEach((v, i) => {
        g.append("text")
          .attr("x", -10)
          .attr("y", yScale(v))
          .attr("text-anchor", "end")
          .attr("dominant-baseline", "middle")
          .attr("font-size", 10)
          .attr("fill", "#999")
          .text(TIER_LABELS[i] ?? "")
      })

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

      // ── Opacity logic ───────────────────────────────────────────────
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

      const T_DUR = 600

      // ── Theme grouping: convex hull backgrounds ─────────────────────
      if (showThemeGrouping && scenarioThemes) {
        const themeGroups = new Map<string, [number, number][]>()
        data.forEach((scenario) => {
          const theme = scenarioThemes[scenario.id]
          if (!theme) return
          if (!themeGroups.has(theme)) themeGroups.set(theme, [])
          const pts = themeGroups.get(theme)!
          axes.forEach((axis) => {
            const bv = baselineData.values[axis]
            const sv = scenario.values[axis]
            if (bv == null || sv == null) return
            let cx = xScale(bv)
            let cy = yScale(sv)
            if (showSpreadDots) {
              cx += hashJitter(scenario.id, axis) * JITTER_PX
            }
            pts.push([cx, cy])
          })
        })

        const themeColorScale = d3
          .scaleOrdinal(d3.schemeTableau10)
          .domain(Array.from(themeGroups.keys()))

        const hullG = g.append("g").attr("class", "theme-hulls")
        themeGroups.forEach((pts, theme) => {
          if (pts.length < 3) return
          const hull = d3.polygonHull(pts as [number, number][])
          if (!hull) return
          hullG
            .append("path")
            .attr("d", `M${hull.map((p) => p.join(",")).join("L")}Z`)
            .attr("fill", themeColorScale(theme))
            .attr("fill-opacity", 0)
            .attr("stroke", themeColorScale(theme))
            .attr("stroke-width", 1)
            .attr("stroke-opacity", 0)
            .attr("stroke-dasharray", "4,3")
            .transition()
            .duration(T_DUR)
            .attr("fill-opacity", 0.06)
            .attr("stroke-opacity", 0.2)
        })
      }

      // ── Connect lines (polylines per scenario) ──────────────────────
      if (showConnectLines) {
        const connectG = g.append("g").attr("class", "connect-lines")
        const lineGen = d3
          .line<[number, number]>()
          .x((d) => d[0])
          .y((d) => d[1])

        data.forEach((scenario, si) => {
          const color = lineColors[si] || colors.default
          const opacity = getOpacity(scenario.id) * 0.5
          const pts: [number, number][] = []
          axes.forEach((axis) => {
            const bv = baselineData.values[axis]
            const sv = scenario.values[axis]
            if (bv == null || sv == null) return
            let cx = xScale(bv)
            let cy = yScale(sv)
            if (showSpreadDots) {
              cx += hashJitter(scenario.id, axis) * JITTER_PX
            }
            pts.push([cx, cy])
          })
          if (pts.length < 2) return
          pts.sort((a, b) => a[0] - b[0])
          connectG
            .append("path")
            .attr("d", lineGen(pts) ?? "")
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 1)
            .attr("stroke-opacity", 0)
            .transition()
            .duration(T_DUR)
            .attr("stroke-opacity", opacity)
        })
      }

      // ── Draw dots ───────────────────────────────────────────────────
      const dotsG = g.append("g")
      data.forEach((scenario, si) => {
        const color = lineColors[si] || colors.default
        const opacity = getOpacity(scenario.id)

        axes.forEach((axis) => {
          const bv = baselineData.values[axis]
          const sv = scenario.values[axis]
          if (bv == null || sv == null) return

          let cx = xScale(bv)
          let cy = yScale(sv)

          if (showSpreadDots) {
            cx += hashJitter(scenario.id, axis) * JITTER_PX
          }

          const diagY = yScale(bv)
          const dot = dotsG
            .append("circle")
            .attr("cx", cx)
            .attr("cy", diagY)
            .attr("r", 0)
            .attr("fill", color)
            .attr("fill-opacity", opacity)
            .attr("stroke", color)
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", Math.min(opacity + 0.1, 1))
            .attr("cursor", "pointer")
          dot.transition().duration(T_DUR).attr("cy", cy).attr("r", baseRadius)
          dot
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

      // ── Outcome labels with collision avoidance ─────────────────────
      if (showOutcomeLabels && data.length > 0) {
        const labelsG = g.append("g").attr("class", "outcome-labels")
        const PAD = 3
        const MAX_NUDGE = 40
        const CHAR_W = 6
        const LABEL_H = 12

        const labelData = axes
          .map((axis) => {
            let sumCx = 0
            let sumCy = 0
            let count = 0
            data.forEach((scenario) => {
              const bv = baselineData.values[axis]
              const sv = scenario.values[axis]
              if (bv == null || sv == null) return
              sumCx += xScale(bv)
              sumCy += yScale(sv)
              count++
            })
            if (count === 0) return null
            return {
              label: axis,
              cx: sumCx / count,
              cy: sumCy / count,
              dx: 8,
              dy: -5,
            }
          })
          .filter(Boolean) as {
          label: string
          cx: number
          cy: number
          dx: number
          dy: number
        }[]

        for (let iter = 0; iter < 10; iter++) {
          let anyOverlap = false
          for (let i = 0; i < labelData.length; i++) {
            for (let j = i + 1; j < labelData.length; j++) {
              const a = labelData[i]!
              const b = labelData[j]!
              const aw = a.label.length * CHAR_W + PAD * 2
              const bw = b.label.length * CHAR_W + PAD * 2
              const ah = LABEL_H + PAD * 2
              const bh = LABEL_H + PAD * 2
              const ax1 = a.cx + a.dx - PAD
              const ay1 = a.cy + a.dy - LABEL_H - PAD
              const bx1 = b.cx + b.dx - PAD
              const by1 = b.cy + b.dy - LABEL_H - PAD
              const overlapX = Math.min(ax1 + aw, bx1 + bw) - Math.max(ax1, bx1)
              const overlapY = Math.min(ay1 + ah, by1 + bh) - Math.max(ay1, by1)
              if (overlapX <= 0 || overlapY <= 0) continue
              anyOverlap = true
              if (overlapX < overlapY) {
                const push = overlapX / 2 + 1
                a.dx += ax1 < bx1 ? -push : push
                b.dx += ax1 < bx1 ? push : -push
              } else {
                const push = overlapY / 2 + 1
                a.dy += ay1 < by1 ? -push : push
                b.dy += ay1 < by1 ? push : -push
              }
              a.dx = Math.max(-MAX_NUDGE, Math.min(MAX_NUDGE, a.dx))
              a.dy = Math.max(-MAX_NUDGE, Math.min(MAX_NUDGE, a.dy))
              b.dx = Math.max(-MAX_NUDGE, Math.min(MAX_NUDGE, b.dx))
              b.dy = Math.max(-MAX_NUDGE, Math.min(MAX_NUDGE, b.dy))
            }
          }
          if (!anyOverlap) break
        }

        labelData.forEach((ld) => {
          labelsG
            .append("text")
            .attr("x", ld.cx + ld.dx)
            .attr("y", ld.cy + ld.dy)
            .attr("font-size", 9)
            .attr("fill", "#666")
            .attr("font-weight", 500)
            .attr("pointer-events", "none")
            .text(ld.label)
        })
      }
    },
    [
      data,
      axes,
      baselineData,
      lineColors,
      colors,
      chosenIds,
      highlightedIds,
      showConnectLines,
      showOutcomeLabels,
      showSpreadDots,
      scenarioThemes,
      showThemeGrouping,
    ],
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
