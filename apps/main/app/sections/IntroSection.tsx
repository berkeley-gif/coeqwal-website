"use client"

import { useRef, useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useTranslation } from "@repo/i18n"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { motion, useTransform, useScroll } from "@repo/motion"
import {
  ScrollSection,
  useScrollProgress,
  useScrollValue,
  usePanelBoundaries,
} from "@repo/scrollytelling"
import type { PanelBoundaries } from "@repo/scrollytelling"

import VideoHero from "../components/VideoHero"
import FrontmatterPanel from "../components/FrontmatterPanel"
import MorphingHeadline from "../components/MorphingHeadline"
import CategoryCircles from "../components/CategoryCircles"
import type { Category } from "../components/CategoryCircles"
import type { VideoSource } from "../components/VideoHero"
import { ScrollToButton } from "@repo/ui"
import { mapActions, useMapStore } from "../features/map/store"
import { useTabs } from "../context/Tabs"

const VIDEO_SRCS: VideoSource[] = [
  {
    src: "/video/landing-hero-reel.mp4",
    type: "video/mp4",
  },
]

const WATER_CATEGORIES: Category[] = [
  {
    id: "communities",
    label: "Community\nwater systems",
    description:
      "Whether people and communities can reliably access safe, affordable water for daily life, health, and essential services.",
  },
  {
    id: "farms",
    label: "Farms, groundwater\n& food systems",
    description:
      "How water availability supports food production today, while sustaining groundwater and agricultural viability over time.",
  },
  {
    id: "rivers",
    label: "Rivers, salmon\n& ecosystems",
    description:
      "Whether rivers, fish, and ecosystems receive the flows they need to remain functional and resilient.",
  },
  {
    id: "delta",
    label: "The Delta as\na living place",
    description:
      "How water decisions affect the Delta as a place where communities, farms, and ecosystems coexist.",
  },
  {
    id: "climate",
    label: "Climate risk,\nreliability & resilience",
    description:
      "How the water system performs under increasing climate variability, drought risk, and extreme conditions.",
  },
  {
    id: "governance",
    label: "Water governance\n& decision-making",
    description:
      "How evidence, trade-offs, and equity considerations inform water-management decisions.",
  },
]

/** Maps each category to its scenario IDs (deduplicated) */
const CATEGORY_SCENARIOS: Record<string, string[]> = {
  communities: ["s0035", "s0036", "s0037"],
  farms: ["s0011", "s0025", "s0026", "s0027", "s0028"],
  rivers: ["s0030", "s0029", "s0032", "s0031", "s0033", "s0046"],
  delta: [
    "s0040",
    "s0041",
    "s0042",
    "s0039",
    "s0044",
    "s0045",
    "s0028",
    "s0065",
    "s0030",
  ],
  climate: [],
  governance: ["s0020", "s0021", "s0023", "s0024"],
}

const INTRO_TEXT =
  "Water is important to all of us \u2013 from farmers in the Central Valley to communities in the Delta, from salmon in the Sacramento River to urban water users in Los Angeles. We can consider how decisions affect the water issues that people care about."

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
      <Box
        sx={{
          maxWidth: { xs: "100%", sm: "492px" },
          color: theme.palette.text.primary,
        }}
      >
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
 * Same pattern as Panel1Paragraph but with category circles content.
 */
function Panel2Paragraph() {
  const theme = useTheme()
  const progress = useScrollProgress()
  // Enter from below, hold, then exit upward after circles appear
  const yNum = useScrollValue(progress, [0, 0.35, 0.85, 1], [60, 0, 0, -50])
  const y = useTransform(yNum, (v) => `${v}vh`)
  const opacity = useScrollValue(progress, [0, 0.1, 0.85, 1], [0, 1, 1, 0])

  return (
    <motion.div
      style={{
        y,
        opacity,
        gridColumn: 2,
        alignSelf: "start",
      }}
    >
      <Box
        sx={{
          maxWidth: { xs: "100%", sm: "492px" },
          color: theme.palette.text.primary,
        }}
      >
        <Typography variant="displayBody" component="div">
          {INTRO_TEXT}
        </Typography>
      </Box>
    </motion.div>
  )
}

/**
 * Panel2Headline - Exits upward after circles appear.
 */
