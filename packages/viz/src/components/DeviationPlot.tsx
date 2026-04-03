"use client"

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react"
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
  showBaselineStaircase?: boolean
  showScenarioPath?: boolean
  showAllPaths?: boolean
  showTierZones?: boolean
  showDifferenceGlyphs?: boolean
  showThemeRings?: boolean
  scenarioThemeRingColors?: Record<string, string>
  comparisonData?: VerticalParallelLineData[]
  comparisonBaselineData?: VerticalParallelLineData
  comparisonLabel?: string
  climateMode?: "off" | "morph" | "compare"
  morphShowComparison?: boolean
  /** Map of scenario ID to theme/group string.used to cluster same-theme dots together */
  scenarioThemes?: Record<string, string>
  /** Monotonically increasing counter.triggers morph transitions instead of full rebuild */
  morphGeneration?: number
  pinnedScenarioIds?: Set<string>
  onPinnedToggle?: (scenarioId: string) => void
  dimUnpinned?: boolean
  showDistribution?: boolean
  distributionData?: Record<
    string,
    Record<string, { tier: number; count: number; normalized: number }[]>
  >
  showHCRange?: boolean
  hcRangeData?: Record<string, Record<string, { min: number; max: number }>>
  showBaselineFill?: boolean
}

function toTier(v: number): number {
  return 4 - (v + 1) * 1.5
}

const TIER_POSITIONS = [1, 2, 3, 4] as const
const TIER_LABELS = ["Tier 1", "Tier 2", "Tier 3", "Tier 4"] as const
const TIER_BAND_COLORS = ["#edf2f7", "#ffffff", "#edf2f7", "#ffffff"] as const
const MARGIN = { top: 28, right: 12, bottom: 48, left: 52 }

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

const DEFAULT_COLORS = {
  default: "#546e7a",
  highlighted: "#1a3a5c",
  background: "#ffffff",
}
const DEFAULT_LINE_COLORS: string[] = []
const HOVER_NOTIFY_MS = 80

const FONT_FAMILY =
  '"neue-haas-grotesk-text", Roboto, Helvetica, Arial, sans-serif'

function computeColumnDodge(
  entries: { id: string; y: number }[],
  dotDiam: number,
  halfSpread: number,
  themeMap?: Record<string, string>,
): Map<string, number> {
  const result = new Map<string, number>()
  if (entries.length === 0) return result
  if (entries.length === 1) {
    result.set(entries[0]!.id, 0)
    return result
  }

  const minDist = dotDiam + 1

  // Detect distinct tier values
  const tierSet = new Set(entries.map((e) => e.y))
  const isSingleTier = tierSet.size === 1

  if (isSingleTier) {
    // All dots share the same tier.use a clean centered horizontal line
    // with even spacing, compressing if needed to stay within halfSpread.
    // Sort by theme so same-theme dots cluster together.
    const ordered = themeMap
      ? [...entries].sort((a, b) => {
          const ta = themeMap[a.id] ?? ""
          const tb = themeMap[b.id] ?? ""
          return ta.localeCompare(tb)
        })
      : entries
    const n = ordered.length
    const totalIdeal = (n - 1) * minDist
    const step =
      totalIdeal <= halfSpread * 2 ? minDist : (halfSpread * 2) / (n - 1)
    const startX = -((n - 1) * step) / 2
    ordered.forEach((entry, i) => {
      result.set(entry.id, startX + i * step)
    })
    return result
  }

  // Multiple tiers.greedy center-first placement with 2D collision.
  // Process largest same-tier groups first so they claim center positions.
  const tierMap = new Map<number, { id: string; y: number }[]>()
  for (const e of entries) {
    if (!tierMap.has(e.y)) tierMap.set(e.y, [])
    tierMap.get(e.y)!.push(e)
  }
  const processingOrder = [...tierMap.values()]
    .sort((a, b) => b.length - a.length)
    .flat()

  const placed: { y: number; x: number }[] = []

  for (const entry of processingOrder) {
    let bestX = 0

    if (placed.length === 0) {
      placed.push({ y: entry.y, x: 0 })
      result.set(entry.id, 0)
      continue
    }

    // Try x=0 first, then expand outward
    let found = false
    for (let dist = 0; dist <= halfSpread; dist += minDist * 0.5) {
      const candidates = dist === 0 ? [0] : [dist, -dist]
      for (const cx of candidates) {
        if (Math.abs(cx) > halfSpread) continue
        let overlaps = false
        for (const p of placed) {
          if (
            Math.abs(cx - p.x) < minDist &&
            Math.abs(entry.y - p.y) < minDist
          ) {
            overlaps = true
            break
          }
        }
        if (!overlaps) {
          bestX = cx
          found = true
          break
        }
      }
      if (found) break
    }

    // Fallback: pick position with least overlap within halfSpread
    if (!found) {
      let minOverlapAmt = Infinity
      for (let dist = 0; dist <= halfSpread; dist += minDist * 0.25) {
        const candidates = dist === 0 ? [0] : [dist, -dist]
        for (const cx of candidates) {
          let maxOverlap = 0
          for (const p of placed) {
            if (Math.abs(entry.y - p.y) < minDist) {
              const overlap = minDist - Math.abs(cx - p.x)
              if (overlap > maxOverlap) maxOverlap = overlap
            }
          }
          if (maxOverlap < minOverlapAmt) {
            minOverlapAmt = maxOverlap
            bestX = cx
          }
        }
      }
    }

    placed.push({ y: entry.y, x: bestX })
    result.set(entry.id, bestX)
  }

  return result
}

