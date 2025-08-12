import React from "react"
import { BasePanel, Spacer, GlossaryLinkedText, ArrowHead } from "@repo/ui"
import { Box, Typography, Stack } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"
import FloatingMarker from "../components/FloatingMarker"
import WaterRipples from "../components/WaterRipples"
import { useDrawerStore } from "@repo/state"

const IntroSection: React.FC = () => {
  const { t } = useTranslation()

  const markerSpecs = [
    // Row 1
    {
      src: "/images/markers/salmon2.png",
      right: { xs: "80%", sm: "80%", md: "80%", lg: "80%", xl: "80%" },
      top: "5%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/shasta2.png",
      right: { xs: "60%", sm: "60%", md: "60%", lg: "60%", xl: "60%" },
      top: "5%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/drinking_water2.png",
      right: { xs: "40%", sm: "40%", md: "40%", lg: "40%", xl: "40%" },
      top: "5%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/farmers2.png",
      right: { xs: "20%", sm: "20%", md: "20%", lg: "20%", xl: "20%" },
      top: "5%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/atta2.png",
      right: { xs: "0%", sm: "0%", md: "0%", lg: "0%", xl: "0%" },
      top: "5%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },

    // Row 2 (offset by 10%)
    {
      src: "/images/markers/los_angeles2.png",
      right: { xs: "90%", sm: "90%", md: "90%", lg: "90%", xl: "90%" },
      top: "22%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/drinking_water2.png",
      right: { xs: "70%", sm: "70%", md: "70%", lg: "70%", xl: "70%" },
      top: "22%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    // {
    //   src: "/images/markers/shasta2.png",
    //   right: { xs: "50%", sm: "50%", md: "50%", lg: "50%", xl: "50%" },
    //   top: "22%",
    //   size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    // },
    // {
    //   src: "/images/markers/salmon2.png",
    //   right: { xs: "30%", sm: "30%", md: "30%", lg: "30%", xl: "30%" },
    //   top: "22%",
    //   size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    // },
    {
      src: "/images/markers/salmon2.png",
      right: { xs: "10%", sm: "10%", md: "10%", lg: "10%", xl: "10%" },
      top: "22%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },

    // Row 3
    {
      src: "/images/markers/farmers2.png",
      right: { xs: "80%", sm: "80%", md: "80%", lg: "80%", xl: "80%" },
      top: "39%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    // {
    //   src: "/images/markers/los_angeles2.png",
    //   right: { xs: "60%", sm: "60%", md: "60%", lg: "60%", xl: "60%" },
    //   top: "39%",
    //   size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    // },
    // {
    //   src: "/images/markers/drinking_water2.png",
    //   right: { xs: "40%", sm: "40%", md: "40%", lg: "40%", xl: "40%" },
    //   top: "39%",
    //   size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    // },
    // {
    //   src: "/images/markers/farmers2.png",
    //   right: { xs: "20%", sm: "20%", md: "20%", lg: "20%", xl: "20%" },
    //   top: "39%",
    //   size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    // },
    {
      src: "/images/markers/shasta2.png",
      right: { xs: "0%", sm: "0%", md: "0%", lg: "0%", xl: "0%" },
      top: "39%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },

    // Row 4 (offset by 10%)
    {
      src: "/images/markers/salmon2.png",
      right: { xs: "90%", sm: "90%", md: "90%", lg: "90%", xl: "90%" },
      top: "56%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/atta2.png",
      right: { xs: "70%", sm: "70%", md: "70%", lg: "70%", xl: "70%" },
      top: "56%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    // {
    //   src: "/images/markers/drinking_water2.png",
    //   right: { xs: "50%", sm: "50%", md: "50%", lg: "50%", xl: "50%" },
    //   top: "56%",
    //   size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    // },
    // {
    //   src: "/images/markers/los_angeles2.png",
    //   right: { xs: "30%", sm: "30%", md: "30%", lg: "30%", xl: "30%" },
    //   top: "56%",
    //   size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    // },
    {
      src: "/images/markers/farmers2.png",
      right: { xs: "10%", sm: "10%", md: "10%", lg: "10%", xl: "10%" },
      top: "56%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },

    // Row 5 (bottom)
    {
      src: "/images/markers/shasta2.png",
      right: { xs: "80%", sm: "80%", md: "80%", lg: "80%", xl: "80%" },
      top: "73%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/drinking_water2.png",
      right: { xs: "60%", sm: "60%", md: "60%", lg: "60%", xl: "60%" },
      top: "73%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/salmon2.png",
      right: { xs: "40%", sm: "40%", md: "40%", lg: "40%", xl: "40%" },
      top: "73%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/atta2.png",
      right: { xs: "20%", sm: "20%", md: "20%", lg: "20%", xl: "20%" },
      top: "73%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/los_angeles2.png",
      right: { xs: "0%", sm: "0%", md: "0%", lg: "0%", xl: "0%" },
      top: "73%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },

    // Row 6 (bottom) - Staggered (offset by 10%)
    {
      src: "/images/markers/farmers2.png",
      right: { xs: "90%", sm: "90%", md: "90%", lg: "90%", xl: "90%" },
      top: "90%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/shasta2.png",
      right: { xs: "70%", sm: "70%", md: "70%", lg: "70%", xl: "70%" },
      top: "90%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/drinking_water2.png",
      right: { xs: "50%", sm: "50%", md: "50%", lg: "50%", xl: "50%" },
      top: "90%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/salmon2.png",
      right: { xs: "30%", sm: "30%", md: "30%", lg: "30%", xl: "30%" },
      top: "90%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/atta2.png",
      right: { xs: "10%", sm: "10%", md: "10%", lg: "10%", xl: "10%" },
      top: "90%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
  ] as const

  // page elements
  return (
    <Box
      sx={{
        background: (theme) => `
          ${theme.palette.brand.water}
        `,
        minHeight: "200vh", //  To blend imagery between two views
      }}
    >
      {/* First panel / Hero section */}
      {/* TODO: standardize panels into components for ui package */}
      <Box
        id="intro"
        sx={{
          position: "relative",
          width: "100vw",
          height: "100vh"
        }}
      >
        {/* Floating markers overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: (theme) => theme.zIndex.introForegroundImages,
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