function Panel2Headline() {
  const theme = useTheme()
  const progress = useScrollProgress()
  const yNum = useScrollValue(progress, [0, 0.85, 1], [0, 0, -50])
  const y = useTransform(yNum, (v) => `${v}vh`)
  const opacity = useScrollValue(progress, [0, 0.85, 1], [1, 1, 0])

  return (
    <motion.div
      style={{
        y,
        opacity,
        gridColumn: 1,
        alignSelf: "start",
      }}
    >
      <Box
        sx={{
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
            sx={{ ...theme.typography.h2Main, display: "block", m: 0 }}
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
    </motion.div>
  )
}

/**
 * Panel3Text - Scroll-linked fade-in headline and paragraph for the scenarios panel.
 * Fades in once Panel 3's top reaches the viewport top (p3.start).
 */
function Panel3Text({
  containerRef,
  boundaries,
}: {
  containerRef: React.RefObject<HTMLElement | null>
  boundaries: PanelBoundaries
}) {
  const theme = useTheme()

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
    layoutEffect: false,
  })

  const p3 = boundaries.panels[3]
  const p3Span = p3 ? p3.end - p3.start : 0.15
  // Fade in well before Panel 3 top reaches viewport top
  const fadeStart = (p3 ? p3.start : 0.848) - p3Span * 0.3
  const fadeEnd = fadeStart + 0.02

  const opacity = useTransform(scrollYProgress, [fadeStart, fadeEnd], [0, 1])

  return (
    <motion.div style={{ opacity }}>
      <Box
        sx={{
          display: { xs: "flex", lg: "grid" },
          gridTemplateColumns: { lg: "3fr 2fr" },
          flexDirection: { xs: "column" },
          gap: { xs: 3, lg: 0 },
          alignItems: { xs: "center", lg: "start" },
          color: theme.palette.text.secondary,
        }}
      >
        {/* Headline block - column 1 */}
        <Box
          sx={{
            gridColumn: { lg: 1 },
            alignSelf: { lg: "start" },
            textAlign: { xs: "center", lg: "left" },
          }}
        >
          <Box
            component="h2"
            sx={{
              ...theme.typography.h5,
              display: "block",
              m: 0,
              color: "inherit",
              fontWeight: 500,
              fontSize: "1.76rem",
            }}
          >
            COEQWAL library of Central Valley
          </Box>
          <Box
            component="span"
            sx={{
              ...theme.typography.h4,
              display: "block",
              m: 0,
              color: "inherit",
              fontWeight: 600,
            }}
          >
            water management scenarios
          </Box>
        </Box>

        {/* Paragraph block - column 2 */}
        <Box
          sx={{
            gridColumn: { lg: 2 },
            alignSelf: { lg: "start" },
            maxWidth: { xs: "540px", lg: "none" },
            textAlign: { xs: "center", lg: "left" },
          }}
        >
          <Typography
            variant="body2"
            component="p"
            sx={{ m: 0, color: "inherit" }}
          >
            COEQWAL has used a computational model called CalSim to run a broad
            range of alternative water management scenarios. These scenarios are
            represented here, clustered according to the issues they address.
          </Typography>
        </Box>
      </Box>
    </motion.div>
  )
}

/**
 * FloatingCategoryCircles - Fixed-position category circles that persist across panels 2-4.
 *
 * Uses DOM-measured panel boundaries (via usePanelBoundaries) instead of hardcoded
 * magic numbers, so thresholds are always correct regardless of viewport size or
 * panel count.
 *
 * Phases:
 * - Stagger in at bottom of viewport during mid Panel 2 (index 2)
 * - Glide upward during Panel 2 → Panel 3 (index 3) transition
 * - Hold in position during Panel 3
 */
