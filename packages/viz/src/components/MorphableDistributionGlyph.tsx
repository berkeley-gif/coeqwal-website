"use client"

import React, { useRef, useLayoutEffect, useMemo, useCallback } from "react"
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
  onLocationClick?: (info: {
    sourceId: string
    tier: number
  }) => void
  onLocationEnter?: (info: {
    sourceId: string
    tier: number
  }) => void
  onLocationLeave?: () => void
  interactive?: boolean
}

/**
 * Distribute TOTAL_SQUARES among tiers proportionally via largest-remainder.
 */
function distributeSquares(values: number[]): number[] {
  const total = values.reduce((sum, v) => sum + v, 0)
  if (total === 0) return values.map(() => 0)
  const raw = values.map((v) => (v / total) * TOTAL_SQUARES)
  const floored = raw.map(Math.floor)
  let remainder = TOTAL_SQUARES - floored.reduce((a, b) => a + b, 0)
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

interface ShapeLayout {
  squareTarget: [number, number][]
  barTarget: [number, number][]
  color: string
  tier: number
  sourceId: string
  isRepresentative: boolean
}

/**
 * MorphableDistributionGlyph — uses the same <path>-based vertex-interpolation
 * morph as the get-started overlay (OutcomeMorphOverlay).
 *
 * Distribution mode: each location is a small colored square in a 10-column
 * per-tier-row grid.
 * Bar mode: one proportional horizontal bar per tier (representative paths);
 * non-representative paths fade to transparent.
 *
 * The morph uses requestAnimationFrame with easeInOut vertex lerp — identical
 * to the encoding-mode switch in OutcomeMorphOverlay.
 */
const MorphableDistributionGlyph: React.FC<MorphableDistributionGlyphProps> =
  React.memo(({ values, tierColors, mode, interactive, onLocationClick, onLocationEnter, onLocationLeave }) => {
    const pathRefs = useRef<(SVGPathElement | null)[]>([])
    const chromeRef = useRef<SVGGElement | null>(null)
    const rafRef = useRef<number | null>(null)
    const prevModeRef = useRef(mode)

    const layout = useMemo(() => {
      const counts = distributeSquares(values as number[])
      const gridWidth = COLS * CELL

      const numTiers = 4
      const barHeight = (GLYPH_SIZE * 0.8) / numTiers
      const barSpacing = (GLYPH_SIZE * 0.2) / (numTiers + 1)
      const maxBarWidth = GLYPH_SIZE * 0.7
      const barCornerRadius = barHeight / 4
      const barLeftX = (gridWidth - GLYPH_SIZE) / 2 + GLYPH_SIZE * 0.15

      const shapes: ShapeLayout[] = []
      let currentRow = 0

      for (let t = 0; t < 4; t++) {
        const count = counts[t]!
        if (count === 0) continue
        const color = tierColors[t]!
        const totalSquares = counts.reduce((a, b) => a + b, 0)
        const normVal = totalSquares > 0 ? count / totalSquares : 0
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
      const barVisualH =
        numTiers * barHeight + (numTiers + 1) * barSpacing

      return {
        shapes,
        gridWidth,
        distHeight,
        barHeight: barVisualH,
        glyphMeta: {
          numTiers,
          barHeight,
          barSpacing,
          maxBarWidth,
          barCornerRadius,
          barLeftX,
          glyphLeft: (gridWidth - GLYPH_SIZE) / 2,
        },
      }
    }, [values, tierColors])

    const getTarget = useCallback(
      (shape: ShapeLayout, m: "bars" | "distribution") =>
        m === "bars" ? shape.barTarget : shape.squareTarget,
      [],
    )

    // RAF morph when mode changes
    useLayoutEffect(() => {
      if (prevModeRef.current === mode) return
      const fromMode = prevModeRef.current
      prevModeRef.current = mode

      const toBar = mode === "bars"
      const fromBar = fromMode === "bars"

      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
      }

      const startTime = performance.now()
      const tick = (now: number) => {
        const elapsed = now - startTime
        const t = Math.min(1, elapsed / MORPH_DURATION)
        const eased = easeInOut(t)

        const chromeEl = chromeRef.current
        if (chromeEl) {
          if (toBar && !fromBar) chromeEl.style.opacity = String(eased)
          else if (!toBar && fromBar) chromeEl.style.opacity = String(1 - eased)
        }

        for (let i = 0; i < layout.shapes.length; i++) {
          const el = pathRefs.current[i]
          if (!el) continue
          const shape = layout.shapes[i]!
          const from = getTarget(shape, fromMode)
          const to = getTarget(shape, mode)
          const pts = from.map((a, pi) => lerp(a, to[pi]!, eased))
          el.setAttribute("d", pointsToD(pts))

          if (!shape.isRepresentative) {
            if (toBar && !fromBar) el.style.opacity = String(1 - eased)
            else if (!toBar && fromBar) el.style.opacity = String(eased)
          } else if (toBar) {
            el.setAttribute("fill-opacity", String(0.9 + (0.8 - 0.9) * eased))
          } else if (fromBar) {
            el.setAttribute("fill-opacity", String(0.8 + (0.9 - 0.8) * eased))
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
          // Finalize
          const chromeEl = chromeRef.current
          if (chromeEl) chromeEl.style.opacity = toBar ? "1" : "0"

          for (let i = 0; i < layout.shapes.length; i++) {
            const el = pathRefs.current[i]
            if (!el) continue
            const shape = layout.shapes[i]!
            if (!shape.isRepresentative && toBar) {
              el.style.opacity = "0"
            } else {
              el.style.opacity = "1"
            }
            if (toBar && shape.isRepresentative) {
              el.setAttribute("fill-opacity", "0.8")
            } else if (!toBar) {
              el.removeAttribute("fill-opacity")
            }
            el.setAttribute("stroke-opacity", toBar ? "0" : "0.4")
          }
          rafRef.current = null
        }
      }

      rafRef.current = requestAnimationFrame(tick)
      return () => {
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
      }
    }, [mode, layout, getTarget])

    // Set initial positions (no animation on first render)
    useLayoutEffect(() => {
      const isBar = mode === "bars"
      const chromeEl = chromeRef.current
      if (chromeEl) chromeEl.style.opacity = isBar ? "1" : "0"

      for (let i = 0; i < layout.shapes.length; i++) {
        const el = pathRefs.current[i]
        if (!el) continue
        const shape = layout.shapes[i]!
        const target = getTarget(shape, mode)
        el.setAttribute("d", pointsToD(target))

        if (isBar && !shape.isRepresentative) {
          el.style.opacity = "0"
        } else {
          el.style.opacity = "1"
        }

        if (isBar && shape.isRepresentative) {
          el.setAttribute("fill-opacity", "0.8")
        }
        el.setAttribute("stroke-opacity", isBar ? "0" : "0.4")
      }
      // Only on mount
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const isBar = mode === "bars"
    const currentHeight = isBar ? layout.barHeight : layout.distHeight
    const gm = layout.glyphMeta

    return (
      <div
        style={{
          width: layout.gridWidth,
          height: currentHeight,
          transition: `height ${MORPH_DURATION}ms cubic-bezier(0.25, 0.1, 0.25, 1)`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <svg
          width={layout.gridWidth}
          height={Math.max(layout.barHeight, layout.distHeight)}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {/* Bar chrome: gray tracks and grid lines */}
          <g ref={chromeRef} style={{ opacity: 0 }}>
            {Array.from({ length: gm.numTiers }, (_, ti) => {
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
                  (gm.numTiers - 1) * (gm.barHeight + gm.barSpacing) +
                  gm.barHeight
                }
                stroke="#ccc"
                strokeWidth={0.5}
                strokeDasharray="1,2"
              />
            ))}
          </g>

          {/* Location paths */}
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
              style={{
                cursor: interactive ? "pointer" : undefined,
                transition:
                  "fill-opacity 0.2s, stroke 0.15s, stroke-width 0.15s",
              }}
              pointerEvents={interactive ? "all" : "none"}
              onMouseEnter={
                interactive && onLocationEnter
                  ? () =>
                      onLocationEnter({
                        sourceId: shape.sourceId,
                        tier: shape.tier,
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
                        sourceId: shape.sourceId,
                        tier: shape.tier,
                      })
                    }
                  : undefined
              }
            />
          ))}
        </svg>
      </div>
    )
  })

MorphableDistributionGlyph.displayName = "MorphableDistributionGlyph"

export default MorphableDistributionGlyph
export type { MorphableDistributionGlyphProps }
