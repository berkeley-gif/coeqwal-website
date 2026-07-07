"use client"

import { type ReactNode } from "react"
import { useTheme } from "@repo/ui/mui"
import PanelFrame from "./PanelFrame"

interface PanelShellProps {
  children: ReactNode
  /** Card background colour (the rounded surface) */
  background: string
  /** Inner min-height (default: viewport-fit card height) */
  minHeight?: string | number
}

const PANEL_BREATHING_PX = 80

type LayoutSlice = {
  layout: { collapsedHeaderHeight: number; collapsedTabHeight: number }
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

  function stickyStackOffsetPx(theme: LayoutSlice) {
    return (
      theme.layout.collapsedHeaderHeight + 2 * theme.layout.collapsedTabHeight
    )
  }


  /** Card min-height that fits one viewport, minus the sticky header/tab
   *  stack above it and a fixed breathing margin. `contentOverflowPx` lets
   *  a caller's content run past one viewport deliberately (e.g. the tier
   *  animation's taller-than-one-screen composition). */
  function getPanelCardHeightCss(
    theme: LayoutSlice,
    options: { contentOverflowPx?: number } = {},
  ) {
    const { contentOverflowPx = 0 } = options
    return `calc(100vh - ${stickyStackOffsetPx(theme) + PANEL_BREATHING_PX - contentOverflowPx
      }px)`
  }

  const resolvedMinHeight = minHeight ?? getPanelCardHeightCss(theme)


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
