"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import { scaleBand, scaleLinear, select, line } from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"
import type { VerticalParallelLineData } from "./VerticalParallelLinePlot.peak"

export interface DeviationPlotProps {
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
  /** Draw a thin dashed line connecting baseline marks across columns. */
  showBaselineStaircase?: boolean
  /** Draw a polyline connecting a hovered scenario's dots across columns. */
  showScenarioPath?: boolean
  /** Show subtle alternating tier-zone bands across the chart. */
  showTierZones?: boolean
}

/** Convert normalized value [-1, 1] to absolute tier position [4, 1]. */
function toTier(v: number): number {
  return 4 - (v + 1) * 1.5
}

const TIER_POSITIONS = [1, 2, 3, 4] as const
const TIER_LABELS = ["Tier 1", "Tier 2", "Tier 3", "Tier 4"] as const
const TIER_ZONE_COLORS = ["#e8f5e9", "#fffde7", "#fff3e0", "#ffebee"] as const

const MARGIN = { top: 20, right: 20, bottom: 20, left: 20 }

const COLOR_IMPROVED = "#4caf50"
const COLOR_WORSENED = "#e53935"
const DEFAULT_COLORS = {
  default: "#666",
  highlighted: "#1a3a5c",
  background: "#f8f9fa",
}
const DEFAULT_LINE_COLORS: string[] = []

const JITTER_PX = 14
function hashJitter(id: string, axis: string): number {
  const s = id + ":" + axis
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return ((h & 0xffff) / 0xffff) * 2 - 1
}

interface TooltipState {
  x: number
  y: number
  scenarioName: string
  outcomeName: string
  baselineTier: string
  scenarioTier: string
  change: string
}

