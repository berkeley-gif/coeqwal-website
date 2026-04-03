"use client"

import React, { useRef, useEffect, useCallback, useState, useMemo } from "react"
import { scaleLinear, select, line } from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"
import type { VerticalParallelLineData } from "./VerticalParallelLinePlot.peak"

export interface RadarPlotProps {
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
  highlightBaseline?: boolean
  showScenarioPath?: boolean
  showAllPaths?: boolean
  showTierZones?: boolean
  scenarioThemes?: Record<string, string>
  morphGeneration?: number
  pinnedScenarioIds?: Set<string>
  onPinnedToggle?: (scenarioId: string) => void
  dimUnpinned?: boolean
  showDistribution?: boolean
  distributionData?: Record<
    string,
    Record<string, { tier: number; count: number; normalized: number }[]>
  >
}

function toTier(v: number): number {
  return 4 - (v + 1) * 1.5
}

const TIER_POSITIONS = [1, 2, 3, 4] as const
const TIER_LABELS = ["Tier 1", "Tier 2", "Tier 3", "Tier 4"] as const
const TIER_BAND_COLORS = ["#edf2f7", "#ffffff", "#edf2f7", "#ffffff"] as const

const DEFAULT_COLORS = {
  default: "#546e7a",
  highlighted: "#1a3a5c",
  background: "#ffffff",
}
const DEFAULT_LINE_COLORS: string[] = []
const HOVER_NOTIFY_MS = 80

const FONT_FAMILY =
  '"neue-haas-grotesk-text", Roboto, Helvetica, Arial, sans-serif'

const LABEL_BREAK_POINTS: Record<string, [string, string]> = {
  "Community deliveries": ["Community", "deliveries"],
  "Agricultural revenue": ["Agricultural", "revenue"],
  "Environmental flows": ["Environmental", "flows"],
  "Reservoir storage": ["Reservoir", "storage"],
  "Groundwater storage": ["Groundwater", "storage"],
  "Delta estuary ecology": ["Delta estuary", "ecology"],
  "Freshwater for Delta exports": ["Freshwater for", "Delta exports"],
  "Freshwater for in-Delta uses": ["Freshwater for", "in-Delta uses"],
  "Winter-run salmon": ["Winter-run", "salmon"],
}

function showTooltip(
  el: HTMLDivElement,
  x: number,
  y: number,
  scenarioName: string,
  outcomeName: string,
) {
  el.style.display = "block"
  el.style.left = `${x}px`
  el.style.top = `${y}px`
  el.innerHTML =
    `<div style="font-weight:600;color:#1a202c;font-size:11.5px;letter-spacing:0.01em">${scenarioName}</div>` +
    `<div style="color:#4a5568;margin-top:3px;font-size:10.5px">${outcomeName}</div>`
}

function hideTooltip(el: HTMLDivElement) {
  el.style.display = "none"
}

function computeSpokeDodge(
  entries: { id: string; r: number }[],
  dotDiam: number,
  halfSpread: number,
): Map<string, number> {
  const result = new Map<string, number>()
  if (entries.length === 0) return result
  if (entries.length === 1) {
    result.set(entries[0]!.id, 0)
    return result
  }

  const minDist = dotDiam + 1.5
  const placed: { r: number; off: number }[] = []

  const sorted = [...entries].sort((a, b) => a.r - b.r)

  for (const entry of sorted) {
    let bestOff = 0
    if (placed.length === 0) {
      placed.push({ r: entry.r, off: 0 })
      result.set(entry.id, 0)
      continue
    }

    let found = false
    for (let dist = 0; dist <= halfSpread; dist += minDist * 0.5) {
      const candidates = dist === 0 ? [0] : [dist, -dist]
      for (const co of candidates) {
        if (Math.abs(co) > halfSpread) continue
        let overlaps = false
        for (const p of placed) {
          const dx = co - p.off
          const dy = entry.r - p.r
          if (Math.sqrt(dx * dx + dy * dy) < minDist) {
            overlaps = true
            break
          }
        }
        if (!overlaps) {
          bestOff = co
          found = true
          break
        }
      }
      if (found) break
    }

    if (!found) {
      let minOverlap = Infinity
      for (let dist = 0; dist <= halfSpread; dist += minDist * 0.25) {
        const candidates = dist === 0 ? [0] : [dist, -dist]
        for (const co of candidates) {
          let maxOv = 0
          for (const p of placed) {
            const dx = co - p.off
            const dy = entry.r - p.r
            const d = Math.sqrt(dx * dx + dy * dy)
            const ov = minDist - d
            if (ov > maxOv) maxOv = ov
          }
          if (maxOv < minOverlap) {
            minOverlap = maxOv
            bestOff = co
          }
        }
      }
    }

    placed.push({ r: entry.r, off: bestOff })
    result.set(entry.id, bestOff)
  }

  return result
}

