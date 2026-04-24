"use client"

import {
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  type RefObject,
} from "react"
import { useTheme, alpha } from "@repo/ui/mui"
import type { MotionValue } from "@repo/motion"
import {
  type ShapeMorphData,
  resampleClosedPath,
  rectPoints,
  circlePoints,
  pointsToD,
  easeInOut,
  lerp,
  POINTS_PER_SHAPE,
  SQUARE_SIZE,
  SQUARE_GAP,
} from "@repo/viz"
import { getTierLabel } from "../../../content/tiers"
import {
  ENV_FLOWS_NAMES,
  STATION_NAMES,
} from "../../map/config/outcomeLocations"
import { RESERVOIR_CALSIM_TO_GNISIDLABEL } from "../../map/config/outcomeLayerRegistry"
import {
  isSingleValueTier,
  type ChartDataPoint,
} from "../../scenarios/components/shared/types"
import {
  getTierLevelForScore,
  computeTierScore,
} from "../../scenarios/components/shared/tierScore"

export interface OutcomeGroup {
  code: string
  label: string
  polygons: ShapeMorphData[]
}

export interface LocationInfo {
  code: string
  sourceId: string
  tier: number
}

export type EncodingMode = "distribution" | "bar" | "average"

interface OutcomeMorphOverlayProps {
  outcomes: OutcomeGroup[]
  panelWidth: number
  panelHeight: number
  progress: MotionValue<number>
  /** Bridge into `OverlayMorphArbiter`. The component writes its
   *  `applyOverlayMorphFrame(v)` dispatcher into `.current` on mount
   *  and clears it on unmount; the arbiter reads through the ref on
   *  every tick. See
   *  `apps/main/app/features/scenarioExplorer/getStarted/engine/arbiters/OverlayMorphArbiter.ts`. */
  overlayMorphTickRef: RefObject<((v: number) => void) | null>
  squaresPerRow: number
  distributionPositionMap: Record<
    string,
    {
      x: number
      y: number
      maxWidth: number
      slotHeight: number
    }
  >
  onOutcomeClick?: (code: string) => void
  selectedOutcomeCode?: string | null
  interactive?: boolean
  /** All active (hovered + pinned) locations driven by the parent */
  activeLocationSet?: Map<string, LocationInfo>
  /** Currently hovered location (for ephemeral overlay tooltip) */
  hoveredLocation?: LocationInfo | null
  /** Callbacks into the shared hover/pin state machine in the parent */
  onLocationEnter?: (info: LocationInfo) => void
  onLocationLeave?: () => void
  onLocationClick?: (info: LocationInfo) => void
  /** Maps "outcomeCode:sourceId" → human-readable name from Mapbox features */
  locationNameMap?: Record<string, string>
  encodingMode?: EncodingMode
  tierChartData?: Record<string, ChartDataPoint[]>
  spotlightedTier?: number | null
  onBarClick?: (code: string, tier: number) => void
  /** Beat-driven highlight (Beat 5): a single `${code}:${sourceId}` whose
   *  distribution square gets the same gold ring as an interactive hover.
   *  Rendered regardless of `interactive` so the storyboard can drive it
   *  during non-interactive playback. */
  demoHighlightedLocationKey?: string | null
  /** Source IDs that must survive the per-outcome subsample. Any polygon
   *  whose `sourceId` is in this set is kept verbatim; the remaining quota
   *  is filled with a uniform stride over the untouched polygons. Used by
   *  the storyboard to guarantee that beat-specific LOIs (e.g. the Beat 5
   *  Glenn Colusa spotlight, the Beat 1C popup DUs) always have a square
   *  to highlight, even when `outcome.polygons.length > MAX_POLYGONS_PER_OUTCOME`. */
  mustIncludeSourceIds?: ReadonlySet<string>
}

function getLocationName(code: string, sourceId: string): string {
  if (code === "ENV_FLOWS") return ENV_FLOWS_NAMES[sourceId] ?? sourceId
  if (code === "FW_EXP" || code === "FW_DELTA_USES")
    return STATION_NAMES[sourceId] ?? sourceId
  if (code === "RES_STOR")
    return RESERVOIR_CALSIM_TO_GNISIDLABEL[sourceId] ?? sourceId
  if (code === "DELTA_ECO") return "Sacramento-San Joaquin Delta"
  return sourceId
}

export const GRID_PAD = 12
export const MAX_POLYGONS_PER_OUTCOME = 140

/** Compute pixel height of a distribution grid for layout planning. */
export function computeDistributionHeight(
  polygons: ShapeMorphData[],
  squaresPerRow: number,
  maxWidth: number,
): number {
  const cell = SQUARE_SIZE + SQUARE_GAP
  const cols = Math.min(
    squaresPerRow,
    Math.max(1, Math.floor((maxWidth - GRID_PAD * 2) / cell)),
  )
  const sampleCount = Math.min(polygons.length, MAX_POLYGONS_PER_OUTCOME)
  if (sampleCount === 0) return 0
  const step = polygons.length / sampleCount
  const byTier = new Map<number, number>()
  for (let i = 0; i < sampleCount; i++) {
    const poly = polygons[Math.floor(i * step)]!
    byTier.set(poly.tier, (byTier.get(poly.tier) ?? 0) + 1)
  }
  let totalRows = 0
  for (const count of byTier.values()) {
    totalRows += Math.ceil(count / cols)
  }
  return totalRows * cell
}

/** Tier-agnostic height: stable across hydroclimate changes (depends only on count). */
export function computeStableDistributionHeight(
  polygonCount: number,
  squaresPerRow: number,
  maxWidth: number,
): number {
  if (polygonCount === 0) return 0
  const cell = SQUARE_SIZE + SQUARE_GAP
  const cols = Math.min(
    squaresPerRow,
    Math.max(1, Math.floor((maxWidth - GRID_PAD * 2) / cell)),
  )
  const count = Math.min(polygonCount, MAX_POLYGONS_PER_OUTCOME)
  const singleTierRows = Math.ceil(count / cols)
  const tierBuffer = count > cols ? 3 : 0
  return (singleTierRows + tierBuffer) * cell
}

export const DOT_RADIUS = 8
export const GLYPH_SIZE = 60

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}

function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  const r = clamp(r1 + (r2 - r1) * t)
  const g = clamp(g1 + (g2 - g1) * t)
  const bv = clamp(b1 + (b2 - b1) * t)
  return `#${[r, g, bv].map((v) => v.toString(16).padStart(2, "0")).join("")}`
}

