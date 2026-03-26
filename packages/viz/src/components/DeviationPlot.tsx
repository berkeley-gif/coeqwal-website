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
  showBaselineStaircase?: boolean
  showScenarioPath?: boolean
  showTierZones?: boolean
  showDifferenceGlyphs?: boolean
  showThemeRings?: boolean
  scenarioThemeRingColors?: Record<string, string>
  comparisonData?: VerticalParallelLineData[]
  comparisonBaselineData?: VerticalParallelLineData
  comparisonLabel?: string
  climateMode?: "off" | "morph" | "compare"
  morphShowComparison?: boolean
}

function toTier(v: number): number {
  return 4 - (v + 1) * 1.5
}

const CHANGE_THRESHOLD = 0.05
const TIER_POSITIONS = [1, 2, 3, 4] as const
const TIER_LABELS = ["Tier 1", "Tier 2", "Tier 3", "Tier 4"] as const
const TIER_BAND_COLORS = ["#edf2f7", "#ffffff", "#edf2f7", "#ffffff"] as const
const MARGIN = { top: 28, right: 24, bottom: 48, left: 52 }

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
const COLOR_IMPROVED = "#2e7d32"
const COLOR_WORSENED = "#c62828"
const DEFAULT_COLORS = {
  default: "#546e7a",
  highlighted: "#1a3a5c",
  background: "#ffffff",
}
const DEFAULT_LINE_COLORS: string[] = []
const HOVER_NOTIFY_MS = 80
const JITTER_PX = 14
const FONT_FAMILY =
  '"neue-haas-grotesk-text", Roboto, Helvetica, Arial, sans-serif'

function hashJitter(id: string, axis: string): number {
  const s = id + ":" + axis
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return ((h & 0xffff) / 0xffff) * 2 - 1
}

function summarizeVsBaseline(
  scenario: VerticalParallelLineData,
  baseline: VerticalParallelLineData,
  axisList: string[],
): { improved: number; worse: number; unchanged: number } {
  let improved = 0
  let worse = 0
  let unchanged = 0
  for (const axis of axisList) {
    const bv = baseline.values[axis]
    const sv = scenario.values[axis]
    if (bv == null || sv == null) continue
    const diff = toTier(bv) - toTier(sv)
    if (Math.abs(diff) <= CHANGE_THRESHOLD) unchanged++
    else if (diff > CHANGE_THRESHOLD) improved++
    else worse++
  }
  return { improved, worse, unchanged }
}

function formatOutcomeCount(n: number): string {
  return `${n} outcome${n === 1 ? "" : "s"}`
}

function changeColor(change: string): string {
  if (change.startsWith("+")) return COLOR_IMPROVED
  if (change.startsWith("-")) return COLOR_WORSENED
  return "#888"
}

