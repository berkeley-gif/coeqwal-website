"use client"

/**
 * LearnPanel
 *
 * The Learn tab content that uses the persistent map from page level.
 *
 * Architecture:
 * - Calls setMapMode('learn') on mount to configure the persistent map
 * - The actual map lives in PersistentMap at the page level
 * - Overlay content scrolls over the persistent map
 * - Map "releases" from fixed position when scrollytelling ends
 * - Footer comes after the map section naturally
 *
 * The persistent map approach means:
 * - No map remounting when switching tabs
 * - WebGL context stays alive (performance)
 * - Map is preloaded during IntroSection scroll
 */

import { Suspense, useEffect, useRef, useCallback } from "react"
import { Box, useTheme } from "@repo/ui/mui"
import { LeadingMarkerText } from "@repo/ui"
import MapOverlayPanels from "../../features/map/overlays/MapOverlayPanels"
import ProgressiveScenarioPanels from "../ProgressiveScenarioPanels"
import { useMapReady, learnMapActions } from "../../features/map/store"

export default function LearnPanel() {
  const mapReady = useMapReady()
  const theme = useTheme()
  const scrollytellingRef = useRef<HTMLDivElement>(null)

  // Set map mode to 'learn' on mount, reset to 'hidden' on unmount
  useEffect(() => {
    // Reset Learn-specific state and activate Learn mode
    learnMapActions.resetLearnState()
    learnMapActions.setMapMode("learn")

    return () => {
      // Hide the map when leaving Learn tab
      learnMapActions.setMapMode("hidden")
      learnMapActions.setLearnMapScrollOffset(0)
    }
  }, [])

  // Track scroll to "release" the map when scrollytelling ends
  const handleScroll = useCallback(() => {
    const container = scrollytellingRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const windowHeight = window.innerHeight

    // When bottom of scrollytelling container is above the viewport bottom,
    // start scrolling the map up with the content
    const containerBottom = rect.bottom
    const releasePoint = windowHeight // When container bottom reaches viewport bottom

    if (containerBottom < releasePoint) {
      // Calculate how much the map should scroll up
      const offset = releasePoint - containerBottom
      learnMapActions.setLearnMapScrollOffset(offset)
    } else {
      // Map stays fixed
      learnMapActions.setLearnMapScrollOffset(0)
    }
  }, [])

  // Set up scroll listener
  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })
    // Initial check
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [handleScroll])

  return (
    <div
      style={{
        position: "relative",
      }}
    >
      {/* 
        Scrollytelling Container
        The persistent map is positioned fixed at page level.
        When this container's bottom scrolls above the viewport,
        the map "releases" and scrolls up with the content.
      */}
      <Box
        ref={scrollytellingRef}
        sx={{
          position: "relative",
          minHeight: "100vh",
          // Transparent background - map shows through
          backgroundColor: "transparent",
        }}
      >
        {/* Spacer for the initial map view - transparent */}
        <Box sx={{ height: "100vh", backgroundColor: "transparent" }} />

        {/* Overlay content - scrolls over the fixed persistent map */}
        <Box
          sx={{
            position: "relative",
            marginTop: "-100vh", // Pull up to overlap the map area
            zIndex: 1,
            pointerEvents: "none", // Let map interactions through
            backgroundColor: "transparent",
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

      {/* 
        Learn More section - positioned after the map container.
        The solid background covers the fixed map behind it.
        z-index ensures it's above the basement-level map.
      */}
      <Box
        sx={{
          backgroundColor: theme.palette.learn.background,
          padding: "60px 20px",
          paddingBottom: "150px",
          marginBottom: "-100px",
          // Stack above the fixed map (which is at z-index basement)
          position: "relative",
          zIndex: theme.zIndex.panels,
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
          {/* Text column */}
          <Box id="textColumn" sx={{ width: "40%" }}>
            <LeadingMarkerText title="Learn More">
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: "15px",
                }}
              ></div>

              <Box
                component="a"
                href="https://flow.coeqwal.org/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: (theme) => theme.palette.blue.darkest,
                  textDecoration: "none",
                  display: "block",
                  fontWeight: 500,
                  "&:hover": {
                    textDecoration: "underline",
                  },
                  marginTop: "40px",
                }}
              >
                How water moves through California →
              </Box>
              <Box
                component="a"
                href="https://climate.coeqwal.org/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: (theme) => theme.palette.blue.darkest,
                  textDecoration: "none",
                  display: "block",
                  mb: (theme) => theme.layout.spacing.xs,
                  fontWeight: 500,
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Climate change and California water →
              </Box>
            </LeadingMarkerText>
          </Box>
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
        </Box>
      </Box>
    </div>
  )
}