function computeOutcomeLayout(
  polygons: ShapeMorphData[],
  targetX: number,
  targetY: number,
  maxWidth: number,
  maxCols: number,
  slotHeight: number,
  chartPoints?: ChartDataPoint[],
  tierColors?: { tier1: string; tier2: string; tier3: string; tier4: string },
) {
  const cell = SQUARE_SIZE + SQUARE_GAP
  const cols = Math.min(
    maxCols,
    Math.max(1, Math.floor((maxWidth - GRID_PAD * 2) / cell)),
  )

  const byTier = new Map<number, ShapeMorphData[]>()
  for (const poly of polygons) {
    const list = byTier.get(poly.tier) ?? []
    list.push(poly)
    byTier.set(poly.tier, list)
  }
  const tierKeys = [...byTier.keys()].sort((a, b) => a - b)

  const isSingleValue = isSingleValueTier(chartPoints)
  const totalPolygons = polygons.length

  // Sum of the API normalized values across the four tiers. Used below to
  // express each tier's bar as a fraction of the row total, matching
  // `BarOnly` in `MorphableDistributionGlyph` (the renderer the list view
  // uses). Without this row-total normalization the storyboard bars look
  // narrower than the list view's whenever `sum(values) < 1`.
  const apiValueSum = chartPoints
    ? chartPoints.reduce((s, p) => s + (p?.value ?? 0), 0)
    : 0

  // Weighted-mean tier score. Primary source is the same
  // `computeTierScore(chartPoints)` helper the list view uses in
  // `TierSummaryCell`, which operates on the API's normalized tier values
  // returned by `useScenarioTiers`. Falls back to a count-based mean over
  // the on-screen squares only when `chartPoints` is missing (network
  // failure or still loading) so the glyph always renders something
  // sensible.
  const apiWeightedScore = computeTierScore(chartPoints)
  const countWeightedScore =
    totalPolygons > 0
      ? tierKeys.reduce(
          (sum, tier) =>
            sum + tier * (byTier.get(tier)!.length / totalPolygons),
          0,
        )
      : null
  const weightedScore = apiWeightedScore ?? countWeightedScore
  const avgTierLevel =
    weightedScore != null ? getTierLevelForScore(weightedScore) : null
  const avgColor =
    avgTierLevel != null && tierColors
      ? tierColors[`tier${avgTierLevel}` as keyof typeof tierColors]
      : null

  const gridWidth = cols * cell

  const glyphLeft = targetX + GRID_PAD + (gridWidth - GLYPH_SIZE) / 2
  const gridCenterX = targetX + GRID_PAD + gridWidth / 2

  // Bar chart and average dot are centered within the slot, not the grid
  const slotCenterY = targetY + slotHeight / 2

  const numTiers = 4
  const barHeight = (GLYPH_SIZE * 0.8) / numTiers
  const barSpacing = (GLYPH_SIZE * 0.2) / (numTiers + 1)
  const barVisualH = numTiers * barHeight + numTiers * barSpacing
  const barGlyphTop = targetY + (slotHeight - barVisualH) / 2
  const barGlyphH = barVisualH
  const maxBarWidth = GLYPH_SIZE * 0.7
  const barCornerRadius = barHeight / 4
  const barLeftX = glyphLeft + GLYPH_SIZE * 0.15

  const svRadius = DOT_RADIUS

  const dotCx = gridCenterX
  const dotCy = slotCenterY

  const results: {
    resampled: [number, number][]
    squareTarget: [number, number][]
    barTarget: [number, number][]
    dotTarget: [number, number][]
    rawD: string
    color: string
    tier: number
    sourceId: string
    averageColor: string | null
    isRepresentative: boolean
  }[] = []

  let currentRow = 0
  for (let ti = 0; ti < tierKeys.length; ti++) {
    const tier = tierKeys[ti]!
    const group = byTier.get(tier)!
    const tierRow = tier - 1 // 0-indexed position in the fixed 4-row layout

    // Bar widths derived from the same `ChartDataPoint.value` the list view
    // feeds into `OutcomeGlyphItem`, normalized by the row total exactly
    // the way `BarOnly` in `MorphableDistributionGlyph` does it (each bar
    // is a fraction of `sum(values)`, not the raw normalized value). This
    // is what makes the storyboard and list view draw identical tier
    // distributions for a given (scenario, outcome). The 2px minimum is
    // only applied when the value is positive, again matching `BarOnly`,
    // so a truly empty tier renders an empty bar rather than a sliver.
    //
    // For multi-value outcomes the count of on-screen squares is NOT
    // interchangeable with the API's normalized value: the aggregate
    // endpoint (`/tiers/scenarios/:id/tiers`) and the per-location
    // endpoint (`/tier-map/:id/locations`) can disagree on totals
    // (e.g. CWS_DEL on s0020 is 75 vs 124 locations across the two
    // endpoints), so the count-ratio fallback would render a width that
    // does not match the list view. We therefore only fall back to the
    // count ratio for single-value outcomes (which have no
    // `chartPoints`-derived bar to begin with). For multi-value
    // outcomes, if `chartPoints` is missing we render an empty bar; the
    // memo re-runs the moment `tierChartData` arrives.
    const apiVal = chartPoints?.[tier - 1]?.value
    const apiNorm =
      apiVal != null && apiValueSum > 0 ? apiVal / apiValueSum : null
    const countRatio = totalPolygons > 0 ? group.length / totalPolygons : 0
    const normVal = apiNorm ?? (isSingleValue ? countRatio : 0)
    const barW = normVal > 0 ? Math.max(2, normVal * maxBarWidth) : 0

    let barPts: [number, number][]
    if (isSingleValue) {
      barPts = circlePoints(
        gridCenterX,
        slotCenterY,
        svRadius,
        POINTS_PER_SHAPE,
      )
    } else {
      const barCx = barLeftX + barW / 2
      const barCy =
        barGlyphTop +
        barSpacing +
        tierRow * (barHeight + barSpacing) +
        barHeight / 2
      barPts = rectPoints(
        barCx,
        barCy,
        barW,
        barHeight,
        POINTS_PER_SHAPE,
        barCornerRadius,
      )
    }
    const dotPts = circlePoints(dotCx, dotCy, DOT_RADIUS, POINTS_PER_SHAPE)

    for (let i = 0; i < group.length; i++) {
      const col = i % cols
      const row = currentRow + Math.floor(i / cols)
      const gridX = targetX + GRID_PAD + col * cell + SQUARE_SIZE / 2
      const gridY = targetY + row * cell + SQUARE_SIZE / 2

      const shape = group[i]!
      const resampled =
        shape.screenShape.length === POINTS_PER_SHAPE
          ? shape.screenShape
          : resampleClosedPath(shape.screenShape, POINTS_PER_SHAPE)
      const squareTarget = rectPoints(
        gridX,
        gridY,
        SQUARE_SIZE,
        SQUARE_SIZE,
        POINTS_PER_SHAPE,
      )

      results.push({
        resampled,
        squareTarget,
        barTarget: barPts,
        dotTarget: dotPts,
        rawD: pointsToD(shape.screenShape),
        color: shape.color,
        tier: shape.tier,
        sourceId: shape.sourceId,
        averageColor: avgColor,
        isRepresentative: i === 0,
      })
    }
    currentRow += Math.ceil(group.length / cols)
  }

  return {
    shapes: results,
    isSingleValue,
    glyphMeta: {
      glyphLeft,
      barGlyphTop,
      barGlyphH,
      gridCenterX,
      gridCenterY: slotCenterY,
      numTiers,
      barHeight,
      barSpacing,
      maxBarWidth,
      barCornerRadius,
      barLeftX,
      slotHeight,
    },
  }
}

/**
 * Progress ranges for each outcome within Beat 2 (global progress 0.78–1.0).
 * Each outcome gets a slice for its polygon morph animation.
 * Morphing begins at 0.78, after the Beat 1C tier-color blend, example
 * text, and map popups have all played.
 */
/** Beat 2 is split so AG_REV morphs first (solo), then the overlay narrates
 *  "All other key outcomes...", then the remaining outcomes morph in their
 *  existing order. AG_REV gets a dedicated early window; the rest divide the
 *  tail of the progress track equally.
 *
 *  Returns the [start, end] progress window (in `progress` space, 0..1) for
 *  the morph of a given outcome. `activeCodes` lets us size the tail slice
 *  based on how many outcomes actually ended up with polygons to morph. */
