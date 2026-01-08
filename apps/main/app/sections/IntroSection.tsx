import { useRef } from "react"
import { useTranslation } from "@repo/i18n"
import { Box, useTheme } from "@repo/ui/mui"

import VideoHero from "../components/VideoHero"
import FrontmatterPanel from "../components/FrontmatterPanel"
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
          {
            line1: "On this site,",
            line2: "you can",
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
          backgroundColor="#3D7DB5"
          headlineLine1="What is"
          headlineLine2="COEQWAL?"
          bodyText="COEQWAL, the Collaboratory for Equity in Water Allocation, is a publicly-funded project that sheds light on how water is managed in California and how climate change affects our water future. COEQWAL opens California's water planning tools so that communities can meaningfully participate in shaping our water future."
          textColor={theme.palette.common.white}
          hideHeadline
        />

        {/* Frontmatter Panel 2 */}
        <FrontmatterPanel
          id="water-issues"
          ariaLabel="What water issues matter to you"
          backgroundColor="transparent"
          headlineLine1="What water issues"
          headlineLine2="matter to you?"
          bodyText="Water management affects everyone differently. From farmers in the Central Valley to communities in the Delta, from salmon habitats to urban water users, we can explore how different decisions impact different communities."
          textColor={theme.palette.common.white}
          hideHeadline
          displayBlockBackground="rgba(42, 82, 135, 0.75)"
        />

        {/* Frontmatter Panel 3 - Actions variant */}
        <FrontmatterPanel
          id="site-actions"
          ariaLabel="What you can do on this site"
          variant="actions"
          backgroundColor="#193D6B"
          headlineLine1="On this site,"
          headlineLine2="you can"
          textColor={theme.palette.common.white}
          hideHeadline
          actions={[
            {
              action: "Learn",
              color: theme.palette.common.white,
              description:
                "how water in California's Central Valley is managed",
            },
            {
              action: "Explore",
              color: theme.palette.common.white,
              description:
                "how water outcomes shift under different scenarios",
            },
            {
              action: "Share",
              color: theme.palette.common.white,
              description:
                "your insights about California's water future",
            },
          ]}
        />
      </Box>
    </Box>
  )
}

export default IntroSection
