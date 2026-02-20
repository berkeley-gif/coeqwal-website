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
  useMeetingProgress,
  easeOut,
} from "@repo/scrollytelling"
import type { PanelBoundaries } from "@repo/scrollytelling"

import { WATER_THEMES, THEME_SCENARIOS } from "@repo/data/coeqwal"
import VideoHero from "../components/VideoHero"
import MorphingHeadline from "../components/MorphingHeadline"
import CategoryCircles from "../components/CategoryCircles"
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

const INTRO_TEXT =
  "Water is important to all of us \u2013 from farmers in the Central Valley to communities in the Delta, from salmon in the Sacramento River to urban water users in Los Angeles. We can consider how decisions affect the water issues that people care about."

/** Fraction of a panel's scroll range where the paragraph reaches full opacity / Y=0. */
const PARA_APPEAR = 0.2
/** Fraction of a panel's scroll range where the paragraph begins to leave. */
const PARA_LEAVE = 0.8
/** Pixels the MorphingHeadline shifts upward (shiftAmount) to make room for circles.
 *  Panel 4's sticky viewport subtracts this so its paragraph stays aligned with the headline. */
const HEADLINE_SHIFT_PX = 100

/** Panel 4 outer container height (scroll runway). */
const PANEL4_HEIGHT_VH = 300
/** Sticky viewport height (always 100vh). */
const PANEL4_STICKY_VH = 100
/**
 * Local-progress fraction at which Panel 4's sticky viewport releases.
 * = 1 − sticky_height / container_height = 1 − 100/300 ≈ 0.667.
 * The MorphingHeadline and the paragraph both start their upward exit at this moment.
 */
const PANEL4_STICKY_RELEASE = 1 - PANEL4_STICKY_VH / PANEL4_HEIGHT_VH

/**
 * Panel1Paragraph - Scroll-linked paragraph for frontmatter panel 1.
 * Must be inside a ScrollSection. Starts 100% below its position and
 * translates up to 0 as the user scrolls through the first half of the section.
 */
