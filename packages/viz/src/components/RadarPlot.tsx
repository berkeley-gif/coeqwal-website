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
  onDotClick?: (scenarioId: string, axis: string) => void
  dimUnpinned?: boolean
  axisRange?: Record<string, { min: number; max: number }>
  showDistribution?: boolean
  distributionData?: Record<
    string,
    Record<string, { tier: number; count: number; normalized: number }[]>
  >
  /** When set, the dot matching this axis + scenario gets a highlight ring on the map. */
  activeMapDot?: { axis: string; scenarioId: string } | null
  /** When true, hide connecting lines and show only dots */
  showDotsOnly?: boolean
}

function toTier(v: number): number {
  return 4 - (v + 1) * 1.5
}

const TIER_POSITIONS = [1, 2, 3, 4] as const
const TIER_LABELS = ["Tier 1", "Tier 2", "Tier 3", "Tier 4"] as const
const TIER_BAND_COLORS = ["#ffffff", "#ffffff", "#ffffff", "#ffffff"] as const

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
  "NOD: Community deliveries": ["NOD:", "Community deliveries"],
  "SOD: Community deliveries": ["SOD:", "Community deliveries"],
  "NOD: Agricultural revenue": ["NOD:", "Agricultural revenue"],
  "SOD: Agricultural revenue": ["SOD:", "Agricultural revenue"],
  "NOD: Environmental flows": ["NOD:", "Environmental flows"],
  "SOD: Environmental flows": ["SOD:", "Environmental flows"],
  "NOD: Reservoir storage": ["NOD:", "Reservoir storage"],
  "SOD: Reservoir storage": ["SOD:", "Reservoir storage"],
  "NOD: Groundwater storage": ["NOD:", "Groundwater storage"],
  "SOD: Groundwater storage": ["SOD:", "Groundwater storage"],
}

const TIER_SWATCH_COLORS = ["", "#1ca367", "#31b2c5", "#f2944f", "#ee5d32"]

const THEME_PILL_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  baseline: { label: "Baselines", bg: "#ffd87e", text: "#7a5200" },
  ag_gw: { label: "Farms and groundwater", bg: "#d0ebd7", text: "#2d6a4f" },
  eco: {
    label: "Rivers, salmon and the Delta ecosystem",
    bg: "#CDDFF1",
    text: "#1E4F6E",
  },
  delta: {
    label: "The Delta as a living place",
    bg: "#DED6F0",
    text: "#3A2888",
  },
  cws: { label: "Community water systems", bg: "#ffe5cc", text: "#7a3000" },
  unthemed: { label: "Other scenarios", bg: "#e0e0e0", text: "#616161" },
}

