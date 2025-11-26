"use client"

import { Box, Typography } from "@repo/ui/mui"
import { MapProvider } from "@repo/map"
import CaliforniaMapPanel from "../../components/CaliforniaMapPanel"
import MapOverlayPanels from "../../components/MapOverlayPanels"
import ProgressiveScenarioPanels from "../../components/ProgressiveScenarioPanels"
import { CalSimProvider } from "../../components/CalSimContext"

import { LeadingMarkerText } from "@repo/ui"

export default function LearnPanel() {
  return (
    <div style={{ position: "relative" }}>
      <Box sx={{ pointerEvents: "none" }}>
        {/* MapProvider for shared map context */}
        <MapProvider>
          {/* CalSim context provider for shared state between map and overlays */}
          <CalSimProvider>
            {/* Sticky California map background */}
            <CaliforniaMapPanel id="california-map" />

            {/* Scrolling overlay panels over the sticky map */}
            <MapOverlayPanels />

            {/* Progressive scenario and hydroclimate panels that appear on scroll */}
            <ProgressiveScenarioPanels />
          </CalSimProvider>
        </MapProvider>
      </Box>
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
          margin: "100px auto 0",
        }}
      >
        {/* Text column */}
        <Box id="textColumn" sx={{ width: "70%" }}>
          <LeadingMarkerText title="Learn">
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "15px",
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontSize: "1.2rem",
                  width: "40%",
                }}
                fontWeight={700}
              >
                Do you know that California has one of the most complex water
                systems in the world?
              </Typography>
              <Typography
                sx={{
                  width: "60%",
                }}
                variant="body1"
              >
                Learn how hydroclimate affects water availability, how water
                flows through California&apos;s Central Valley, the ways in
                which we manage water to satisfy diverse needs, and why
                inequities in water access persist.
              </Typography>
            </div>

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
              Learn more: How water moves through California →
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
              Learn more: Climate change and California water →
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
    </div>
  )
}
