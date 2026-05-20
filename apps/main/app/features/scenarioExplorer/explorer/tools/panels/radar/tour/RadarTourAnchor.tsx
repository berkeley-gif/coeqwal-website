"use client"

/**
 * RadarTourAnchor. Inline-flex wrapper that registers a tour anchor on
 * chart controls inside `RadarChartControls`. Equivalent to the generic
 * `InlineTourAnchor` in `tour/anchors/`, kept here for the radar
 * controls' historical naming.
 */

import React from "react"
import { Box } from "@repo/ui/mui"
import { useTourAnchor } from "../../../tour/anchors/TourAnchorContext"

type RadarTourAnchorProps = {
  anchorId: string
  children: React.ReactNode
}

export function RadarTourAnchor({ anchorId, children }: RadarTourAnchorProps) {
  const ref = useTourAnchor(anchorId)
  return (
    <Box ref={ref} sx={{ display: "inline-flex", alignItems: "center" }}>
      {children}
    </Box>
  )
}
