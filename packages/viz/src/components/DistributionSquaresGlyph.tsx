"use client"

import React, { useMemo } from "react"
import { SQUARE_SIZE, SQUARE_GAP } from "../utils/shape-morph"

const COLS = 10
const TOTAL_SQUARES = 100
const CELL = SQUARE_SIZE + SQUARE_GAP
const CORNER_RADIUS = 2

export interface DistributionSquaresGlyphProps {
  values: [number, number, number, number]
  tierColors: [string, string, string, string]
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

/**
 * DistributionSquaresGlyph. Renders a 10-column grid of colored squares
 * matching the get-started overlay (OutcomeMorphOverlay) layout exactly.
 *
 * Each tier occupies its own row(s). Tiers never share a row.
 * Layout mirrors computeOutcomeLayout: tier 1 fills rows 0..ceil(n1/cols)-1,
 * tier 2 starts on the next row, etc.
 */
const DistributionSquaresGlyph: React.FC<DistributionSquaresGlyphProps> =
  React.memo(({ values, tierColors }) => {
    const layout = useMemo(() => {
      const counts = distributeSquares(values as number[])
      const rects: { x: number; y: number; color: string }[] = []
      let currentRow = 0

      for (let t = 0; t < counts.length; t++) {
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
          })
        }
        currentRow += Math.ceil(count / COLS)
      }

      return { rects, totalRows: currentRow }
    }, [values, tierColors])

    const gridWidth = COLS * CELL - SQUARE_GAP
    const gridHeight = layout.totalRows * CELL - SQUARE_GAP

    return (
      <svg width={gridWidth} height={gridHeight}>
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
          />
        ))}
      </svg>
    )
  })

DistributionSquaresGlyph.displayName = "DistributionSquaresGlyph"

export default DistributionSquaresGlyph