function FloatingCategoryCircles({
  containerRef,
  boundaries,
  selectedCategory,
  setSelectedCategory,
}: {
  containerRef: React.RefObject<HTMLElement | null>
  boundaries: PanelBoundaries
  selectedCategory: string | null
  setSelectedCategory: (id: string | null) => void
}) {
  const theme = useTheme()

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
    layoutEffect: false,
  })

  // Panel indices: 0=VideoHero, 1=Panel1, 2=Panel2, 3=Panel3(scenarios), 4=Panel4(actions)
  const p2 = boundaries.panels[2] // Panel 2 (water issues)
  const p3 = boundaries.panels[3] // Panel 3 (scenarios, dark bg)

  // Derive thresholds from measured boundaries
  // Circles appear at mid Panel 2, fully visible slightly after
  const appearStart = p2 ? p2.start + (p2.end - p2.start) * 0.35 : 0.43
  const appearEnd = appearStart + 0.05

  // Stagger reveal completes at ~75% through Panel 2
  const staggerEnd = p2 ? p2.start + (p2.end - p2.start) * 0.75 : 0.66

  // The circles sit at ~50vh from the viewport top. The dark background reaches
  // them before Panel 3's top hits the viewport top. Offset by 33% of Panel 3's
  // height in progress units (circles sit at 33vh).
  const p3Span = p3 ? p3.end - p3.start : 0.15
  const darkBgStart = (p3 ? p3.start : 0.848) - p3Span * 0.33

  // Opacity: invisible before mid Panel 2, stay visible once revealed
  const opacity = useTransform(
    scrollYProgress,
    [0, appearStart, appearEnd],
    [0, 0, 1],
  )

  // Y position: start at bottom (60vh), glide to below text blocks (~33vh) by p3.start,
  // hold at 33vh while lists fade in, then scroll with Panel 3
  const p3Start = p3 ? p3.start : 0.848
  const p3End = p3 ? p3.end : 1.0
  const p3HoldEnd = p3Start + (p3End - p3Start) * 0.4
  const yNum = useTransform(
    scrollYProgress,
    [appearStart, p2 ? p2.mid : 0.62, p3Start, p3HoldEnd, p3End],
    [60, 45, 33, 33, -167],
  )
  const y = useTransform(yNum, (v: number) => `${v}vh`)

  // Pointer events: only interactive when visible
  const pointerEvents = useTransform(opacity, (v: number) =>
    v > 0.5 ? "auto" : "none",
  )

  // Create a MotionValue-based progress for stagger reveal
  const circleProgress = useTransform(
    scrollYProgress,
    [appearStart, staggerEnd],
    [0, 1],
  )

  // Switch stroke color to white when circles cross into Panel 3 (dark background)
  const darkColor = theme.palette.text.primary
  const lightColor = theme.palette.common.white
  const [circleColor, setCircleColor] = useState(darkColor)

  // Show scenario lists after circles hold for a moment (10% into hold period)
  const scenarioThreshold = p3Start + (p3End - p3Start) * 0.1
  const [showScenarios, setShowScenarios] = useState(false)

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      setCircleColor(v >= darkBgStart ? lightColor : darkColor)
      setShowScenarios(v >= scenarioThreshold)
    })
    return unsubscribe
  }, [scrollYProgress, darkColor, lightColor, darkBgStart, scenarioThreshold])

  return (
    <motion.div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        top: 0,
        y,
        opacity,
        pointerEvents,
        zIndex: theme.zIndex.heroContent + 5,
        paddingLeft: showScenarios
          ? theme.spacing(theme.space.section.md)
          : theme.space.panel.padding,
        paddingRight: showScenarios
          ? theme.spacing(theme.space.section.md)
          : theme.space.panel.padding,
        transition: "padding 0.6s ease",
      }}
    >
      <CategoryCircles
        categories={WATER_CATEGORIES}
        selectedId={selectedCategory}
        onSelect={setSelectedCategory}
        progress={circleProgress}
        revealStart={0}
        revealEnd={0.8}
        strokeColor={circleColor}
        scenarioMap={CATEGORY_SCENARIOS}
        showScenarios={showScenarios}
      />
    </motion.div>
  )
}

