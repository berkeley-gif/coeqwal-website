"use client"

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react"
import { scaleBand, scaleLinear, select, line } from "d3"
import { useResizeObserver } from "../hooks/useResizeObserver"
import { isFullOpacityDuringSidebarHighlight } from "../utils/sidebarHighlightPolicy"
import type { VerticalParallelLineData } from "./VerticalParallelLinePlot.peak"

// ---------------------------------------------------------------------------
// ResilienceDeviationPlot
// ---------------------------------------------------------------------------
// An evolution of DeviationPlot that makes climate resilience the
// primary visual signal. Key design differences:
//
// 1. ALWAYS-VISIBLE SPREAD: Both climates are shown simultaneously as
//    a vertical range bar per scenario per column. The bar length *is*
//    the climate sensitivity, and its color encodes severity.
//
// 2. INDEPENDENT BASELINE SHIFT: Two bracket marks per column (solid =
//    primary climate, dashed = comparison climate) so the viewer sees
//    "how much the floor moved" independent of any scenario.
//
// 3. BUFFERING INDICATOR: When a scenario's tier-shift is smaller than
//    the baseline's tier-shift in a column, a small shield glyph shows
//    that the operation is absorbing climate impact.
//
// 4. RESILIENCE RANKING SIDEBAR: A sorted horizontal bar chart showing
//    each scenario's average cross-column climate spread, so the viewer
//    can immediately rank resilience without mental math.
//
// 5. SPREAD-COLORED RANGE BARS: Green = small spread (resilient),
//    amber/red = large spread (vulnerable), applied per column.
//
// The component accepts the same data shape as DeviationPlot so it can
// serve as a drop-in replacement in ComparisonPanel.
// ---------------------------------------------------------------------------

export interface ResilienceDeviationPlotProps {
  data: VerticalParallelLineData[]
  axes: string[]
  baselineData?: VerticalParallelLineData
  comparisonData?: VerticalParallelLineData[]
  comparisonBaselineData?: VerticalParallelLineData
  primaryLabel?: string
  comparisonLabel?: string
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
  showBufferingGlyphs?: boolean
  showSidebar?: boolean
  /** Map of scenario ID to theme/group string for clustering */
  scenarioThemes?: Record<string, string>
}

const TIER_POSITIONS = [1, 2, 3, 4] as const
const TIER_LABELS = ["Tier 1", "Tier 2", "Tier 3", "Tier 4"] as const
const TIER_BAND_COLORS = ["#edf2f7", "#ffffff", "#edf2f7", "#ffffff"] as const
const FONT_FAMILY =
  '"neue-haas-grotesk-text", Roboto, Helvetica, Arial, sans-serif'
const HOVER_NOTIFY_MS = 80

const DEFAULT_COLORS = {
  default: "#546e7a",
  highlighted: "#1a3a5c",
  background: "#ffffff",
}

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

/** Convert raw value (0-based index) to tier (1 = best, 4 = worst). */
function toTier(v: number): number {
  return 4 - (v + 1) * 1.5
}

// ---------------------------------------------------------------------------
// Dodge: collision-avoidance for overlapping dots in a column.
// Ported from DeviationPlot with minor simplification.
// ---------------------------------------------------------------------------

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
  const tierSet = new Set(entries.map((e) => e.y))

  if (tierSet.size === 1) {
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
    ordered.forEach((entry, i) => result.set(entry.id, startX + i * step))
    return result
  }

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

// ---------------------------------------------------------------------------
// Spread helpers
// ---------------------------------------------------------------------------

/** Average absolute tier spread across columns for a scenario. */
function avgTierSpread(
  primary: VerticalParallelLineData,
  comp: VerticalParallelLineData | undefined,
  axes: string[],
): number {
  if (!comp) return 0
  let total = 0
  let n = 0
  for (const axis of axes) {
    const pv = primary.values[axis]
    const cv = comp.values[axis]
    if (pv == null || cv == null) continue
    total += Math.abs(toTier(pv) - toTier(cv))
    n++
  }
  return n > 0 ? total / n : 0
}

