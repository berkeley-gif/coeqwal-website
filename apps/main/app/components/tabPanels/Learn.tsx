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
 *
 * The persistent map approach means:
 * - No map remounting when switching tabs
 * - WebGL context stays alive (performance)
 * - Map is preloaded during IntroSection scroll
 */

import { useEffect, useRef, useCallback } from "react"
import {
  Box,
  Typography,
  useTheme,
  MuiCard as Card,
  MuiCardContent as CardContent,
  MuiCardActionArea as CardActionArea,
} from "@repo/ui/mui"
import { LeadingMarkerText } from "@repo/ui"
import MapOverlayPanels from "../../features/map/overlays/MapOverlayPanels"
import { useMapReady, learnMapActions } from "../../features/map/store"

export default function LearnPanel() {
  const mapReady = useMapReady()
  const theme = useTheme()
  const scrollytellingRef = useRef<HTMLDivElement>(null)
  const cardColor = theme.palette.blue.pale

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
        pointerEvents: "none", // Allow map panning through - child elements re-enable as needed
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
          pointerEvents: "none", // Allow map panning
        }}
      >
        {/* Spacer for the initial map view - transparent, allows map panning */}
        <Box
          sx={{
            height: "100vh",
            backgroundColor: "transparent",
            pointerEvents: "none",
          }}
        />

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
            <MapOverlayPanels />
          ) : (
            <Box
              sx={{
                height: "200vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "theme.palette.common.white",
                flexDirection: "column",
                gap: 2,
                pointerEvents: "none", // Don't block map panning while loading
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
      <Box
        sx={{
          backgroundColor: theme.palette.learn.background,
          padding: "60px",
          paddingBottom: "100px",
          position: "relative",
          zIndex: theme.zIndex.panels,
          pointerEvents: "auto",
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
                    backgroundColor: cardColor,
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
                    <CardContent sx={{ height: "100%" }}>
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
                    backgroundColor: cardColor,
                  }}
                >
                  <CardActionArea
                    sx={{
                      padding: "17px",
                    }}
                  >
                    <CardContent sx={{ height: "100%" }}>
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
