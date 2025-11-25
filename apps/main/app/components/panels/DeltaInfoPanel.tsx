/**
 * DeltaInfoPanel - Interactive Delta Information Component
 * 
 * Provides information about the Sacramento-San Joaquin River Delta.
 * When clicked, zooms to the Delta and shows the water layer.
 */

import { useState } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import type { MapOperationsAPI } from "@repo/map"
import { ANIMATION_DURATION, EASING } from "../../constants/scrollChoreographyConstants"

interface DeltaInfoPanelProps {
  /** Map operations API for camera control */
  map: MapOperationsAPI
}

// Delta view coordinates
const DELTA_VIEW = {
  center: [-121.5, 38] as [number, number],
  zoom: 9.25,
  bearing: 0,
  pitch: 0,
}

export function DeltaInfoPanel({ map }: DeltaInfoPanelProps) {
  const theme = useTheme()
  const [isTextVisible, setIsTextVisible] = useState(false)

  const handleViewDelta = () => {
    setIsTextVisible(true)

    // Zoom to Delta
    if (map.mapRef?.current) {
      map.mapRef.current.easeTo({
        center: DELTA_VIEW.center,
        zoom: DELTA_VIEW.zoom,
        bearing: DELTA_VIEW.bearing,
        pitch: DELTA_VIEW.pitch,
        duration: ANIMATION_DURATION.EASE,
        easing: EASING.EASE_OUT,
      })
    }

    // Show and fade in water layer
    if (map.mapRef?.current) {
      try {
        const mapInstance = map.mapRef.current.getMap()
        if (mapInstance.getLayer("water")) {
          // Make visible
          mapInstance.setLayoutProperty("water", "visibility", "visible")
          
          // Animate opacity from 0 to 1
          const duration = ANIMATION_DURATION.EASE
          const startTime = performance.now()
          
          const animateOpacity = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
            const opacity = Math.max(0, Math.min(1, eased)) // Clamp between 0 and 1
            
            try {
              mapInstance.setPaintProperty("water", "fill-opacity", opacity)
            } catch {
              // Layer might not support this property
            }
            
            if (progress < 1) {
              requestAnimationFrame(animateOpacity)
            }
          }
          
          // Start from 0 opacity
          mapInstance.setPaintProperty("water", "fill-opacity", 0)
          requestAnimationFrame(animateOpacity)
        }
      } catch {
        // Silently fail if water layer doesn't exist
      }
    }
  }

  return (
    <Box
      sx={{
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 0,
        padding: { xs: 2, sm: 2.5, md: 3 },
        boxShadow: theme.shadows[2],
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: 600,
          color: theme.palette.text.primary,
          textAlign: "left",
        }}
      >
        What and where is &quot;The Delta&quot;?
      </Typography>

      <Box
        component="button"
        onClick={handleViewDelta}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: theme.palette.blue.medium,
          fontFamily: theme.typography.fontFamily,
          fontSize: "1rem",
          fontWeight: 500,
          textDecoration: "none",
          textAlign: "left",
          transition: "color 0.2s ease",
          "&:hover": {
            color: theme.palette.blue.bright,
            textDecoration: "underline",
          },
        }}
      >
        <span>Go to the Sacramento-San Joaquin River Delta</span>
        <span style={{ fontSize: "1.2em" }}>→</span>
      </Box>

      {isTextVisible && (
        <Typography
          variant="body2"
          sx={{
            mt: 2,
            lineHeight: 1.6,
            textAlign: "left",
          }}
        >
          The Sacramento–San Joaquin Delta (also known as the Bay-Delta) is the unique ecosystem of
          low-lying waterways and islands where the Sacramento and San Joaquin
          rivers meet, roughly between Sacramento, Stockton, and Antioch. Here
          river water mixes with salty incoming tides from San Francisco Bay.
          Pumps and canals send water from the Delta to cities and farms across
          the state.
        </Typography>
      )}
    </Box>
  )
}

