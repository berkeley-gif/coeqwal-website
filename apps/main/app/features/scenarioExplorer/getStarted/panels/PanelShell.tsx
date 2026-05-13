"use client"

import { type ReactNode } from "react"
import { Box, useTheme } from "@repo/ui/mui"
import { getStartedViewportCardHeightCss } from "../getStartedViewport"

interface PanelShellProps {
  children: ReactNode
  /** Card background colour (the rounded surface) */
  background: string
  /** Optional frame background. Defaults to transparent so the frame blends
   *  into the scroll container. Pass a colour to cover content behind
   *  (e.g. the persistent map when `mapMode === "get-started"`). */
  frameBackground?: string
  /** Inner min-height (default: 100vh) */
  minHeight?: string | number
}

/** Rounded-panel shell shared by every Get Started content panel.
 *  Frame (outer) holds the inset. Card (inner) holds the rounded corners.
 *  Radius + inset come from `theme.layout.panel` */
export default function PanelShell({
  children,
  background,
  frameBackground,
  minHeight,
}: PanelShellProps) {
  const theme = useTheme()
  const resolvedMinHeight = minHeight ?? getStartedViewportCardHeightCss(theme)
  return (
    <Box
      sx={{
        pointerEvents: "auto",
        backgroundColor: frameBackground ?? "transparent",
        px: theme.layout.panel.insetX,
        py: theme.layout.panel.insetY,
      }}
    >
      <Box
        sx={{
          backgroundColor: background,
          borderRadius: theme.layout.panel.radius,
          overflow: "hidden",
          minHeight: resolvedMinHeight,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          px: theme.space.panel.padding,
          py: theme.space.panel.padding,
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
