"use client"

import React from "react"
import { Box } from "@repo/ui/mui"
import { useTourAnchor } from "../tour/TourAnchorContext"

type RadarTourAnchorProps = {
  anchorId: string
  children: React.ReactNode
}

/** Inline-flex wrapper that registers a tour anchor on chart controls */
export function RadarTourAnchor({ anchorId, children }: RadarTourAnchorProps) {
  const ref = useTourAnchor(anchorId)
  return (
    <Box ref={ref} sx={{ display: "inline-flex", alignItems: "center" }}>
      {children}
    </Box>
  )
}
