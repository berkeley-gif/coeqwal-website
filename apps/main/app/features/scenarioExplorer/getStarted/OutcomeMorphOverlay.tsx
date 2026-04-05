"use client"

import { useRef, useEffect, useMemo } from "react"
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

export interface OutcomeGroup {
  code: string
  label: string
  polygons: ShapeMorphData[]
}

interface OutcomeMorphOverlayProps {
  outcomes: OutcomeGroup[]
  panelWidth: number
  panelHeight: number
  progress: MotionValue<number>
  squaresPerRow: number
  distributionPositionMap: Record<
    string,
    { x: number; y: number; maxWidth: number }
  >
  onOutcomeClick?: (code: string) => void
  selectedOutcomeCode?: string | null
  interactive?: boolean
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
}: OutcomeMorphOverlayProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRefsMap = useRef<Map<string, (SVGPathElement | null)[]>>(new Map())

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

      return {
        code: outcome.code,
        shapes,
        progressRange: getOutcomeProgressRange(oi, outcomes.length),
      }
    })
  }, [outcomes, panelWidth, squaresPerRow, distributionPositionMap])

  useEffect(() => {
    const unsub = progress.on("change", (v) => {
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
      }
    })
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
            {group.shapes.map((shape, i) => (
              <path
                key={`${group.code}-${i}`}
                ref={(el) => {
                  refs[i] = el
                }}
                d={shape.rawD}
                fill={shape.color}
                fillOpacity={isSelected ? 1 : 0.75}
                stroke={shape.color}
                strokeWidth={0.5}
                strokeOpacity={0.4}
                style={{ opacity: 0, transition: "fill-opacity 0.2s" }}
              />
            ))}
          </g>
        )
      })}
    </svg>
  )
}
