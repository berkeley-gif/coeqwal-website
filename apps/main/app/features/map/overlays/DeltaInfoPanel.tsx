/**
 * DeltaInfoPanel (Learn Map)
 *
 * Provides information about the Sacramento-San Joaquin River Delta.
 * When clicked, zooms to the Delta and shows the delta-water layer.
 */

import { useState } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import type { MapOperationsAPI } from "@repo/map"
import {
  ANIMATION_DURATION,
  EASING,
} from "../choreography/scrollChoreographyConstants"

interface DeltaInfoPanelProps {
  /** Map operations API for camera control */
  map: MapOperationsAPI
}

// Delta view coordinates
const DELTA_VIEW = {
  center: [-121.8, 38.1] as [number, number],
  zoom: 9.75,
  bearing: 0,
  pitch: 0,
}

// Delta water layer ID (Mapbox tileset: coeqwal.delta-water)
const DELTA_WATER_LAYER = "delta-water"

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

    // Show and fade in delta-water layer
    if (map.mapRef?.current) {
      try {
        const mapInstance = map.mapRef.current.getMap()
        if (mapInstance.getLayer(DELTA_WATER_LAYER)) {
          // Make visible
          mapInstance.setLayoutProperty(
            DELTA_WATER_LAYER,
            "visibility",
            "visible",
          )

          // Animate opacity from 0 to 0.9
          const targetOpacity = 0.9
          const duration = ANIMATION_DURATION.EASE
          const startTime = performance.now()

          const animateOpacity = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
            const opacity = Math.max(
              0,
              Math.min(targetOpacity, eased * targetOpacity),
            )

            try {
              mapInstance.setPaintProperty(
                DELTA_WATER_LAYER,
                "fill-opacity",
                opacity,
              )
            } catch {
              // Layer might not support this property
            }

            if (progress < 1) {
              requestAnimationFrame(animateOpacity)
            }
          }

          // Start from 0 opacity
          mapInstance.setPaintProperty(DELTA_WATER_LAYER, "fill-opacity", 0)
          requestAnimationFrame(animateOpacity)
        }
      } catch {
        // Silently fail if delta-water layer doesn't exist
      }
    }
  }

  return (
    <Box
      sx={{
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 0,
        padding: { xs: 2, sm: 2.5, md: 3 },
        boxShadow: theme.shadow.sm,
        width: "100%",
        boxSizing: "border-box",
        pointerEvents: "auto", // Ensure panel is interactive
      }}
    >
      <Typography
        variant="body1"
        sx={{ mb: 2, color: theme.palette.grey[900] }}
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
          The Sacramento–San Joaquin Delta (also called the Bay-Delta) is the
          unique ecosystem of low-lying channels, islands, and wetlands where
          the Sacramento and San Joaquin rivers meet and flow out to the Bay.
          Here river water mixes with salty tides from the Bay. Pumps and canals
          move water from the Delta to cities and farms to the south.
        </Typography>
      )}
    </Box>
  )
}
