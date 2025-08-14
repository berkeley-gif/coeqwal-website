import React from "react"
import { BasePanel, Spacer, ArrowHead } from "@repo/ui"
import { Box, Typography, Stack } from "@repo/ui/mui"
// import { useTranslation } from "@repo/i18n"
import FloatingMarker from "../components/FloatingMarker"
// import { useDrawerStore } from "@repo/state"

const IntroSection: React.FC = () => {
  // const { t } = useTranslation()

  const markerSpecs = [
    // Row 1
    {
      src: "/images/markers/atta2.png",
      left: {
        xs: "calc(14% - 70px)", // Leftmost marker - center at 14%
        sm: "calc(14% - 80px)",
        md: "calc(14% - 100px)",
        lg: "calc(14% - 100px)",
        xl: "calc(14% - 100px)",
      },
      top: "5%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/farmers2.png",
      left: {
        xs: "calc(32% - 70px)", // Left marker - center at 32%
        sm: "calc(32% - 80px)",
        md: "calc(32% - 100px)",
        lg: "calc(32% - 100px)",
        xl: "calc(32% - 100px)",
      },
      top: "5%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    // Center marker
    {
      src: "/images/markers/drinking_water2.png",
      left: {
        xs: "calc(50% - 70px)", // Center marker - center at 50%
        sm: "calc(50% - 80px)",
        md: "calc(50% - 100px)",
        lg: "calc(50% - 100px)",
        xl: "calc(50% - 100px)",
      },
      top: "5%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/shasta2.png",
      left: {
        xs: "calc(68% - 70px)", // Right marker - center at 68%
        sm: "calc(68% - 80px)",
        md: "calc(68% - 100px)",
        lg: "calc(68% - 100px)",
        xl: "calc(68% - 100px)",
      },
      top: "5%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/salmon2.png",
      left: {
        xs: "calc(86% - 70px)", // Rightmost marker - center at 86%
        sm: "calc(86% - 80px)",
        md: "calc(86% - 100px)",
        lg: "calc(86% - 100px)",
        xl: "calc(86% - 100px)",
      },
      top: "5%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },

    // Row 2 - Staggered offset (centers at 5%, 23%, 77%, 95%)
    {
      src: "/images/markers/los_angeles2.png",
      left: {
        xs: "calc(5% - 70px)", // Far left marker
        sm: "calc(5% - 80px)",
        md: "calc(5% - 100px)",
        lg: "calc(5% - 100px)",
        xl: "calc(5% - 100px)",
      },
      top: "23%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/drinking_water2.png",
      left: {
        xs: "calc(23% - 70px)",
        sm: "calc(23% - 80px)",
        md: "calc(23% - 100px)",
        lg: "calc(23% - 100px)",
        xl: "calc(23% - 100px)",
      },
      top: "23%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    // {
    //   src: "/images/markers/los_angeles2.png",
    //   left: {
    //     xs: "calc(41% - 70px)",
    //     sm: "calc(41% - 80px)",
    //     md: "calc(41% - 100px)",
    //     lg: "calc(41% - 100px)",
    //     xl: "calc(41% - 100px)"
    //   },
    //   top: "23%",
    //   size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    // },
    // {
    //   src: "/images/markers/salmon2.png",
    //   left: {
    //     xs: "calc(59% - 70px)",
    //     sm: "calc(59% - 80px)",
    //     md: "calc(59% - 100px)",
    //     lg: "calc(59% - 100px)",
    //     xl: "calc(59% - 100px)"
    //   },
    //   top: "23%",
    //   size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    // },
    {
      src: "/images/markers/shasta2.png",
      left: {
        xs: "calc(77% - 70px)",
        sm: "calc(77% - 80px)",
        md: "calc(77% - 100px)",
        lg: "calc(77% - 100px)",
        xl: "calc(77% - 100px)",
      },
      top: "23%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/salmon2.png",
      left: {
        xs: "calc(95% - 70px)",
        sm: "calc(95% - 80px)",
        md: "calc(95% - 100px)",
        lg: "calc(95% - 100px)",
        xl: "calc(95% - 100px)",
      },
      top: "23%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },

    // Row 3 - Even row pattern (centers at 14%, 32%, 50%, 68%, 86%)
    {
      src: "/images/markers/farmers2.png",
      left: {
        xs: "calc(14% - 70px)",
        sm: "calc(14% - 80px)",
        md: "calc(14% - 100px)",
        lg: "calc(14% - 100px)",
        xl: "calc(14% - 100px)",
      },
      top: "41%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    // {
    //   src: "/images/markers/shasta2.png",
    //   left: {
    //     xs: "calc(32% - 70px)",
    //     sm: "calc(32% - 80px)",
    //     md: "calc(32% - 100px)",
    //     lg: "calc(32% - 100px)",
    //     xl: "calc(32% - 100px)"
    //   },
    //   top: "41%",
    //   size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    // },
    // {
    //   src: "/images/markers/atta2.png",
    //   left: {
    //     xs: "calc(50% - 70px)",
    //     sm: "calc(50% - 80px)",
    //     md: "calc(50% - 100px)",
    //     lg: "calc(50% - 100px)",
    //     xl: "calc(50% - 100px)"
    //   },
    //   top: "41%",
    //   size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    // },
    // {
    //   src: "/images/markers/drinking_water2.png",
    //   left: {
    //     xs: "calc(68% - 70px)",
    //     sm: "calc(68% - 80px)",
    //     md: "calc(68% - 100px)",
    //     lg: "calc(68% - 100px)",
    //     xl: "calc(68% - 100px)"
    //   },
    //   top: "41%",
    //   size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    // },
    {
      src: "/images/markers/los_angeles2.png",
      left: {
        xs: "calc(86% - 70px)",
        sm: "calc(86% - 80px)",
        md: "calc(86% - 100px)",
        lg: "calc(86% - 100px)",
        xl: "calc(86% - 100px)",
      },
      top: "41%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },

    // Row 4 - Staggered offset (centers at 5%, 23%, 41%, 59%, 77%, 95%)
    {
      src: "/images/markers/atta2.png",
      left: {
        xs: "calc(5% - 70px)",
        sm: "calc(5% - 80px)",
        md: "calc(5% - 100px)",
        lg: "calc(5% - 100px)",
        xl: "calc(5% - 100px)",
      },
      top: "59%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/salmon2.png",
      left: {
        xs: "calc(23% - 70px)",
        sm: "calc(23% - 80px)",
        md: "calc(23% - 100px)",
        lg: "calc(23% - 100px)",
        xl: "calc(23% - 100px)",
      },
      top: "59%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/atta2.png",
      left: {
        xs: "calc(41% - 70px)",
        sm: "calc(41% - 80px)",
        md: "calc(41% - 100px)",
        lg: "calc(41% - 100px)",
        xl: "calc(41% - 100px)",
      },
      top: "59%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/farmers2.png",
      left: {
        xs: "calc(59% - 70px)",
        sm: "calc(59% - 80px)",
        md: "calc(59% - 100px)",
        lg: "calc(59% - 100px)",
        xl: "calc(59% - 100px)",
      },
      top: "59%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/drinking_water2.png",
      left: {
        xs: "calc(77% - 70px)",
        sm: "calc(77% - 80px)",
        md: "calc(77% - 100px)",
        lg: "calc(77% - 100px)",
        xl: "calc(77% - 100px)",
      },
      top: "59%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/shasta2.png",
      left: {
        xs: "calc(95% - 70px)",
        sm: "calc(95% - 80px)",
        md: "calc(95% - 100px)",
        lg: "calc(95% - 100px)",
        xl: "calc(95% - 100px)",
      },
      top: "59%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },

    // Row 5 - Even row pattern (centers at 14%, 32%, 50%, 68%, 86%)
    {
      src: "/images/markers/shasta2.png",
      left: {
        xs: "calc(14% - 70px)",
        sm: "calc(14% - 80px)",
        md: "calc(14% - 100px)",
        lg: "calc(14% - 100px)",
        xl: "calc(14% - 100px)",
      },
      top: "77%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/drinking_water2.png",
      left: {
        xs: "calc(32% - 70px)",
        sm: "calc(32% - 80px)",
        md: "calc(32% - 100px)",
        lg: "calc(32% - 100px)",
        xl: "calc(32% - 100px)",
      },
      top: "77%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/los_angeles2.png",
      left: {
        xs: "calc(50% - 70px)",
        sm: "calc(50% - 80px)",
        md: "calc(50% - 100px)",
        lg: "calc(50% - 100px)",
        xl: "calc(50% - 100px)",
      },
      top: "77%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/salmon2.png",
      left: {
        xs: "calc(68% - 70px)",
        sm: "calc(68% - 80px)",
        md: "calc(68% - 100px)",
        lg: "calc(68% - 100px)",
        xl: "calc(68% - 100px)",
      },
      top: "77%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/atta2.png",
      left: {
        xs: "calc(86% - 70px)",
        sm: "calc(86% - 80px)",
        md: "calc(86% - 100px)",
        lg: "calc(86% - 100px)",
        xl: "calc(86% - 100px)",
      },
      top: "77%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },

    // Row 6 - Final staggered row (centers at 23%, 41%, 59%, 77%)
    {
      src: "/images/markers/farmers2.png",
      left: {
        xs: "calc(23% - 70px)",
        sm: "calc(23% - 80px)",
        md: "calc(23% - 100px)",
        lg: "calc(23% - 100px)",
        xl: "calc(23% - 100px)",
      },
      top: "95%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/shasta2.png",
      left: {
        xs: "calc(41% - 70px)",
        sm: "calc(41% - 80px)",
        md: "calc(41% - 100px)",
        lg: "calc(41% - 100px)",
        xl: "calc(41% - 100px)",
      },
      top: "95%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/drinking_water2.png",
      left: {
        xs: "calc(59% - 70px)",
        sm: "calc(59% - 80px)",
        md: "calc(59% - 100px)",
        lg: "calc(59% - 100px)",
        xl: "calc(59% - 100px)",
      },
      top: "95%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
    {
      src: "/images/markers/atta2.png",
      left: {
        xs: "calc(77% - 70px)",
        sm: "calc(77% - 80px)",
        md: "calc(77% - 100px)",
        lg: "calc(77% - 100px)",
        xl: "calc(77% - 100px)",
      },
      top: "95%",
      size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    },
  ] as const

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
          height: "100vh",
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
          paddingVariant="wide"
          fullHeight={false}
          background="transparent"
          includeHeaderSpacing={false}
          sx={{
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

          {/* Text content centered horizontally and vertically */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "100%",
              position: "relative",
              zIndex: (theme) => theme.zIndex.introText, // Text layer
              textAlign: "center",
            }}
          >
            <Typography
              variant="h1"
              sx={{
                color: (theme) => theme.palette.blue.darkest,
                mb: 4,
                textAlign: "center",
              }}
            >
              Tell your water story
            </Typography>

            <Typography
              variant="h4"
              sx={{
                color: (theme) => theme.palette.blue.darkest,
                mb: 2,
                textAlign: "center",
              }}
            >
              Rethink California Water
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: (theme) => theme.palette.blue.darkest,
                maxWidth: "500px",
                textAlign: "center",
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
                width: "100%",
                color: (theme) => theme.palette.blue.darkest,
                mt: 3,
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
      <Spacer height={{ xs: 48, md: 124 }} />

      {/* Second panel - Overview content */}
      <Box
        id="overview"
        sx={{
          position: "relative",
          width: "100vw",
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
          fullWidth
          background="transparent"
          paddingVariant="very-wide"
          includeHeaderSpacing={true}
          sx={{
            color: (theme) => theme.palette.primary.dark,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "visible",
          }}
        >
          {/* Text content */}
          <Box
            sx={{
              position: "relative",
              zIndex: (theme) => theme.zIndex.introText,
              textAlign: "left",
            }}
          >
            <Stack spacing={4}>
              <Typography
                variant="h2"
                sx={{
                  color: (theme) => theme.palette.blue.darkest,
                  mb: 3,
                  textAlign: "left",
                }}
              >
                The amount of water available for any purpose in California
                depends on two things: how much precipitation we get and how we
                manage this water. We are already having to make difficult water
                allocation decisions. We are facing a time of climate
                uncertainty and need to prepare for the future.
              </Typography>
            </Stack>
          </Box>
        </BasePanel>
      </Box>

      <BasePanel
        fullHeight={false}
        fullWidth
        background="transparent"
        paddingVariant="very-wide"
        includeHeaderSpacing={true}
        sx={{
          color: (theme) => theme.palette.primary.dark,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "visible",
        }}
      >
        {/* Text content */}
        <Box
          sx={{
            position: "relative",
            zIndex: (theme) => theme.zIndex.introText,
            textAlign: "left",
          }}
        >
          <Stack spacing={4}>
            <Typography
              variant="h2"
              sx={{
                color: (theme) => theme.palette.blue.darkest,
                mb: 3,
                textAlign: "left",
              }}
            >
              The COEQWAL project has run 30 alternative water management
              scenarios for the Central Valley water systems that feed most of
              the state. For each of these scenarios, we considered 5 future
              climate possibilities.
            </Typography>
          </Stack>
        </Box>
      </BasePanel>
    </Box>
  )
}

export default IntroSection
