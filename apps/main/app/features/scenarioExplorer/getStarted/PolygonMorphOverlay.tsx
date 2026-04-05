"use client"

import { useRef, useEffect, useMemo } from "react"
import type { MotionValue } from "@repo/motion"

export const POINTS_PER_SHAPE = 96
export const SQUARE_SIZE = 10
export const SQUARE_GAP = 2
const ROW_GAP = 6
const BAR_HEIGHT = SQUARE_SIZE
const BAR_GAP = 2
const GLYPH_BAR_WIDTH = 60
const LABEL_GAP = 36

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

/* geometry helpers (exported for reuse by OutcomeMorphOverlay) */

export function resampleClosedPath(
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

export function rectPoints(
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

export function pointsToD(pts: [number, number][]): string {
  if (pts.length === 0) return ""
  const p0 = pts[0]!
  let d = `M${p0[0].toFixed(1)},${p0[1].toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i]!
    d += `L${p[0].toFixed(1)},${p[1].toFixed(1)}`
  }
  return d + "Z"
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

export function lerp(
  a: [number, number],
  b: [number, number],
  t: number,
): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}

/* grid & bar layout (stacked regions) */

interface GridLayout {
  gridX: number
  gridY: number
  row: number
  tierTopY: number
  barGridX: number
  barGridY: number
  barTierTopY: number
  barX: number
  barY: number
  glyphBarX: number
  glyphBarY: number
}

export interface LayoutInfo {
  gridLabelY: number
  barLabelY: number
}

interface LayoutResult {
  positions: GridLayout[]
  thinWidth: number
  glyphThinWidth: number
  glyphBarHeight: number
  info: LayoutInfo
}

function computeGridLayout(
  polygons: PolygonMorphData[],
  panelWidth: number,
  panelHeight: number,
): LayoutResult {
  const overlayLeft = panelWidth * 0.75
  const overlayWidth = panelWidth * 0.25
  const pad = overlayWidth * 0.08

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
    (tierRows[1] || 0) +
    (tierRows[2] || 0) +
    (tierRows[3] || 0) +
    (tierRows[4] || 0)
  const totalGridHeight = totalRows * cell + 3 * ROW_GAP

  // Top grid (distribution view)
  const gridRegionTop = panelHeight * 0.15 + LABEL_GAP
  const gridStartY = gridRegionTop

  const tierGridStartY: Record<number, number> = {}
  let cumY = gridStartY
  for (let tier = 1; tier <= 4; tier++) {
    tierGridStartY[tier] = cumY
    cumY += (tierRows[tier] || 0) * cell + ROW_GAP
  }

  const gridWidth = Math.min(cols, maxPerTier) * cell - SQUARE_GAP
  const gridLeft = overlayLeft + pad + (overlayWidth - pad * 2 - gridWidth) / 2

  const maxBarArea = overlayWidth - pad * 2
  const thinW = Math.max(
    1,
    Math.min(3, Math.floor(maxBarArea / Math.max(maxPerTier, 1))),
  )
  const glyphThinW = Math.max(0.5, GLYPH_BAR_WIDTH / Math.max(maxPerTier, 1))

  // Glyph proportions (matches BarChart component): 80% bars, 20% spacing
  const glyphBarH = (GLYPH_BAR_WIDTH * 0.8) / 4
  const glyphBarSpacing = (GLYPH_BAR_WIDTH * 0.2) / 5

  // Bar chart label
  const gridBottom = gridStartY + totalGridHeight
  const barLabelTop = gridBottom + LABEL_GAP
  const barContentTop = barLabelTop + LABEL_GAP

  // Lower bars
  const barStartY = barContentTop

  // Glyph final Y positions
  const glyphTopY = barContentTop

  // Mirror the grid layout into the bar region so clones can travel down as squares
  const barGridStartY = barContentTop
  const tierBarGridStartY: Record<number, number> = {}
  let barCumY = barGridStartY
  for (let tier = 1; tier <= 4; tier++) {
    tierBarGridStartY[tier] = barCumY
    barCumY += (tierRows[tier] || 0) * cell + ROW_GAP
  }

  const tierBuckets: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }

  const positions = polygons.map((p): GridLayout => {
    const idx = tierBuckets[p.tier] ?? 0
    tierBuckets[p.tier] = idx + 1
    const col = idx % cols
    const row = Math.floor(idx / cols)

    const gridX = gridLeft + col * cell + SQUARE_SIZE / 2
    const gridY = (tierGridStartY[p.tier] || 0) + row * cell + SQUARE_SIZE / 2
    const tierTopY = (tierGridStartY[p.tier] || 0) + SQUARE_SIZE / 2

    const barGridX = gridX
    const barGridY =
      (tierBarGridStartY[p.tier] || 0) + row * cell + SQUARE_SIZE / 2
    const barTierTopY = (tierBarGridStartY[p.tier] || 0) + SQUARE_SIZE / 2

    const barLeft = overlayLeft + pad
    const tierCount = tierTotals[p.tier] || 1
    const numRowsInTier = tierRows[p.tier] || 1
    const lastRowCount = tierCount - (numRowsInTier - 1) * cols
    const denseIdx =
      col < lastRowCount
        ? col * numRowsInTier + row
        : lastRowCount * numRowsInTier +
          (col - lastRowCount) * (numRowsInTier - 1) +
          row

    const barTierIdx = p.tier - 1

    return {
      gridX,
      gridY,
      row,
      tierTopY,
      barGridX,
      barGridY,
      barTierTopY,
      barX: barLeft + denseIdx * thinW + thinW / 2,
      barY: barStartY + barTierIdx * (BAR_HEIGHT + BAR_GAP) + BAR_HEIGHT / 2,
      glyphBarX: barLeft + denseIdx * glyphThinW + glyphThinW / 2,
      glyphBarY:
        glyphTopY +
        glyphBarSpacing +
        barTierIdx * (glyphBarH + glyphBarSpacing) +
        glyphBarH / 2,
    }
  })

  return {
    positions,
    thinWidth: thinW,
    glyphThinWidth: glyphThinW,
    glyphBarHeight: glyphBarH,
    info: {
      gridLabelY: panelHeight * 0.15,
      barLabelY: barLabelTop,
    },
  }
}

/* component */

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
  const primaryRefs = useRef<(SVGPathElement | null)[]>([])
  const cloneRefs = useRef<(SVGPathElement | null)[]>([])
  const dupeRefs = useRef<(SVGGElement | null)[]>([])
  const extraRowRefs = useRef<(SVGGElement | null)[]>([])
  const extraRectRefs = useRef<(SVGRectElement | null)[]>([])
  const spokeRefs = useRef<(SVGLineElement | null)[]>([])
  const ringRefs = useRef<(SVGCircleElement | null)[]>([])
  const labelRefs = useRef<(HTMLDivElement | null)[]>([])

  const sampled = useMemo(() => {
    if (polygons.length <= MAX_POLYGONS) return polygons
    const step = polygons.length / MAX_POLYGONS
    return Array.from(
      { length: MAX_POLYGONS },
      (_, i) => polygons[Math.floor(i * step)]!,
    )
  }, [polygons])

  const {
    shapes,
    layoutInfo,
    duplicateGlyphs,
    extraRows,
    rowYShift,
    radarLabelY,
  } = useMemo(() => {
    const layoutResult = computeGridLayout(sampled, panelWidth, panelHeight)
    const thinW = layoutResult.thinWidth
    const glyphThinW = layoutResult.glyphThinWidth
    const glyphBarH = layoutResult.glyphBarHeight

    const shapeData = sampled.map((poly, i) => {
      const l = layoutResult.positions[i]!
      const resampled = resampleClosedPath(poly.screenPoly, POINTS_PER_SHAPE)
      const squareAtCentroid = rectPoints(
        poly.centroidScreen[0],
        poly.centroidScreen[1],
        SQUARE_SIZE,
        SQUARE_SIZE,
        POINTS_PER_SHAPE,
      )
      const squareAtGrid = rectPoints(
        l.gridX,
        l.gridY,
        SQUARE_SIZE,
        SQUARE_SIZE,
        POINTS_PER_SHAPE,
      )

      // Clone targets: move down as squares, then morph to bars in the lower region
      const squareAtBarGrid = rectPoints(
        l.barGridX,
        l.barGridY,
        SQUARE_SIZE,
        SQUARE_SIZE,
        POINTS_PER_SHAPE,
      )
      const thinAtBarGrid = rectPoints(
        l.barGridX,
        l.barGridY,
        thinW,
        BAR_HEIGHT,
        POINTS_PER_SHAPE,
      )
      const thinAtBarTop = rectPoints(
        l.barGridX,
        l.barTierTopY,
        thinW,
        BAR_HEIGHT,
        POINTS_PER_SHAPE,
      )
      const barPackedAtTop = rectPoints(
        l.barX,
        l.barTierTopY,
        thinW,
        BAR_HEIGHT,
        POINTS_PER_SHAPE,
      )
      // Compressed to glyph width (X only)
      const barGlyph = rectPoints(
        l.glyphBarX,
        l.barTierTopY,
        glyphThinW,
        BAR_HEIGHT,
        POINTS_PER_SHAPE,
      )
      // Final glyph-sized position: compact to glyph height & spacing (Y only)
      const barFinal = rectPoints(
        l.glyphBarX,
        l.glyphBarY,
        glyphThinW,
        glyphBarH,
        POINTS_PER_SHAPE,
      )

      return {
        polygon: resampled,
        square: squareAtCentroid,
        endSquare: squareAtGrid,
        squareAtBarGrid,
        thinAtBarGrid,
        thinAtBarTop,
        barPackedAtTop,
        barGlyph,
        barFinal,
        color: poly.color,
        rawD: pointsToD(poly.screenPoly),
        endSquareD: pointsToD(squareAtGrid),
      }
    })

    // Compute duplicate glyph bars (static copies that fade in to the right)
    const overlayLeft = panelWidth * 0.75
    const overlayW = panelWidth * 0.25
    const padX = overlayW * 0.08
    const barLeft = overlayLeft + padX

    const tierCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
    const tierColors: Record<number, string> = {}
    for (const p of sampled) {
      tierCounts[p.tier] = (tierCounts[p.tier] || 0) + 1
      if (!tierColors[p.tier]) tierColors[p.tier] = p.color
    }

    const tierGlyphY: Record<number, number> = {}
    for (let i = 0; i < sampled.length; i++) {
      const tier = sampled[i]!.tier
      if (!tierGlyphY[tier])
        tierGlyphY[tier] = layoutResult.positions[i]!.glyphBarY
    }

    const COLS = 4
    const NUM_ROWS = 2
    const availableW = overlayW - padX * 2
    const spaceBetweenX =
      (availableW - COLS * GLYPH_BAR_WIDTH) / Math.max(COLS - 1, 1)

    const glyphBarSpacing = (GLYPH_BAR_WIDTH * 0.2) / 5
    const glyphRowH = 4 * glyphBarH + 5 * glyphBarSpacing
    const ROW_SPACING = 16
    type BarRect = {
      x: number
      y: number
      width: number
      height: number
      color: string
      cx: number
      cy: number
    }

    // Row 0: 3 duplicates to the right of the morphed original
    const row0: BarRect[][] = []
    for (let d = 0; d < COLS - 1; d++) {
      const offsetX = (d + 1) * (GLYPH_BAR_WIDTH + spaceBetweenX)
      const bars: BarRect[] = []
      for (let t = 1; t <= 4; t++) {
        bars.push({
          x: barLeft + offsetX,
          y: (tierGlyphY[t] || 0) - glyphBarH / 2,
          width: (tierCounts[t] || 0) * glyphThinW,
          height: glyphBarH,
          color: tierColors[t] || "#ccc",
          cx: 0,
          cy: 0,
        })
      }
      row0.push(bars)
    }

    // Row 1+: full rows below.each bar stores its parent glyph center
    const extraRows: BarRect[][][] = []
    for (let r = 1; r < NUM_ROWS; r++) {
      const rowGlyphs: BarRect[][] = []
      const yShift = r * (glyphRowH + ROW_SPACING)
      for (let c = 0; c < COLS; c++) {
        const offsetX = c * (GLYPH_BAR_WIDTH + spaceBetweenX)
        const glyphCx = barLeft + offsetX + GLYPH_BAR_WIDTH / 2
        const firstBarY = (tierGlyphY[1] || 0) - glyphBarH / 2 + yShift
        const lastBarBottom =
          (tierGlyphY[4] || 0) - glyphBarH / 2 + yShift + glyphBarH
        const glyphCy = (firstBarY + lastBarBottom) / 2
        const bars: BarRect[] = []
        for (let t = 1; t <= 4; t++) {
          bars.push({
            x: barLeft + offsetX,
            y: (tierGlyphY[t] || 0) - glyphBarH / 2 + yShift,
            width: (tierCounts[t] || 0) * glyphThinW,
            height: glyphBarH,
            color: tierColors[t] || "#ccc",
            cx: glyphCx,
            cy: glyphCy,
          })
        }
        rowGlyphs.push(bars)
      }
      extraRows.push(rowGlyphs)
    }

    const rowYShift = glyphRowH + ROW_SPACING

    let maxExtraDotCY = 0
    if (extraRows.length > 0) {
      for (const bars of extraRows[0]!) {
        maxExtraDotCY = Math.max(maxExtraDotCY, bars[0]?.cy || 0)
      }
    }
    const radarLabelY = maxExtraDotCY + 100 - 50 - 40

    return {
      shapes: shapeData,
      layoutInfo: layoutResult.info,
      duplicateGlyphs: row0,
      extraRows,
      rowYShift,
      radarLabelY,
    }
  }, [sampled, panelWidth, panelHeight])

  useEffect(() => {
    const CROSSFADE_THRESHOLD = 0.15
    const CLONE_SPAWN = 0.44
    const N = shapes.length

    // Pre-compute circle parameters from extra-row dot centers
    const COLS = 4
    const DOT_R = 4
    const DOT_SIZE = DOT_R * 2
    let circleCX = 0
    let maxDotCY = 0
    if (extraRows.length > 0 && extraRows[0]!.length > 0) {
      const first = extraRows[0]![0]!
      const last = extraRows[0]![extraRows[0]!.length - 1]!
      circleCX = (first[0]!.cx + last[0]!.cx) / 2
      for (const bars of extraRows[0]!) {
        maxDotCY = Math.max(maxDotCY, bars[0]?.cy || 0)
      }
    }
    const circleCY = maxDotCY + 100
    const circleRadius = 50

    const unsub = scrollProgress.on("change", (v) => {
      // Labels
      const mapLabel = labelRefs.current[0]
      const distLabel = labelRefs.current[1]
      const barLabel = labelRefs.current[2]
      const radarLabel = labelRefs.current[3]
      if (mapLabel) {
        const t = Math.min(1, Math.max(0, (v - 0.1) / 0.05))
        mapLabel.style.opacity = String(t)
      }
      if (distLabel) {
        const t = Math.min(1, Math.max(0, (v - 0.36) / 0.04))
        distLabel.style.opacity = String(t)
      }
      if (barLabel) {
        const t = Math.min(1, Math.max(0, (v - 0.72) / 0.03))
        barLabel.style.opacity = String(t)
      }
      if (radarLabel) {
        const t = Math.min(1, Math.max(0, (v - 0.9) / 0.03))
        radarLabel.style.opacity = String(t)
      }

      // SVG visibility
      if (svgRef.current) {
        svgRef.current.style.opacity = v >= CROSSFADE_THRESHOLD ? "1" : "0"
        if (v < CROSSFADE_THRESHOLD) return
      }

      // Primary paths: polygon -> square -> grid, then freeze
      for (let i = 0; i < N; i++) {
        const el = primaryRefs.current[i]
        if (!el) continue
        const shape = shapes[i]
        if (!shape) continue
        const { polygon, square, endSquare, rawD } = shape
        const stagger = (i % 20) * 0.002

        const morphStart = 0.16 + stagger
        const morphEnd = 0.22 + stagger
        const moveStart = 0.24 + stagger
        const moveEnd = 0.34 + stagger

        if (v <= morphStart) {
          el.setAttribute("d", rawD)
        } else if (v <= morphEnd) {
          const t = easeInOut((v - morphStart) / (morphEnd - morphStart))
          const pts = polygon.map((p, j) => lerp(p, square[j]!, t))
          el.setAttribute("d", pointsToD(pts))
        } else if (v <= moveStart) {
          el.setAttribute("d", pointsToD(square))
        } else if (v <= moveEnd) {
          const t = easeInOut((v - moveStart) / (moveEnd - moveStart))
          const pts = square.map((p, j) => lerp(p, endSquare[j]!, t))
          el.setAttribute("d", pointsToD(pts))
        } else {
          el.setAttribute("d", pointsToD(endSquare))
        }
      }

      // Clone paths: orthogonal sequence
      for (let i = 0; i < N; i++) {
        const el = cloneRefs.current[i]
        if (!el) continue
        const shape = shapes[i]
        if (!shape) continue

        if (v < CLONE_SPAWN) {
          el.style.opacity = "0"
          continue
        }
        el.style.opacity = "1"

        const {
          endSquare,
          squareAtBarGrid,
          thinAtBarGrid,
          thinAtBarTop,
          barPackedAtTop,
          barGlyph,
          barFinal,
        } = shape
        const stagger = (i % 20) * 0.002

        // 1. Drop (Y)
        const dropStart = 0.44 + stagger
        const dropEnd = 0.5 + stagger
        // HOLD 0.50 -> 0.53
        // 2. Narrow (width)
        const narrowStart = 0.53 + stagger
        const narrowEnd = 0.56 + stagger
        // 3. Combine rows (Y)
        const combineStart = 0.56 + stagger
        const combineEnd = 0.59 + stagger
        // HOLD 0.59 -> 0.62
        // 4. Compress left (X)
        const compressStart = 0.62 + stagger
        const compressEnd = 0.65 + stagger
        // HOLD 0.65 -> 0.67
        // 5. Glyph width (X)
        const glyphXStart = 0.67 + stagger
        const glyphXEnd = 0.7 + stagger
        // HOLD 0.70 -> 0.72
        // 6. Glyph height (Y, no stagger)
        const glyphYStart = 0.72
        const glyphYEnd = 0.75

        let pts: [number, number][]
        if (v <= dropStart) {
          pts = endSquare
        } else if (v <= dropEnd) {
          const t = easeInOut((v - dropStart) / (dropEnd - dropStart))
          pts = endSquare.map((p, j) => lerp(p, squareAtBarGrid[j]!, t))
        } else if (v <= narrowStart) {
          pts = squareAtBarGrid
        } else if (v <= narrowEnd) {
          const t = easeInOut((v - narrowStart) / (narrowEnd - narrowStart))
          pts = squareAtBarGrid.map((p, j) => lerp(p, thinAtBarGrid[j]!, t))
        } else if (v <= combineStart) {
          pts = thinAtBarGrid
        } else if (v <= combineEnd) {
          const t = easeInOut((v - combineStart) / (combineEnd - combineStart))
          pts = thinAtBarGrid.map((p, j) => lerp(p, thinAtBarTop[j]!, t))
        } else if (v <= compressStart) {
          pts = thinAtBarTop
        } else if (v <= compressEnd) {
          const t = easeInOut(
            (v - compressStart) / (compressEnd - compressStart),
          )
          pts = thinAtBarTop.map((p, j) => lerp(p, barPackedAtTop[j]!, t))
        } else if (v <= glyphXStart) {
          pts = barPackedAtTop
        } else if (v <= glyphXEnd) {
          const t = easeInOut((v - glyphXStart) / (glyphXEnd - glyphXStart))
          pts = barPackedAtTop.map((p, j) => lerp(p, barGlyph[j]!, t))
        } else if (v <= glyphYStart) {
          pts = barGlyph
        } else if (v <= glyphYEnd) {
          const t = easeInOut((v - glyphYStart) / (glyphYEnd - glyphYStart))
          pts = barGlyph.map((p, j) => lerp(p, barFinal[j]!, t))
        } else {
          pts = barFinal
        }

        el.setAttribute("d", pointsToD(pts))
      }

      // Row 0 duplicate glyphs: fade in left to right
      for (let d = 0; d < dupeRefs.current.length; d++) {
        const g = dupeRefs.current[d]
        if (!g) continue
        const fadeStart = 0.75 + d * 0.008
        const fadeEnd = fadeStart + 0.008
        const t = Math.min(
          1,
          Math.max(0, (v - fadeStart) / (fadeEnd - fadeStart)),
        )
        g.style.opacity = String(t)
      }

      // Extra rows: slide down (0.79-0.81)
      for (let r = 0; r < extraRowRefs.current.length; r++) {
        const g = extraRowRefs.current[r]
        if (!g) continue
        const visible = v >= 0.79
        g.style.opacity = visible ? "1" : "0"
        const slideT = Math.min(1, Math.max(0, (v - 0.79) / 0.02))
        const yOffset = -rowYShift * (1 - slideT)
        g.style.transform = `translateY(${yOffset}px)`
      }

      // Dot morph + arc to circle + spokes + radar (extraRectRefs)
      {
        const outerRingR = 0.9
        const radarFractions = [
          (outerRingR * 3) / 4,
          (outerRingR * 3) / 4,
          (outerRingR * 4) / 4,
          (outerRingR * 2) / 4,
        ]
        let ri = 0
        for (let r = 0; r < extraRows.length; r++) {
          for (let c = 0; c < extraRows[r]!.length; c++) {
            const bars = extraRows[r]![c]!
            const dotCX = bars[0]!.cx
            const dotCY = bars[0]!.cy

            const targetAngle = Math.PI + (c / COLS) * Math.PI * 2
            const startAngle = Math.atan2(dotCY - circleCY, dotCX - circleCX)
            let deltaAngle = targetAngle - startAngle
            while (deltaAngle < 0) deltaAngle += 2 * Math.PI
            const startDist = Math.sqrt(
              (dotCX - circleCX) ** 2 + (dotCY - circleCY) ** 2,
            )
            const finalAngle = startAngle + deltaAngle

            // Spoke lines: grow from dot toward center (0.91-0.93)
            const spoke = spokeRefs.current[c]
            if (spoke) {
              if (v >= 0.91) {
                spoke.style.opacity = "1"
                const spokeT = easeInOut(
                  Math.min(1, Math.max(0, (v - 0.91) / 0.02)),
                )
                const outerX = circleCX + Math.cos(finalAngle) * circleRadius
                const outerY = circleCY + Math.sin(finalAngle) * circleRadius
                const innerX = outerX + spokeT * (circleCX - outerX)
                const innerY = outerY + spokeT * (circleCY - outerY)
                spoke.setAttribute("x1", String(outerX))
                spoke.setAttribute("y1", String(outerY))
                spoke.setAttribute("x2", String(innerX))
                spoke.setAttribute("y2", String(innerY))
              } else if (v < 0.91) {
                spoke.style.opacity = "0"
              }
            }

            for (let b = 0; b < bars.length; b++) {
              const el = extraRectRefs.current[ri++]
              if (!el) continue
              const bar = bars[b]!

              // Phase 1: bars -> dots (0.83-0.85)
              const dotT = Math.min(1, Math.max(0, (v - 0.83) / 0.02))
              let cx = bar.x + dotT * (bar.cx - DOT_R - bar.x)
              let cy = bar.y + dotT * (bar.cy - DOT_R - bar.y)
              let w = Math.max(0, bar.width + dotT * (DOT_SIZE - bar.width))
              let h = Math.max(0, bar.height + dotT * (DOT_SIZE - bar.height))
              let rr = dotT * DOT_R

              // Phase 2: HOLD dots (0.85-0.87)
              // Phase 3: arc to circle (0.87-0.91)
              // Phase 4: spokes grow (0.91-0.93)
              // Phase 5: concentric rings fade in (0.93-0.95)
              // Phase 6: move inward to radar positions (0.95-0.965)
              // Phase 7: HOLD radar chart (0.965-1.0)
              if (v >= 0.87) {
                const arcT = easeInOut(
                  Math.min(1, Math.max(0, (v - 0.87) / 0.04)),
                )
                const angle = startAngle + arcT * deltaAngle
                const dist = startDist + arcT * (circleRadius - startDist)
                let newCX = circleCX + Math.cos(angle) * dist
                let newCY = circleCY + Math.sin(angle) * dist

                if (v >= 0.95) {
                  const radarDist = circleRadius * (radarFractions[c] ?? 0.5)
                  const inT = easeInOut(
                    Math.min(1, Math.max(0, (v - 0.95) / 0.015)),
                  )
                  newCX =
                    circleCX +
                    Math.cos(finalAngle) *
                      (circleRadius + inT * (radarDist - circleRadius))
                  newCY =
                    circleCY +
                    Math.sin(finalAngle) *
                      (circleRadius + inT * (radarDist - circleRadius))
                }

                cx = newCX - DOT_R
                cy = newCY - DOT_R
                w = DOT_SIZE
                h = DOT_SIZE
                rr = DOT_R
              }

              el.setAttribute("x", String(cx))
              el.setAttribute("y", String(cy))
              el.setAttribute("width", String(w))
              el.setAttribute("height", String(h))
              el.setAttribute("rx", String(rr))
              el.setAttribute("ry", String(rr))
            }
          }
        }
      }

      // Concentric rings: fade in from center outward (0.95-0.97)
      for (let i = 0; i < 4; i++) {
        const ring = ringRefs.current[i]
        if (!ring) continue
        ring.setAttribute("cx", String(circleCX))
        ring.setAttribute("cy", String(circleCY))
        const outerRingR = circleRadius * 0.9
        ring.setAttribute("r", String(outerRingR * ((i + 1) / 4)))
        const stagger = i * 0.004
        const fadeT = Math.min(1, Math.max(0, (v - (0.93 + stagger)) / 0.008))
        ring.style.opacity = String(fadeT)
      }
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes, scrollProgress, rowYShift])

  const overlayLeft = panelWidth * 0.75
  const overlayWidth = panelWidth * 0.25

  const labelStyle: React.CSSProperties = {
    position: "absolute",
    left: overlayLeft,
    width: overlayWidth,
    textAlign: "center",
    opacity: 0,
    zIndex: 4,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "rgba(0,0,0,0.45)",
    pointerEvents: "none",
  }

  return (
    <>
      {/* Labels */}
      <div
        ref={(el) => {
          labelRefs.current[0] = el
        }}
        style={{ ...labelStyle, top: panelHeight * 0.08 }}
      >
        Map view
      </div>
      <div
        ref={(el) => {
          labelRefs.current[1] = el
        }}
        style={{ ...labelStyle, top: layoutInfo.gridLabelY }}
      >
        Distribution view
      </div>
      <div
        ref={(el) => {
          labelRefs.current[2] = el
        }}
        style={{ ...labelStyle, top: layoutInfo.barLabelY }}
      >
        Bar chart
      </div>
      <div
        ref={(el) => {
          labelRefs.current[3] = el
        }}
        style={{ ...labelStyle, top: radarLabelY }}
      >
        Radar chart
      </div>

      {/* SVG overlay */}
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
        {/* Primary paths: polygon -> grid squares (freeze) */}
        {shapes.map((s, i) => (
          <path
            key={`p-${i}`}
            ref={(el) => {
              primaryRefs.current[i] = el
            }}
            fill={s.color}
            fillOpacity={fillOpacity}
            stroke={s.color}
            strokeWidth={strokeWidth}
            d={s.rawD}
          />
        ))}
        {/* Clone paths: grid squares -> bars */}
        {shapes.map((s, i) => (
          <path
            key={`c-${i}`}
            ref={(el) => {
              cloneRefs.current[i] = el
            }}
            fill={s.color}
            fillOpacity={fillOpacity}
            stroke={s.color}
            strokeWidth={strokeWidth}
            d={s.endSquareD}
            style={{ opacity: 0 }}
          />
        ))}
        {/* Row 0 duplicate glyph bar charts: fade in left to right */}
        {duplicateGlyphs.map((bars, d) => (
          <g
            key={`dup-${d}`}
            ref={(el) => {
              dupeRefs.current[d] = el
            }}
            style={{ opacity: 0 }}
          >
            {bars.map((bar, t) => (
              <rect
                key={t}
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                fill={bar.color}
                fillOpacity={fillOpacity}
                stroke={bar.color}
                strokeWidth={strokeWidth}
              />
            ))}
          </g>
        ))}
        {/* Extra rows of glyph bar charts */}
        {(() => {
          let ri = 0
          return extraRows.map((rowGlyphs, r) => (
            <g
              key={`row-${r}`}
              ref={(el) => {
                extraRowRefs.current[r] = el
              }}
              style={{ opacity: 0 }}
            >
              {rowGlyphs.map((bars, c) => (
                <g key={`col-${c}`}>
                  {bars.map((bar, t) => {
                    const idx = ri++
                    return (
                      <rect
                        key={t}
                        ref={(el) => {
                          extraRectRefs.current[idx] = el
                        }}
                        x={bar.x}
                        y={bar.y}
                        width={bar.width}
                        height={bar.height}
                        fill={bar.color}
                        fillOpacity={fillOpacity}
                        stroke={bar.color}
                        strokeWidth={strokeWidth}
                      />
                    )
                  })}
                </g>
              ))}
            </g>
          ))
        })()}
        {/* Concentric radar rings */}
        {[1, 2, 3, 4].map((i) => (
          <circle
            key={`ring-${i}`}
            ref={(el) => {
              ringRefs.current[i - 1] = el
            }}
            fill="none"
            stroke="rgba(0,0,0,0.15)"
            strokeWidth={0.75}
            style={{ opacity: 0 }}
          />
        ))}
        {/* Radar spoke lines (dot -> center) */}
        {[0, 1, 2, 3].map((i) => (
          <line
            key={`spoke-${i}`}
            ref={(el) => {
              spokeRefs.current[i] = el
            }}
            stroke="rgba(0,0,0,0.25)"
            strokeWidth={1}
            style={{ opacity: 0 }}
          />
        ))}
      </svg>
    </>
  )
}
