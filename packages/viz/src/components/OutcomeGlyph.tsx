"use client"

import React from "react"
import BarsLayer from "./BarsLayer"

export interface OutcomeGlyphProps {
  /** Four tier values (tier1..tier4). Negative inputs are coerced via Math.abs. */
  values?: [number, number, number, number]
  /** Glyph edge in px */
  size?: number
  /** Tier colors [tier1, tier2, tier3, tier4] from theme - required */
  tierColors: [string, string, string, string]
}

/**
 * OutcomeGlyph: small-multiple 4-bar horizontal chart used by `ScenarioGlyph`
 * for multi-value tier outcomes. Thin wrapper around `BarsLayer` (compact,
 * non-animated). When `values` is omitted, an empty 4-tier glyph is rendered.
 */
const OutcomeGlyph: React.FC<OutcomeGlyphProps> = React.memo(
  ({ values, size = 60, tierColors }) => {
    const safeValues: [number, number, number, number] = values
      ? [
          Math.abs(values[0] ?? 0),
          Math.abs(values[1] ?? 0),
          Math.abs(values[2] ?? 0),
          Math.abs(values[3] ?? 0),
        ]
      : [0, 0, 0, 0]

    return (
      <BarsLayer
        values={safeValues}
        tierColors={tierColors}
        size={size}
        layout="compact"
        animate={false}
      />
    )
  },
)

OutcomeGlyph.displayName = "OutcomeGlyph"

export default OutcomeGlyph
