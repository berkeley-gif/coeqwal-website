import { useRef } from "react"
import { useTranslation } from "@repo/i18n"
import { Box, useTheme } from "@repo/ui/mui"

import VideoHero from "../components/VideoHero"
import FrontmatterPanel from "../components/FrontmatterPanel"
import ActionPanel from "../components/ActionPanel"
import MorphingHeadline from "../components/MorphingHeadline"
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
  const introPanelsRef = useRef<HTMLElement>(null)

  return (
    <Box>
      {/* Floating morphing headline - outside container for proper tracking */}
      <MorphingHeadline
        containerRef={introPanelsRef}
        headlines={[
          {
            line1: t("homePanel.titleLine1"),
            line2: t("homePanel.titleLine2"),
            textShadow: true,
          },
          {
            line1: "What is",
            line2: "COEQWAL?",
            textShadow: false,
          },
          {
            line1: "What water issues",
            line2: "matter to you?",
            textShadow: false,
          },
        ]}
      />

      {/* Container for scroll-linked headline animation */}
      <Box ref={introPanelsRef}>
        {/* Video Hero */}
        <VideoHero
          sources={VIDEO_SRCS}
          fallbackImage="/images/home_hero_fallback.png"
          hideHeadline
        />

        {/* Frontmatter Panel 1 */}
        <FrontmatterPanel
          id="intro"
          ariaLabel="What is COEQWAL"
          backgroundColor={theme.palette.blue.medium}
          headlineLine1="What is"
          headlineLine2="COEQWAL?"
          bodyText="COEQWAL &mdash; the Collaboratory for Equity in Water Allocation &mdash; is a publicly-funded project that sheds light on how water is managed in California and how climate change affects our water future. COEQWAL opens California's water planning tools so that communities can meaningfully participate in shaping our water future."
          textColor={theme.palette.common.white}
          hideHeadline
        />

        {/* Frontmatter Panel 2 */}
        <FrontmatterPanel
          id="water-issues"
          ariaLabel="What water issues matter to you"
          backgroundColor={theme.palette.blue.darkest}
          headlineLine1="What water issues"
          headlineLine2="matter to you?"
          bodyText="Water management affects everyone differently. From farmers in the Central Valley to communities in the Bay-Delta, from salmon habitats to urban water users – explore how different decisions impact different stakeholders."
          textColor={theme.palette.common.white}
          hideHeadline
        />
      </Box>

      {/* Action Panel - Site features */}
      <ActionPanel
        id="site-actions"
        ariaLabel="What you can do on this site"
        backgroundColor={theme.palette.grey[900]}
        introText="On this site, you can"
        textColor={theme.palette.common.white}
        actions={[
          {
            action: "Learn",
            color: theme.palette.learn.background,
            description:
              "how water in California's Central Valley is managed",
          },
          {
            action: "Explore",
            color: theme.palette.explore.background,
            description:
              "how water outcomes shift under different scenarios",
          },
          {
            action: "Share",
            color: theme.palette.empower.background,
            description:
              "your insights about California's water future",
          },
        ]}
      />
    </Box>
  )
}

export default IntroSection
