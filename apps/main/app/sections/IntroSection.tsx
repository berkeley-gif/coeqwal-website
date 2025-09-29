import { OneColumnPanel, ScrollToButton, GlossaryLinkedText } from "@repo/ui"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"
import { useDrawerStore } from "@repo/state"
import { useCallback } from "react"
import CaliforniaMapPanel from "../components/CaliforniaMapPanel"
import MapOverlayPanels from "../components/MapOverlayPanels"
import ProgressiveScenarioPanels from "../components/ProgressiveScenarioPanels"
import { CalSimProvider } from "../components/CalSimContext"

const IntroSection = () => {
  const theme = useTheme()
  const { t } = useTranslation()
  const { setDrawerContent, openDrawer } = useDrawerStore()

  // Handler to open glossary to specific entry
  const handleGlossaryOpen = useCallback(
    (term: string) => {
      setDrawerContent({ selectedTerm: term })
      openDrawer("glossary")
    },
    [setDrawerContent, openDrawer],
  )

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
        <OneColumnPanel
          id="home"
          fullHeight={true}
          fullWidth={true}
          backgroundColor="transparent"
          includeHeaderSpacing={true}
          contentAlignment={{
            justifyContent: "flex-start", 
            alignItems: "center",
          }}
          content={
            <Box
              sx={{
                position: "relative", // Needed for z-index
                zIndex: theme.zIndex.introBubbles,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                height: "100%",
              }}
            >
              {/* Home text content */}
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontSize: "6.5rem",
                  textAlign: "center",
                  fontWeight: 500,
                  width: "1200px", // Fixed width for title to break properly
                  position: "absolute",
                  top: "40%",
                  left: "50%",
                  transform: "translate(-50%, -50%)", // Center the title in viewport
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", // Tring San Francisco on Mac, system fonts elsewhere
                }}
              >
                  {t("homePanel.title")}
                </Typography>

              {/* Body text */}
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, 10vh)", // Position below centered title
                  maxWidth: theme.layout.textContainer.maxWidth, // Optimal width for paragraph reading
                  textAlign: "left", // Left-align text for better readability
                }}
              >
                <Typography
                  variant="body1"
                  sx={(theme) => ({
                    mb: theme.layout.spacing.md, // Spacing before second paragraph
                  })}
                >
                {t("homePanel.content")}
                </Typography>

                <Typography
                  variant="body1"
                  sx={(theme) => ({
                    mb: theme.layout.spacing.xs, // Reduced spacing before arrow from normal
                  })}
                >
                {t("homePanel.callToAction")}
                </Typography>

                {/* Arrow */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    position: "relative", // Ensure proper stacking context
                    zIndex: theme.zIndex.introBubbles + 1, // Above any potential overlapping elements
                    pointerEvents: "auto", // Ensure arrow can receive interactions
                  }}
                >
                  <ScrollToButton
                    scrollToId="frontmatter"
                    color={(theme) => theme.palette.text.primary}
                  />
                </Box>
              </Box>
            </Box>
          }
        >
        </OneColumnPanel>
      </Box>

      {/* Frontmatter panel(s) */}
      <OneColumnPanel
        id="frontmatter"
        fullHeight={true}
        fullWidth
        backgroundColor={theme.palette.brand.sky}
        includeHeaderSpacing={true}
        contentAlignment={{
          justifyContent: "center",
          alignItems: "center",
        }}
        sx={{
          pointerEvents: "auto", // Enables interactions for frontmatter panel, necessary? bc map?
          backgroundImage: `url('/images/intro_collage/riverbank_right_lg.png')`,
          backgroundSize: "38% auto",
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
            {/* <Typography variant="body1" fontWeight={700}>
              {t("frontmatterPanel.boldText")}
            </Typography> */}
            <Typography variant="body1">
              {t("frontmatterPanel.content")}
            </Typography>
            
            <Typography variant="body1">
              <GlossaryLinkedText
                text="Working with communities across California, the COEQWAL team is using CalSim to model 30 alternative ways to manage California's water system. We evaluate these water management strategies under the hydroclimate we've experienced in the recent past and under five additional hydroclimates – patterns of future water availability affected by climate change."
                terms={[
                  { name: "COEQWAL", glossaryTerm: "COEQWAL" },
                  { name: "CalSim", glossaryTerm: "CalSim" },
                  { name: "water management strategies", glossaryTerm: "Operational strategies" },
                  { name: "hydroclimate", glossaryTerm: "Hydroclimate" },
                ]}
                onActivate={handleGlossaryOpen}
                color={theme.palette.text.primary}
                underlineColor={theme.palette.text.primary}
              />
            </Typography>
            
            <Typography variant="body1">
              <GlossaryLinkedText
                text="These scenarios – unique combinations of water management strategies and hydroclimates – provide insight into how our water system works and the trade-offs that exist between goals. By understanding how different decisions affect water allocations for different communities, we can imagine new ways of improving water management in California."
                terms={[
                  { name: "water allocations", glossaryTerm: "Water allocation" },
                ]}
                onActivate={handleGlossaryOpen}
                color={theme.palette.text.primary}
                underlineColor={theme.palette.text.primary}
              />
            </Typography>

            <ScrollToButton
              scrollToId="california-map"
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

        {/* Progressive scenario and climate panels that appear on scroll */}
        <ProgressiveScenarioPanels />
      </CalSimProvider>

{/* Interstitial panel - can be broken out into a component */}
      {/* <OneColumnPanel
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
      /> */}
    </Box>
  )
}

export default IntroSection
