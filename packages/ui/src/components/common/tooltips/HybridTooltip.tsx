"use client"

/**
 * HybridTooltip - Hover on desktop, tap-to-open on touch.
 *
 * Renders HoverTip on pointer devices and InfoPopover on touch screens, so
 * styling and positioning come from those two. Use it when hover suits desktop
 * but touch users need an explicit tap.
 */

import React from "react"
import { useMediaQuery } from "../../.."
import type { TooltipProps } from "@mui/material"
import { HoverTip } from "./HoverTip"
import { InfoPopover } from "./InfoPopover"
import type { TooltipDensity } from "./tooltipSurface"

export interface HybridTooltipProps {
  /** The content to display in the tooltip */
  content: React.ReactNode
  /** The child element that triggers the tooltip */
  children: React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
  /** Tooltip placement */
  placement?: TooltipProps["placement"]
  /** Custom width override */
  width?: string
  /** Custom max width override */
  maxWidth?: string
  /** Padding/text density, applied to both the desktop and touch renderings */
  density?: TooltipDensity
}

export function HybridTooltip({
  content,
  children,
  placement = "top",
  width,
  maxWidth,
  density = "default",
}: HybridTooltipProps) {
  const isTouchDevice = useMediaQuery("(pointer: coarse)")

  if (isTouchDevice) {
    return (
      <InfoPopover
        content={content}
        placement={placement}
        width={width}
        maxWidth={maxWidth}
        density={density}
      >
        {children}
      </InfoPopover>
    )
  }

  return (
    <HoverTip
      content={content}
      placement={placement}
      width={width}
      maxWidth={maxWidth}
      density={density}
    >
      {children}
    </HoverTip>
  )
}

export default HybridTooltip
