"use client"

import { type ReactNode } from "react"
import { useTheme } from "@repo/ui/mui"
import PanelFrame from "./PanelFrame"
import { getStartedViewportCardHeightCss } from "../getStartedViewport"

interface PanelShellProps {
  children: ReactNode
  /** Card background colour (the rounded surface) */
  background: string
  /** Inner min-height (default: viewport-fit card height) */
  minHeight?: string | number
}

/** Rounded-panel shell shared by every Get Started content panel.
 *  Wraps `PanelFrame` (inset + radius) and adds the card surface:
 *  background, min-height, padding, and vertical centering. */
export default function PanelShell({
  children,
  background,
  minHeight,
}: PanelShellProps) {
  const theme = useTheme()
  const resolvedMinHeight = minHeight ?? getStartedViewportCardHeightCss(theme)
  return (
    <PanelFrame
      innerSx={{
        backgroundColor: background,
        minHeight: resolvedMinHeight,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        px: theme.space.panel.padding,
        py: theme.space.panel.padding,
      }}
    >
      {children}
    </PanelFrame>
  )
}