const IntroSection = () => {
  const theme = useTheme()
  const { t } = useTranslation()
  const introPanelsRef = useRef<HTMLElement>(null)
  const waterIssuesRef = useRef<HTMLDivElement>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Panel refs for DOM-measured scroll boundaries
  const panel1Ref = useRef<HTMLDivElement>(null) // VideoHero
  const panel2Ref = useRef<HTMLDivElement>(null) // Panel 1 (What is COEQWAL)
  const panel3Ref = useRef<HTMLDivElement>(null) // Panel 2 (Water issues)
  const panel4Ref = useRef<HTMLDivElement>(null) // Panel 3 (Scenarios)
  const panel5Ref = useRef<HTMLDivElement>(null) // Panel 4 (Actions)

  // Memoize to avoid recreating the array on every render
  const panelRefs = useMemo(
    () => [panel1Ref, panel2Ref, panel3Ref, panel4Ref, panel5Ref],
    [],
  )
  const boundaries = usePanelBoundaries(introPanelsRef, panelRefs)

  // Switch header text from white to dark when Panel 1 top nears viewport top
  const { setIsHeaderDark } = useTabs()
  useEffect(() => {
    const handleScroll = () => {
      const panel1El = panel2Ref.current // panel2Ref = Panel 1 (What is COEQWAL)
      if (!panel1El) return
      const rect = panel1El.getBoundingClientRect()
      // Switch when Panel 1's top is at or above the viewport top
      setIsHeaderDark(rect.top <= 0)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll() // Check initial state
    return () => window.removeEventListener("scroll", handleScroll)
  }, [setIsHeaderDark])

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
        weights={[1, 1.6, 3, 2, 1]}
        panelBoundaries={boundaries}
        exitRange={
          boundaries.ready && boundaries.panels[2]
            ? [
                // Exit at 85% through Panel 2 (same timing as Panel2Paragraph)
                boundaries.panels[2].start +
                  (boundaries.panels[2].end - boundaries.panels[2].start) *
                    0.85,
                boundaries.panels[2].end,
              ]
            : [0.68, 0.74]
        }
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
        ]}
      />

      {/* Floating category circles - fixed-position overlay that persists across panels 2 and 3 */}
      <FloatingCategoryCircles
        containerRef={introPanelsRef}
        boundaries={boundaries}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* position: relative required for Framer Motion useScroll offset calculations */}
      <Box ref={introPanelsRef} sx={{ position: "relative" }}>
        {/* Video Hero */}
        <div ref={panel1Ref}>
          <VideoHero
            sources={VIDEO_SRCS}
            fallbackImage="/images/home_hero_fallback.png"
            hideHeadline
          />
        </div>

        {/* Frontmatter Panel 1 - scroll choreography with @repo/scrollytelling */}
        <div ref={panel2Ref}>
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
                  <Box
                    component="h2"
                    sx={{ ...theme.typography.h2Main, display: "block", m: 0 }}
                  >
                    What is
                  </Box>
                  <Box
                    component="h1"
                    sx={{ ...theme.typography.h1, display: "block", m: 0 }}
                  >
                    COEQWAL?
                  </Box>
                </Box>
              </Box>

              {/* Paragraph - scroll-linked translateY from below into position */}
              <Panel1Paragraph />
            </Box>
          </ScrollSection>
        </div>

        {/* Frontmatter Panel 2 - scroll choreography with background image */}
        <div ref={panel3Ref}>
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
                {/* Headline - exits upward with paragraph after circles appear */}
                <Panel2Headline />

                {/* Paragraph - scroll-linked */}
                <Panel2Paragraph />

                {/* Category circles moved to FloatingCategoryCircles (fixed-position overlay) */}
              </Box>
            </ScrollSection>
          </div>
        </div>

        {/* Panel 3 - Dark background for floating category circles overlay */}
        <Box
          ref={panel4Ref}
          id="scenarios"
          aria-label="COEQWAL library of Central Valley water management scenarios"
          sx={{
            minHeight: "200vh",
            backgroundColor: theme.palette.brand.panelDark,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            paddingTop: "clamp(90px, 12vh, 140px)",
            paddingBottom: "clamp(80px, calc(16vh - 18px), 160px)",
            paddingLeft: {
              xs: theme.space.panel.padding,
              lg: `${theme.spacing(theme.space.section.md)}`,
            },
            paddingRight: {
              xs: theme.space.panel.padding,
              lg: `${theme.spacing(theme.space.section.md)}`,
            },
          }}
        >
          {/* Headline and paragraph - fade in when panel top reaches viewport top */}
          <Panel3Text containerRef={introPanelsRef} boundaries={boundaries} />

          {/* Scroll-down arrow to Panel 4 */}
          <Box
            sx={{
              position: "absolute",
              bottom: "clamp(16px, 4vh, 40px)",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 2,
            }}
          >
            <ScrollToButton
              scrollToId="site-actions"
              ariaLabel="Scroll to continue"
              color={theme.palette.text.secondary}
              size={52}
            />
          </Box>
        </Box>

        {/* Panel 4 - Learn / Explore / Share actions */}
        <div ref={panel5Ref}>
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
                  "how water in California's Central Valley is managed",
              },
              {
                action: "Explore",
                color: theme.palette.text.secondary,
                description:
                  "how water outcomes shift under different scenarios",
              },
              {
                action: "Share",
                color: theme.palette.text.secondary,
                description: "your insights about California's water future",
              },
            ]}
          />
        </div>
      </Box>
    </Box>
  )
}

export default IntroSection
