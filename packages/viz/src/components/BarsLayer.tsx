"use client"

import React from "react"
import { SQUARE_SIZE, SQUARE_GAP } from "../utils/shape-morph"

/**
 * BarsLayer: shared 4-tier horizontal bar renderer used by both the static
 * `OutcomeGlyph` path and the animated bars-mode of `MorphableDistributionGlyph`.
 *
 * Width semantic: bar widths are sum-normalized. Each bar's fraction is
 * `value / sum(values)`. This matches `DistOnly`'s `distributeSquares`
 * (the 100-square distribution mode) and the storyboard's inline bar
 * math in `OutcomeMorphOverlay`. For production data, where the API
 * returns values in 0..1 that already sum to ~1 (see
 * `convertMultiValueToChartData`), this produces pixel-identical output
 * to the previous max-normalize `BarChart`.
 *
 * This component is pure SVG. No refs, no D3, no
 * theme dependency. Callers may override `trackColor` / `gridlineColor`
 * to thread theme tokens through. Defaults match the previous hardcoded
 * values so adopting BarsLayer is a no-op visually.
 */

const NUM_TIERS = 4
const COLS = 10
const CELL = SQUARE_SIZE + SQUARE_GAP
const GRID_WIDTH = COLS * CELL
const GLYPH_SIZE = 60

const DEFAULT_TRACK_COLOR = "#d8d8d8"
const DEFAULT_GRIDLINE_COLOR = "#ccc"
const FILL_OPACITY = 0.8
const ANIMATE_DURATION_MS = 800
const GRIDLINE_FRACTIONS = [0.25, 0.5, 0.75] as const

export interface BarsLayerProps {
  /** Four tier values in display order (tier1..tier4). */
  values: [number, number, number, number]
  /** Tier colors in display order (tier1..tier4). */
  tierColors: [string, string, string, string]
  /**
   * Box edge in px when `layout === "compact"`. Drives all geometry. Default 60.
   * Ignored in `gridAligned` layout (see below).
   */
  size?: number
  /**
   * "compact": glyph fits inside `size x size` (used by `OutcomeGlyph`
   * and `MorphableDistributionGlyph`'s compact bars path).
   * "gridAligned": outer SVG is `GRID_WIDTH x size` (= 120 x 60 by default)
   * so bars stay pixel-aligned with the 100-square distribution mode they
   * morph to (used by `MorphableDistributionGlyph`'s default bars path).
   */
  layout?: "compact" | "gridAligned"
  /**
   * When true, fill rects use `transform: scaleX(...)` with an 800 ms ease
   * transition so width changes animate smoothly across renders. When false,
   * fills use a direct `width` attribute (no transition). Default false.
   */
  animate?: boolean
  /** Bar track (background) fill color. Default '#d8d8d8'. */
  trackColor?: string
  /** Reference gridline stroke color. Default '#ccc'. */
  gridlineColor?: string
}

const BarsLayer: React.FC<BarsLayerProps> = React.memo(
  ({
    values,
    tierColors,
    size = GLYPH_SIZE,
    layout = "compact",
    animate = false,
    trackColor = DEFAULT_TRACK_COLOR,
    gridlineColor = DEFAULT_GRIDLINE_COLOR,
  }) => {
    const glyphSize = size
    const barHeight = (glyphSize * 0.8) / NUM_TIERS
    const barSpacing = (glyphSize * 0.2) / (NUM_TIERS + 1)
    const maxBarWidth = glyphSize * 0.7
    const cornerR = barHeight / 4

    const containerWidth = layout === "compact" ? glyphSize : GRID_WIDTH
    const barLeftX =
      layout === "compact"
        ? glyphSize * 0.15
        : (GRID_WIDTH - GLYPH_SIZE) / 2 + GLYPH_SIZE * 0.15

    const valTotal = values[0] + values[1] + values[2] + values[3]
    const minVisibleFrac = 2 / maxBarWidth

    const fractions: [number, number, number, number] = [0, 0, 0, 0]
    for (let i = 0; i < NUM_TIERS; i++) {
      const v = values[i] ?? 0
      const norm = valTotal > 0 ? v / valTotal : 0
      fractions[i] = norm > 0 ? Math.max(minVisibleFrac, norm) : 0
    }

    const transitionStyle = animate
      ? {
          transition: `transform ${ANIMATE_DURATION_MS}ms cubic-bezier(0.25,0.1,0.25,1)`,
        }
      : undefined

    return (
      <svg width={containerWidth} height={glyphSize}>
        {Array.from({ length: NUM_TIERS }, (_, i) => {
          const y = barSpacing + i * (barHeight + barSpacing)
          const fraction = fractions[i]!
          const fillWidth = animate ? maxBarWidth : fraction * maxBarWidth

          return (
            <g key={i}>
              <rect
                x={barLeftX}
                y={y}
                width={maxBarWidth}
                height={barHeight}
                fill={trackColor}
                rx={cornerR}
              />
              <rect
                x={barLeftX}
                y={y}
                width={fillWidth}
                height={barHeight}
                fill={tierColors[i]}
                opacity={FILL_OPACITY}
                rx={cornerR}
                style={
                  animate
                    ? {
                        transform: `scaleX(${fraction})`,
                        transformOrigin: `${barLeftX}px 0`,
                        ...transitionStyle,
                      }
                    : undefined
                }
              />
            </g>
          )
        })}

        {GRIDLINE_FRACTIONS.map((frac, li) => (
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
            stroke={gridlineColor}
            strokeWidth={0.5}
            strokeDasharray="1,2"
          />
        ))}
      </svg>
    )
  },
)

BarsLayer.displayName = "BarsLayer"

export default BarsLayer
