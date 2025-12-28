"use client"

import React from "react"
import VerticalBarChart from "./VerticalBarChart"

export interface VerticalOutcomeGlyphProps {
  /** four values representing distribution (min,q1,median,q3) scaled -1..1 */
  values?: [number, number, number, number]
  /** size in px */
  size?: number
  /** tier colors [tier1, tier2, tier3, tier4] from theme - required */
  tierColors: [string, string, string, string]
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
  const tiers = values
    ? (["Q1", "Q2", "Q3", "Q4"] as const).map((label, idx) => ({
        label,
        color: tierColors[idx]!,
        value: Math.abs(values[idx] ?? 0), // VerticalBarChart expects positive length
      }))
    : undefined

  return <VerticalBarChart size={size} tiers={tiers} />
}

export default React.memo(VerticalOutcomeGlyph)
