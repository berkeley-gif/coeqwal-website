"use client"

/**
 * LearnPanel
 *
 * The Learn tab content. The map canvas is rendered in PersistentLearnMap
 * (at page level) to avoid unmount/remount issues.
 *
 * The scrolling overlays (MapOverlayPanels, ProgressiveScenarioPanels) are
 * rendered here so they scroll with the page over the fixed map.
 *
 * This panel has a transparent background so the map shows through.
 * The "Learn More" section at the bottom has the teal background.
 */

import { Suspense, useEffect } from "react"
import { Box } from "@repo/ui/mui"
import { LeadingMarkerText } from "@repo/ui"
import MapOverlayPanels from "../map/overlays/MapOverlayPanels"
import ProgressiveScenarioPanels from "../ProgressiveScenarioPanels"
import { useMapReady } from "../map/store"

export default function LearnPanel() {
  const mapReady = useMapReady()

  // Debug: log mapReady state changes
  useEffect(() => {
    console.log("[LearnPanel] mapReady:", mapReady)
  }, [mapReady])

  return (
    <div
      style={{
        position: "relative",
        // Transparent background so the map shows through
        backgroundColor: "transparent",
      }}
    >
      {/* Scrollytelling overlays - only render when map is ready */}
      {mapReady && (
        <Suspense fallback={null}>
          {/* Scrolling overlay panels over the fixed map */}
          <MapOverlayPanels />

          {/* Progressive scenario and hydroclimate panels */}
          <ProgressiveScenarioPanels />
        </Suspense>
      )}

      {/* Fallback spacer when map not ready (maintains scroll height) */}
      {!mapReady && (
        <Box
          sx={{
            height: "200vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "grey.500",
            flexDirection: "column",
            gap: 2,
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

      {/* Learn More section with opaque teal background */}
      {/* Extra padding at bottom to cover the AutoAdvanceFooter added by TabPanel */}
      <Box
        sx={{
          backgroundColor: "#68C3CE", // Learn tab teal color
          padding: "60px 20px",
          paddingBottom: "150px", // Extra to cover footer
          marginBottom: "-100px", // Extend into footer area
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
