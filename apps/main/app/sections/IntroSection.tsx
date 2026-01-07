import { OneColumnPanel, GlossaryLinkedText } from "@repo/ui"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"
import { useDrawerStore } from "@repo/state/drawer"
import { useCallback } from "react"
import { motion } from "@repo/motion"

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

  const slideIn = {
    hidden: { opacity: 0, x: -24, filter: "blur(6px)" },
    show: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  const slideInRight = {
    hidden: { opacity: 0, x: 24, filter: "blur(6px)" },
    show: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: "easeOut", delay: 0.12 },
    },
  }

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
          backgroundPosition: "right bottom",
          backgroundRepeat: "no-repeat",
          paddingLeft: "300px",
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
            <Box
              sx={{
                width: "100%",
                textAlign: "left",
                display: "flex",
                flexDirection: "row",
                gap: "20px",
              }}
            >
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: false, amount: 0.3 }}
                variants={slideIn}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: theme.typography.fontWeightBold,
                    maxWidth: "80%",
                  }}
                >
                  {t("frontmatterPanel.boldText")}
                </Typography>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: false, amount: 0.3 }}
                variants={slideInRight}
              >
                <Typography variant="body1">
                  <GlossaryLinkedText
                    text="Working with communities across California, COEQWAL uses a water planning tool developed by government agencies, to explore alternative ways to manage California's water system. Until now, this tool has been inaccessible to most communities, creating barriers to participation in water planning and decision-making."
                    terms={[
                      { name: "CalSim", glossaryTerm: "CalSim" },
                      {
                        name: "water management strategies",
                        glossaryTerm: "Water management strategies",
                      },
                      { name: "hydroclimate", glossaryTerm: "Hydroclimate" },
                    ]}
                    onActivate={handleGlossaryOpen}
                    color={theme.palette.text.primary}
                    underlineColor={theme.palette.text.primary}
                  />
                </Typography>
              </motion.div>
            </Box>
          </Box>
        }
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
