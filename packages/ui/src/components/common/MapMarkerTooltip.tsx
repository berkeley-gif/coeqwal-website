"use client"

/**
 * MapMarkerTooltip - Tooltip for map marker hover states
 *
 * Displays descriptive text when hovering over map markers.
 * Wraps BaseTooltip with map-specific styling.
 */

import React from "react"
import { Box } from "../.."
import { BaseTooltip } from "./BaseTooltip"
import type { BaseTooltipProps } from "./BaseTooltip"

export interface MapMarkerTooltipProps extends Omit<BaseTooltipProps, "title"> {
  /** The descriptive text for the tooltip */
  text: string
  /** The color of the status indicator bullet point */
  statusColor: string
  /** Optional placement override - defaults to "top" for map markers */
  placement?: BaseTooltipProps["placement"]
}

/**
 * A specialized tooltip component for map markers that includes a color-coded
 * status indicator bullet point and descriptive text.
 *
 * Extends BaseTooltip for consistent theming and behavior.
 */
export function MapMarkerTooltip({
  text,
  statusColor,
  children,
  placement = "top",
  tooltipProps = {},
}: MapMarkerTooltipProps) {
  const title = (
    // Use semantic gap.sm (8px) for tight spacing between bullet and text
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: (theme) => theme.spacingTokens.gap.sm }}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: statusColor,
          flexShrink: 0,
          // Center the bullet with the first line of text
          marginTop: "0.4rem", // Approximately centers with first line based on line-height
        }}
      />
      {text}
    </Box>
  )

  return (
    <BaseTooltip
      title={title}
      placement={placement}
      tooltipProps={tooltipProps}
    >
      {children}
    </BaseTooltip>
  )
}

export default MapMarkerTooltip
