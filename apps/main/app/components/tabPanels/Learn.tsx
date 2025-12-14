"use client"

/**
 * LearnPanel
 *
 * The Learn tab content with an integrated sticky map.
 *
 * Architecture:
 * - ScrollytellingContainer: Contains the sticky map + overlay content
 * - StickyMap: The map sticks to the viewport while scrolling through overlays
 * - OverlayPanels: Scroll over the sticky map, triggering section changes
 * - LearnMore: Comes after the container, no z-index battles
 *
 * The sticky approach means:
 * - Map scrolls away naturally when container ends
 * - Learn More section appears without layout hacks
 * - Clean document flow
 */

import { Suspense, useCallback, useRef, useEffect } from "react"
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  useTheme
} from "@repo/ui/mui"

import { LeadingMarkerText } from "@repo/ui"
import CaliforniaMapPanel from "../map/CaliforniaMapPanel"
import MapOverlayPanels from "../map/overlays/MapOverlayPanels"
import ProgressiveScenarioPanels from "../ProgressiveScenarioPanels"
import { useLearnMapStore, learnMapActions } from "../map/store"

export default function LearnPanel() {
  const setMapReady = useLearnMapStore((s) => s.setMapReady)
  const mapReady = useLearnMapStore((s) => s.mapReady)
  const mapReadyCalledRef = useRef(false)
  const theme = useTheme()

  const cardColor = theme.palette.blue.white

  // Reset state when component mounts (handles tab switching)
  useEffect(() => {
    // Reset to initial state on mount
    learnMapActions.resetForRemount()
    mapReadyCalledRef.current = false

    return () => {
      // Also reset on unmount to ensure clean state for next mount
      mapReadyCalledRef.current = false
    }
  }, [])

  // Handle map ready state
  const handleMapReady = useCallback(() => {
    if (mapReadyCalledRef.current) return
    mapReadyCalledRef.current = true
    setMapReady(true)
  }, [setMapReady])

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "#68C3CE", // Teal background covers any gaps
      }}
    >
      {/* 
        Scrollytelling Container
        This container holds the sticky map and scrolling overlays.
        Its height determines when the map stops being sticky.
      */}
      <Box
        sx={{
          position: "relative",
          // Container needs explicit height - the overlays define this via their content
        }}
      >
        {/* Sticky Map - sticks to viewport while scrolling through container */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            zIndex: 0,
          }}
        >
          <CaliforniaMapPanel id="california-map" onMapReady={handleMapReady} />
        </Box>

        {/* Overlay content - scrolls over the sticky map */}
        {/* Uses negative margin to overlap the sticky map area */}
        <Box
          sx={{
            position: "relative",
            marginTop: "-100vh", // Pull up to overlap the sticky map
            zIndex: 1,
            pointerEvents: "none", // Let map interactions through
            // Note: child components handle their own pointerEvents
            // MapOverlayPanels sets pointerEvents: "none" with "auto" on interactive elements
          }}
        >
          {mapReady ? (
            <Suspense fallback={null}>
              <MapOverlayPanels />
              <ProgressiveScenarioPanels />
            </Suspense>
          ) : (
            <Box
              sx={{
                height: "200vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "grey.500",
                flexDirection: "column",
                gap: 2,
                pointerEvents: "auto",
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "3px solid",
                  borderColor: "grey.300",
                  borderTopColor: "primary.main",
                  animation: "spin 1s linear infinite",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              />
              Loading map...
            </Box>
          )}
        </Box>
      </Box>

      {/* Learn More section - comes after the scrollytelling container naturally */}
      <Box
        sx={{
          backgroundColor: "#68C3CE", // Learn tab teal color
          padding: "60px",
          paddingBottom: "200px",
          marginBottom: "-100px",
        }}
      >
        <Box
          id="learnMoreContainer"
          sx={{
            display: "flex",
            alignItems: { sm: "flex-start", md: "center" },
            flexDirection: { sm: "column-reverse", lg: "row" },
            justifyContent: "center",
            gap: (theme) => theme.layout.spacing.sm,
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {/* Image column */}
          <Box
            sx={{
              minWidth: 0,
              display: "flex",
              justifyContent: "center",
              width: "30%",
            }}
          >
            <Box
              component="img"
              src="/images/content/learn.png"
              alt="Learn"
              sx={{ width: "100%", maxWidth: 520, height: "auto" }}
            />
          </Box>
          {/* Text column */}
          <Box id="textColumn" sx={{ width: "44%" }}>
            <LeadingMarkerText title="Learn More" circleColor="#66b479">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                  marginTop: "20px",
                }}
              >
                <Card
                  sx={{
                    backgroundColor: cardColor
                  }}
                  component="a"
                  href="https://flow.coeqwal.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <CardActionArea
                    sx={{
                      padding: "17px",
                    }}
                  >
                    <CardContent sx={{ height: '100%' }}>
                      <Typography variant="body1">
                        How water moves through California →
                      </Typography>

                    </CardContent>
                  </CardActionArea>
                </Card>
                <Card
                  component="a"
                  href="https://climate.coeqwal.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    backgroundColor: cardColor
                  }}
                >
                  <CardActionArea
                    sx={{
                      padding: "17px",
                    }}
                  >
                    <CardContent sx={{ height: '100%' }}>
                      <Typography variant="body1">
                        Climate change and California water →
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </div>
            </LeadingMarkerText>
          </Box>

        </Box>
      </Box>
    </div>
  )
}
