"use client"

import { useRef, useLayoutEffect, useMemo, useCallback } from "react"
import { useTheme } from "@repo/ui/mui"
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
import { getTierLevelForScore } from "../../scenarios/components/shared/tierScore"

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
  squaresPerRow: number
  distributionPositionMap: Record<
    string,
    {
      x: number
      y: number
      labelY: number
      maxWidth: number
      slotHeight: number
      locationDescription: string
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

  // Average color: weighted mean of tiers based on actual square counts
  const weightedScore =
    totalPolygons > 0
      ? tierKeys.reduce(
          (sum, tier) =>
            sum + tier * (byTier.get(tier)!.length / totalPolygons),
          0,
        )
      : null
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

    // Bar widths derived from distribution squares, not chartData
    const normVal = totalPolygons > 0 ? group.length / totalPolygons : 0
    const barW = Math.max(2, normVal * maxBarWidth)

    let barPts: [number, number][]
    if (isSingleValue) {
      barPts = circlePoints(gridCenterX, slotCenterY, svRadius, POINTS_PER_SHAPE)
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
 * Progress ranges for each outcome within Beat 2 (global progress 0.67–1.0).
 * Each outcome gets a slice for its polygon morph animation.
 * Morphing begins at 0.67, after tier colors have settled on the map.
 */
export function getOutcomeProgressRange(
  index: number,
  total: number,
): [number, number] {
  const beat2Start = 0.67
  const beat2End = 1.0
  const sliceWidth = (beat2End - beat2Start) / Math.max(total, 1)
  const start = beat2Start + index * sliceWidth
  return [start, start + sliceWidth * 0.9]
}

export default function OutcomeMorphOverlay({
  outcomes,
  panelWidth,
  panelHeight,
  progress,
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
}: OutcomeMorphOverlayProps) {
  const theme = useTheme()
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRefsMap = useRef<Map<string, (SVGPathElement | null)[]>>(new Map())
  const countRefsMap = useRef<Map<string, SVGTextElement | null>>(new Map())
  const chromeRefsMap = useRef<Map<string, SVGGElement | null>>(new Map())

  const outcomeShapes = useMemo(() => {
    const panelLeft = panelWidth * (2 / 3)

    return outcomes.map((outcome, oi) => {
      const sampled =
        outcome.polygons.length > MAX_POLYGONS_PER_OUTCOME
          ? (() => {
              const step = outcome.polygons.length / MAX_POLYGONS_PER_OUTCOME
              return Array.from(
                { length: MAX_POLYGONS_PER_OUTCOME },
                (_, i) => outcome.polygons[Math.floor(i * step)]!,
              )
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
      const labelY = pos?.labelY ?? gridTargetY
      const boundsTop =
        shapes.length > 0 ? Math.min(labelY, minY - pad) : labelY
      const boundsBottom = shapes.length > 0 ? maxY + pad : labelY + 32
      const boundsLeft = shapes.length > 0 ? minX - pad : gridTargetX
      const boundsRight =
        shapes.length > 0
          ? Math.max(maxX + pad, gridTargetX + maxColWidth)
          : gridTargetX + maxColWidth
      const locationDescription =
        pos?.locationDescription ?? `${outcome.polygons.length} locations`
      const SLOT_COUNT_GAP = 16
      const countY =
        outcomeSlotHeight > 0
          ? gridTargetY + outcomeSlotHeight + SLOT_COUNT_GAP
          : gridTargetY + 46
      const bounds = {
        x: boundsLeft,
        y: boundsTop,
        width: boundsRight - boundsLeft,
        height: Math.max(boundsBottom, countY + 11) - boundsTop,
      }

      return {
        code: outcome.code,
        shapes,
        isSingleValue: layout.isSingleValue,
        hasData,
        glyphMeta: layout.glyphMeta,
        bounds,
        locationDescription,
        countY,
        countX: gridTargetX + GRID_PAD,
        progressRange: getOutcomeProgressRange(oi, outcomes.length),
      }
    })
  }, [
    outcomes,
    panelWidth,
    squaresPerRow,
    distributionPositionMap,
    tierChartData,
    theme.palette.tiers,
  ])

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
  const prevShapeSnapshotRef = useRef<
    Map<string, Map<string, ShapeSnapshot>> | null
  >(null)

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
          : easeInOut(
              Math.min(1, (elapsed - PAUSE_END) / SLIDE_DURATION),
            )

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

  useLayoutEffect(() => {
    const isBarOrAvg = encodingMode === "bar" || encodingMode === "average"
    const isBar = encodingMode === "bar"

    const handler = (v: number) => {
      if (encodingRafRef.current != null) return
      if (tierChangeRafRef.current != null) return

      for (const group of outcomeShapes) {
        const refs = pathRefsMap.current.get(group.code)
        if (!refs) continue

        const [morphStart, morphEnd] = group.progressRange
        const fadeStart = morphStart - 0.03

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
            if (chromeEl) chromeEl.style.opacity = "0"
            continue
          }

          const morphT = Math.min(1, (v - morphStart) / (morphEnd - morphStart))
          const easedT = easeInOut(morphT)

          const target = getTargetForMode(shape, encodingMode)
          const pts = shape.resampled.map((a, pi) =>
            lerp(a, target[pi]!, easedT),
          )
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
          } else {
            chromeEl.style.opacity = "0"
          }
        }

        const countEl = countRefsMap.current.get(group.code)
        if (countEl) {
          const countFade =
            v >= 1 ? 1 : v < morphEnd ? 0 : Math.min(1, (v - morphEnd) / 0.01)
          countEl.style.opacity = String(countFade)
        }
      }
    }
    const unsub = progress.on("change", handler)
    // Only run initial sync if no tier-change animation is active.
    // The tier-change effect runs before this one (declaration order),
    // so tierChangeRafRef will already be set if a transition started.
    if (tierChangeRafRef.current == null) {
      handler(progress.get())
    }
    return unsub
  }, [progress, outcomeShapes, encodingMode, getTargetForMode, getColorForMode])

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
                        group.glyphMeta.barGlyphTop +
                        group.glyphMeta.barSpacing
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
              const isLocationActive =
                interactive &&
                activeLocationSet != null &&
                activeLocationSet.has(`${group.code}:${shape.sourceId}`)
              const isDimmed =
                interactive &&
                spotlightedTier != null &&
                shape.tier !== spotlightedTier
              const isBarMode = encodingMode === "bar"
              const isAvgMode = encodingMode === "average"
              const isBarOrAvg = isBarMode || isAvgMode
              const isClickable =
                interactive && (isSelected || (isBarMode && isSelected))
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
                        ? "#ffd87e"
                        : spotlightedTier === shape.tier
                          ? "#ffd87e"
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
                    interactive && isSelected
                      ? () =>
                          onLocationEnter?.({
                            code: group.code,
                            sourceId: shape.sourceId,
                            tier: shape.tier,
                          })
                      : undefined
                  }
                  onMouseLeave={
                    interactive && isSelected
                      ? () => onLocationLeave?.()
                      : undefined
                  }
                  onClick={
                    interactive && isSelected
                      ? (e) => {
                          e.stopPropagation()
                          if (isBarMode && onBarClick) {
                            onBarClick(group.code, shape.tier)
                          } else {
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
            {group.locationDescription && (
              <text
                ref={(el) => {
                  countRefsMap.current.set(group.code, el)
                }}
                x={group.countX}
                y={group.countY}
                fontSize={11}
                fontFamily="inherit"
                fill={theme.palette.ink.body}
                style={{ opacity: 0 }}
              >
                {group.locationDescription}
              </text>
            )}
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
              background: "rgba(255,255,255,0.92)",
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
