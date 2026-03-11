"use client"

import { useRef, useEffect, useMemo } from "react"
import type { MotionValue } from "@repo/motion"

const POINTS_PER_SHAPE = 96
const SQUARE_SIZE = 10
const SQUARE_GAP = 2
const ROW_GAP = 6
const BAR_GAP = 10

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

/* ── grid & bar layout ──────────────────────────────── */

interface GridLayout {
  gridX: number
  gridY: number
  row: number
  tierTopY: number
  barX: number
  barY: number
}

interface LayoutResult {
  positions: GridLayout[]
  thinWidth: number
}

function computeGridLayout(
  polygons: PolygonMorphData[],
  panelWidth: number,
  panelHeight: number,
): LayoutResult {
  const overlayLeft = panelWidth * 0.75
  const overlayWidth = panelWidth * 0.25
  const pad = overlayWidth * 0.08
  const overlayCenter = overlayLeft + overlayWidth / 2

  const tierTotals: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  for (const p of polygons) tierTotals[p.tier] = (tierTotals[p.tier] || 0) + 1

  const cell = SQUARE_SIZE + SQUARE_GAP
  const maxPerTier = Math.max(...Object.values(tierTotals))
  const cols = Math.ceil(
    Math.min(maxPerTier, Math.floor((overlayWidth - pad * 2) / cell)),
  )

  const tierRows: Record<number, number> = {}
  for (let tier = 1; tier <= 4; tier++) {
    tierRows[tier] = Math.ceil((tierTotals[tier] || 0) / cols)
  }
  const totalRows =
    (tierRows[1] || 0) + (tierRows[2] || 0) + (tierRows[3] || 0) + (tierRows[4] || 0)
  const totalGridHeight = totalRows * cell + 3 * ROW_GAP
  const gridStartY = (panelHeight - totalGridHeight) / 2

  const tierGridStartY: Record<number, number> = {}
  let cumY = gridStartY
  for (let tier = 1; tier <= 4; tier++) {
    tierGridStartY[tier] = cumY
    cumY += (tierRows[tier] || 0) * cell + ROW_GAP
  }

  const gridWidth = Math.min(cols, maxPerTier) * cell - SQUARE_GAP
  const gridLeft = overlayLeft + pad + (overlayWidth - pad * 2 - gridWidth) / 2

  // Thin width: fit all items in the widest tier within the overlay
  const maxBarArea = overlayWidth - pad * 2
  const thinW = Math.max(1, Math.min(3, Math.floor(maxBarArea / Math.max(maxPerTier, 1))))

  // Final bar layout: 4 bars stacked vertically, centered
  const barTotalHeight = 4 * SQUARE_SIZE + 3 * BAR_GAP
  const barStartY = (panelHeight - barTotalHeight) / 2

  const tierBuckets: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }

  const positions = polygons.map((p): GridLayout => {
    const idx = tierBuckets[p.tier] ?? 0
    tierBuckets[p.tier] = idx + 1
    const col = idx % cols
    const row = Math.floor(idx / cols)

    const gridX = gridLeft + col * cell + SQUARE_SIZE / 2
    const gridY = (tierGridStartY[p.tier] || 0) + row * cell + SQUARE_SIZE / 2
    const tierTopY = (tierGridStartY[p.tier] || 0) + SQUARE_SIZE / 2

    const barLeft = overlayLeft + pad
    const tierCount = tierTotals[p.tier] || 1
    const numRowsInTier = tierRows[p.tier] || 1
    const lastRowCount = tierCount - (numRowsInTier - 1) * cols
    const denseIdx = col < lastRowCount
      ? col * numRowsInTier + row
      : lastRowCount * numRowsInTier + (col - lastRowCount) * (numRowsInTier - 1) + row

    return {
      gridX,
      gridY,
      row,
      tierTopY,
      barX: barLeft + denseIdx * thinW + thinW / 2,
      barY: tierTopY,
    }
  })

  return { positions, thinWidth: thinW }
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
    const layout = computeGridLayout(sampled, panelWidth, panelHeight)
    const thinW = layout.thinWidth

    return sampled.map((poly, i) => {
      const l = layout.positions[i]!
      const resampled = resampleClosedPath(poly.screenPoly, POINTS_PER_SHAPE)
      const squareAtCentroid = rectPoints(
        poly.centroidScreen[0],
        poly.centroidScreen[1],
        SQUARE_SIZE,
        SQUARE_SIZE,
        POINTS_PER_SHAPE,
      )
      const squareAtGrid = rectPoints(l.gridX, l.gridY, SQUARE_SIZE, SQUARE_SIZE, POINTS_PER_SHAPE)
      const thinAtGrid = rectPoints(l.gridX, l.gridY, thinW, SQUARE_SIZE, POINTS_PER_SHAPE)
      const thinAtTop = rectPoints(l.gridX, l.tierTopY, thinW, SQUARE_SIZE, POINTS_PER_SHAPE)
      const barSlice = rectPoints(l.barX, l.barY, thinW, SQUARE_SIZE, POINTS_PER_SHAPE)

      return {
        polygon: resampled,
        square: squareAtCentroid,
        endSquare: squareAtGrid,
        thinAtGrid,
        thinAtTop,
        barSlice,
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
        svgRef.current.style.opacity = v >= CROSSFADE_THRESHOLD ? "1" : "0"
        if (v < CROSSFADE_THRESHOLD) return
      }

      for (let i = 0; i < shapes.length; i++) {
        const el = pathRefs.current[i]
        if (!el) continue
        const shape = shapes[i]
        if (!shape) continue
        const { polygon, square, endSquare, thinAtGrid, thinAtTop, barSlice, rawD } = shape
        const stagger = (i % 20) * 0.002

        // ── Forward: polygon → bars ──
        const morphStart = 0.20 + stagger
        const morphEnd = 0.28 + stagger
        const moveStart = 0.30 + stagger
        const moveEnd = 0.40 + stagger
        const shrinkStart = 0.42 + stagger
        const shrinkEnd = 0.48 + stagger
        const slideStart = 0.50 + stagger
        const slideEnd = 0.56 + stagger
        const condenseStart = 0.58 + stagger
        const condenseEnd = 0.66 + stagger
        // ── Hold bars ──
        const barHoldEnd = 0.72
        // ── Reverse: bars → squares ──
        const rExpandStart = 0.72 + stagger
        const rExpandEnd = 0.78 + stagger
        const rSlideStart = 0.78 + stagger
        const rSlideEnd = 0.84 + stagger
        const rGrowStart = 0.84 + stagger
        const rGrowEnd = 0.90 + stagger
        // 0.90+ : hold at endSquare (stays fixed as user scrolls away)

        if (v <= morphStart) {
          el.setAttribute("d", rawD)
          continue
        }

        let pts: [number, number][]

        // ── Forward phases ──
        if (v <= morphEnd) {
          const t = easeInOut((v - morphStart) / (morphEnd - morphStart))
          pts = polygon.map((p, j): [number, number] => [
            p[0] + (square[j]![0] - p[0]) * t,
            p[1] + (square[j]![1] - p[1]) * t,
          ])
        } else if (v <= moveStart) {
          pts = square
        } else if (v <= moveEnd) {
          const t = easeInOut((v - moveStart) / (moveEnd - moveStart))
          pts = square.map((p, j): [number, number] => [
            p[0] + (endSquare[j]![0] - p[0]) * t,
            p[1] + (endSquare[j]![1] - p[1]) * t,
          ])
        } else if (v <= shrinkStart) {
          pts = endSquare
        } else if (v <= shrinkEnd) {
          const t = easeInOut((v - shrinkStart) / (shrinkEnd - shrinkStart))
          pts = endSquare.map((p, j): [number, number] => [
            p[0] + (thinAtGrid[j]![0] - p[0]) * t,
            p[1] + (thinAtGrid[j]![1] - p[1]) * t,
          ])
        } else if (v <= slideStart) {
          pts = thinAtGrid
        } else if (v <= slideEnd) {
          const t = easeInOut((v - slideStart) / (slideEnd - slideStart))
          pts = thinAtGrid.map((p, j): [number, number] => [
            p[0] + (thinAtTop[j]![0] - p[0]) * t,
            p[1] + (thinAtTop[j]![1] - p[1]) * t,
          ])
        } else if (v <= condenseStart) {
          pts = thinAtTop
        } else if (v <= condenseEnd) {
          const t = easeInOut((v - condenseStart) / (condenseEnd - condenseStart))
          pts = thinAtTop.map((p, j): [number, number] => [
            p[0] + (barSlice[j]![0] - p[0]) * t,
            p[1] + (barSlice[j]![1] - p[1]) * t,
          ])

        // ── Hold bars ──
        } else if (v <= barHoldEnd) {
          pts = barSlice

        // ── Reverse: bars → thin at top (expand) ──
        } else if (v <= rExpandEnd) {
          const t = easeInOut((v - rExpandStart) / (rExpandEnd - rExpandStart))
          pts = barSlice.map((p, j): [number, number] => [
            p[0] + (thinAtTop[j]![0] - p[0]) * t,
            p[1] + (thinAtTop[j]![1] - p[1]) * t,
          ])
        // ── Reverse: thin at top → thin at grid (slide down) ──
        } else if (v <= rSlideEnd) {
          const t = easeInOut((v - rSlideStart) / (rSlideEnd - rSlideStart))
          pts = thinAtTop.map((p, j): [number, number] => [
            p[0] + (thinAtGrid[j]![0] - p[0]) * t,
            p[1] + (thinAtGrid[j]![1] - p[1]) * t,
          ])
        // ── Reverse: thin at grid → square at grid (grow) ──
        } else if (v <= rGrowEnd) {
          const t = easeInOut((v - rGrowStart) / (rGrowEnd - rGrowStart))
          pts = thinAtGrid.map((p, j): [number, number] => [
            p[0] + (endSquare[j]![0] - p[0]) * t,
            p[1] + (endSquare[j]![1] - p[1]) * t,
          ])
        // ── Hold at squares (stays fixed as user scrolls away) ──
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
