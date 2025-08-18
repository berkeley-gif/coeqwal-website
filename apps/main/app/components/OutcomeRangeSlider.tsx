"use client"

import React from "react"
import { Box, Typography, Slider } from "@repo/ui/mui"
import { useScenarioFilterStore } from "@repo/state"
import type { OutcomeName } from "@repo/state"

export interface OutcomeRangeSliderProps {
  outcome: OutcomeName
}

const OutcomeRangeSlider: React.FC<OutcomeRangeSliderProps> = ({ outcome }) => {
  const range = useScenarioFilterStore((s) => s.outcomeRanges[outcome])
  const setOutcomeRange = useScenarioFilterStore((s) => s.setOutcomeRange)

  const handleChange = (_: Event, value: number | number[]) => {
    if (Array.isArray(value) && value.length === 2) {
      setOutcomeRange(outcome, {
        min: value[0] as number,
        max: value[1] as number,
      })
    }
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
        {outcome}
      </Typography>
      <Slider
        size="small"
        value={[range.min, range.max]}
        min={-1}
        max={1}
        step={0.05}
        onChange={handleChange}
        valueLabelDisplay="auto"
      />
    </Box>
  )
}

export default React.memo(OutcomeRangeSlider)
