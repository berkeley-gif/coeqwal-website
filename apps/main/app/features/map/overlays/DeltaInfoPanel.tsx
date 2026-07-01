"use client"

/**
 * DeltaInfoPanel (Learn map)
 *
 * Provides information about the Sacramento-San Joaquin River Delta.
 * When clicked, zooms to the Delta and shows the delta-water layer.
 *
 */

import { useState } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import type { MapOperationsAPI } from "@repo/map"
import {
  ANIMATION_DURATION,
  EASING,
} from "../choreography/scrollChoreographyConstants"
import { DELTA_VIEW } from "../config/cameraPresets"

interface DeltaInfoPanelProps {
  /** Map operations API for camera control */
  map: MapOperationsAPI
}

// Runtime layers showing the DETAW polygon from the WBA/geoschem source
const DELTA_FILL_LAYER = "delta-detaw"
const DELTA_OUTLINE_LAYER = "delta-detaw-outline"

export function DeltaInfoPanel({ map }: DeltaInfoPanelProps) {
  const theme = useTheme()
  const [isTextVisible, setIsTextVisible] = useState(false)

  const handleViewDelta = () => {
    setIsTextVisible(true)

    // Zoom to Delta
    if (map.mapRef?.current) {
      map.mapRef.current.easeTo({
        center: [DELTA_VIEW.longitude, DELTA_VIEW.latitude],
        zoom: DELTA_VIEW.zoom,
        bearing: DELTA_VIEW.bearing,
        pitch: DELTA_VIEW.pitch,
        duration: ANIMATION_DURATION.EASE,
        easing: EASING.EASE_OUT,
      })
    }

    // Show and fade in the delta outline (fill stays transparent)
    if (map.mapRef?.current) {
      try {
        const mapInstance = map.mapRef.current.getMap()

        // Make fill layer visible (transparent, just for potential hover/click targets)
        if (mapInstance.getLayer(DELTA_FILL_LAYER)) {
          mapInstance.setLayoutProperty(
            DELTA_FILL_LAYER,
            "visibility",
            "visible",
          )
        }

        if (mapInstance.getLayer(DELTA_OUTLINE_LAYER)) {
          mapInstance.setLayoutProperty(
            DELTA_OUTLINE_LAYER,
            "visibility",
            "visible",
          )
          mapInstance.setPaintProperty(DELTA_OUTLINE_LAYER, "line-opacity", 0)

          const targetOpacity = 0.9
          const duration = ANIMATION_DURATION.EASE
          const startTime = performance.now()

          const animateOpacity = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            const opacity = Math.max(
              0,
              Math.min(targetOpacity, eased * targetOpacity),
            )

            try {
              mapInstance.setPaintProperty(
                DELTA_OUTLINE_LAYER,
                "line-opacity",
                opacity,
              )
            } catch {
              return
            }

            if (progress < 1) {
              requestAnimationFrame(animateOpacity)
            }
          }

          requestAnimationFrame(animateOpacity)
        }
      } catch {
        // Silently fail if layers don't exist yet
      }
    }
  }

  return (
    <Box
      sx={{
        backgroundColor: theme.background.whiteOverlay[95],
        borderRadius: theme.borderRadius.none,
        padding: theme.space.card.xs,
        boxShadow: theme.shadow.sm,
        pointerEvents: "auto",
      }}
    >
      <Typography
        variant="body1"
        sx={{ mb: theme.space.component.lg, color: theme.palette.grey[900] }}
      >
        What and where is &quot;The Delta&quot;?
      </Typography>

      <Box
        component="button"
        onClick={handleViewDelta}
        sx={{
          display: "flex",
          alignItems: "center",
          ...theme.typography.subtitle2,
          gap: theme.space.gap.sm,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: theme.palette.blue.medium,
          textDecoration: "none",
          transition: theme.transition.color,
          "&:hover": {
            color: theme.palette.blue.bright,
            textDecoration: "underline",
          },
        }}
      >
        <span>Go to the Sacramento-San Joaquin River Delta</span>
        <Typography component="span" variant="subtitle1">
          →
        </Typography>
      </Box>

      {isTextVisible && (
        <Typography
          variant="body2"
          sx={{
            mt: theme.space.component.lg,
          }}
        >
          The Sacramento–San Joaquin Delta (also called the Bay-Delta) is a
          unique ecosystem of low-lying islands, farms, and wetlands. Here river
          water mixes with salty tides from San Francisco Bay. Pumps and canals
          move water from the Delta to cities and farms to the south.
        </Typography>
      )}
    </Box>
  )
}
