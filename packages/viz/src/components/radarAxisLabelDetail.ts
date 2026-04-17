"use client"

import { select, type BaseType, type Selection } from "d3"

/** Typography, panel chrome, and layout for the SVG axis-label hover detail. */
export type RadarPlotAxisLabelDetailStyle = {
  /**
   * Spoke axis titles and scenario name in the hover card — use
   * `theme.typography.axisLabel`.
   */
  scenarioFontSize: string
  scenarioFontWeight: number
  /** Same source as `scenarioFontSize` (axisLabel.letterSpacing). */
  scenarioLetterSpacing: string
  tierFontSize: string
  tierFontWeight: number
  fontFamily: string
  lineGapPx: number
  panelPaddingX: number
  /** Inset from the top of the panel to the scenario title. */
  panelPaddingTop: number
  /** Inset below the last line (tier row) inside the panel. */
  panelPaddingY: number
  panelRadius: number
  /** feDropShadow on panel; set blur to 0 to disable */
  panelShadowDx: number
  panelShadowDy: number
  panelShadowBlur: number
  panelShadowColor: string
  panelShadowOpacity: number
  panelFill: string
  panelStroke: string
  scenarioFill: string
  tierFill: string
  /** Static axis title (spoke label) fill — use theme `text.primary`. */
  axisTitleFill: string
  /** Max width of the hover detail panel (SVG user units / px). */
  detailMaxWidthPx: number
  /**
   * Vertical distance from the spoke label anchor (`ly`) to the top of the
   * scenario title, when the axis uses a two-line title.
   */
  detailAnchorOffsetTwoLinePx: number
  /**
   * Same as `detailAnchorOffsetTwoLinePx` for a single-line axis title.
   */
  detailAnchorOffsetOneLinePx: number
  /** Horizontal gap between static axis title bbox and bottom-detail hover card. */
  detailBottomGapPx: number
}

/** Set from `data-detail-bottom-mode` on `g.axis-label` (see RadarPlot). */
export type RadarAxisDetailBottomMode =
  | "default"
  | "single-right"
  | "pair-left"
  | "pair-right"

/** More than 15 axes: wider bottom band of repositioned hovers. */
const RADAR_DETAIL_EXPANDED_BOTTOM_MIN_AXES = 16

/**
 * - Even N≤15: `single-right` for `i === N/2` only.
 * - Even N≥16: bottom three — `pair-right` / `single-right` / `pair-left` for
 *   `N/2-1`, `N/2`, `N/2+1`.
 * - Odd N≤15: `pair-right` / `pair-left` for the two spokes straddling 6 o'clock.
 * - Odd N≥17: bottom four — `floor(N/2)-1` … `floor(N/2)+2`, by angle vs 6 o'clock
 *   (`pair-right` if `i < N/2`, else `pair-left`).
 */
export function radarAxisDetailBottomModeForIndex(
  i: number,
  numAxes: number,
): RadarAxisDetailBottomMode {
  const n = numAxes
  if (n < 2 || i < 0 || i >= n) return "default"
  const expanded = n >= RADAR_DETAIL_EXPANDED_BOTTOM_MIN_AXES

  if (n % 2 === 0) {
    const c = n / 2
    if (expanded) {
      if (i === c - 1) return "pair-right"
      if (i === c) return "single-right"
      if (i === c + 1) return "pair-left"
      return "default"
    }
    return i === c ? "single-right" : "default"
  }

  const iLow = Math.floor(n / 2)
  if (expanded) {
    if (i >= iLow - 1 && i <= iLow + 2) {
      return i < n / 2 ? "pair-right" : "pair-left"
    }
    return "default"
  }
  if (i === iLow) return "pair-right"
  if (i === iLow + 1) return "pair-left"
  return "default"
}

function parseBottomMode(raw: string | null): RadarAxisDetailBottomMode {
  if (
    raw === "single-right" ||
    raw === "pair-left" ||
    raw === "pair-right" ||
    raw === "default"
  ) {
    return raw
  }
  return "default"
}

function unionAxisLabelTitleBBox(
  labelG: Selection<BaseType, unknown, SVGGElement, unknown>,
): { x: number; y: number; width: number; height: number } | null {
  const nodes = labelG
    .selectAll<SVGTextElement, unknown>(".axis-label-title")
    .nodes()
  if (nodes.length === 0) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const n of nodes) {
    const b = n.getBBox()
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.width)
    maxY = Math.max(maxY, b.y + b.height)
  }
  if (!Number.isFinite(minX)) return null
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

export type RadarAxisLabelDetailPayload = {
  scenarioName: string
  tierIndex: number
}

