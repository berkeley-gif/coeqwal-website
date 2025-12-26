"use client"

/**
 * InfoTooltip - Tooltip with description and optional actions
 *
 * Device-adaptive tooltip: hover on desktop, click on touch devices.
 * Uses HybridTooltip internally for consistent cross-device behavior.
 *
 * ## When to Use
 *
 * Use InfoTooltip for contextual help with optional action buttons.
 * Best for: icon explanations with "Learn more" links, feature hints.
 *
 * @see HybridTooltip - The underlying device-adaptive component
 * @see ClickTooltip - For always click-to-open behavior
 */

import React from "react"
import { Box } from "../.."
import { HybridTooltip } from "./tooltips/HybridTooltip"
import type { HybridTooltipProps } from "./tooltips/HybridTooltip"

export interface InfoTooltipProps {
  /** The main description text */
  description: React.ReactNode
  /** Optional action buttons or additional content */
  actions?: React.ReactNode
  /** The child element that triggers the tooltip */
  children: HybridTooltipProps["children"]
  /** Optional placement override - defaults to "top" for info tooltips */
  placement?: HybridTooltipProps["placement"]
}

/**
 * Info tooltip component for displaying detailed information with optional actions.
 * Commonly used with info icons to provide contextual help and interactive elements.
 */
export function InfoTooltip({
  description,
  actions,
  children,
  placement = "top",
}: InfoTooltipProps) {
  const content = (
    <Box>
      <Box sx={{ mb: actions ? 1 : 0 }}>{description}</Box>
      {actions}
    </Box>
  )

  return (
    <HybridTooltip content={content} placement={placement}>
      {children}
    </HybridTooltip>
  )
}

export default InfoTooltip