export function getOutcomeProgressRange(
  code: string,
  activeCodes: readonly string[],
): [number, number] {
  // All 9 morph windows share the same width so each outcome morphs at
  // the same perceived speed. AG_REV runs first in a dedicated slot
  // ([0.38, 0.39]) after the "The colors correspond..." narrative fully
  // fades in (ending at 0.365) plus a short reading beat. A second text
  // beat ("All other key outcomes...") then plays before the remaining 8
  // morphs run back-to-back across [0.42, 0.50], each occupying a
  // 0.01-wide slice matching AG_REV's width.
  const WINDOW = 0.01
  if (code === "AG_REV") return [0.38, 0.38 + WINDOW]
  const others = activeCodes.filter((c) => c !== "AG_REV")
  const beatStart = 0.42
  const beatEnd = 0.5
  const slice = (beatEnd - beatStart) / Math.max(others.length, 1)
  const i = others.indexOf(code)
  if (i < 0) return [beatStart, beatEnd]
  const start = beatStart + i * slice
  return [start, start + slice]
}

export default function OutcomeMorphOverlay({
  outcomes,
  panelWidth,
  panelHeight,
  progress,
  overlayMorphTickRef,
  squaresPerRow,
  distributionPositionMap,
  onOutcomeClick,
  selectedOutcomeCode,
  interactive,
  activeLocationSet,
  hoveredLocation,
  onLocationEnter,
  onLocationLeave,
  onLocationClick,
  locationNameMap,
  encodingMode = "distribution",
  tierChartData,
  spotlightedTier,
  onBarClick,
  demoHighlightedLocationKey = null,
  mustIncludeSourceIds,
}: OutcomeMorphOverlayProps) {
  const theme = useTheme()
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRefsMap = useRef<Map<string, (SVGPathElement | null)[]>>(new Map())
  const chromeRefsMap = useRef<Map<string, SVGGElement | null>>(new Map())
  const radarChromeRef = useRef<SVGGElement | null>(null)
  const heatmapChromeRef = useRef<SVGGElement | null>(null)

  const outcomeShapes = useMemo(() => {
    const panelLeft = panelWidth * (2 / 3)
    const activeCodes = outcomes.map((o) => o.code)

    return outcomes.map((outcome) => {
      const sampled =
        outcome.polygons.length > MAX_POLYGONS_PER_OUTCOME
          ? (() => {
              // Seed the kept set with any explicitly required source IDs so
              // beat-driven highlights (Beat 5 LOI, Beat 1C popup DUs) never
              // get silently culled by the stride sampler. Then fill the
              // remaining quota with a uniform stride over the polygons that
              // weren't already pinned, preserving the roughly even visual
              // distribution the uniform sampler was providing.
              const keptIndices = new Set<number>()
              const pinned: ShapeMorphData[] = []
              if (mustIncludeSourceIds && mustIncludeSourceIds.size > 0) {
                for (let i = 0; i < outcome.polygons.length; i++) {
                  const p = outcome.polygons[i]!
                  if (mustIncludeSourceIds.has(p.sourceId)) {
                    keptIndices.add(i)
                    pinned.push(p)
                    if (pinned.length >= MAX_POLYGONS_PER_OUTCOME) break
                  }
                }
              }
              const remaining = MAX_POLYGONS_PER_OUTCOME - pinned.length
              if (remaining <= 0) return pinned
              // Build the pool of candidates (indices not already pinned) and
              // stride across it so gaps between kept squares stay even.
              const pool: number[] = []
              for (let i = 0; i < outcome.polygons.length; i++) {
                if (!keptIndices.has(i)) pool.push(i)
              }
              const step = pool.length / remaining
              const strided: ShapeMorphData[] = Array.from(
                { length: remaining },
                (_, i) => outcome.polygons[pool[Math.floor(i * step)]!]!,
              )
              return [...pinned, ...strided]
            })()
          : outcome.polygons

      const pos = distributionPositionMap[outcome.code]
      const gridTargetX = panelLeft + (pos?.x ?? 24)
      const gridTargetY = pos?.y ?? 0
      const maxColWidth = pos?.maxWidth ?? panelWidth * (1 / 3) - 48
      const outcomeSlotHeight = pos?.slotHeight ?? 0

      const chartPoints = tierChartData?.[outcome.code]
      const hasData = chartPoints !== undefined && chartPoints.length > 0
      const tierColors = theme.palette.tiers

      const layout = computeOutcomeLayout(
        sampled,
        gridTargetX,
        gridTargetY,
        maxColWidth,
        squaresPerRow,
        outcomeSlotHeight,
        chartPoints,
        tierColors,
      )
      const shapes = layout.shapes

      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity
      for (const s of shapes) {
        for (const [px, py] of s.squareTarget) {
          if (px < minX) minX = px
          if (py < minY) minY = py
          if (px > maxX) maxX = px
          if (py > maxY) maxY = py
        }
      }
      const pad = SQUARE_SIZE / 2
      const boundsTop = shapes.length > 0 ? minY - pad : gridTargetY
      const boundsBottom =
        shapes.length > 0 ? maxY + pad : gridTargetY + outcomeSlotHeight
      const boundsLeft = shapes.length > 0 ? minX - pad : gridTargetX
      const boundsRight =
        shapes.length > 0
          ? Math.max(maxX + pad, gridTargetX + maxColWidth)
          : gridTargetX + maxColWidth
      const bounds = {
        x: boundsLeft,
        y: boundsTop,
        width: boundsRight - boundsLeft,
        height: Math.max(1, boundsBottom - boundsTop),
      }

      return {
        code: outcome.code,
        shapes,
        isSingleValue: layout.isSingleValue,
        hasData,
        glyphMeta: layout.glyphMeta,
        bounds,
        progressRange: getOutcomeProgressRange(outcome.code, activeCodes),
      }
    })
  }, [
    outcomes,
    panelWidth,
    squaresPerRow,
    distributionPositionMap,
    tierChartData,
    theme.palette.tiers,
    mustIncludeSourceIds,
  ])

  /* ── Radar geometry (Beat 7) ──
   *
   * Each outcome's representative shapes converge to a single vertex on
   * a radar chart during Beat 7. The center sits in the middle of the
   * right third of the panel (where the distribution glyphs live). rMax
   * is sized to leave room for HTML labels at the edge.
   *
   * Per-outcome vertex:
   *   angle   = (2π * i) / N - π/2    (first outcome at top)
   *   radius  = rMax * normalizedAvg   (tier 1 = inner, tier 4 = outer)
   *
   * All shapes in an outcome share the same `radarTarget`, so the
   * converging "dot" in average mode migrates as one to its vertex.
   * Non-representative shapes are invisible in average mode, so only
   * one dot per outcome is actually drawn at the vertex. */
  const radarGeometry = useMemo(() => {
    const N = outcomeShapes.length
    const panelLeft = panelWidth * (2 / 3)
    const rightWidth = panelWidth - panelLeft
    const cx = panelLeft + rightWidth / 2
    const cy = panelHeight / 2
    const rMax = Math.min(rightWidth / 2, panelHeight / 2) * 0.6

    const vertices: Array<{
      code: string
      cx: number
      cy: number
      angle: number
      radius: number
    }> = []
    for (let i = 0; i < N; i++) {
      const group = outcomeShapes[i]!
      const rep =
        group.shapes.find((s) => s.isRepresentative) ?? group.shapes[0]
      const tier = rep?.tier ?? 2
      const normAvg = Math.max(0.2, tier / 4)
      const angle = (2 * Math.PI * i) / Math.max(N, 1) - Math.PI / 2
      const radius = rMax * normAvg
      vertices.push({
        code: group.code,
        cx: cx + radius * Math.cos(angle),
        cy: cy + radius * Math.sin(angle),
        angle,
        radius,
      })
    }
    return { cx, cy, rMax, vertices }
  }, [outcomeShapes, panelWidth, panelHeight])

  /** Per-shape `radarTarget`: every shape in an outcome shares the
   *  outcome's vertex position. Used only in the [0.75, 0.82] window
   *  during Beat 7. */
  const radarTargetsByCode = useMemo(() => {
    const map = new Map<string, [number, number][]>()
    for (const v of radarGeometry.vertices) {
      map.set(v.code, circlePoints(v.cx, v.cy, DOT_RADIUS, POINTS_PER_SHAPE))
    }
    return map
  }, [radarGeometry])

  /* ── Heatmap geometry (Beat 8) ──
   *
   * A single hydroclimate (`s0020`), so the heatmap is a
   * single column with one cell per outcome. Cells stack vertically
   * centered in the right third of the panel, sized to fit. The layout
   * generalizes trivially to multiple columns when additional
   * hydroclimates are added.
   *
   * Each cell target is a rect the size of `cellW x cellH`, centered on
   * `(heatCx, cellCy_i)`. The rep shape in each outcome morphs from the
   * radar vertex (circle at polar coordinate) to the cell rectangle. */
  const heatmapGeometry = useMemo(() => {
    const N = outcomeShapes.length
    const panelLeft = panelWidth * (2 / 3)
    const rightWidth = panelWidth - panelLeft
    const heatCx = panelLeft + rightWidth / 2
    const cellW = Math.min(120, rightWidth * 0.35)
    const availableH = panelHeight * 0.8
    const cellH = Math.min(44, availableH / Math.max(N, 1))
    const totalH = N * cellH
    const columnTop = panelHeight / 2 - totalH / 2

    const cells: Array<{
      code: string
      cx: number
      cy: number
      w: number
      h: number
    }> = []
    for (let i = 0; i < N; i++) {
      const group = outcomeShapes[i]!
      const cy = columnTop + (i + 0.5) * cellH
      cells.push({ code: group.code, cx: heatCx, cy, w: cellW, h: cellH })
    }
    return { heatCx, columnTop, cellW, cellH, cells }
  }, [outcomeShapes, panelWidth, panelHeight])

  /** Per-shape `heatmapTarget`: a rectangle sized to the outcome's
   *  heatmap cell. All shapes in an outcome share the same target (only
   *  the representative shape is visible in average/radar/heatmap
   *  modes, so non-reps collapse onto the same cell invisibly). */
  const heatmapTargetsByCode = useMemo(() => {
    const map = new Map<string, [number, number][]>()
    for (const cell of heatmapGeometry.cells) {
      map.set(
        cell.code,
        rectPoints(cell.cx, cell.cy, cell.w, cell.h, POINTS_PER_SHAPE),
      )
    }
    return map
  }, [heatmapGeometry])

  const hoverTooltip = useMemo(() => {
    if (!hoveredLocation) return null
    const group = outcomeShapes.find((g) => g.code === hoveredLocation.code)
    if (!group) return null
    const shape = group.shapes.find(
      (s) => s.sourceId === hoveredLocation.sourceId,
    )
    if (!shape) return null

    let cx = 0,
      cy = 0
    for (const [px, py] of shape.squareTarget) {
      cx += px
      cy += py
    }
    cx /= shape.squareTarget.length
    cy /= shape.squareTarget.length

    return {
      x: cx,
      y: cy - SQUARE_SIZE / 2 - 4,
      name:
        locationNameMap?.[
          `${hoveredLocation.code}:${hoveredLocation.sourceId}`
        ] ?? getLocationName(hoveredLocation.code, hoveredLocation.sourceId),
      tierLevel: hoveredLocation.tier,
      tier: getTierLabel(hoveredLocation.tier),
      color: shape.color,
    }
  }, [hoveredLocation, outcomeShapes, locationNameMap])

  const prevEncodingRef = useRef<EncodingMode>("distribution")
  const encodingMorphRef = useRef(1)
  const encodingFromRef = useRef<EncodingMode>("distribution")
  const encodingRafRef = useRef<number | null>(null)
  const tierChangeRafRef = useRef<number | null>(null)

  type ShapeSnapshot = {
    target: [number, number][]
    color: string
    tier: number
  }
  const prevShapeSnapshotRef = useRef<Map<
    string,
    Map<string, ShapeSnapshot>
  > | null>(null)

  const getTargetForMode = useCallback(
    (
      shape: (typeof outcomeShapes)[number]["shapes"][number],
      mode: EncodingMode,
    ) => {
      switch (mode) {
        case "bar":
          return shape.barTarget
        case "average":
          return shape.dotTarget
        default:
          return shape.squareTarget
      }
    },
    [],
  )

  const getColorForMode = useCallback(
    (
      shape: (typeof outcomeShapes)[number]["shapes"][number],
      mode: EncodingMode,
    ) => {
      if (mode === "average" && shape.averageColor) return shape.averageColor
      return shape.color
    },
    [],
  )

  // --- Hydroclimate tier-change transition (distribution mode only) ---
  useLayoutEffect(() => {
    // Snapshot current state for distribution mode
    const snapshot = new Map<string, Map<string, ShapeSnapshot>>()
    for (const group of outcomeShapes) {
      const m = new Map<string, ShapeSnapshot>()
      for (const shape of group.shapes) {
        m.set(shape.sourceId, {
          target: shape.squareTarget,
          color: shape.color,
          tier: shape.tier,
        })
      }
      snapshot.set(group.code, m)
    }
    const prevSnapshot = prevShapeSnapshotRef.current
    prevShapeSnapshotRef.current = snapshot

    if (
      !prevSnapshot ||
      progress.get() < 1 ||
      encodingMode !== "distribution" ||
      encodingRafRef.current != null
    )
      return

    // Check if anything changed
    let changed = false
    outer: for (const group of outcomeShapes) {
      const oldGroup = prevSnapshot.get(group.code)
      if (!oldGroup) continue
      for (const shape of group.shapes) {
        const old = oldGroup.get(shape.sourceId)
        if (old && old.color !== shape.color) {
          changed = true
          break outer
        }
      }
    }
    if (!changed) return

    if (tierChangeRafRef.current != null) {
      cancelAnimationFrame(tierChangeRafRef.current)
    }

    // Step 1: Color change in place (changed squares fade to new tier color)
    // Step 2: All squares glide from old position to new position
    const COLOR_FADE = 600
    const PAUSE_END = COLOR_FADE + 300
    const SLIDE_DURATION = 600
    const SLIDE_END = PAUSE_END + SLIDE_DURATION
    const TOTAL = SLIDE_END

    // Pin all shapes to old positions
    for (const group of outcomeShapes) {
      const refs = pathRefsMap.current.get(group.code)
      if (!refs) continue
      const oldGroup = prevSnapshot.get(group.code)
      for (let i = 0; i < group.shapes.length; i++) {
        const el = refs[i]
        if (!el) continue
        const shape = group.shapes[i]!
        const old = oldGroup?.get(shape.sourceId)
        if (!old) continue
        el.setAttribute("d", pointsToD(old.target))
        el.setAttribute("fill", old.color)
      }
    }

    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const colorT = easeInOut(Math.min(1, elapsed / COLOR_FADE))
      const slideT =
        elapsed <= PAUSE_END
          ? 0
          : easeInOut(Math.min(1, (elapsed - PAUSE_END) / SLIDE_DURATION))

      for (const group of outcomeShapes) {
        const refs = pathRefsMap.current.get(group.code)
        if (!refs) continue
        const oldGroup = prevSnapshot.get(group.code)

        for (let i = 0; i < group.shapes.length; i++) {
          const el = refs[i]
          if (!el) continue
          const shape = group.shapes[i]!
          const old = oldGroup?.get(shape.sourceId)
          if (!old) continue

          const tierChanged = old.tier !== shape.tier

          // Step 1: color fade (only changed squares)
          if (tierChanged && old.color !== shape.color) {
            el.setAttribute("fill", lerpColor(old.color, shape.color, colorT))
          }

          // Step 2: all squares glide to new position
          if (slideT > 0) {
            const pts = old.target.map((a, pi) =>
              lerp(a, shape.squareTarget[pi]!, slideT),
            )
            el.setAttribute("d", pointsToD(pts))
          }
        }
      }

      if (elapsed < TOTAL) {
        tierChangeRafRef.current = requestAnimationFrame(tick)
      } else {
        tierChangeRafRef.current = null
        for (const group of outcomeShapes) {
          const refs = pathRefsMap.current.get(group.code)
          if (!refs) continue
          for (let i = 0; i < group.shapes.length; i++) {
            const el = refs[i]
            if (!el) continue
            const shape = group.shapes[i]!
            el.setAttribute("d", pointsToD(shape.squareTarget))
            el.setAttribute("fill", shape.color)
            el.style.opacity = "1"
          }
        }
      }
    }

    tierChangeRafRef.current = requestAnimationFrame(tick)

    return () => {
      if (tierChangeRafRef.current != null) {
        cancelAnimationFrame(tierChangeRafRef.current)
        tierChangeRafRef.current = null
      }
    }
  }, [outcomeShapes, encodingMode, progress])

  // --- Encoding-mode transition ---
  useLayoutEffect(() => {
    if (prevEncodingRef.current !== encodingMode && progress.get() >= 1) {
      // Cancel any tier-change animation so encoding takes over
      if (tierChangeRafRef.current != null) {
        cancelAnimationFrame(tierChangeRafRef.current)
        tierChangeRafRef.current = null
      }

      const fromMode = prevEncodingRef.current
      encodingFromRef.current = fromMode
      encodingMorphRef.current = 0
      prevEncodingRef.current = encodingMode

      const toBarOrAvg = encodingMode === "bar" || encodingMode === "average"
      const fromBarOrAvg = fromMode === "bar" || fromMode === "average"
      const toBar = encodingMode === "bar"
      const fromBar = fromMode === "bar"

      const startTime = performance.now()
      const duration = 500

      const tick = (now: number) => {
        const elapsed = now - startTime
        const t = Math.min(1, elapsed / duration)
        const eased = easeInOut(t)
        encodingMorphRef.current = eased

        for (const group of outcomeShapes) {
          const refs = pathRefsMap.current.get(group.code)
          if (!refs) continue

          const chromeEl = chromeRefsMap.current.get(group.code)
          if (chromeEl) {
            if (toBar && !fromBar) {
              chromeEl.style.opacity = String(eased)
            } else if (!toBar && fromBar) {
              chromeEl.style.opacity = String(1 - eased)
            }
          }

          for (let i = 0; i < group.shapes.length; i++) {
            const el = refs[i]
            if (!el) continue
            const shape = group.shapes[i]!

            const from = getTargetForMode(shape, fromMode)
            const to = getTargetForMode(shape, encodingMode)
            const pts = from.map((a, pi) => lerp(a, to[pi]!, eased))
            el.setAttribute("d", pointsToD(pts))

            const fromColor = getColorForMode(shape, fromMode)
            const toColor = getColorForMode(shape, encodingMode)
            if (fromColor !== toColor) {
              el.setAttribute("fill", lerpColor(fromColor, toColor, eased))
            }

            if (!shape.isRepresentative) {
              if (toBarOrAvg && !fromBarOrAvg) {
                el.style.opacity = String(1 - eased)
              } else if (!toBarOrAvg && fromBarOrAvg) {
                el.style.opacity = String(eased)
              }
            } else {
              if (toBar) {
                const startOp = fromBar ? 0.8 : 0.9
                el.setAttribute(
                  "fill-opacity",
                  String(startOp + (0.8 - startOp) * eased),
                )
              } else if (fromBar) {
                el.setAttribute(
                  "fill-opacity",
                  String(0.8 + (0.9 - 0.8) * eased),
                )
              }
            }

            if (toBarOrAvg && !fromBarOrAvg) {
              el.setAttribute("stroke-opacity", String(0.4 * (1 - eased)))
            } else if (!toBarOrAvg && fromBarOrAvg) {
              el.setAttribute("stroke-opacity", String(0.4 * eased))
            }
          }
        }

        if (t < 1) {
          encodingRafRef.current = requestAnimationFrame(tick)
        } else {
          for (const group of outcomeShapes) {
            const refs = pathRefsMap.current.get(group.code)
            if (!refs) continue

            const chromeEl = chromeRefsMap.current.get(group.code)
            if (chromeEl) {
              chromeEl.style.opacity = toBar ? "1" : "0"
            }

            for (let i = 0; i < group.shapes.length; i++) {
              const el = refs[i]
              if (!el) continue
              const shape = group.shapes[i]!
              el.setAttribute("fill", getColorForMode(shape, encodingMode))

              if (!shape.isRepresentative && toBarOrAvg) {
                el.style.opacity = "0"
              } else {
                el.style.opacity = "1"
              }

              if (toBar && shape.isRepresentative) {
                el.setAttribute("fill-opacity", "0.8")
              } else if (!toBarOrAvg) {
                el.removeAttribute("fill-opacity")
              }

              el.setAttribute("stroke-opacity", toBarOrAvg ? "0" : "0.4")
            }
          }
          encodingRafRef.current = null
        }
      }
      encodingRafRef.current = requestAnimationFrame(tick)
    } else {
      prevEncodingRef.current = encodingMode
    }

    return () => {
      if (encodingRafRef.current != null) {
        cancelAnimationFrame(encodingRafRef.current)
        encodingRafRef.current = null
      }
    }
  }, [encodingMode, outcomeShapes, progress, getTargetForMode, getColorForMode])

  /* ── Overlay-morph frame applier (beat-engine bridge) ──
   *
   * Replaces the previous `progress.on("change")` subscriber with a
   * latest-callback ref invoked by the engine's `OverlayMorphArbiter`
   * every tick. See `engine/arbiters/OverlayMorphArbiter.ts` for the
   * bridge rationale. Per StorybookEngineHardeningPlanV2 invariant 4,
   * the engine is the only `progress.on("change")` subscriber in
   * the storyboard.
   *
   * `latestMorphFrameRef` is updated on every render via the
   * assignment below so closures over `outcomeShapes`, `encodingMode`,
   * `getTargetForMode`, etc. always reflect the latest render. The
   * bridge-register effect further down writes a stable dispatcher
   * into `overlayMorphTickRef.current`. A separate dep-driven
   * re-sync effect preserves the legacy `useLayoutEffect`'s eager
   * `handler(progress.get())` on each data change (needed so shape
   * and encoding-mode updates between progress ticks visually
   * apply immediately). */
  const latestMorphFrameRef = useRef<(v: number) => void>(() => {})
  latestMorphFrameRef.current = (v: number) => {
    const isBarOrAvg = encodingMode === "bar" || encodingMode === "average"
    const isBar = encodingMode === "bar"

    // Beat 6+ morph chain driven by progress, applied once all outcomes
    // have settled as squares (post-Beat 2 morphEnd):
    //   [0.62, 0.68] squareTarget -> barTarget     (barBlend, easeOutCubic)
    //   [0.68, 0.72] bars hold at final pose       (settled plateau)
    //   [0.72, 0.75] barTarget    -> dotTarget     (avgBlend)
    //   [0.75, 0.82] dotTarget    -> radarTarget   (radarBlend)
    //   [0.82, 0.87] radar chrome fades in         (radarChromeIn)
    //   [0.87, 0.90] radar chrome fades out        (radarChromeOut)
    //   [0.87, 0.95] radarTarget  -> heatmapTarget (heatmapBlend)
    //   [0.95, 1.00] heatmap chrome fades in       (heatmapChromeBlend)
    // The bar morph uses a tightened window and a front-loaded easeOutCubic
    // so it feels snappy under both auto-play and scroll, recovering the
    // perceived tempo of the legacy switcher-driven 500ms RAF morph while
    // preserving v-deterministic scrubbing. The remaining blends keep the
    // shared easeInOut for continuity with the rest of the chain.
    // Runs regardless of the `encodingMode` prop (which defaults to
    // "distribution" during non-interactive playback), so the storyboard
    // can drive the transforms independently of the post-settle user
    // toggle that still animates via the 500ms encoding-mode RAF above.
    const BEAT6_START = 0.62
    const BEAT6_BAR_END = 0.68
    const BEAT6_END = 0.72
    const BEAT7_AVG_END = 0.75
    const BEAT7_RADAR_END = 0.82
    const BEAT7_CHROME_END = 0.87
    const BEAT8_CHROME_OUT_END = 0.9
    const BEAT8_CELL_END = 0.95
    const BEAT8_CHROME_IN_END = 1.0

    const computeBlends = (v: number) => {
      const clampRange = (lo: number, hi: number) =>
        v <= lo ? 0 : v >= hi ? 1 : easeInOut((v - lo) / (hi - lo))
      const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
      const clampRangeEaseOut = (lo: number, hi: number) =>
        v <= lo ? 0 : v >= hi ? 1 : easeOutCubic((v - lo) / (hi - lo))
      const radarChromeIn = clampRange(BEAT7_RADAR_END, BEAT7_CHROME_END)
      const radarChromeOut = clampRange(BEAT7_CHROME_END, BEAT8_CHROME_OUT_END)
      return {
        barBlend: clampRangeEaseOut(BEAT6_START, BEAT6_BAR_END),
        avgBlend: clampRange(BEAT6_END, BEAT7_AVG_END),
        radarBlend: clampRange(BEAT7_AVG_END, BEAT7_RADAR_END),
        radarChromeBlend: radarChromeIn * (1 - radarChromeOut),
        heatmapBlend: clampRange(BEAT7_CHROME_END, BEAT8_CELL_END),
        heatmapChromeBlend: clampRange(BEAT8_CELL_END, BEAT8_CHROME_IN_END),
      }
    }

    if (encodingRafRef.current != null) return
    if (tierChangeRafRef.current != null) return

    const {
      barBlend,
      avgBlend,
      radarBlend,
      radarChromeBlend,
      heatmapBlend,
      heatmapChromeBlend,
    } = computeBlends(v)

    // Update radar chrome opacity once per tick. (Rises in Beat 7,
    // falls at the start of Beat 8.)
    const radarChromeEl = radarChromeRef.current
    if (radarChromeEl) {
      radarChromeEl.style.opacity = String(radarChromeBlend)
    }

    // Update heatmap chrome opacity (outcome-label column, etc.).
    const heatmapChromeEl = heatmapChromeRef.current
    if (heatmapChromeEl) {
      heatmapChromeEl.style.opacity = String(heatmapChromeBlend)
    }

    for (const group of outcomeShapes) {
      const refs = pathRefsMap.current.get(group.code)
      if (!refs) continue

      const [morphStart, morphEnd] = group.progressRange
      const fadeStart = morphStart - 0.015

      const chromeEl = chromeRefsMap.current.get(group.code)

      for (let i = 0; i < group.shapes.length; i++) {
        const el = refs[i]
        if (!el) continue
        const shape = group.shapes[i]!

        const baseOpacity =
          v < fadeStart
            ? 0
            : v < morphStart
              ? Math.min(1, (v - fadeStart) / (morphStart - fadeStart))
              : 1

        if (v < morphStart) {
          el.setAttribute("d", shape.rawD)
          el.setAttribute("fill", shape.color)
          el.style.opacity = String(baseOpacity)
          el.setAttribute("stroke-opacity", "0.4")
          if (chromeEl && !isBar) chromeEl.style.opacity = "0"
          continue
        }

        const morphT = Math.min(1, (v - morphStart) / (morphEnd - morphStart))
        const easedT = easeInOut(morphT)

        const target = getTargetForMode(shape, encodingMode)
        const pts = shape.resampled.map((a, pi) => lerp(a, target[pi]!, easedT))
        el.setAttribute("d", pointsToD(pts))

        const targetColor = getColorForMode(shape, encodingMode)
        if (targetColor !== shape.color) {
          el.setAttribute("fill", lerpColor(shape.color, targetColor, easedT))
        } else {
          el.setAttribute("fill", shape.color)
        }

        if (isBarOrAvg && !shape.isRepresentative) {
          el.style.opacity = String(baseOpacity * (1 - easedT))
        } else {
          el.style.opacity = String(baseOpacity)
        }

        if (isBar && shape.isRepresentative) {
          el.setAttribute("fill-opacity", String(0.9 + (0.8 - 0.9) * easedT))
        }

        if (isBarOrAvg) {
          el.setAttribute("stroke-opacity", String(0.4 * (1 - easedT)))
        }

        // Beats 6/7: once this outcome has settled as squares, drive the
        // chained morph (square -> bar -> dot -> radar vertex) directly
        // from progress. Overrides the post-morph resting state above
        // when any of the beat blends are non-zero. Skipped when the
        // parent has already toggled `encodingMode` to bar/avg (the
        // existing isBarOrAvg branches already handle that case).
        const chainActive =
          v >= morphEnd &&
          encodingMode === "distribution" &&
          (barBlend > 0 || avgBlend > 0 || radarBlend > 0 || heatmapBlend > 0)
        if (chainActive) {
          const radarTarget =
            radarTargetsByCode.get(group.code) ?? shape.dotTarget
          const heatmapTarget =
            heatmapTargetsByCode.get(group.code) ?? radarTarget

          // Compose the blended target: lerp through square -> bar ->
          // dot -> radar -> heatmap cell in sequence. Each blend is
          // clamped to its own window so the chain progresses smoothly
          // without abrupt handoffs.
          let pts = shape.squareTarget
          if (barBlend > 0) {
            pts = pts.map((a, pi) => lerp(a, shape.barTarget[pi]!, barBlend))
          }
          if (avgBlend > 0) {
            // From settled bar position -> dot (grid-center).
            pts = pts.map((a, pi) => lerp(a, shape.dotTarget[pi]!, avgBlend))
          }
          if (radarBlend > 0) {
            // From dot position -> radar vertex (per-outcome polar).
            pts = pts.map((a, pi) => lerp(a, radarTarget[pi]!, radarBlend))
          }
          if (heatmapBlend > 0) {
            // From radar vertex -> heatmap cell rectangle.
            pts = pts.map((a, pi) => lerp(a, heatmapTarget[pi]!, heatmapBlend))
          }
          el.setAttribute("d", pointsToD(pts))

          // Non-representative shapes fade to 0 once we leave pure-bar
          // territory (same as average-mode behavior).
          if (!shape.isRepresentative) {
            const repFade = Math.max(barBlend, avgBlend, radarBlend)
            el.style.opacity = String(baseOpacity * (1 - repFade))
          } else {
            el.style.opacity = String(baseOpacity)
            // In pure bar, use bar-mode fill-opacity. Once we start
            // collapsing into dot/radar, flip back to full opacity
            // (matches average-mode styling).
            const barOnlyFraction =
              barBlend * (1 - Math.max(avgBlend, radarBlend))
            el.setAttribute(
              "fill-opacity",
              String(0.9 + (0.8 - 0.9) * barOnlyFraction),
            )

            // Swap representative fill color to averageColor as we
            // cross into dot/radar/heatmap territory. All of
            // avgBlend/radarBlend/heatmapBlend imply "show average
            // color", so use max of them.
            const avgMix = Math.max(avgBlend, radarBlend, heatmapBlend)
            if (avgMix > 0 && shape.averageColor) {
              el.setAttribute(
                "fill",
                lerpColor(shape.color, shape.averageColor, avgMix),
              )
            }
          }
          el.setAttribute("stroke-opacity", String(0.4 * (1 - barBlend)))
        }
      }

      if (chromeEl) {
        if (isBar) {
          if (v < morphStart) {
            chromeEl.style.opacity = "0"
          } else if (v >= morphEnd) {
            chromeEl.style.opacity = "1"
          } else {
            const morphT = Math.min(
              1,
              (v - morphStart) / (morphEnd - morphStart),
            )
            chromeEl.style.opacity = String(easeInOut(morphT))
          }
        } else if (encodingMode === "distribution" && v >= morphEnd) {
          // Beat 6 chrome fade-in rides barBlend once the outcome has
          // settled. Before morphEnd the chrome stays hidden (the
          // squares are still morphing into place). Once `avgBlend`
          // starts the bar-track chrome fades back out so the dot/
          // radar view isn't cluttered by bar tracks.
          const chromeOpacity = barBlend * (1 - avgBlend)
          chromeEl.style.opacity = String(chromeOpacity)
        } else {
          chromeEl.style.opacity = "0"
        }
      }
    }
  }

  /* ── Bridge registration ──
   *
   * Writes a stable dispatcher into `overlayMorphTickRef.current` so
   * the engine's `OverlayMorphArbiter` invokes the latest morph
   * frame every tick. Runs once per mount. The eager sync on mount
   * matches the legacy `useLayoutEffect`'s initial
   * `handler(progress.get())` call. Gated on
   * `tierChangeRafRef.current == null` because the tier-change RAF
   * (declared earlier) takes exclusive control of the SVG transforms
   * while running and the latest frame's own internal guards
   * (`if (tierChangeRafRef.current != null) return`) already handle
   * the overlap, but we still want to avoid triggering a visual
   * snap on mount. */
  useEffect(() => {
    const dispatch = (v: number) => latestMorphFrameRef.current(v)
    overlayMorphTickRef.current = dispatch
    if (tierChangeRafRef.current == null) {
      dispatch(progress.get())
    }
    return () => {
      if (overlayMorphTickRef.current === dispatch) {
        overlayMorphTickRef.current = null
      }
    }
  }, [overlayMorphTickRef, progress])

  /* ── Dep-driven re-sync ──
   *
   * The legacy `useLayoutEffect` re-ran its entire body (closure
   * rebuild + `progress.on("change")` resubscribe + eager
   * `handler(progress.get())`) whenever any of its deps changed.
   * The bridge-register effect above only eager-syncs once on mount,
   * so we need a companion `useLayoutEffect` to re-sync the DOM when
   * `outcomeShapes`, `encodingMode`, `interactive`, etc. change
   * between progress ticks (e.g. user toggles encoding mode while
   * progress is paused at v=1). The latest-ref closure is already
   * current at this point because it was reassigned during the same
   * render that invalidated these deps. */
  useLayoutEffect(() => {
    if (tierChangeRafRef.current == null) {
      latestMorphFrameRef.current(progress.get())
    }
  }, [
    progress,
    outcomeShapes,
    encodingMode,
    getTargetForMode,
    getColorForMode,
    interactive,
    selectedOutcomeCode,
    radarTargetsByCode,
    heatmapTargetsByCode,
  ])

  return (
    <svg
      ref={svgRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 2,
      }}
      viewBox={`0 0 ${panelWidth} ${panelHeight}`}
    >
      {/* Radar chrome (Beat 7): concentric tier rings, radial axes, and
          a connecting polygon through the per-outcome vertices. Opacity
          driven by `radarChromeBlend` in the main progress handler. */}
      <g
        ref={(el) => {
          radarChromeRef.current = el
        }}
        style={{ opacity: 0 }}
      >
        {[1, 2, 3, 4].map((tier) => {
          const r = radarGeometry.rMax * (tier / 4)
          return (
            <circle
              key={`radar-ring-${tier}`}
              cx={radarGeometry.cx}
              cy={radarGeometry.cy}
              r={r}
              fill="none"
              stroke={theme.palette.grey[400]}
              strokeWidth={0.5}
              strokeDasharray="2,3"
            />
          )
        })}
        {radarGeometry.vertices.map((v) => (
          <line
            key={`radar-axis-${v.code}`}
            x1={radarGeometry.cx}
            y1={radarGeometry.cy}
            x2={radarGeometry.cx + radarGeometry.rMax * Math.cos(v.angle)}
            y2={radarGeometry.cy + radarGeometry.rMax * Math.sin(v.angle)}
            stroke={theme.palette.grey[400]}
            strokeWidth={0.5}
          />
        ))}
        {radarGeometry.vertices.length >= 3 && (
          <polygon
            points={radarGeometry.vertices
              .map((v) => `${v.cx},${v.cy}`)
              .join(" ")}
            fill={alpha(theme.palette.primary.main, 0.15)}
            stroke={theme.palette.primary.main}
            strokeWidth={1.5}
          />
        )}
      </g>
      {/* Heatmap chrome (Beat 8): outcome labels along the left edge of
          the cell column, plus a single column header. Opacity driven
          by `heatmapChromeBlend` in the main progress handler. */}
      <g
        ref={(el) => {
          heatmapChromeRef.current = el
        }}
        style={{ opacity: 0 }}
      >
        {heatmapGeometry.cells.map((cell) => {
          const label =
            outcomes.find((o) => o.code === cell.code)?.label ?? cell.code
          return (
            <text
              key={`heat-label-${cell.code}`}
              x={cell.cx - cell.w / 2 - 8}
              y={cell.cy}
              fontSize={11}
              fontFamily="inherit"
              fill={theme.palette.text.primary}
              textAnchor="end"
              dominantBaseline="central"
            >
              {label}
            </text>
          )
        })}
        {heatmapGeometry.cells.length > 0 && (
          <text
            x={heatmapGeometry.heatCx}
            y={heatmapGeometry.columnTop - 14}
            fontSize={11}
            fontFamily="inherit"
            fontWeight={600}
            fill={theme.palette.text.secondary}
            textAnchor="middle"
            dominantBaseline="central"
          >
            Current hydroclimate
          </text>
        )}
      </g>
      {outcomeShapes.map((group) => {
        if (!pathRefsMap.current.has(group.code)) {
          pathRefsMap.current.set(group.code, [])
        }
        const refs = pathRefsMap.current.get(group.code)!
        const isSelected = selectedOutcomeCode === group.code

        return (
          <g
            key={group.code}
            onClick={
              interactive ? () => onOutcomeClick?.(group.code) : undefined
            }
            style={{ cursor: interactive ? "pointer" : "default" }}
          >
            <rect
              x={group.bounds.x}
              y={group.bounds.y}
              width={group.bounds.width}
              height={group.bounds.height}
              fill="transparent"
              pointerEvents={interactive ? "all" : "none"}
            />
            <g
              ref={(el) => {
                chromeRefsMap.current.set(group.code, el)
              }}
              style={{ opacity: 0 }}
            >
              {group.isSingleValue ? null : (
                /* Multi-value: horizontal bar tracks with grid lines */
                <>
                  {Array.from({ length: group.glyphMeta.numTiers }, (_, ti) => {
                    const y =
                      group.glyphMeta.barGlyphTop +
                      group.glyphMeta.barSpacing +
                      ti *
                        (group.glyphMeta.barHeight + group.glyphMeta.barSpacing)
                    return (
                      <rect
                        key={`track-${ti}`}
                        x={group.glyphMeta.barLeftX}
                        y={y}
                        width={group.glyphMeta.maxBarWidth}
                        height={group.glyphMeta.barHeight}
                        fill="#bbb"
                        rx={group.glyphMeta.barCornerRadius}
                      />
                    )
                  })}
                  {[0.25, 0.5, 0.75].map((frac, li) => (
                    <line
                      key={`grid-${li}`}
                      x1={
                        group.glyphMeta.barLeftX +
                        group.glyphMeta.maxBarWidth * frac
                      }
                      y1={
                        group.glyphMeta.barGlyphTop + group.glyphMeta.barSpacing
                      }
                      x2={
                        group.glyphMeta.barLeftX +
                        group.glyphMeta.maxBarWidth * frac
                      }
                      y2={
                        group.glyphMeta.barGlyphTop +
                        group.glyphMeta.barGlyphH -
                        group.glyphMeta.barSpacing
                      }
                      stroke="#ccc"
                      strokeWidth={0.5}
                      strokeDasharray="1,2"
                    />
                  ))}
                </>
              )}
            </g>
            {group.shapes.map((shape, i) => {
              const locKey = `${group.code}:${shape.sourceId}`
              const isLocationActive =
                (interactive &&
                  activeLocationSet != null &&
                  activeLocationSet.has(locKey)) ||
                demoHighlightedLocationKey === locKey
              const isDimmed =
                interactive &&
                spotlightedTier != null &&
                shape.tier !== spotlightedTier
              const isBarMode = encodingMode === "bar"
              const isAvgMode = encodingMode === "average"
              const isBarOrAvg = isBarMode || isAvgMode
              // Squares are clickable whenever the overlay is interactive
              // and we're not in average mode. The `isSelected` gate was
              // dropped because outcome-title clicks no longer precede
              // square clicks; clicking a square is now the sole entry
              // point for activating an outcome's map layer.
              const isClickable = interactive && !isAvgMode
              return (
                <path
                  key={`${group.code}-${i}`}
                  ref={(el) => {
                    refs[i] = el
                  }}
                  d={shape.rawD}
                  fill={
                    encodingMode === "average" && shape.averageColor
                      ? shape.averageColor
                      : shape.color
                  }
                  fillOpacity={
                    isDimmed
                      ? 0.2
                      : isBarOrAvg && shape.isRepresentative
                        ? 0.8
                        : isLocationActive
                          ? 1
                          : isSelected
                            ? 0.9
                            : 0.75
                  }
                  stroke={
                    isBarOrAvg
                      ? "none"
                      : isLocationActive
                        ? theme.palette.accent.glossary
                        : spotlightedTier === shape.tier
                          ? theme.palette.accent.glossary
                          : shape.color
                  }
                  strokeWidth={
                    isBarOrAvg
                      ? 0
                      : isLocationActive
                        ? 2
                        : spotlightedTier === shape.tier
                          ? 1.5
                          : 0.5
                  }
                  strokeOpacity={
                    isBarOrAvg ? 0 : isDimmed ? 0.2 : isLocationActive ? 1 : 0.4
                  }
                  style={{
                    opacity: 0,
                    cursor: isClickable ? "pointer" : undefined,
                    transition:
                      "fill-opacity 0.2s, stroke 0.15s, stroke-width 0.15s, stroke-opacity 0.2s",
                  }}
                  pointerEvents={isClickable ? "all" : "none"}
                  onMouseEnter={
                    interactive && !isBarOrAvg
                      ? () =>
                          onLocationEnter?.({
                            code: group.code,
                            sourceId: shape.sourceId,
                            tier: shape.tier,
                          })
                      : undefined
                  }
                  onMouseLeave={
                    interactive && !isBarOrAvg
                      ? () => onLocationLeave?.()
                      : undefined
                  }
                  onClick={
                    interactive
                      ? (e) => {
                          e.stopPropagation()
                          if (isBarMode && onBarClick) {
                            onBarClick(group.code, shape.tier)
                          } else if (!isBarOrAvg) {
                            onLocationClick?.({
                              code: group.code,
                              sourceId: shape.sourceId,
                              tier: shape.tier,
                            })
                          }
                        }
                      : undefined
                  }
                />
              )
            })}
            {!group.hasData &&
              interactive &&
              encodingMode !== "distribution" && (
                <text
                  x={group.glyphMeta.gridCenterX}
                  y={group.glyphMeta.gridCenterY}
                  fontSize={10}
                  fontFamily="inherit"
                  fill={theme.palette.grey[500]}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontStyle="italic"
                >
                  No data at this time
                </text>
              )}
          </g>
        )
      })}

      {hoverTooltip && (
        <foreignObject
          x={hoverTooltip.x - 100}
          y={hoverTooltip.y - 40}
          width={200}
          height={40}
          style={{ pointerEvents: "none", overflow: "visible" }}
        >
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              margin: "0 auto",
              padding: "3px 8px",
              borderRadius: 4,
              background: alpha(theme.palette.common.white, 0.92),
              boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
              fontFamily: "inherit",
              fontSize: 11,
              lineHeight: 1.3,
              textAlign: "center",
              color: "#333",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                fontWeight: 600,
                maxWidth: 200,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {hoverTooltip.name}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontWeight: 500,
                color: hoverTooltip.color,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  backgroundColor: hoverTooltip.color,
                  flexShrink: 0,
                }}
              />
              Tier {hoverTooltip.tierLevel}: {hoverTooltip.tier}
            </span>
          </div>
        </foreignObject>
      )}
    </svg>
  )
}
