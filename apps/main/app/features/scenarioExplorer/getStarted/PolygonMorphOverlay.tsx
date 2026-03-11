"use client"

import { useRef, useEffect, useMemo } from "react"
import type { MotionValue } from "@repo/motion"

const POINTS_PER_SHAPE = 96
const SQUARE_SIZE = 10
const SQUARE_GAP = 2
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

function lerp(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}

/* ── grid & bar layout (stacked regions) ─────────────── */

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
    (tierRows[1] || 0) + (tierRows[2] || 0) + (tierRows[3] || 0) + (tierRows[4] || 0)
  const totalGridHeight = totalRows * cell + 3 * ROW_GAP

  // Upper region: grid (Distribution view) — top-aligned, starts just below label
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
  const thinW = Math.max(1, Math.min(3, Math.floor(maxBarArea / Math.max(maxPerTier, 1))))
  const glyphThinW = Math.max(0.5, GLYPH_BAR_WIDTH / Math.max(maxPerTier, 1))

  // Glyph proportions (matches BarChart component): 80% bars, 20% spacing
  const glyphBarH = (GLYPH_BAR_WIDTH * 0.8) / 4
  const glyphBarSpacing = (GLYPH_BAR_WIDTH * 0.2) / 5

  // Bar chart label sits below the grid with a clean gap
  const gridBottom = gridStartY + totalGridHeight
  const barLabelTop = gridBottom + LABEL_GAP
  const barContentTop = barLabelTop + LABEL_GAP

  // Lower region: bars — top-aligned below label
  const barTotalHeight = 4 * BAR_HEIGHT + 3 * BAR_GAP
  const barStartY = barContentTop

  // Glyph final Y positions — top-aligned in the bar region
  const glyphTotalH = 4 * glyphBarH + 5 * glyphBarSpacing
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
    const barGridY = (tierBarGridStartY[p.tier] || 0) + row * cell + SQUARE_SIZE / 2
    const barTierTopY = (tierBarGridStartY[p.tier] || 0) + SQUARE_SIZE / 2

    const barLeft = overlayLeft + pad
    const tierCount = tierTotals[p.tier] || 1
    const numRowsInTier = tierRows[p.tier] || 1
    const lastRowCount = tierCount - (numRowsInTier - 1) * cols
    const denseIdx = col < lastRowCount
      ? col * numRowsInTier + row
      : lastRowCount * numRowsInTier + (col - lastRowCount) * (numRowsInTier - 1) + row

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
      glyphBarY: glyphTopY + glyphBarSpacing + barTierIdx * (glyphBarH + glyphBarSpacing) + glyphBarH / 2,
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
  const primaryRefs = useRef<(SVGPathElement | null)[]>([])
  const cloneRefs = useRef<(SVGPathElement | null)[]>([])
  const dupeRefs = useRef<(SVGGElement | null)[]>([])
  const extraRowRefs = useRef<(SVGGElement | null)[]>([])
  const labelRefs = useRef<(HTMLDivElement | null)[]>([])

  const sampled = useMemo(() => {
    if (polygons.length <= MAX_POLYGONS) return polygons
    const step = polygons.length / MAX_POLYGONS
    return Array.from({ length: MAX_POLYGONS }, (_, i) =>
      polygons[Math.floor(i * step)]!,
    )
  }, [polygons])

  const { shapes, layoutInfo, duplicateGlyphs, extraRows, rowYShift } = useMemo(() => {
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
      const squareAtGrid = rectPoints(l.gridX, l.gridY, SQUARE_SIZE, SQUARE_SIZE, POINTS_PER_SHAPE)

      // Clone targets: move down as squares, then morph to bars in the lower region
      const squareAtBarGrid = rectPoints(l.barGridX, l.barGridY, SQUARE_SIZE, SQUARE_SIZE, POINTS_PER_SHAPE)
      const thinAtBarGrid = rectPoints(l.barGridX, l.barGridY, thinW, BAR_HEIGHT, POINTS_PER_SHAPE)
      const thinAtBarTop = rectPoints(l.barGridX, l.barTierTopY, thinW, BAR_HEIGHT, POINTS_PER_SHAPE)
      const barPackedAtTop = rectPoints(l.barX, l.barTierTopY, thinW, BAR_HEIGHT, POINTS_PER_SHAPE)
      // Compressed to glyph width (X only)
      const barGlyph = rectPoints(l.glyphBarX, l.barTierTopY, glyphThinW, BAR_HEIGHT, POINTS_PER_SHAPE)
      // Final glyph-sized position: compact to glyph height & spacing (Y only)
      const barFinal = rectPoints(l.glyphBarX, l.glyphBarY, glyphThinW, glyphBarH, POINTS_PER_SHAPE)

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
      if (!tierGlyphY[tier]) tierGlyphY[tier] = layoutResult.positions[i]!.glyphBarY
    }

    const COLS = 4
    const NUM_ROWS = 2
    const availableW = overlayW - padX * 2
    const spaceBetweenX = (availableW - COLS * GLYPH_BAR_WIDTH) / Math.max(COLS - 1, 1)

    const glyphBarSpacing = (GLYPH_BAR_WIDTH * 0.2) / 5
    const glyphRowH = 4 * glyphBarH + 5 * glyphBarSpacing
    const ROW_SPACING = 16
    type BarRect = { x: number; y: number; width: number; height: number; color: string }

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
        })
      }
      row0.push(bars)
    }

    // Row 1+: full rows below
    const extraRows: BarRect[][][] = []
    for (let r = 1; r < NUM_ROWS; r++) {
      const rowGlyphs: BarRect[][] = []
      const yShift = r * (glyphRowH + ROW_SPACING)
      for (let c = 0; c < COLS; c++) {
        const offsetX = c * (GLYPH_BAR_WIDTH + spaceBetweenX)
        const bars: BarRect[] = []
        for (let t = 1; t <= 4; t++) {
          bars.push({
            x: barLeft + offsetX,
            y: (tierGlyphY[t] || 0) - glyphBarH / 2 + yShift,
            width: (tierCounts[t] || 0) * glyphThinW,
            height: glyphBarH,
            color: tierColors[t] || "#ccc",
          })
        }
        rowGlyphs.push(bars)
      }
      extraRows.push(rowGlyphs)
    }

    const rowYShift = glyphRowH + ROW_SPACING
    return { shapes: shapeData, layoutInfo: layoutResult.info, duplicateGlyphs: row0, extraRows, rowYShift }
  }, [sampled, panelWidth, panelHeight])

  useEffect(() => {
    const CROSSFADE_THRESHOLD = 0.15
    const CLONE_SPAWN = 0.44
    const N = shapes.length

    const unsub = scrollProgress.on("change", (v) => {
      // ── Labels (update regardless of SVG visibility) ──
      const mapLabel = labelRefs.current[0]
      const distLabel = labelRefs.current[1]
      const barLabel = labelRefs.current[2]
      if (mapLabel) {
        const t = Math.min(1, Math.max(0, (v - 0.10) / 0.05))
        mapLabel.style.opacity = String(t)
      }
      if (distLabel) {
        const t = Math.min(1, Math.max(0, (v - 0.36) / 0.04))
        distLabel.style.opacity = String(t)
      }
      if (barLabel) {
        const t = Math.min(1, Math.max(0, (v - 0.94) / 0.04))
        barLabel.style.opacity = String(t)
      }

      // ── SVG visibility ──
      if (svgRef.current) {
        svgRef.current.style.opacity = v >= CROSSFADE_THRESHOLD ? "1" : "0"
        if (v < CROSSFADE_THRESHOLD) return
      }

      // ── Primary paths: polygon → square → grid, then freeze ──
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

      // ── Clone paths: orthogonal sequence — each phase moves one axis only ──
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

        const { endSquare, squareAtBarGrid, thinAtBarGrid, thinAtBarTop, barPackedAtTop, barGlyph, barFinal } = shape
        const stagger = (i % 20) * 0.002

        // 1. Drop: squares travel down (Y only)
        const dropStart = 0.44 + stagger
        const dropEnd = 0.50 + stagger
        // ── HOLD: duplicated distribution view (0.50 → 0.56) ──
        // 2. Narrow: squares shrink width within rows (width only)
        const narrowStart = 0.56 + stagger
        const narrowEnd = 0.60 + stagger
        // 3. Rows combine: thin rects slide up to single row per tier (Y only)
        const combineStart = 0.60 + stagger
        const combineEnd = 0.64 + stagger
        // ── HOLD: combined rows pause (0.64 → 0.70) ──
        // 4. Compress left: slide horizontally into bar chart rows (X only)
        const compressStart = 0.70 + stagger
        const compressEnd = 0.74 + stagger
        // ── HOLD: bar rows pause (0.74 → 0.78) ──
        // 5. Shrink to glyph width (X only)
        const glyphXStart = 0.78 + stagger
        const glyphXEnd = 0.82 + stagger
        // ── HOLD: glyph-width bars pause (0.82 → 0.88) ──
        // 6. Compact to glyph height & spacing (Y only, no stagger — all rows move together)
        const glyphYStart = 0.88
        const glyphYEnd = 0.92

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
          const t = easeInOut((v - compressStart) / (compressEnd - compressStart))
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

      // ── Row 0 duplicate glyphs: fade in left to right ──
      for (let d = 0; d < dupeRefs.current.length; d++) {
        const g = dupeRefs.current[d]
        if (!g) continue
        const fadeStart = 0.92 + d * 0.01
        const fadeEnd = fadeStart + 0.01
        const t = Math.min(1, Math.max(0, (v - fadeStart) / (fadeEnd - fadeStart)))
        g.style.opacity = String(t)
      }

      // ── HOLD 0.95 → 0.98: pause before duplication ──
      // ── Extra rows: appear on top of row 0, then slide straight down ──
      for (let r = 0; r < extraRowRefs.current.length; r++) {
        const g = extraRowRefs.current[r]
        if (!g) continue
        const moveStart = 0.98
        const moveEnd = 0.995
        const visible = v >= moveStart
        g.style.opacity = visible ? "1" : "0"
        const t = Math.min(1, Math.max(0, (v - moveStart) / (moveEnd - moveStart)))
        const yOffset = -rowYShift * (1 - t)
        g.style.transform = `translateY(${yOffset}px)`
      }
    })
    return unsub
  }, [shapes, scrollProgress])

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
        ref={(el) => { labelRefs.current[0] = el }}
        style={{ ...labelStyle, top: panelHeight * 0.08 }}
      >
        Map view
      </div>
      <div
        ref={(el) => { labelRefs.current[1] = el }}
        style={{ ...labelStyle, top: layoutInfo.gridLabelY }}
      >
        Distribution view
      </div>
      <div
        ref={(el) => { labelRefs.current[2] = el }}
        style={{ ...labelStyle, top: layoutInfo.barLabelY }}
      >
        Bar chart
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
        {/* Primary paths: polygon → grid squares (freeze) */}
        {shapes.map((s, i) => (
          <path
            key={`p-${i}`}
            ref={(el) => { primaryRefs.current[i] = el }}
            fill={s.color}
            fillOpacity={fillOpacity}
            stroke={s.color}
            strokeWidth={strokeWidth}
            d={s.rawD}
          />
        ))}
        {/* Clone paths: grid squares → bars */}
        {shapes.map((s, i) => (
          <path
            key={`c-${i}`}
            ref={(el) => { cloneRefs.current[i] = el }}
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
          <g key={`dup-${d}`} ref={(el) => { dupeRefs.current[d] = el }} style={{ opacity: 0 }}>
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
        {extraRows.map((rowGlyphs, r) => (
          <g key={`row-${r}`} ref={(el) => { extraRowRefs.current[r] = el }} style={{ opacity: 0 }}>
            {rowGlyphs.map((bars, c) => (
              <g key={`col-${c}`}>
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
          </g>
        ))}
      </svg>
    </>
  )
}
