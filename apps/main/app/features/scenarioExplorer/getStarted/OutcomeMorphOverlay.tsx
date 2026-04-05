"use client"

import { useRef, useEffect, useMemo } from "react"
import type { MotionValue } from "@repo/motion"
import {
  type PolygonMorphData,
  resampleClosedPath,
  rectPoints,
  pointsToD,
  easeInOut,
  lerp,
  POINTS_PER_SHAPE,
  SQUARE_SIZE,
  SQUARE_GAP,
} from "./PolygonMorphOverlay"

export interface OutcomeGroup {
  code: string
  label: string
  polygons: PolygonMorphData[]
}

interface OutcomeMorphOverlayProps {
  outcomes: OutcomeGroup[]
  panelWidth: number
  panelHeight: number
  progress: MotionValue<number>
}

const GRID_PAD = 12
const MAX_POLYGONS_PER_OUTCOME = 80

function computeOutcomeLayout(
  polygons: PolygonMorphData[],
  targetX: number,
  targetY: number,
  maxWidth: number,
) {
  const cell = SQUARE_SIZE + SQUARE_GAP
  const cols = Math.max(1, Math.floor((maxWidth - GRID_PAD * 2) / cell))

  return polygons.map((poly, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const gridX = targetX + GRID_PAD + col * cell + SQUARE_SIZE / 2
    const gridY = targetY + row * cell + SQUARE_SIZE / 2

    const resampled = resampleClosedPath(poly.screenPoly, POINTS_PER_SHAPE)
    const squareTarget = rectPoints(
      gridX,
      gridY,
      SQUARE_SIZE,
      SQUARE_SIZE,
      POINTS_PER_SHAPE,
    )

    return {
      resampled,
      squareTarget,
      rawD: pointsToD(poly.screenPoly),
      color: poly.color,
      tier: poly.tier,
    }
  })
}

/**
 * Progress ranges for each outcome within Beat 2 (global progress 0.30–0.75).
 * Each outcome gets a slice for its polygon morph animation.
 * The first outcome (CWS_DEL) starts at 0.34 (after the intro text fades in).
 */
export function getOutcomeProgressRange(
  index: number,
  total: number,
): [number, number] {
  const beat2Start = 0.34
  const beat2End = 0.72
  const sliceWidth = (beat2End - beat2Start) / Math.max(total, 1)
  const start = beat2Start + index * sliceWidth
  return [start, start + sliceWidth * 0.7]
}

export default function OutcomeMorphOverlay({
  outcomes,
  panelWidth,
  panelHeight,
  progress,
}: OutcomeMorphOverlayProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRefsMap = useRef<Map<string, (SVGPathElement | null)[]>>(new Map())

  const outcomeShapes = useMemo(() => {
    const rightColumnX = panelWidth * 0.55
    const maxColumnWidth = panelWidth * 0.42

    const headerHeight = panelHeight * 0.12
    const outcomeSlotHeight =
      (panelHeight * 0.75 - headerHeight) / Math.max(outcomes.length, 1)

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

      const labelY = headerHeight + oi * outcomeSlotHeight
      const gridTargetY = labelY + 28

      const shapes = computeOutcomeLayout(
        sampled,
        rightColumnX,
        gridTargetY,
        maxColumnWidth,
      )

      return {
        code: outcome.code,
        shapes,
        progressRange: getOutcomeProgressRange(oi, outcomes.length),
      }
    })
  }, [outcomes, panelWidth, panelHeight])

  useEffect(() => {
    const unsub = progress.on("change", (v) => {
      for (const group of outcomeShapes) {
        const refs = pathRefsMap.current.get(group.code)
        if (!refs) continue

        const [morphStart, morphEnd] = group.progressRange
        const fadeStart = morphStart - 0.02

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

          const morphT = Math.min(
            1,
            (v - morphStart) / (morphEnd - morphStart),
          )
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
        pointerEvents: "none",
        zIndex: 2,
      }}
      viewBox={`0 0 ${panelWidth} ${panelHeight}`}
      preserveAspectRatio="none"
    >
      {outcomeShapes.map((group) => {
        if (!pathRefsMap.current.has(group.code)) {
          pathRefsMap.current.set(group.code, [])
        }
        const refs = pathRefsMap.current.get(group.code)!

        return group.shapes.map((shape, i) => (
          <path
            key={`${group.code}-${i}`}
            ref={(el) => {
              refs[i] = el
            }}
            d={shape.rawD}
            fill={shape.color}
            fillOpacity={0.75}
            stroke={shape.color}
            strokeWidth={0.5}
            strokeOpacity={0.4}
            style={{ opacity: 0 }}
          />
        ))
      })}
    </svg>
  )
}
