"use client"

import React, { useMemo, useRef, useEffect } from "react"
import { SQUARE_SIZE, SQUARE_GAP } from "../utils/shape-morph"

const COLS = 10
const TOTAL_SQUARES = 100
const CELL = SQUARE_SIZE + SQUARE_GAP
const GLYPH_SIZE = 60
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
  /**
   * Compact view. When true, bars render inside a `size x size` box using
   * `size`-derived geometry, instead of the default 60px bars laid out
   * inside the 120px (10 x 12) distribution-aligned container.
   *
   * The default non-compact layout exists so the bars mode can morph
   * smoothly into the 100-square distribution mode in places like the
   * scenario list (where both modes are used). In compact layouts, like
   * the Learn section's KeyOutcomesPanel, the 120px container overruns
   * the available space and the distribution mode is never shown, so we
   * collapse to a size-driven box.
   */
  compact?: boolean
  /** Target box edge, in px, when `compact` is true. Defaults to 60. */
  size?: number
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

// ── Bar geometry constants ──────────────────────────────────────────────────

const NUM_TIERS = 4
const GRID_WIDTH = COLS * CELL

// ── Lightweight bar-only renderer (4 <rect> pairs) ──────────────────────────

interface BarOnlyProps {
  values: [number, number, number, number]
  tierColors: [string, string, string, string]
  /**
   * Compact view. See {@link MorphableDistributionGlyphProps.compact}.
   * When true, bars are laid out in a `size x size` box instead of the
   * distribution-aligned 120px-wide container.
   */
  compact?: boolean
  size?: number
}

