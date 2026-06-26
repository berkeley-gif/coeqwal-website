"use client"

/**
 * HoverTip - Hover to show a short hint, move away to hide it.
 *
 * This is a thin MUI Tooltip wrapper that pulls its styling from tooltipSurface
 * so it doesn't use MUI's default dark bubble. Use it for hover hints.
 * Use InfoPopover for click-to-open content, or HybridTooltip for both.
 */

import React from "react"
import { Tooltip, useTheme } from "../../.."
import { Theme } from "@mui/material/styles"
import type { TooltipProps } from "@mui/material"
import { themeValues } from "../../../themes/theme"
import { tooltipSurface } from "./tooltipSurface"

const DEFAULT_WIDTH = "280px"
const MAX_WIDTH = themeValues.layout.maxWidth.md

export interface HoverTipProps {
  /** The content to display in the hint */
  content: React.ReactNode
  /** The element that triggers the hint on hover */
  children: React.ReactElement
  /** Placement relative to the trigger (default: "top") */
  placement?: TooltipProps["placement"]
  /** Surface width */
  width?: string
  /** Surface max width */
  maxWidth?: string
  /** Delay before showing, in ms (default: 200) */
  enterDelay?: number
  /** Delay before hiding, in ms (default: 100) */
  leaveDelay?: number
}

export function HoverTip({
  content,
  children,
  placement = "top",
  width = DEFAULT_WIDTH,
  maxWidth = MAX_WIDTH,
  enterDelay = 200,
  leaveDelay = 100,
}: HoverTipProps) {
  const theme = useTheme()

  return (
    <Tooltip
      title={content}
      placement={placement}
      arrow
      enterDelay={enterDelay}
      leaveDelay={leaveDelay}
      slotProps={{
        popper: {
          // tooltipAboveModal so hints inside modals still layer above them.
          sx: { zIndex: theme.zIndex.tooltipAboveModal },
        },
        tooltip: {
          sx: (t: Theme) => ({ ...tooltipSurface(t), width, maxWidth }),
        },
        arrow: {
          sx: (t: Theme) => ({ color: t.palette.background.paper }),
        },
      }}
    >
      {children}
    </Tooltip>
  )
}

export default HoverTip
