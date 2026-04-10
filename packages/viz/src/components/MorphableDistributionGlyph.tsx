"use client"

import React, { useRef, useLayoutEffect, useMemo, useState } from "react"
import {
  SQUARE_SIZE,
  SQUARE_GAP,
  POINTS_PER_SHAPE,
  rectPoints,
  pointsToD,
  lerp,
  easeInOut,
} from "../utils/shape-morph"

const COLS = 10
const TOTAL_SQUARES = 100
const CELL = SQUARE_SIZE + SQUARE_GAP
const GLYPH_SIZE = 60
const MORPH_DURATION = 500
const CORNER_RADIUS = 2

export interface LocationData {
  sourceId: string
  tier: number
  color: string
}

export interface MorphableDistributionGlyphProps {
  values: [number, number, number, number]
  tierColors: [string, string, string, string]
  mode: "bars" | "distribution"
  locationCounts?: [number, number, number, number]
  onLocationClick?: (info: { sourceId: string; tier: number }) => void
  onLocationEnter?: (info: { sourceId: string; tier: number }) => void
  onLocationLeave?: () => void
  interactive?: boolean
}

function distributeSquares(values: number[], targetTotal: number): number[] {
  const total = values.reduce((sum, v) => sum + v, 0)
  if (total === 0) return values.map(() => 0)
  const raw = values.map((v) => (v / total) * targetTotal)
  const floored = raw.map(Math.floor)
  let remainder = targetTotal - floored.reduce((a, b) => a + b, 0)
  const fractions = raw
    .map((r, i) => ({ i, frac: r - floored[i]! }))
    .sort((a, b) => b.frac - a.frac)
  for (const { i } of fractions) {
    if (remainder <= 0) break
    floored[i]!++
    remainder--
  }
  return floored
}

// ── Lightweight bar-only renderer (4 <rect> pairs) ──────────────────────────

const NUM_TIERS = 4
const BAR_HEIGHT = (GLYPH_SIZE * 0.8) / NUM_TIERS
const BAR_SPACING = (GLYPH_SIZE * 0.2) / (NUM_TIERS + 1)
const MAX_BAR_WIDTH = GLYPH_SIZE * 0.7
const BAR_CORNER_RADIUS = BAR_HEIGHT / 4
const GRID_WIDTH = COLS * CELL
const BAR_LEFT_X = (GRID_WIDTH - GLYPH_SIZE) / 2 + GLYPH_SIZE * 0.15
const BAR_VISUAL_HEIGHT =
  NUM_TIERS * BAR_HEIGHT + (NUM_TIERS + 1) * BAR_SPACING

interface BarOnlyProps {
  values: [number, number, number, number]
  tierColors: [string, string, string, string]
}

