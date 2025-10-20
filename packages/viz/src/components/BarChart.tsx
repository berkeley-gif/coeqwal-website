import React from "react"

export interface BarChartProps {
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
 * Small multiple bar chart component
 *
 * Features:
 * - Four-tier horizontal bar visualization
 * - Customizable colors and values
 * - Responsive sizing
 */
const BarChart = ({ size = 80, tiers, seed }: BarChartProps) => {
  // Default tier configuration: green → blue → orange → red (reversed order)
  const defaultTiers = [
    { label: "Tier 1", color: "#2cc83b" }, // green
    { label: "Tier 2", color: "#2064d4" }, // blue
    { label: "Tier 3", color: "#f89740" }, // orange
    { label: "Tier 4", color: "#f96262" }, // red
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

  // Check if values are already normalized (all between 0 and 1)
  const allValuesNormalized = rawValues.every((v) => v >= 0 && v <= 1)

  // Re-normalize if values are NOT already normalized
  const maxValue = Math.max(...rawValues)
  const normalizedValues = allValuesNormalized
    ? rawValues // Use values as-is if already normalized
    : rawValues.map((value) => value / maxValue) // Scale to 100% of width for raw values

  const barHeight = (size * 0.8) / chartTiers.length // 80% of height divided by number of bars
  const barSpacing = (size * 0.2) / (chartTiers.length + 1) // Remaining 20% for spacing
  const maxBarWidth = size * 0.7 // Maximum bar width is 70% of size

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background */}
      <rect width={size} height={size} fill="transparent" />

      {/* Bars */}
      {chartTiers.map((tier, i) => {
        const barWidth = (normalizedValues[i] || 0) * maxBarWidth
        const y = barSpacing + i * (barHeight + barSpacing)

        return (
          <g key={tier.label}>
            {/* Bar background */}
            <rect
              x={size * 0.15}
              y={y}
              width={maxBarWidth}
              height={barHeight}
              fill="#d8d8d8"
              rx={barHeight / 4}
            />

            {/* Bar fill */}
            <rect
              x={size * 0.15}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={tier.color}
              opacity={0.8}
              rx={barHeight / 4}
            />
          </g>
        )
      })}

      {/* Grid lines for reference */}
      {[0.25, 0.5, 0.75].map((fraction, i) => (
        <line
          key={i}
          x1={size * 0.15 + maxBarWidth * fraction}
          y1={barSpacing}
          x2={size * 0.15 + maxBarWidth * fraction}
          y2={size - barSpacing}
          stroke="#ddd"
          strokeWidth={0.5}
          strokeDasharray="1,2"
        />
      ))}
    </svg>
  )
}

export default React.memo(BarChart)