export const RADAR_AXIS_DETAIL_SHADOW_FILTER_ID = "radar-axis-detail-shadow"

export const RADAR_TIER_LABELS = [
  "Optimal",
  "Acceptable",
  "At-risk",
  "Critical",
] as const

export const RADAR_TIER_SWATCH_COLORS = [
  "",
  "#1ca367",
  "#31b2c5",
  "#f2944f",
  "#ee5d32",
] as const

const FONT_FAMILY =
  '"neue-haas-grotesk-text", Roboto, Helvetica, Arial, sans-serif'

const AXIS_DETAIL_CHIP_W = 8
const AXIS_DETAIL_CHIP_H = 8
const AXIS_DETAIL_CHIP_RX = 1.5
const AXIS_DETAIL_CHIP_TEXT_GAP = 5
/** Downward nudge so hanging-baseline tooltip text aligns with middle-baseline axis titles. */
const RADAR_DETAIL_BOTTOM_REPOSITIONED_Y_NUDGE_PX = 3
/** Extra horizontal offset beyond `detailBottomGapPx` for bottom-repositioned hovers. */
const RADAR_DETAIL_BOTTOM_REPOSITIONED_HORIZONTAL_OUTSET_PX = 5

export const DEFAULT_RADAR_AXIS_LABEL_DETAIL_STYLE: RadarPlotAxisLabelDetailStyle =
  {
    scenarioFontSize: "0.8125rem",
    scenarioFontWeight: 500,
    scenarioLetterSpacing: "0.04em",
    tierFontSize: "10px",
    tierFontWeight: 400,
    fontFamily: FONT_FAMILY,
    lineGapPx: 6,
    panelPaddingX: 9,
    panelPaddingTop: 7,
    panelPaddingY: 8,
    panelRadius: 2,
    panelShadowDx: 0,
    panelShadowDy: 0,
    panelShadowBlur: 0,
    panelShadowColor: "#000000",
    panelShadowOpacity: 0,
    panelFill: "#fcfbfa",
    panelStroke: "none",
    scenarioFill: "#1a1a1a",
    tierFill: "#1a1a1a",
    axisTitleFill: "#1a1a1a",
    detailMaxWidthPx: 200,
    detailAnchorOffsetTwoLinePx: 27,
    detailAnchorOffsetOneLinePx: 22,
    detailBottomGapPx: 8,
  }

export function mergeRadarAxisLabelDetailStyle(
  partial?: Partial<RadarPlotAxisLabelDetailStyle>,
): RadarPlotAxisLabelDetailStyle {
  if (!partial) return { ...DEFAULT_RADAR_AXIS_LABEL_DETAIL_STYLE }
  const out = { ...DEFAULT_RADAR_AXIS_LABEL_DETAIL_STYLE }
  for (const key of Object.keys(partial) as (keyof RadarPlotAxisLabelDetailStyle)[]) {
    const v = partial[key]
    if (v !== undefined) (out as Record<string, unknown>)[key as string] = v
  }
  return out
}

function measureSvgTextWidth(
  svg: SVGSVGElement | null,
  text: string,
  spec: { fontSize: string; fontFamily: string; fontWeight: number },
): number {
  if (!text) return 0
  if (!svg) return text.length * 6.5
  const t = document.createElementNS("http://www.w3.org/2000/svg", "text")
  t.setAttribute("font-size", spec.fontSize)
  t.setAttribute("font-family", spec.fontFamily)
  t.setAttribute("font-weight", String(spec.fontWeight))
  t.setAttribute("visibility", "hidden")
  t.textContent = text
  svg.appendChild(t)
  const w = t.getComputedTextLength()
  svg.removeChild(t)
  return w
}

function estimateLineHeightPx(fontSize: string): number {
  const px = /^([\d.]+)px$/i.exec(fontSize.trim())
  if (px) return Number(px[1]) * 1.35
  const rem = /^([\d.]+)rem$/i.exec(fontSize.trim())
  if (rem) return Number(rem[1]) * 16 * 1.35
  return 14 * 1.35
}

function wrapTextToLines(
  fullText: string,
  maxWidth: number,
  spec: { fontSize: string; fontFamily: string; fontWeight: number },
  svg: SVGSVGElement | null,
): string[] {
  if (maxWidth <= 0) return [fullText]
  const measure = (s: string) => measureSvgTextWidth(svg, s, spec)
  const words = fullText.split(/\s+/).filter(Boolean)
  if (words.length === 0) return [""]

  const lines: string[] = []
  let current = ""

  for (const word of words) {
    const trial = current ? `${current} ${word}` : word
    if (measure(trial) <= maxWidth) {
      current = trial
      continue
    }
    if (current) {
      lines.push(current)
      current = ""
    }
    if (measure(word) <= maxWidth) {
      current = word
      continue
    }
    let chunk = ""
    for (const ch of word) {
      const next = chunk + ch
      if (measure(next) <= maxWidth) {
        chunk = next
      } else {
        if (chunk) {
          lines.push(chunk)
          chunk = ch
          if (measure(chunk) > maxWidth) {
            lines.push(chunk)
            chunk = ""
          }
        } else {
          lines.push(ch)
        }
      }
    }
    current = chunk
  }
  if (current) lines.push(current)
  return lines
}

