"use client"

import { useRef, useEffect, useState } from "react"
import Link from "next/link"
import { useTranslation } from "@repo/i18n"
import { Box, useTheme, ArrowForwardIcon } from "@repo/ui/mui"

import VideoHero from "../components/VideoHero"
import FrontmatterPanel from "../components/FrontmatterPanel"
import MorphingHeadline from "../components/MorphingHeadline"
import TopicCircles from "../components/TopicCircles"
import type { Topic } from "../components/TopicCircles"
import type { VideoSource } from "../components/VideoHero"
import { mapActions, useMapStore } from "../features/map/store"

const VIDEO_SRCS: VideoSource[] = [
  {
    src: "/video/landing-hero-reel.mp4",
    type: "video/mp4",
  },
]

const WATER_TOPICS: Topic[] = [
  {
    id: "communities",
    label: "Communities and drinking water",
    description:
      "Whether people and communities can reliably access safe, affordable water for daily life, health, and essential services.",
  },
  {
    id: "farms",
    label: "Farms, groundwater and food systems",
    description:
      "How water availability supports food production today, while sustaining groundwater and agricultural viability over time.",
  },
  {
    id: "rivers",
    label: "Rivers, salmon and ecosystems",
    description:
      "Whether rivers, fish, and ecosystems receive the flows they need to remain functional and resilient.",
  },
  {
    id: "delta",
    label: "The Delta as a living place",
    description:
      "How water decisions affect the Delta as a place where communities, farms, and ecosystems coexist.",
  },
  {
    id: "climate",
    label: "Climate risk, reliability and resilience",
    description:
      "How the water system performs under increasing climate variability, drought risk, and extreme conditions.",
  },
  {
    id: "governance",
    label: "Water governance and decision-making",
    description:
      "How evidence, trade-offs, and equity considerations inform water-management decisions.",
  },
]

const INTRO_TEXT =
  "Water is important to all of us \u2013 from farmers in the Central Valley to communities in the Delta, from salmon in the Sacramento River to urban water users in Los Angeles. We can consider how different decisions affect uses of water that people care about."

const IntroSection = () => {
  const theme = useTheme()
  const { t } = useTranslation()
  const introPanelsRef = useRef<HTMLElement>(null)
  const waterIssuesRef = useRef<HTMLDivElement>(null)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

  // Show map when water-issues panel is in viewport
  // This ensures the map is visible when scrolling back up from tabs
  useEffect(() => {
    const waterIssuesEl = waterIssuesRef.current
    if (!waterIssuesEl) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Show the map when water-issues panel comes into view
            // Always check current state (not stale closure) via getState()
            const currentMode = useMapStore.getState().mapMode
            if (currentMode === "hidden") {
              mapActions.setMapMode("learn")
            }
          }
        })
      },
      {
        // Trigger when any part of the panel is visible
        threshold: 0,
        // Start observing slightly before the panel enters viewport
        rootMargin: "100px 0px 0px 0px",
      },
    )

    observer.observe(waterIssuesEl)

    return () => {
      observer.disconnect()
    }
  }, [])

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
            textColor: theme.palette.text.primary,
          },
          {
            line1: "What water issues",
            line2: "matter to you?",
            textShadow: false,
            textColor: theme.palette.text.primary,
          },
          {
            line1: "On this site,",
            line2: "you can",
            textShadow: false,
            textColor: theme.palette.text.secondary,
          },
        ]}
      />

      {/* position: relative required for Framer Motion useScroll offset calculations */}
      <Box ref={introPanelsRef} sx={{ position: "relative" }}>
        {/* Video Hero */}
        <VideoHero
          sources={VIDEO_SRCS}
          fallbackImage="/images/home_hero_fallback.png"
          hideHeadline
        />

        {/* Frontmatter Panel 1 - gradient from panel color to learn background */}
        <Box
          sx={{
            background: `linear-gradient(to bottom, #2a649b, ${theme.palette.learn.background})`,
          }}
        >
        <FrontmatterPanel
          id="intro"
          ariaLabel="What is COEQWAL"
          backgroundColor="transparent"
          headlineLine1="What is"
          headlineLine2="COEQWAL?"
          bodyText={
            <>
              COEQWAL – the Collaboratory for Equity in Water Allocation – is a
              publicly-funded project that works with communities to model
              alternative water management scenarios.
              <br />
              <br />
              To learn more, go to{" "}
              <Link
                href="/about"
                style={{
                  color: "inherit",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                About COEQWAL{" "}
                <ArrowForwardIcon
                  sx={{
                    fontSize: "1.5rem",
                    verticalAlign: "middle",
                    position: "relative",
                    top: "-3px",
                    strokeWidth: 1,
                    stroke: "currentColor",
                  }}
                />
              </Link>
            </>
          }
          textColor={theme.palette.text.primary}
          hideHeadline
        />
        </Box>

        {/* Frontmatter Panel 2 - background image */}
        {/* Wrapper div for IntersectionObserver to detect when this panel is in view */}
        <div ref={waterIssuesRef}>
          <FrontmatterPanel
            id="water-issues"
            ariaLabel="What water issues matter to you"
            backgroundColor={theme.palette.learn.background}
            backgroundImage="/images/about/tiered-image-text-hills.png"
            backgroundPosition="center bottom"
            backgroundSize="100% 40%"
            headlineLine1="What water issues"
            headlineLine2="matter to you?"
            bodyText={
              <>
                <Box>
                  {WATER_TOPICS.find((t) => t.id === selectedTopic)
                    ?.description || INTRO_TEXT}
                </Box>
                <TopicCircles
                  topics={WATER_TOPICS}
                  selectedId={selectedTopic}
                  onSelect={setSelectedTopic}
                />
              </>
            }
            textColor={theme.palette.text.primary}
            hideHeadline
            scrollToId="site-actions"
          />
        </div>

        {/* Frontmatter Panel 3 - Actions variant */}
        <FrontmatterPanel
          id="site-actions"
          ariaLabel="What you can do on this site"
          variant="actions"
          backgroundColor={theme.palette.brand.panelDark}
          headlineLine1="On this site,"
          headlineLine2="you can"
          textColor={theme.palette.text.secondary}
          hideHeadline
          scrollToId="tabs"
          actions={[
            {
              action: "Learn",
              color: theme.palette.text.secondary,
              description:
                "how water in California\u2019s Central Valley is managed",
            },
            {
              action: "Explore",
              color: theme.palette.text.secondary,
              description: "how water outcomes shift under different scenarios",
            },
            {
              action: "Share",
              color: theme.palette.text.secondary,
              description: "your insights about California\u2019s water future",
            },
          ]}
        />
      </Box>
    </Box>
  )
}

export default IntroSection
