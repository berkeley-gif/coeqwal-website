"use client"

import React, { useRef, useEffect, useCallback, useMemo } from "react"
import { scaleLinear, select, line, type Selection } from "d3"
import type { VerticalParallelLineData } from "./VerticalParallelLinePlot.peak"
import {
  type RadarPlotAxisLabelDetailStyle,
  mergeRadarAxisLabelDetailStyle,
  renderRadarAxisLabelDetailInto,
  RADAR_AXIS_DETAIL_SHADOW_FILTER_ID,
  RADAR_TIER_LABELS,
  RADAR_TIER_SWATCH_COLORS,
  type RadarAxisLabelDetailPayload,
  type RadarAxisLabelDetailChromeOptions,
  type RadarAxisLabelDetailPointerBridge,
  radarAxisDetailBottomModeForIndex,
} from "./radarAxisLabelDetail"

export type { RadarPlotAxisLabelDetailStyle } from "./radarAxisLabelDetail"
export type { RadarAxisLabelDetailChromeOptions } from "./radarAxisLabelDetail"

export interface RadarPlotProps {
  data: VerticalParallelLineData[]
  axes: string[]
  baselineData?: VerticalParallelLineData
  responsive?: boolean
  width?: number
  height?: number
  colors?: { default: string; highlighted: string; background: string }
  lineColors?: string[]
  /** @deprecated Prefer onDotHover which fires immediately with outcome detail. */
  onLineHover?: (data: VerticalParallelLineData | null) => void
  onLineClick?: (data: VerticalParallelLineData) => void
  /**
   * User-selected scenarios — stay fully visible even when `highlightedIds` is
   * set (e.g. sidebar row hover); see `resolveVisuals` external-highlight policy.
   */
  chosenIds?: Set<string>
  /**
   * Transient IDs to emphasize from outside the chart (sidebar / theme header
   * hover). Does not replace `chosenIds`: selected traces remain opaque.
   */
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
  /** When true, dim scenarios not in chosenIds */
  dimUnselected?: boolean
  /** Extra left offset for the tooltip (e.g. when a sidebar overlaps) */
  tooltipLeftOffset?: number
  /** When false, suppress the built-in tooltip on dot hover */
  enableTooltip?: boolean
  /** Called on dot mouseenter/mouseleave with axis-level hover info */
  onDotHover?: (
    info: { scenarioId: string; axis: string; tierValue: number } | null,
  ) => void
  /** Called after each render with pixel positions for placing info icons near axis labels */
  onAxisPositions?: (
    positions: {
      axis: string
      x: number
      y: number
      anchor: "start" | "end" | "middle"
    }[],
  ) => void
  /** External ref to access the rendered SVG element (e.g. for capture/export) */
  svgRefCallback?: (svg: SVGSVGElement | null) => void
  /**
   * Min-height (px) on the chart root when `responsive` is true. The main
   * explorer panel uses 400 so the plot does not collapse while the column
   * is still measuring. Tight embeds (share card thumbnails) should pass 0
   * so the root respects the parent height; otherwise 400 can clip or
   * scale incorrectly inside a small, overflow-hidden box.
   */
  containerMinHeight?: number
  /**
   * Typography and panel chrome for the axis-label hover detail.
   * Pass values from theme
   */
  axisLabelDetailStyle?: Partial<RadarPlotAxisLabelDetailStyle>
  /**
   * Optional HTML UI mounted at the top of the axis-label hover detail
   * (e.g. scenario checkbox + share via foreignObject).
   */
  axisLabelDetailChrome?: RadarAxisLabelDetailChromeOptions
}

function toTier(v: number): number {
  return 4 - (v + 1) * 1.5
}

const TIER_POSITIONS = [1, 2, 3, 4] as const
const TIER_BAND_COLORS = ["#ffffff", "#ffffff", "#ffffff", "#ffffff"] as const

const DEFAULT_COLORS = {
  default: "#546e7a",
  highlighted: "#1a3a5c",
  background: "#ffffff",
}
const DEFAULT_LINE_COLORS: string[] = []
const HOVER_NOTIFY_MS = 80
/** Delay before hiding axis-label detail after leaving the dot or panel (bridge cancels when entering panel). */
const AXIS_DETAIL_DISMISS_MS = 500

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
  scenarioId?: string,
) {
  el.style.display = "block"
  const tier =
    tierValue != null ? Math.min(4, Math.max(1, Math.round(tierValue))) : null
  const tierLine =
    tier != null
      ? `<div style="display:flex;align-items:center;gap:5px;margin-top:3px;color:#4a5568;font-size:10.5px">` +
        `<span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${RADAR_TIER_SWATCH_COLORS[tier]};flex-shrink:0"></span>` +
        `${RADAR_TIER_LABELS[tier - 1] ?? `Tier ${tier}`}</div>`
      : ""
  const pill = themeKey ? THEME_PILL_CONFIG[themeKey] : undefined
  const themeLine = pill
    ? `<div><span style="display:inline-block;font-size:8.5px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:${pill.text};background:${pill.bg};padding:1px 4px;border-radius:2px;line-height:1.3">${pill.label}</span></div>`
    : ""
  const idLine = scenarioId
    ? `<div style="color:#718096;font-size:10px;letter-spacing:0.03em;margin-top:2px">${scenarioId}</div>`
    : ""
  el.innerHTML =
    themeLine +
    idLine +
    `<div style="font-weight:600;color:#1a202c;font-size:11.5px;letter-spacing:0.01em;margin-top:${pill || scenarioId ? "3px" : "0"}">${scenarioName}</div>` +
    `<div style="color:#4a5568;margin-top:3px;font-size:10.5px">${outcomeName}</div>` +
    tierLine
}

function hideTooltip(el: HTMLDivElement) {
  el.style.display = "none"
}

/** Simple deterministic hash: scenario ID -> stable integer */
function stableHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return h
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

  const sorted = [...entries].sort((a, b) => {
    const rDiff = a.r - b.r
    if (Math.abs(rDiff) > minDist) return rDiff
    return stableHash(a.id) - stableHash(b.id)
  })

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

type AxisPosition = {
  axis: string
  x: number
  y: number
  anchor: "start" | "end" | "middle"
}

