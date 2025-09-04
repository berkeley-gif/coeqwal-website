import { Box, useTheme } from "@repo/ui/mui"
import { FloatingAmbientCircles } from "./FloatingAmbientCircles"
import { FloatingImageMarkers } from "./FloatingImageMarkers"
import { ambientCircles } from "../config/ambientCircles"
import { floatingMarkers } from "../config/floatingMarkers"

interface ClusteredImageCirclesProps {
  /** Z-index for layering */
  zIndex?: number
  /** Whether to show the floating image markers */
  showImageMarkers?: boolean
  /** Whether to show the ambient circles */
  showAmbientCircles?: boolean
}

/**
 * Clustered image circles system with ambient circles and floating image markers
 * Extracted from IntroSection for reuse in other panels
 */
export function ClusteredImageCircles({
  zIndex,
  showImageMarkers = true,
  showAmbientCircles = true,
}: ClusteredImageCirclesProps) {
  const theme = useTheme()

  return (
    <>
      {/* Ambient background circles */}
      {showAmbientCircles && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: { xs: 0, md: "26%" },
            zIndex: zIndex || theme.zIndex.introBackgroundImages,
            pointerEvents: "none",
          }}
        >
          <FloatingAmbientCircles circles={ambientCircles} zIndex={1} />
        </Box>
      )}

      {/* Floating image markers */}
      {showImageMarkers && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: { xs: 0, md: "26%" },
            zIndex: zIndex || theme.zIndex.introForegroundImages,
            pointerEvents: "none",
            transformOrigin: "top right",
            willChange: "transform",
          }}
        >
          <FloatingImageMarkers
            markers={floatingMarkers}
            showHalos={true}
            zIndex={1}
          />
        </Box>
      )}
    </>
  )
}
