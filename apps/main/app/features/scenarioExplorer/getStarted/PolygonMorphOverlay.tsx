"use client"

import { useRef, useEffect, useMemo } from "react"
import type { MotionValue } from "@repo/motion"

const POINTS_PER_SHAPE = 96
const SQUARE_SIZE = 10
const SQUARE_GAP = 2
const ROW_GAP = 6

export interface PolygonMorphData {
  screenPoly: [number, number][]
  centroidScreen: [number, number]
  color: string
  tier: number
}

interface PolygonMorphOverlayProps {
  polygons: PolygonMorphData[]
  panelWidth: number
  panelHeight: number
  fillOpacity: number
  strokeWidth: number
  scrollProgress: MotionValue<number>
}

/* ── geometry helpers ────────────────────────────────── */

function resampleClosedPath(
  points: [number, number][],
  n: number,
): [number, number][] {
  if (points.length < 2)
    return Array(n).fill(points[0] ?? [0, 0]) as [number, number][]

  const closed = [...points]
  const first = closed[0]!
  const last = closed[closed.length - 1]!
  if (first[0] !== last[0] || first[1] !== last[1]) closed.push(first)

  const cumDist = [0]
  for (let i = 1; i < closed.length; i++) {
    const cur = closed[i]!
    const prev = closed[i - 1]!
    const dx = cur[0] - prev[0]
    const dy = cur[1] - prev[1]
    cumDist.push(cumDist[i - 1]! + Math.sqrt(dx * dx + dy * dy))
  }
  const total = cumDist[cumDist.length - 1]!
  if (total === 0) return Array(n).fill(first) as [number, number][]

  const out: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const target = (i / n) * total
    let s = 0
    while (s < cumDist.length - 2 && cumDist[s + 1]! < target) s++
    const segLen = cumDist[s + 1]! - cumDist[s]!
    const t = segLen > 0 ? (target - cumDist[s]!) / segLen : 0
    const a = closed[s]!
    const b = closed[s + 1]!
    out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])])
  }
  return out
}

function rectPoints(
  cx: number,
  cy: number,
  w: number,
  h: number,
  n: number,
): [number, number][] {
  const hw = w / 2,
    hh = h / 2
  return resampleClosedPath(
    [
      [cx - hw, cy - hh],
      [cx + hw, cy - hh],
      [cx + hw, cy + hh],
      [cx - hw, cy + hh],
    ],
    n,
  )
}

