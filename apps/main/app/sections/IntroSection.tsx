"use client"

import { useRef, useEffect, useState } from "react"
import Link from "next/link"
import { useTranslation } from "@repo/i18n"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { motion, useTransform } from "@repo/motion"
import { ScrollSection, useScrollProgress, useScrollValue } from "@repo/scrollytelling"

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
    label: "Community water systems",
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

/**
 * Panel1Paragraph - Scroll-linked paragraph for frontmatter panel 1.
 * Must be inside a ScrollSection. Starts 100% below its position and
 * translates up to 0 as the user scrolls through the first half of the section.
 */
function Panel1Paragraph() {
  const theme = useTheme()
  const progress = useScrollProgress()
  // Translate from below into final position, then hold
  // Spread over 70% of scroll for gentle pacing
  const yNum = useScrollValue(progress, [0, 0.7, 1], [60, 0, 0])
  const y = useTransform(yNum, (v) => `${v}vh`)
  const opacity = useScrollValue(progress, [0, 0.15, 1], [0, 1, 1])

  return (
    <motion.div
      style={{
        y,
        opacity,
        gridColumn: 2,
        alignSelf: "start",
      }}
    >
      <Box sx={{ maxWidth: { xs: "100%", sm: "492px" }, color: theme.palette.text.primary }}>
        <Typography variant="displayBody" component="div">
          COEQWAL – the Collaboratory for Equity in Water Allocation – is a
          publicly-funded project that works with communities to model
          alternative water management scenarios.
          <br />
          <br />
          To learn more, see{" "}
          <Link
            href="/about"
            style={{
              color: "inherit",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            About COEQWAL{"."}
          </Link>
        </Typography>
      </Box>
    </motion.div>
  )
}

/**
 * Panel2Paragraph - Scroll-linked paragraph for frontmatter panel 2.
 * Same pattern as Panel1Paragraph but with topic circles content.
 */
function Panel2Paragraph({
  selectedTopic,
}: {
  selectedTopic: string | null
}) {
  const theme = useTheme()
  const progress = useScrollProgress()
  const yNum = useScrollValue(progress, [0, 0.35, 1], [60, 0, 0])
  const y = useTransform(yNum, (v) => `${v}vh`)
  const opacity = useScrollValue(progress, [0, 0.1, 1], [0, 1, 1])

  return (
    <motion.div
      style={{
        y,
        opacity,
        gridColumn: 2,
        alignSelf: "start",
      }}
    >
      <Box sx={{ maxWidth: { xs: "100%", sm: "492px" }, color: theme.palette.text.primary }}>
        <Typography variant="displayBody" component="div">
          {WATER_TOPICS.find((t) => t.id === selectedTopic)?.description ||
            INTRO_TEXT}
        </Typography>
      </Box>
    </motion.div>
  )
}

/**
 * Panel2TopicCircles - Scroll-linked staggered reveal of topic circles.
 * Must be inside Panel 2's ScrollSection. Spans full width at the bottom.
 */
function Panel2TopicCircles({
  selectedTopic,
  setSelectedTopic,
}: {
  selectedTopic: string | null
  setSelectedTopic: (id: string | null) => void
}) {
  const progress = useScrollProgress()

  return (
    <Box
      sx={{
        gridColumn: { lg: "1 / -1" },
        alignSelf: "end",
        pointerEvents: "auto",
      }}
    >
      <TopicCircles
        topics={WATER_TOPICS}
        selectedId={selectedTopic}
        onSelect={setSelectedTopic}
        progress={progress}
        revealStart={0.4}
        revealEnd={0.9}
      />
    </Box>
  )
}

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
        weights={[1, 1.6, 3, 1]}
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

        {/* Frontmatter Panel 1 - scroll choreography with @repo/scrollytelling */}
        <ScrollSection
          height="160vh"
          id="intro"
          ariaLabel="What is COEQWAL"
          style={{
            background: `linear-gradient(to bottom, #2a649b, #D5EAF5)`,
          }}
        >
          {/* Sticky viewport - pins 100vh content while scrolling through 200vh section */}
          <Box
            sx={{
              position: "sticky",
              top: 0,
              height: "100vh",
              overflow: "hidden",
              display: { xs: "flex", lg: "grid" },
              gridTemplateColumns: { lg: "3fr 2fr" },
              flexDirection: { xs: "column" },
              justifyContent: { xs: "space-between" },
              paddingTop: theme.space.panel.topOffset,
              paddingBottom: "clamp(146px, calc(26vh - 18px), 270px)",
              paddingLeft: theme.space.panel.padding,
              paddingRight: theme.space.panel.padding,
              pointerEvents: "auto",
            }}
          >
            {/* Headline - column 1 (hidden on lg, MorphingHeadline handles it) */}
            <Box
              sx={{
                gridColumn: { lg: 1 },
                alignSelf: { xs: "stretch", lg: "start" },
                display: { xs: "flex", lg: "none" },
                justifyContent: { xs: "center", lg: "flex-start" },
              }}
            >
              <Box
                sx={{
                  color: theme.palette.text.primary,
                  fontSize: theme.typography.h1.fontSize,
                  maxWidth: "16ch",
                  textAlign: { xs: "center", lg: "left" },
                }}
              >
                <Box component="h2" sx={{ ...theme.typography.h2Main, display: "block", m: 0 }}>
                  What is
                </Box>
                <Box component="h1" sx={{ ...theme.typography.h1, display: "block", m: 0 }}>
                  COEQWAL?
                </Box>
              </Box>
            </Box>

            {/* Paragraph - scroll-linked translateY from below into position */}
            <Panel1Paragraph />
          </Box>
        </ScrollSection>

        {/* Frontmatter Panel 2 - scroll choreography with background image */}
        <div ref={waterIssuesRef}>
          <ScrollSection
            height="300vh"
            id="water-issues"
            ariaLabel="What water issues matter to you"
            style={{
              backgroundColor: theme.palette.learn.background,
            }}
          >
            {/* Sticky viewport */}
            <Box
              sx={{
                position: "sticky",
                top: 0,
                height: "100vh",
                overflow: "hidden",
                backgroundColor: theme.palette.learn.background,
                backgroundImage:
                  "url(/images/about/tiered-image-text-hills.png)",
                backgroundPosition: "center bottom",
                backgroundSize: "100% 30%",
                backgroundRepeat: "no-repeat",
                display: { xs: "flex", lg: "grid" },
                gridTemplateColumns: { lg: "3fr 2fr" },
                flexDirection: { xs: "column" },
                justifyContent: { xs: "space-between" },
                paddingTop: theme.space.panel.topOffset,
                paddingBottom: "clamp(146px, calc(26vh - 18px), 270px)",
                paddingLeft: theme.space.panel.padding,
                paddingRight: theme.space.panel.padding,
                pointerEvents: "auto",
              }}
            >
              {/* Headline - column 1 (hidden on lg, MorphingHeadline handles it) */}
              <Box
                sx={{
                  gridColumn: { lg: 1 },
                  alignSelf: { xs: "stretch", lg: "start" },
                  display: { xs: "flex", lg: "none" },
                  justifyContent: { xs: "center", lg: "flex-start" },
                }}
              >
                <Box
                  sx={{
                    color: theme.palette.text.primary,
                    fontSize: theme.typography.h1.fontSize,
                    maxWidth: "16ch",
                    textAlign: { xs: "center", lg: "left" },
                  }}
                >
                  <Box
                    component="h2"
                    sx={{
                      ...theme.typography.h2Main,
                      display: "block",
                      m: 0,
                    }}
                  >
                    What water issues
                  </Box>
                  <Box
                    component="h1"
                    sx={{ ...theme.typography.h1, display: "block", m: 0 }}
                  >
                    matter to you?
                  </Box>
                </Box>
              </Box>

              {/* Paragraph - scroll-linked */}
              <Panel2Paragraph
                selectedTopic={selectedTopic}
              />

              {/* Topic circles - staggered reveal, spans full width */}
              <Panel2TopicCircles
                selectedTopic={selectedTopic}
                setSelectedTopic={setSelectedTopic}
              />
            </Box>
          </ScrollSection>
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