const RadarPlot: React.FC<RadarPlotProps> = React.memo(
  ({
    data,
    axes,
    baselineData,
    responsive = true,
    width = 600,
    height = 600,
    colors = DEFAULT_COLORS,
    lineColors = DEFAULT_LINE_COLORS,
    onLineHover,
    onLineClick,
    highlightedIds,
    highlightBaseline = true,
    showScenarioPath = true,
    showAllPaths = false,
    showTierZones = true,
    morphGeneration,
    pinnedScenarioIds: pinnedScenarioIdsProp,
    onPinnedToggle,
    dimUnpinned = false,
    showDistribution = false,
    distributionData,
  }) => {
    const pinnedScenarioIds = useMemo(
      () => pinnedScenarioIdsProp ?? new Set<string>(),
      [pinnedScenarioIdsProp],
    )
    const svgRef = useRef<SVGSVGElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const tooltipRef = useRef<HTMLDivElement>(null)
    const hasAnimatedRef = useRef(false)

    const initialBaselineRef = useRef<Map<string, number> | null>(null)
    const hasMorphedRef = useRef(false)

    const shouldMorphNextRef = useRef(false)
    const prevMorphGenRef = useRef(morphGeneration)
    if (
      morphGeneration !== undefined &&
      prevMorphGenRef.current !== undefined &&
      morphGeneration !== prevMorphGenRef.current
    ) {
      shouldMorphNextRef.current = true
    }
    prevMorphGenRef.current = morphGeneration

    const scalesRef = useRef<{
      rScale: (n: number) => number
      cx: number
      cy: number
      radius: number
    } | null>(null)

    const lastNotifiedIdRef = useRef<string | null>(null)
    const hoverNotifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    )

    const onLineHoverRef = useRef(onLineHover)
    useEffect(() => {
      onLineHoverRef.current = onLineHover
    }, [onLineHover])
    const onLineClickRef = useRef(onLineClick)
    useEffect(() => {
      onLineClickRef.current = onLineClick
    }, [onLineClick])
    const onPinnedToggleRef = useRef(onPinnedToggle)
    useEffect(() => {
      onPinnedToggleRef.current = onPinnedToggle
    }, [onPinnedToggle])

    const dimensions = useResizeObserver(
      containerRef as React.RefObject<HTMLElement>,
    )
    const [currentWidth, setCurrentWidth] = useState(width)
    const [currentHeight, setCurrentHeight] = useState(height)

    useEffect(() => {
      if (responsive && dimensions) {
        setCurrentWidth(dimensions.width)
        setCurrentHeight(dimensions.height)
      }
    }, [responsive, dimensions])

    const getAngle = useCallback(
      (i: number) => (i / axes.length) * 2 * Math.PI - Math.PI / 2,
      [axes.length],
    )

    const updateChart = useCallback(
      (w: number, h: number) => {
        if (hoverNotifyTimerRef.current !== null) {
          clearTimeout(hoverNotifyTimerRef.current)
          hoverNotifyTimerRef.current = null
        }
        if (tooltipRef.current) hideTooltip(tooltipRef.current)

        const numAxes = axes.length
        if (numAxes === 0) return

        // ── Hydroclimate morph ──
        if (shouldMorphNextRef.current && scalesRef.current && baselineData) {
          shouldMorphNextRef.current = false
          hasMorphedRef.current = true
          const scales = scalesRef.current
          const dataMap = new Map(data.map((s) => [s.id, s]))
          const svg = select(svgRef.current)
          const HC_DUR = 600

          // Show/hide ghost baseline
          if (initialBaselineRef.current) {
            const ghostStored = initialBaselineRef.current
            let isBackToInitial = true
            axes.forEach((axis) => {
              const storedR = ghostStored.get(axis)
              const bv = baselineData.values[axis]
              if (storedR == null || bv == null) return
              const newR = scales.rScale(toTier(bv))
              if (Math.abs(newR - storedR) > 1) isBackToInitial = false
            })

            const ghostSel = svg.select("g.ghost-baselines")
            if (isBackToInitial && !ghostSel.empty()) {
              ghostSel
                .selectAll("*")
                .transition()
                .duration(HC_DUR)
                .attr("opacity", 0)
                .on("end", function () {
                  select(this).remove()
                })
            } else if (
              !isBackToInitial &&
              (ghostSel.empty() || ghostSel.selectAll("*").empty())
            ) {
              const gHost = ghostSel.empty()
                ? svg
                    .select("g")
                    .insert("g", "g.baseline-highlight")
                    .attr("class", "ghost-baselines")
                : ghostSel
              const pts: [number, number][] = []
              axes.forEach((axis, i) => {
                const storedR = ghostStored.get(axis)
                if (storedR == null) return
                const angle = getAngle(i)
                pts.push([
                  scales.cx + storedR * Math.cos(angle),
                  scales.cy + storedR * Math.sin(angle),
                ])
              })
              if (pts.length >= 3) {
                const pathGen = line<[number, number]>()
                  .x((d) => d[0])
                  .y((d) => d[1])
                gHost
                  .append("path")
                  .attr("d", pathGen([...pts, pts[0]!]) ?? "")
                  .attr("fill", "none")
                  .attr("stroke", "#2d3748")
                  .attr("stroke-width", 2)
                  .attr("stroke-dasharray", "6,4")
                  .attr("opacity", 0)
                  .attr("pointer-events", "none")
                  .transition()
                  .duration(HC_DUR)
                  .attr("opacity", 0.55)
              }
            }
          }

          // Transition dots
          const morphHasPinned = pinnedScenarioIds.size > 0
          svg
            .selectAll<SVGCircleElement, unknown>("circle.radar-dot")
            .each(function () {
              const el = select(this)
              const sid = el.attr("data-scenario-id")
              const axisName = el.attr("data-axis")
              const axisIdx = axes.indexOf(axisName ?? "")
              if (!sid || axisIdx < 0) return
              const scenario = dataMap.get(sid)
              if (!scenario) {
                el.transition().duration(HC_DUR).attr("fill-opacity", 0)
                return
              }
              const sv = scenario.values[axisName!]
              if (sv == null) {
                el.transition().duration(HC_DUR).attr("fill-opacity", 0)
                return
              }
              const restoreOp =
                dimUnpinned && morphHasPinned && !pinnedScenarioIds.has(sid)
                  ? 0.1
                  : 1.0
              const r = scales.rScale(toTier(sv))
              const angle = getAngle(axisIdx)
              const dodgeOff = parseFloat(el.attr("data-dodge") ?? "0")
              const perpAngle = angle + Math.PI / 2
              el.transition()
                .duration(HC_DUR)
                .attr(
                  "cx",
                  scales.cx +
                    r * Math.cos(angle) +
                    dodgeOff * Math.cos(perpAngle),
                )
                .attr(
                  "cy",
                  scales.cy +
                    r * Math.sin(angle) +
                    dodgeOff * Math.sin(perpAngle),
                )
                .attr("fill-opacity", restoreOp)
                .attr("stroke-opacity", Math.min(restoreOp + 0.1, 1))
            })

          // Transition baseline highlight polygon
          if (highlightBaseline) {
            const blPts: [number, number][] = []
            axes.forEach((axis, i) => {
              const bv = baselineData.values[axis]
              if (bv == null) return
              const r = scales.rScale(toTier(bv))
              const angle = getAngle(i)
              blPts.push([
                scales.cx + r * Math.cos(angle),
                scales.cy + r * Math.sin(angle),
              ])
            })
            if (blPts.length >= 3) {
              const pathGen = line<[number, number]>()
                .x((d) => d[0])
                .y((d) => d[1])
              svg
                .select<SVGPathElement>("path.baseline-polygon")
                .transition()
                .duration(HC_DUR)
                .attr("d", pathGen([...blPts, blPts[0]!]) ?? "")
            }
          }

          // Transition pinned/hovered polygons
          svg
            .selectAll<SVGPathElement, unknown>("path[data-path-id]")
            .each(function () {
              const el = select(this)
              const sid = el.attr("data-path-id")
              if (!sid) return
              const scenario = dataMap.get(sid)
              if (!scenario) return
              const pts: [number, number][] = []
              axes.forEach((axis, i) => {
                const sv = scenario.values[axis]
                if (sv == null) return
                const r = scales.rScale(toTier(sv))
                const angle = getAngle(i)
                pts.push([
                  scales.cx + r * Math.cos(angle),
                  scales.cy + r * Math.sin(angle),
                ])
              })
              if (pts.length >= 3) {
                const pathGen = line<[number, number]>()
                  .x((d) => d[0])
                  .y((d) => d[1])
                el.transition()
                  .duration(HC_DUR)
                  .attr("d", pathGen([...pts, pts[0]!]) ?? "")
              }
            })

          return
        }
        shouldMorphNextRef.current = false

        // ── Full rebuild ──
        const svg = select(svgRef.current)
        svg.selectAll("*").remove()
        if (!baselineData || w <= 0 || h <= 0) return

        const MARGIN = 80
        const size = Math.min(w, h)
        const radius = (size - MARGIN * 2) / 2
        if (radius <= 0) return
        const cx = w / 2
        const cy = h / 2

        const rScale = scaleLinear().domain([4.5, 0.5]).range([0, radius])
        scalesRef.current = { rScale: (n: number) => rScale(n), cx, cy, radius }

        const g = svg.append("g")

        const hasPinned = pinnedScenarioIds.size > 0
        const sidebarHighlightActive =
          !hasPinned && highlightedIds && highlightedIds.size > 0

        const hasScenarioColors = lineColors.length > 0
        const dotR = data.length > 15 ? 3.5 : data.length > 8 ? 4.5 : 5.5

        const getOpacity = (id: string) => {
          if (dimUnpinned && hasPinned) {
            return pinnedScenarioIds.has(id) ? 1.0 : 0.1
          }
          return 1.0
        }

        // 1. Tier zone rings (draw from outermost inward; each filled circle
        //    covers the inner portion of the previous one)
        if (showTierZones) {
          ;[...TIER_POSITIONS].forEach((t, i) => {
            const r = rScale(t - 0.5)
            g.append("circle")
              .attr("cx", cx)
              .attr("cy", cy)
              .attr("r", r)
              .attr("fill", TIER_BAND_COLORS[i] ?? "#fff")
              .attr("stroke", "none")
          })
        }

        // 2. Grid: concentric circles + radial spokes
        TIER_POSITIONS.forEach((t) => {
          const r = rScale(t)
          g.append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", r)
            .attr("fill", "none")
            .attr("stroke", "#cbd5e0")
            .attr("stroke-width", 0.8)
        })

        axes.forEach((_, i) => {
          const angle = getAngle(i)
          const outerR = rScale(0.5)
          g.append("line")
            .attr("x1", cx)
            .attr("y1", cy)
            .attr("x2", cx + outerR * Math.cos(angle))
            .attr("y2", cy + outerR * Math.sin(angle))
            .attr("stroke", "#cbd5e0")
            .attr("stroke-width", 0.8)
        })

        // Tier labels along the first spoke (top)
        TIER_POSITIONS.forEach((t, i) => {
          const r = rScale(t)
          g.append("text")
            .attr("x", cx + 6)
            .attr("y", cy - r - 3)
            .attr("font-size", 10)
            .attr("font-family", FONT_FAMILY)
            .attr("font-weight", 500)
            .attr("fill", "#718096")
            .text(TIER_LABELS[i] ?? "")
        })

        // Capture baseline positions for ghost trace
        const baselineRadii = new Map<string, number>()
        axes.forEach((axis) => {
          const bv = baselineData.values[axis]
          if (bv == null) return
          baselineRadii.set(axis, rScale(toTier(bv)))
        })
        initialBaselineRef.current = baselineRadii
        hasMorphedRef.current = false

        // 3. Ghost baseline layer (empty on first render)
        g.append("g").attr("class", "ghost-baselines")

        // 4. Baseline highlight polygon
        const baselineHighlightLayer = g
          .append("g")
          .attr("class", "baseline-highlight")
        if (highlightBaseline && baselineData) {
          const blPts: [number, number][] = []
          axes.forEach((axis, i) => {
            const bv = baselineData.values[axis]
            if (bv == null) return
            const r = rScale(toTier(bv))
            const angle = getAngle(i)
            blPts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)])
          })
          if (blPts.length >= 3) {
            const pathGen = line<[number, number]>()
              .x((d) => d[0])
              .y((d) => d[1])
            baselineHighlightLayer
              .append("path")
              .attr("class", "baseline-polygon")
              .attr("d", pathGen([...blPts, blPts[0]!]) ?? "")
              .attr("fill", "rgba(45,55,72,0.10)")
              .attr("stroke", "#2d3748")
              .attr("stroke-width", 2)
              .attr("stroke-opacity", 0.6)
              .attr("pointer-events", "none")
          }
        }

        // 5. Distribution dots layer
        const distributionLayer = g
          .append("g")
          .attr("class", "distribution-dots")

        // 6. Scenario path layer
        const pathLayer = g.append("g").attr("class", "scenario-paths")

        // 7. Dots layer
        const dotsLayer = g.append("g").attr("class", "dots")

        // Compute dodge offsets per axis (perpendicular to spoke)
        const dodgeMap = new Map<string, number>()
        const dotDiam = dotR * 2 + 1.5
        const effectiveJitter = radius * 0.06
        axes.forEach((axis) => {
          const entries: { id: string; r: number }[] = []
          data.forEach((scenario) => {
            const sv = scenario.values[axis]
            if (sv == null) return
            entries.push({ id: scenario.id, r: rScale(toTier(sv)) })
          })
          const offsets = computeSpokeDodge(entries, dotDiam, effectiveJitter)
          offsets.forEach((off, id) => {
            dodgeMap.set(`${axis}:${id}`, off)
          })
        })

        // Build dot positions for polygon drawing
        const dotPositions = new Map<
          string,
          { x: number; y: number; color: string; si: number }[]
        >()

        const T_DUR = hasAnimatedRef.current ? 0 : 400
        hasAnimatedRef.current = true

        const drawPolygonForScenario = (scenarioId: string) => {
          pathLayer.selectAll(`[data-path-id="${scenarioId}"]`).remove()
          if (!showScenarioPath && !showAllPaths) return
          const pts = dotPositions.get(scenarioId)
          if (!pts || pts.length < 3) return
          const activeList = data
          const scenario = activeList.find((s) => s.id === scenarioId)
          if (!scenario) return
          const si = activeList.indexOf(scenario)
          const color = hasScenarioColors
            ? lineColors[si] || colors.default
            : colors.default
          const pathGen = line<(typeof pts)[number]>()
            .x((d) => d.x)
            .y((d) => d.y)
          const isPinned = pinnedScenarioIds.has(scenarioId)
          const isHighlighted = highlightedIds && highlightedIds.has(scenarioId)
          const isBackground = showAllPaths && !isPinned && !isHighlighted
          const dimmed = dimUnpinned && hasPinned && !isPinned
          let strokeOp = isBackground ? 0.55 : 0.45
          if (dimmed) strokeOp = 0.07
          pathLayer
            .append("path")
            .attr("data-path-id", scenarioId)
            .attr("d", pathGen([...pts, pts[0]!]) ?? "")
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", isBackground ? 1.2 : 1.5)
            .attr("stroke-opacity", strokeOp)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("pointer-events", "none")
        }

        const applyFocusVisuals = (focusId: string) => {
          dotsLayer
            .selectAll<SVGCircleElement, unknown>("circle.radar-dot")
            .each(function () {
              const sid = this.getAttribute("data-scenario-id") ?? ""
              const isFocus = sid === focusId
              const isPin = pinnedScenarioIds.has(sid)
              select(this)
                .attr("fill-opacity", isFocus || isPin ? 1.0 : 0.08)
                .attr("stroke-opacity", isFocus || isPin ? 1.0 : 0.08)
                .attr("r", isFocus ? dotR + 1.5 : isPin ? dotR + 3 : dotR * 0.7)
            })
        }

        const boostPinnedDots = (ids: Set<string>) => {
          dotsLayer
            .selectAll<SVGCircleElement, unknown>("circle.radar-dot")
            .each(function () {
              const sid = this.getAttribute("data-scenario-id") ?? ""
              if (!ids.has(sid)) return
              select(this)
                .attr("r", dotR + 3)
                .attr("fill-opacity", 1)
            })
        }

        const resetDotVisuals = () => {
          dotsLayer
            .selectAll<SVGCircleElement, unknown>("circle.radar-dot")
            .each(function () {
              const sid = this.getAttribute("data-scenario-id") ?? ""
              const op = getOpacity(sid)
              const isPinned = pinnedScenarioIds.has(sid)
              select(this)
                .attr("fill-opacity", op)
                .attr("stroke-opacity", Math.min(op + 0.1, 1))
                .attr("r", isPinned ? dotR + 3 : dotR)
            })
        }

        // Render dots
        axes.forEach((axis, axisIdx) => {
          const angle = getAngle(axisIdx)
          const perpAngle = angle + Math.PI / 2

          data.forEach((scenario, si) => {
            const sv = scenario.values[axis]
            if (sv == null) return
            const r = rScale(toTier(sv))
            const dodgeOff = dodgeMap.get(`${axis}:${scenario.id}`) ?? 0
            const dotX =
              cx + r * Math.cos(angle) + dodgeOff * Math.cos(perpAngle)
            const dotY =
              cy + r * Math.sin(angle) + dodgeOff * Math.sin(perpAngle)
            const opacity = getOpacity(scenario.id)
            const color = hasScenarioColors
              ? lineColors[si] || colors.default
              : colors.default

            if (!dotPositions.has(scenario.id))
              dotPositions.set(scenario.id, [])
            dotPositions.get(scenario.id)!.push({
              x: dotX,
              y: dotY,
              color,
              si,
            })

            const isPinnedDot = pinnedScenarioIds.has(scenario.id)
            const targetR = isPinnedDot
              ? dotR + 3
              : sidebarHighlightActive
                ? highlightedIds!.has(scenario.id)
                  ? dotR + 1.5
                  : dotR * 0.7
                : dotR

            const dot = dotsLayer
              .append("circle")
              .attr("class", "radar-dot")
              .attr("cx", cx)
              .attr("cy", cy)
              .attr("r", 0)
              .attr("fill", color)
              .attr("fill-opacity", opacity)
              .attr("stroke", color)
              .attr("stroke-width", 1.5)
              .attr("stroke-opacity", Math.min(opacity + 0.1, 1))
              .attr("cursor", "pointer")
              .attr("data-scenario-id", scenario.id)
              .attr("data-axis", axis)
              .attr("data-dodge", dodgeOff)

            dot
              .transition()
              .duration(T_DUR)
              .attr("cx", dotX)
              .attr("cy", dotY)
              .attr("r", targetR)

            dot
              .on("mouseenter", function () {
                applyFocusVisuals(scenario.id)
                select(this)
                  .attr("r", dotR + 2.5)
                  .raise()

                if (showScenarioPath) drawPolygonForScenario(scenario.id)

                if (hoverNotifyTimerRef.current !== null) {
                  clearTimeout(hoverNotifyTimerRef.current)
                  hoverNotifyTimerRef.current = null
                }

                const el = tooltipRef.current
                if (el) {
                  showTooltip(el, dotX, cy - radius - 30, scenario.name, axis)
                }

                if (lastNotifiedIdRef.current !== scenario.id) {
                  hoverNotifyTimerRef.current = setTimeout(() => {
                    hoverNotifyTimerRef.current = null
                    lastNotifiedIdRef.current = scenario.id
                    onLineHoverRef.current?.(scenario)
                  }, HOVER_NOTIFY_MS)
                }
              })
              .on("mouseleave", function () {
                if (hoverNotifyTimerRef.current !== null) {
                  clearTimeout(hoverNotifyTimerRef.current)
                  hoverNotifyTimerRef.current = null
                }
                resetDotVisuals()
                if (hasPinned) {
                  pathLayer.selectAll("*").remove()
                  pinnedScenarioIds.forEach((id) => drawPolygonForScenario(id))
                  boostPinnedDots(pinnedScenarioIds)
                } else {
                  pathLayer.selectAll("*").remove()
                }
                if (tooltipRef.current) hideTooltip(tooltipRef.current)
                lastNotifiedIdRef.current = null
                onLineHoverRef.current?.(null)
              })
              .on("click", () => {
                onPinnedToggleRef.current?.(scenario.id)
                onLineClickRef.current?.(scenario)
              })
          })
        })

        // Draw all scenario polygons if showAllPaths is on
        if (showAllPaths) {
          data.forEach((scenario) => {
            drawPolygonForScenario(scenario.id)
          })
        }

        // Draw pinned polygons on initial render
        if (hasPinned) {
          pinnedScenarioIds.forEach((id) => drawPolygonForScenario(id))
          boostPinnedDots(pinnedScenarioIds)
        } else if (!showAllPaths && highlightedIds && highlightedIds.size > 0) {
          const hId = highlightedIds.values().next().value as string
          if (hId) drawPolygonForScenario(hId)
        }

        // 8. Distribution dots.arranged along tier circle arcs
        if (showDistribution && distributionData && hasPinned) {
          const pinnedArr = Array.from(pinnedScenarioIds)
          const pinCount = pinnedArr.length
          const locDotR = 2.5
          const locDotDiam = locDotR * 2 + 0.5
          const angularGap = (2 * Math.PI) / numAxes
          const maxArcSpan = angularGap * 0.7

          pinnedArr.forEach((scenarioId, pinIdx) => {
            const outcomeBuckets = distributionData[scenarioId]
            if (!outcomeBuckets) return
            const si = data.findIndex((s) => s.id === scenarioId)
            const color =
              si >= 0 && hasScenarioColors
                ? lineColors[si] || colors.default
                : colors.default

            axes.forEach((axis, axisIdx) => {
              const buckets = outcomeBuckets[axis]
              if (!buckets || buckets.length === 0) return
              const axisAngle = getAngle(axisIdx)

              const arcSlice =
                pinCount === 1 ? maxArcSpan : maxArcSpan / pinCount
              const sliceCenter =
                pinCount === 1
                  ? axisAngle
                  : axisAngle -
                    maxArcSpan / 2 +
                    arcSlice * pinIdx +
                    arcSlice / 2

              buckets.forEach(({ tier, count }) => {
                if (count <= 0) return
                const tierR = rScale(tier)
                const minArcR = radius * 0.25
                const layoutR = Math.max(tierR, minArcR)
                const arcLen = layoutR * arcSlice
                const maxDotsPerRow = Math.max(
                  1,
                  Math.floor(arcLen / locDotDiam),
                )
                const rows = Math.ceil(count / maxDotsPerRow)
                const cols = Math.min(count, maxDotsPerRow)
                const usedArc = cols > 1 ? (cols * locDotDiam) / layoutR : 0

                for (let d = 0; d < count; d++) {
                  const col = d % maxDotsPerRow
                  const row = Math.floor(d / maxDotsPerRow)
                  const colFrac = cols === 1 ? 0 : (col / (cols - 1)) * 2 - 1
                  const dotAngle = sliceCenter + colFrac * (usedArc / 2)
                  const radialOff =
                    rows <= 1 ? 0 : (row - (rows - 1) / 2) * locDotDiam
                  const effR = tierR + radialOff
                  const dx = cx + effR * Math.cos(dotAngle)
                  const dy = cy + effR * Math.sin(dotAngle)
                  distributionLayer
                    .append("circle")
                    .attr("cx", dx)
                    .attr("cy", dy)
                    .attr("r", locDotR)
                    .attr("fill", color)
                    .attr("fill-opacity", 0.85)
                    .attr("stroke", "rgba(0,0,0,0.25)")
                    .attr("stroke-width", 0.5)
                    .attr("pointer-events", "none")
                    .attr("class", "dist-dot")
                }
              })
            })
          })
        }

        // 9. Axis labels (outside ring)
        axes.forEach((axis, i) => {
          const angle = getAngle(i)
          const labelR = radius + 24
          const lx = cx + labelR * Math.cos(angle)
          const ly = cy + labelR * Math.sin(angle)

          const angleDeg = (angle * 180) / Math.PI
          const isLeft = angleDeg > 90 || angleDeg < -90
          const anchor =
            Math.abs(angleDeg + 90) < 5 ? "middle" : isLeft ? "end" : "start"

          const curated = LABEL_BREAK_POINTS[axis]
          if (curated) {
            g.append("text")
              .attr("x", lx)
              .attr("y", ly - 6)
              .attr("text-anchor", anchor)
              .attr("dominant-baseline", "middle")
              .attr("font-size", 11)
              .attr("font-family", FONT_FAMILY)
              .attr("font-weight", 500)
              .attr("fill", "#4a5568")
              .text(curated[0])
            g.append("text")
              .attr("x", lx)
              .attr("y", ly + 7)
              .attr("text-anchor", anchor)
              .attr("dominant-baseline", "middle")
              .attr("font-size", 11)
              .attr("font-family", FONT_FAMILY)
              .attr("font-weight", 500)
              .attr("fill", "#4a5568")
              .text(curated[1])
          } else {
            g.append("text")
              .attr("x", lx)
              .attr("y", ly)
              .attr("text-anchor", anchor)
              .attr("dominant-baseline", "middle")
              .attr("font-size", 11)
              .attr("font-family", FONT_FAMILY)
              .attr("font-weight", 500)
              .attr("fill", "#4a5568")
              .text(axis)
          }
        })
      },
      [
        data,
        axes,
        baselineData,
        lineColors,
        colors,
        highlightedIds,
        highlightBaseline,
        showScenarioPath,
        showAllPaths,
        showTierZones,
        pinnedScenarioIds,
        dimUnpinned,
        showDistribution,
        distributionData,
        getAngle,
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
          minHeight: 400,
          position: "relative",
        }}
      >
        <svg
          ref={svgRef}
          width={currentWidth}
          height={currentHeight}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
        <div
          ref={tooltipRef}
          style={{
            display: "none",
            position: "absolute",
            background: "rgba(255,255,255,0.97)",
            border: "1px solid #eceff1",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 11,
            fontFamily: FONT_FAMILY,
            lineHeight: 1.55,
            pointerEvents: "none",
            zIndex: 10,
            boxShadow:
              "0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
            whiteSpace: "normal",
            maxWidth: 280,
            transform: "translateX(-50%)",
          }}
        />
      </div>
    )
  },
)

RadarPlot.displayName = "RadarPlot"

export default RadarPlot
