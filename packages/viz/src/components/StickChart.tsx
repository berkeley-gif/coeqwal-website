import React from "react"

export interface StickChartProps {
  /** Size of the chart in pixels */
  size?: number
  /** Custom tier data (optional - uses dummy data if not provided) */
  tiers?: Array<{
    label: string
    color: string
    value?: number
  }>
  /** Random seed for consistent random values (optional) */
  seed?: number
}

/**
 * Stick Chart component for displayingtier data in a vertical stick/lollipop format
 *
 * Features:
 * - Four-tier vertical stick visualization
 * - Customizable colors and values
 * - Responsive sizing
 */
const StickChart = ({ size = 80, tiers, seed }: StickChartProps) => {
  // Default tier configuration: red → orange → blue → green
  const defaultTiers = [
    { label: "Tier 1", color: "#f96262" }, // red
    { label: "Tier 2", color: "#f89740" }, // orange
    { label: "Tier 3", color: "#2064d4" }, // blue
    { label: "Tier 4", color: "#2cc83b" }, // green
  ]

  const chartTiers = tiers || defaultTiers

  // Generate random values with high variation and normalize
  // Use seed for consistent results if provided
  const generateRandomValue = (index: number) => {
    if (seed !== undefined) {
      // Simple seeded random number generator
      const x = Math.sin((seed + index) * 12.9898) * 43758.5453123
      return x - Math.floor(x)
    }
    return Math.random()
  }

  const rawValues = chartTiers.map((tier, i) => {
    const tierWithValue = tier as {
      label: string
      color: string
      value?: number
    }
    return tierWithValue.value !== undefined
      ? tierWithValue.value
      : 0.2 + generateRandomValue(i) * 0.8
  })
  const maxValue = Math.max(...rawValues)
  const normalizedValues = rawValues.map((value) => (value / maxValue) * 0.8) // Scale to 80% of height

  const stickWidth = (size * 0.8) / chartTiers.length // 80% of width divided by number of sticks
  const stickSpacing = (size * 0.2) / (chartTiers.length + 1) // Remaining 20% for spacing
  const maxStickHeight = size * 0.7 // Maximum stick height is 70% of size
  const baseY = size * 0.85 // Baseline for sticks
  const circleRadius = Math.min(stickWidth * 0.3, 4) // Circle size, max 4px

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background */}
      <rect width={size} height={size} fill="transparent" />

      {/* Baseline */}
      <line
        x1={stickSpacing}
        y1={baseY}
        x2={size - stickSpacing}
        y2={baseY}
        stroke="#ccc"
        strokeWidth={1}
      />

      {/* Sticks */}
      {chartTiers.map((tier, i) => {
        const stickHeight = (normalizedValues[i] || 0) * maxStickHeight
        const x =
          stickSpacing + i * (stickWidth + stickSpacing) + stickWidth / 2
        const topY = baseY - stickHeight

        return (
          <g key={tier.label}>
            {/* Stick line */}
            <line
              x1={x}
              y1={baseY}
              x2={x}
              y2={topY}
              stroke={tier.color}
              strokeWidth={2}
              opacity={0.8}
            />

            {/* Top circle */}
            <circle
              cx={x}
              cy={topY}
              r={circleRadius}
              fill={tier.color}
              opacity={0.9}
            />
          </g>
        )
      })}

      {/* Grid lines for reference */}
      {[0.25, 0.5, 0.75].map((fraction, i) => (
        <line
          key={i}
          x1={stickSpacing}
          y1={baseY - maxStickHeight * fraction}
          x2={size - stickSpacing}
          y2={baseY - maxStickHeight * fraction}
          stroke="#eee"
          strokeWidth={0.5}
          strokeDasharray="1,2"
        />
      ))}
    </svg>
  )
}

export default React.memo(StickChart)
