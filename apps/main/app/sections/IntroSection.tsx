import { BasePanel, OneColumnPanel, TwoColumnPanel, Spacer, ScrollToButton } from "@repo/ui"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"
import { FloatingAmbientCircles } from "../components/FloatingAmbientCircles"
import { FloatingImageMarkers } from "../components/FloatingImageMarkers"
import { ambientCircles } from "../config/ambientCircles"
import { floatingMarkers } from "../config/floatingMarkers"

const IntroSection = () => {
  const theme = useTheme()
  const { t } = useTranslation()

  return (
    <Box
      sx={{
        background: (theme) => `
            linear-gradient(to bottom, ${theme.palette.brand.sky}, ${theme.palette.brand.water})
          `,
      }}
    >
      {/* Full screen home panel */}
      <TwoColumnPanel
        id="home"
        fullHeight={true}
        fullWidth={true}
        backgroundColor="transparent"
        includeHeaderSpacing={true}
        contentColumn="left"
        contentAlignment={{
          justifyContent: { xs: "flex-end", md: "flex-end", lg: "center" },
          alignItems: "flex-start",
        }}
        sx={{
          position: "relative",

        }}
        leftContent={
          <Box
            sx={{
              width: '100%',
              maxWidth: (theme) => theme.layout.textContainer.maxWidth, // This is setting 
              textAlign: "left",
              zIndex: theme.zIndex.introText,
            }}
          >
            {/* Hero text content */}
            <Typography
              variant="h1"
              component="h1"
              sx={{
                mb: (theme) => theme.layout.spacing.md,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                "& > span": {
                  lineHeight: 1.05, // Match theme h1 lineHeight
                },
              }}
            >
              {t("heroPanel.title")}
            </Typography>

            {/* Body text */}
            <Typography
              variant="body1"
              sx={{
                mb: (theme) => theme.layout.spacing.xl,
              }}
            >
              {t("heroPanel.content")}
            </Typography>

            {/* Arrow positioned at text block midpoint */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: (theme) => theme.layout.spacing.xl,
              }}
            >
              <ScrollToButton
                scrollToId="frontmatter"
                color={theme.palette.blue.darkest}
              />
            </Box>
          </Box>
        }
      >
        {/* Ambient background circles, positioned to cover full viewport */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: { xs: 0, md: "26%" },
            zIndex: theme.zIndex.introBackgroundImages,
            pointerEvents: "none",
          }}
        >
          <FloatingAmbientCircles circles={ambientCircles} zIndex={1} />
        </Box>

        {/* Floating image markers, positioned to cover full viewport */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: { xs: 0, md: "26%" },
            zIndex: theme.zIndex.introForegroundImages,
            pointerEvents: "none",
            transform: { xs: "scale(0.8)", md: "scale(1.20)", lg: "scale(1)" },
            transformOrigin: "top right",
            willChange: "transform",
          }}
        >
          <FloatingImageMarkers
            markers={floatingMarkers}
            showHalos={true}
            zIndex={1}
          />
        </Box>
      </TwoColumnPanel>

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
              California&apos;s Central Valley water depends on two main things:
            </Typography>
            <Box
              component="ol"
              sx={{
                mt: (theme) => theme.layout.spacing.xs,
                mb: (theme) => theme.layout.spacing.sm,
                pl: 3,
              }}
            >
              <Box component="li" sx={{ mb: (theme) => theme.layout.spacing.xs }}>
                <Typography variant="body1">
                  How much rain and snow we get.
                </Typography>
              </Box>
              <Box component="li" sx={{ mb: (theme) => theme.layout.spacing.xs }}>
                <Typography variant="body1">
                  How we choose to manage it.
                </Typography>
              </Box>
            </Box>

            <Typography
              variant="body1"
              sx={{ mb: (theme) => theme.layout.spacing.sm }}
            >
              We already face difficult choices. Climate change brings deeper
              droughts, bigger floods, and growing uncertainty.
            </Typography>

            <Typography variant="body1">
              The COEQWAL (Collaboratory for Equity in Water Allocation) project
              has modeled 30 alternative water management scenarios for the
              Central Valley water systems that supply most of the state. For each
              of these scenarios, we also modeled 5 future climate possibilities.
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