const DeviationPlot: React.FC<DeviationPlotProps> = React.memo(
  ({
    data,
    axes,
    baselineData,
    responsive = true,
    width = 700,
    height = 400,
    colors = DEFAULT_COLORS,
    lineColors = DEFAULT_LINE_COLORS,
    onLineHover,
    onLineClick,
    chosenIds,
    highlightedIds,
    showBaselineStaircase = true,
    showScenarioPath = true,
    showTierZones = true,
  }) => {
    const svgRef = useRef<SVGSVGElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const hasAnimatedRef = useRef(false)
    const hoveredIdRef = useRef<string | null>(null)
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

        const xScale = scaleBand<string>()
          .domain(axes)
          .range([0, innerW])
          .padding(0.12)

        const yScale = scaleLinear().domain([0.5, 4.5]).range([0, innerH])

        const bandW = xScale.bandwidth()

        // ── Background ──────────────────────────────────────────────────
        g.append("rect")
          .attr("width", innerW)
          .attr("height", innerH)
          .attr("fill", colors.background)
          .attr("rx", 4)

        // ── Tier zone bands ─────────────────────────────────────────────
        if (showTierZones) {
          TIER_POSITIONS.forEach((t, i) => {
            const y0 = yScale(t - 0.5)
            const y1 = yScale(t + 0.5)
            g.append("rect")
              .attr("x", 0)
              .attr("y", y0)
              .attr("width", innerW)
              .attr("height", y1 - y0)
              .attr("fill", TIER_ZONE_COLORS[i] ?? "#f5f5f5")
              .attr("opacity", 0.35)
          })
        }

        // ── Horizontal gridlines ────────────────────────────────────────
        TIER_POSITIONS.forEach((t) => {
          g.append("line")
            .attr("x1", 0)
            .attr("y1", yScale(t))
            .attr("x2", innerW)
            .attr("y2", yScale(t))
            .attr("stroke", "#ddd")
            .attr("stroke-width", 0.5)
        })

        // ── Y-axis tier labels ──────────────────────────────────────────
        TIER_POSITIONS.forEach((t, i) => {
          g.append("text")
            .attr("x", -6)
            .attr("y", yScale(t))
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "middle")
            .attr("font-size", 10)
            .attr("fill", "#999")
            .text(TIER_LABELS[i] ?? "")
        })

        g.append("text")
          .attr("transform", "rotate(-90)")
          .attr("x", -innerH / 2)
          .attr("y", -14)
          .attr("text-anchor", "middle")
          .attr("font-size", 10)
          .attr("fill", "#bbb")
          .text("\u2191 Better \u00b7 Tier \u00b7 Worse \u2193")

        // ── Per-column shading & baseline marks ─────────────────────────
        const getOpacity = (id: string) => {
          if (highlightedIds && highlightedIds.size > 0) {
            return highlightedIds.has(id) ? 1.0 : 0.12
          }
          if (chosenIds && chosenIds.size > 0) {
            return chosenIds.has(id) ? 0.85 : 0.2
          }
          return 0.7
        }

        const T_DUR = hasAnimatedRef.current ? 0 : 500
        hasAnimatedRef.current = true
        const hasScenarioColors = lineColors.length > 0
        const dotR = data.length > 15 ? 3 : data.length > 8 ? 3.5 : 4.5
        const baselineMarkHalfW = Math.min(bandW * 0.35, 22)

        // Pre-compute baseline positions for the staircase line
        const baselinePoints: [number, number][] = []

        // Pre-compute dot positions keyed by scenario id for cross-highlight
        const dotPositions = new Map<
          string,
          { cx: number; cy: number; color: string; si: number }[]
        >()

        axes.forEach((axis) => {
          const colX = xScale(axis)!
          const colCx = colX + bandW / 2

          const bv = baselineData.values[axis]
          if (bv == null) return
          const bt = toTier(bv)
          const baseY = yScale(bt)

          baselinePoints.push([colCx, baseY])

          // Subtle per-column shading above/below baseline
          g.append("rect")
            .attr("x", colX + 1)
            .attr("y", yScale(0.5))
            .attr("width", bandW - 2)
            .attr("height", baseY - yScale(0.5))
            .attr("fill", COLOR_IMPROVED)
            .attr("opacity", 0.03)
          g.append("rect")
            .attr("x", colX + 1)
            .attr("y", baseY)
            .attr("width", bandW - 2)
            .attr("height", yScale(4.5) - baseY)
            .attr("fill", COLOR_WORSENED)
            .attr("opacity", 0.03)

          // Baseline mark
          g.append("line")
            .attr("x1", colCx - baselineMarkHalfW)
            .attr("y1", baseY)
            .attr("x2", colCx + baselineMarkHalfW)
            .attr("y2", baseY)
            .attr("stroke", "#555")
            .attr("stroke-width", 2.5)
            .attr("stroke-linecap", "round")
            .attr("opacity", 0.6)

          // Scenario dots
          data.forEach((scenario, si) => {
            const sv = scenario.values[axis]
            if (sv == null) return
            const st = toTier(sv)
            const dotY = yScale(st)

            const jitter = hashJitter(scenario.id, axis) * JITTER_PX
            const dotX = colCx + jitter

            const color = hasScenarioColors
              ? (lineColors[si] || colors.default)
              : colors.default

            if (!dotPositions.has(scenario.id)) {
              dotPositions.set(scenario.id, [])
            }
            dotPositions.get(scenario.id)!.push({ cx: dotX, cy: dotY, color, si })
          })

          // X-axis outcome label
          const label = axis
          const maxLabelW = bandW - 4
          const charW = 5.5
          const maxChars = Math.floor(maxLabelW / charW)

          if (label.length <= maxChars) {
            g.append("text")
              .attr("x", colCx)
              .attr("y", innerH + 14)
              .attr("text-anchor", "middle")
              .attr("font-size", 9.5)
              .attr("fill", "#666")
              .text(label)
          } else {
            const mid = Math.ceil(label.length / 2)
            let splitIdx = label.lastIndexOf(" ", mid)
            if (splitIdx <= 0) splitIdx = mid
            const line1 = label.slice(0, splitIdx).trim()
            const line2 = label.slice(splitIdx).trim()
            g.append("text")
              .attr("x", colCx)
              .attr("y", innerH + 12)
              .attr("text-anchor", "middle")
              .attr("font-size", 9)
              .attr("fill", "#666")
              .text(line1)
            g.append("text")
              .attr("x", colCx)
              .attr("y", innerH + 22)
              .attr("text-anchor", "middle")
              .attr("font-size", 9)
              .attr("fill", "#666")
              .text(line2)
          }
        })

        // ── Baseline staircase line ─────────────────────────────────────
        if (showBaselineStaircase && baselinePoints.length >= 2) {
          const stairLine = line<[number, number]>()
            .x((d) => d[0])
            .y((d) => d[1])
          g.append("path")
            .attr("d", stairLine(baselinePoints) ?? "")
            .attr("fill", "none")
            .attr("stroke", "#888")
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "5,4")
            .attr("stroke-opacity", 0.45)
            .attr("pointer-events", "none")
        }

        // ── Scenario path layer (drawn on hover via D3 imperative update) ──
        const pathLayer = g.append("g").attr("class", "scenario-path")

        // ── Dots layer (above path so dots are clickable) ───────────────
        const dotsLayer = g.append("g").attr("class", "dots")

        // Draw all dots and attach interaction handlers
        axes.forEach((axis) => {
          const colCx = xScale(axis)! + bandW / 2
          const bv = baselineData.values[axis]
          if (bv == null) return
          const bt = toTier(bv)
          const baseY = yScale(bt)

          data.forEach((scenario, si) => {
            const sv = scenario.values[axis]
            if (sv == null) return
            const st = toTier(sv)
            const dotY = yScale(st)
            const opacity = getOpacity(scenario.id)
            const jitter = hashJitter(scenario.id, axis) * JITTER_PX
            const dotX = colCx + jitter
            const color = hasScenarioColors
              ? (lineColors[si] || colors.default)
              : colors.default

            const dot = dotsLayer
              .append("circle")
              .attr("cx", dotX)
              .attr("cy", baseY)
              .attr("r", 0)
              .attr("fill", color)
              .attr("fill-opacity", opacity)
              .attr("stroke", color)
              .attr("stroke-width", 1)
              .attr("stroke-opacity", Math.min(opacity + 0.1, 1))
              .attr("cursor", "pointer")
              .attr("data-scenario-id", scenario.id)

            dot
              .transition()
              .duration(T_DUR)
              .attr("cy", dotY)
              .attr("r", dotR)

            dot
              .on("mouseenter", function (event: MouseEvent) {
                hoveredIdRef.current = scenario.id

                // Cross-highlight: brighten this scenario's dots, dim the rest
                dotsLayer
                  .selectAll<SVGCircleElement, unknown>("circle")
                  .attr("fill-opacity", function () {
                    return this.getAttribute("data-scenario-id") ===
                      scenario.id
                      ? 1.0
                      : 0.1
                  })
                  .attr("stroke-opacity", function () {
                    return this.getAttribute("data-scenario-id") ===
                      scenario.id
                      ? 1.0
                      : 0.05
                  })
                  .attr("r", function () {
                    return this.getAttribute("data-scenario-id") ===
                      scenario.id
                      ? dotR + 1.5
                      : dotR * 0.8
                  })

                select(this).attr("r", dotR + 2.5).raise()

                // Draw scenario path polyline
                if (showScenarioPath) {
                  pathLayer.selectAll("*").remove()
                  const pts = dotPositions.get(scenario.id)
                  if (pts && pts.length >= 2) {
                    const sorted = [...pts]
                    const pathGen = line<
                      (typeof sorted)[number]
                    >()
                      .x((d) => d.cx)
                      .y((d) => d.cy)
                    pathLayer
                      .append("path")
                      .attr("d", pathGen(sorted) ?? "")
                      .attr("fill", "none")
                      .attr("stroke", color)
                      .attr("stroke-width", 2)
                      .attr("stroke-opacity", 0.55)
                      .attr("stroke-linejoin", "round")
                      .attr("pointer-events", "none")
                  }
                }

                const rect = containerRef.current?.getBoundingClientRect()
                if (rect) {
                  const diff = bt - st
                  const sign = diff > 0 ? "+" : ""
                  setTooltip({
                    x: event.clientX - rect.left + 14,
                    y: event.clientY - rect.top - 14,
                    scenarioName: scenario.name,
                    outcomeName: axis,
                    baselineTier: `Tier ${bt.toFixed(1)}`,
                    scenarioTier: `Tier ${st.toFixed(1)}`,
                    change: `${sign}${diff.toFixed(1)} tier${Math.abs(diff) === 1 ? "" : "s"}`,
                  })
                }
                onLineHoverRef.current?.(scenario)
              })
              .on("mouseleave", function () {
                hoveredIdRef.current = null

                // Restore all dots to their normal opacity
                dotsLayer
                  .selectAll<SVGCircleElement, unknown>("circle")
                  .each(function () {
                    const sid = this.getAttribute("data-scenario-id") ?? ""
                    const op = getOpacity(sid)
                    select(this)
                      .attr("fill-opacity", op)
                      .attr("stroke-opacity", Math.min(op + 0.1, 1))
                      .attr("r", dotR)
                  })

                pathLayer.selectAll("*").remove()
                setTooltip(null)
                onLineHoverRef.current?.(null)
              })
              .on("click", () => onLineClickRef.current?.(scenario))
          })
        })
      },
      [
        data,
        axes,
        baselineData,
        lineColors,
        colors,
        chosenIds,
        highlightedIds,
        showBaselineStaircase,
        showScenarioPath,
        showTierZones,
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
              Baseline: {tooltip.baselineTier} &middot; Scenario:{" "}
              {tooltip.scenarioTier}
            </div>
            <div style={{ fontSize: 10, marginTop: 1 }}>
              Change:{" "}
              <span
                style={{
                  color: tooltip.change.startsWith("+")
                    ? COLOR_IMPROVED
                    : tooltip.change.startsWith("-")
                      ? COLOR_WORSENED
                      : "#888",
                  fontWeight: 600,
                }}
              >
                {tooltip.change}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  },
)

DeviationPlot.displayName = "DeviationPlot"

export default DeviationPlot
