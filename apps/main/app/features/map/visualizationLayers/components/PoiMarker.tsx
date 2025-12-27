"use client"

/**
 * PoiMarker - reusable map marker for highlighting points of interest
 *
 * Used for geocoder results, search highlights, selected locations, etc.
 */

import { Marker } from "@repo/map"
import { Box, useTheme } from "@repo/ui/mui"

interface PoiMarkerProps {
  coordinates: [number, number] // [longitude, latitude]
  icon?: string // Default: "📍"
  size?: number // Default: 48
}

export function PoiMarker({
  coordinates,
  icon = "📍",
  size = 48,
}: PoiMarkerProps) {
  const theme = useTheme()
  const [longitude, latitude] = coordinates

  // Scale font size relative to marker size
  const fontSize = Math.round(size * 0.58)

  return (
    <Marker longitude={longitude} latitude={latitude} anchor="center">
      <Box
        sx={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: theme.borderRadius.circle,
          backgroundColor: theme.background.whiteOverlay[50],
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: theme.shadow.md,
          fontSize: `${fontSize}px`,
          lineHeight: 1,
        }}
      >
        {icon}
      </Box>
    </Marker>
  )
}

export default PoiMarker