/** Imperatively show the tooltip DOM element — no React state updates. */
function showTooltip(
  el: HTMLDivElement,
  x: number,
  y: number,
  scenarioName: string,
  summary: string | undefined,
  outcomeName: string,
  baselineTier: string,
  scenarioTier: string,
  change: string,
) {
  el.style.display = "block"
  el.style.left = `${x}px`
  el.style.top = `${y}px`
  el.innerHTML =
    `<div style="font-weight:600;color:#1a202c;font-size:11.5px;letter-spacing:0.01em">${scenarioName}</div>` +
    (summary
      ? `<div style="color:#718096;font-size:9.5px;margin-top:3px;letter-spacing:0.01em">${summary}</div>`
      : "") +
    `<div style="color:#4a5568;margin-top:4px;font-size:10.5px">${outcomeName}</div>` +
    `<div style="color:#a0aec0;font-size:9.5px;margin-top:3px;letter-spacing:0.02em">Baseline ${baselineTier} \u2192 Scenario ${scenarioTier}</div>` +
    `<div style="font-size:10px;margin-top:2px;letter-spacing:0.01em"><span style="color:${changeColor(change)};font-weight:600">${change}</span></div>`
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
    chosenIds,
    highlightedIds,
    showBaselineStaircase = true,
    showScenarioPath = true,
    showTierZones = true,
    showDifferenceGlyphs = false,
    showThemeRings = false,
    scenarioThemeRingColors = undefined,
    comparisonData,
    comparisonBaselineData,
    comparisonLabel = "Comparison",
    climateMode = "off",
    morphShowComparison = false,
  }) => {
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
    const [pinnedScenarioId, setPinnedScenarioId] = useState<string | null>(
      null,
    )
    const dimensions = useResizeObserver(
      containerRef as React.RefObject<HTMLElement>,
    )
    const [currentWidth, setCurrentWidth] = useState(width)
    const [currentHeight, setCurrentHeight] = useState(height)

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

    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setPinnedScenarioId(null)
      }
      window.addEventListener("keydown", onKey)
      return () => window.removeEventListener("keydown", onKey)
    }, [])

    useEffect(() => {
      morphShowCompRef.current = morphShowComparison
    }, [morphShowComparison])

    useEffect(() => {
      if (pinnedScenarioId && !data.some((s) => s.id === pinnedScenarioId)) {
        setPinnedScenarioId(null)
      }
    }, [data, pinnedScenarioId])

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
            .selectAll<SVGCircleElement, unknown>(
              "circle[data-axis]:not(.theme-ring)",
            )
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
            .selectAll<SVGCircleElement, unknown>(
              "circle.theme-ring[data-axis]",
            )
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
              el.transition()
                .duration(MORPH_DUR)
                .attr("y1", newY)
                .attr("y2", newY)
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
            .select<SVGTextElement>("text.climate-label")
            .text(
              morphShowComparison
                ? (comparisonLabel ?? "Comparison")
                : "Historical",
            )

          return
        }

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
        const effectiveJitter = isCompare ? JITTER_PX * 0.55 : JITTER_PX
        const effectiveDotR = isCompare
          ? data.length > 15
            ? 2.2
            : data.length > 8
              ? 2.8
              : 3.2
          : data.length > 15
            ? 2.8
            : data.length > 8
              ? 3.2
              : 4

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
            .attr("fill", showTierZones ? (TIER_BAND_COLORS[i] ?? "#fff") : colors.background)
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

        axes.forEach((axis, idx) => {
          const colX = xScale(axis)!
          if (idx % 2 === 1) {
            g.append("rect")
              .attr("x", colX)
              .attr("y", 0)
              .attr("width", bandW)
              .attr("height", innerH)
              .attr("fill", "rgba(0,0,0,0.018)")
              .attr("pointer-events", "none")
          }
          if (idx > 0) {
            g.append("line")
              .attr("x1", colX)
              .attr("y1", 0)
              .attr("x2", colX)
              .attr("y2", innerH)
              .attr("stroke", "#e2e8f0")
              .attr("stroke-width", 0.5)
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

        if (isMorph) {
          g.append("text")
            .attr("class", "climate-label")
            .attr("x", innerW)
            .attr("y", -10)
            .attr("text-anchor", "end")
            .attr("font-size", 9)
            .attr("font-family", FONT_FAMILY)
            .attr("fill", "#78909c")
            .attr("letter-spacing", "0.04em")
            .text(
              morphShowCompRef.current
                ? (comparisonLabel ?? "Comparison")
                : "Historical",
            )
        }

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
        const dotR = effectiveDotR
        const ringExtra = showThemeRings ? 3 : 0
        const baselineMarkHalfW = Math.min(
          (isCompare ? subW : bandW) * 0.35,
          isCompare ? 14 : 22,
        )

        const baselinePointsByTag = new Map<string, [number, number][]>()
        subcolumns.forEach(({ tag }) => baselinePointsByTag.set(tag, []))

        const dotPositions = new Map<
          string,
          { cx: number; cy: number; color: string; si: number }[]
        >()

        const glyphsLayer = g.append("g").attr("class", "difference-glyphs")

        axes.forEach((axis) => {
          const colX = xScale(axis)!

          subcolumns.forEach(
            ({ srcData, srcBaseline, xOff, w, tag, bgTint }) => {
              const cx = colX + xOff + w / 2
              const bv = srcBaseline.values[axis]
              if (bv == null) return
              const bt = toTier(bv)
              const baseY = yScale(bt)

              baselinePointsByTag.get(tag)!.push([cx, baseY])

              const mark = g
                .append("line")
                .attr("class", "baseline-mark")
                .attr("data-axis", axis)
                .attr("data-tag", tag)
                .attr("x1", cx - baselineMarkHalfW)
                .attr("y1", baseY)
                .attr("x2", cx + baselineMarkHalfW)
                .attr("y2", baseY)
                .attr("stroke", tag === "comp" ? "#78909c" : "#37474f")
                .attr("stroke-width", 1.8)
                .attr("stroke-linecap", "round")
                .attr("opacity", tag === "comp" ? 0.45 : 0.55)
              if (tag === "comp") {
                mark.attr("stroke-dasharray", "4,3")
              }

              srcData.forEach((scenario, si) => {
                const sv = scenario.values[axis]
                if (sv == null) return
                const st = toTier(sv)
                const dotY = yScale(st)
                const jitter =
                  hashJitter(scenario.id, axis) * effectiveJitter
                const dotCx = cx + jitter
                const color = hasScenarioColors
                  ? (lineColors[si] || colors.default)
                  : colors.default

                if (tag === "hist") {
                  if (!dotPositions.has(scenario.id))
                    dotPositions.set(scenario.id, [])
                  dotPositions
                    .get(scenario.id)!
                    .push({ cx: dotCx, cy: dotY, color, si })
                }

                if (
                  showDifferenceGlyphs &&
                  Math.abs(dotY - baseY) > 0.5
                ) {
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
            },
          )

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

        if (isCompare) {
          g.append("text")
            .attr("x", 4)
            .attr("y", -10)
            .attr("font-size", 8.5)
            .attr("font-family", FONT_FAMILY)
            .attr("fill", "#78909c")
            .attr("letter-spacing", "0.04em")
            .text("Historical")
          g.append("text")
            .attr("x", innerW)
            .attr("y", -10)
            .attr("text-anchor", "end")
            .attr("font-size", 8.5)
            .attr("font-family", FONT_FAMILY)
            .attr("fill", "#78909c")
            .attr("letter-spacing", "0.04em")
            .text(comparisonLabel ?? "Comparison")
        }

        const pathLayer = g.append("g").attr("class", "scenario-path")
        const dotsLayer = g.append("g").attr("class", "dots")

        const drawPathForScenario = (scenarioId: string) => {
          pathLayer.selectAll("*").remove()
          if (!showScenarioPath) return
          const pts = dotPositions.get(scenarioId)
          const activeList = subcolumns[0]!.srcData
          const scenario = activeList.find((s) => s.id === scenarioId)
          if (!pts || pts.length < 2 || !scenario) return
          const si = activeList.indexOf(scenario)
          const color = hasScenarioColors
            ? (lineColors[si] || colors.default)
            : colors.default
          const pathGen = line<(typeof pts)[number]>()
            .x((d) => d.cx)
            .y((d) => d.cy)
          pathLayer
            .append("path")
            .attr("d", pathGen(pts) ?? "")
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", 0.45)
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
              const isRing = this.classList.contains("theme-ring")
              if (isRing) {
                select(this)
                  .attr("opacity", isFocus ? 1 : 0.08)
                  .attr("stroke-opacity", isFocus ? 1 : 0.1)
              } else {
                select(this)
                  .attr("fill-opacity", isFocus ? 1.0 : 0.08)
                  .attr("stroke-opacity", isFocus ? 0.9 : 0)
                  .attr("r", isFocus ? dotR + 1.5 : dotR * 0.7)
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
                  .attr("stroke-opacity", 0.7)
                  .attr("r", dotR)
              }
            })
        }

        const scenarioSummaries = new Map<string, string | undefined>()
        subcolumns[0]!.srcData.forEach((scenario) => {
          const s = summarizeVsBaseline(
            scenario,
            subcolumns[0]!.srcBaseline,
            axes,
          )
          const parts: string[] = []
          if (s.improved > 0)
            parts.push(`improved on ${formatOutcomeCount(s.improved)}`)
          if (s.worse > 0)
            parts.push(`worse on ${formatOutcomeCount(s.worse)}`)
          if (s.unchanged > 0)
            parts.push(`unchanged on ${formatOutcomeCount(s.unchanged)}`)
          scenarioSummaries.set(
            scenario.id,
            parts.length > 0 ? parts.join(" \u00b7 ") : undefined,
          )
        })

        axes.forEach((axis) => {
          const colX = xScale(axis)!

          subcolumns.forEach(
            ({ srcData, srcBaseline, xOff, w, tag }) => {
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
                const jitter =
                  hashJitter(scenario.id, axis) * effectiveJitter
                const dotCx = cx + jitter
                const color = hasScenarioColors
                  ? (lineColors[si] || colors.default)
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
                  .attr("fill-opacity", tag === "comp" ? opacity * 0.65 : opacity)
                  .attr("stroke", "#fff")
                  .attr("stroke-width", 0.6)
                  .attr("stroke-opacity", 0.7)
                  .attr("cursor", "pointer")
                  .attr("data-scenario-id", scenario.id)
                  .attr("data-axis", axis)
                  .attr("data-tag", tag)

                dot
                  .transition()
                  .duration(T_DUR)
                  .attr("cy", dotY)
                  .attr("r", dotR)

                dot
                  .on("mouseenter", function (event: MouseEvent) {
                    applyFocusVisuals(scenario.id)
                    select(this).attr("r", dotR + 2).raise()
                    if (themeRing) {
                      dotsLayer
                        .selectAll<SVGCircleElement, unknown>(
                          "circle.theme-ring",
                        )
                        .filter(function () {
                          return (
                            this.getAttribute("data-scenario-id") ===
                            scenario.id
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
                    const rect =
                      containerRef.current?.getBoundingClientRect()
                    if (el && rect) {
                      const diff = bt - st
                      const sign = diff > 0 ? "+" : ""
                      const changeStr = `${sign}${diff.toFixed(1)} tier${Math.abs(diff) === 1 ? "" : "s"}`
                      const tagLabel =
                        tag === "comp"
                          ? ` (${comparisonLabel})`
                          : isCompare
                            ? " (historical)"
                            : ""
                      showTooltip(
                        el,
                        event.clientX - rect.left + 14,
                        event.clientY - rect.top - 14,
                        scenario.name + tagLabel,
                        tag === "hist"
                          ? scenarioSummaries.get(scenario.id)
                          : undefined,
                        axis,
                        `Tier ${bt.toFixed(1)}`,
                        `Tier ${st.toFixed(1)}`,
                        changeStr,
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
                    if (pinnedScenarioId) {
                      applyFocusVisuals(pinnedScenarioId)
                      drawPathForScenario(pinnedScenarioId)
                    } else {
                      resetDotVisuals()
                      pathLayer.selectAll("*").remove()
                    }
                    if (tooltipRef.current) hideTooltip(tooltipRef.current)
                    lastNotifiedIdRef.current = null
                    onLineHoverRef.current?.(null)
                  })
                  .on("click", () => onLineClickRef.current?.(scenario))
                  .on("dblclick", function (event: MouseEvent) {
                    event.preventDefault()
                    event.stopPropagation()
                    setPinnedScenarioId((prev) =>
                      prev === scenario.id ? null : scenario.id,
                    )
                  })
              })
            },
          )
        })

        if (pinnedScenarioId) {
          applyFocusVisuals(pinnedScenarioId)
          drawPathForScenario(pinnedScenarioId)
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
        showBaselineStaircase,
        showScenarioPath,
        showTierZones,
        showDifferenceGlyphs,
        showThemeRings,
        scenarioThemeRingColors,
        pinnedScenarioId,
        comparisonData,
        comparisonBaselineData,
        comparisonLabel,
        climateMode,
        morphShowComparison,
      ],
    )

    useEffect(() => {
      if (currentWidth > 0 && currentHeight > 0) {
        updateChart(currentWidth, currentHeight)
      }
    }, [currentWidth, currentHeight, updateChart])

    const pinnedName = pinnedScenarioId
      ? data.find((s) => s.id === pinnedScenarioId)?.name
      : null

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
        {pinnedName && (
          <div
            style={{
              position: "absolute",
              top: 6,
              right: 10,
              fontSize: 9.5,
              fontFamily: '"neue-haas-grotesk-text", Roboto, Helvetica, Arial, sans-serif',
              color: "#4a5568",
              zIndex: 5,
              pointerEvents: "none",
              textAlign: "right",
              maxWidth: "50%",
              lineHeight: 1.4,
              letterSpacing: "0.01em",
              background: "rgba(255,255,255,0.85)",
              borderRadius: 6,
              padding: "3px 8px",
            }}
          >
            <span style={{ fontWeight: 600, color: "#2d3748" }}>{pinnedName}</span>
            <span style={{ color: "#a0aec0", fontSize: 8.5 }}>
              {" "}&middot; dbl-click to unpin
            </span>
          </div>
        )}
        <svg
          ref={svgRef}
          width={currentWidth}
          height={currentHeight}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
        {/* Tooltip element — always mounted, toggled via display:none imperatively */}
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
            fontFamily: '"neue-haas-grotesk-text", Roboto, Helvetica, Arial, sans-serif',
            lineHeight: 1.55,
            pointerEvents: "none",
            zIndex: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
            whiteSpace: "normal",
            maxWidth: 280,
          }}
        />
      </div>
    )
  },
)

DeviationPlot.displayName = "DeviationPlot"

export default DeviationPlot
