"use client"

/**
 * TourStepDots - The row of small dots showing progress through the tour,
 * one per step, with the active step highlighted. Decorative (the
 * "step n / m" counter in the header carries the same information for
 * screen readers), so the list is `aria-hidden`.
 */

import React from "react"
import { Box, useTheme } from "@repo/ui/mui"

export interface TourStepDotsProps {
  /** Stable key per step (the step ids), one dot each. */
  stepIds: string[]
  activeIndex: number
}

export function TourStepDots({ stepIds, activeIndex }: TourStepDotsProps) {
  const theme = useTheme()

  return (
    <Box
      component="ol"
      aria-hidden
      sx={{
        m: 0,
        p: 0,
        listStyle: "none",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 0.5,
        minWidth: 0,
        rowGap: 0.5,
      }}
    >
      {stepIds.map((id, i) => (
        <Box
          key={id}
          component="li"
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            flexShrink: 0,
            backgroundColor:
              i === activeIndex
                ? theme.palette.blue.bright
                : theme.palette.grey[300],
          }}
        />
      ))}
    </Box>
  )
}
