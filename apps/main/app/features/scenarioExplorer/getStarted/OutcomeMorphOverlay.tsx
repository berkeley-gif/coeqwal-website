"use client"

import { useRef, useLayoutEffect, useMemo, useCallback } from "react"
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
import type { ChartDataPoint } from "../../scenarios/components/shared/types"

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

const BAR_HEIGHT = 10
const BAR_SPACING = 4
const BAR_MAX_WIDTH_FRACTION = 0.85
const DOT_RADIUS = 8

function computeOutcomeLayout(
  polygons: ShapeMorphData[],
  targetX: number,
  targetY: number,
  maxWidth: number,
  maxCols: number,
  barValues?: number[],
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

  const maxBarWidth = (maxWidth - GRID_PAD * 2) * BAR_MAX_WIDTH_FRACTION
  const barLeftX = targetX + GRID_PAD

  const dotCx = targetX + GRID_PAD + maxWidth / 4
  const dotCy = targetY + (tierKeys.length * (BAR_HEIGHT + BAR_SPACING)) / 2

  const results: {
    resampled: [number, number][]
    squareTarget: [number, number][]
    barTarget: [number, number][]
    dotTarget: [number, number][]
    rawD: string
    color: string
    tier: number
    sourceId: string
  }[] = []

  let currentRow = 0
  for (let ti = 0; ti < tierKeys.length; ti++) {
    const tier = tierKeys[ti]!
    const group = byTier.get(tier)!

    const normVal = barValues?.[ti] ?? 0.5
    const barW = Math.max(4, normVal * maxBarWidth)
    const barCx = barLeftX + barW / 2
    const barCy =
      targetY + ti * (BAR_HEIGHT + BAR_SPACING) + BAR_HEIGHT / 2
    const barPts = rectPoints(barCx, barCy, barW, BAR_HEIGHT, POINTS_PER_SHAPE)
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
      })
    }
    currentRow += Math.ceil(group.length / cols)
  }

  return results
}

/**
 * Progress ranges for each outcome within Beat 2 (global progress 0.70–0.96).
 * Each outcome gets a slice for its polygon morph animation.
 * Morphing begins at 0.70, after tier colors have settled on the map.
 */
export function getOutcomeProgressRange(
  index: number,
  total: number,
): [number, number] {
  const beat2Start = 0.8
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
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRefsMap = useRef<Map<string, (SVGPathElement | null)[]>>(new Map())
  const countRefsMap = useRef<Map<string, SVGTextElement | null>>(new Map())

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

      const chartPoints = tierChartData?.[outcome.code]
      const barValues = chartPoints?.map((p) => p.value)

      const shapes = computeOutcomeLayout(
        sampled,
        gridTargetX,
        gridTargetY,
        maxColWidth,
        squaresPerRow,
        barValues,
      )

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
      const countY = shapes.length > 0 ? maxY + pad + 14 : gridTargetY + 46
      const bounds = {
        x: boundsLeft,
        y: boundsTop,
        width: boundsRight - boundsLeft,
        height: Math.max(boundsBottom, countY + 4) - boundsTop,
      }

      return {
        code: outcome.code,
        shapes,
        bounds,
        locationDescription,
        countY,
        countX: gridTargetX + GRID_PAD,
        progressRange: getOutcomeProgressRange(oi, outcomes.length),
      }
    })
  }, [outcomes, panelWidth, squaresPerRow, distributionPositionMap, tierChartData])

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

  useLayoutEffect(() => {
    if (prevEncodingRef.current !== encodingMode && progress.get() >= 1) {
      encodingFromRef.current = prevEncodingRef.current
      encodingMorphRef.current = 0
      prevEncodingRef.current = encodingMode

      const startTime = performance.now()
      const duration = 500

      const tick = (now: number) => {
        const elapsed = now - startTime
        const t = Math.min(1, elapsed / duration)
        encodingMorphRef.current = easeInOut(t)

        for (const group of outcomeShapes) {
          const refs = pathRefsMap.current.get(group.code)
          if (!refs) continue
          for (let i = 0; i < group.shapes.length; i++) {
            const el = refs[i]
            if (!el) continue
            const shape = group.shapes[i]!
            const from = getTargetForMode(shape, encodingFromRef.current)
            const to = getTargetForMode(shape, encodingMode)
            const pts = from.map((a, pi) =>
              lerp(a, to[pi]!, encodingMorphRef.current),
            )
            el.setAttribute("d", pointsToD(pts))
          }
        }

        if (t < 1) {
          encodingRafRef.current = requestAnimationFrame(tick)
        } else {
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
  }, [encodingMode, outcomeShapes, progress, getTargetForMode])

  useLayoutEffect(() => {
    const handler = (v: number) => {
      if (encodingRafRef.current != null) return

      for (const group of outcomeShapes) {
        const refs = pathRefsMap.current.get(group.code)
        if (!refs) continue

        const [morphStart, morphEnd] = group.progressRange
        const fadeStart = morphStart - 0.03

        for (let i = 0; i < group.shapes.length; i++) {
          const el = refs[i]
          if (!el) continue
          const shape = group.shapes[i]!

          const opacity =
            v < fadeStart
              ? 0
              : v < morphStart
                ? Math.min(1, (v - fadeStart) / (morphStart - fadeStart))
                : 1

          if (v < morphStart) {
            el.setAttribute("d", shape.rawD)
            el.style.opacity = String(opacity)
            continue
          }

          const morphT = Math.min(1, (v - morphStart) / (morphEnd - morphStart))
          const easedT = easeInOut(morphT)

          const target = getTargetForMode(shape, encodingMode)
          const pts = shape.resampled.map((a, pi) =>
            lerp(a, target[pi]!, easedT),
          )
          el.setAttribute("d", pointsToD(pts))
          el.style.opacity = String(opacity)
        }

        const countEl = countRefsMap.current.get(group.code)
        if (countEl) {
          const countFade =
            v < morphEnd ? 0 : Math.min(1, (v - morphEnd) / 0.02)
          countEl.style.opacity = String(countFade)
        }
      }
    }
    const unsub = progress.on("change", handler)
    handler(progress.get())
    return unsub
  }, [progress, outcomeShapes, encodingMode, getTargetForMode])

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
              const isClickable =
                interactive &&
                (isSelected || (isBarMode && isSelected))
              return (
                <path
                  key={`${group.code}-${i}`}
                  ref={(el) => {
                    refs[i] = el
                  }}
                  d={shape.rawD}
                  fill={shape.color}
                  fillOpacity={
                    isDimmed
                      ? 0.2
                      : isLocationActive
                        ? 1
                        : isSelected
                          ? 0.9
                          : 0.75
                  }
                  stroke={
                    isLocationActive
                      ? "#ffd87e"
                      : spotlightedTier === shape.tier
                        ? "#ffd87e"
                        : shape.color
                  }
                  strokeWidth={
                    isLocationActive
                      ? 2
                      : spotlightedTier === shape.tier
                        ? 1.5
                        : 0.5
                  }
                  strokeOpacity={isDimmed ? 0.2 : isLocationActive ? 1 : 0.4}
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
                fill="#555"
                style={{ opacity: 0 }}
              >
                {group.locationDescription}
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
