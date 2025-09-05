import React from "react"

export interface RoseChartProps {
  /** Size of the chart in pixels */
  size?: number
  /** Custom tier data (optional - uses default if not provided) */
  tiers?: Array<{
    label: string
    color: string
    startAngle: number
    endAngle: number
  }>
  /** Random seed for consistent random values (optional) */
  seed?: number
}

/**
 * Rose chart component for displaying tier distribution
 *
 * Features:
 * - Four-tier radial visualization
 * - Customizable colors and angles
 * - Responsive sizing
 */
const RoseChart = ({ size = 80, tiers, seed }: RoseChartProps) => {
  const centerX = size / 2
  const centerY = size / 2
  const innerRadius = size * 0.03
  const maxRadius = size * 0.5

  // Default tier configuration (mockup for now)
  const defaultTiers = [
    { label: "Tier 1", color: "#2cc83b", startAngle: 0, endAngle: 90 },
    { label: "Tier 2", color: "#f96262", startAngle: 270, endAngle: 360 },
    { label: "Tier 3", color: "#f89740", startAngle: 180, endAngle: 270 },
    { label: "Tier 4", color: "#2064d4", startAngle: 90, endAngle: 180 },
  ]

  const chartTiers = tiers || defaultTiers

  // Generate random values with high variation and normalize
  // Use seed for consistent results if provided
  const generateRandomValue = () => {
    if (seed !== undefined) {
      // Simple seeded random number generator
      const x = Math.sin(seed * 12.9898) * 43758.5453123
      return x - Math.floor(x)
    }
    return Math.random()
  }

  const rawValues = chartTiers.map(() => 0.2 + generateRandomValue() * 0.8)
  const total = rawValues.reduce((sum, val) => sum + val, 0)
  const normalized = rawValues.map((d) => d / total)
  const scaledValues = normalized.map((fraction) => maxRadius * fraction * 1.8)

  const degToRad = (deg: number) => (deg * Math.PI) / 180

  const createArc = (
    innerR: number,
    outerR: number,
    startAngle: number,
    endAngle: number,
  ) => {
    const startAngleRad = degToRad(startAngle - 90) // Adjust for SVG coordinate system
    const endAngleRad = degToRad(endAngle - 90)

    const x1 = centerX + innerR * Math.cos(startAngleRad)
    const y1 = centerY + innerR * Math.sin(startAngleRad)
    const x2 = centerX + outerR * Math.cos(startAngleRad)
    const y2 = centerY + outerR * Math.sin(startAngleRad)
    const x3 = centerX + outerR * Math.cos(endAngleRad)
    const y3 = centerY + outerR * Math.sin(endAngleRad)
    const x4 = centerX + innerR * Math.cos(endAngleRad)
    const y4 = centerY + innerR * Math.sin(endAngleRad)

    const largeArc = endAngle - startAngle > 180 ? 1 : 0

    return `M ${x1} ${y1} L ${x2} ${y2} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x3} ${y3} L ${x4} ${y4} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1} ${y1} Z`
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Quadrant axes */}
      {[0, 90, 180, 270].map((angle) => {
        const rad = degToRad(angle - 90)
        const x1 = centerX + innerRadius * Math.cos(rad)
        const y1 = centerY + innerRadius * Math.sin(rad)
        const x2 = centerX + maxRadius * Math.cos(rad)
        const y2 = centerY + maxRadius * Math.sin(rad)
        return (
          <line
            key={angle}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="gray"
            strokeWidth={0.5}
            strokeDasharray="1,2"
          />
        )
      })}

      {/* Petals */}
      {chartTiers.map((tier, i) => (
        <path
          key={tier.label}
          d={createArc(
            innerRadius,
            innerRadius + (scaledValues[i] || 0),
            tier.startAngle,
            tier.endAngle,
          )}
          fill={tier.color}
          opacity={0.8}
        />
      ))}

      {/* Center circle */}
      <circle
        cx={centerX}
        cy={centerY}
        r={innerRadius}
        fill="white"
        stroke="#ccc"
        strokeWidth={0.5}
      />
    </svg>
  )
}

export default React.memo(RoseChart)
