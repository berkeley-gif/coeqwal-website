import { Box, useTheme } from "@repo/ui/mui"

import VideoHero from "../components/VideoHero"
import FrontmatterPanel from "../components/FrontmatterPanel"
import type { VideoSource } from "../components/VideoHero"

const VIDEO_SRCS: VideoSource[] = [
  {
    src: "/video/landing-hero-reel.mp4",
    type: "video/mp4",
  },
]

const IntroSection = () => {
  const theme = useTheme()

  return (
    <Box>
      {/* Video Hero */}
      <VideoHero
        sources={VIDEO_SRCS}
        fallbackImage="/images/home_hero_fallback.png"
      />

      {/* Frontmatter Panel */}
      <FrontmatterPanel
        id="intro"
        ariaLabel="What is COEQWAL"
        backgroundColor={theme.palette.brand.sky}
        headlineLine1="What is"
        headlineLine2="COEQWAL?"
        bodyText="COEQWAL – the Collaboratory for Equity in Water Allocation – is a publicly-funded project that sheds light on how water is managed in California and how climate change affects our water future. COEQWAL opens California's water planning tools so that communities can meaningfully participate in shaping our water future."
        textColor={theme.palette.common.white}
      />

      {/*       <OneColumnPanel
        id="scenariosIntro"
        fullHeight={false}
        fullWidth
        includeHeaderSpacing={false}
        backgroundColor={theme.palette.blue.darkest}
        contentAlignment={{
          justifyContent: "center",
          alignItems: "center",
        }}
        content={
          <Box
            sx={{
              maxWidth: { md: "50%", lg: "60%", xl: "40%" },
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              color: (theme) => theme.palette.common.white,
              margin: "200px 0",
              gap: "40px",
            }}
          >
            <Typography variant="body1" sx={{ flex: "1" }}>
              <GlossaryLinkedText
                text="
                    We evaluate unique water management strategies under the hydroclimate we've 
                    experienced in the recent past and hydroclimates we may experience in the future as 
                    the climate changes.
                  "
                terms={[
                  {
                    name: "water management strategies",
                    glossaryTerm: "Water management strategies",
                  },
                  {
                    name: "hydroclimate",
                    glossaryTerm: "Hydroclimate",
                  },
                ]}
                onActivate={handleGlossaryOpen}
                color={theme.palette.common.white}
                underlineColor={theme.palette.common.white}
              />
            </Typography>
            <Typography variant="body1" sx={{ flex: "2" }}>
              <GlossaryLinkedText
                text="
                    These scenarios – unique combinations of water management strategies and hydroclimates 
                    – provide insight into how our water system works and the trade-offs that exist between goals. 
                    By understanding how different decisions affect outcomes for different 
                    water users, we can help to imagine new ways of improving water management in California.
                  "
                terms={[
                  {
                    name: "scenarios",
                    glossaryTerm: "Scenarios",
                  },
                  {
                    name: "outcomes",
                    glossaryTerm: "Scenario outcomes",
                  },
                ]}
                onActivate={handleGlossaryOpen}
                color={theme.palette.common.white}
                underlineColor={theme.palette.common.white}
              />
            </Typography>
          </Box>
        }
      /> */}

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
              maxWidth: (theme) => theme.layout.maxWidth.lg,
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
