"use client"

import React from "react"
import VerticalBarChart from "./VerticalBarChart"

export interface VerticalOutcomeGlyphProps {
  /** four values representing distribution (min,q1,median,q3) scaled -1..1 */
  values?: [number, number, number, number]
  /** size in px */
  size?: number
  tierColors?: [string, string, string, string]
}

/**
 * VerticalOutcomeGlyph – small multiple 4-bar vertical chart matching horizontal style.
 * If no `values` provided falls back to VerticalBarChart's internal dummy values for demo.
 */
const VerticalOutcomeGlyph: React.FC<VerticalOutcomeGlyphProps> = ({
  values,
  size = 60,
  tierColors,
}) => {
  // Use provided tier colors or fall back to defaults (same as horizontal)
  const defaultColors = ["#2E8B57", "#87CEEB", "#FFB347", "#CD5C5C"] // Green, Light Blue, Orange, Red
  const colors = tierColors || defaultColors

  const tiers = values
    ? (["Q1", "Q2", "Q3", "Q4"] as const).map((label, idx) => ({
        label,
        color: colors[idx]!,
        value: Math.abs(values[idx] ?? 0), // VerticalBarChart expects positive length
      }))
    : undefined

  return <VerticalBarChart size={size} tiers={tiers} />
}

export default React.memo(VerticalOutcomeGlyph)
