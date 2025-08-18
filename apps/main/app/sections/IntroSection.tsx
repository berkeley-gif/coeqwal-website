import React from "react"
import { BasePanel, Spacer, ArrowHead } from "@repo/ui"
import { Box, Typography } from "@repo/ui/mui"
import { ScrollIndicator } from "@repo/motion/components"
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
    // {
    //   src: "/images/markers/atta2.png",
    //   left: {
    //     xs: "calc(41% - 70px)",
    //     sm: "calc(41% - 80px)",
    //     md: "calc(41% - 100px)",
    //     lg: "calc(41% - 100px)",
    //     xl: "calc(41% - 100px)",
    //   },
    //   top: "59%",
    //   size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    // },
    // {
    //   src: "/images/markers/farmers2.png",
    //   left: {
    //     xs: "calc(59% - 70px)",
    //     sm: "calc(59% - 80px)",
    //     md: "calc(59% - 100px)",
    //     lg: "calc(59% - 100px)",
    //     xl: "calc(59% - 100px)",
    //   },
    //   top: "59%",
    //   size: { xs: 140, sm: 160, md: 200, lg: 200, xl: 200 },
    // },
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
      {/* TODO: ugh nested boxes */}
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
          {/* Background circles (below text) */}
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
            {/* <Typography
              variant="h1"
              sx={{

                mb: 4,
                textAlign: "center",
              }}
            >
              Tell your water story
            </Typography>

            <Typography
              variant="h4"
              sx={{

                mb: 2,
                textAlign: "center",
              }}
            >
              Rethink California Water
            </Typography> */}

            <Typography
              variant="h1"
              sx={{
                mb: 2,
                textAlign: "center",
              }}
            >
              Rethink
              <br />
              California Water
            </Typography>

            <Typography
              variant="body1"
              sx={{
                maxWidth: "500px",
                textAlign: "center",
              }}
            >
              Explore a range of Central Valley water scenarios and discover
              possibilities for water management across the state, under current
              conditions and future climates.
            </Typography>

            {/* Animated scroll indicator */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
                color: (theme) => theme.palette.blue.darkest,
                mt: 4,
              }}
            >
              <ScrollIndicator
                color="currentColor"
                size={28}
                delay={1.0}
                scrollToId="overview"
              >
                <ArrowHead size={28} style={{ transform: "rotate(90deg)" }} />
              </ScrollIndicator>
            </Box>
          </Box>
        </BasePanel>
      </Box>

      {/* Spacer between full-screen panels */}
      <Spacer height={{ xs: 48, md: 48 }} />

      {/* Second panel - Overview content */}
      <BasePanel
        id="overview"
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
          background: `
            url('/images/home_collage/left_side.png'),
            url('/images/home_collage/right.png')
          `,
          backgroundSize: "auto 40%, auto 56%",
          backgroundPosition: "left bottom, right bottom",
          backgroundRepeat: "no-repeat, no-repeat",
        }}
      >
        {/* Text content */}
        <Box
          sx={{
            position: "relative",
            zIndex: (theme) => theme.zIndex.introText,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: { xs: 6, md: 12 },
          }}
        >
          {/* Bullet image (absolutely positioned to not interfere with text centering) */}
          <Box
            sx={{
              position: "absolute",
              left: { xs: "5%", md: "8%" },
              top: "40%",
              transform: "translateY(-50%)",
              width: { xs: 200, md: 300 },
              height: { xs: 200, md: 300 },
              backgroundImage: "url('/images/home_collage/birds_top.png')",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              zIndex: -1, // Behind the text
              opacity: 0.8, // Slightly transparent so it doesn't compete with text if they overlap
            }}
          />

          {/* Centered text block */}
          <Box
            sx={{ textAlign: "left", maxWidth: { xs: "600px", md: "500px" } }}
          >
            <Typography variant="body1">
              California&apos;s Central Valley water depends
              <br />
              on two main things:
            </Typography>

            <Box component="ol" sx={{ mt: 0, pl: 3 }}>
              <Box component="li" sx={{ mb: 1 }}>
                <Typography variant="body1">
                  How much rain and snow we get.
                </Typography>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Typography variant="body1">
                  How we choose to manage it.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Scroll indicator for 2nd panel */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            color: (theme) => theme.palette.blue.darkest,
            mt: 4,
          }}
        >
          <ScrollIndicator
            color="currentColor"
            size={28}
            delay={0.5}
            scrollToId="third-panel"
          >
            <ArrowHead size={28} style={{ transform: "rotate(90deg)" }} />
          </ScrollIndicator>
        </Box>
      </BasePanel>

      {/* Third panel */}
      <BasePanel
        id="third-panel"
        fullHeight={false}
        fullWidth
        background="transparent"
        paddingVariant="wide"
        includeHeaderSpacing={true}
        sx={{
          color: (theme) => theme.palette.primary.dark,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "visible",
          background: `
            url('/images/home_collage/left_side.png'),
            url('/images/home_collage/right.png')
          `,
          backgroundSize: "auto 30%, auto 44%",
          backgroundPosition: "left bottom, right bottom",
          backgroundRepeat: "no-repeat, no-repeat",
        }}
      >
        {/* Text content */}
        <Box
          sx={{
            position: "relative",
            zIndex: (theme) => theme.zIndex.introText,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Bullet image - absolutely positioned to not interfere with text centering */}
          <Box
            sx={{
              position: "absolute",
              left: { xs: "5%", md: "0" },
              top: "40%",
              transform: "translateY(-50%)",
              width: { xs: 200, md: 300 },
              height: { xs: 200, md: 300 },
              backgroundImage: "url('/images/home_collage/birds_top.png')",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              zIndex: -1, // Behind the text
              opacity: 0.8, // Slightly transparent so it doesn't compete with text if they overlap
            }}
          />

          {/* Text block centered */}
          <Box
            sx={{ textAlign: "left", maxWidth: { xs: "600px", md: "720px" } }}
          >
            <Typography
              variant="body1"
              sx={{
                mb: 3,
              }}
            >
              We already face difficult choices. Climate change brings deeper
              droughts, bigger floods, and growing uncertainty.
            </Typography>

            <Typography variant="body1">
              The COEQWAL (Collaboratory for Equity in Water Allocation) project
              has modeled 30 alternative water management scenarios for the
              Central Valley water systems that supply most of the state. For
              each of these scenarios, we also modeled 5 future climate
              possibilities.
            </Typography>
          </Box>
        </Box>

        {/* Scroll indicator for 3rd panel */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            color: (theme) => theme.palette.blue.darkest,
            mt: 4,
          }}
        >
          <ScrollIndicator
            color="currentColor"
            size={28}
            delay={0.5}
            scrollToId="fourth-panel"
          >
            <ArrowHead size={28} style={{ transform: "rotate(90deg)" }} />
          </ScrollIndicator>
        </Box>
      </BasePanel>

      <Spacer height={{ xs: 48, md: 160 }} />

      {/* Fourth panel - California map background with right-aligned text */}
      <BasePanel
        id="fourth-panel"
        fullHeight={false}
        fullWidth
        background="transparent"
        paddingVariant="very-wide"
        includeHeaderSpacing={true}
        sx={{
          background: `url('/images/california.png')`,
          backgroundSize: "contain",
          backgroundPosition: "10% center",
          backgroundRepeat: "no-repeat",
          height: "140vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            width: "100%",
          }}
        >
          {/* Right-aligned text content */}
          <Box
            sx={{
              maxWidth: { xs: "100%", md: "45%" },
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                mb: 3,
              }}
            >
              The scenarios we run cover these areas of California...
            </Typography>

            <Typography variant="body1" sx={{ mb: 2 }}>
              The goal of the COEQWAL project is to make opaque water management
              transparent and accessible.
            </Typography>

            <Typography variant="body1" sx={{ mb: 1 }}>
              On this site you can:
            </Typography>

            <Box component="ul" sx={{ pl: 3, mt: 1 }}>
              <Box component="li" sx={{ mb: 1 }}>
                Explore alternative water management scenarios
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                Understand the trade-offs
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                Use data to advocate for your community
              </Box>
            </Box>

            {/* Scroll indicator for 4th panel */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
                color: (theme) => theme.palette.blue.darkest,
                mt: 4,
              }}
            >
              <ScrollIndicator color="currentColor" size={28} delay={0.5}>
                <ArrowHead size={28} style={{ transform: "rotate(90deg)" }} />
              </ScrollIndicator>
            </Box>
          </Box>
        </Box>
      </BasePanel>
    </Box>
  )
}

export default IntroSection