function showTooltip(
  el: HTMLDivElement,
  scenarioName: string,
  outcomeName: string,
  tierValue?: number,
  themeKey?: string,
) {
  el.style.display = "block"
  const tier =
    tierValue != null ? Math.min(4, Math.max(1, Math.round(tierValue))) : null
  const tierLine =
    tier != null
      ? `<div style="display:flex;align-items:center;gap:5px;margin-top:3px;color:#4a5568;font-size:10.5px">` +
        `<span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${TIER_SWATCH_COLORS[tier]};flex-shrink:0"></span>` +
        `Tier ${tier}</div>`
      : ""
  const pill = themeKey ? THEME_PILL_CONFIG[themeKey] : undefined
  const themeLine = pill
    ? `<div><span style="display:inline-block;font-size:8.5px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:${pill.text};background:${pill.bg};padding:1px 4px;border-radius:2px;line-height:1.3">${pill.label}</span></div>`
    : ""
  el.innerHTML =
    themeLine +
    `<div style="font-weight:600;color:#1a202c;font-size:11.5px;letter-spacing:0.01em;margin-top:${pill ? "3px" : "0"}">${scenarioName}</div>` +
    `<div style="color:#4a5568;margin-top:3px;font-size:10.5px">${outcomeName}</div>` +
    tierLine
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
    onDotClick,
    dimUnpinned = false,
    axisRange,
    scenarioThemes,
    showDistribution = false,
    distributionData,
    activeMapDot,
    showDotsOnly = false,
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
    const onDotClickRef = useRef(onDotClick)
    useEffect(() => {
      onDotClickRef.current = onDotClick
    }, [onDotClick])

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

          // Ghost baseline (dashed line showing original position) — disabled
          // if (initialBaselineRef.current) { ... }

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
                .attr("stroke-opacity", restoreOp)
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

          // Range shadow: crossfade instead of tweening the arc path
          const rangeSel = svg.select<SVGPathElement>("path.range-shadow")
          if (!rangeSel.empty()) {
            rangeSel
              .transition()
              .duration(HC_DUR * 0.4)
              .attr("fill-opacity", 0)
              .attr("stroke-opacity", 0)
          }

          // Transition pinned/hovered polygons alongside dots
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
                const dodgeEl = svg.select(
                  `circle[data-axis="${axis}"][data-scenario-id="${sid}"]`,
                )
                const dodgeOff = dodgeEl.empty()
                  ? 0
                  : parseFloat(dodgeEl.attr("data-dodge") ?? "0")
                const perpAngle = angle + Math.PI / 2
                pts.push([
                  scales.cx +
                    r * Math.cos(angle) +
                    dodgeOff * Math.cos(perpAngle),
                  scales.cy +
                    r * Math.sin(angle) +
                    dodgeOff * Math.sin(perpAngle),
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

          // After morph completes, do a full redraw of lines and range band
          setTimeout(() => {
            if (!svgRef.current || !scalesRef.current) return
            const postSvg = select(svgRef.current)
            const postScales = scalesRef.current

            // Rebuild polygon lines from current dot positions
            const postPathLayer = postSvg.select<SVGGElement>(
              "g.scenario-paths",
            )
            if (!postPathLayer.empty()) {
              postPathLayer.selectAll("*").remove()
              const postDotPositions = new Map<
                string,
                { x: number; y: number }[]
              >()
              postSvg
                .selectAll<SVGCircleElement, unknown>("circle.radar-dot")
                .each(function () {
                  const el = select(this)
                  const sid = el.attr("data-scenario-id") ?? ""
                  const dotCx = parseFloat(el.attr("cx") ?? "0")
                  const dotCy = parseFloat(el.attr("cy") ?? "0")
                  if (!postDotPositions.has(sid))
                    postDotPositions.set(sid, [])
                  postDotPositions.get(sid)!.push({ x: dotCx, y: dotCy })
                })
              data.forEach((scenario, si) => {
                const pts = postDotPositions.get(scenario.id)
                if (!pts || pts.length < 3) return
                const color = lineColors.length > 0
                  ? lineColors[si] || colors.default
                  : colors.default
                const pathGen = line<{ x: number; y: number }>()
                  .x((d) => d.x)
                  .y((d) => d.y)
                const isPinned = pinnedScenarioIds.has(scenario.id)
                const isHighlighted =
                  highlightedIds && highlightedIds.has(scenario.id)
                const isBackground =
                  showAllPaths && !isPinned && !isHighlighted
                const dimmed = dimUnpinned && morphHasPinned && !isPinned
                let strokeOp = isBackground ? 0.55 : 1.0
                if (dimmed) strokeOp = 0.07
                postPathLayer
                  .append("path")
                  .attr("data-path-id", scenario.id)
                  .attr("d", pathGen([...pts, pts[0]!]) ?? "")
                  .attr("fill", "none")
                  .attr("stroke", color)
                  .attr("stroke-width", isBackground ? 1.5 : 3)
                  .attr("stroke-opacity", strokeOp)
                  .attr("stroke-linejoin", "round")
                  .attr("pointer-events", "none")
              })
            }

            // Rebuild range band from final dot positions
            const dotR2 =
              data.length > 15 ? 3.5 : data.length > 8 ? 4.5 : 5.5
            if (axisRange && Object.keys(axisRange).length > 0) {
              const spokeInfo: {
                angle: number
                maxR: number
                minR: number
                outerHalf: number
                innerHalf: number
              }[] = []
              axes.forEach((axis, axisIdx) => {
                const angle = getAngle(axisIdx)
                let maxR = -Infinity
                let minR = Infinity
                let maxDodge = 0
                data.forEach((scenario) => {
                  const sv = scenario.values[axis]
                  if (sv == null) return
                  const r = postScales.rScale(toTier(sv))
                  if (r > maxR) maxR = r
                  if (r < minR) minR = r
                  const el = postSvg.select(
                    `circle[data-axis="${axis}"][data-scenario-id="${scenario.id}"]`,
                  )
                  const d = Math.abs(
                    parseFloat(el.attr("data-dodge") ?? "0"),
                  )
                  if (d > maxDodge) maxDodge = d
                })
                if (maxR === -Infinity) return
                const spread = (maxDodge + dotR2) * 0.5
                spokeInfo.push({
                  angle,
                  maxR,
                  minR,
                  outerHalf: maxR > 0 ? Math.atan2(spread, maxR) : 0,
                  innerHalf: minR > 0 ? Math.atan2(spread, minR) : 0,
                })
              })
              if (spokeInfo.length >= 3) {
                let outerD = ""
                spokeInfo.forEach((s, i) => {
                  const sa = s.angle - s.outerHalf
                  const ea = s.angle + s.outerHalf
                  const sx = postScales.cx + s.maxR * Math.cos(sa)
                  const sy = postScales.cy + s.maxR * Math.sin(sa)
                  const ex = postScales.cx + s.maxR * Math.cos(ea)
                  const ey = postScales.cy + s.maxR * Math.sin(ea)
                  outerD += i === 0 ? `M${sx},${sy}` : ` L${sx},${sy}`
                  outerD += ` A${s.maxR},${s.maxR} 0 0 1 ${ex},${ey}`
                })
                outerD += " Z"
                let innerD = ""
                const revSpokes = [...spokeInfo].reverse()
                revSpokes.forEach((s, i) => {
                  const sa = s.angle + s.innerHalf
                  const ea = s.angle - s.innerHalf
                  const sx = postScales.cx + s.minR * Math.cos(sa)
                  const sy = postScales.cy + s.minR * Math.sin(sa)
                  const ex = postScales.cx + s.minR * Math.cos(ea)
                  const ey = postScales.cy + s.minR * Math.sin(ea)
                  innerD += i === 0 ? `M${sx},${sy}` : ` L${sx},${sy}`
                  innerD += ` A${s.minR},${s.minR} 0 0 0 ${ex},${ey}`
                })
                innerD += " Z"
                const newRangeSel = postSvg.select<SVGPathElement>(
                  "path.range-shadow",
                )
                if (!newRangeSel.empty()) {
                  newRangeSel
                    .attr("d", `${outerD} ${innerD}`)
                    .transition()
                    .duration(HC_DUR * 0.4)
                    .attr("fill-opacity", 0.35)
                    .attr("stroke-opacity", 0.5)
                }
              }
            }

            if (morphHasPinned) {
              const postDotsLayer = postSvg.select<SVGGElement>("g.dots")
              if (!postDotsLayer.empty()) {
                postDotsLayer
                  .selectAll<SVGCircleElement, unknown>("circle.radar-dot")
                  .each(function () {
                    const sid =
                      this.getAttribute("data-scenario-id") ?? ""
                    if (!pinnedScenarioIds.has(sid)) return
                    select(this)
                      .attr("r", dotR2 + 3)
                      .attr("fill-opacity", 1)
                  })
              }
            }
          }, HC_DUR + 50)

          return
        }
        shouldMorphNextRef.current = false

        // ── Full rebuild ──
        const svg = select(svgRef.current)
        svg.selectAll("*").remove()
        if (w <= 0 || h <= 0) return

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
        const dotR = 4

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
            .attr("stroke", "#dce3ea")
            .attr("stroke-width", 1)
        })

        axes.forEach((_, i) => {
          const angle = getAngle(i)
          const outerR = rScale(0.5)
          g.append("line")
            .attr("x1", cx)
            .attr("y1", cy)
            .attr("x2", cx + outerR * Math.cos(angle))
            .attr("y2", cy + outerR * Math.sin(angle))
            .attr("stroke", "#dce3ea")
            .attr("stroke-width", 1)
        })

        // Tier labels along the first spoke (top)
        TIER_POSITIONS.forEach((t, i) => {
          const r = rScale(t)
          g.append("text")
            .attr("x", cx + 6)
            .attr("y", cy - r - 3)
            .attr("font-size", 9.5)
            .attr("font-family", FONT_FAMILY)
            .attr("font-weight", 500)
            .attr("fill", "#a0aec0")
            .attr("letter-spacing", "0.02em")
            .text(TIER_LABELS[i] ?? "")
        })

        // Range band placeholder — drawn after dots so we can use actual positions
        const rangeBandLayer = g
          .insert("g", "g.ghost-baselines")
          .attr("class", "range-band")

        // Capture baseline positions for ghost trace
        const baselineRadii = new Map<string, number>()
        if (baselineData) {
          axes.forEach((axis) => {
            const bv = baselineData.values[axis]
            if (bv == null) return
            baselineRadii.set(axis, rScale(toTier(bv)))
          })
        }
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
            const blIdx = data.findIndex((s) => s.id === baselineData.id)
            const blStroke =
              blIdx >= 0 && hasScenarioColors
                ? lineColors[blIdx] || "#cc9a06"
                : "#cc9a06"
            baselineHighlightLayer
              .append("path")
              .attr("class", "baseline-polygon")
              .attr("d", pathGen([...blPts, blPts[0]!]) ?? "")
              .attr("fill", "#cc9a06")
              .attr("fill-opacity", 0.12)
              .attr("stroke", blStroke)
              .attr("stroke-width", 2.5)
              .attr("stroke-opacity", 0.55)
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
          if (showDotsOnly) return
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
          let strokeOp = isBackground ? 0.55 : 1.0
          if (dimmed) strokeOp = 0.07
          pathLayer
            .append("path")
            .attr("data-path-id", scenarioId)
            .attr("d", pathGen([...pts, pts[0]!]) ?? "")
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", isBackground ? 1.5 : 3)
            .attr("stroke-opacity", strokeOp)
            .attr("stroke-linejoin", "round")
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
          pathLayer
            .selectAll<SVGPathElement, unknown>("path[data-path-id]")
            .each(function () {
              const el = select(this)
              const sid = el.attr("data-path-id")
              const isFocus = sid === focusId
              const isPin = pinnedScenarioIds.has(sid ?? "")
              el.attr("stroke-width", isFocus ? 3.5 : isPin ? 3 : 1.5)
                .attr("stroke-opacity", isFocus || isPin ? 1.0 : 0.07)
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
                .attr("stroke-opacity", op)
                .attr("r", isPinned ? dotR + 3 : dotR)
            })
          pathLayer
            .selectAll<SVGPathElement, unknown>("path[data-path-id]")
            .each(function () {
              const el = select(this)
              const sid = el.attr("data-path-id")
              const isPinned = pinnedScenarioIds.has(sid ?? "")
              const isHighlighted =
                highlightedIds && highlightedIds.has(sid ?? "")
              const isBackground = showAllPaths && !isPinned && !isHighlighted
              const dimmed = dimUnpinned && hasPinned && !isPinned
              let strokeOp = isBackground ? 0.55 : 1.0
              if (dimmed) strokeOp = 0.07
              el.attr("stroke-width", isBackground ? 1.5 : 3)
                .attr("stroke-opacity", strokeOp)
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
              .attr("stroke", "#fff")
              .attr("stroke-width", 1)
              .attr("stroke-opacity", opacity)
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

                drawPolygonForScenario(scenario.id)

                if (hoverNotifyTimerRef.current !== null) {
                  clearTimeout(hoverNotifyTimerRef.current)
                  hoverNotifyTimerRef.current = null
                }

                const el = tooltipRef.current
                if (el) {
                  showTooltip(
                    el,
                    scenario.name,
                    axis,
                    sv != null ? toTier(sv) : undefined,
                    scenarioThemes?.[scenario.id],
                  )
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
                pathLayer.selectAll("*").remove()
                data.forEach((s) => drawPolygonForScenario(s.id))
                if (hasPinned) {
                  boostPinnedDots(pinnedScenarioIds)
                }
                if (tooltipRef.current) hideTooltip(tooltipRef.current)
                lastNotifiedIdRef.current = null
                onLineHoverRef.current?.(null)
              })
              .on("click", () => {
                onPinnedToggleRef.current?.(scenario.id)
                onLineClickRef.current?.(scenario)
                onDotClickRef.current?.(scenario.id, axis)
              })
          })
        })

        // Range band: arcs along polar circles at each spoke to cover dodge
        if (axisRange && Object.keys(axisRange).length > 0) {
          const spokeInfo: {
            angle: number
            maxR: number
            minR: number
            outerHalf: number
            innerHalf: number
          }[] = []
          axes.forEach((axis, axisIdx) => {
            const angle = getAngle(axisIdx)
            let maxR = -Infinity
            let minR = Infinity
            let maxDodge = 0
            data.forEach((scenario) => {
              const sv = scenario.values[axis]
              if (sv == null) return
              const r = rScale(toTier(sv))
              if (r > maxR) maxR = r
              if (r < minR) minR = r
              const d = Math.abs(
                dodgeMap.get(`${axis}:${scenario.id}`) ?? 0,
              )
              if (d > maxDodge) maxDodge = d
            })
            if (maxR === -Infinity) return
            const spread = (maxDodge + dotR) * 0.5
            spokeInfo.push({
              angle,
              maxR,
              minR,
              outerHalf: maxR > 0 ? Math.atan2(spread, maxR) : 0,
              innerHalf: minR > 0 ? Math.atan2(spread, minR) : 0,
            })
          })

          if (spokeInfo.length >= 3) {
            let outerD = ""
            spokeInfo.forEach((s, i) => {
              const sa = s.angle - s.outerHalf
              const ea = s.angle + s.outerHalf
              const sx = cx + s.maxR * Math.cos(sa)
              const sy = cy + s.maxR * Math.sin(sa)
              const ex = cx + s.maxR * Math.cos(ea)
              const ey = cy + s.maxR * Math.sin(ea)
              outerD += i === 0 ? `M${sx},${sy}` : ` L${sx},${sy}`
              outerD += ` A${s.maxR},${s.maxR} 0 0 1 ${ex},${ey}`
            })
            outerD += " Z"

            let innerD = ""
            const rev = [...spokeInfo].reverse()
            rev.forEach((s, i) => {
              const sa = s.angle + s.innerHalf
              const ea = s.angle - s.innerHalf
              const sx = cx + s.minR * Math.cos(sa)
              const sy = cy + s.minR * Math.sin(sa)
              const ex = cx + s.minR * Math.cos(ea)
              const ey = cy + s.minR * Math.sin(ea)
              innerD += i === 0 ? `M${sx},${sy}` : ` L${sx},${sy}`
              innerD += ` A${s.minR},${s.minR} 0 0 0 ${ex},${ey}`
            })
            innerD += " Z"

            rangeBandLayer
              .append("path")
              .attr("class", "range-shadow")
              .attr("d", `${outerD} ${innerD}`)
              .attr("fill", "#cbd5e0")
              .attr("fill-opacity", 0.35)
              .attr("stroke", "#a0aec0")
              .attr("stroke-width", 0.8)
              .attr("stroke-opacity", 0.5)
              .attr("fill-rule", "evenodd")
              .attr("pointer-events", "none")
          }
        }

        // Always draw all scenario polygons so dots never appear without lines
        data.forEach((scenario) => {
          drawPolygonForScenario(scenario.id)
        })

        if (hasPinned) {
          boostPinnedDots(pinnedScenarioIds)
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
              .attr("y", ly - 8)
              .attr("text-anchor", anchor)
              .attr("dominant-baseline", "middle")
              .attr("font-size", 12.5)
              .attr("font-family", FONT_FAMILY)
              .attr("font-weight", 500)
              .attr("fill", "#4a5568")
              .attr("letter-spacing", "0.01em")
              .text(curated[0])
            g.append("text")
              .attr("x", lx)
              .attr("y", ly + 8)
              .attr("text-anchor", anchor)
              .attr("dominant-baseline", "middle")
              .attr("font-size", 12.5)
              .attr("font-family", FONT_FAMILY)
              .attr("font-weight", 500)
              .attr("fill", "#4a5568")
              .attr("letter-spacing", "0.01em")
              .text(curated[1])
          } else {
            g.append("text")
              .attr("x", lx)
              .attr("y", ly)
              .attr("text-anchor", anchor)
              .attr("dominant-baseline", "middle")
              .attr("font-size", 12.5)
              .attr("font-family", FONT_FAMILY)
              .attr("font-weight", 500)
              .attr("fill", "#4a5568")
              .attr("letter-spacing", "0.01em")
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
        showAllPaths,
        showDotsOnly,
        showTierZones,
        pinnedScenarioIds,
        dimUnpinned,
        axisRange,
        scenarioThemes,
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

    // Imperatively manage the active-map-dot highlight ring without
    // triggering a full SVG rebuild when the active outcome changes.
    useEffect(() => {
      const svg = select(svgRef.current)
      svg.selectAll(".active-map-ring, .active-map-glow").remove()

      if (!activeMapDot) return

      const dotsLayer = svg.select("g.dots")
      if (dotsLayer.empty()) return

      dotsLayer
        .selectAll<SVGCircleElement, unknown>("circle.radar-dot")
        .each(function () {
          const el = select(this)
          const sid = el.attr("data-scenario-id")
          const axisName = el.attr("data-axis")
          if (
            sid === activeMapDot.scenarioId &&
            axisName === activeMapDot.axis
          ) {
            const dotCx = parseFloat(el.attr("cx"))
            const dotCy = parseFloat(el.attr("cy"))
            const fill = el.attr("fill") ?? colors.default
            const baseR = 4
            dotsLayer
              .insert("circle", ":first-child")
              .attr("class", "active-map-glow")
              .attr("cx", dotCx)
              .attr("cy", dotCy)
              .attr("r", baseR + 8)
              .attr("fill", fill)
              .attr("fill-opacity", 0.12)
              .attr("pointer-events", "none")
            dotsLayer
              .insert("circle", "circle.radar-dot")
              .attr("class", "active-map-ring")
              .attr("cx", dotCx)
              .attr("cy", dotCy)
              .attr("r", baseR + 6)
              .attr("fill", "none")
              .attr("stroke", fill)
              .attr("stroke-width", 2.5)
              .attr("stroke-opacity", 0.7)
              .attr("pointer-events", "none")
            el.attr("r", baseR + 2).raise()
          }
        })
    }, [activeMapDot, colors.default, data.length])

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
            top: 12,
            left: 12,
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
          }}
        />
      </div>
    )
  },
)

RadarPlot.displayName = "RadarPlot"

export default RadarPlot