function axisPositionsEqual(
  a: AxisPosition[] | null,
  b: AxisPosition[] | null,
): boolean {
  if (a === b) return true
  if (!a || !b) return false
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!
    const y = b[i]!
    if (
      x.axis !== y.axis ||
      x.x !== y.x ||
      x.y !== y.y ||
      x.anchor !== y.anchor
    ) {
      return false
    }
  }
  return true
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
    chosenIds,
    highlightedIds: highlightedIdsProp,
    highlightBaseline = true,
    showScenarioPath: _showScenarioPath = true,
    showAllPaths: _showAllPaths = false,
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
    dimUnselected = false,
    tooltipLeftOffset = 0,
    enableTooltip = true,
    onDotHover,
    onAxisPositions,
    svgRefCallback,
    axisLabelDetailStyle: axisLabelDetailStyleProp,
    axisLabelDetailChrome,
    containerMinHeight = 400,
  }) => {
    const axisLabelDetailStyle = useMemo(
      () => mergeRadarAxisLabelDetailStyle(axisLabelDetailStyleProp),
      [axisLabelDetailStyleProp],
    )
    const pinnedScenarioIds = useMemo(
      () => pinnedScenarioIdsProp ?? new Set<string>(),
      [pinnedScenarioIdsProp],
    )
    const highlightedIds = useMemo(
      () => highlightedIdsProp ?? null,
      [highlightedIdsProp],
    )
    const svgRef = useRef<SVGSVGElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const tooltipRef = useRef<HTMLDivElement>(null)
    const hasAnimatedRef = useRef(false)

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

    const morphTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const lastNotifiedIdRef = useRef<string | null>(null)
    const hoverNotifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    )
    const leaveResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    )
    const axisDetailInnerHitRef = useRef<SVGGElement | null>(null)
    const cancelAxisDetailDismissRef = useRef<(() => void) | null>(null)
    /** Survives full SVG rebuild so the panel can reopen after e.g. checkbox → store → updateChart. */
    const lastOpenAxisDetailRef = useRef<{
      axis: string
      detail: RadarAxisLabelDetailPayload
    } | null>(null)

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
    const onDotHoverRef = useRef(onDotHover)
    useEffect(() => {
      onDotHoverRef.current = onDotHover
    }, [onDotHover])
    const onAxisPositionsRef = useRef(onAxisPositions)
    useEffect(() => {
      onAxisPositionsRef.current = onAxisPositions
    }, [onAxisPositions])
    const activeMapDotRef = useRef(activeMapDot)
    useEffect(() => {
      activeMapDotRef.current = activeMapDot
    }, [activeMapDot])
    // Last axis positions reported to the parent via onAxisPositions.
    // Guarding against equal repeats breaks the ResizeObserver → updateChart
    // → setState → re-render feedback loop that can trip React's
    // update-depth guard during the 700ms map-column width transition.
    const lastReportedAxisPositionsRef = useRef<AxisPosition[] | null>(null)

    const axisLabelDetailChromeRef = useRef(axisLabelDetailChrome)
    useEffect(() => {
      axisLabelDetailChromeRef.current = axisLabelDetailChrome
    }, [axisLabelDetailChrome])

    useEffect(() => {
      return () => {
        queueMicrotask(() => {
          axisLabelDetailChromeRef.current?.onBeforeSvgDomClear?.()
        })
      }
    }, [])

    useEffect(() => {
      let raf = 0
      const onMove = (e: PointerEvent) => {
        const inner = axisDetailInnerHitRef.current
        if (!inner) return
        if (raf) return
        raf = requestAnimationFrame(() => {
          raf = 0
          const stack = document.elementsFromPoint(e.clientX, e.clientY)
          if (stack.some((node) => inner.contains(node))) {
            cancelAxisDetailDismissRef.current?.()
          }
        })
      }
      window.addEventListener("pointermove", onMove, { passive: true })
      return () => {
        window.removeEventListener("pointermove", onMove)
        if (raf) cancelAnimationFrame(raf)
      }
    }, [])

    const lastDimsRef = useRef<{ width: number; height: number }>({
      width: 0,
      height: 0,
    })

    const getAngle = useCallback(
      (i: number) =>
        axes.length > 0
          ? (i / axes.length) * 2 * Math.PI - Math.PI / 2
          : -Math.PI / 2,
      [axes.length],
    )

    const updateChart = useCallback(
      (w: number, h: number) => {
        if (hoverNotifyTimerRef.current !== null) {
          clearTimeout(hoverNotifyTimerRef.current)
          hoverNotifyTimerRef.current = null
        }
        if (leaveResetTimerRef.current !== null) {
          clearTimeout(leaveResetTimerRef.current)
          leaveResetTimerRef.current = null
        }
        if (tooltipRef.current) hideTooltip(tooltipRef.current)

        const numAxes = axes.length

        // ── Snapshot for morph animation ──
        const HC_DUR = 600
        let morphSnapshot: {
          dots: Map<string, { cx: number; cy: number }>
          baselineD: string | null
          rangeD: string | null
        } | null = null

        if (shouldMorphNextRef.current) {
          shouldMorphNextRef.current = false
          const prevSvg = select(svgRef.current)
          const dots = new Map<string, { cx: number; cy: number }>()
          prevSvg
            .selectAll<SVGCircleElement, unknown>("circle.radar-dot")
            .each(function () {
              const el = select(this)
              const key = `${el.attr("data-axis")}:${el.attr("data-scenario-id")}`
              dots.set(key, {
                cx: parseFloat(el.attr("cx") ?? "0"),
                cy: parseFloat(el.attr("cy") ?? "0"),
              })
            })
          const blPath = prevSvg.select<SVGPathElement>("path.baseline-polygon")
          const rangePath = prevSvg.select<SVGPathElement>("path.range-shadow")
          morphSnapshot = {
            dots,
            baselineD: blPath.empty() ? null : blPath.attr("d"),
            rangeD: rangePath.empty() ? null : rangePath.attr("d"),
          }
        } else {
          shouldMorphNextRef.current = false
        }

        if (morphTimeoutRef.current !== null) {
          clearTimeout(morphTimeoutRef.current)
          morphTimeoutRef.current = null
        }

        // ── Full rebuild ──
        const svg = select(svgRef.current)

        const continueFullRebuild = () => {
          svg.selectAll("*").remove()
          axisDetailInnerHitRef.current = null
          if (w <= 0 || h <= 0) return

          const sh = axisLabelDetailStyle
          if (sh.panelShadowBlur > 0) {
            const filt = svg
              .append("defs")
              .append("filter")
              .attr("id", RADAR_AXIS_DETAIL_SHADOW_FILTER_ID)
              .attr("x", "-40%")
              .attr("y", "-40%")
              .attr("width", "180%")
              .attr("height", "180%")
            filt
              .append("feDropShadow")
              .attr("dx", sh.panelShadowDx)
              .attr("dy", sh.panelShadowDy)
              .attr("stdDeviation", sh.panelShadowBlur)
              .attr("flood-color", sh.panelShadowColor)
              .attr("flood-opacity", sh.panelShadowOpacity)
          }

          const MARGIN = 80
          const size = Math.min(w, h)
          const radius = (size - MARGIN * 2) / 2
          if (radius <= 0) return
          const cx = w / 2
          const cy = h / 2

          const rScale = scaleLinear().domain([4.5, 0.5]).range([0, radius])
          scalesRef.current = {
            rScale: (n: number) => rScale(n),
            cx,
            cy,
            radius,
          }

          const g = svg.append("g").attr("class", "radar-chart-root")

          const axisTitleFontWeightDefault =
            axisLabelDetailStyle.scenarioFontWeight
          const axisTitleFontWeightHover = Math.min(
            900,
            axisTitleFontWeightDefault + 200,
          )
          const setAxisLabelTitlesFontWeight = (
            axisKey: string,
            weight: number,
          ) => {
            g.selectAll("g.axis-label")
              .filter(function () {
                return (
                  (this as SVGGElement).getAttribute("data-axis") === axisKey
                )
              })
              .selectAll("text.axis-label-title")
              .attr("font-weight", weight)
          }

          const resetAllAxisLabelTitlesFontWeight = () => {
            g.selectAll("g.axis-label text.axis-label-title").attr(
              "font-weight",
              axisTitleFontWeightDefault,
            )
          }

          const hasPinned = pinnedScenarioIds.size > 0
          const hasScenarioColors = lineColors.length > 0
          const dotR = 3.5
          const DIM_OPACITY = 0.22
          const EMPHASIS_DOT_DELTA = 1.2
          const EMPHASIS_STROKE_WIDTH = 2
          /** Slightly lighter than selected emphasis — sidebar / crosshair hover trace */
          const HOVER_HIGHLIGHT_DOT_DELTA = 0.85
          const HOVER_HIGHLIGHT_STROKE_WIDTH = 1.65
          const PIN_DOT_DELTA = 1.45
          const HOVER_DOT_RADIUS_BUMP = 1.45

          const hasChosenIds = chosenIds && chosenIds.size > 0

          /**
           * External highlight (`highlightedIds`): emphasize those traces only;
           * chosen, baseline, and pinned stay at normal resting emphasis (not dimmed).
           * Chart dot hover (`focusId`) unchanged.
           */
          const selectedOrBaselineVisuals = {
            dotR: dotR + EMPHASIS_DOT_DELTA,
            opacity: 1.0,
            strokeWidth: EMPHASIS_STROKE_WIDTH,
            strokeOpacity: showDotsOnly ? DIM_OPACITY : 1.0,
          } as const
          const pinnedVisuals = {
            dotR: dotR + PIN_DOT_DELTA,
            opacity: 1.0,
            strokeWidth: EMPHASIS_STROKE_WIDTH,
            strokeOpacity: showDotsOnly ? DIM_OPACITY : 1.0,
          } as const
          const externalDimVisuals = {
            dotR: dotR * 0.7,
            opacity: DIM_OPACITY,
            strokeWidth: 1.2,
            strokeOpacity: DIM_OPACITY,
          } as const
          const hoverEmphasisVisuals = {
            dotR: dotR + HOVER_HIGHLIGHT_DOT_DELTA,
            opacity: 1.0,
            strokeWidth: HOVER_HIGHLIGHT_STROKE_WIDTH,
            strokeOpacity: showDotsOnly ? DIM_OPACITY : 1.0,
          } as const

          const resolveVisuals = (
            scenarioId: string,
            focusId?: string | null,
          ) => {
            const isFocused = focusId != null && scenarioId === focusId
            const hasExternalHighlight =
              highlightedIds != null && highlightedIds.size > 0
            const isExternallyHighlighted =
              hasExternalHighlight && highlightedIds!.has(scenarioId)
            const isSelected = hasChosenIds && chosenIds!.has(scenarioId)
            const isPinned = pinnedScenarioIds.has(scenarioId)
            const isBaseline =
              highlightBaseline &&
              baselineData != null &&
              scenarioId === baselineData.id

            const anyHighlightActive =
              focusId != null ||
              dimUnselected ||
              (dimUnpinned && hasPinned) ||
              hasExternalHighlight

            if (isFocused || isExternallyHighlighted) {
              return hoverEmphasisVisuals
            }

            if (hasExternalHighlight) {
              if (isSelected || isBaseline) return selectedOrBaselineVisuals
              if (isPinned) return pinnedVisuals
              return externalDimVisuals
            }

            if (isSelected || isBaseline) {
              return selectedOrBaselineVisuals
            }

            if (isPinned) {
              return pinnedVisuals
            }

            if (anyHighlightActive) {
              return {
                dotR: dotR * 0.7,
                opacity: DIM_OPACITY,
                strokeWidth: 1.2,
                strokeOpacity: DIM_OPACITY,
              }
            }

            if (showDotsOnly) {
              return {
                dotR,
                opacity: 1.0,
                strokeWidth: 1.2,
                strokeOpacity: DIM_OPACITY,
              }
            }

            return {
              dotR,
              opacity: 1.0,
              strokeWidth: 1.2,
              strokeOpacity: 0.55,
            }
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
              .attr("fill", "#718096")
              .attr("letter-spacing", "0.02em")
              .text(RADAR_TIER_LABELS[i] ?? "")
          })

          // Range band placeholder — drawn after dots so we can use actual positions
          const rangeBandLayer = g.append("g").attr("class", "range-band")

          // 4. Distribution dots layer
          const distributionLayer = g
            .append("g")
            .attr("class", "distribution-dots")

          // 5. Scenario path layer
          const pathLayer = g.append("g").attr("class", "scenario-paths")

          // 6. Baseline gold overlay — sibling after pathLayer so it paints above scenario traces
          const baselineHighlightLayer = g
            .append("g")
            .attr("class", "baseline-highlight")

          // 7. Dots layer
          const dotsLayer = g.append("g").attr("class", "dots")

          // 8. Highlight overlay (always above dots so the active-map ring isn't occluded)
          g.append("g").attr("class", "highlight-overlay")

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

          // Build dot positions for polygon drawing.
          // Dense array indexed by axis position; entries are null when the
          // scenario has no value on that axis. This lets the polygon
          // renderer split into open polylines around missing axes instead
          // of closing a chord across the gap.
          type DotPoint = { x: number; y: number }
          const dotPositions = new Map<string, (DotPoint | null)[]>()

          // Segment a circular dense array of points into runs of consecutive
          // non-null entries, honoring the wrap from the last index back to
          // the first. When every entry is non-null we emit a single closed
          // run (the original polygon). When any entry is null we emit one
          // open run per non-null streak; runs of length 1 carry a single
          // dot and produce no line segment. Each run also reports the
          // axis indices it covers so callers can rebuild matching paths
          // (e.g. for morph replay) keyed by axis name.
          type CircularRun = {
            points: DotPoint[]
            indices: number[]
            closed: boolean
          }
          const buildCircularRuns = (
            pts: (DotPoint | null)[],
          ): CircularRun[] => {
            const n = pts.length
            if (n === 0) return []
            if (pts.every((p) => p != null)) {
              return [
                {
                  points: pts as DotPoint[],
                  indices: pts.map((_, i) => i),
                  closed: true,
                },
              ]
            }
            const start = pts.findIndex((p) => p == null)
            const runs: { points: DotPoint[]; indices: number[] }[] = []
            let cur: { points: DotPoint[]; indices: number[] } = {
              points: [],
              indices: [],
            }
            for (let k = 1; k <= n; k++) {
              const idx = (start + k) % n
              const p = pts[idx]
              if (p == null) {
                if (cur.points.length) runs.push(cur)
                cur = { points: [], indices: [] }
              } else {
                cur.points.push(p)
                cur.indices.push(idx)
              }
            }
            if (cur.points.length) runs.push(cur)
            return runs.map((r) => ({ ...r, closed: false }))
          }

          const T_DUR = morphSnapshot
            ? HC_DUR
            : hasAnimatedRef.current
              ? 0
              : 400
          hasAnimatedRef.current = true

          const drawPolygonForScenario = (
            scenarioId: string,
            focusId?: string | null,
          ) => {
            pathLayer.selectAll(`[data-path-id="${scenarioId}"]`).remove()
            const pts = dotPositions.get(scenarioId)
            if (!pts) return
            const activeList = data
            const scenario = activeList.find((s) => s.id === scenarioId)
            if (!scenario) return
            const si = activeList.indexOf(scenario)
            const color = hasScenarioColors
              ? lineColors[si] || colors.default
              : colors.default
            const pathGen = line<DotPoint>()
              .x((d) => d.x)
              .y((d) => d.y)
            const vis = resolveVisuals(scenarioId, focusId)

            const runs = buildCircularRuns(pts)
            // Need at least one run with 2+ points to draw a line. A closed
            // run with 3+ points draws the original polygon. Open runs draw
            // one polyline each, and runs of length 1 are skipped so we
            // don't emit zero-length paths.
            runs.forEach((run) => {
              const axisKeys = run.indices.map((i) => axes[i]!).join(",")
              if (run.closed) {
                if (run.points.length < 3) return
                pathLayer
                  .append("path")
                  .attr("data-path-id", scenarioId)
                  .attr("data-axis-keys", axisKeys)
                  .attr("data-closed", "1")
                  .attr("d", pathGen([...run.points, run.points[0]!]) ?? "")
                  .attr("fill", "none")
                  .attr("stroke", color)
                  .attr("stroke-width", vis.strokeWidth)
                  .attr("stroke-opacity", vis.strokeOpacity)
                  .attr("stroke-linejoin", "round")
                  .attr("pointer-events", "none")
              } else {
                if (run.points.length < 2) return
                pathLayer
                  .append("path")
                  .attr("data-path-id", scenarioId)
                  .attr("data-axis-keys", axisKeys)
                  .attr("data-closed", "0")
                  .attr("d", pathGen(run.points) ?? "")
                  .attr("fill", "none")
                  .attr("stroke", color)
                  .attr("stroke-width", vis.strokeWidth)
                  .attr("stroke-opacity", vis.strokeOpacity)
                  .attr("stroke-linejoin", "round")
                  .attr("stroke-linecap", "round")
                  .attr("pointer-events", "none")
              }
            })
          }

          const applyFocusVisuals = (focusId: string) => {
            dotsLayer
              .selectAll<SVGCircleElement, unknown>("circle.radar-dot")
              .each(function () {
                const sid = this.getAttribute("data-scenario-id") ?? ""
                const vis = resolveVisuals(sid, focusId)
                select(this)
                  .attr("fill-opacity", vis.opacity)
                  .attr("stroke-opacity", vis.opacity)
                  .attr("r", vis.dotR)
              })
            pathLayer
              .selectAll<SVGPathElement, unknown>("path[data-path-id]")
              .each(function () {
                const el = select(this)
                const sid = el.attr("data-path-id") ?? ""
                const vis = resolveVisuals(sid, focusId)
                el.attr("stroke-width", vis.strokeWidth).attr(
                  "stroke-opacity",
                  vis.strokeOpacity,
                )
              })
          }

          const resetDotVisuals = () => {
            dotsLayer
              .selectAll<SVGCircleElement, unknown>("circle.radar-dot")
              .each(function () {
                const sid = this.getAttribute("data-scenario-id") ?? ""
                const vis = resolveVisuals(sid)
                select(this)
                  .attr("fill-opacity", vis.opacity)
                  .attr("stroke-opacity", vis.opacity)
                  .attr("r", vis.dotR)
              })
            pathLayer
              .selectAll<SVGPathElement, unknown>("path[data-path-id]")
              .each(function () {
                const el = select(this)
                const sid = el.attr("data-path-id") ?? ""
                const vis = resolveVisuals(sid)
                el.attr("stroke-width", vis.strokeWidth).attr(
                  "stroke-opacity",
                  vis.strokeOpacity,
                )
              })
          }

          const cancelAxisDetailDismiss = () => {
            if (leaveResetTimerRef.current !== null) {
              clearTimeout(leaveResetTimerRef.current)
              leaveResetTimerRef.current = null
            }
          }
          cancelAxisDetailDismissRef.current = cancelAxisDetailDismiss

          const handleAxisDetailHitTargetChange = (
            innerG: SVGGElement | null,
          ) => {
            axisDetailInnerHitRef.current = innerG
          }

          const showAxisLabelDetail = (
            axisKey: string,
            detail: RadarAxisLabelDetailPayload | null,
          ) => {
            if (detail == null) {
              lastOpenAxisDetailRef.current = null
            } else {
              lastOpenAxisDetailRef.current = { axis: axisKey, detail }
            }
            const pointerBridge: RadarAxisLabelDetailPointerBridge = {
              onHitTargetChange: handleAxisDetailHitTargetChange,
            }
            if (detail != null) {
              pointerBridge.onPanelEnter = cancelAxisDetailDismiss
              pointerBridge.onPanelLeave = () =>
                scheduleAxisDetailDismiss(axisKey)
            }
            renderRadarAxisLabelDetailInto(
              g as Selection<SVGGElement, unknown, null, undefined>,
              axisKey,
              detail,
              axisLabelDetailStyle,
              axisLabelDetailChromeRef.current,
              pointerBridge,
            )
          }

          const scheduleAxisDetailDismiss = (axisKey: string) => {
            if (leaveResetTimerRef.current !== null) {
              clearTimeout(leaveResetTimerRef.current)
            }
            leaveResetTimerRef.current = setTimeout(() => {
              leaveResetTimerRef.current = null
              resetDotVisuals()
              lastNotifiedIdRef.current = null
              onLineHoverRef.current?.(null)
              resetAllAxisLabelTitlesFontWeight()
              showAxisLabelDetail(axisKey, null)
            }, AXIS_DETAIL_DISMISS_MS)
          }

          // Render dots
          axes.forEach((axis, axisIdx) => {
            const angle = getAngle(axisIdx)
            const perpAngle = angle + Math.PI / 2

            data.forEach((scenario, si) => {
              // Ensure every scenario has a dense slot per axis so the
              // polygon renderer can detect missing values and break the
              // closing chord around the gap.
              if (!dotPositions.has(scenario.id))
                dotPositions.set(
                  scenario.id,
                  new Array(axes.length).fill(null) as (DotPoint | null)[],
                )

              const sv = scenario.values[axis]
              if (sv == null) return
              const r = rScale(toTier(sv))
              const dodgeOff = dodgeMap.get(`${axis}:${scenario.id}`) ?? 0
              const dotX =
                cx + r * Math.cos(angle) + dodgeOff * Math.cos(perpAngle)
              const dotY =
                cy + r * Math.sin(angle) + dodgeOff * Math.sin(perpAngle)
              const color = hasScenarioColors
                ? lineColors[si] || colors.default
                : colors.default

              dotPositions.get(scenario.id)![axisIdx] = { x: dotX, y: dotY }

              const vis = resolveVisuals(scenario.id)

              const oldPos = morphSnapshot?.dots.get(`${axis}:${scenario.id}`)
              const isNewInMorph = morphSnapshot != null && !oldPos
              const startCx = oldPos ? oldPos.cx : morphSnapshot ? dotX : cx
              const startCy = oldPos ? oldPos.cy : morphSnapshot ? dotY : cy
              const startR = morphSnapshot ? vis.dotR : 0
              const startOp = isNewInMorph ? 0 : vis.opacity

              const dot = dotsLayer
                .append("circle")
                .attr("class", "radar-dot")
                .attr("cx", startCx)
                .attr("cy", startCy)
                .attr("r", startR)
                .attr("fill", color)
                .attr("fill-opacity", startOp)
                .attr("stroke", "#fff")
                .attr("stroke-width", 1)
                .attr("stroke-opacity", startOp)
                .attr("cursor", "pointer")
                .attr("data-scenario-id", scenario.id)
                .attr("data-axis", axis)
                .attr("data-dodge", dodgeOff)
                .attr("data-final-cx", dotX)
                .attr("data-final-cy", dotY)

              dot
                .transition()
                .duration(T_DUR)
                .attr("cx", dotX)
                .attr("cy", dotY)
                .attr("r", vis.dotR)
                .attr("fill-opacity", vis.opacity)
                .attr("stroke-opacity", vis.opacity)

              dot
                .on("mouseenter", function () {
                  cancelAxisDetailDismiss()

                  // Entering a new dot cancels the previous dot’s leave timeout, so
                  // reset every spoke first (cross-axis moves otherwise leave stale bold).
                  resetAllAxisLabelTitlesFontWeight()

                  applyFocusVisuals(scenario.id)
                  select(this)
                    .attr("r", dotR + HOVER_DOT_RADIUS_BUMP)
                    .raise()

                  drawPolygonForScenario(scenario.id, scenario.id)

                  if (hoverNotifyTimerRef.current !== null) {
                    clearTimeout(hoverNotifyTimerRef.current)
                    hoverNotifyTimerRef.current = null
                  }

                  if (enableTooltip) {
                    const el = tooltipRef.current
                    if (el) {
                      showTooltip(
                        el,
                        scenario.name,
                        axis,
                        sv != null ? toTier(sv) : undefined,
                        scenarioThemes?.[scenario.id],
                        scenario.id,
                      )
                    }
                  }

                  onDotHoverRef.current?.({
                    scenarioId: scenario.id,
                    axis,
                    tierValue: sv != null ? toTier(sv) : 0,
                  })

                  showAxisLabelDetail(axis, {
                    scenarioId: scenario.id,
                    scenarioName: scenario.name,
                    tierIndex: Math.min(4, Math.max(1, Math.round(toTier(sv)))),
                  })
                  setAxisLabelTitlesFontWeight(axis, axisTitleFontWeightHover)

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
                  if (enableTooltip && tooltipRef.current)
                    hideTooltip(tooltipRef.current)
                  onDotHoverRef.current?.(null)

                  scheduleAxisDetailDismiss(axis)
                })
                .on("click", () => {
                  onPinnedToggleRef.current?.(scenario.id)
                  onLineClickRef.current?.(scenario)
                  onDotClickRef.current?.(scenario.id, axis)
                  showAxisLabelDetail(axis, {
                    scenarioId: scenario.id,
                    scenarioName: scenario.name,
                    tierIndex: Math.min(4, Math.max(1, Math.round(toTier(sv)))),
                  })
                })
            })
          })

          {
            const active = activeMapDotRef.current
            if (active) {
              const overlay = g.select("g.highlight-overlay")
              const dotSel = dotsLayer
                .selectAll<SVGCircleElement, unknown>("circle.radar-dot")
                .filter(function () {
                  return (
                    this.getAttribute("data-scenario-id") ===
                      active.scenarioId &&
                    this.getAttribute("data-axis") === active.axis
                  )
                })
              const node = dotSel.node()
              if (node) {
                const cell = select(node)
                const finalCx = parseFloat(
                  cell.attr("data-final-cx") ?? cell.attr("cx") ?? "0",
                )
                const finalCy = parseFloat(
                  cell.attr("data-final-cy") ?? cell.attr("cy") ?? "0",
                )
                const fill = cell.attr("fill") ?? colors.default
                const oldPos = morphSnapshot?.dots.get(
                  `${active.axis}:${active.scenarioId}`,
                )
                const sx = oldPos != null ? oldPos.cx : finalCx
                const sy = oldPos != null ? oldPos.cy : finalCy
                const baseR = 4
                const glow = overlay
                  .append("circle")
                  .attr("class", "active-map-glow")
                  .attr("cx", sx)
                  .attr("cy", sy)
                  .attr("r", baseR + 8)
                  .attr("fill", fill)
                  .attr("fill-opacity", 0.12)
                  .attr("pointer-events", "none")
                const ring = overlay
                  .append("circle")
                  .attr("class", "active-map-ring")
                  .attr("cx", sx)
                  .attr("cy", sy)
                  .attr("r", baseR + 6)
                  .attr("fill", "none")
                  .attr("stroke", fill)
                  .attr("stroke-width", 2.5)
                  .attr("stroke-opacity", 0.7)
                  .attr("pointer-events", "none")
                const copy = overlay
                  .append("circle")
                  .attr("class", "active-map-dot-copy")
                  .attr("cx", sx)
                  .attr("cy", sy)
                  .attr("r", baseR + 2)
                  .attr("fill", fill)
                  .attr("fill-opacity", 1)
                  .attr("stroke", "#fff")
                  .attr("stroke-width", 1)
                  .attr("stroke-opacity", 1)
                  .attr("pointer-events", "none")
                if (oldPos != null) {
                  glow
                    .transition()
                    .duration(HC_DUR)
                    .attr("cx", finalCx)
                    .attr("cy", finalCy)
                  ring
                    .transition()
                    .duration(HC_DUR)
                    .attr("cx", finalCx)
                    .attr("cy", finalCy)
                  copy
                    .transition()
                    .duration(HC_DUR)
                    .attr("cx", finalCx)
                    .attr("cy", finalCy)
                }
              }
            }
          }

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
              const range = axisRange![axis]
              if (!range) return

              const maxR = rScale(toTier(range.max))
              const minR = rScale(toTier(range.min))

              let maxDodge = 0
              data.forEach((scenario) => {
                const d = Math.abs(dodgeMap.get(`${axis}:${scenario.id}`) ?? 0)
                if (d > maxDodge) maxDodge = d
              })

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

          if (
            highlightBaseline &&
            baselineData &&
            data.some((s) => s.id === baselineData.id)
          ) {
            drawPolygonForScenario(baselineData.id)
          }

          if (highlightBaseline && baselineData) {
            // Dense per-axis points for the baseline so missing axes break
            // the highlighted polygon the same way scenario polygons break.
            const blDense: (DotPoint | null)[] = new Array(axes.length).fill(
              null,
            )
            axes.forEach((axis, i) => {
              const bv = baselineData.values[axis]
              if (bv == null) return
              const r = rScale(toTier(bv))
              const angle = getAngle(i)
              blDense[i] = {
                x: cx + r * Math.cos(angle),
                y: cy + r * Math.sin(angle),
              }
            })
            const blRuns = buildCircularRuns(blDense)
            if (blRuns.length > 0) {
              const pathGen = line<DotPoint>()
                .x((d) => d.x)
                .y((d) => d.y)
              const blIdx = data.findIndex((s) => s.id === baselineData.id)
              const blStroke =
                blIdx >= 0 && hasScenarioColors
                  ? lineColors[blIdx] || "#cc9a06"
                  : "#cc9a06"
              blRuns.forEach((run) => {
                const axisKeys = run.indices.map((i) => axes[i]!).join(",")
                if (run.closed) {
                  if (run.points.length < 3) return
                  baselineHighlightLayer
                    .append("path")
                    .attr("class", "baseline-polygon")
                    .attr("data-axis-keys", axisKeys)
                    .attr("data-closed", "1")
                    .attr("d", pathGen([...run.points, run.points[0]!]) ?? "")
                    .attr("fill", "#cc9a06")
                    .attr("fill-opacity", 0.12)
                    .attr("stroke", blStroke)
                    .attr("stroke-width", 2.5)
                    .attr("stroke-opacity", 0.55)
                    .attr("pointer-events", "none")
                } else {
                  if (run.points.length < 2) return
                  baselineHighlightLayer
                    .append("path")
                    .attr("class", "baseline-polygon")
                    .attr("data-axis-keys", axisKeys)
                    .attr("data-closed", "0")
                    .attr("d", pathGen(run.points) ?? "")
                    .attr("fill", "none")
                    .attr("stroke", blStroke)
                    .attr("stroke-width", 2.5)
                    .attr("stroke-opacity", 0.55)
                    .attr("stroke-linecap", "round")
                    .attr("pointer-events", "none")
                }
              })
            }
          }

          // ── Morph animation: override elements to old positions, transition ──
          if (morphSnapshot) {
            const morphPathGen = line<{ x: number; y: number }>()
              .x((d) => d.x)
              .y((d) => d.y)

            pathLayer
              .selectAll<SVGPathElement, unknown>("path[data-path-id]")
              .each(function () {
                const el = select(this)
                const sid = el.attr("data-path-id")
                if (!sid) return
                const finalD = el.attr("d")
                // Each rendered path knows which axes its run covers and
                // whether it was drawn closed; we replay only when the
                // morph snapshot has an old position on every axis in the
                // run. If anything is missing, fall back to a fade-in so
                // we never animate from a half-built shape.
                const axisKeys = (el.attr("data-axis-keys") ?? "").split(",")
                const closed = el.attr("data-closed") === "1"
                const oldPts: { x: number; y: number }[] = []
                let allOld = axisKeys.length > 0
                for (const a of axisKeys) {
                  const old = morphSnapshot!.dots.get(`${a}:${sid}`)
                  if (!old) {
                    allOld = false
                    break
                  }
                  oldPts.push({ x: old.cx, y: old.cy })
                }
                const enoughForLine = closed
                  ? oldPts.length >= 3
                  : oldPts.length >= 2
                if (allOld && enoughForLine) {
                  const oldD = closed
                    ? morphPathGen([...oldPts, oldPts[0]!])
                    : morphPathGen(oldPts)
                  el.attr("d", oldD ?? "")
                    .transition()
                    .duration(HC_DUR)
                    .attr("d", finalD ?? "")
                } else {
                  const finalOp = parseFloat(
                    el.attr("stroke-opacity") ?? "0.55",
                  )
                  el.attr("stroke-opacity", 0)
                    .transition()
                    .duration(HC_DUR)
                    .attr("stroke-opacity", finalOp)
                }
              })

            const blPath = svg.select<SVGPathElement>("path.baseline-polygon")
            if (!blPath.empty() && morphSnapshot.baselineD) {
              const finalBlD = blPath.attr("d")
              blPath
                .attr("d", morphSnapshot.baselineD)
                .transition()
                .duration(HC_DUR)
                .attr("d", finalBlD ?? "")
            }

            const rangeSel = svg.select<SVGPathElement>("path.range-shadow")
            if (!rangeSel.empty() && morphSnapshot.rangeD) {
              const finalRangeD = rangeSel.attr("d")
              rangeSel
                .attr("d", morphSnapshot.rangeD)
                .transition()
                .duration(HC_DUR)
                .attr("d", finalRangeD ?? "")
            } else if (!rangeSel.empty()) {
              rangeSel.attr("fill-opacity", 0).attr("stroke-opacity", 0)
              morphTimeoutRef.current = setTimeout(() => {
                morphTimeoutRef.current = null
                rangeSel
                  .transition()
                  .duration(HC_DUR * 0.4)
                  .attr("fill-opacity", 0.35)
                  .attr("stroke-opacity", 0.5)
              }, HC_DUR)
            }
          }

          // 8. Distribution dots.arranged along tier circle arcs
          if (
            numAxes > 0 &&
            showDistribution &&
            distributionData &&
            hasPinned
          ) {
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
          const axisPositions: {
            axis: string
            x: number
            y: number
            anchor: "start" | "end" | "middle"
          }[] = []
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
            const detailY = curated
              ? ly + axisLabelDetailStyle.detailAnchorOffsetTwoLinePx
              : ly + axisLabelDetailStyle.detailAnchorOffsetOneLinePx
            const labelGroup = g
              .append("g")
              .attr("class", "axis-label")
              .attr("data-axis", axis)
              .attr("data-label-x", lx)
              .attr("data-label-y", ly)
              .attr("data-detail-y", detailY)
              .attr("data-text-anchor", anchor)
              .attr(
                "data-detail-bottom-mode",
                radarAxisDetailBottomModeForIndex(i, axes.length),
              )

            if (curated) {
              labelGroup
                .append("text")
                .attr("class", "axis-label-title")
                .attr("x", lx)
                .attr("y", ly - 8)
                .attr("text-anchor", anchor)
                .attr("dominant-baseline", "middle")
                .attr("font-size", axisLabelDetailStyle.scenarioFontSize)
                .attr("font-family", axisLabelDetailStyle.fontFamily)
                .attr("font-weight", axisLabelDetailStyle.scenarioFontWeight)
                .attr("fill", axisLabelDetailStyle.axisTitleFill)
                .attr(
                  "letter-spacing",
                  axisLabelDetailStyle.scenarioLetterSpacing,
                )
                .text(curated[0])
              labelGroup
                .append("text")
                .attr("class", "axis-label-title")
                .attr("x", lx)
                .attr("y", ly + 8)
                .attr("text-anchor", anchor)
                .attr("dominant-baseline", "middle")
                .attr("font-size", axisLabelDetailStyle.scenarioFontSize)
                .attr("font-family", axisLabelDetailStyle.fontFamily)
                .attr("font-weight", axisLabelDetailStyle.scenarioFontWeight)
                .attr("fill", axisLabelDetailStyle.axisTitleFill)
                .attr(
                  "letter-spacing",
                  axisLabelDetailStyle.scenarioLetterSpacing,
                )
                .text(curated[1])
            } else {
              labelGroup
                .append("text")
                .attr("class", "axis-label-title")
                .attr("x", lx)
                .attr("y", ly)
                .attr("text-anchor", anchor)
                .attr("dominant-baseline", "middle")
                .attr("font-size", axisLabelDetailStyle.scenarioFontSize)
                .attr("font-family", axisLabelDetailStyle.fontFamily)
                .attr("font-weight", axisLabelDetailStyle.scenarioFontWeight)
                .attr("fill", axisLabelDetailStyle.axisTitleFill)
                .attr(
                  "letter-spacing",
                  axisLabelDetailStyle.scenarioLetterSpacing,
                )
                .text(axis)
            }

            labelGroup
              .append("g")
              .attr("class", "axis-label-detail")
              .attr("visibility", "hidden")

            axisPositions.push({
              axis,
              x: lx,
              y: ly,
              anchor: anchor as "start" | "end" | "middle",
            })
          })

          if (
            !axisPositionsEqual(
              lastReportedAxisPositionsRef.current,
              axisPositions,
            )
          ) {
            lastReportedAxisPositionsRef.current = axisPositions
            onAxisPositionsRef.current?.(axisPositions)
          }

          const reopen = lastOpenAxisDetailRef.current
          if (reopen) {
            const scenario = data.find((d) => d.id === reopen.detail.scenarioId)
            const sv = scenario?.values[reopen.axis]
            if (scenario != null && sv != null && axes.includes(reopen.axis)) {
              const tierIndex = Math.min(4, Math.max(1, Math.round(toTier(sv))))
              resetAllAxisLabelTitlesFontWeight()
              applyFocusVisuals(scenario.id)
              drawPolygonForScenario(scenario.id, scenario.id)
              showAxisLabelDetail(reopen.axis, {
                scenarioId: scenario.id,
                scenarioName: scenario.name,
                tierIndex,
              })
              setAxisLabelTitlesFontWeight(
                reopen.axis,
                axisTitleFontWeightHover,
              )
              dotsLayer
                .selectAll<SVGCircleElement, unknown>("circle.radar-dot")
                .filter(function () {
                  return (
                    this.getAttribute("data-scenario-id") === scenario.id &&
                    this.getAttribute("data-axis") === reopen.axis
                  )
                })
                .attr("r", dotR + HOVER_DOT_RADIUS_BUMP)
                .raise()
            } else {
              lastOpenAxisDetailRef.current = null
            }
          }
        }

        if (axisLabelDetailChromeRef.current?.onBeforeSvgDomClear) {
          queueMicrotask(() => {
            axisLabelDetailChromeRef.current?.onBeforeSvgDomClear?.()
            queueMicrotask(continueFullRebuild)
          })
        } else {
          continueFullRebuild()
        }
      },
      [
        data,
        axes,
        baselineData,
        lineColors,
        colors,
        highlightBaseline,
        showDotsOnly,
        dimUnselected,
        chosenIds,
        showTierZones,
        pinnedScenarioIds,
        dimUnpinned,
        axisRange,
        scenarioThemes,
        showDistribution,
        distributionData,
        getAngle,
        enableTooltip,
        axisLabelDetailStyle,
        highlightedIds,
      ],
    )

    // Keep a ref to updateChart so the ResizeObserver can call it without
    // going through React state (which would create a feedback loop).
    const updateChartRef = useRef(updateChart)
    useEffect(() => {
      updateChartRef.current = updateChart
    }, [updateChart])

    // When updateChart identity changes (props/data changed), re-run it
    // at the last known dimensions.
    useEffect(() => {
      const { width: w, height: h } = lastDimsRef.current
      if (w > 0 && h > 0) {
        updateChart(w, h)
      }
    }, [updateChart])

    // Observe container size imperatively; call updateChart directly
    // without a React state roundtrip to avoid resize → re-render loops.
    useEffect(() => {
      const el = containerRef.current
      if (!el || !responsive) return

      const ro = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (!entry) return
        const { width: w, height: h } = entry.contentRect
        const rw = Math.round(w)
        const rh = Math.round(h)
        const prev = lastDimsRef.current
        if (prev.width === rw && prev.height === rh) return
        lastDimsRef.current = { width: rw, height: rh }
        if (rw > 0 && rh > 0) {
          updateChartRef.current(rw, rh)
        }
      })

      ro.observe(el)

      const rect = el.getBoundingClientRect()
      const iw = Math.round(rect.width)
      const ih = Math.round(rect.height)
      if (iw > 0 && ih > 0) {
        lastDimsRef.current = { width: iw, height: ih }
        updateChartRef.current(iw, ih)
      }

      return () => ro.disconnect()
    }, [responsive])

    // Imperatively manage the active-map-dot highlight without
    // triggering a full SVG rebuild when the active outcome changes.
    // Glow, ring, and a copy of the dot are placed in a dedicated
    // overlay group that sits above the dots layer in SVG paint order.
    useEffect(() => {
      const svg = select(svgRef.current)
      const overlay = svg.select("g.highlight-overlay")
      if (!overlay.empty()) overlay.selectAll("*").remove()

      if (!activeMapDot) return
      if (overlay.empty()) return

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
            const dotCx = parseFloat(el.attr("data-final-cx") ?? el.attr("cx"))
            const dotCy = parseFloat(el.attr("data-final-cy") ?? el.attr("cy"))
            const fill = el.attr("fill") ?? colors.default
            const baseR = 4
            overlay
              .append("circle")
              .attr("class", "active-map-glow")
              .attr("cx", dotCx)
              .attr("cy", dotCy)
              .attr("r", baseR + 8)
              .attr("fill", fill)
              .attr("fill-opacity", 0.12)
              .attr("pointer-events", "none")
            overlay
              .append("circle")
              .attr("class", "active-map-ring")
              .attr("cx", dotCx)
              .attr("cy", dotCy)
              .attr("r", baseR + 6)
              .attr("fill", "none")
              .attr("stroke", fill)
              .attr("stroke-width", 2.5)
              .attr("stroke-opacity", 0.7)
              .attr("pointer-events", "none")
            overlay
              .append("circle")
              .attr("class", "active-map-dot-copy")
              .attr("cx", dotCx)
              .attr("cy", dotCy)
              .attr("r", baseR + 2)
              .attr("fill", fill)
              .attr("fill-opacity", 1)
              .attr("stroke", "#fff")
              .attr("stroke-width", 1)
              .attr("stroke-opacity", 1)
              .attr("pointer-events", "none")
          }
        })
    }, [activeMapDot, colors.default, data.length])

    return (
      <div
        ref={containerRef}
        style={{
          width: responsive ? "100%" : width,
          height: responsive ? "100%" : height,
          minHeight: containerMinHeight,
          position: "relative",
        }}
      >
        <svg
          ref={(el) => {
            ;(svgRef as React.MutableRefObject<SVGSVGElement | null>).current =
              el
            svgRefCallback?.(el)
          }}
          width={width}
          height={height}
          style={{ display: "block", width: "100%", height: "100%" }}
        />
        <div
          ref={tooltipRef}
          style={{
            display: "none",
            position: "absolute",
            top: 12,
            left: 12 + tooltipLeftOffset,
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