function ellipsizeToWidth(
  text: string,
  maxW: number,
  spec: { fontSize: string; fontFamily: string; fontWeight: number },
  svg: SVGSVGElement | null,
): string {
  if (maxW <= 0) return "…"
  if (measureSvgTextWidth(svg, text, spec) <= maxW) return text
  const ell = "…"
  let lo = 0
  let hi = text.length
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2)
    const trial = text.slice(0, mid) + ell
    if (measureSvgTextWidth(svg, trial, spec) <= maxW) lo = mid
    else hi = mid - 1
  }
  return text.slice(0, lo) + ell
}

export function renderRadarAxisLabelDetailInto(
  rootG: Selection<SVGGElement, unknown, null, undefined>,
  axis: string,
  payload: RadarAxisLabelDetailPayload | null,
  style: RadarPlotAxisLabelDetailStyle,
) {
  const clearAllDetails = () => {
    rootG.selectAll("g.axis-label-detail").each(function () {
      const dg = select(this as SVGGElement)
      dg.selectAll("*").remove()
      dg.attr("visibility", "hidden")
    })
  }

  if (payload === null) {
    rootG
      .selectAll("g.axis-label")
      .filter(function () {
        return (this as SVGGElement).getAttribute("data-axis") === axis
      })
      .select("g.axis-label-detail")
      .each(function () {
        const dg = select(this as SVGGElement)
        dg.selectAll("*").remove()
        dg.attr("visibility", "hidden")
      })
    return
  }

  clearAllDetails()

  const labelG = rootG
    .selectAll("g.axis-label")
    .filter(function () {
      return (this as SVGGElement).getAttribute("data-axis") === axis
    })

  const detailG = labelG.select("g.axis-label-detail")
  if (detailG.empty()) return

  const lx = Number(labelG.attr("data-label-x"))
  const y0 = Number(labelG.attr("data-detail-y"))
  const anchor = labelG.attr("data-text-anchor") as
    | "start"
    | "end"
    | "middle"

  detailG.attr("visibility", "visible")
  detailG.selectAll("*").remove()

  const s = style
  const bottomMode = parseBottomMode(labelG.attr("data-detail-bottom-mode"))
  const labelBBox = unionAxisLabelTitleBBox(labelG)
  const gap = s.detailBottomGapPx
  let contentX = lx
  let contentAnchor: "start" | "end" | "middle" = anchor
  const hOutset = RADAR_DETAIL_BOTTOM_REPOSITIONED_HORIZONTAL_OUTSET_PX
  if (labelBBox) {
    if (bottomMode === "single-right" || bottomMode === "pair-right") {
      contentX = labelBBox.x + labelBBox.width + gap + hOutset
      contentAnchor = "start"
    } else if (bottomMode === "pair-left") {
      contentX = labelBBox.x - gap - hOutset
      contentAnchor = "end"
    }
  }
  const isBottomRepositioned = bottomMode !== "default"
  const svgRoot = rootG.node()?.ownerSVGElement ?? null
  const tierIdx = Math.min(4, Math.max(1, payload.tierIndex))
  const tierColor = RADAR_TIER_SWATCH_COLORS[tierIdx] ?? "#718096"
  const tierText = RADAR_TIER_LABELS[tierIdx - 1] ?? `Tier ${tierIdx}`

  const inner = detailG
    .append("g")
    .attr("class", "axis-label-detail-inner")

  const padX = s.panelPaddingX
  const maxContentW = Math.max(48, s.detailMaxWidthPx - 2 * padX)
  const scenarioSpec = {
    fontSize: s.scenarioFontSize,
    fontFamily: s.fontFamily,
    fontWeight: s.scenarioFontWeight,
  }
  const tierSpec = {
    fontSize: s.tierFontSize,
    fontFamily: s.fontFamily,
    fontWeight: s.tierFontWeight,
  }

  let y = y0
  if (isBottomRepositioned) {
    const nudge = RADAR_DETAIL_BOTTOM_REPOSITIONED_Y_NUDGE_PX
    if (labelBBox) {
      y = labelBBox.y + nudge
    } else {
      const lyAttr = Number(labelG.attr("data-label-y"))
      y = Number.isFinite(lyAttr) ? lyAttr + nudge : y0
    }
  }

  const scenarioLines = wrapTextToLines(
    payload.scenarioName,
    maxContentW,
    scenarioSpec,
    svgRoot,
  )
  const scenarioLineH = estimateLineHeightPx(s.scenarioFontSize)

  const scenarioEl = inner
    .append("text")
    .attr("x", contentX)
    .attr("y", y)
    .attr("text-anchor", contentAnchor)
    .attr("dominant-baseline", "hanging")
    .attr("font-size", s.scenarioFontSize)
    .attr("font-family", s.fontFamily)
    .attr("font-weight", s.scenarioFontWeight)
    .attr("fill", s.scenarioFill)
    .attr("letter-spacing", s.scenarioLetterSpacing)

  scenarioLines.forEach((line, i) => {
    const tspan = scenarioEl.append("tspan").attr("x", contentX).text(line)
    if (i > 0) tspan.attr("dy", scenarioLineH)
  })

  y += scenarioLines.length * scenarioLineH + s.lineGapPx

  const tierMaxW = maxContentW - AXIS_DETAIL_CHIP_W - AXIS_DETAIL_CHIP_TEXT_GAP
  const tierDisplay = ellipsizeToWidth(tierText, tierMaxW, tierSpec, svgRoot)

  const tierRowW =
    AXIS_DETAIL_CHIP_W +
    AXIS_DETAIL_CHIP_TEXT_GAP +
    measureSvgTextWidth(svgRoot, tierDisplay, tierSpec)
  let rowStartX = contentX
  if (contentAnchor === "middle") rowStartX = contentX - tierRowW / 2
  if (contentAnchor === "end") rowStartX = contentX - tierRowW

  inner
    .append("rect")
    .attr("x", rowStartX)
    .attr("y", y)
    .attr("width", AXIS_DETAIL_CHIP_W)
    .attr("height", AXIS_DETAIL_CHIP_H)
    .attr("rx", AXIS_DETAIL_CHIP_RX)
    .attr("ry", AXIS_DETAIL_CHIP_RX)
    .attr("fill", tierColor)
    .attr("stroke", "rgba(0,0,0,0.08)")
    .attr("stroke-width", 0.75)

  inner
    .append("text")
    .attr("x", rowStartX + AXIS_DETAIL_CHIP_W + AXIS_DETAIL_CHIP_TEXT_GAP)
    .attr("y", y + AXIS_DETAIL_CHIP_H * 0.5)
    .attr("text-anchor", "start")
    .attr("dominant-baseline", "middle")
    .attr("font-size", s.tierFontSize)
    .attr("font-family", s.fontFamily)
    .attr("font-weight", s.tierFontWeight)
    .attr("fill", s.tierFill)
    .text(tierDisplay)

  const innerNode = inner.node() as SVGGElement
  const bbox = innerNode.getBBox()
  const padTop = s.panelPaddingTop
  const padBottom = s.panelPaddingY
  const naturalW = bbox.width + 2 * padX
  const panelW = Math.max(1, Math.min(naturalW, s.detailMaxWidthPx))
  const panelH = Math.max(1, bbox.height + padTop + padBottom)
  let panelX = bbox.x - padX
  if (contentAnchor === "end") {
    panelX = bbox.x + bbox.width + padX - panelW
  } else if (contentAnchor === "middle") {
    const mid = bbox.x + bbox.width / 2
    panelX = mid - panelW / 2
  }

  const fill = s.panelFill || DEFAULT_RADAR_AXIS_LABEL_DETAIL_STYLE.panelFill
  const panel = inner
    .insert("rect", ":first-child")
    .attr("class", "axis-label-detail-panel")
    .attr("x", panelX)
    .attr("y", bbox.y - padTop)
    .attr("width", panelW)
    .attr("height", panelH)
    .attr("rx", s.panelRadius)
    .attr("ry", s.panelRadius)
    .attr("fill", fill)

  if (s.panelStroke === "none") {
    panel.attr("stroke", "none").attr("stroke-width", 0)
  } else {
    panel.attr("stroke", s.panelStroke).attr("stroke-width", 0.75)
  }

  if (s.panelShadowBlur > 0) {
    panel.attr("filter", `url(#${RADAR_AXIS_DETAIL_SHADOW_FILTER_ID})`)
  }

  // Paint order: later siblings draw on top. Raise this axis so the hover panel
  // isn’t occluded by neighboring `g.axis-label` title text.
  labelG.raise()
}
