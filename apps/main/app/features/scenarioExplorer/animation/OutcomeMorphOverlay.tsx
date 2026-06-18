"use client"

/* OutcomeMorphOverlay: SVG over the map that morphs outcome polygons into
 * distribution squares, then bars, dots, and heatmap cells. Runs per frame
 * through the overlay-morph bridge. See "The bridge actors" in README.md. */

import {
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  type RefObject,
} from "react"
import { createPortal } from "react-dom"
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
  RADAR_TIER_LABELS,
} from "@repo/viz"
import { getTierLabel } from "../../../content/tiers"
import {
  computeRadarFrame,
  radarVertexAngle,
  radarTierRadius,
  computeHeatmapColumnFrame,
  heatmapCellCenterY,
  HEAT_SIDE_PAD,
  HEAT_BLOCK_SHIFT_X,
} from "./storyboardGeometry"
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
   *  dispatcher into `.current` on mount and clears it on unmount. The
   *  arbiter reads through the ref every frame. */
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
  /** Gate for clicking a whole outcome glyph (the bar beat). Separate from
   *  `interactive` because bars are not per-square hit targets. When true,
   *  each outcome's bounds rect is clickable and calls `onOutcomeClick`. */
  outcomeGlyphClickEnabled?: boolean
  /** Gate for clicking a radar vertex dot (the radar beat). When true, a
   *  hit target over each vertex calls `onOutcomeClick`. */
  radarDotClickEnabled?: boolean
  /** Gate for clicking a hydroclimate matrix cell (the heatmap beat). When
   *  true, a hit target over every cell calls `onHeatmapCellClick` with the
   *  cell's outcome code and its column's climate scenario. */
  heatmapCellClickEnabled?: boolean
  /** Scenario for the primary heatmap column (historical hydroclimate). */
  heatmapPrimaryScenarioId?: string
  /** Scenario backing the current map selection; outlines the active cell. */
  selectedScenarioId?: string
  onHeatmapCellClick?: (code: string, scenarioId: string) => void
  selectedOutcomeCode?: string | null
  interactive?: boolean
  /** Gate for per-square hover and click on the distribution grid. */
  squareHoverEnabled?: boolean
  /** All active (hovered + pinned) locations driven by the parent. */
  activeLocationSet?: Map<string, LocationInfo>
  /** Currently hovered location (for ephemeral overlay tooltip). */
  hoveredLocation?: LocationInfo | null
  /** Callbacks into the shared hover/pin state machine in the parent. */
  onLocationEnter?: (info: LocationInfo) => void
  onLocationLeave?: () => void
  onLocationClick?: (info: LocationInfo) => void
  /** Maps "outcomeCode:sourceId" to a human-readable name. */
  locationNameMap?: Record<string, string>
  encodingMode?: EncodingMode
  tierChartData?: Record<string, ChartDataPoint[]>
  spotlightedTier?: number | null
  onBarClick?: (code: string, tier: number) => void
  demoHighlightedLocationKey?: string | null
  mustIncludeSourceIds?: ReadonlySet<string>
  extraHydroclimateColumns?: Array<{
    label: string
    scenarioId?: string
    tierChartData?: Record<string, ChartDataPoint[]>
  }>
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

  // Sum of API normalized values across the four tiers. Expresses each
  // tier's bar as a fraction of the row total, matching `BarOnly` in
  // `MorphableDistributionGlyph`. Without this the storyboard bars look
  // narrower than the list view's whenever `sum(values) < 1`.
  const apiValueSum = chartPoints
    ? chartPoints.reduce((s, p) => s + (p?.value ?? 0), 0)
    : 0

  // Weighted-mean tier score from `computeTierScore(chartPoints)` (same as
  // the list view's `TierSummaryCell`). Falls back to a count-based mean
  // over on-screen squares when `chartPoints` is missing.
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

  // Bar chart and average dot centered within the slot, not the grid.
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

    weightedScore,

    avgTierLevel,
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

