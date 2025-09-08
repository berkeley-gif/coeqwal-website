import { OneColumnPanel, ScrollToButton } from "@repo/ui"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"
import { motion } from "@repo/motion"
import { ImageWavePattern } from "../components/ImageWavePattern"
import CaliforniaMapPanel from "../components/CaliforniaMapPanel"
import MapOverlayPanels from "../components/MapOverlayPanels"
import { CalSimProvider } from "../components/CalSimContext"

const IntroSection = () => {
  const theme = useTheme()
  const { t } = useTranslation()

  return (
    <Box sx={{ pointerEvents: "none" }}>
      {/* Home panel (could be its own component) */}
      <Box
        sx={{
          background: (theme) => `
              linear-gradient(to bottom, ${theme.palette.brand.sky}, ${theme.palette.brand.water})
            `,
          position: "relative",
          height: "100vh",
        }}
      >
        {/* Wave pattern of circle images */}
        <ImageWavePattern
          imageCount={{ xs: 6, sm: 11, lg: 16 }}
          height="33.33vh"
          zIndex={theme.zIndex.introForegroundImages}
        />

        <OneColumnPanel
          id="home"
          fullHeight={true}
          fullWidth={true}
          backgroundColor="transparent"
          includeHeaderSpacing={true}
          textColor={theme.palette.blue.darkest}
          sx={{ pointerEvents: "auto" }} // Enables interactions for home panel
          contentAlignment={{
            justifyContent: { xs: "center", md: "flex-end", lg: "flex-end" }, // Text block stays at bottom for all screen sizes for this instance
            alignItems: "center",
          }}
          content={
            <Box
              sx={{
                zIndex: (theme) => theme.zIndex.introText,
                paddingBottom: { xs: 4, md: 6, lg: 8 },
                paddingLeft: { xs: 9, md: 18, lg: 35, xl: 45 }, // Responsive padding
                paddingRight: { xs: 9, md: 18, lg: 35, xl: 45 }, // Responsive padding
                maxWidth: "1500px",
                textAlign: "center",
              }}
            >
              {/* Home text content with fade-in animation */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 2, // Text fade in after wave pattern
                  duration: 1.5,
                  ease: "easeOut",
                }}
              >
                <Typography
                  variant="h1"
                  component="h1"
                  sx={{
                    fontSize: "4.2rem", // I changed the h1 size to fit the longer headline. We could change the type scale to accomodate new content / new layout
                    lineHeight: 1.1,
                    color: (theme) => theme.palette.blue.darkest, // blue dark
                    mb: (theme) => theme.layout.spacing.xs,
                    mt: { xs: "40vh", lg: "0" },
                  }}
                >
                  {t("homePanel.title")}
                </Typography>

                {/* Body text */}
                <Typography
                  variant="body1"
                  sx={{
                    // mb: theme.layout.spacing.xl, // Theme responsive spacing: 24px/32px/40px
                    color: (theme) => theme.palette.blue.darkest, // blue dark
                  }}
                >
                  {t("homePanel.content")}
                </Typography>

                {/* Arrow positioned at text block midpoint */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mt: (theme) => theme.layout.spacing.sm, // sm: { xs: 1.5, sm: 2, md: 2.5 }, // 12px / 16px / 20px
                  }}
                >
                  <ScrollToButton
                    scrollToId="frontmatter"
                    color={(theme) => theme.palette.blue.darkest}
                  />
                </Box>
              </motion.div>
            </Box>
          }
        />
      </Box>

      {/* Note: Original clustered image circles saved in ClusteredImageCircles.tsx for reuse if wanted */}

      {/* Frontmatter panel(s) */}
      <OneColumnPanel
        id="frontmatter"
        fullHeight={true}
        fullWidth
        backgroundColor={theme.palette.nature.earth}
        textColor={theme.palette.blue.darkest}
        includeHeaderSpacing={true}
        contentAlignment={{
          justifyContent: "center",
          alignItems: "center",
        }}
        sx={{
          pointerEvents: "auto", // Enables interactions for frontmatter panel
          position: "relative",
          backgroundImage: `url('/images/intro_collage/riverbank_right_lg.png')`,
          backgroundSize: "40% auto",
          backgroundPosition: "bottom right",
          backgroundRepeat: "no-repeat",
        }}
        content={
          <Box
            sx={{
              width: "100%",
              maxWidth: (theme) => theme.layout.textContainer.maxWidth,
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <Typography variant="body1" fontWeight="bold">
              {t("frontmatterPanel.boldText")}
            </Typography>
            <Typography variant="body1">
              {t("frontmatterPanel.content")}
            </Typography>

            <ScrollToButton
              scrollToId="california-map"
              color={theme.palette.blue.darkest}
              style={{
                marginTop: "2rem",
                display: "flex",
                justifyContent: "center",
              }}
            />
          </Box>
        }
      />

      {/* CalSim context provider for shared state between map and overlays */}
      <CalSimProvider>
        {/* Sticky California map background */}
        <CaliforniaMapPanel id="california-map" />

        {/* Scrolling overlay panels over the sticky map */}
        <MapOverlayPanels />
      </CalSimProvider>

      {/* Interstitial panel - can be broken out into a component */}
      <OneColumnPanel
        id="interstitial"
        fullHeight={false}
        fullWidth
        backgroundColor={theme.palette.brand.sky}
        textColor={theme.palette.text.secondary}
        includeHeaderSpacing={true}
        sx={{ pointerEvents: "auto" }} // Enables interactions for interstitial panel
        contentAlignment={{
          justifyContent: "center",
          alignItems: "center",
        }}
        content={
          <Box
            sx={{
              width: "100%",
              maxWidth: (theme) => theme.layout.textContainer.maxWidth,
              textAlign: "left",
            }}
          >
            <Typography variant="body1">
              {t("interstitialPanel.content")}
            </Typography>

            <ScrollToButton
              scrollToId="content-panels"
              color={theme.palette.blue.darkest}
              style={{
                marginTop: "2rem",
                display: "flex",
                justifyContent: "center",
              }}
            />
          </Box>
        }
      />
    </Box>
  )
}

export default IntroSection
