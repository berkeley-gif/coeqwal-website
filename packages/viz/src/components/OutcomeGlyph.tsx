import React from "react"
import BarChart from "./BarChart"

export interface OutcomeGlyphProps {
  /** four values representing distribution (min,q1,median,q3) scaled -1..1 */
  values?: [number, number, number, number]
  /** size in px */
  size?: number
}

/**
 * OutcomeGlyph – tiny 4-bar horizontal chart reused across dashboard.
 * If no `values` provided falls back to BarChart’s internal dummy values.
 */
const OutcomeGlyph: React.FC<OutcomeGlyphProps> = ({ values, size = 60 }) => {
  const tiers = values
    ? (["Q1", "Q2", "Q3", "Q4"] as const).map((label, idx) => ({
        label,
        color: ["#2cc83b", "#2064d4", "#f89740", "#f96262"][idx]!,
        value: Math.abs(values[idx] ?? 0), // BarChart expects positive length
      }))
    : undefined

  return <BarChart size={size} tiers={tiers} />
}

export default React.memo(OutcomeGlyph)
