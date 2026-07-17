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
import { tooltipSurface, type TooltipDensity } from "./tooltipSurface"

const DEFAULT_WIDTH = "280px"
const DEFAULT_MAX_WIDTH = themeValues.layout.maxWidth.md
// Short labels hug their text instead of filling a fixed-width box.
const COMPACT_WIDTH = "auto"
const COMPACT_MAX_WIDTH = themeValues.layout.maxWidth.sm

export interface HoverTipProps {
  /** The content to display in the hint */
  content: React.ReactNode
  /** The element that triggers the hint on hover */
  children: React.ReactElement
  /** Placement relative to the trigger (default: "top") */
  placement?: TooltipProps["placement"]
  /** Padding/text density: "compact" also hugs the label width (default: "default") */
  density?: TooltipDensity
  /** Surface width override */
  width?: string
  /** Surface max width override */
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
  density = "default",
  width,
  maxWidth,
  enterDelay = 200,
  leaveDelay = 100,
}: HoverTipProps) {
  const theme = useTheme()
  const isCompact = density === "compact"
  const resolvedWidth = width ?? (isCompact ? COMPACT_WIDTH : DEFAULT_WIDTH)
  const resolvedMaxWidth =
    maxWidth ?? (isCompact ? COMPACT_MAX_WIDTH : DEFAULT_MAX_WIDTH)

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
          // The "default" look (background, border, radius, shadow, padding)
          // comes from the theme's MuiTooltip override. Only layer on a surface
          // when the density differs, plus the width overrides.
          sx: (t: Theme) => ({
            ...(density !== "default" ? tooltipSurface(t, { density }) : {}),
            width: resolvedWidth,
            maxWidth: resolvedMaxWidth,
          }),
        },
      }}
    >
      {children}
    </Tooltip>
  )
}

export default HoverTip
