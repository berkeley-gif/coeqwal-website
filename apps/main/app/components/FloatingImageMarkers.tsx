"use client"

import { Box } from "@repo/ui/mui"
import { motion } from "@repo/motion"
import { generateFloatingAnimation } from "../utils/floatingAnimation"

interface ImageMarker {
  id: string
  imageSrc: string
  imageSize: number // in vw units
  top: string
  left: string
  /** Optional z-index override for specific markers */
  zIndex?: number
}

interface FloatingImageMarkersProps {
  markers: ImageMarker[]
  /** Base z-index for the marker container */
  zIndex?: number
  /** Enable halos around images */
  showHalos?: boolean
  /** Halo color */
  haloColor?: string
}

/**
 * Renders floating image markers with optional halos and animation
 * Each marker consists of a circular image with a proportional halo behind it
 */
export function FloatingImageMarkers({
  markers,
  zIndex = 3,
  showHalos = true,
  haloColor = "rgba(42, 82, 135, 0.2)",
}: FloatingImageMarkersProps) {
  // Calculate halo dimensions based on image size
  // Largest image (18vw) gets 2vw halo, others get proportional amount
  const getHaloDimensions = (imageSize: number) => {
    const haloSize = (imageSize / 18) * 2 // Proportional to largest image
    const offset = -(haloSize / 2)
    
    return {
      width: `calc(${imageSize}vw + ${haloSize}vw)`,
      height: `calc(${imageSize}vw + ${haloSize}vw)`,
      top: `${offset}vw`,
      left: `${offset}vw`,
    }
  }

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        zIndex,
        pointerEvents: "none",
      }}
    >
      {markers.map((marker) => {
        const haloDimensions = getHaloDimensions(marker.imageSize)
        const markerZIndex = marker.zIndex ? zIndex + marker.zIndex : zIndex

        return (
          <Box
            key={marker.id}
            component={motion.div}
            {...generateFloatingAnimation(marker.imageSize)}
            sx={{
              position: "absolute",
              top: marker.top,
              left: marker.left,
              zIndex: markerZIndex,
            }}
          >
            {/* Halo circle behind image */}
            {showHalos && (
              <Box
                sx={{
                  position: "absolute",
                  width: haloDimensions.width,
                  height: haloDimensions.height,
                  top: haloDimensions.top,
                  left: haloDimensions.left,
                  borderRadius: "50%",
                  backgroundColor: haloColor,
                  zIndex: -1,
                }}
              />
            )}
            
            {/* Circular image */}
            <Box
              component="img"
              src={marker.imageSrc}
              alt={`Floating marker ${marker.id}`}
              sx={{
                width: `${marker.imageSize}vw`,
                height: `${marker.imageSize}vw`,
                borderRadius: "50%",
                display: "block",
              }}
            />
          </Box>
        )
      })}
    </Box>
  )
}
