"use client"

import React from "react"
import OutcomeGlyph from "./OutcomeGlyph"
import OutcomeDotsGlyph from "./OutcomeDotsGlyph"
import VerticalOutcomeGlyph from "./VerticalOutcomeGlyph"
import RoseChart from "./RoseChart"
import { DecileBarChart } from "./DecileBarChart"
export type GlyphVariant =
  | "bars"
  | "dots"
  | "verticalBars"
  | "rose"
  | "quartile"

export interface ScenarioGlyphProps {
  variant: GlyphVariant
  values: [number, number, number, number] // quartiles min,q1,median,q3 (worst,w25,median,w75)
  size?: number
  /** tier colors [tier1, tier2, tier3, tier4] from theme - required */
  tierColors: [string, string, string, string]
}

const ScenarioGlyph: React.FC<ScenarioGlyphProps> = ({
  variant,
  values,
  size = 60,
  tierColors,
}) => {
  switch (variant) {
    case "bars":
      return (
        <OutcomeGlyph values={values} size={size} tierColors={tierColors} />
      )
    case "dots":
      return (
        <OutcomeDotsGlyph values={values} size={size} tierColors={tierColors} />
      )
    case "verticalBars":
      return (
        <VerticalOutcomeGlyph
          values={values}
          size={size}
          tierColors={tierColors}
        />
      )
    case "rose": {
      return <RoseChart size={size} />
    }
    case "quartile": {
      // Use real scenario data from /scenario_data/categorized_deciles/
      const sampleDecileData = {
        q10: -36430.21926279068,
        q20: -24701.34876346588,
        q30: -13030.184863829612,
        q40: -4565.719305586813,
        q50: 0.0,
        q60: 0.0,
        q70: 5483.532191923256,
        q80: 14886.184681892397,
        q90: 58027.34231367118,
        q100: 75000.0, // add q100 for completeness
      }

      return (
        <div style={{ width: size, height: size, overflow: "hidden" }}>
          <DecileBarChart
            data={sampleDecileData}
            width={size}
            height={size}
            margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
            showValues={false}
            showLegend={false}
            compact={true}
            responsive={false}
            barWidthPixels={20}
            showTickLabels={false}
            axisColor="#cbd5e0"
            title=""
            xAxisLabel=""
            yAxisLabel=""
          />
        </div>
      )
    }
    default:
      return (
        <OutcomeGlyph values={values} size={size} tierColors={tierColors} />
      )
  }
}

export default React.memo(ScenarioGlyph)
