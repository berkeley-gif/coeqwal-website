"use client"

import React from "react"

export interface OutcomeDotsGlyphProps {
  /** four values representing tiers, where only one should be 1 and others 0 */
  values?: [number, number, number, number]
  /** size in px */
  size?: number
  /** tier colors [tier1, tier2, tier3, tier4] from theme - required */
  tierColors: [string, string, string, string]
}

/**
 * OutcomeDotsGlyph: small multiple 4-row rounded-square display for single-value tier metrics.
 * Shows 4 rounded squares stacked vertically where only the active tier (value=1) is filled with color.
 */
const OutcomeDotsGlyph: React.FC<OutcomeDotsGlyphProps> = React.memo(
  ({ values, size = 60, tierColors }) => {
    const tiers = values
      ? values.map((value, idx) => ({
          label: `Tier ${idx + 1}`,
          color: tierColors[idx]!,
          value: value,
        }))
      : [
          { label: "Tier 1", color: tierColors[0]!, value: 0 },
          { label: "Tier 2", color: tierColors[1]!, value: 0 },
          { label: "Tier 3", color: tierColors[2]!, value: 0 },
          { label: "Tier 4", color: tierColors[3]!, value: 0 },
        ]

    const numTiers = tiers.length
    const barHeight = (size * 0.8) / numTiers
    const barSpacing = (size * 0.2) / (numTiers + 1)
    const cx = size / 2

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <rect width={size} height={size} fill="transparent" />

        {tiers.map((tier, i) => {
          const y = barSpacing + i * (barHeight + barSpacing)
          const isFilled = tier.value > 0

          return (
            <g key={tier.label}>
              <rect
                x={cx - barHeight / 2 + 1}
                y={y + 1}
                width={barHeight - 2}
                height={barHeight - 2}
                rx={barHeight / 4}
                fill={isFilled ? tier.color : "transparent"}
                stroke={isFilled ? tier.color : "#d8d8d8"}
                strokeWidth={2}
                opacity={1}
              />
            </g>
          )
        })}
      </svg>
    )
  },
)

OutcomeDotsGlyph.displayName = "OutcomeDotsGlyph"

export default OutcomeDotsGlyph
