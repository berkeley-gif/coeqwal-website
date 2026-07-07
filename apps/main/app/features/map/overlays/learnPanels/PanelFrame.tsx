"use client"

import { type ReactNode } from "react"
import { Box, useTheme, type SxProps, type Theme } from "@repo/ui/mui"

interface PanelFrameProps {
  children: ReactNode
  /** Styles applied to the inner rounded surface (e.g. background, padding,
   *  min-height, centering). The frame inset and corner radius are fixed. */
  innerSx?: SxProps<Theme>
  /** Styles applied to the outer inset box. Use to override defaults such as
   *  `pointerEvents` (e.g. the tier animation disables them while the map is
   *  interactive). The inset paddings can be overridden here too. */
  outerSx?: SxProps<Theme>
}

/** Shared inset + rounded-corner wrapper for Get Started sections.
 *  The outer box holds the inset. The inner box holds the rounded corners.
 *  Used by `PanelShell` (content cards) and by the tier animation section.
 *  Radius and inset come from `theme.layout.panel` */
export default function PanelFrame({
  children,
  innerSx,
  outerSx,
}: PanelFrameProps) {
  const theme = useTheme()
  return (
    <Box
      sx={{
        pointerEvents: "auto",
        py: theme.layout.panel.insetY,
        ...((outerSx as object) ?? {}),
      }}
    >
      <Box
        sx={{
          borderRadius: theme.layout.panel.radius,
          overflow: "hidden",
          ...((innerSx as object) ?? {}),
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
