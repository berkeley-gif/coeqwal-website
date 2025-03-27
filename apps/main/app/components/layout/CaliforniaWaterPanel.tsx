"use client"

import React, {
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react"
import { Typography, Container, Box } from "@mui/material"
import { useTheme, Theme } from "@mui/material/styles"
import { useTranslation } from "@repo/i18n"
import VisibilityIcon from "@mui/icons-material/Visibility"
import { paragraphMapViews, breakpointViews } from "../../../lib/mapViews"
import { useMap } from "../../context/MapContext"
import { LearnMoreButton } from "@repo/ui/learnMoreButton"
import { usePrecipitationAnimation } from "../../hooks/usePrecipitationAnimation"
import { useBreakpointKey } from "../../hooks/useResponsiveView"

// TODO: Mapbox typing
// Mapbox API typings require 'any' in some places due to dynamic property values?
interface CaliforniaWaterPanelProps {
  onLearnMoreClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  setShowAquiferToggle: React.Dispatch<React.SetStateAction<boolean>>
  setIsAquiferVisible: React.Dispatch<React.SetStateAction<boolean>>
}

const CaliforniaWaterPanel = forwardRef<
  HTMLDivElement,
  CaliforniaWaterPanelProps
>(function CaliforniaWaterPanel(
  { onLearnMoreClick, setShowAquiferToggle, setIsAquiferVisible },
  ref,
) {
  const theme = useTheme<Theme>()
  const { t, isLoading, messages } = useTranslation()
  const { flyTo, mapRef, isMapLoaded } = useMap()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [clientReady, setClientReady] = useState(false)
  const [pendingRainLayer, setPendingRainLayer] = useState(false)
  const breakpointKey = useBreakpointKey()

  // const { addGroundwaterLayer, fadeInGroundwaterLayer } =
  //   useGroundwaterBasinsLayer()

  useEffect(() => {
    setClientReady(true)
  }, [])

  // Restore the imperative handle for the forwarded ref
  useImperativeHandle(ref, () => {
    return panelRef.current as HTMLDivElement
  })

  const { animatePrecipitationBands } = usePrecipitationAnimation(
    mapRef,
    isMapLoaded,
  )

  // Simple intersection observer for background color change only
  useEffect(() => {
    const currentPanel = panelRef.current
    if (!currentPanel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting
        setIsVisible(isIntersecting)

        // Direct style manipulation works better than React state for this transition
        if (currentPanel) {
          currentPanel.style.backgroundColor = isIntersecting
            ? "transparent"
            : theme.palette.secondary.main
        }
      },
      { threshold: [0.1] },
    )

    observer.observe(currentPanel)
    return () => {
      if (currentPanel) {
        observer.unobserve(currentPanel)
      }
    }
  }, [theme.palette.secondary.main])

  const createRainLayer = useCallback(() => {
    if (!mapRef.current || !isMapLoaded) return

    // Helper function for linear interpolation
    const lerp = (start: number, end: number, progress: number) => {
      return start + (end - start) * progress
    }

    // Helper function for array interpolation
    const lerpArray = (
      start: [number, number],
      end: [number, number],
      progress: number,
    ) => {
      return [
        lerp(start[0], end[0], progress),
        lerp(start[1], end[1], progress),
      ] as [number, number]
    }

    mapRef.current.withMap((mapboxMap) => {
      const map = mapboxMap.getMap() as mapboxgl.Map

      // Pre-load tiles to reduce pop during transitions
      try {
        // Force the map to load tiles in the current view
        map.triggerRepaint()
      } catch {
        // Ignore errors
      }

      // Add groundwater basins layer with 0 opacity (will be faded in later)
      // addGroundwaterLayer(map)

      // Rain settings and animation code remains the same
      const initialRainSettings = {
        density: 0.1,
        intensity: 0.2,
        color: "#a8adbc",
        opacity: 0.3,
        direction: [0, 80] as [number, number],
        "droplet-size": [1.0, 8.0] as [number, number],
        "distortion-strength": 0.3,
        "center-thinning": 0,
      }

      // Final rain settings
      const finalRainSettings = {
        density: 0.5,
        intensity: 1.0,
        color: "#a8adbc",
        opacity: 0.7,
        direction: [0, 80] as [number, number],
        "droplet-size": [2.6, 18.2] as [number, number],
        "distortion-strength": 0.7,
        "center-thinning": 0,
      }

      // Set initial rain effect
      map.setRain(initialRainSettings)
      console.log("Rain effect started with mild intensity")

      // Animation parameters
      const duration = 5000
      const groundwaterDelay = duration
      const startTime = performance.now()

      // Set a timeout to clean up effects after 12 seconds
      const effectDuration = 12000 // 12 seconds
      setTimeout(() => {
        console.log(
          "Cleaning up effects and returning to initial view with aquifer toggle off",
        )

        // Clean up effects and fade out groundwater layer
        mapRef.current?.withMap((mapboxMap) => {
          const map = mapboxMap.getMap() as mapboxgl.Map

          // 1. Turn off rain effect
          map.setRain(null)

          // 2. Fade out groundwater layer with animation
          try {
            if (map.getLayer("groundwater-basins-layer")) {
              // Get current opacity for smooth transition
              const currentOpacity =
                (map.getPaintProperty(
                  "groundwater-basins-layer",
                  "fill-opacity",
                ) as number) || 0.6
              const startTime = performance.now()
              const fadeDuration = 1000 // 1 second fade

              // Set toggle state to off
              setIsAquiferVisible(false)

              function fadeOut(time: number) {
                const elapsed = time - startTime
                const progress = Math.min(elapsed / fadeDuration, 1)
                const newOpacity = currentOpacity * (1 - progress)

                if (map.getLayer("groundwater-basins-layer")) {
                  map.setPaintProperty(
                    "groundwater-basins-layer",
                    "fill-opacity",
                    newOpacity,
                  )

                  if (progress < 1) {
                    requestAnimationFrame(fadeOut)
                  }
                }
              }

              requestAnimationFrame(fadeOut)
            }
          } catch {
            // Ignore if layer doesn't exist
          }
        })

        // Reset to original view while keeping the aquifer toggle available
        const originalView = breakpointViews[breakpointKey]
        flyTo(
          originalView.longitude,
          originalView.latitude,
          originalView.zoom,
          originalView.pitch,
          originalView.bearing,
        )
      }, effectDuration)

      // Flag to track if groundwater fade has started
      let groundwaterFadeStarted = false

      // Create animation function for rain intensity only (remove terrain fade)
      function animate(time: number) {
        const elapsed = time - startTime
        const rainProgress = Math.min(elapsed / duration, 1)

        // Use a smooth easing function for the rain intensity
        const easedRainProgress =
          rainProgress < 0.5
            ? 2 * rainProgress * rainProgress
            : 1 - Math.pow(-2 * rainProgress + 2, 2) / 2

        // Update rain settings
        const currentRainSettings = {
          density: lerp(
            initialRainSettings.density,
            finalRainSettings.density,
            easedRainProgress,
          ),
          intensity: lerp(
            initialRainSettings.intensity,
            finalRainSettings.intensity,
            easedRainProgress,
          ),
          color: initialRainSettings.color,
          opacity: lerp(
            initialRainSettings.opacity,
            finalRainSettings.opacity,
            easedRainProgress,
          ),
          direction: initialRainSettings.direction,
          "droplet-size": lerpArray(
            initialRainSettings["droplet-size"],
            finalRainSettings["droplet-size"],
            easedRainProgress,
          ),
          "distortion-strength": lerp(
            initialRainSettings["distortion-strength"],
            finalRainSettings["distortion-strength"],
            easedRainProgress,
          ),
          "center-thinning": 0,
        }

        // Apply updated rain settings
        if (mapRef.current) {
          mapRef.current.withMap((mbMap) => {
            mbMap.getMap().setRain(currentRainSettings)
          })
        }

        // Start groundwater fade-in based on elapsed time
        if (elapsed >= groundwaterDelay && !groundwaterFadeStarted) {
          groundwaterFadeStarted = true
          if (mapRef.current) {
            mapRef.current.withMap(() => {
              // Start the groundwater fade-in
              // fadeInGroundwaterLayer(mbMap.getMap(), 0.6, 3000)

              // Show the aquifer toggle control and set it to visible
              setShowAquiferToggle(true)
              setIsAquiferVisible(true)
            })
          }
        }

        // Continue animation if not complete
        if (rainProgress < 1) {
          requestAnimationFrame(animate)
        } else {
          console.log("Rain animation complete")
        }
      }

      // Start the animation
      requestAnimationFrame(animate)
    })
  }, [
    mapRef,
    isMapLoaded,
    // addGroundwaterLayer,
    // fadeInGroundwaterLayer,
    flyTo,
    breakpointKey,
    setShowAquiferToggle,
    setIsAquiferVisible,
  ])

  useEffect(() => {
    if (!pendingRainLayer || !mapRef.current || !isMapLoaded) return

    // Store current ref to avoid stale closure in cleanup
    const currentMapRef = mapRef.current

    const handleMoveEnd = () => {
      // Start rain effect after the map transition completes
      createRainLayer()
      // Reset the pending state
      setPendingRainLayer(false)
    }

    currentMapRef.withMap((mapboxMap) => {
      const map = mapboxMap.getMap() as mapboxgl.Map
      map.once("moveend", handleMoveEnd)
    })

    return () => {
      currentMapRef.withMap((mapboxMap) => {
        const map = mapboxMap.getMap() as mapboxgl.Map
        map.off("moveend", handleMoveEnd)
      })
    }
  }, [pendingRainLayer, mapRef, isMapLoaded, createRainLayer])

  // Now update the handleVisibilityClick function to clean up effects first
  const handleVisibilityClick = useCallback(
    (paragraphIndex: number) => {
      // Always clean up previous effects
      if (mapRef.current && isMapLoaded) {
        mapRef.current.withMap((mapboxMap) => {
          const map = mapboxMap.getMap() as mapboxgl.Map
          // Turn off rain effect
          map.setRain(null)
        })
      }

      if (paragraphIndex === 0) {
        // For the first paragraph, reset to the original view first
        // This ensures the animation starts from a consistent position
        const originalView = breakpointViews[breakpointKey]

        // Check if map exists
        if (!mapRef.current || !isMapLoaded) {
          return
        }

        // Check if we're already at the target view
        let isAlreadyAtTargetView = false

        mapRef.current.withMap((mapboxMap) => {
          const map = mapboxMap.getMap() as mapboxgl.Map
          const center = map.getCenter()
          const currentZoom = map.getZoom()

          // Check if current view is very close to target view (with some tolerance)
          const positionTolerance = 0.01 // ~1km
          const zoomTolerance = 0.1 // 0.1 zoom level

          isAlreadyAtTargetView =
            Math.abs(center.lng - originalView.longitude) < positionTolerance &&
            Math.abs(center.lat - originalView.latitude) < positionTolerance &&
            Math.abs(currentZoom - originalView.zoom) < zoomTolerance
        })

        // If already at view, trigger animation directly
        if (isAlreadyAtTargetView) {
          animatePrecipitationBands()
          return
        }

        // Use flyTo to return to original view before starting animation
        flyTo(
          originalView.longitude,
          originalView.latitude,
          originalView.zoom,
          originalView.pitch,
          originalView.bearing,
        )

        // Wait for the map movement to complete before starting animation
        mapRef.current.withMap((mapboxMap) => {
          const map = mapboxMap.getMap() as mapboxgl.Map
          // Listen for the moveend event to start animation after map has moved
          map.once("moveend", () => {
            animatePrecipitationBands()
          })
        })
      } else {
        const coords = paragraphMapViews[paragraphIndex][breakpointKey]

        // Check if this is the last paragraph to trigger rain layer
        if (paragraphIndex === paragraphMapViews.length - 1) {
          setPendingRainLayer(true)
        }

        // Only perform the flyTo animation
        flyTo(
          coords.longitude,
          coords.latitude,
          coords.zoom,
          coords.pitch,
          coords.bearing,
        )
      }
    },
    [
      animatePrecipitationBands,
      flyTo,
      breakpointKey,
      setPendingRainLayer,
      mapRef,
      isMapLoaded,
    ],
  )

  let paragraphKeys: string[] = []

  if (!isLoading) {
    try {
      const californiaWaterPanel = messages.CaliforniaWaterPanel
      if (
        californiaWaterPanel &&
        typeof californiaWaterPanel === "object" &&
        "paragraphs" in californiaWaterPanel
      ) {
        const paragraphs = californiaWaterPanel.paragraphs
        if (paragraphs && typeof paragraphs === "object") {
          paragraphKeys = Object.keys(paragraphs)
        }
      }
    } catch (error) {
      console.error("Error accessing paragraph keys:", error)
    }
  }

  const handleLearnMoreClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onLearnMoreClick(event)
    },
    [onLearnMoreClick],
  )

  return (
    <Container
      ref={(el) => {
        panelRef.current = el
      }}
      sx={{
        backgroundColor: isVisible
          ? "transparent"
          : theme.palette.secondary.main,
        transition: "background-color 3s ease-in-out",
        minHeight: "100vh",
        pointerEvents: "none",
        "& .MuiButton-root, & .MuiSvgIcon-root": {
          pointerEvents: "auto",
        },
      }}
      role="main"
    >
      {!clientReady ? (
        <Box style={{ minHeight: 200 }} />
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: { xs: 2, lg: 16 },
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          }}
        >
          <Box
            sx={{
              marginTop: "150px",
            }}
          >
            <Typography
              variant="h1"
              sx={{ whiteSpace: { xs: "normal", md: "pre-wrap" } }}
              gutterBottom
            >
              {t("CaliforniaWaterPanel.title")}
            </Typography>

            {paragraphKeys.map((key, i) => (
              <Box
                key={i}
                sx={{
                  position: "relative",
                  p: 1,
                  pl: 2,
                  borderRadius: 1,
                  mb: 1,
                  cursor: "pointer",
                  transition: "background-color 0.3s ease",
                  pointerEvents: "auto",
                  "&:hover": {
                    backgroundColor: "rgba(21, 79, 137, 0.7)",
                  },
                  "&:hover .MuiSvgIcon-root": {
                    color: theme.palette.primary.light,
                    transform: "scale(1.2)",
                  },
                }}
                onClick={() => handleVisibilityClick(i)}
                role="button"
                aria-label={`View map for paragraph ${i + 1}`}
              >
                <Typography variant="body1" sx={{ mb: 0, lineHeight: 1.4 }}>
                  {t(`CaliforniaWaterPanel.paragraphs.${key}`)}
                  <VisibilityIcon
                    sx={{
                      ml: 1,
                      transition: "transform 0.2s ease, color 0.2s ease",
                      verticalAlign: "middle",
                    }}
                    aria-hidden="true"
                  />
                </Typography>
              </Box>
            ))}
            <LearnMoreButton onClick={handleLearnMoreClick} />
          </Box>
        </Box>
      )}
    </Container>
  )
})

export default CaliforniaWaterPanel
