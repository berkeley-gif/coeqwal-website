"use client"

import React from "react"
import OutcomeGlyph from "./OutcomeGlyph"
import OutcomeDotsGlyph from "./OutcomeDotsGlyph"

/**
 * `"distribution"` is a sentinel value for callers (e.g.
 * `OutcomeGlyphItem`) that branch on the requested mode upstream of the
 * dispatcher (rendering `MorphableDistributionGlyph` or an inline
 * single-value SVG instead of going through `ScenarioGlyph`). In practice
 * `ScenarioGlyph` itself never receives `"distribution"`. If it ever
 * does, the default arm renders the bars glyph as a safe fallback.
 */
export type GlyphVariant = "bars" | "dots" | "distribution"

export interface ScenarioGlyphProps {
  variant: GlyphVariant
  values: [number, number, number, number]
  size?: number
  /** Tier colors [tier1, tier2, tier3, tier4] from theme - required */
  tierColors: [string, string, string, string]
}

const ScenarioGlyph: React.FC<ScenarioGlyphProps> = React.memo(
  ({ variant, values, size = 60, tierColors }) => {
    if (variant === "dots") {
      return (
        <OutcomeDotsGlyph values={values} size={size} tierColors={tierColors} />
      )
    }

    return <OutcomeGlyph values={values} size={size} tierColors={tierColors} />
  },
)

ScenarioGlyph.displayName = "ScenarioGlyph"

export default ScenarioGlyph
