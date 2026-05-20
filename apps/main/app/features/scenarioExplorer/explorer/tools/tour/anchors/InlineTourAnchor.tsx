"use client"

/**
 * InlineTourAnchor. Inline-flex wrapper that registers a tour anchor on
 * its children. Use when the target control would not otherwise expose a
 * ref attachment point and you do not want to disturb its layout (for
 * example, wrapping a chip or button inside a chart controls bar).
 *
 * For elements that already accept a ref (most MUI components and any
 * styled `Box`), call `useTourAnchor("id")` directly and attach the
 * returned ref. Use this wrapper only when wrapping is the path of
 * least resistance.
 */

import React from "react"
import { Box } from "@repo/ui/mui"
import { useTourAnchor } from "./TourAnchorContext"

type InlineTourAnchorProps = {
  anchorId: string
  children: React.ReactNode
}

export function InlineTourAnchor({
  anchorId,
  children,
}: InlineTourAnchorProps) {
  const ref = useTourAnchor(anchorId)
  return (
    <Box ref={ref} sx={{ display: "inline-flex", alignItems: "center" }}>
      {children}
    </Box>
  )
}