function pointsToD(pts: [number, number][]): string {
  if (pts.length === 0) return ""
  const p0 = pts[0]!
  let d = `M${p0[0].toFixed(1)},${p0[1].toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i]!
    d += `L${p[0].toFixed(1)},${p[1].toFixed(1)}`
  }
  return d + "Z"
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

/* ── grid-position layout (squares in tier rows) ─────── */

function computeGridPositions(
  polygons: PolygonMorphData[],
  panelWidth: number,
  panelHeight: number,
): { x: number; y: number }[] {
  const overlayLeft = panelWidth * 0.75
  const overlayWidth = panelWidth * 0.25
  const pad = overlayWidth * 0.08

  const tierTotals: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  for (const p of polygons) tierTotals[p.tier] = (tierTotals[p.tier] || 0) + 1

  const cell = SQUARE_SIZE + SQUARE_GAP
  const maxPerTier = Math.max(...Object.values(tierTotals))
  const cols = Math.ceil(
    Math.min(
      maxPerTier,
      Math.floor((overlayWidth - pad * 2) / cell),
    ),
  )

  const tierRows: Record<number, number> = {}
  for (let tier = 1; tier <= 4; tier++) {
    tierRows[tier] = Math.ceil((tierTotals[tier] || 0) / cols)
  }
  const totalRows =
    (tierRows[1] || 0) + (tierRows[2] || 0) + (tierRows[3] || 0) + (tierRows[4] || 0)
  const totalHeight = totalRows * cell + 3 * ROW_GAP
  const startY = (panelHeight - totalHeight) / 2

  const tierBuckets: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  let tierStartY: Record<number, number> = {}
  let cumY = startY
  for (let tier = 1; tier <= 4; tier++) {
    tierStartY[tier] = cumY
    cumY += (tierRows[tier] || 0) * cell + ROW_GAP
  }

  const gridWidth = Math.min(cols, maxPerTier) * cell - SQUARE_GAP
  const gridLeft = overlayLeft + pad + (overlayWidth - pad * 2 - gridWidth) / 2

  return polygons.map((p) => {
    const idx = tierBuckets[p.tier] ?? 0
    tierBuckets[p.tier] = idx + 1
    const col = idx % cols
    const row = Math.floor(idx / cols)
    return {
      x: gridLeft + col * cell + SQUARE_SIZE / 2,
      y: (tierStartY[p.tier] || 0) + row * cell + SQUARE_SIZE / 2,
    }
  })
}

/* ── component ───────────────────────────────────────── */

const MAX_POLYGONS = 120

export default function PolygonMorphOverlay({
  polygons,
  panelWidth,
  panelHeight,
  fillOpacity,
  strokeWidth,
  scrollProgress,
}: PolygonMorphOverlayProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRefs = useRef<(SVGPathElement | null)[]>([])

  const sampled = useMemo(() => {
    if (polygons.length <= MAX_POLYGONS) return polygons
    const step = polygons.length / MAX_POLYGONS
    return Array.from({ length: MAX_POLYGONS }, (_, i) =>
      polygons[Math.floor(i * step)]!,
    )
  }, [polygons])

  const shapes = useMemo(() => {
    const gridPositions = computeGridPositions(sampled, panelWidth, panelHeight)

    return sampled.map((poly, i) => {
      const resampled = resampleClosedPath(poly.screenPoly, POINTS_PER_SHAPE)
      const squareAtCentroid = rectPoints(
        poly.centroidScreen[0],
        poly.centroidScreen[1],
        SQUARE_SIZE,
        SQUARE_SIZE,
        POINTS_PER_SHAPE,
      )
      const grid = gridPositions[i]!
      const squareAtGrid = rectPoints(
        grid.x,
        grid.y,
        SQUARE_SIZE,
        SQUARE_SIZE,
        POINTS_PER_SHAPE,
      )

      return {
        polygon: resampled,
        square: squareAtCentroid,
        endSquare: squareAtGrid,
        color: poly.color,
        rawD: pointsToD(poly.screenPoly),
        initialD: pointsToD(poly.screenPoly),
      }
    })
  }, [sampled, panelWidth, panelHeight])

  useEffect(() => {
    const CROSSFADE_THRESHOLD = 0.15
    const unsub = scrollProgress.on("change", (v) => {
      if (svgRef.current) {
        svgRef.current.style.opacity = v >= CROSSFADE_THRESHOLD && v < 0.999 ? "1" : "0"
        if (v < CROSSFADE_THRESHOLD || v >= 0.999) return
      }

      for (let i = 0; i < shapes.length; i++) {
        const el = pathRefs.current[i]
        if (!el) continue
        const shape = shapes[i]
        if (!shape) continue
        const { polygon, square, endSquare, rawD } = shape
        const stagger = (i % 20) * 0.003

        const morphStart = 0.30 + stagger
        const morphEnd = 0.45 + stagger
        const moveStart = 0.50 + stagger
        const moveEnd = 0.70 + stagger

        if (v <= morphStart) {
          // Use raw (unsampled) polygon vertices — exact match to Mapbox geometry
          el.setAttribute("d", rawD)
          continue
        }

        let pts: [number, number][]
        if (v <= morphEnd) {
          const t = easeInOut(
            Math.min(1, (v - morphStart) / (morphEnd - morphStart)),
          )
          pts = polygon.map((p: [number, number], j: number): [number, number] => [
            p[0] + (square[j]![0] - p[0]) * t,
            p[1] + (square[j]![1] - p[1]) * t,
          ])
        } else if (v <= moveStart) {
          pts = square
        } else if (v <= moveEnd) {
          const t = easeInOut(
            Math.min(1, (v - moveStart) / (moveEnd - moveStart)),
          )
          pts = square.map((p: [number, number], j: number): [number, number] => [
            p[0] + (endSquare[j]![0] - p[0]) * t,
            p[1] + (endSquare[j]![1] - p[1]) * t,
          ])
        } else {
          pts = endSquare
        }

        el.setAttribute("d", pointsToD(pts))
      }
    })
    return unsub
  }, [shapes, scrollProgress])

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
        opacity: 0,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {shapes.map((s, i) => (
        <path
          key={i}
          ref={(el) => {
            pathRefs.current[i] = el
          }}
          fill={s.color}
          fillOpacity={fillOpacity}
          stroke={s.color}
          strokeWidth={strokeWidth}
          d={s.initialD}
        />
      ))}
    </svg>
  )
}
