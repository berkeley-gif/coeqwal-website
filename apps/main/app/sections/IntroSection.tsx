import React from "react"
import { BasePanel, Spacer, GlossaryLinkedText, ArrowHead } from "@repo/ui"
import { Box, Typography, Stack } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"
import FloatingMarker from "../components/FloatingMarker"
import WaterRipples from "../components/WaterRipples"
import { useDrawerStore } from "@repo/state"

const IntroSection: React.FC = () => {
  const { t } = useTranslation()

  // Hero section markers, absolutely positioned to align with California map background image
  // TODO: this isn't the best approach for responsive design.
  const markerSpecs = [
    {
      src: "/images/markers/shasta.png",
      right: { xs: "25%", sm: "28%", md: "45%", lg: "45%", xl: "45%" },
      top: "30px",
      size: { xs: 160, sm: 180, md: 220, lg: 220, xl: 220 },
    },
    {
      src: "/images/markers/drinking_water.png",
      right: { xs: "13%", sm: "16%", md: "36%", lg: "36%", xl: "36%" },
      top: "50%",
      size: { xs: 160, sm: 180, md: 220, lg: 220, xl: 220 },
    },
    {
      src: "/images/markers/los_angeles.png",
      right: { xs: "1%", sm: "2%", md: "20%", lg: "20%", xl: "20%" },
      top: "62%",
      size: { xs: 160, sm: 180, md: 220, lg: 220, xl: 220 },
    },
    {
      src: "/images/markers/farmers.png",
      right: { xs: "3%", sm: "5%", md: "22%", lg: "22%", xl: "22%" },
      top: "38%",
      size: { xs: 160, sm: 180, md: 220, lg: 220, xl: 220 },
    },
    {
      src: "/images/markers/salmon.png",
      right: { xs: "9%", sm: "12%", md: "30%", lg: "30%", xl: "30%" },
      top: "16%",
      size: { xs: 160, sm: 180, md: 220, lg: 220, xl: 220 },
    },
    {
      src: "/images/markers/atta.png",
      right: { xs: "21%", sm: "24%", md: "43%", lg: "43%", xl: "43%" },
      top: "30%",
      size: { xs: 160, sm: 180, md: 220, lg: 220, xl: 220 },
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
          background: `url('/images/california.png')`,
          backgroundSize: {
            xs: "auto 90%",
            sm: "auto 95%",
            md: "auto 100%",
            lg: "auto 100%",
            xl: "auto 100%",
          },
          backgroundPosition: {
            xs: "80% center",
            sm: "82% center",
            md: "85% center",
            lg: "85% center",
            xl: "85% center",
          },
          backgroundRepeat: "no-repeat",
          overflow: "hidden",
          zIndex: 0,
          isolation: "isolate",
        }}
      >
        {/* Water ripples behind California image */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: -1, // Behind everything including California image
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
            zIndex: (theme) => theme.zIndex.introBackgroundImages - 1,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <WaterRipples count={16} />
        </Box>

        {/* Floating markers overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: (theme) => theme.zIndex.introBackgroundImages + 1,
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
            paddingTop: (theme) => ({
              xs: `calc(${theme.layout.headerHeight}px + 3rem)`,
              md: `calc(${theme.layout.headerHeight}px + 6rem)`,
            }),
            paddingBottom: { xs: 3, md: 6 },
            paddingLeft: { xs: 6, md: 20 },
            paddingRight: { xs: 3, md: 6 },
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            overflow: "visible",
          }}
        >
          {/* Background circles (below text) - contained within the first 100vh */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: (theme) => theme.zIndex.introBackgroundImages,
              pointerEvents: "none",
            }}
          ></Box>

          {/* Text content on top of background circles */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              width: "100%",
              height: "100%",
              position: "relative",
              zIndex: (theme) => theme.zIndex.introText, // Text layer
            }}
          >
            <Typography
              variant="h1"
              sx={{
                color: (theme) => theme.palette.blue.darkest,
                mb: 2,
              }}
            >
              Learn.
            </Typography>

            <Typography
              variant="h1"
              sx={{
                color: (theme) => theme.palette.blue.darkest,
                mb: 2,
              }}
            >
              Explore.
            </Typography>

            <Typography
              variant="h1"
              sx={{
                color: (theme) => theme.palette.blue.darkest,
                mb: 2,
              }}
            >
              Empower.
            </Typography>

            <Typography
              variant="h4"
              sx={{
                color: (theme) => theme.palette.blue.darkest,
                mt: 2.5,
                mb: 2, // 1rem equivalent (16px)
              }}
            >
              Rethink California Water
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: (theme) => theme.palette.blue.darkest,
                maxWidth: "500px",
              }}
            >
              Explore a range of Central Valley water scenarios and discover
              possibilities for the future of water in our state, under current
              conditions and future climates.
            </Typography>

            {/* Play arrow icon pointing down */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                width: "500px",
                color: (theme) => theme.palette.blue.darkest,
              }}
            >
              <ArrowHead
                size={28}
                style={{ transform: "rotate(90deg)", cursor: "pointer" }}
                onClick={() => {
                  // Scroll to the next section with improved positioning
                  const interstitialSection =
                    document.getElementById("overview")
                  if (interstitialSection) {
                    // Get the exact position of the interstitial section
                    const rect = interstitialSection.getBoundingClientRect()
                    const currentScrollTop =
                      window.pageYOffset || document.documentElement.scrollTop

                    // Calculate target position, accounting for any header offset
                    const targetPosition = rect.top + currentScrollTop - 20 // Small offset for better positioning

                    // Use requestAnimationFrame to ensure smooth scrolling doesn't interfere with manual scrolling
                    requestAnimationFrame(() => {
                      window.scrollTo({
                        top: targetPosition,
                        behavior: "smooth",
                      })
                    })
                  }
                }}
              />
            </Box>
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
          paddingVariant="wide"
          includeHeaderSpacing={false}
          sx={{
            color: (theme) => theme.palette.primary.dark,
            paddingLeft: { xs: 6, md: 20 },
            paddingRight: { xs: 3, md: 6 },
            paddingTop: { xs: 2, md: 6 }, // Override the wide padding variant's top padding
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "visible",
          }}
        >
          {/* Spacer for header */}
          <Box sx={{ height: { xs: "64px", md: "80px" } }} />

          {/* Content container for proper blending context */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              flex: 1, // Take up remaining space
              position: "relative",
              zIndex: (theme) => theme.zIndex.introText, // Text layer
            }}
          >
            {/* Text content with mix-blend-mode */}
            <Box
              maxWidth="716px"
              sx={{
                position: "relative",
                zIndex: (theme) => theme.zIndex.introText,
                mb: 36,
              }}
            >
              <Stack spacing={4}>
                <Typography
                  variant="h3"
                  sx={{
                    color: (theme) => theme.palette.blue.darkest,
                    mb: 3,
                  }}
                >
                  What is California&apos;s water future?
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: (theme) => theme.palette.blue.darkest }}
                >
                  <GlossaryLinkedText
                    text={t("interstitial.part1")}
                    terms={[
                      { name: "surface water", glossaryTerm: "Surface water" },
                      { name: "conveyance", glossaryTerm: "Conveyance" },
                      { name: "allocation", glossaryTerm: "Allocation" },
                      {
                        name: "Central Valley",
                        glossaryTerm: "Central Valley",
                      },
                    ]}
                    onActivate={(glossaryTerm) => {
                      const drawerStore = useDrawerStore.getState()
                      drawerStore.setDrawerContent({
                        selectedSection: "glossary",
                        selectedTerm: glossaryTerm,
                      })
                      drawerStore.openDrawer("glossary")
                    }}
                  />
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: (theme) => theme.palette.blue.darkest }}
                >
                  <GlossaryLinkedText
                    text={t("interstitial.part2")}
                    terms={[
                      { name: "storage", glossaryTerm: "Storage" },
                      { name: "conveyance", glossaryTerm: "Conveyance" },
                      { name: "deliveries", glossaryTerm: "Deliveries" },
                      {
                        name: "operational decisions",
                        glossaryTerm: "Operational decisions",
                      },
                      { name: "CalSim", glossaryTerm: "CalSim" },
                      { name: "COEQWAL", glossaryTerm: "COEQWAL" },
                      { name: "scenarios", glossaryTerm: "Scenarios" },
                      { name: "climate", glossaryTerm: "Changing climate" },
                    ]}
                    onActivate={(glossaryTerm) => {
                      const drawerStore = useDrawerStore.getState()
                      drawerStore.setDrawerContent({
                        selectedSection: "glossary",
                        selectedTerm: glossaryTerm,
                      })
                      drawerStore.openDrawer("glossary")
                    }}
                  />
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: (theme) => theme.palette.blue.darkest }}
                >
                  <GlossaryLinkedText
                    text={t("interstitial.part3")}
                    terms={[
                      { name: "COEQWAL", glossaryTerm: "COEQWAL" },
                      { name: "scenarios", glossaryTerm: "Scenarios" },
                      {
                        name: "changing climate",
                        glossaryTerm: "Changing climate",
                      },
                    ]}
                    onActivate={(glossaryTerm) => {
                      const drawerStore = useDrawerStore.getState()
                      drawerStore.setDrawerContent({
                        selectedSection: "glossary",
                        selectedTerm: glossaryTerm,
                      })
                      drawerStore.openDrawer("glossary")
                    }}
                  />
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: (theme) => theme.palette.blue.darkest,
                    mt: 2,
                  }}
                >
                  what if we did things differently?
                </Typography>
              </Stack>
            </Box>
          </Box>
        </BasePanel>
      </Box>
    </Box>
  )
}

export default IntroSection
