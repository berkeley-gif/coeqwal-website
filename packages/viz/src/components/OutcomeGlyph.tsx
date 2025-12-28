import React from "react"
import BarChart from "./BarChart"

export interface OutcomeGlyphProps {
  /** four values representing distribution (min,q1,median,q3) scaled -1..1 */
  values?: [number, number, number, number]
  /** size in px */
  size?: number
  /** tier colors [tier1, tier2, tier3, tier4] from theme - required */
  tierColors: [string, string, string, string]
}

/**
 * OutcomeGlyph – small multiple 4-bar horizontal chart reused across dashboard.
 * If no `values` provided falls back to BarChart’s internal dummy values for demo.
 */
const OutcomeGlyph: React.FC<OutcomeGlyphProps> = ({
  values,
  size = 60,
  tierColors,
}) => {
  const tiers = values
    ? (["Q1", "Q2", "Q3", "Q4"] as const).map((label, idx) => ({
        label,
        color: tierColors[idx]!,
        value: Math.abs(values[idx] ?? 0), // BarChart expects positive length
      }))
    : undefined

  return <BarChart size={size} tiers={tiers} />
}

export default React.memo(OutcomeGlyph)
