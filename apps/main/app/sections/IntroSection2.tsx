import React from "react"
import { BasePanel, Spacer, GlossaryLinkedText, ArrowHead } from "@repo/ui"
import { Box, Typography, Stack } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"
import FloatingMarker from "../components/FloatingMarker"
import WaterRipples from "../components/WaterRipples"
import { useDrawerStore } from "@repo/state"

const IntroSection2: React.FC = () => {
  const { t } = useTranslation()

  // Hero section markers - 6 well-distributed markers for clean composition
  // Smaller size for better balance
  const markerSize = { xs: 160, sm: 190, md: 220, lg: 250, xl: 280 }
  
  const markerSpecs = [
    // Top row - evenly spaced
    {
      src: "/images/markers/shasta2.png",
      left: "5%",
      top: "10%",
      size: markerSize,
    },
    {
      src: "/images/markers/drinking_water2.png",
      left: "40%",
      top: "15%",
      size: markerSize,
    },
    {
      src: "/images/markers/farmers2.png",
      left: "75%",
      top: "12%",
      size: markerSize,
    },
    // Middle row - staggered positions
    {
      src: "/images/markers/salmon2.png",
      left: "15%",
      top: "40%",
      size: markerSize,
    },
    {
      src: "/images/markers/drinking_water2.png",
      left: "65%",
      top: "45%",
      size: markerSize,
    },
    // Bottom row - balanced distribution
    {
      src: "/images/markers/farmers2.png",
      left: "8%",
      top: "70%",
      size: markerSize,
    },
    {
      src: "/images/markers/los_angeles2.png",
      left: "35%",
      top: "75%",
      size: markerSize,
    },
    {
      src: "/images/markers/atta2.png",
      left: "70%",
      top: "72%",
      size: markerSize,
    },
  ] as const

  // page elements
  return (
    <Box
      sx={{
        background: (theme) => `
          linear-gradient(to bottom, ${theme.palette.brand.sky}, ${theme.palette.brand.water})
        `,
        minHeight: "200vh", // Ensure gradient covers first two panels
      }}
    >
      {/* First panel / Hero section */}
      {/* TODO: standardize panels into components for ui package */}
      <Box
        id="intro"
        sx={{
          position: "relative",
          width: "100vw",
          height: "100vh",
        }}
      >
        {/* Water ripples behind California image */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: (theme) => theme.zIndex.sectionBackground, // Behind everything including California image
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <WaterRipples count={16} />
        </Box>

        {/* Water ripples in front of California image (behind markers) */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: (theme) => theme.zIndex.sectionBackground,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <WaterRipples count={16} />
        </Box>

        {/* Floating markers overlay - now below text */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: (theme) => theme.zIndex.introBackgroundImages, // Lower z-index, below text
            pointerEvents: "none",
          }}
        >
          {markerSpecs.map((m, i) => (
            <FloatingMarker key={i} {...m} />
          ))}
        </Box>

        {/* Hero text content */}
        <BasePanel
          id="intro-main"
          fullHeight={false}
          background="transparent"
          includeHeaderSpacing={false}
          sx={{
            height: (theme) => `calc(100vh - ${theme.layout.headerHeight}px)`,
            width: "100vw",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden", // Prevent markers from going beyond viewport
            padding: 0, // Remove default padding for full screen
          }}
        >
          {/* Background circles (below everything) */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: (theme) => theme.zIndex.sectionBackground,
              pointerEvents: "none",
            }}
          ></Box>

          {/* Text content with blend mode - now above floating markers */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              width: "100%",
              height: "100%",
              position: "relative",
              zIndex: (theme) => theme.zIndex.introForegroundImages, // Higher z-index, above markers
              mixBlendMode: "multiply", // Try different blend modes: difference, exclusion, overlay, soft-light, hard-light, color-dodge, color-burn
              paddingLeft: { xs: 6, md: 20 }, // Restore text padding
              paddingRight: { xs: 3, md: 6 },
              paddingTop: { xs: 2, md: 4 },
              paddingBottom: { xs: 2, md: 4 },
            }}
          >
            <Typography
              variant="h1"
              sx={{
                fontFamily: '"neue-haas-grotesk-display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                fontWeight: 700,
                lineHeight: 1.2,
                color: (theme) => theme.palette.blue.darkest,
              }}
            >
              Two main things determine how much water is allocated to a purpose in California: the amount of precipitation that falls on the state and how it is managed.
            </Typography>
          </Box>
        </BasePanel>
      </Box>

      {/* Spacer between full-screen panels */}
      <Spacer height={{ xs: 48, md: 96 }} />

      {/* Second panel - Overview content */}
      <Box
        id="overview"
        sx={{
          position: "relative",
          width: "100vw",
          height: "100vh",
          background: `
            url('/images/home_collage/birds_top.png'),
            url('/images/home_collage/left_side.png'),
            url('/images/home_collage/right.png')
          `,
          backgroundSize: "auto 44%, auto 80%, auto 44%",
          backgroundPosition: "left top, left bottom, right bottom",
          backgroundRepeat: "no-repeat, no-repeat, no-repeat",
          overflow: "hidden",
        }}
      >
        <BasePanel
          fullHeight={false}
          background="transparent"
          includeHeaderSpacing={false}
          sx={{
            height: (theme) => `calc(100vh - ${theme.layout.headerHeight}px)`,
            width: "100vw",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden", // Prevent content from going beyond viewport
            padding: 0, // Remove default padding for full screen
          }}
        >
          {/* Text content with same styling as first panel */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              width: "100%",
              height: (theme) => `calc(100vh - ${theme.layout.headerHeight}px)`, // Match the BasePanel height exactly
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: (theme) => theme.zIndex.introForegroundImages, // Higher z-index, above markers
              mixBlendMode: "difference", // Same blend mode as first panel
              paddingLeft: { xs: 6, md: 20 }, // Same padding as first panel
              paddingRight: { xs: 3, md: 6 },
              paddingTop: { xs: 2, md: 4 },
              paddingBottom: { xs: 2, md: 4 },
            }}
          >
            <Typography
              variant="h1"
              sx={{
                fontFamily: '"neue-haas-grotesk-display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                fontWeight: 700,
                lineHeight: 1.2,
                color: "white",
                mb: 4, // Add margin bottom for spacing
              }}
            >
              What is California&apos;s water future?
            </Typography>
            <Typography
              variant="h1"
              sx={{
                fontFamily: '"neue-haas-grotesk-display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                fontWeight: 700,
                lineHeight: 1.2,
                color: "white",
              }}
            >
              The COEQWAL project has run 30 alternative water management scenarios for the Central Valley water systems that feed most of the state. For each of these scenarios, we considered 5 future climate possibilities.
            </Typography>
          </Box>
        </BasePanel>
      </Box>
    </Box>
  )
}

export default IntroSection2