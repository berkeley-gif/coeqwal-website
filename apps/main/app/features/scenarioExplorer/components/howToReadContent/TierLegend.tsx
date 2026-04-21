"use client"

import React from "react"
import { useTheme } from "@repo/ui/mui"
import { TIER_LABELS } from "../../../../content/tiers"
import { Figure } from "./Figure"

const CELL = 48
const CELL_RADIUS = 6
const CELL_GAP = 6

/**
 * Row of four tier swatches with their labels underneath. Used by every
 * how-to-read modal that touches the shared 1-to-4 categorical scale.
 */
export function TierLegend({
  caption = "The four categorical tiers. Lower numbers are better.",
}: { caption?: string } = {}) {
  const theme = useTheme()
  const tiers = theme.palette.tiers
  const entries: Array<{ level: 1 | 2 | 3 | 4; color: string }> = [
    { level: 1, color: tiers.tier1 },
    { level: 2, color: tiers.tier2 },
    { level: 3, color: tiers.tier3 },
    { level: 4, color: tiers.tier4 },
  ]
  const width = entries.length * CELL + (entries.length - 1) * CELL_GAP
  const textY = CELL + 22
  const labelY = CELL + 38
  return (
    <Figure caption={caption}>
      <svg
        width={width}
        height={CELL + 48}
        role="img"
        aria-label="Tier color scale"
      >
        {entries.map((e, i) => {
          const x = i * (CELL + CELL_GAP)
          return (
            <g key={e.level}>
              <rect
                x={x}
                y={0}
                width={CELL}
                height={CELL}
                rx={CELL_RADIUS}
                fill={e.color}
              />
              <text
                x={x + CELL / 2}
                y={CELL / 2 + 5}
                textAnchor="middle"
                fontSize={16}
                fontWeight={600}
                fill="#ffffff"
              >
                {e.level}
              </text>
              <text
                x={x + CELL / 2}
                y={textY}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                fill={theme.palette.text.primary}
              >
                Tier {e.level}
              </text>
              <text
                x={x + CELL / 2}
                y={labelY}
                textAnchor="middle"
                fontSize={10}
                fill={theme.palette.grey[700]}
              >
                {TIER_LABELS[e.level]}
              </text>
            </g>
          )
        })}
      </svg>
    </Figure>
  )
}

export default TierLegend
