"use client"

export interface TierCirclesProps {
  /** Array of tier configurations with values (0 or 1 for single-value tiers) */
  tiers: Array<{
    label: string
    color: string
    value: number
  }>
  /** Size in pixels (square) */
  size?: number
}

/**
 * Displays tier indicators as circles (designed for single-value tier metrics)
 * Shows 4 circles stacked vertically where only the active tier is filled with color
 */
const TierCircles = ({ size = 80, tiers }: TierCirclesProps) => {
  const circleRadius = size * 0.1 // Circle radius relative to size
  const rowHeight = size / 4 // Divide into 4 equal rows
  const cx = size / 2 // Center horizontally

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background */}
      <rect width={size} height={size} fill="transparent" />

      {/* Circles - stacked vertically in 4 rows */}
      {tiers.map((tier, i) => {
        const cy = rowHeight * i + rowHeight / 2 // Center in each row
        const isFilled = tier.value > 0 // Fill circle if value is > 0

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

export default TierCircles
