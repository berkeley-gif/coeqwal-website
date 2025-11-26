import React from "react"

export interface OutcomeDotsGlyphProps {
  /** four values representing tiers, where only one should be 1 and others 0 */
  values?: [number, number, number, number]
  /** size in px */
  size?: number
  /** custom tier colors [tier1, tier2, tier3, tier4] */
  tierColors?: [string, string, string, string]
}

/**
 * OutcomeDotsGlyph: small multiple 4-row circle display for single-value tier metrics.
 * Shows 4 circles stacked vertically where only the active tier (value=1) is filled with color.
 */
const OutcomeDotsGlyph: React.FC<OutcomeDotsGlyphProps> = ({
  values,
  size = 60,
  tierColors,
}) => {
  // Use provided tier colors or fall back to defaults
  const defaultColors = ["#2E8B57", "#87CEEB", "#FFB347", "#CD5C5C"] // Green, Light Blue, Orange, Red
  const colors = tierColors || defaultColors

  const tiers = values
    ? values.map((value, idx) => ({
        label: `Tier ${idx + 1}`,
        color: colors[idx]!,
        value: value, // Keep as 0 or 1 for dots
      }))
    : [
        { label: "Tier 1", color: colors[0]!, value: 0 },
        { label: "Tier 2", color: colors[1]!, value: 0 },
        { label: "Tier 3", color: colors[2]!, value: 0 },
        { label: "Tier 4", color: colors[3]!, value: 0 },
      ]

  const circleRadius = size * 0.1 // Radius for vertical stacking
  const rowHeight = size / 4 // Divide into 4 equal rows
  const cx = size / 2 // Center horizontally

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background */}
      <rect width={size} height={size} fill="transparent" />

      {/* Circles - stacked vertically in 4 rows */}
      {tiers.map((tier, i) => {
        const cy = rowHeight * i + rowHeight / 2 // Center in each row
        const isFilled = tier.value > 0

        return (
          <g key={tier.label}>
            {/* Circle */}
            <circle
              cx={cx}
              cy={cy}
              r={circleRadius}
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
}

export default React.memo(OutcomeDotsGlyph)