/** Imperatively show the tooltip DOM element.no React state updates. */
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
    highlightedIds,
    showBaselineStaircase = true,
    showScenarioPath = true,
    showAllPaths = false,
    showTierZones = true,
    showDifferenceGlyphs = false,
    showThemeRings = false,
    scenarioThemeRingColors = undefined,
    comparisonData,
    comparisonBaselineData,
    climateMode = "off",
    morphShowComparison = false,
    scenarioThemes,
    morphGeneration,
    pinnedScenarioIds: pinnedScenarioIdsProp,
    onPinnedToggle,
    dimUnpinned = false,
    showDistribution = false,
    distributionData,
    showHCRange = false,
    hcRangeData,
    showBaselineFill = true,
  }) => {
    const pinnedScenarioIds = useMemo(
      () => pinnedScenarioIdsProp ?? new Set<string>(),
      [pinnedScenarioIdsProp],
    )
    const svgRef = useRef<SVGSVGElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const tooltipRef = useRef<HTMLDivElement>(null)
    const hasAnimatedRef = useRef(false)
    const prevMorphValRef = useRef(morphShowComparison)
    const scalesRef = useRef<{
      yScale: (n: number) => number
      xScale: (s: string) => number | undefined
      bandW: number
      innerH: number
    } | null>(null)
    const morphShowCompRef = useRef(morphShowComparison)
    const lastNotifiedIdRef = useRef<string | null>(null)
    const hoverNotifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    )
    const dimensions = useResizeObserver(
      containerRef as React.RefObject<HTMLElement>,
    )
    const [currentWidth, setCurrentWidth] = useState(width)
    const [currentHeight, setCurrentHeight] = useState(height)

    // Store the initial (historical) baseline Y positions so we can show a ghost
    const initialBaselineRef = useRef<Map<string, number> | null>(null)
    // Track whether we've ever morphed away from the initial hydroclimate
    const hasMorphedRef = useRef(false)

    // Hydroclimate morph detection
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

    useEffect(() => {
      if (responsive && dimensions.width > 0 && dimensions.height > 0) {
        setCurrentWidth(dimensions.width)
        setCurrentHeight(dimensions.height)
      } else if (!responsive) {
        setCurrentWidth(width)
        setCurrentHeight(height)
      }
    }, [dimensions, responsive, width, height])

    useEffect(() => {
      morphShowCompRef.current = morphShowComparison
    }, [morphShowComparison])

    useEffect(() => {
      return () => {
        if (hoverNotifyTimerRef.current !== null) {
          clearTimeout(hoverNotifyTimerRef.current)
        }
      }
    }, [])

    const updateChart = useCallback(
      (w: number, h: number) => {
        if (hoverNotifyTimerRef.current !== null) {
          clearTimeout(hoverNotifyTimerRef.current)
          hoverNotifyTimerRef.current = null
        }
        if (tooltipRef.current) hideTooltip(tooltipRef.current)

        // ── Morph: transition existing elements instead of rebuild ────
        const morphToggled = morphShowComparison !== prevMorphValRef.current
        prevMorphValRef.current = morphShowComparison
        if (
          morphToggled &&
          climateMode === "morph" &&
          scalesRef.current &&
          comparisonData?.length &&
          comparisonBaselineData &&
          baselineData
        ) {
          const scales = scalesRef.current
          const targetData = morphShowComparison ? comparisonData : data
          const targetBaseline = morphShowComparison
            ? comparisonBaselineData
            : baselineData
          const dataMap = new Map(targetData.map((s) => [s.id, s]))
          const svg = select(svgRef.current)
          const MORPH_DUR = 600

          svg
            .selectAll<
              SVGCircleElement,
              unknown
            >("circle[data-axis]:not(.theme-ring)")
            .each(function () {
              const el = select(this)
              const sid = el.attr("data-scenario-id")
              const axis = el.attr("data-axis")
              if (!sid || !axis) return
              const scenario = dataMap.get(sid)
              if (!scenario) {
                el.transition().duration(MORPH_DUR).attr("fill-opacity", 0)
                return
              }
              const sv = scenario.values[axis]
              if (sv == null) {
                el.transition().duration(MORPH_DUR).attr("fill-opacity", 0)
                return
              }
              el.transition()
                .duration(MORPH_DUR)
                .attr("cy", scales.yScale(toTier(sv)))
            })

          svg
            .selectAll<
              SVGCircleElement,
              unknown
            >("circle.theme-ring[data-axis]")
            .each(function () {
              const el = select(this)
              const sid = el.attr("data-scenario-id")
              const axis = el.attr("data-axis")
              if (!sid || !axis) return
              const scenario = dataMap.get(sid)
              if (!scenario) return
              const sv = scenario.values[axis]
              if (sv == null) return
              el.transition()
                .duration(MORPH_DUR)
                .attr("cy", scales.yScale(toTier(sv)))
            })

          svg
            .selectAll<SVGLineElement, unknown>("line.baseline-mark")
            .each(function () {
              const el = select(this)
              const axis = el.attr("data-axis")
              if (!axis) return
              const bv = targetBaseline.values[axis]
              if (bv == null) return
              const newY = scales.yScale(toTier(bv))
              const halfTick = parseFloat(el.attr("data-half-tick") ?? "0")
              el.transition()
                .duration(MORPH_DUR)
                .attr("y1", newY - halfTick)
                .attr("y2", newY + halfTick)
            })

          svg
            .selectAll<SVGLineElement, unknown>("line.diff-glyph")
            .each(function () {
              const el = select(this)
              const sid = el.attr("data-scenario-id")
              const axis = el.attr("data-axis")
              if (!sid || !axis) return
              const bv = targetBaseline.values[axis]
              const scenario = dataMap.get(sid)
              const sv = scenario?.values[axis]
              if (bv == null || sv == null) return
              el.transition()
                .duration(MORPH_DUR)
                .attr("y1", scales.yScale(toTier(bv)))
                .attr("y2", scales.yScale(toTier(sv)))
            })

          if (showBaselineStaircase) {
            const newPts: [number, number][] = []
            axes.forEach((axis) => {
              const bv = targetBaseline.values[axis]
              if (bv == null) return
              const cx = (scales.xScale(axis) ?? 0) + scales.bandW / 2
              newPts.push([cx, scales.yScale(toTier(bv))])
            })
            if (newPts.length >= 2) {
              const stairLine = line<[number, number]>()
                .x((d) => d[0])
                .y((d) => d[1])
              svg
                .select<SVGPathElement>("path.staircase")
                .transition()
                .duration(MORPH_DUR)
                .attr("d", stairLine(newPts) ?? "")
            }
          }

          svg
            .selectAll<SVGPathElement, unknown>("path[data-path-id]")
            .each(function () {
              const el = select(this)
              const sid = el.attr("data-path-id")
              if (!sid) return
              const scenario = dataMap.get(sid)
              if (!scenario) return
              const pts: [number, number][] = []
              axes.forEach((axis) => {
                const sv = scenario.values[axis]
                if (sv == null) return
                const dotEl = svg.select<SVGCircleElement>(
                  `circle[data-scenario-id="${sid}"][data-axis="${axis}"]:not(.theme-ring)`,
                )
                const cx = dotEl.empty()
                  ? (scales.xScale(axis) ?? 0) + scales.bandW / 2
                  : parseFloat(dotEl.attr("cx"))
                pts.push([cx, scales.yScale(toTier(sv))])
              })
              if (pts.length >= 2) {
                const pathGen = line<[number, number]>()
                  .x((d) => d[0])
                  .y((d) => d[1])
                el.transition()
                  .duration(MORPH_DUR)
                  .attr("d", pathGen(pts) ?? "")
              }
            })

          return
        }

        // ── Hydroclimate morph: transition dots/baselines to new values ──
        if (shouldMorphNextRef.current && scalesRef.current && baselineData) {
          shouldMorphNextRef.current = false
          hasMorphedRef.current = true
          const scales = scalesRef.current
          const dataMap = new Map(data.map((s) => [s.id, s]))
          const svg = select(svgRef.current)
          const HC_DUR = 600

          // Show/hide ghost baseline trace
          if (initialBaselineRef.current) {
            const ghostPositionsStored = initialBaselineRef.current
            let isBackToInitial = true
            axes.forEach((axis) => {
              const storedY = ghostPositionsStored.get(axis)
              const bv = baselineData.values[axis]
              if (storedY == null || bv == null) return
              const newY = scales.yScale(toTier(bv))
              if (Math.abs(newY - storedY) > 1) isBackToInitial = false
            })

            const ghostSel = svg.select("g.ghost-baselines")
            if (isBackToInitial && !ghostSel.empty()) {
              ghostSel
                .selectAll("line")
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
                    .insert("g", "g.baselines")
                    .attr("class", "ghost-baselines")
                : ghostSel
              const ghostPositions = initialBaselineRef.current
              axes.forEach((axis) => {
                const ghostY = ghostPositions.get(axis)
                if (ghostY == null) return
                const colX = scales.xScale(axis) ?? 0
                const bw = scales.bandW
                const cx = colX + bw / 2
                const bracketHalfW = bw * 0.45
                const edgeL = cx - bracketHalfW
                const edgeR = cx + bracketHalfW
                gHost
                  .append("line")
                  .attr("class", "ghost-baseline")
                  .attr("data-axis", axis)
                  .attr("x1", edgeL)
                  .attr("y1", ghostY)
                  .attr("x2", edgeR)
                  .attr("y2", ghostY)
                  .attr("stroke", "#2d3748")
                  .attr("stroke-width", 2)
                  .attr("stroke-dasharray", "6,4")
                  .attr("stroke-linecap", "square")
                  .attr("opacity", 0)
                  .attr("pointer-events", "none")
                  .transition()
                  .duration(HC_DUR)
                  .attr("opacity", 0.55)
                ;[edgeL, edgeR].forEach((ex) => {
                  gHost
                    .append("line")
                    .attr("class", "ghost-baseline")
                    .attr("data-axis", axis)
                    .attr("x1", ex)
                    .attr("y1", ghostY - 5)
                    .attr("x2", ex)
                    .attr("y2", ghostY + 5)
                    .attr("stroke", "#2d3748")
                    .attr("stroke-width", 2)
                    .attr("stroke-dasharray", "6,4")
                    .attr("stroke-linecap", "round")
                    .attr("opacity", 0)
                    .attr("pointer-events", "none")
                    .transition()
                    .duration(HC_DUR)
                    .attr("opacity", 0.55)
                })
              })
            }
          }

          const morphHasPinned = pinnedScenarioIds.size > 0
          svg
            .selectAll<
              SVGCircleElement,
              unknown
            >("circle[data-axis]:not(.theme-ring)")
            .each(function () {
              const el = select(this)
              const sid = el.attr("data-scenario-id")
              const axis = el.attr("data-axis")
              if (!sid || !axis) return
              const scenario = dataMap.get(sid)
              if (!scenario) {
                el.transition().duration(HC_DUR).attr("fill-opacity", 0)
                return
              }
              const sv = scenario.values[axis]
              if (sv == null) {
                el.transition().duration(HC_DUR).attr("fill-opacity", 0)
                return
              }
              const restoreOp =
                dimUnpinned && morphHasPinned && !pinnedScenarioIds.has(sid)
                  ? 0.1
                  : 1.0
              el.transition()
                .duration(HC_DUR)
                .attr("cy", scales.yScale(toTier(sv)))
                .attr("fill-opacity", restoreOp)
                .attr("stroke-opacity", Math.min(restoreOp + 0.1, 1))
            })

          svg
            .selectAll<
              SVGCircleElement,
              unknown
            >("circle.theme-ring[data-axis]")
            .each(function () {
              const el = select(this)
              const sid = el.attr("data-scenario-id")
              const axis = el.attr("data-axis")
              if (!sid || !axis) return
              const scenario = dataMap.get(sid)
              if (!scenario) {
                el.transition().duration(HC_DUR).attr("opacity", 0)
                return
              }
              const sv = scenario.values[axis]
              if (sv == null) {
                el.transition().duration(HC_DUR).attr("opacity", 0)
                return
              }
              el.transition()
                .duration(HC_DUR)
                .attr("cy", scales.yScale(toTier(sv)))
                .attr("opacity", 0.85)
            })

          svg
            .selectAll<SVGLineElement, unknown>("line.baseline-mark")
            .each(function () {
              const el = select(this)
              const axis = el.attr("data-axis")
              if (!axis) return
              const bv = baselineData.values[axis]
              if (bv == null) {
                el.transition().duration(HC_DUR).attr("opacity", 0)
                return
              }
              const tag = el.attr("data-tag")
              const origOpacity = tag === "comp" ? 0.5 : 0.7
              const newY = scales.yScale(toTier(bv))
              const halfTick = parseFloat(el.attr("data-half-tick") ?? "0")
              el.transition()
                .duration(HC_DUR)
                .attr("y1", newY - halfTick)
                .attr("y2", newY + halfTick)
                .attr("opacity", origOpacity)
            })

          svg
            .selectAll<SVGLineElement, unknown>("line.diff-glyph")
            .each(function () {
              const el = select(this)
              const sid = el.attr("data-scenario-id")
              const axis = el.attr("data-axis")
              if (!sid || !axis) return
              const bv = baselineData.values[axis]
              const scenario = dataMap.get(sid)
              const sv = scenario?.values[axis]
              if (bv == null || sv == null) {
                el.transition().duration(HC_DUR).attr("opacity", 0)
                return
              }
              el.transition()
                .duration(HC_DUR)
                .attr("y1", scales.yScale(toTier(bv)))
                .attr("y2", scales.yScale(toTier(sv)))
                .attr("opacity", 1)
            })

          if (showBaselineStaircase) {
            const newPts: [number, number][] = []
            axes.forEach((axis) => {
              const bv = baselineData.values[axis]
              if (bv == null) return
              const cx = (scales.xScale(axis) ?? 0) + scales.bandW / 2
              newPts.push([cx, scales.yScale(toTier(bv))])
            })
            if (newPts.length >= 2) {
              const stairLine = line<[number, number]>()
                .x((d) => d[0])
                .y((d) => d[1])
              svg
                .select<SVGPathElement>("path.staircase")
                .transition()
                .duration(HC_DUR)
                .attr("d", stairLine(newPts) ?? "")
            }
          }

          svg
            .selectAll<SVGPathElement, unknown>("path[data-path-id]")
            .each(function () {
              const el = select(this)
              const sid = el.attr("data-path-id")
              if (!sid) return
              const scenario = dataMap.get(sid)
              if (!scenario) return
              const pts: [number, number][] = []
              axes.forEach((axis) => {
                const sv = scenario.values[axis]
                if (sv == null) return
                const dotEl = svg.select<SVGCircleElement>(
                  `circle[data-scenario-id="${sid}"][data-axis="${axis}"]:not(.theme-ring)`,
                )
                const cx = dotEl.empty()
                  ? (scales.xScale(axis) ?? 0) + scales.bandW / 2
                  : parseFloat(dotEl.attr("cx"))
                pts.push([cx, scales.yScale(toTier(sv))])
              })
              if (pts.length >= 2) {
                const pathGen = line<[number, number]>()
                  .x((d) => d[0])
                  .y((d) => d[1])
                el.transition()
                  .duration(HC_DUR)
                  .attr("d", pathGen(pts) ?? "")
              }
            })

          return
        }
        shouldMorphNextRef.current = false

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
          .padding(0.18)

        const yScale = scaleLinear().domain([0.5, 4.5]).range([0, innerH])
        const bandW = xScale.bandwidth()

        scalesRef.current = {
          yScale: (n: number) => yScale(n),
          xScale: (s: string) => xScale(s),
          bandW,
          innerH,
        }

        const isMorph =
          climateMode === "morph" &&
          !!comparisonData?.length &&
          !!comparisonBaselineData
        const isCompare =
          climateMode === "compare" &&
          !!comparisonData?.length &&
          !!comparisonBaselineData

        const activeData =
          isMorph && morphShowCompRef.current ? comparisonData! : data
        const activeBaseline =
          isMorph && morphShowCompRef.current
            ? comparisonBaselineData!
            : baselineData

        const SUB_RATIO = 0.42
        const subW = isCompare ? bandW * SUB_RATIO : bandW
        const subGap = isCompare ? bandW * (1 - 2 * SUB_RATIO) : 0
        const compXOff = subW + subGap
        const effectiveJitter = (isCompare ? subW : bandW) * 0.45
        const effectiveDotR = isCompare
          ? data.length > 15
            ? 3.5
            : data.length > 8
              ? 4.5
              : 5.5
          : data.length > 15
            ? 3.5
            : data.length > 8
              ? 4.5
              : 5.5

        type SubCol = {
          srcData: VerticalParallelLineData[]
          srcBaseline: VerticalParallelLineData
          xOff: number
          w: number
          tag: "hist" | "comp"
          bgTint: string | null
        }
        const subcolumns: SubCol[] = isCompare
          ? [
              {
                srcData: data,
                srcBaseline: baselineData,
                xOff: 0,
                w: subW,
                tag: "hist",
                bgTint: null,
              },
              {
                srcData: comparisonData!,
                srcBaseline: comparisonBaselineData!,
                xOff: compXOff,
                w: subW,
                tag: "comp",
                bgTint: "rgba(50,100,170,0.06)",
              },
            ]
          : [
              {
                srcData: activeData,
                srcBaseline: activeBaseline,
                xOff: 0,
                w: bandW,
                tag: "hist",
                bgTint: null,
              },
            ]

        TIER_POSITIONS.forEach((t, i) => {
          const y0 = yScale(t - 0.5)
          const y1 = yScale(t + 0.5)
          g.append("rect")
            .attr("x", 0)
            .attr("y", y0)
            .attr("width", innerW)
            .attr("height", y1 - y0)
            .attr(
              "fill",
              showTierZones
                ? (TIER_BAND_COLORS[i] ?? "#fff")
                : colors.background,
            )
        })

        TIER_POSITIONS.forEach((t) => {
          g.append("line")
            .attr("x1", 0)
            .attr("y1", yScale(t))
            .attr("x2", innerW)
            .attr("y2", yScale(t))
            .attr("stroke", "#cbd5e0")
            .attr("stroke-width", 1)
        })

        const stepW = xScale.step()
        axes.forEach((axis, idx) => {
          const colX = xScale(axis)!
          if (idx % 2 === 1) {
            const fillX = colX - (stepW - bandW) / 2
            g.append("rect")
              .attr("x", fillX)
              .attr("y", 0)
              .attr("width", stepW)
              .attr("height", innerH)
              .attr("fill", "rgba(0,0,0,0.018)")
              .attr("pointer-events", "none")
          }
        })

        TIER_POSITIONS.forEach((t, i) => {
          g.append("text")
            .attr("x", -10)
            .attr("y", yScale(t))
            .attr("text-anchor", "end")
            .attr("dominant-baseline", "middle")
            .attr("font-size", 12)
            .attr("font-family", FONT_FAMILY)
            .attr("font-weight", 500)
            .attr("fill", "#4a5568")
            .attr("letter-spacing", "0.01em")
            .text(TIER_LABELS[i] ?? "")
        })

        const hasPinned = pinnedScenarioIds.size > 0
        const sidebarHighlightActive =
          !hasPinned && highlightedIds && highlightedIds.size > 0

        const getOpacity = (id: string) => {
          if (dimUnpinned && hasPinned) {
            return pinnedScenarioIds.has(id) ? 1.0 : 0.1
          }
          return 1.0
        }

        const T_DUR = hasAnimatedRef.current ? 0 : 500
        hasAnimatedRef.current = true
        const hasScenarioColors = lineColors.length > 0
        const dotR = effectiveDotR
        const ringExtra = showThemeRings ? 3 : 0
        const baselineMarkHalfW = (isCompare ? subW : bandW) * 0.45

        const dodgeMap = new Map<string, number>()
        const dotDiam = dotR * 2 + 1.5
        subcolumns.forEach(({ srcData, srcBaseline, tag }) => {
          axes.forEach((axis) => {
            if (srcBaseline.values[axis] == null) return
            const entries: { id: string; y: number }[] = []
            srcData.forEach((scenario) => {
              const sv = scenario.values[axis]
              if (sv == null) return
              entries.push({ id: scenario.id, y: yScale(toTier(sv)) })
            })
            const offsets = computeColumnDodge(
              entries,
              dotDiam,
              effectiveJitter,
              scenarioThemes,
            )
            offsets.forEach((off, id) => {
              dodgeMap.set(`${tag}:${axis}:${id}`, off)
            })
          })
        })

        const baselinePointsByTag = new Map<string, [number, number][]>()
        subcolumns.forEach(({ tag }) => baselinePointsByTag.set(tag, []))

        const baselineInfos: {
          axis: string
          tag: string
          cx: number
          baseY: number
          colX: number
          w: number
        }[] = []

        const dotPositions = new Map<
          string,
          { cx: number; cy: number; color: string; si: number }[]
        >()

        const glyphsLayer = g.append("g").attr("class", "difference-glyphs")

        axes.forEach((axis) => {
          const colX = xScale(axis)!

          subcolumns.forEach(({ srcData, srcBaseline, xOff, w, tag }) => {
            const cx = colX + xOff + w / 2
            const bv = srcBaseline.values[axis]
            if (bv == null) return
            const bt = toTier(bv)
            const baseY = yScale(bt)

            baselinePointsByTag.get(tag)!.push([cx, baseY])
            baselineInfos.push({ axis, tag, cx, baseY, colX, w })

            srcData.forEach((scenario, si) => {
              const sv = scenario.values[axis]
              if (sv == null) return
              const st = toTier(sv)
              const dotY = yScale(st)
              const dodgeOff =
                dodgeMap.get(`${tag}:${axis}:${scenario.id}`) ?? 0
              const dotCx = cx + dodgeOff
              const color = hasScenarioColors
                ? lineColors[si] || colors.default
                : colors.default

              if (tag === "hist") {
                if (!dotPositions.has(scenario.id))
                  dotPositions.set(scenario.id, [])
                dotPositions
                  .get(scenario.id)!
                  .push({ cx: dotCx, cy: dotY, color, si })
              }

              if (showDifferenceGlyphs && Math.abs(dotY - baseY) > 0.5) {
                glyphsLayer
                  .append("line")
                  .attr("class", "diff-glyph")
                  .attr("data-scenario-id", scenario.id)
                  .attr("data-axis", axis)
                  .attr("data-tag", tag)
                  .attr("x1", dotCx)
                  .attr("y1", baseY)
                  .attr("x2", dotCx)
                  .attr("y2", dotY)
                  .attr("stroke", color)
                  .attr("stroke-width", 1)
                  .attr("stroke-opacity", 0.35)
                  .attr("pointer-events", "none")
              }
            })
          })

          if (isCompare) {
            const histBv = baselineData.values[axis]
            const compBv = comparisonBaselineData!.values[axis]
            if (histBv != null && compBv != null) {
              const histY = yScale(toTier(histBv))
              const compY = yScale(toTier(compBv))
              const histCx = colX + subW / 2
              const compCx = colX + compXOff + subW / 2
              g.append("line")
                .attr("class", "baseline-bridge")
                .attr("x1", histCx + baselineMarkHalfW)
                .attr("y1", histY)
                .attr("x2", compCx - baselineMarkHalfW)
                .attr("y2", compY)
                .attr("stroke", "#aaa")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "2,2")
                .attr("stroke-opacity", 0.45)
                .attr("pointer-events", "none")
            }
          }

          const labelCx = colX + bandW / 2
          const labelFontSize = isCompare ? 9 : 12
          const labelColor = "#4a5568"
          const labelLineH = labelFontSize * 1.3
          const curated = LABEL_BREAK_POINTS[axis]
          if (curated) {
            g.append("text")
              .attr("x", labelCx)
              .attr("y", innerH + labelLineH + 2)
              .attr("text-anchor", "middle")
              .attr("font-size", labelFontSize)
              .attr("font-family", FONT_FAMILY)
              .attr("font-weight", 500)
              .attr("fill", labelColor)
              .attr("letter-spacing", "0.01em")
              .text(curated[0])
            g.append("text")
              .attr("x", labelCx)
              .attr("y", innerH + labelLineH * 2 + 2)
              .attr("text-anchor", "middle")
              .attr("font-size", labelFontSize)
              .attr("font-family", FONT_FAMILY)
              .attr("font-weight", 500)
              .attr("fill", labelColor)
              .attr("letter-spacing", "0.01em")
              .text(curated[1])
          } else {
            g.append("text")
              .attr("x", labelCx)
              .attr("y", innerH + labelLineH + 2)
              .attr("text-anchor", "middle")
              .attr("font-size", labelFontSize)
              .attr("font-family", FONT_FAMILY)
              .attr("font-weight", 500)
              .attr("fill", labelColor)
              .attr("letter-spacing", "0.01em")
              .text(axis)
          }
        })

        subcolumns.forEach(({ tag }) => {
          const pts = baselinePointsByTag.get(tag)
          if (!showBaselineStaircase || !pts || pts.length < 2) return
          const stairLine = line<[number, number]>()
            .x((d) => d[0])
            .y((d) => d[1])
          g.append("path")
            .attr("class", `staircase staircase-${tag}`)
            .attr("d", stairLine(pts) ?? "")
            .attr("fill", "none")
            .attr("stroke", tag === "comp" ? "#90a4ae" : "#546e7a")
            .attr("stroke-width", 1.2)
            .attr("stroke-dasharray", tag === "comp" ? "3,3" : "6,4")
            .attr("stroke-opacity", 0.4)
            .attr("pointer-events", "none")
        })

        // Above/below baseline column tints
        const tintLayer = g.append("g").attr("class", "baseline-tints")
        const histBaselineInfos = baselineInfos.filter(
          ({ tag }) => tag === "hist",
        )
        if (showBaselineFill)
          histBaselineInfos.forEach(({ axis, baseY }) => {
            const colX = xScale(axis)!
            const colLeft = colX - (stepW - bandW) / 2
            tintLayer
              .append("rect")
              .attr("x", colLeft)
              .attr("y", 0)
              .attr("width", stepW)
              .attr("height", Math.max(0, baseY))
              .attr("fill", "rgba(56,161,105,0.06)")
              .attr("pointer-events", "none")
            tintLayer
              .append("rect")
              .attr("x", colLeft)
              .attr("y", baseY)
              .attr("width", stepW)
              .attr("height", Math.max(0, innerH - baseY))
              .attr("fill", "rgba(229,62,62,0.06)")
              .attr("pointer-events", "none")
          })

        // "above / below baseline" labels in the first column
        if (showBaselineFill && histBaselineInfos.length > 0) {
          const first = histBaselineInfos[0]!
          const lx = xScale(first.axis)! + bandW / 2

          if (first.baseY > 18) {
            tintLayer
              .append("text")
              .attr("x", lx)
              .attr("y", first.baseY / 2)
              .attr("text-anchor", "middle")
              .attr("dominant-baseline", "middle")
              .attr("font-size", 10)
              .attr("font-family", FONT_FAMILY)
              .attr("font-style", "italic")
              .attr("font-weight", 400)
              .attr("fill", "rgba(56,161,105,0.45)")
              .attr("pointer-events", "none")
              .text("above baseline")
          }

          const belowH = innerH - first.baseY
          if (belowH > 18) {
            tintLayer
              .append("text")
              .attr("x", lx)
              .attr("y", first.baseY + belowH / 2)
              .attr("text-anchor", "middle")
              .attr("dominant-baseline", "middle")
              .attr("font-size", 10)
              .attr("font-family", FONT_FAMILY)
              .attr("font-style", "italic")
              .attr("font-weight", 400)
              .attr("fill", "rgba(229,62,62,0.45)")
              .attr("pointer-events", "none")
              .text("below baseline")
          }
        }

        // Capture baseline positions for the ghost trace on every full rebuild.
        // This resets the ghost reference whenever data/scenarios change.
        const posMap = new Map<string, number>()
        baselineInfos.forEach(({ axis, tag, baseY }) => {
          if (tag === "hist") posMap.set(axis, baseY)
        })
        initialBaselineRef.current = posMap
        hasMorphedRef.current = false

        const ghostLayer = g.append("g").attr("class", "ghost-baselines")
        const baselineLayer = g.append("g").attr("class", "baselines")
        const whiskerLayer = g.append("g").attr("class", "hc-range-whiskers")
        const pathLayer = g.append("g").attr("class", "scenario-path")
        const distributionLayer = g
          .append("g")
          .attr("class", "distribution-dots")
        const dotsLayer = g.append("g").attr("class", "dots")

        // Render ghost baseline if we've morphed away from the initial hydroclimate
        if (hasMorphedRef.current && initialBaselineRef.current) {
          const ghostPositions = initialBaselineRef.current
          baselineInfos
            .filter(({ tag }) => tag === "hist")
            .forEach(({ axis, cx, w }) => {
              const ghostY = ghostPositions.get(axis)
              if (ghostY == null) return
              const bracketHalfW = (isCompare ? w : w) * 0.45
              const edgeL = cx - bracketHalfW
              const edgeR = cx + bracketHalfW
              ghostLayer
                .append("line")
                .attr("class", "ghost-baseline")
                .attr("data-axis", axis)
                .attr("x1", edgeL)
                .attr("y1", ghostY)
                .attr("x2", edgeR)
                .attr("y2", ghostY)
                .attr("stroke", "#2d3748")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "6,4")
                .attr("stroke-linecap", "square")
                .attr("opacity", 0.55)
                .attr("pointer-events", "none")
              ;[edgeL, edgeR].forEach((ex) => {
                ghostLayer
                  .append("line")
                  .attr("class", "ghost-baseline")
                  .attr("data-axis", axis)
                  .attr("x1", ex)
                  .attr("y1", ghostY - 5)
                  .attr("x2", ex)
                  .attr("y2", ghostY + 5)
                  .attr("stroke", "#2d3748")
                  .attr("stroke-width", 2)
                  .attr("stroke-dasharray", "6,4")
                  .attr("stroke-linecap", "round")
                  .attr("opacity", 0.55)
                  .attr("pointer-events", "none")
              })
            })
        }

        const TICK_HALF = 6
        baselineInfos.forEach(({ axis, tag, cx, baseY, w }) => {
          const isComp = tag === "comp"
          const strokeColor = isComp ? "#718096" : "#2d3748"
          const opacity = isComp ? 0.5 : 0.7
          const bracketHalfW = (isCompare ? w : w) * 0.45
          const edgeL = cx - bracketHalfW
          const edgeR = cx + bracketHalfW
          baselineLayer
            .append("line")
            .attr("class", "baseline-mark")
            .attr("data-axis", axis)
            .attr("data-tag", tag)
            .attr("x1", edgeL)
            .attr("y1", baseY)
            .attr("x2", edgeR)
            .attr("y2", baseY)
            .attr("stroke", strokeColor)
            .attr("stroke-width", 2)
            .attr("stroke-linecap", "square")
            .attr("opacity", opacity)
          ;[edgeL, edgeR].forEach((ex) => {
            baselineLayer
              .append("line")
              .attr("class", "baseline-mark")
              .attr("data-axis", axis)
              .attr("data-tag", tag)
              .attr("data-half-tick", TICK_HALF)
              .attr("x1", ex)
              .attr("y1", baseY - TICK_HALF)
              .attr("x2", ex)
              .attr("y2", baseY + TICK_HALF)
              .attr("stroke", strokeColor)
              .attr("stroke-width", 2)
              .attr("stroke-linecap", "round")
              .attr("opacity", opacity)
          })
        })

        const drawPathForScenario = (scenarioId: string) => {
          pathLayer.selectAll(`[data-path-id="${scenarioId}"]`).remove()
          if (!showScenarioPath && !showAllPaths) return
          const pts = dotPositions.get(scenarioId)
          const activeList = subcolumns[0]!.srcData
          const scenario = activeList.find((s) => s.id === scenarioId)
          if (!pts || pts.length < 2 || !scenario) return
          const si = activeList.indexOf(scenario)
          const color = hasScenarioColors
            ? lineColors[si] || colors.default
            : colors.default
          const isPinned = pinnedScenarioIds.has(scenarioId)
          const isHighlighted = highlightedIds && highlightedIds.has(scenarioId)
          const isBackground = showAllPaths && !isPinned && !isHighlighted
          const dimmed = dimUnpinned && hasPinned && !isPinned
          let strokeOp = isBackground ? 0.55 : 0.45
          if (dimmed) strokeOp = 0.07
          const pathGen = line<(typeof pts)[number]>()
            .x((d) => d.cx)
            .y((d) => d.cy)
          pathLayer
            .append("path")
            .attr("data-path-id", scenarioId)
            .attr("d", pathGen(pts) ?? "")
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
            .selectAll<SVGCircleElement, unknown>("circle")
            .each(function () {
              const sid = this.getAttribute("data-scenario-id") ?? ""
              const isFocus = sid === focusId
              const isPin = pinnedScenarioIds.has(sid)
              const isRing = this.classList.contains("theme-ring")
              if (isRing) {
                select(this)
                  .attr("opacity", isFocus || isPin ? 1 : 0.08)
                  .attr("stroke-opacity", isFocus || isPin ? 1 : 0.1)
              } else {
                select(this)
                  .attr("fill-opacity", isFocus || isPin ? 1.0 : 0.08)
                  .attr("stroke-opacity", isFocus || isPin ? 1.0 : 0.08)
                  .attr(
                    "r",
                    isFocus ? dotR + 1.5 : isPin ? dotR + 3 : dotR * 0.7,
                  )
              }
            })
        }

        const boostPinnedDots = (ids: Set<string>) => {
          dotsLayer
            .selectAll<SVGCircleElement, unknown>("circle")
            .each(function () {
              const sid = this.getAttribute("data-scenario-id") ?? ""
              if (!ids.has(sid)) return
              const isRing = this.classList.contains("theme-ring")
              if (!isRing) {
                select(this)
                  .attr("r", dotR + 3)
                  .attr("fill-opacity", 1)
              }
            })
        }

        const resetDotVisuals = () => {
          dotsLayer
            .selectAll<SVGCircleElement, unknown>("circle")
            .each(function () {
              const sid = this.getAttribute("data-scenario-id") ?? ""
              const op = getOpacity(sid)
              const isRing = this.classList.contains("theme-ring")
              if (isRing) {
                select(this)
                  .attr("opacity", 0.85)
                  .attr("stroke-opacity", 1)
                  .attr("r", dotR + ringExtra)
              } else {
                select(this)
                  .attr("fill-opacity", op)
                  .attr("stroke-opacity", Math.min(op + 0.1, 1))
                  .attr("r", dotR)
              }
            })
        }

        axes.forEach((axis) => {
          const colX = xScale(axis)!

          subcolumns.forEach(({ srcData, srcBaseline, xOff, w, tag }) => {
            const cx = colX + xOff + w / 2
            const bv = srcBaseline.values[axis]
            if (bv == null) return
            const bt = toTier(bv)
            const baseY = yScale(bt)

            srcData.forEach((scenario, si) => {
              const sv = scenario.values[axis]
              if (sv == null) return
              const st = toTier(sv)
              const dotY = yScale(st)
              const opacity = getOpacity(scenario.id)
              const dotCx =
                cx + (dodgeMap.get(`${tag}:${axis}:${scenario.id}`) ?? 0)
              const color = hasScenarioColors
                ? lineColors[si] || colors.default
                : colors.default
              const themeRing =
                tag === "hist" &&
                showThemeRings &&
                scenarioThemeRingColors?.[scenario.id]

              if (themeRing) {
                dotsLayer
                  .append("circle")
                  .attr("class", "theme-ring")
                  .attr("cx", dotCx)
                  .attr("cy", baseY)
                  .attr("r", 0)
                  .attr("fill", "none")
                  .attr("stroke", themeRing)
                  .attr("stroke-width", 2)
                  .attr("opacity", 0.85)
                  .attr("pointer-events", "none")
                  .attr("data-scenario-id", scenario.id)
                  .attr("data-axis", axis)
                  .attr("data-tag", tag)
                  .transition()
                  .duration(T_DUR)
                  .attr("cy", dotY)
                  .attr("r", dotR + ringExtra)
              }

              const dot = dotsLayer
                .append("circle")
                .attr("cx", dotCx)
                .attr("cy", baseY)
                .attr("r", 0)
                .attr("fill", color)
                .attr("fill-opacity", tag === "comp" ? opacity * 0.7 : opacity)
                .attr("stroke", color)
                .attr("stroke-width", 1.5)
                .attr(
                  "stroke-opacity",
                  Math.min((tag === "comp" ? opacity * 0.7 : opacity) + 0.1, 1),
                )
                .attr("cursor", "pointer")
                .attr("data-scenario-id", scenario.id)
                .attr("data-axis", axis)
                .attr("data-tag", tag)
                .attr("data-base-r", dotR)

              const isPinnedDot = pinnedScenarioIds.has(scenario.id)
              const targetR = isPinnedDot
                ? dotR + 3
                : sidebarHighlightActive
                  ? highlightedIds!.has(scenario.id)
                    ? dotR + 1.5
                    : dotR * 0.7
                  : dotR

              dot
                .transition()
                .duration(T_DUR)
                .attr("cy", dotY)
                .attr("r", targetR)

              dot
                .on("mouseenter", function () {
                  applyFocusVisuals(scenario.id)
                  select(this)
                    .attr("r", dotR + 2.5)
                    .raise()
                  if (themeRing) {
                    dotsLayer
                      .selectAll<SVGCircleElement, unknown>("circle.theme-ring")
                      .filter(function () {
                        return (
                          this.getAttribute("data-scenario-id") === scenario.id
                        )
                      })
                      .raise()
                  }

                  if (showScenarioPath) drawPathForScenario(scenario.id)

                  if (hoverNotifyTimerRef.current !== null) {
                    clearTimeout(hoverNotifyTimerRef.current)
                    hoverNotifyTimerRef.current = null
                  }

                  const el = tooltipRef.current
                  if (el) {
                    showTooltip(
                      el,
                      MARGIN.left + colX + bandW / 2,
                      MARGIN.top + 6,
                      scenario.name,
                      axis,
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
                  if (showAllPaths) {
                    data.forEach((s) => drawPathForScenario(s.id))
                  }
                  if (hasPinned) {
                    pinnedScenarioIds.forEach((id) => drawPathForScenario(id))
                    boostPinnedDots(pinnedScenarioIds)
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
        })

        if (showAllPaths) {
          data.forEach((scenario) => {
            drawPathForScenario(scenario.id)
          })
        }

        if (hasPinned) {
          pinnedScenarioIds.forEach((id) => drawPathForScenario(id))
          boostPinnedDots(pinnedScenarioIds)
        } else if (!showAllPaths && highlightedIds && highlightedIds.size > 0) {
          const hId = highlightedIds.values().next().value as string
          if (hId) drawPathForScenario(hId)
        }

        // HC range corridor.shaded band showing min–max envelope across
        // hydroclimates for each scenario
        if (showHCRange && hcRangeData) {
          const activeList = subcolumns[0]!.srcData
          activeList.forEach((scenario, si) => {
            const scenarioRange = hcRangeData[scenario.id]
            if (!scenarioRange) return
            const color = hasScenarioColors
              ? lineColors[si] || colors.default
              : colors.default
            const isPinned = pinnedScenarioIds.has(scenario.id)
            const dimmed = dimUnpinned && hasPinned && !isPinned
            const fillOp = dimmed ? 0.02 : 0.1
            const strokeOp = dimmed ? 0.05 : 0.25

            const upperPts: [number, number][] = []
            const lowerPts: [number, number][] = []

            axes.forEach((axis) => {
              const range = scenarioRange[axis]
              if (!range) return
              const dodgeKey = `hist:${axis}:${scenario.id}`
              const dodgeOff = dodgeMap.get(dodgeKey) ?? 0
              const colX = xScale(axis)!
              const cx =
                colX + subcolumns[0]!.xOff + subcolumns[0]!.w / 2 + dodgeOff
              const minY = yScale(toTier(range.min))
              const maxY = yScale(toTier(range.max))
              upperPts.push([cx, Math.min(minY, maxY)])
              lowerPts.push([cx, Math.max(minY, maxY)])
            })

            if (upperPts.length < 2) return

            const ribbonPts = [...upperPts, ...lowerPts.reverse()]
            const pathD =
              ribbonPts
                .map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`)
                .join(" ") + " Z"

            whiskerLayer
              .append("path")
              .attr("d", pathD)
              .attr("fill", color)
              .attr("fill-opacity", fillOp)
              .attr("stroke", color)
              .attr("stroke-width", 0.75)
              .attr("stroke-opacity", strokeOp)
              .attr("pointer-events", "none")
          })
        }

        if (showDistribution && distributionData && hasPinned) {
          const activeList = subcolumns[0]!.srcData
          const pinnedArr = Array.from(pinnedScenarioIds)
          const pinCount = pinnedArr.length
          const locDotR = 2.5
          const locDotDiam = locDotR * 2 + 1
          const tierBandH = yScale(1.5) - yScale(0.5)

          pinnedArr.forEach((scenarioId, pinIdx) => {
            const outcomeBuckets = distributionData[scenarioId]
            if (!outcomeBuckets) return
            const si = activeList.findIndex((s) => s.id === scenarioId)
            const color =
              si >= 0 && hasScenarioColors
                ? lineColors[si] || colors.default
                : colors.default

            axes.forEach((axis) => {
              const buckets = outcomeBuckets[axis]
              if (!buckets || buckets.length === 0) return
              const colX = xScale(axis)!
              const colW = subcolumns[0]!.w
              const sliceW = pinCount === 1 ? colW : colW / pinCount
              const sliceLeft = colX + subcolumns[0]!.xOff + pinIdx * sliceW
              const availW = sliceW * 0.85
              const sliceCenter = sliceLeft + sliceW / 2

              buckets.forEach(({ tier, count }) => {
                if (count <= 0) return
                const tierY = yScale(tier)
                const maxCols = Math.max(1, Math.floor(availW / locDotDiam))
                const rows = Math.ceil(count / maxCols)
                const cols = Math.min(count, maxCols)
                const gridW = cols * locDotDiam
                const gridH = rows * locDotDiam
                const startX = sliceCenter - gridW / 2 + locDotR
                const maxGridH = tierBandH * 0.7
                const startY = tierY - Math.min(gridH, maxGridH) / 2 + locDotR

                for (let d = 0; d < count; d++) {
                  const col = d % maxCols
                  const row = Math.floor(d / maxCols)
                  distributionLayer
                    .append("circle")
                    .attr("cx", startX + col * locDotDiam)
                    .attr("cy", startY + row * locDotDiam)
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
      },
      [
        data,
        axes,
        baselineData,
        lineColors,
        colors,
        highlightedIds,
        showBaselineStaircase,
        showScenarioPath,
        showAllPaths,
        showTierZones,
        showDifferenceGlyphs,
        showThemeRings,
        scenarioThemeRingColors,
        pinnedScenarioIds,
        dimUnpinned,
        showDistribution,
        distributionData,
        showHCRange,
        hcRangeData,
        showBaselineFill,
        comparisonData,
        comparisonBaselineData,
        climateMode,
        morphShowComparison,
        scenarioThemes,
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
        {/* Tooltip element.always mounted, toggled via display:none imperatively */}
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
            fontFamily:
              '"neue-haas-grotesk-text", Roboto, Helvetica, Arial, sans-serif',
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

DeviationPlot.displayName = "DeviationPlot"

export default DeviationPlot
