"use client"

import React from "react"

export interface VerticalBarChartProps {
  /** Array of tier configurations with optional values */
  tiers?: Array<{
    label: string
    color: string
    value?: number
  }>
  /** Size in pixels (square) */
  size?: number
  /** Random seed for consistent random values (optional) */
  seed?: number
}

/**
 * Small multiple vertical bar chart component
 */
const VerticalBarChart = ({
  size = 80,
  tiers,
  seed,
}: VerticalBarChartProps) => {
  const defaultTiers = [
    { label: "Tier 1", color: "#2cc83b" }, // green
    { label: "Tier 2", color: "#2064d4" }, // blue
    { label: "Tier 3", color: "#f89740" }, // orange
    { label: "Tier 4", color: "#f96262" }, // red
  ]

  const chartTiers = tiers || defaultTiers

  // Generate random values with high variation and normalize
  const generateRandomValue = (index: number) => {
    if (seed !== undefined) {
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

  // Normalize if values are not already normalized
  const maxValue = Math.max(...rawValues)
  const normalizedValues = allValuesNormalized
    ? rawValues // Use values as-is if already normalized
    : rawValues.map((value) => value / maxValue) // Scale to 100% of height for raw values

  const barWidth = (size * 0.8) / chartTiers.length // 80% of width divided by number of bars
  const barSpacing = (size * 0.2) / (chartTiers.length + 1) // Remaining 20% for spacing
  const maxBarHeight = size * 0.85 // Maximum bar height is 85% of size (taller bars)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background */}
      <rect width={size} height={size} fill="transparent" />

      {/* Bars */}
      {chartTiers.map((tier, i) => {
        const barHeight = (normalizedValues[i] || 0) * maxBarHeight
        const x = barSpacing + i * (barWidth + barSpacing)
        const y = size * 0.95 - barHeight // Start from near bottom (5% margin)

        return (
          <g key={tier.label}>
            {/* Bar background */}
            <rect
              x={x}
              y={size * 0.1}
              width={barWidth}
              height={maxBarHeight}
              fill="#f0f0f0"
              rx={barWidth / 4}
            />

            {/* Bar fill */}
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={tier.color}
              opacity={0.8}
              rx={barWidth / 4}
            />
          </g>
        )
      })}

      {/* Grid lines for reference */}
      {[0.25, 0.5, 0.75].map((fraction, i) => (
        <line
          key={i}
          x1={barSpacing}
          y1={size * 0.15 + maxBarHeight * fraction}
          x2={size - barSpacing}
          y2={size * 0.15 + maxBarHeight * fraction}
          stroke="#ddd"
          strokeWidth={0.5}
          strokeDasharray="1,2"
        />
      ))}
    </svg>
  )
}

export default React.memo(VerticalBarChart)