const BarOnly: React.FC<BarOnlyProps> = React.memo(
  ({ values, tierColors, compact = false, size }) => {
    const valTotal = (values as number[]).reduce((a, b) => a + b, 0)

    // Geometry: in compact view, derive bar dimensions from `size` and drop
    // the 120px distribution-grid alignment so the glyph fits in tight
    // layouts (e.g. Learn section panels). Otherwise use the shared
    // GLYPH_SIZE/GRID_WIDTH constants so this renderer stays pixel-aligned
    // with the distribution mode it can morph to.
    const glyphSize = compact ? (size ?? GLYPH_SIZE) : GLYPH_SIZE
    const barHeight = (glyphSize * 0.8) / NUM_TIERS
    const barSpacing = (glyphSize * 0.2) / (NUM_TIERS + 1)
    const maxBarWidth = glyphSize * 0.7
    const barCornerRadius = barHeight / 4
    const containerWidth = compact ? glyphSize : GRID_WIDTH
    const barLeftX = compact
      ? glyphSize * 0.15
      : (GRID_WIDTH - GLYPH_SIZE) / 2 + GLYPH_SIZE * 0.15
    const barVisualHeight = NUM_TIERS * barHeight + (NUM_TIERS + 1) * barSpacing

    return (
      <div
        style={{
          width: containerWidth,
          height: barVisualHeight,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <svg
          width={containerWidth}
          height={barVisualHeight}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {Array.from({ length: NUM_TIERS }, (_, ti) => {
            const y = barSpacing + ti * (barHeight + barSpacing)
            const normVal = valTotal > 0 ? values[ti]! / valTotal : 0
            const fraction =
              normVal > 0 ? Math.max(2 / maxBarWidth, normVal) : 0
            return (
              <g key={ti}>
                <rect
                  x={barLeftX}
                  y={y}
                  width={maxBarWidth}
                  height={barHeight}
                  fill="#d8d8d8"
                  rx={barCornerRadius}
                />
                <rect
                  x={barLeftX}
                  y={y}
                  width={maxBarWidth}
                  height={barHeight}
                  fill={tierColors[ti]}
                  opacity={0.8}
                  rx={barCornerRadius}
                  style={{
                    transform: `scaleX(${fraction})`,
                    transformOrigin: `${barLeftX}px 0`,
                    transition: "transform 800ms cubic-bezier(0.25,0.1,0.25,1)",
                  }}
                />
              </g>
            )
          })}
          {[0.25, 0.5, 0.75].map((frac, li) => (
            <line
              key={li}
              x1={barLeftX + maxBarWidth * frac}
              y1={barSpacing}
              x2={barLeftX + maxBarWidth * frac}
              y2={
                barSpacing +
                (NUM_TIERS - 1) * (barHeight + barSpacing) +
                barHeight
              }
              stroke="#ccc"
              strokeWidth={0.5}
              strokeDasharray="1,2"
            />
          ))}
        </svg>
      </div>
    )
  },
)
BarOnly.displayName = "BarOnly"

// ── Lightweight distribution-only renderer (N <rect>) ───────────────────────

// Timing for hydroclimate transition (color first, pause, then slide)
const COLOR_FADE_MS = 600
const PAUSE_MS = 300
const SLIDE_MS = 600
const SLIDE_DELAY_MS = COLOR_FADE_MS + PAUSE_MS

interface DistSquare {
  x: number
  y: number
  color: string
  tier: number
  sourceId: string
}

interface DistOnlyProps {
  values: [number, number, number, number]
  tierColors: [string, string, string, string]
  locationCounts?: [number, number, number, number]
  interactive?: boolean
  onLocationClick?: (info: { sourceId: string; tier: number }) => void
  onLocationEnter?: (info: { sourceId: string; tier: number }) => void
  onLocationLeave?: () => void
}

const DIST_TRANSITION = [
  `background-color ${COLOR_FADE_MS}ms ease`,
  `box-shadow ${COLOR_FADE_MS}ms ease`,
  `transform ${SLIDE_MS}ms cubic-bezier(0.25,0.1,0.25,1) ${SLIDE_DELAY_MS}ms`,
].join(", ")

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
    const hasMountedRef = useRef(false)
    useEffect(() => {
      hasMountedRef.current = true
    }, [])
    const animate = hasMountedRef.current

    const layout = useMemo(() => {
      const counts = locationCounts
        ? (locationCounts as number[])
        : distributeSquares(values as number[], TOTAL_SQUARES)
      // If tier 1 is empty, offset down by one row so tier 2 aligns across outcomes
      const topOffset = counts[0] === 0 ? CELL : 0
      const rects: DistSquare[] = []
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
            y: row * CELL + topOffset,
            color,
            tier: t + 1,
            sourceId: `tier${t + 1}_loc${i}`,
          })
        }
        currentRow += Math.ceil(count / COLS)
      }
      const gridHeight = currentRow * CELL - SQUARE_GAP + topOffset
      return { rects, gridHeight }
    }, [values, tierColors, locationCounts])

    return (
      <div
        style={{
          width: GRID_WIDTH,
          height: layout.gridHeight,
          position: "relative",
          transition: animate
            ? `height ${SLIDE_MS}ms cubic-bezier(0.25,0.1,0.25,1) ${SLIDE_DELAY_MS}ms`
            : "none",
        }}
      >
        {layout.rects.map((r, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: SQUARE_SIZE,
              height: SQUARE_SIZE,
              borderRadius: CORNER_RADIUS,
              backgroundColor: r.color,
              boxShadow: `inset 0 0 0 0.5px ${r.color}`,
              opacity: 0.9,
              transform: `translate(${r.x}px, ${r.y}px)`,
              transition: animate ? DIST_TRANSITION : "none",
              cursor: interactive ? "pointer" : undefined,
              pointerEvents: interactive ? "all" : "none",
            }}
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
      </div>
    )
  },
)
DistOnly.displayName = "DistOnly"

// ── Main component ──────────────────────────────────────────────────────────

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
      compact = false,
      size,
    }) => {
      if (mode === "bars") {
        // Note: `compact` / `size` only apply to bars mode. Distribution
        // mode is inherently a 100-square (10 x 10) grid and always renders
        // in its native footprint; callers that use compact bars today
        // never switch this glyph into distribution mode.
        return (
          <BarOnly
            values={values}
            tierColors={tierColors}
            compact={compact}
            size={size}
          />
        )
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
