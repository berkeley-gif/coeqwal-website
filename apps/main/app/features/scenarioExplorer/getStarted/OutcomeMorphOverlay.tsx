"use client"

import { useRef, useEffect, useLayoutEffect, useMemo, useCallback } from "react"
import type { MotionValue } from "@repo/motion"
import {
  type ShapeMorphData,
  resampleClosedPath,
  rectPoints,
  pointsToD,
  easeInOut,
  lerp,
  POINTS_PER_SHAPE,
  SQUARE_SIZE,
  SQUARE_GAP,
} from "@repo/viz"
import { useHoverPin } from "@repo/ui/hooks"
import { getTierLabel } from "../../../content/tiers"
import {
  ENV_FLOWS_NAMES,
  STATION_NAMES,
} from "../../map/config/outcomeLocations"
import { RESERVOIR_CALSIM_TO_GNISIDLABEL } from "../../map/config/outcomeLayerRegistry"

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
  onLocationHover?: (info: LocationInfo | null) => void
  onLocationPin?: (info: LocationInfo | null) => void
  /** Maps "outcomeCode:sourceId" → human-readable name from Mapbox features */
  locationNameMap?: Record<string, string>
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

function computeOutcomeLayout(
  polygons: ShapeMorphData[],
  targetX: number,
  targetY: number,
  maxWidth: number,
  maxCols: number,
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

  const results: {
    resampled: [number, number][]
    squareTarget: [number, number][]
    rawD: string
    color: string
    tier: number
    sourceId: string
  }[] = []

  let currentRow = 0
  for (const tier of tierKeys) {
    const group = byTier.get(tier)!
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
  const beat2Start = 0.7
  const beat2End = 0.96
  const sliceWidth = (beat2End - beat2Start) / Math.max(total, 1)
  const start = beat2Start + index * sliceWidth
  return [start, start + sliceWidth * 0.8]
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
  onLocationHover,
  onLocationPin,
  locationNameMap,
}: OutcomeMorphOverlayProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRefsMap = useRef<Map<string, (SVGPathElement | null)[]>>(new Map())
  const countRefsMap = useRef<Map<string, SVGTextElement | null>>(new Map())

  const locationIsEqual = useCallback(
    (a: LocationInfo, b: LocationInfo) =>
      a.code === b.code && a.sourceId === b.sourceId,
    [],
  )

  const handleActiveChange = useCallback(
    (item: LocationInfo | null) => {
      onLocationHover?.(item)
    },
    [onLocationHover],
  )

  const { activeItem: activeLocation, handlers: locHandlers, clearAll: clearLocationHoverPin } =
    useHoverPin<LocationInfo>({
      isEqual: locationIsEqual,
      onActiveChange: handleActiveChange,
    })

  useEffect(() => {
    clearLocationHoverPin()
  }, [selectedOutcomeCode, clearLocationHoverPin])

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

      const shapes = computeOutcomeLayout(
        sampled,
        gridTargetX,
        gridTargetY,
        maxColWidth,
        squaresPerRow,
      )

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
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
      const boundsTop = shapes.length > 0 ? Math.min(labelY, minY - pad) : labelY
      const boundsBottom = shapes.length > 0 ? maxY + pad : labelY + 32
      const boundsLeft = shapes.length > 0 ? minX - pad : gridTargetX
      const boundsRight = shapes.length > 0
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
  }, [outcomes, panelWidth, squaresPerRow, distributionPositionMap])

  const tooltipInfo = useMemo(() => {
    if (!activeLocation) return null
    const group = outcomeShapes.find((g) => g.code === activeLocation.code)
    if (!group) return null
    const shape = group.shapes.find(
      (s) => s.sourceId === activeLocation.sourceId,
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
        locationNameMap?.[`${activeLocation.code}:${activeLocation.sourceId}`] ??
        getLocationName(activeLocation.code, activeLocation.sourceId),
      tier: getTierLabel(activeLocation.tier),
      color: shape.color,
    }
  }, [activeLocation, outcomeShapes, locationNameMap])

  useLayoutEffect(() => {
    const handler = (v: number) => {
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

          const pts = shape.resampled.map((a, pi) =>
            lerp(a, shape.squareTarget[pi]!, easedT),
          )
          el.setAttribute("d", pointsToD(pts))
          el.style.opacity = String(opacity)
        }

        const countEl = countRefsMap.current.get(group.code)
        if (countEl) {
          const countFade = v < morphEnd ? 0 : Math.min(1, (v - morphEnd) / 0.02)
          countEl.style.opacity = String(countFade)
        }
      }
    }
    const unsub = progress.on("change", handler)
    handler(progress.get())
    return unsub
  }, [progress, outcomeShapes])

  return (
    <svg
      ref={svgRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: interactive ? "auto" : "none",
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
                activeLocation !== null &&
                activeLocation.code === group.code &&
                activeLocation.sourceId === shape.sourceId
              return (
                <path
                  key={`${group.code}-${i}`}
                  ref={(el) => {
                    refs[i] = el
                  }}
                  d={shape.rawD}
                  fill={shape.color}
                  fillOpacity={
                    isLocationActive ? 1 : isSelected ? 0.9 : 0.75
                  }
                  stroke={isLocationActive ? "#fff" : shape.color}
                  strokeWidth={isLocationActive ? 1.5 : 0.5}
                  strokeOpacity={isLocationActive ? 1 : 0.4}
                  style={{
                    opacity: 0,
                    transition:
                      "fill-opacity 0.15s, stroke 0.15s, stroke-width 0.15s",
                  }}
                  pointerEvents={interactive && isSelected ? "all" : "none"}
                  onMouseEnter={
                    interactive && isSelected
                      ? () =>
                          locHandlers.onMouseEnter({
                            code: group.code,
                            sourceId: shape.sourceId,
                            tier: shape.tier,
                          })
                      : undefined
                  }
                  onMouseLeave={
                    interactive && isSelected
                      ? locHandlers.onMouseLeave
                      : undefined
                  }
                  onClick={
                    interactive && isSelected
                      ? (e) => {
                          e.stopPropagation()
                          locHandlers.onClick({
                            code: group.code,
                            sourceId: shape.sourceId,
                            tier: shape.tier,
                          })
                          onLocationPin?.({
                            code: group.code,
                            sourceId: shape.sourceId,
                            tier: shape.tier,
                          })
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

      {tooltipInfo && (
        <foreignObject
          x={tooltipInfo.x - 100}
          y={tooltipInfo.y - 40}
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
            <span style={{ fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
              {tooltipInfo.name}
            </span>
            <span style={{ color: tooltipInfo.color, fontWeight: 500 }}>
              {tooltipInfo.tier}
            </span>
          </div>
        </foreignObject>
      )}
    </svg>
  )
}