function Panel1Paragraph() {
  const theme = useTheme()
  const progress = useScrollProgress()
  // Approach (0-25%): easeOut
  // Stick (25-75%): ~110vh of scroll runway
  // Leave (75-100%): easeIn
  const yNum = useScrollValue(progress, [0, PARA_APPEAR, PARA_LEAVE, 1], [30, 0, 0, -30], {
    ease: easeOut,
  })
  const y = useTransform(yNum, (v) => `${v}vh`)
  const opacity = useScrollValue(progress, [0, PARA_APPEAR, PARA_LEAVE, 1], [0, 1, 1, 0], {
    ease: easeOut,
  })

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
          COEQWAL &mdash; the Collaboratory for Equity in Water Allocation &mdash; is a
          publicly-funded project that works with communities to model
          alternative water management scenarios for California&apos;s Central Valley.
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
  // Approach (0-25%): eased entry over ~95vh.
  // Stick (25-50%): fully visible ~95vh before circles appear.
  // Shift (50-60%): paragraph shifts up slightly as circles glide in (~38vh).
  // Hold with circles (60-82%): ~84vh of co-visibility.
  // Leave (82-100%): eased exit (~68vh).
  const yNum = useScrollValue(
    progress,
    [0, 0.25, 0.5, 0.6, 0.82, 1],
    [30, 0, 0, -12, -12, -30],
    { ease: easeOut },
  )
  const y = useTransform(yNum, (v) => `${v}vh`)
  const opacity = useScrollValue(progress, [0, 0.15, 0.82, 1], [0, 1, 1, 0], {
    ease: easeOut,
  })

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
  // Hold, shift up ~100px for circles, hold with circles, then exit
  const yNum = useScrollValue(progress, [0, 0.5, 0.6, 0.85, 1], [0, 0, -12, -12, -30])
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
  const p3Start = p3 ? p3.start : 0.848
  const p3End = p3 ? p3.end : 1.0

  // Remap global scroll progress to a 0→1 local progress for Panel 4
  const localProgress = useTransform(scrollYProgress, [p3Start, p3End], [0, 1])

  // Start the fade at PANEL4_STICKY_RELEASE (≈0.667) — the same moment the CSS sticky
  // viewport physically releases and the paragraph begins scrolling upward.
  // Synchronizing the opacity fade with the scroll onset prevents the jarring gap
  // where the paragraph is already moving but still fully opaque.
  const opacity = useScrollValue(
    localProgress,
    [0, PARA_APPEAR, PANEL4_STICKY_RELEASE, 1],
    [0, 1, 1, 0],
    { ease: easeOut },
  )

  return (
    <motion.div
      style={{ opacity, gridColumn: 2, alignSelf: "start" }}
    >
      <Box
        sx={{
          maxWidth: { xs: "540px", lg: "none" },
          textAlign: { xs: "center", lg: "left" },
          color: theme.palette.text.secondary,
        }}
      >
        <Typography variant="displayBody" component="p">
          COEQWAL uses a computational model called CalSim to run a broad
          range of alternative water management scenarios for California&rsquo;s
          Central Valley water. These scenarios are represented here, clustered
          according to the issues they address.
        </Typography>
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
  selectedTheme,
  setSelectedTheme,
}: {
  containerRef: React.RefObject<HTMLElement | null>
  boundaries: PanelBoundaries
  selectedTheme: string | null
  setSelectedTheme: (id: string | null) => void
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
  const p4 = boundaries.panels[4] // Panel 4 (site-actions) — circles borrow this for exit

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

  // Y/exit thresholds derived from measured boundaries
  const p3Start = p3 ? p3.start : 0.848
  const p3End = p3 ? p3.end : 1.0
  const p3Mid = p3Start + (p3End - p3Start) * 0.5
  // Hold at 50vh until sticky releases and headline/paragraph scroll off (PANEL4_STICKY_RELEASE ≈ 0.667).
  const p3StickyRelease = p3Start + (p3End - p3Start) * PANEL4_STICKY_RELEASE
  // Float finishes at 0.85: circles glide 30vh over ~55vh of scroll (≈ 0.55× natural
  // scroll speed), which eliminates the abrupt "pop" a short range causes.
  const p3ListsUp = p3Start + (p3End - p3Start) * 0.85

  // Circles drift slowly upward through Panel 5.  Borrowing Panel 5's scroll runway
  // keeps the post-sticky-release runway constraint (always 100vh) from rushing the exit.
  const p4Start = p4 ? p4.start : p3End
  const p4Span = p4 ? p4.end - p4.start : 0.18
  // Opacity fades over the last 20% of Panel 5's progress range.
  // Cap at 0.99 so the fade always completes before the scroll container ends.
  const p4ExitStart = p4Start + p4Span * 0.42
  const p4ExitEnd = Math.min(p4Start + p4Span * 0.62, 0.99)

  // Opacity: fade in at appear, stay fully opaque while drifting, fade during Panel 5 exit
  const opacity = useTransform(
    scrollYProgress,
    [0, appearStart, appearEnd, p4ExitStart, p4ExitEnd],
    [0, 0, 1, 1, 0],
  )

  // Y: glide in → arrive at midscreen → hold while headline visible → sticky releases →
  // slow float to 20vh → immediately begin slow drift upward (no hold plateau) → off screen.
  const yNum = useTransform(
    scrollYProgress,
    [appearStart, p2 ? p2.mid : 0.62, p3Mid, p3StickyRelease, p3ListsUp, p4ExitEnd],
    [60,          45,                  50,    50,               20,         -100     ],
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

  // Reveal lists exactly when circles settle at their final Y position (p3ListsUp).
  // This is after PANEL4_STICKY_RELEASE (≈0.667), so the headline and paragraph
  // have already scrolled off screen before the lists appear.
  const scenarioThreshold = p3ListsUp
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
        paddingLeft: theme.space.panel.padding,
        paddingRight: theme.space.panel.padding,
      }}
    >
      <CategoryCircles
        categories={WATER_THEMES}
        selectedId={selectedTheme}
        onSelect={setSelectedTheme}
        progress={circleProgress}
        revealStart={0}
        revealEnd={0.8}
        strokeColor={circleColor}
        scenarioMap={THEME_SCENARIOS}
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
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)

  // Panel refs for DOM-measured scroll boundaries
  const panel1Ref = useRef<HTMLDivElement>(null) // VideoHero
  const panel2Ref = useRef<HTMLDivElement>(null) // Panel 1 (What is COEQWAL)
  const panel3Ref = useRef<HTMLDivElement>(null) // Panel 2 (Water issues)
  const panel4Ref = useRef<HTMLDivElement>(null) // Panel 3 (Scenarios)
  const panel5Ref = useRef<HTMLDivElement>(null) // Panel 4 (Actions)

  // Ref attached to the MorphingHeadline wrapper so useMeetingProgress can
  // measure when VideoHero's bottom edge reaches the headline's top edge.
  const headlineRef = useRef<HTMLDivElement>(null)

  // Memoize to avoid recreating the array on every render
  const panelRefs = useMemo(
    () => [panel1Ref, panel2Ref, panel3Ref, panel4Ref, panel5Ref],
    [],
  )
  const boundaries = usePanelBoundaries(introPanelsRef, panelRefs)

  // Geometry-driven crossfade: scroll progress when VideoHero's bottom
  // meets the MorphingHeadline's top edge.
  const crossfadeAt = useMeetingProgress(
    introPanelsRef,
    panel1Ref,
    headlineRef,
    { edgeA: "bottom", edgeB: "top" },
  )

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
        ref={headlineRef}
        containerRef={introPanelsRef}
        weights={[1, 1.6, 3, 2]}
        panelBoundaries={boundaries}
        crossfadeAt={crossfadeAt > 0 ? crossfadeAt : undefined}
        exitRange={
          boundaries.ready && boundaries.panels[3]
            ? [
                // Start exit exactly when the Panel 4 sticky viewport releases
                // (PANEL4_STICKY_RELEASE = 1 − sticky_vh / container_vh ≈ 0.667),
                // so the fixed headline and the unsticking paragraph move upward together.
                boundaries.panels[3].start +
                  (boundaries.panels[3].end - boundaries.panels[3].start) *
                    PANEL4_STICKY_RELEASE,
                Math.min(boundaries.panels[3].end, 1.0),
              ]
            : [0.82, 0.91]
        }
        shiftRange={
          boundaries.ready && boundaries.panels[2]
            ? [
                // Shift up at 50-60% of Panel 2 (make room for circles)
                boundaries.panels[2].start +
                  (boundaries.panels[2].end - boundaries.panels[2].start) *
                    0.50,
                boundaries.panels[2].start +
                  (boundaries.panels[2].end - boundaries.panels[2].start) *
                    0.60,
              ]
            : undefined
        }
        shiftAmount={HEADLINE_SHIFT_PX}
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
            line1: "Water management",
            line2: "scenarios",
            textShadow: false,
            textColor: theme.palette.text.secondary,
          },
        ]}
      />

      {/* Floating category circles - fixed-position overlay that persists across panels 2 and 3 */}
      <FloatingCategoryCircles
        containerRef={introPanelsRef}
        boundaries={boundaries}
        selectedTheme={selectedTheme}
        setSelectedTheme={setSelectedTheme}
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
            height="220vh"
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
              height="380vh"
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

        {/* Panel 3 - Dark background. Outer box is the scroll runway; inner box
            is the sticky viewport that pins content while the user scrolls through. */}
        <Box
          ref={panel4Ref}
          id="scenarios"
          aria-label="COEQWAL library of Central Valley water management scenarios"
          sx={{ minHeight: `${PANEL4_HEIGHT_VH}vh`, position: "relative" }}
        >
          <Box
            sx={{
              position: "sticky",
              top: 0,
              height: "100vh",
              overflow: "hidden",
              backgroundColor: theme.palette.brand.panelDark,
              display: { xs: "flex", lg: "grid" },
              gridTemplateColumns: { lg: "3fr 2fr" },
              flexDirection: { xs: "column" },
              justifyContent: { xs: "space-between" },
              // Subtract HEADLINE_SHIFT_PX because the MorphingHeadline is already
              // shifted up by that amount when this panel is reached.
              paddingTop: `calc(${theme.space.panel.topOffset} - ${HEADLINE_SHIFT_PX}px)`,
              paddingBottom: theme.space.panel.bottomOffset,
              paddingLeft: theme.space.panel.padding,
              paddingRight: theme.space.panel.padding,
            }}
          >
            <Panel3Text containerRef={introPanelsRef} boundaries={boundaries} />

            {/* Scroll-down arrow */}
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
        </Box>

        {/* Panel 4 - Learn / Explore / Share
            350vh outer container: the category circles borrow the first ~42% of this
            runway (≈147vh) as an extended inspect window before they exit. The inner
            section is sticky so the "On this site, you can" content stays pinned while
            the circles are still visible overhead. */}
        <Box ref={panel5Ref} sx={{ position: "relative", height: "350vh" }}>
        <Box
          component="section"
          id="site-actions"
          aria-label="What you can do on this site"
          sx={{
            position: "sticky",
            top: 0,
            minHeight: "100vh",
            backgroundColor: theme.palette.brand.panelDark,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingTop: theme.space.panel.topOffset,
            paddingBottom: "clamp(80px, 12vh, 160px)",
            paddingLeft: theme.space.panel.padding,
            paddingRight: theme.space.panel.padding,
            color: theme.palette.text.secondary,
          }}
        >
          {/* Headline */}
          <Box
            sx={{
              mb: { xs: 4, lg: 6 },
              textAlign: { xs: "center", lg: "left" },
            }}
          >
            <Box
              sx={{
                fontSize: theme.typography.h1.fontSize,
                maxWidth: "16ch",
              }}
            >
              <Typography
                variant="h2Main"
                component="h2"
                sx={{ display: "block", color: "inherit" }}
              >
                On this site,
              </Typography>
              <Typography
                variant="h1"
                component="span"
                sx={{ display: "block", color: "inherit" }}
              >
                you can
              </Typography>
            </Box>
          </Box>

          {/* Three action columns */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: { xs: 4, md: 6 },
            }}
          >
            {[
              {
                action: "Learn",
                description:
                  "the basics of Central Valley water management and how to read our scenario data",
                tabId: "learn" as const,
              },
              {
                action: "Explore",
                description:
                  "the scenarios. Use tools to understand and compare them. Look at the data through the lenses of tradeoffs, equity, and resilience.",
                tabId: "explore" as const,
              },
              {
                action: "Share",
                description:
                  "your findings by capturing data and charts as you explore and exporting them as files.",
                tabId: "share" as const,
              },
            ].map((item) => (
              <Box
                key={item.action}
                onClick={() => {
                  const tabsEl = document.getElementById("tabs")
                  if (tabsEl) {
                    tabsEl.scrollIntoView({ behavior: "smooth" })
                  }
                }}
                sx={{
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  borderTop: `${theme.strokeWidth.rule}px solid ${theme.palette.text.secondary}44`,
                  pt: 3,
                  transition: "opacity 0.2s ease",
                  "&:hover": {
                    opacity: 0.8,
                  },
                }}
              >
                <Typography
                  variant="h4"
                  component="h3"
                  sx={{ color: "inherit", fontWeight: 600 }}
                >
                  {item.action}
                </Typography>
                <Typography
                  variant="body2"
                  component="p"
                  sx={{ color: "inherit", opacity: 0.85, m: 0 }}
                >
                  {item.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
        </Box>{/* end panel5Ref scroll runway wrapper */}
      </Box>
    </Box>
  )
}

export default IntroSection
