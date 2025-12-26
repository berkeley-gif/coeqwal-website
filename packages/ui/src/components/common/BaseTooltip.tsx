"use client"

/**
 * BaseTooltip - Foundation tooltip component
 *
 * Wraps MUI Tooltip with consistent styling and behavior.
 * Extended by InfoTooltip and MapMarkerTooltip.
 */

import React from "react"
import { Tooltip } from "../.."
import type { TooltipProps } from "@mui/material"

export interface BaseTooltipProps {
  /** The content to display in the tooltip */
  title: React.ReactNode
  /** The child element that triggers the tooltip */
  children: React.ReactElement
  /** Optional tooltip placement */
  placement?: TooltipProps["placement"]
  /** Optional additional tooltip props */
  tooltipProps?: Partial<TooltipProps>
}

/**
 * Base tooltip component that wraps the themed MUI Tooltip.
 * This serves as the foundation for all specialized tooltip components
 * and ensures consistent theming across the application.
 *
 * Use this directly for simple tooltips, or extend it for specialized use cases.
 */
export function BaseTooltip({
  title,
  children,
  placement = "top",
  tooltipProps = {},
}: BaseTooltipProps) {
  return (
    <Tooltip title={title} arrow placement={placement} {...tooltipProps}>
      {children}
    </Tooltip>
  )
}

export default BaseTooltip