/** Map spread magnitude (tier units) to a green-amber-red color. */
function spreadColor(spread: number): string {
  const t = Math.min(Math.abs(spread) / 2.0, 1.0)
  const r = Math.round(34 + t * (220 - 34))
  const g = Math.round(170 + t * (60 - 170))
  const b = Math.round(100 + t * (60 - 100))
  return `rgb(${r},${g},${b})`
}

// ---------------------------------------------------------------------------
// Tooltip helpers (imperative, no React re-render)
// ---------------------------------------------------------------------------

function showTooltip(el: HTMLDivElement, x: number, y: number, html: string) {
  el.style.display = "block"
  el.style.left = `${x}px`
  el.style.top = `${y}px`
  el.innerHTML = html
}

function hideTooltip(el: HTMLDivElement) {
  el.style.display = "none"
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ResilienceDeviationPlot: React.FC<ResilienceDeviationPlotProps> =
  React.memo(
    ({
      data,
      axes,
      baselineData,
      comparisonData,
      comparisonBaselineData,
      primaryLabel = "Historical",
      comparisonLabel = "CC95",
      responsive = true,
      width = 900,
      height = 420,
      colors = DEFAULT_COLORS,
      lineColors = [],
      onLineHover,
      onLineClick,
      chosenIds,
      highlightedIds,
      showBaselineStaircase = true,
      showScenarioPath = true,
      showTierZones = true,
      showBufferingGlyphs = true,
      showSidebar = true,
      scenarioThemes,
    }) => {
      const svgRef = useRef<SVGSVGElement>(null)
      const containerRef = useRef<HTMLDivElement>(null)
      const tooltipRef = useRef<HTMLDivElement>(null)
      const dimensions = useResizeObserver(
        containerRef as React.RefObject<HTMLElement>,
      )
      const [currentWidth, setCurrentWidth] = useState(width)
      const [currentHeight, setCurrentHeight] = useState(height)
      const [pinnedScenarioId, setPinnedScenarioId] = useState<string | null>(
        null,
      )
      const lastNotifiedIdRef = useRef<string | null>(null)
      const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
      const onHoverRef = useRef(onLineHover)
      useEffect(() => {
        onHoverRef.current = onLineHover
      }, [onLineHover])
      const onClickRef = useRef(onLineClick)
      useEffect(() => {
        onClickRef.current = onLineClick
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
        if (pinnedScenarioId && !data.some((s) => s.id === pinnedScenarioId)) {
          setPinnedScenarioId(null)
        }
      }, [data, pinnedScenarioId])

      useEffect(() => {
        return () => {
          if (hoverTimerRef.current !== null)
            clearTimeout(hoverTimerRef.current)
        }
      }, [])

      const hasComparison = !!comparisonData?.length && !!comparisonBaselineData

      const MARGIN = useMemo(
        () => ({
          top: 32,
          right: hasComparison && showSidebar ? 210 : 12,
          bottom: 48,
          left: 52,
        }),
        [hasComparison, showSidebar],
      )

      const compMap = useMemo(
        () =>
          hasComparison
            ? new Map(comparisonData!.map((s) => [s.id, s]))
            : new Map<string, VerticalParallelLineData>(),
        [hasComparison, comparisonData],
      )

      const scenarioSpreads = data.map((s) => ({
        scenario: s,
        spread: avgTierSpread(s, compMap.get(s.id), axes),
      }))

      const updateChart = useCallback(
        (w: number, h: number) => {
          if (hoverTimerRef.current !== null) {
            clearTimeout(hoverTimerRef.current)
            hoverTimerRef.current = null
          }
          if (tooltipRef.current) hideTooltip(tooltipRef.current)

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

          // --- Tier zone backgrounds ---
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

          // Alternating column shading
          const stepW = xScale.step()
          axes.forEach((axis, idx) => {
            if (idx % 2 === 1) {
              const colX = xScale(axis)!
              g.append("rect")
                .attr("x", colX - (stepW - bandW) / 2)
                .attr("y", 0)
                .attr("width", stepW)
                .attr("height", innerH)
                .attr("fill", "rgba(0,0,0,0.018)")
                .attr("pointer-events", "none")
            }
          })

          // Tier y-axis labels
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
              .text(TIER_LABELS[i] ?? "")
          })

          const sidebarHighlightActive =
            !pinnedScenarioId && highlightedIds && highlightedIds.size > 0

          const getOpacity = (id: string) => {
            if (sidebarHighlightActive) {
              return isFullOpacityDuringSidebarHighlight(
                id,
                highlightedIds,
                chosenIds,
              )
                ? 1.0
                : 0.08
            }
            if (chosenIds && chosenIds.size > 0) {
              return chosenIds.has(id) ? 0.9 : 0.25
            }
            return 0.8
          }

          const hasScenarioColors = lineColors.length > 0
          const dotR = data.length > 15 ? 3.5 : data.length > 8 ? 4.5 : 5.5
          const bracketHalfW = bandW * 0.42
          const effectiveJitter = bandW * 0.45
          const dotDiam = dotR * 2 + 1.5

          // --- Pre-compute dodge offsets ---
          const dodgeMap = new Map<string, number>()
          axes.forEach((axis) => {
            if (baselineData.values[axis] == null) return
            const entries: { id: string; y: number }[] = []
            data.forEach((scenario) => {
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
            offsets.forEach((off, id) => dodgeMap.set(`${axis}:${id}`, off))
          })

          // Build position map for path drawing
          const dotPositions = new Map<
            string,
            { cx: number; cy: number; color: string }[]
          >()

          // Create layers for proper z-ordering
          const baselineLayer = g.append("g").attr("class", "baselines")
          const rangeLayer = g.append("g").attr("class", "ranges")
          const bufferLayer = g.append("g").attr("class", "buffers")
          const pathLayer = g.append("g").attr("class", "scenario-paths")
          const dotsLayer = g.append("g").attr("class", "dots")

          // --------------- Per-column rendering ---------------
          axes.forEach((axis) => {
            const colX = xScale(axis)!
            const cx = colX + bandW / 2

            const bv = baselineData.values[axis]
            if (bv == null) return
            const baseY = yScale(toTier(bv))

            // Primary baseline bracket (solid)
            baselineLayer
              .append("line")
              .attr("x1", cx - bracketHalfW)
              .attr("y1", baseY)
              .attr("x2", cx + bracketHalfW)
              .attr("y2", baseY)
              .attr("stroke", "#2d3748")
              .attr("stroke-width", 2)
              .attr("stroke-linecap", "square")
              .attr("opacity", 0.7)
            ;[cx - bracketHalfW, cx + bracketHalfW].forEach((ex) => {
              baselineLayer
                .append("line")
                .attr("x1", ex)
                .attr("y1", baseY - 5)
                .attr("x2", ex)
                .attr("y2", baseY + 5)
                .attr("stroke", "#2d3748")
                .attr("stroke-width", 2)
                .attr("stroke-linecap", "round")
                .attr("opacity", 0.7)
            })

            // Comparison baseline bracket (dashed) + shift connector
            let compBaseY: number | null = null
            let baselineShift = 0
            if (hasComparison) {
              const cbv = comparisonBaselineData!.values[axis]
              if (cbv != null) {
                compBaseY = yScale(toTier(cbv))
                baselineShift = Math.abs(toTier(bv) - toTier(cbv))

                baselineLayer
                  .append("line")
                  .attr("x1", cx - bracketHalfW)
                  .attr("y1", compBaseY)
                  .attr("x2", cx + bracketHalfW)
                  .attr("y2", compBaseY)
                  .attr("stroke", "#90a4ae")
                  .attr("stroke-width", 2)
                  .attr("stroke-linecap", "square")
                  .attr("stroke-dasharray", "4,3")
                  .attr("opacity", 0.55)

                // Vertical connector showing baseline shift
                if (Math.abs(compBaseY - baseY) > 2) {
                  baselineLayer
                    .append("line")
                    .attr("x1", cx - bracketHalfW - 8)
                    .attr("y1", baseY)
                    .attr("x2", cx - bracketHalfW - 8)
                    .attr("y2", compBaseY)
                    .attr("stroke", "#b0bec5")
                    .attr("stroke-width", 1.5)
                    .attr("stroke-dasharray", "2,2")
                    .attr("opacity", 0.4)
                    .attr("pointer-events", "none")
                }
              }
            }

            // --- Scenario dots and range bars ---
            data.forEach((scenario, si) => {
              const pv = scenario.values[axis]
              if (pv == null) return
              const primaryY = yScale(toTier(pv))
              const opacity = getOpacity(scenario.id)
              const dodgeOff = dodgeMap.get(`${axis}:${scenario.id}`) ?? 0
              const dotCx = cx + dodgeOff
              const color = hasScenarioColors
                ? lineColors[si] || colors.default
                : colors.default

              // Track position for path drawing
              if (!dotPositions.has(scenario.id))
                dotPositions.set(scenario.id, [])
              dotPositions
                .get(scenario.id)!
                .push({ cx: dotCx, cy: primaryY, color })

              // --- Climate spread range bar ---
              if (hasComparison) {
                const compScenario = compMap.get(scenario.id)
                const cv = compScenario?.values[axis]
                if (cv != null) {
                  const compY = yScale(toTier(cv))
                  const scenarioSpread = Math.abs(toTier(pv) - toTier(cv))

                  // Vertical range bar
                  const topY = Math.min(primaryY, compY)
                  const botY = Math.max(primaryY, compY)
                  if (botY - topY > 1) {
                    rangeLayer
                      .append("line")
                      .attr("class", "range-bar")
                      .attr("data-scenario-id", scenario.id)
                      .attr("x1", dotCx)
                      .attr("y1", topY)
                      .attr("x2", dotCx)
                      .attr("y2", botY)
                      .attr("stroke", spreadColor(scenarioSpread))
                      .attr("stroke-width", 2.5)
                      .attr("stroke-opacity", opacity * 0.5)
                      .attr("stroke-linecap", "round")
                      .attr("pointer-events", "none")
                  }

                  // Comparison climate dot (open circle)
                  dotsLayer
                    .append("circle")
                    .attr("class", "comp-dot")
                    .attr("data-scenario-id", scenario.id)
                    .attr("data-axis", axis)
                    .attr("cx", dotCx)
                    .attr("cy", compY)
                    .attr("r", dotR * 0.7)
                    .attr("fill", "none")
                    .attr("stroke", color)
                    .attr("stroke-width", 1.5)
                    .attr("stroke-opacity", opacity * 0.55)
                    .attr("pointer-events", "none")

                  // --- Buffering glyph ---
                  if (
                    showBufferingGlyphs &&
                    baselineShift > 0.3 &&
                    scenarioSpread < baselineShift * 0.7
                  ) {
                    const shieldY = (topY + botY) / 2
                    bufferLayer
                      .append("circle")
                      .attr("class", "buffer-glyph")
                      .attr("data-scenario-id", scenario.id)
                      .attr("cx", dotCx + dotR + 4)
                      .attr("cy", shieldY)
                      .attr("r", 3)
                      .attr("fill", "#22aa64")
                      .attr("fill-opacity", opacity * 0.6)
                      .attr("stroke", "none")
                      .attr("pointer-events", "none")
                  }
                }
              }

              // --- Primary climate dot (filled) ---
              const dot = dotsLayer
                .append("circle")
                .attr("class", "primary-dot")
                .attr("data-scenario-id", scenario.id)
                .attr("data-axis", axis)
                .attr("cx", dotCx)
                .attr("cy", primaryY)
                .attr("r", dotR)
                .attr("fill", color)
                .attr("fill-opacity", opacity)
                .attr("stroke", color)
                .attr("stroke-width", 1.5)
                .attr("stroke-opacity", Math.min(opacity + 0.1, 1))
                .attr("cursor", "pointer")

              dot
                .on("mouseenter", function () {
                  applyFocusVisuals(scenario.id)
                  select(this)
                    .attr("r", dotR + 2.5)
                    .raise()
                  if (showScenarioPath) drawPath(scenario.id)

                  if (hoverTimerRef.current !== null) {
                    clearTimeout(hoverTimerRef.current)
                    hoverTimerRef.current = null
                  }

                  const spread = avgTierSpread(
                    scenario,
                    compMap.get(scenario.id),
                    axes,
                  )
                  const baseSpread = hasComparison
                    ? avgTierSpread(baselineData, comparisonBaselineData!, axes)
                    : 0
                  const buffering =
                    hasComparison && baseSpread > 0
                      ? Math.max(0, baseSpread - spread)
                      : 0
                  const isBuffering = buffering > 0.1

                  let html =
                    `<div style="font-weight:600;color:#1a202c;font-size:11.5px">${scenario.name}</div>` +
                    `<div style="color:#4a5568;margin-top:3px;font-size:10.5px">${axis}</div>`
                  if (hasComparison) {
                    html += `<div style="color:#4a5568;margin-top:4px;font-size:10px">Avg climate spread: <b>${spread.toFixed(2)}</b> tiers</div>`
                    if (isBuffering) {
                      html += `<div style="color:#22aa64;font-size:10px">Buffers <b>${buffering.toFixed(2)}</b> tiers vs baseline shift</div>`
                    }
                  }

                  if (tooltipRef.current) {
                    showTooltip(
                      tooltipRef.current,
                      MARGIN.left + colX + bandW / 2,
                      MARGIN.top + 6,
                      html,
                    )
                  }

                  if (lastNotifiedIdRef.current !== scenario.id) {
                    hoverTimerRef.current = setTimeout(() => {
                      hoverTimerRef.current = null
                      lastNotifiedIdRef.current = scenario.id
                      onHoverRef.current?.(scenario)
                    }, HOVER_NOTIFY_MS)
                  }
                })
                .on("mouseleave", function () {
                  if (hoverTimerRef.current !== null) {
                    clearTimeout(hoverTimerRef.current)
                    hoverTimerRef.current = null
                  }
                  if (pinnedScenarioId) {
                    applyFocusVisuals(pinnedScenarioId)
                    drawPath(pinnedScenarioId)
                  } else {
                    resetVisuals()
                    pathLayer.selectAll("*").remove()
                  }
                  if (tooltipRef.current) hideTooltip(tooltipRef.current)
                  lastNotifiedIdRef.current = null
                  onHoverRef.current?.(null)
                })
                .on("click", () => onClickRef.current?.(scenario))
                .on("dblclick", function (event: MouseEvent) {
                  event.preventDefault()
                  event.stopPropagation()
                  setPinnedScenarioId((prev) =>
                    prev === scenario.id ? null : scenario.id,
                  )
                })
            })

            // X-axis label
            const labelCx = colX + bandW / 2
            const labelLineH = 12 * 1.3
            const curated = LABEL_BREAK_POINTS[axis]
            if (curated) {
              g.append("text")
                .attr("x", labelCx)
                .attr("y", innerH + labelLineH + 2)
                .attr("text-anchor", "middle")
                .attr("font-size", 12)
                .attr("font-family", FONT_FAMILY)
                .attr("font-weight", 500)
                .attr("fill", "#4a5568")
                .text(curated[0])
              g.append("text")
                .attr("x", labelCx)
                .attr("y", innerH + labelLineH * 2 + 2)
                .attr("text-anchor", "middle")
                .attr("font-size", 12)
                .attr("font-family", FONT_FAMILY)
                .attr("font-weight", 500)
                .attr("fill", "#4a5568")
                .text(curated[1])
            } else {
              g.append("text")
                .attr("x", labelCx)
                .attr("y", innerH + labelLineH + 2)
                .attr("text-anchor", "middle")
                .attr("font-size", 12)
                .attr("font-family", FONT_FAMILY)
                .attr("font-weight", 500)
                .attr("fill", "#4a5568")
                .text(axis)
            }
          })

          // --- Baseline staircase path ---
          if (showBaselineStaircase) {
            const pts: [number, number][] = []
            axes.forEach((axis) => {
              const bv = baselineData.values[axis]
              if (bv == null) return
              const acx = (xScale(axis) ?? 0) + bandW / 2
              pts.push([acx, yScale(toTier(bv))])
            })
            if (pts.length >= 2) {
              const stairLine = line<[number, number]>()
                .x((d) => d[0])
                .y((d) => d[1])
              baselineLayer
                .append("path")
                .attr("class", "staircase")
                .attr("d", stairLine(pts) ?? "")
                .attr("fill", "none")
                .attr("stroke", "#546e7a")
                .attr("stroke-width", 1.2)
                .attr("stroke-dasharray", "6,4")
                .attr("stroke-opacity", 0.35)
                .attr("pointer-events", "none")
            }
            if (hasComparison) {
              const compPts: [number, number][] = []
              axes.forEach((axis) => {
                const cbv = comparisonBaselineData!.values[axis]
                if (cbv == null) return
                const acx = (xScale(axis) ?? 0) + bandW / 2
                compPts.push([acx, yScale(toTier(cbv))])
              })
              if (compPts.length >= 2) {
                const stairLine = line<[number, number]>()
                  .x((d) => d[0])
                  .y((d) => d[1])
                baselineLayer
                  .append("path")
                  .attr("class", "staircase-comp")
                  .attr("d", stairLine(compPts) ?? "")
                  .attr("fill", "none")
                  .attr("stroke", "#90a4ae")
                  .attr("stroke-width", 1.2)
                  .attr("stroke-dasharray", "3,3")
                  .attr("stroke-opacity", 0.3)
                  .attr("pointer-events", "none")
              }
            }
          }

          // --------------- Focus / reset helpers ---------------

          function applyFocusVisuals(focusId: string) {
            dotsLayer
              .selectAll<SVGCircleElement, unknown>("circle")
              .each(function () {
                const sid = this.getAttribute("data-scenario-id") ?? ""
                const isFocus = sid === focusId
                select(this)
                  .attr("fill-opacity", isFocus ? 1.0 : 0.08)
                  .attr("stroke-opacity", isFocus ? 1.0 : 0.08)
                  .attr(
                    "r",
                    isFocus
                      ? this.classList.contains("comp-dot")
                        ? dotR * 0.7
                        : dotR + 1.5
                      : this.classList.contains("comp-dot")
                        ? dotR * 0.5
                        : dotR * 0.7,
                  )
              })
            rangeLayer
              .selectAll<SVGLineElement, unknown>("line.range-bar")
              .each(function () {
                const sid = this.getAttribute("data-scenario-id") ?? ""
                select(this).attr(
                  "stroke-opacity",
                  sid === focusId ? 0.7 : 0.04,
                )
              })
            bufferLayer
              .selectAll<SVGCircleElement, unknown>("circle.buffer-glyph")
              .each(function () {
                const sid = this.getAttribute("data-scenario-id") ?? ""
                select(this).attr("fill-opacity", sid === focusId ? 0.8 : 0.04)
              })
          }

          function resetVisuals() {
            dotsLayer
              .selectAll<SVGCircleElement, unknown>("circle")
              .each(function () {
                const sid = this.getAttribute("data-scenario-id") ?? ""
                const op = getOpacity(sid)
                const isComp = this.classList.contains("comp-dot")
                select(this)
                  .attr("fill-opacity", isComp ? op * 0.55 : op)
                  .attr(
                    "stroke-opacity",
                    isComp ? op * 0.55 : Math.min(op + 0.1, 1),
                  )
                  .attr("r", isComp ? dotR * 0.7 : dotR)
              })
            rangeLayer
              .selectAll<SVGLineElement, unknown>("line.range-bar")
              .each(function () {
                const sid = this.getAttribute("data-scenario-id") ?? ""
                select(this).attr("stroke-opacity", getOpacity(sid) * 0.5)
              })
            bufferLayer
              .selectAll<SVGCircleElement, unknown>("circle.buffer-glyph")
              .each(function () {
                const sid = this.getAttribute("data-scenario-id") ?? ""
                select(this).attr("fill-opacity", getOpacity(sid) * 0.6)
              })
          }

          function drawPath(scenarioId: string) {
            pathLayer.selectAll("*").remove()
            if (!showScenarioPath) return
            const pts = dotPositions.get(scenarioId)
            if (!pts || pts.length < 2) return
            const pathGen = line<(typeof pts)[number]>()
              .x((d) => d.cx)
              .y((d) => d.cy)
            pathLayer
              .append("path")
              .attr("d", pathGen(pts) ?? "")
              .attr("fill", "none")
              .attr("stroke", pts[0]!.color)
              .attr("stroke-width", 1.5)
              .attr("stroke-opacity", 0.45)
              .attr("stroke-linejoin", "round")
              .attr("stroke-linecap", "round")
              .attr("pointer-events", "none")
          }

          // Apply pinned state if set
          if (pinnedScenarioId) {
            applyFocusVisuals(pinnedScenarioId)
            drawPath(pinnedScenarioId)
          } else if (highlightedIds && highlightedIds.size > 0) {
            const hId = highlightedIds.values().next().value as string
            if (hId) drawPath(hId)
          }

          // --------------- Right sidebar: resilience ranking ---------------

          if (hasComparison && showSidebar) {
            const sidebarX = innerW + 20
            const sidebarW = MARGIN.right - 30
            const sorted = [...scenarioSpreads].sort(
              (a, b) => a.spread - b.spread,
            )
            const maxSpread = Math.max(...sorted.map((s) => s.spread), 0.1)
            const barH = Math.min(14, (innerH - 24) / sorted.length - 2)
            const barScale = scaleLinear()
              .domain([0, maxSpread])
              .range([0, sidebarW - 60])

            const baseSpread = avgTierSpread(
              baselineData,
              comparisonBaselineData!,
              axes,
            )

            g.append("text")
              .attr("x", sidebarX)
              .attr("y", -14)
              .attr("font-size", 10)
              .attr("font-family", FONT_FAMILY)
              .attr("font-weight", 600)
              .attr("fill", "#2d3748")
              .text("Climate Spread")
            g.append("text")
              .attr("x", sidebarX)
              .attr("y", -3)
              .attr("font-size", 8.5)
              .attr("font-family", FONT_FAMILY)
              .attr("fill", "#718096")
              .text(`(avg tier shift, ${primaryLabel} - ${comparisonLabel})`)

            // Baseline reference line in sidebar
            const baseBarW = barScale(baseSpread)
            const sidebarStartY = 14

            sorted.forEach(({ scenario, spread }, i) => {
              const by = sidebarStartY + i * (barH + 3)
              const bw = Math.max(barScale(spread), 1)
              const isBaseline = scenario.id === baselineData.id
              const isBuffering = spread < baseSpread * 0.7

              // Background bar
              g.append("rect")
                .attr("x", sidebarX)
                .attr("y", by)
                .attr("width", bw)
                .attr("height", barH)
                .attr("fill", spreadColor(spread))
                .attr("opacity", 0.8)
                .attr("rx", 2)

              // Buffering indicator
              if (isBuffering && !isBaseline) {
                g.append("circle")
                  .attr("cx", sidebarX + bw + 10)
                  .attr("cy", by + barH / 2)
                  .attr("r", 2.5)
                  .attr("fill", "#22aa64")
                  .attr("opacity", 0.7)
              }

              const _label =
                scenario.name.length > 14
                  ? scenario.name.slice(0, 14) + ".."
                  : scenario.name
              g.append("text")
                .attr("x", sidebarX + Math.max(bw, 1) + (isBuffering ? 18 : 5))
                .attr("y", by + barH / 2)
                .attr("dominant-baseline", "middle")
                .attr("font-size", 8)
                .attr("font-family", FONT_FAMILY)
                .attr("font-weight", isBaseline ? 700 : 400)
                .attr("fill", isBaseline ? "#2d3748" : "#718096")
                .text(`${spread.toFixed(2)}${isBaseline ? " (BL)" : ""}`)

              // Hover on sidebar bar highlights in main chart
              const barRect = g
                .append("rect")
                .attr("x", sidebarX)
                .attr("y", by)
                .attr("width", sidebarW)
                .attr("height", barH)
                .attr("fill", "transparent")
                .attr("cursor", "pointer")
              barRect
                .on("mouseenter", () => {
                  applyFocusVisuals(scenario.id)
                  drawPath(scenario.id)
                })
                .on("mouseleave", () => {
                  if (pinnedScenarioId) {
                    applyFocusVisuals(pinnedScenarioId)
                    drawPath(pinnedScenarioId)
                  } else {
                    resetVisuals()
                    pathLayer.selectAll("*").remove()
                  }
                })
                .on("click", () => onClickRef.current?.(scenario))
            })

            // Baseline reference tick in sidebar
            if (baseBarW > 0) {
              const sidebarEndY = sidebarStartY + sorted.length * (barH + 3) + 2
              g.append("line")
                .attr("x1", sidebarX + baseBarW)
                .attr("y1", sidebarStartY - 3)
                .attr("x2", sidebarX + baseBarW)
                .attr("y2", sidebarEndY)
                .attr("stroke", "#2d3748")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "2,2")
                .attr("opacity", 0.4)
                .attr("pointer-events", "none")
              g.append("text")
                .attr("x", sidebarX + baseBarW)
                .attr("y", sidebarEndY + 9)
                .attr("text-anchor", "middle")
                .attr("font-size", 7.5)
                .attr("font-family", FONT_FAMILY)
                .attr("fill", "#718096")
                .text("BL")
            }
          }

          // --------------- Legend ---------------

          const legendY = -18
          let lx = 0
          const legendItem = (
            x: number,
            label: string,
            glyph: (gx: number) => void,
          ) => {
            glyph(x)
            g.append("text")
              .attr("x", x + 12)
              .attr("y", legendY)
              .attr("dominant-baseline", "middle")
              .attr("font-size", 10)
              .attr("font-family", FONT_FAMILY)
              .attr("fill", "#4a5568")
              .text(label)
            return x + 12 + label.length * 5.5 + 16
          }

          lx = legendItem(lx, primaryLabel, (x) => {
            g.append("circle")
              .attr("cx", x + 4)
              .attr("cy", legendY)
              .attr("r", 4)
              .attr("fill", colors.default)
              .attr("fill-opacity", 0.8)
          })

          if (hasComparison) {
            lx = legendItem(lx, comparisonLabel, (x) => {
              g.append("circle")
                .attr("cx", x + 4)
                .attr("cy", legendY)
                .attr("r", 3.5)
                .attr("fill", "none")
                .attr("stroke", colors.default)
                .attr("stroke-width", 1.5)
            })

            lx = legendItem(lx, "Climate spread", (x) => {
              g.append("line")
                .attr("x1", x + 4)
                .attr("y1", legendY - 6)
                .attr("x2", x + 4)
                .attr("y2", legendY + 6)
                .attr("stroke", spreadColor(1.0))
                .attr("stroke-width", 2.5)
                .attr("stroke-linecap", "round")
            })

            lx = legendItem(lx, `Baseline (${primaryLabel})`, (x) => {
              g.append("line")
                .attr("x1", x)
                .attr("y1", legendY)
                .attr("x2", x + 10)
                .attr("y2", legendY)
                .attr("stroke", "#2d3748")
                .attr("stroke-width", 2)
                .attr("stroke-linecap", "square")
            })

            lx = legendItem(lx, `Baseline (${comparisonLabel})`, (x) => {
              g.append("line")
                .attr("x1", x)
                .attr("y1", legendY)
                .attr("x2", x + 10)
                .attr("y2", legendY)
                .attr("stroke", "#90a4ae")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "4,3")
            })

            if (showBufferingGlyphs) {
              legendItem(lx, "Buffering", (x) => {
                g.append("circle")
                  .attr("cx", x + 4)
                  .attr("cy", legendY)
                  .attr("r", 3)
                  .attr("fill", "#22aa64")
                  .attr("fill-opacity", 0.7)
              })
            }
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
          pinnedScenarioId,
          comparisonBaselineData,
          showBaselineStaircase,
          showScenarioPath,
          showTierZones,
          showBufferingGlyphs,
          showSidebar,
          primaryLabel,
          comparisonLabel,
          scenarioThemes,
          hasComparison,
          compMap,
          scenarioSpreads,
          MARGIN,
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
                right: hasComparison && showSidebar ? MARGIN.right + 4 : 10,
                fontSize: 9.5,
                fontFamily: FONT_FAMILY,
                color: "#4a5568",
                zIndex: 5,
                pointerEvents: "none",
                textAlign: "right",
                maxWidth: "40%",
                lineHeight: 1.4,
                background: "rgba(255,255,255,0.85)",
                borderRadius: 6,
                padding: "3px 8px",
              }}
            >
              <span style={{ fontWeight: 600, color: "#2d3748" }}>
                {pinnedName}
              </span>
              <span style={{ color: "#a0aec0", fontSize: 8.5 }}>
                {" "}
                &middot; dbl-click to unpin
              </span>
            </div>
          )}
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
              maxWidth: 300,
              transform: "translateX(-50%)",
            }}
          />
        </div>
      )
    },
  )

ResilienceDeviationPlot.displayName = "ResilienceDeviationPlot"

export default ResilienceDeviationPlot
