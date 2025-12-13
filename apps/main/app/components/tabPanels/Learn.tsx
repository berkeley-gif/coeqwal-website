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
 * - LearnMore section comes after the scrollytelling content
 * - Map fades out as footer approaches (via IntersectionObserver)
 *
 * The persistent map approach means:
 * - No map remounting when switching tabs
 * - WebGL context stays alive (performance)
 * - Map is preloaded during IntroSection scroll
 */

import { Suspense, useEffect, useRef } from "react"
import { Box } from "@repo/ui/mui"
import { LeadingMarkerText } from "@repo/ui"
import MapOverlayPanels from "../../features/map/overlays/MapOverlayPanels"
import ProgressiveScenarioPanels from "../ProgressiveScenarioPanels"
import { useMapReady, learnMapActions } from "../../features/map/store"

export default function LearnPanel() {
  const mapReady = useMapReady()
  const footerRef = useRef<HTMLDivElement>(null)

  // Set map mode to 'learn' on mount, reset to 'hidden' on unmount
  useEffect(() => {
    // Reset Learn-specific state and activate Learn mode
    learnMapActions.resetLearnState()
    learnMapActions.setMapMode("learn")

    return () => {
      // Hide the map when leaving Learn tab
      learnMapActions.setMapMode("hidden")
    }
  }, [])

  // Fade map out as footer comes into view
  useEffect(() => {
    const footer = footerRef.current
    if (!footer) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // When footer starts entering viewport, hide the map
          if (entry.isIntersecting) {
            learnMapActions.setMapMode("hidden")
          } else {
            // Only re-show map if we're still in Learn tab
            learnMapActions.setMapMode("learn")
          }
        })
      },
      {
        // Trigger when footer is 10% visible
        threshold: 0.1,
        rootMargin: "0px 0px -50% 0px", // Start transition early
      },
    )

    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      style={{
        position: "relative",
      }}
    >
      {/* 
        Scrollytelling Container
        The persistent map is positioned fixed at page level (z-index 0).
        This container is transparent so the map shows through.
        Only the overlay panels have backgrounds.
      */}
      <Box
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

      {/* Learn More section - comes after the scrollytelling content naturally */}
      {/* Map fades out when this section comes into view */}
      <Box
        ref={footerRef}
        sx={{
          backgroundColor: "#68C3CE", // Learn tab teal color
          padding: "60px 20px",
          paddingBottom: "150px",
          marginBottom: "-100px",
          // Ensure footer is above the map
          position: "relative",
          zIndex: 1,
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
