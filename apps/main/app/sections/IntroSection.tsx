import { OneColumnPanel, ScrollToButton, GlossaryLinkedText } from "@repo/ui"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"
import { useDrawerStore } from "@repo/state"
import { useCallback } from "react"

import VideoHero from "../components/VideoHero"
import type { VideoSource } from "../components/VideoHero"

const VIDEO_SRCS: VideoSource[] = [
  {
    src: '/video/landing-hero-reel.mp4',
    type: 'video/mp4',
  }
]

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
    <Box>
      {/* Video Hero */}
      <VideoHero
        sources={VIDEO_SRCS}
        fallbackImage='/images/home_hero_fallback.png'
      />

      {/* Frontmatter panel(s) */}
      <OneColumnPanel
        id="frontmatter"
        fullHeight={true}
        fullWidth
        backgroundColor={theme.palette.brand.sky}
        includeHeaderSpacing={false}
        contentAlignment={{
          justifyContent: "center",
          alignItems: "flex-start",
        }}
        sx={{
          pointerEvents: "auto", // Enables interactions for frontmatter panel, necessary? bc map?
          backgroundImage: `url('/images/intro_collage/riverbank_right_lg.png')`,
          backgroundSize: "38% auto",
          backgroundPosition: "right 80px",
          backgroundRepeat: "no-repeat",
          paddingLeft: "300px"
        }}
        content={
          <Box
            sx={{
              width: "100%",
              maxWidth: "70%",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: "60px",
            }}
          >
            <Typography fontWeight={700} variant="body1" style={{ fontSize: '1.5rem', maxWidth: '80%' }}>
              {t("frontmatterPanel.boldText")}
            </Typography>

            <Box
              sx={{
                width: "100%",
                textAlign: "left",
                display: "flex",
                flexDirection: "row",
                gap: "20px",
              }}
            >
              <Typography variant="body1">
                <GlossaryLinkedText
                  text="Working with communities across California, COEQWAL uses a water planning tool developed by government agencies, to explore alternative ways to manage California's water system. Until now, this tool has been inaccessible to most communities, creating barriers to participation in water planning and decision-making."
                  terms={[
                    { name: "COEQWAL", glossaryTerm: "COEQWAL" },
                    { name: "CalSim", glossaryTerm: "CalSim" },
                    {
                      name: "water management strategies",
                      glossaryTerm: "Operational strategies",
                    },
                    { name: "hydroclimate", glossaryTerm: "Hydroclimate" },
                  ]}
                  onActivate={handleGlossaryOpen}
                  color={theme.palette.text.primary}
                  underlineColor={theme.palette.text.primary}
                />
              </Typography>

              <Typography variant="body1">
                <GlossaryLinkedText
                  text="
                    We evaluate these unique water management strategies under the hydroclimate we've 
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
                      glossaryTerm: "Hydroclimate"
                    }
                  ]}
                  onActivate={handleGlossaryOpen}
                  color={theme.palette.text.primary}
                  underlineColor={theme.palette.text.primary}
                />
              </Typography>
            </Box>
          </Box>
        }
      />

      <OneColumnPanel
        id="scenariosIntro"
        fullHeight={false}
        fullWidth
        includeHeaderSpacing={false}
        backgroundColor={theme.palette.blue.medium}
        contentAlignment={{
          justifyContent: "center",
          alignItems: "center",
        }}
        content={
          <Box
            sx={{
              maxWidth: "50%",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              color: (theme) => theme.palette.utility.white,
              margin: "100px 0"
            }}
          >
            <Typography variant="body1">
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
                    glossaryTerm: "Water allocations"
                  }
                ]}
                onActivate={handleGlossaryOpen}
                color={theme.palette.utility.white}
                underlineColor={theme.palette.utility.white}
              />
            </Typography>
          </Box>
        }
      />

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