const BarOnly: React.FC<BarOnlyProps> = React.memo(({ values, tierColors }) => {
  const valTotal = (values as number[]).reduce((a, b) => a + b, 0)

  return (
    <div
      style={{
        width: GRID_WIDTH,
        height: BAR_VISUAL_HEIGHT,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <svg
        width={GRID_WIDTH}
        height={BAR_VISUAL_HEIGHT}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {Array.from({ length: NUM_TIERS }, (_, ti) => {
          const y = BAR_SPACING + ti * (BAR_HEIGHT + BAR_SPACING)
          const normVal = valTotal > 0 ? values[ti]! / valTotal : 0
          const fraction = Math.max(2 / MAX_BAR_WIDTH, normVal)
          return (
            <g key={ti}>
              <rect
                x={BAR_LEFT_X}
                y={y}
                width={MAX_BAR_WIDTH}
                height={BAR_HEIGHT}
                fill="#d8d8d8"
                rx={BAR_CORNER_RADIUS}
              />
              <rect
                x={BAR_LEFT_X}
                y={y}
                width={MAX_BAR_WIDTH}
                height={BAR_HEIGHT}
                fill={tierColors[ti]}
                opacity={0.8}
                rx={BAR_CORNER_RADIUS}
                style={{
                  transform: `scaleX(${fraction})`,
                  transformOrigin: `${BAR_LEFT_X}px 0`,
                  transition: "transform 800ms cubic-bezier(0.25,0.1,0.25,1)",
                }}
              />
            </g>
          )
        })}
        {[0.25, 0.5, 0.75].map((frac, li) => (
          <line
            key={li}
            x1={BAR_LEFT_X + MAX_BAR_WIDTH * frac}
            y1={BAR_SPACING}
            x2={BAR_LEFT_X + MAX_BAR_WIDTH * frac}
            y2={
              BAR_SPACING +
              (NUM_TIERS - 1) * (BAR_HEIGHT + BAR_SPACING) +
              BAR_HEIGHT
            }
            stroke="#ccc"
            strokeWidth={0.5}
            strokeDasharray="1,2"
          />
        ))}
      </svg>
    </div>
  )
})
BarOnly.displayName = "BarOnly"

// ── Lightweight distribution-only renderer (N <rect>) ───────────────────────

interface DistOnlyProps {
  values: [number, number, number, number]
  tierColors: [string, string, string, string]
  locationCounts?: [number, number, number, number]
  interactive?: boolean
  onLocationClick?: (info: { sourceId: string; tier: number }) => void
  onLocationEnter?: (info: { sourceId: string; tier: number }) => void
  onLocationLeave?: () => void
}

const DistOnly: React.FC<DistOnlyProps> = React.memo(
  ({
    values,
    tierColors,
    locationCounts,
    interactive,
    onLocationClick,
    onLocationEnter,
    onLocationLeave,
  }) => {
    const layout = useMemo(() => {
      const counts = locationCounts
        ? (locationCounts as number[])
        : distributeSquares(values as number[], TOTAL_SQUARES)
      const rects: {
        x: number
        y: number
        color: string
        tier: number
        sourceId: string
      }[] = []
      let currentRow = 0
      for (let t = 0; t < 4; t++) {
        const count = counts[t]!
        if (count === 0) continue
        const color = tierColors[t]!
        for (let i = 0; i < count; i++) {
          const col = i % COLS
          const row = currentRow + Math.floor(i / COLS)
          rects.push({
            x: col * CELL,
            y: row * CELL,
            color,
            tier: t + 1,
            sourceId: `tier${t + 1}_loc${i}`,
          })
        }
        currentRow += Math.ceil(count / COLS)
      }
      return { rects, totalRows: currentRow }
    }, [values, tierColors, locationCounts])

    const gridHeight = layout.totalRows * CELL - SQUARE_GAP

    return (
      <div
        style={{
          width: GRID_WIDTH,
          height: gridHeight,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <svg
          width={GRID_WIDTH}
          height={gridHeight}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {layout.rects.map((r, i) => (
            <rect
              key={i}
              x={r.x}
              y={r.y}
              width={SQUARE_SIZE}
              height={SQUARE_SIZE}
              rx={CORNER_RADIUS}
              fill={r.color}
              stroke={r.color}
              strokeWidth={0.5}
              strokeOpacity={0.4}
              style={{
                cursor: interactive ? "pointer" : undefined,
              }}
              pointerEvents={interactive ? "all" : "none"}
              onMouseEnter={
                interactive && onLocationEnter
                  ? () =>
                      onLocationEnter({
                        sourceId: r.sourceId,
                        tier: r.tier,
                      })
                  : undefined
              }
              onMouseLeave={
                interactive && onLocationLeave ? onLocationLeave : undefined
              }
              onClick={
                interactive && onLocationClick
                  ? (e) => {
                      e.stopPropagation()
                      onLocationClick({
                        sourceId: r.sourceId,
                        tier: r.tier,
                      })
                    }
                  : undefined
              }
            />
          ))}
        </svg>
      </div>
    )
  },
)
DistOnly.displayName = "DistOnly"

// ── Morph overlay (temporary, only during transitions) ──────────────────────

interface ShapeLayout {
  squareTarget: [number, number][]
  barTarget: [number, number][]
  color: string
  tier: number
  sourceId: string
  isRepresentative: boolean
}

interface MorphOverlayProps {
  values: [number, number, number, number]
  tierColors: [string, string, string, string]
  locationCounts?: [number, number, number, number]
  fromMode: "bars" | "distribution"
  toMode: "bars" | "distribution"
  onComplete: () => void
}

const MorphOverlay: React.FC<MorphOverlayProps> = React.memo(
  ({ values, tierColors, locationCounts, fromMode, toMode, onComplete }) => {
    const pathRefs = useRef<(SVGPathElement | null)[]>([])
    const chromeRef = useRef<SVGGElement | null>(null)
    const rafRef = useRef<number | null>(null)

    const layout = useMemo(() => {
      const counts = locationCounts
        ? (locationCounts as number[])
        : distributeSquares(values as number[], TOTAL_SQUARES)

      const barHeight = (GLYPH_SIZE * 0.8) / NUM_TIERS
      const barSpacing = (GLYPH_SIZE * 0.2) / (NUM_TIERS + 1)
      const maxBarWidth = GLYPH_SIZE * 0.7
      const barCornerRadius = barHeight / 4
      const barLeftX = (GRID_WIDTH - GLYPH_SIZE) / 2 + GLYPH_SIZE * 0.15

      const shapes: ShapeLayout[] = []
      let currentRow = 0
      const valTotal = (values as number[]).reduce((a, b) => a + b, 0)

      for (let t = 0; t < 4; t++) {
        const count = counts[t]!
        if (count === 0) continue
        const color = tierColors[t]!
        const normVal = valTotal > 0 ? (values as number[])[t]! / valTotal : 0
        const barW = Math.max(2, normVal * maxBarWidth)
        const barCx = barLeftX + barW / 2
        const barCy = barSpacing + t * (barHeight + barSpacing) + barHeight / 2
        const barPts = rectPoints(
          barCx,
          barCy,
          barW,
          barHeight,
          POINTS_PER_SHAPE,
          barCornerRadius,
        )

        for (let i = 0; i < count; i++) {
          const col = i % COLS
          const row = currentRow + Math.floor(i / COLS)
          const gridX = col * CELL + SQUARE_SIZE / 2
          const gridY = row * CELL + SQUARE_SIZE / 2
          const squarePts = rectPoints(
            gridX,
            gridY,
            SQUARE_SIZE,
            SQUARE_SIZE,
            POINTS_PER_SHAPE,
            CORNER_RADIUS,
          )
          shapes.push({
            squareTarget: squarePts,
            barTarget: barPts,
            color,
            tier: t + 1,
            sourceId: `tier${t + 1}_loc${i}`,
            isRepresentative: i === 0,
          })
        }
        currentRow += Math.ceil(count / COLS)
      }

      const distHeight = currentRow * CELL - SQUARE_GAP
      return {
        shapes,
        distHeight,
        barHeight:
          NUM_TIERS * barHeight + (NUM_TIERS + 1) * barSpacing,
        glyphMeta: {
          barHeight,
          barSpacing,
          maxBarWidth,
          barCornerRadius,
          barLeftX,
        },
      }
    }, [values, tierColors, locationCounts])

    const getTarget = (shape: ShapeLayout, m: "bars" | "distribution") =>
      m === "bars" ? shape.barTarget : shape.squareTarget

    useLayoutEffect(() => {
      const toBar = toMode === "bars"
      const fromBar = fromMode === "bars"

      // Set initial positions
      for (let i = 0; i < layout.shapes.length; i++) {
        const el = pathRefs.current[i]
        if (!el) continue
        const shape = layout.shapes[i]!
        const target = getTarget(shape, fromMode)
        el.setAttribute("d", pointsToD(target))

        if (fromBar && !shape.isRepresentative) {
          el.style.opacity = "0"
        } else {
          el.style.opacity = "1"
        }
        if (fromBar && shape.isRepresentative) {
          el.setAttribute("fill-opacity", "0.8")
        }
        el.setAttribute("stroke-opacity", fromBar ? "0" : "0.4")
      }

      const chromeEl = chromeRef.current
      if (chromeEl) chromeEl.style.opacity = fromBar ? "1" : "0"

      const startTime = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - startTime) / MORPH_DURATION)
        const eased = easeInOut(t)

        if (chromeEl) {
          if (toBar && !fromBar) chromeEl.style.opacity = String(eased)
          else if (!toBar && fromBar)
            chromeEl.style.opacity = String(1 - eased)
        }

        for (let i = 0; i < layout.shapes.length; i++) {
          const el = pathRefs.current[i]
          if (!el) continue
          const shape = layout.shapes[i]!
          const from = getTarget(shape, fromMode)
          const to = getTarget(shape, toMode)
          const pts = from.map((a, pi) => lerp(a, to[pi]!, eased))
          el.setAttribute("d", pointsToD(pts))

          if (!shape.isRepresentative) {
            if (toBar && !fromBar) el.style.opacity = String(1 - eased)
            else if (!toBar && fromBar) el.style.opacity = String(eased)
          } else if (toBar) {
            el.setAttribute(
              "fill-opacity",
              String(0.9 + (0.8 - 0.9) * eased),
            )
          } else if (fromBar) {
            el.setAttribute(
              "fill-opacity",
              String(0.8 + (0.9 - 0.8) * eased),
            )
          }

          if (toBar && !fromBar) {
            el.setAttribute("stroke-opacity", String(0.4 * (1 - eased)))
          } else if (!toBar && fromBar) {
            el.setAttribute("stroke-opacity", String(0.4 * eased))
          }
        }

        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          rafRef.current = null
          onComplete()
        }
      }
      rafRef.current = requestAnimationFrame(tick)
      return () => {
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
      }
    }, [layout, fromMode, toMode, onComplete])

    const maxH = Math.max(layout.barHeight, layout.distHeight)
    const fromH =
      fromMode === "bars" ? layout.barHeight : layout.distHeight
    const toH = toMode === "bars" ? layout.barHeight : layout.distHeight
    const gm = layout.glyphMeta

    return (
      <div
        style={{
          width: GRID_WIDTH,
          height: fromH,
          transition: `height ${MORPH_DURATION}ms cubic-bezier(0.25,0.1,0.25,1)`,
          overflow: "hidden",
          position: "relative",
        }}
        ref={(el) => {
          if (el) {
            // Trigger transition by setting target height after mount
            requestAnimationFrame(() => {
              el.style.height = `${toH}px`
            })
          }
        }}
      >
        <svg
          width={GRID_WIDTH}
          height={maxH}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <g ref={chromeRef} style={{ opacity: 0 }}>
            {Array.from({ length: NUM_TIERS }, (_, ti) => {
              const y = gm.barSpacing + ti * (gm.barHeight + gm.barSpacing)
              return (
                <rect
                  key={`track-${ti}`}
                  x={gm.barLeftX}
                  y={y}
                  width={gm.maxBarWidth}
                  height={gm.barHeight}
                  fill="#d8d8d8"
                  rx={gm.barCornerRadius}
                />
              )
            })}
            {[0.25, 0.5, 0.75].map((frac, li) => (
              <line
                key={`grid-${li}`}
                x1={gm.barLeftX + gm.maxBarWidth * frac}
                y1={gm.barSpacing}
                x2={gm.barLeftX + gm.maxBarWidth * frac}
                y2={
                  gm.barSpacing +
                  (NUM_TIERS - 1) * (gm.barHeight + gm.barSpacing) +
                  gm.barHeight
                }
                stroke="#ccc"
                strokeWidth={0.5}
                strokeDasharray="1,2"
              />
            ))}
          </g>

          {layout.shapes.map((shape, i) => (
            <path
              key={i}
              ref={(el) => {
                pathRefs.current[i] = el
              }}
              fill={shape.color}
              fillOpacity={0.9}
              stroke={shape.color}
              strokeWidth={0.5}
              strokeOpacity={0.4}
            />
          ))}
        </svg>
      </div>
    )
  },
)
MorphOverlay.displayName = "MorphOverlay"

