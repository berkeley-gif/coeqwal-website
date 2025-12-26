"use client"

/**
 * MapMarkerTooltip - Tooltip for map marker hover states
 *
 * Device-adaptive tooltip: hover on desktop, click on touch devices.
 * Uses HybridTooltip internally with map-specific styling
 *
 * ## When to Use
 *
 * Use MapMarkerTooltip for map markers that need tooltips with
 * a status color indicator. Best for: tier indicators, status markers.
 *
 * For polygon/shape tooltips on maps, use PolygonLayerTooltip instead
 * (which uses Mapbox Popup for proper geo-positioning).
 *
 * @see PolygonLayerTooltip - For map polygon features (uses Mapbox Popup)
 * @see HybridTooltip - The underlying device-adaptive component
 */

import React from "react"
import { Box } from "../.."
import { HybridTooltip } from "./tooltips/HybridTooltip"
import type { HybridTooltipProps } from "./tooltips/HybridTooltip"

export interface MapMarkerTooltipProps {
  /** The descriptive text for the tooltip */
  text: string
  /** The color of the status indicator bullet point */
  statusColor: string
  /** The child element that triggers the tooltip */
  children: HybridTooltipProps["children"]
  /** Optional placement override - defaults to "top" for map markers */
  placement?: HybridTooltipProps["placement"]
}

/**
 * A specialized tooltip component for map markers that includes a color-coded
 * status indicator bullet point and descriptive text.
 */
export function MapMarkerTooltip({
  text,
  statusColor,
  children,
  placement = "top",
}: MapMarkerTooltipProps) {
  const content = (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: (theme) => theme.spacingTokens.gap.sm }}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: statusColor,
          flexShrink: 0,
          marginTop: "0.4rem",
        }}
      />
      {text}
    </Box>
  )

  return (
    <HybridTooltip content={content} placement={placement}>
      {children}
    </HybridTooltip>
  )
}

export default MapMarkerTooltip
