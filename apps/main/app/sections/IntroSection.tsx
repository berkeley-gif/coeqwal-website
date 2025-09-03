import { BasePanel, OneColumnPanel, TwoColumnPanel, Spacer, ScrollToButton } from "@repo/ui"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"
import { motion } from "@repo/motion"
import { BlueThemeBackground } from "../components/BlueThemeBackground"
import { ImageWavePattern } from "../components/ImageWavePattern"

const IntroSection = () => {
  const theme = useTheme()
  const { t } = useTranslation()

  return (
    <Box>
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
        {/* Blue gradient home panel background */}
        <BlueThemeBackground zIndex={theme.zIndex.introBackgroundImages} />
        
        {/* Wave pattern of circle images */}
        <ImageWavePattern 
          imageCount={{ xs: 6, sm: 11, lg: 16 }}
          height="33.33vh"
          zIndex={theme.zIndex.introForegroundImages}
        />

        <TwoColumnPanel
          id="home"
          fullHeight={true}
          fullWidth={true}
          backgroundColor="transparent"
          includeHeaderSpacing={true}
          contentColumn="left"
          contentAlignment={{
            justifyContent: "flex-end", // Text block stays at bottom for all screen sizes for this instance
            alignItems: "flex-start",
          }}
          debug={false} // Debug borders
          leftContent={
            <Box
              sx={{
                zIndex: (theme) => theme.zIndex.introText,
                paddingBottom: { xs: 4, md: 6, lg: 8 }, // Responsive bottom spacing
              }}
            >
              {/* Home text content with fade-in animation */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 2, // Text fade in after wave pattern
                  duration: 1.5,
                  ease: "easeOut"
                }}
              >
                <Typography
                  variant="h1"
                  component="h1"
                  sx={{
                    fontSize: "4.2rem", // I changed the h1 size to fit the longer headline. We could change the type scale to accomodate new content / new layout
                    lineHeight: 1.1,
                    color: (theme) => theme.palette.text.secondary, // white
                    mb: (theme) => theme.layout.spacing.xs,
                    maxWidth: "800px", // For custom title wrap styling in this case
                  }}
                >
                    {t("homePanel.title")}
                  </Typography>

                {/* Body text */}
                <Typography
                  variant="body1"
                  sx={(theme) => ({
                    // mb: theme.layout.spacing.xl, // Theme responsive spacing: 24px/32px/40px
                    color: theme.palette.text.secondary, // white
                    paddingLeft: "0.5rem", // visually match h1 and body1
                  })}
                >
                  {t("homePanel.content")}
                </Typography>

                {/* Arrow positioned at text block midpoint */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mt: (theme) => theme.layout.spacing.sm,  // sm: { xs: 1.5, sm: 2, md: 2.5 }, // 12px / 16px / 20px
                  }}
                >
                  <ScrollToButton
                    scrollToId="frontmatter"
                    color={(theme) => theme.palette.text.secondary}
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
        backgroundColor="transparent"
        textColor={theme.palette.primary.dark}
        includeHeaderSpacing={true}
        contentAlignment={{
          justifyContent: "center",
          alignItems: "center",
        }}
        sx={{
          position: "relative",
          background: `url('/images/intro_collage/riverbank_right_lg.png')`,
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
            }}
          >
            <Typography variant="body1">
              {t("frontmatterPanel.content")}
            </Typography>

            <ScrollToButton
              scrollToId="regions"
              color={theme.palette.overlay.water}
              style={{
                marginTop: "2rem",
                display: "flex",
                justifyContent: "center",
              }}
            />
          </Box>
        }
      />

      <Spacer height={{ xs: 24, md: 48, lg: 64 }} />

      {/* California map background with right-aligned text */}
      <BasePanel
        id="regions"
        fullHeight={false}
        fullWidth
        background="transparent"
        includeHeaderSpacing={true}
        sx={{
          background: `url('/images/california.png')`,
          backgroundSize: "contain",
          backgroundPosition: "10% center",
          backgroundRepeat: "no-repeat",
          height: { xs: "120vh", md: "130vh", lg: "140vh" },
          display: "flex",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            maxWidth: (theme) => theme.layout.textContainer.maxWidth,
            textAlign: "left",
            color: (theme) => theme.palette.blue.darkest,
            ml: "auto", // Keep it right-aligned but not as extreme
            mr: { xs: 2, md: 4 },
          }}
        >
          <Typography
            variant="body1"
            sx={{ mb: (theme) => theme.layout.spacing.md }}
          >
            The scenarios we run cover these areas of California:
          </Typography>

          <Box
            component="ul"
            sx={{ mb: (theme) => theme.layout.spacing.md, pl: 3 }}
          >
            <Box component="li" sx={{ mb: (theme) => theme.layout.spacing.xs }}>
              <Typography variant="body1">Sacramento Valley</Typography>
            </Box>
            <Box component="li" sx={{ mb: (theme) => theme.layout.spacing.xs }}>
              <Typography variant="body1">San Joaquin Valley</Typography>
            </Box>
            <Box component="li" sx={{ mb: (theme) => theme.layout.spacing.xs }}>
              <Typography variant="body1">
                Sacramento-San Joaquin Delta
              </Typography>
            </Box>
            <Box component="li" sx={{ mb: (theme) => theme.layout.spacing.xs }}>
              <Typography variant="body1">Tulare Basin.</Typography>
            </Box>
          </Box>

          <Typography variant="body1">
            The goal of the COEQWAL project is to make opaque water management
            transparent and accessible. On this site you can explore alternative
            water management scenarios, understand the trade-offs, and use data
            to advocate for your community.
          </Typography>

          <ScrollToButton
            scrollToId="content-panels"
            color={theme.palette.overlay.water}
            style={{
              marginTop: "2rem",
              display: "flex",
              justifyContent: "center",
            }}
          />
        </Box>
      </BasePanel>
    </Box>
  )
}

export default IntroSection