// ── Main orchestrator ───────────────────────────────────────────────────────

const MorphableDistributionGlyph: React.FC<MorphableDistributionGlyphProps> =
  React.memo(
    ({
      values,
      tierColors,
      mode,
      locationCounts,
      interactive,
      onLocationClick,
      onLocationEnter,
      onLocationLeave,
    }) => {
      const [morphState, setMorphState] = useState<{
        fromMode: "bars" | "distribution"
        toMode: "bars" | "distribution"
      } | null>(null)
      const prevModeRef = useRef(mode)

      // Detect mode changes and trigger morph
      if (prevModeRef.current !== mode && !morphState) {
        setMorphState({ fromMode: prevModeRef.current, toMode: mode })
        prevModeRef.current = mode
      } else if (prevModeRef.current !== mode && morphState) {
        prevModeRef.current = mode
      }

      const handleMorphComplete = React.useCallback(() => {
        setMorphState(null)
      }, [])

      if (morphState) {
        return (
          <MorphOverlay
            values={values}
            tierColors={tierColors}
            locationCounts={locationCounts}
            fromMode={morphState.fromMode}
            toMode={morphState.toMode}
            onComplete={handleMorphComplete}
          />
        )
      }

      if (mode === "bars") {
        return <BarOnly values={values} tierColors={tierColors} />
      }

      return (
        <DistOnly
          values={values}
          tierColors={tierColors}
          locationCounts={locationCounts}
          interactive={interactive}
          onLocationClick={onLocationClick}
          onLocationEnter={onLocationEnter}
          onLocationLeave={onLocationLeave}
        />
      )
    },
  )

MorphableDistributionGlyph.displayName = "MorphableDistributionGlyph"

export default MorphableDistributionGlyph
