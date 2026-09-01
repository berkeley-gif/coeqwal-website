"use client"

import { type ReactNode } from "react"
import { useTheme } from "@repo/ui/mui"
import PanelFrame from "./PanelFrame"

interface PanelShellProps {
  children: ReactNode
  /** Card background colour (the rounded surface) */
  background: string
  /** Inner min-height override. Default: fits content — the surrounding
   *  Step section in MapOverlayPanels already reserves the scroll-driven
   *  viewport height, so the colored card itself only needs to be as tall
   *  as its content. */
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

  return (
    <PanelFrame
      innerSx={{
        backgroundColor: background,
        minHeight,
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