export function getOutcomeProgressRange(
  code: string,
  activeCodes: readonly string[],
): [number, number] {
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
  outcomeGlyphClickEnabled = false,
  radarDotClickEnabled = false,
  heatmapCellClickEnabled = false,
  heatmapPrimaryScenarioId,
  selectedScenarioId,
  onHeatmapCellClick,
  selectedOutcomeCode,
  interactive,
  squareHoverEnabled = false,
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
  extraHydroclimateColumns,
}: OutcomeMorphOverlayProps) {
  const theme = useTheme()
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRefsMap = useRef<Map<string, (SVGPathElement | null)[]>>(new Map())
  const chromeRefsMap = useRef<Map<string, SVGGElement | null>>(new Map())
  const radarChromeRef = useRef<SVGGElement | null>(null)
  const heatmapChromeRef = useRef<SVGGElement | null>(null)
  const heatmapExtraColumnRefs = useRef<Array<SVGGElement | null>>([])

  const outcomeShapes = useMemo(() => {
    const panelLeft = panelWidth * (2 / 3)
    const activeCodes = outcomes.map((o) => o.code)

    return outcomes.map((outcome) => {
      const sampled =
        outcome.polygons.length > MAX_POLYGONS_PER_OUTCOME
          ? (() => {
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
        /** Continuous API-weighted tier score (e.g. 2.3). Places each
         *  radar vertex at its weighted-mean radius. */
        weightedScore: layout.weightedScore,
        /** Rounded weighted tier (1..4). Recolors the average dot and
         *  heatmap cell to the scenario's average for that outcome. */
        avgTierLevel: layout.avgTierLevel,
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

  /* Union bounding box of all distribution groups. A transparent backdrop
   * over this region captures pointer events in the gaps between squares so
   * map-polygon hover underneath does not fire. Map hover still works
   * outside this box. */
  const gridHitBounds = useMemo(() => {
    if (outcomeShapes.length === 0) return null
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const group of outcomeShapes) {
      minX = Math.min(minX, group.bounds.x)
      minY = Math.min(minY, group.bounds.y)
      maxX = Math.max(maxX, group.bounds.x + group.bounds.width)
      maxY = Math.max(maxY, group.bounds.y + group.bounds.height)
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  }, [outcomeShapes])

  /* Radar geometry */
  const radarGeometry = useMemo(() => {
    const N = outcomeShapes.length
    const { cx, cy, rMax } = computeRadarFrame(panelWidth, panelHeight)
    const tierR = (tier: number) => radarTierRadius(rMax, tier)

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
      const score = group.weightedScore ?? rep?.tier ?? 2
      const angle = radarVertexAngle(i, N)
      const radius = tierR(score)
      vertices.push({
        code: group.code,
        cx: cx + radius * Math.cos(angle),
        cy: cy + radius * Math.sin(angle),
        angle,
        radius,
      })
    }
    return { cx, cy, rMax, tierR, vertices }
  }, [outcomeShapes, panelWidth, panelHeight])

  const radarTargetsByCode = useMemo(() => {
    const map = new Map<string, [number, number][]>()
    for (const v of radarGeometry.vertices) {
      map.set(v.code, circlePoints(v.cx, v.cy, DOT_RADIUS, POINTS_PER_SHAPE))
    }
    return map
  }, [radarGeometry])

  /* Heatmap geometry. A grid of `numColumns` hydroclimate columns (primary
   * + `extraHydroclimateColumns.length` extras) by `N` outcome rows. Column
   * 0 is where each outcome's representative morph polygon lands via
   * `heatmapTargetsByCode`. Extra columns are decorative fade-ins (no
   * morph). Each cell is an `innerW x innerH` rect centered on
   * `(columnCx[c], cellCy_r)`. The column group is centered in the right
   * third. Inter-column gap is ~12% of `cellW`. */
  const heatmapGeometry = useMemo(() => {
    const N = outcomeShapes.length
    const numExtras = extraHydroclimateColumns?.length ?? 0
    const numColumns = 1 + numExtras
    const { panelLeft, heatmapLeft, cellH, columnTop } =
      computeHeatmapColumnFrame(panelWidth, panelHeight, N)
    const rightWidth = panelWidth - panelLeft
    const HEAT_COL_GAP_FRACTION = 0.18
    const HEAT_MAX_CELL_W = 150

    const rightColRight =
      panelLeft + rightWidth - HEAT_SIDE_PAD + HEAT_BLOCK_SHIFT_X
    const heatmapAvailW = Math.max(1, rightColRight - heatmapLeft)
    const cellW = Math.min(
      HEAT_MAX_CELL_W,
      heatmapAvailW / (numColumns + (numColumns - 1) * HEAT_COL_GAP_FRACTION),
    )
    const columnGap = cellW * HEAT_COL_GAP_FRACTION
    const CELL_PAD_FRACTION = 0.08
    const cellInsetX = cellW * CELL_PAD_FRACTION * 0.5
    const cellInsetY = cellH * CELL_PAD_FRACTION * 0.5
    const innerW = Math.max(1, cellW - cellInsetX * 2)
    const innerH = Math.max(1, cellH - cellInsetY * 2)
    const stride = cellW + columnGap
    const columnCx: number[] = []
    for (let c = 0; c < numColumns; c++) {
      columnCx.push(heatmapLeft + cellW / 2 + c * stride)
    }
    const groupW = numColumns * cellW + (numColumns - 1) * columnGap
    const heatCx = heatmapLeft + groupW / 2

    const cells: Array<{
      code: string
      cx: number
      cy: number
      w: number
      h: number
    }> = []
    for (let i = 0; i < N; i++) {
      const group = outcomeShapes[i]!
      const cy = heatmapCellCenterY(columnTop, cellH, i)
      cells.push({
        code: group.code,
        cx: columnCx[0]!,
        cy,
        w: innerW,
        h: innerH,
      })
    }

    const extraColumns: Array<{
      label: string
      scenarioId?: string
      cx: number
      cells: Array<{
        code: string
        cx: number
        cy: number
        w: number
        h: number
        fill: string
      }>
    }> = []
    const tierColors = theme.palette.tiers
    for (let c = 0; c < numExtras; c++) {
      const col = extraHydroclimateColumns![c]!
      const colCx = columnCx[c + 1]!
      const colCells = outcomeShapes.map((group, i) => {
        const cy = heatmapCellCenterY(columnTop, cellH, i)
        const points = col.tierChartData?.[group.code]
        const score = computeTierScore(points)
        const level = score != null ? getTierLevelForScore(score) : null
        const fill =
          level != null
            ? (tierColors[`tier${level}` as keyof typeof tierColors] ??
              "transparent")
            : "transparent"
        return { code: group.code, cx: colCx, cy, w: innerW, h: innerH, fill }
      })
      extraColumns.push({
        label: col.label,
        scenarioId: col.scenarioId,
        cx: colCx,
        cells: colCells,
      })
    }

    return {
      heatCx,
      columnTop,
      cellW,
      cellH,
      cells,
      columnCx,
      extraColumns,
    }
  }, [outcomeShapes, panelWidth, panelHeight, extraHydroclimateColumns, theme])

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
    // Square popup for the hovered location. When nothing is hovered, fall
    // back to the pinned selection (at most one) so clicking a square or its
    // map polygon keeps the popup on the square.
    const loc =
      hoveredLocation ??
      (activeLocationSet && activeLocationSet.size > 0
        ? (activeLocationSet.values().next().value as LocationInfo)
        : null)
    if (!loc) return null
    const group = outcomeShapes.find((g) => g.code === loc.code)
    if (!group) return null
    const shape = group.shapes.find((s) => s.sourceId === loc.sourceId)
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
        locationNameMap?.[`${loc.code}:${loc.sourceId}`] ??
        getLocationName(loc.code, loc.sourceId),
      tierLevel: loc.tier,
      tier: getTierLabel(loc.tier),
      color: shape.color,
    }
  }, [hoveredLocation, activeLocationSet, outcomeShapes, locationNameMap])

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

  // Hydroclimate tier-change transition (distribution mode)
  useLayoutEffect(() => {
    // Snapshot current distribution-mode state.
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

    // Step 1: changed squares fade to new tier color in place.
    // Step 2: all squares glide from old to new position.
    const COLOR_FADE = 600
    const PAUSE_END = COLOR_FADE + 300
    const SLIDE_DURATION = 600
    const SLIDE_END = PAUSE_END + SLIDE_DURATION
    const TOTAL = SLIDE_END

    // Pin all shapes to old positions.
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

          // Step 1: color fade (changed squares only).
          if (tierChanged && old.color !== shape.color) {
            el.setAttribute("fill", lerpColor(old.color, shape.color, colorT))
          }

          // Step 2: glide to new position.
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

  // Encoding-mode transition
  useLayoutEffect(() => {
    if (prevEncodingRef.current !== encodingMode && progress.get() >= 1) {
      // Cancel any tier-change animation so encoding takes over.
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

  /* Overlay-morph frame applier */
  const latestMorphFrameRef = useRef<(v: number) => void>(() => {})
  latestMorphFrameRef.current = (v: number) => {
    const isBarOrAvg = encodingMode === "bar" || encodingMode === "average"
    const isBar = encodingMode === "bar"
    // Morph-stage thresholds on the shared progress axis, named for the beat
    // they belong to. Boundaries come from TIMING_BEATS: list-bar [5] ends
    // 0.72, radar [6] ends 0.87, heatmap [7] ends 1.0. Some stage ends fall
    // inside the next beat because the morph phases overlap beat boundaries.
    const LIST_BAR_START = 0.62
    const LIST_BAR_BARS_END = 0.68
    const LIST_BAR_END = 0.72
    const RADAR_AVG_END = 0.75
    const RADAR_SHAPE_END = 0.82
    const RADAR_CHROME_END = 0.87
    const HEATMAP_CHROME_OUT_END = 0.9
    const HEATMAP_CELL_END = 0.95
    // Primary column chrome settles first, then each extra column fades in
    // sequentially. Splits the post-morph window [0.95, 1.00] into thirds.
    const HEATMAP_COL0_END = 0.97
    const HEATMAP_COL1_END = 0.985
    const HEATMAP_COL2_END = 1.0

    const computeBlends = (v: number) => {
      const clampRange = (lo: number, hi: number) =>
        v <= lo ? 0 : v >= hi ? 1 : easeInOut((v - lo) / (hi - lo))
      const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
      const clampRangeEaseOut = (lo: number, hi: number) =>
        v <= lo ? 0 : v >= hi ? 1 : easeOutCubic((v - lo) / (hi - lo))
      const radarChromeIn = clampRange(RADAR_SHAPE_END, RADAR_CHROME_END)
      const radarChromeOut = clampRange(RADAR_CHROME_END, HEATMAP_CHROME_OUT_END)
      return {
        barBlend: clampRangeEaseOut(LIST_BAR_START, LIST_BAR_BARS_END),
        avgBlend: clampRange(LIST_BAR_END, RADAR_AVG_END),
        radarBlend: clampRange(RADAR_AVG_END, RADAR_SHAPE_END),
        radarChromeBlend: radarChromeIn * (1 - radarChromeOut),
        heatmapBlend: clampRange(RADAR_CHROME_END, HEATMAP_CELL_END),
        heatmapChromeBlend: clampRange(HEATMAP_CELL_END, HEATMAP_COL0_END),
        extraColumnBlends: [
          clampRange(HEATMAP_COL0_END, HEATMAP_COL1_END),
          clampRange(HEATMAP_COL1_END, HEATMAP_COL2_END),
        ] as [number, number],
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
      extraColumnBlends,
    } = computeBlends(v)

    // Radar chrome opacity. Rises in the radar beat, falls at the start of
    // the heatmap beat.
    const radarChromeEl = radarChromeRef.current
    if (radarChromeEl) {
      radarChromeEl.style.opacity = String(radarChromeBlend)
    }

    // Heatmap chrome opacity (primary column's rounded-rect overlays +
    // header).
    const heatmapChromeEl = heatmapChromeRef.current
    if (heatmapChromeEl) {
      heatmapChromeEl.style.opacity = String(heatmapChromeBlend)
    }

    // Each extra column's `<g>` is hidden at rest and fades up on its own
    // slice of the post-morph window, producing the "one by one" reveal.
    const extraColumnEls = heatmapExtraColumnRefs.current
    for (let c = 0; c < extraColumnEls.length; c++) {
      const el = extraColumnEls[c]
      if (!el) continue
      el.style.opacity = String(extraColumnBlends[c] ?? 0)
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

        // Once squares settle, drive the chained morph (square, bar, dot,
        // radar vertex, heatmap cell) straight from progress. Overrides the
        // resting state above when a beat blend is active. Skipped when the
        // parent already switched `encodingMode` to bar or average.
        const chainActive =
          v >= morphEnd &&
          encodingMode === "distribution" &&
          (barBlend > 0 || avgBlend > 0 || radarBlend > 0 || heatmapBlend > 0)
        if (chainActive) {
          const radarTarget =
            radarTargetsByCode.get(group.code) ?? shape.dotTarget
          const heatmapTarget =
            heatmapTargetsByCode.get(group.code) ?? radarTarget

          // Blend the target by lerping through square, bar, dot, radar,
          // then heatmap cell in order. Each blend has its own window.
          let pts = shape.squareTarget
          if (barBlend > 0) {
            pts = pts.map((a, pi) => lerp(a, shape.barTarget[pi]!, barBlend))
          }
          if (avgBlend > 0) {
            // From the settled bar to the dot (grid center).
            pts = pts.map((a, pi) => lerp(a, shape.dotTarget[pi]!, avgBlend))
          }
          if (radarBlend > 0) {
            // From the dot to the radar vertex (per-outcome polar).
            pts = pts.map((a, pi) => lerp(a, radarTarget[pi]!, radarBlend))
          }
          if (heatmapBlend > 0) {
            // From the radar vertex to the heatmap cell rectangle.
            pts = pts.map((a, pi) => lerp(a, heatmapTarget[pi]!, heatmapBlend))
          }
          el.setAttribute("d", pointsToD(pts))

          // Non-representative shapes fade to 0 once we leave pure-bar
          // territory.
          if (!shape.isRepresentative) {
            const repFade = Math.max(barBlend, avgBlend, radarBlend)
            el.style.opacity = String(baseOpacity * (1 - repFade))
          } else {
            el.style.opacity = String(baseOpacity)
            // Pure bar uses bar-mode fill-opacity. Collapsing into
            // dot/radar flips back to full opacity.
            const barOnlyFraction =
              barBlend * (1 - Math.max(avgBlend, radarBlend))
            el.setAttribute(
              "fill-opacity",
              String(0.9 + (0.8 - 0.9) * barOnlyFraction),
            )

            // Swap representative fill to averageColor crossing into
            // dot/radar/heatmap. All three blends imply "show average
            // color", so use their max.
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
          // Fade-in rides barBlend once the outcome settles. Hidden before
          // morphEnd (squares still morphing). Once `avgBlend` starts, the
          // bar-track chrome fades back out for the dot/radar view.
          const chromeOpacity = barBlend * (1 - avgBlend)
          chromeEl.style.opacity = String(chromeOpacity)
        } else {
          chromeEl.style.opacity = "0"
        }
      }
    }
  }

  /* Bridge registration. Writes a stable dispatcher into
   * `overlayMorphTickRef.current` so `OverlayMorphArbiter` runs the latest
   * morph frame every frame. Applies the current frame on mount, but skips
   * that initial apply during the tier-change animation to avoid a snap. */
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

  /* Re-sync */
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
      {/* Radar chrome: tier rings, radial axes, tier labels, and a trace
          connecting the per-outcome vertices. Opacity driven by
          `radarChromeBlend` in the main progress handler. */}
      <g
        ref={(el) => {
          radarChromeRef.current = el
        }}
        style={{ opacity: 0 }}
      >
        {[1, 2, 3, 4].map((tier) => {
          const r = radarGeometry.tierR(tier)
          return (
            <circle
              key={`radar-ring-${tier}`}
              cx={radarGeometry.cx}
              cy={radarGeometry.cy}
              r={r}
              fill="none"
              stroke={theme.palette.brand.panelDark}
              strokeOpacity={0.2}
              strokeWidth={1}
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
            stroke={theme.palette.brand.panelDark}
            strokeOpacity={0.2}
            strokeWidth={1}
          />
        ))}
        {RADAR_TIER_LABELS.map((label, i) => {
          const r = radarGeometry.tierR(i + 1)
          return (
            <text
              key={`radar-tier-label-${i}`}
              x={radarGeometry.cx + 6}
              y={radarGeometry.cy - r - 3}
              fontSize={9.5}
              fontFamily="inherit"
              fontWeight={500}
              fill="#718096"
              letterSpacing="0.02em"
            >
              {label}
            </text>
          )
        })}
        {radarGeometry.vertices.length >= 3 && (
          <polygon
            points={radarGeometry.vertices
              .map((v) => `${v.cx},${v.cy}`)
              .join(" ")}
            fill="none"
            stroke={theme.palette.primary.main}
            strokeWidth={2}
            strokeOpacity={0.55}
            strokeLinejoin="round"
          />
        )}
      </g>
      {/* Radar vertex hit targets: a transparent circle over each dot, only
          on the settled radar beat. The morphed shapes and bounds rect are
          pointer-inert there, so these receive the click (`onOutcomeClick`). */}
      {radarDotClickEnabled &&
        radarGeometry.vertices.map((v) => (
          <circle
            key={`radar-hit-${v.code}`}
            cx={v.cx}
            cy={v.cy}
            r={DOT_RADIUS + 6}
            fill="transparent"
            pointerEvents="all"
            style={{ cursor: "pointer" }}
            onClick={() => onOutcomeClick?.(v.code)}
          />
        ))}
      {/* Heatmap chrome */}
      <g
        ref={(el) => {
          heatmapChromeRef.current = el
        }}
        style={{ opacity: 0 }}
      >
        {heatmapGeometry.cells.map((cell) => {
          const group = outcomeShapes.find((g) => g.code === cell.code)
          const fill = group?.shapes[0]?.averageColor ?? "transparent"
          return (
            <rect
              key={`heat-cell-${cell.code}`}
              x={cell.cx - cell.w / 2}
              y={cell.cy - cell.h / 2}
              width={cell.w}
              height={cell.h}
              rx={2}
              ry={2}
              fill={fill}
            />
          )
        })}
        {heatmapGeometry.cells.length > 0 && (
          <text
            x={heatmapGeometry.cells[0]!.cx}
            y={heatmapGeometry.columnTop - 16}
            fontSize={11}
            fontFamily="inherit"
            fontWeight={700}
            fill={theme.palette.text.primary}
            textAnchor="middle"
            dominantBaseline="central"
          >
            Historical hydroclimate
          </text>
        )}
      </g>
      {/* Extra hydroclimate columns */}
      {heatmapGeometry.extraColumns.map((column, colIdx) => (
        <g
          key={`heat-extra-col-${colIdx}`}
          ref={(el) => {
            heatmapExtraColumnRefs.current[colIdx] = el
          }}
          style={{ opacity: 0 }}
        >
          {column.cells.map((cell) => (
            <rect
              key={`heat-extra-cell-${colIdx}-${cell.code}`}
              x={cell.cx - cell.w / 2}
              y={cell.cy - cell.h / 2}
              width={cell.w}
              height={cell.h}
              rx={2}
              ry={2}
              fill={cell.fill}
            />
          ))}
          {column.cells.length > 0 && (
            <text
              x={column.cx}
              y={heatmapGeometry.columnTop - 16}
              fontSize={11}
              fontFamily="inherit"
              fontWeight={700}
              fill={theme.palette.text.primary}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {column.label}
            </text>
          )}
        </g>
      ))}
      {/* Grid hit backdrop: swallows pointer events in the gaps between
          squares so map-polygon hover underneath does not pop up. Squares
          render on top and keep their own hover. Interactive only. */}
      {interactive && gridHitBounds && (
        <rect
          x={gridHitBounds.x}
          y={gridHitBounds.y}
          width={gridHitBounds.width}
          height={gridHitBounds.height}
          fill="transparent"
          pointerEvents="all"
          onMouseLeave={() => onLocationLeave?.()}
        />
      )}
      {outcomeShapes.map((group) => {
        if (!pathRefsMap.current.has(group.code)) {
          pathRefsMap.current.set(group.code, [])
        }
        const refs = pathRefsMap.current.get(group.code)!
        const isSelected = selectedOutcomeCode === group.code
        const glyphClickable = interactive || outcomeGlyphClickEnabled

        return (
          <g
            key={group.code}
            onClick={
              glyphClickable ? () => onOutcomeClick?.(group.code) : undefined
            }
            style={{ cursor: glyphClickable ? "pointer" : "default" }}
          >
            <rect
              x={group.bounds.x}
              y={group.bounds.y}
              width={group.bounds.width}
              height={group.bounds.height}
              fill="transparent"
              pointerEvents={glyphClickable ? "all" : "none"}
            />
            <g
              ref={(el) => {
                chromeRefsMap.current.set(group.code, el)
              }}
              style={{ opacity: 0 }}
            >
              {group.isSingleValue ? null : (
                /* Multi-value: horizontal bar tracks with grid lines. */
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
              // Squares are clickable only on grid beats, never in average
              // mode.
              const isClickable = squareHoverEnabled && !isAvgMode
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
                    squareHoverEnabled && !isBarOrAvg
                      ? () =>
                          onLocationEnter?.({
                            code: group.code,
                            sourceId: shape.sourceId,
                            tier: shape.tier,
                          })
                      : undefined
                  }
                  onMouseLeave={
                    squareHoverEnabled && !isBarOrAvg
                      ? () => onLocationLeave?.()
                      : undefined
                  }
                  onClick={
                    squareHoverEnabled
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

      {/* Matrix cell hit targets: a transparent rect over every cell, only
          on the settled heatmap beat. Drawn last so it sits above the bounds
          rects and grid backdrop and receives the click. Each cell carries
          its column's climate scenario (see `onHeatmapCellClick`). The active
          cell gets a gold outline. */}
      {heatmapCellClickEnabled &&
        [
          ...heatmapGeometry.cells.map((cell) => ({
            ...cell,
            scenarioId: heatmapPrimaryScenarioId,
          })),
          ...heatmapGeometry.extraColumns.flatMap((column) =>
            column.cells.map((cell) => ({
              ...cell,
              scenarioId: column.scenarioId,
            })),
          ),
        ].map((cell, i) => {
          const isActive =
            selectedOutcomeCode === cell.code &&
            selectedScenarioId != null &&
            selectedScenarioId === cell.scenarioId
          return (
            <rect
              key={`heat-hit-${i}-${cell.code}`}
              x={cell.cx - cell.w / 2}
              y={cell.cy - cell.h / 2}
              width={cell.w}
              height={cell.h}
              rx={2}
              ry={2}
              fill="transparent"
              stroke={isActive ? theme.palette.accent.glossary : "none"}
              strokeWidth={isActive ? 2 : 0}
              pointerEvents="all"
              style={{ cursor: "pointer" }}
              onClick={() => {
                if (cell.scenarioId) {
                  onHeatmapCellClick?.(cell.code, cell.scenarioId)
                }
              }}
            />
          )
        })}

      {hoverTooltip && renderHoverTooltipPortal(hoverTooltip)}
    </svg>
  )

  /* Render the square hover tooltip through a portal to the document body.
   * The overlay's `zIndex: 4` sits below the outcome labels (`zIndex: 5`),
   * so an in-SVG tooltip would be occluded. The portal escapes that context.
   * Tooltip x/y are SVG viewBox units (equal to panel pixels), offset by the
   * SVG's position to place it in document space. */
  function renderHoverTooltipPortal(tip: NonNullable<typeof hoverTooltip>) {
    const svgEl = svgRef.current
    if (!svgEl || typeof document === "undefined") return null
    const rect = svgEl.getBoundingClientRect()
    const left = window.scrollX + rect.left + tip.x
    const top = window.scrollY + rect.top + tip.y
    return createPortal(
      <div
        style={{
          position: "absolute",
          left,
          top,
          transform: "translate(-50%, -100%)",
          zIndex: theme.zIndex.tooltip,
          pointerEvents: "none",
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
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
          {tip.name}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontWeight: 500,
            color: tip.color,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              backgroundColor: tip.color,
              flexShrink: 0,
            }}
          />
          Tier {tip.tierLevel}: {tip.tier}
        </span>
      </div>,
      document.body,
    )
  }
}
