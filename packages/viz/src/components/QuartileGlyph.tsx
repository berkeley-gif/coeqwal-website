"use client"

import React from "react"

export interface QuartileGlyphProps {
  values: [number, number, number, number] // q0,q1,median,q3
  size?: number
  colors?: string[]
}

const defaultColors = ["#d4e4ff", "#8cb3ff", "#4d7cff", "#2a52e0"]

const QuartileGlyph: React.FC<QuartileGlyphProps> = ({
  values,
  size = 60,
  colors = defaultColors,
}) => {
  // Normalize values 0..1 for bar length
  const max = Math.max(...values.map((v) => Math.abs(v))) || 1
  const norm = values.map((v) => (Math.abs(v) / max) * 0.9) // up to 90% width
  const barHeight = (size * 0.8) / 4
  const barSpacing = (size * 0.2) / 5

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {norm.map((w, i) => {
        const y = barSpacing + i * (barHeight + barSpacing)
        const barWidth = w * size
        return (
          <rect
            key={i}
            x={size * 0.1}
            y={y}
            width={barWidth}
            height={barHeight}
            fill={colors[i % colors.length]}
            rx={barHeight / 4}
          />
        )
      })}
    </svg>
  )
}

export default React.memo(QuartileGlyph)
