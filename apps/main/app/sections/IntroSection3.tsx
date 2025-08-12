import React from "react"
import { BasePanel, Spacer, GlossaryLinkedText, ArrowHead } from "@repo/ui"
import { Box, Typography, Stack } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"
import FloatingMarker from "../components/FloatingMarker"
import FloatingCircle from "../components/FloatingCircle"
import WaterRipples from "../components/WaterRipples"
import { useDrawerStore } from "@repo/state"

const IntroSection3: React.FC = () => {
  const { t } = useTranslation()

  // Precise color separation for 180 circles
  const outerColors = ["76B854", "9793B3", "A9D0BF", "5D9BE2", "75A264", "FFAC6E"] // 6 outer colors
  const innerColors = ["969189", "5FACCA", "7198A5", "B8D7EF", "7B8EC2", "82807C"] // 6 inner colors
  
  // A little bigger circle size for better visibility
  const circleSize = { xs: 40, sm: 45, md: 50, lg: 55, xl: 60 }
  
  // Generate 180 circles in 15 rows × 12 columns grid with staggering
  const circleSpecs = []
  
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 12; col++) {
      // Add staggering to break up vertical lines
      const isEvenRow = row % 2 === 0
      const staggerOffset = isEvenRow ? 0 : 4 // Offset every other row by 4%
      
      // Calculate position with tighter spacing and staggering
      const left = `${1 + staggerOffset + (col * 7.5)}%` // Start at 1%, 7.5% spacing, with stagger
      const top = `${1 + (row * 6.2)}%` // Start at 1%, 6.2% spacing between rows
      
      // Cycle through color combinations
      const outerColorIndex = (row + col) % outerColors.length
      const innerColorIndex = (row * 2 + col) % innerColors.length
      
      circleSpecs.push({
        left,
        top,
        innerColor: innerColors[innerColorIndex],
        outerColor: outerColors[outerColorIndex]
      })
    }
  }

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

        {/* Floating circles overlay - now below text */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: (theme) => theme.zIndex.introBackgroundImages, // Lower z-index, below text
            pointerEvents: "none",
          }}
        >
          {circleSpecs.map((circle, i) => (
            <FloatingCircle
              key={i}
              left={circle.left}
              top={circle.top}
              size={circleSize}
              innerColor={circle.innerColor}
              outerColor={circle.outerColor}
            />
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
              We have organized these scenarios according to their outcomes. You can explore these scenarios by their effects.
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
              The COEQWAL project has run 30 alternative water management scenarios for the Central Valley water systems that feed most of the state. For each of these scenarios, we considered 5 future climate scenarios.
            </Typography>
          </Box>
        </BasePanel>
      </Box>
    </Box>
  )
}

export default IntroSection3