"use client"

import { useRef, useEffect, useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useTranslation } from "@repo/i18n"
import { Box, Typography, ArrowForwardIcon, useTheme } from "@repo/ui/mui"
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
import { THEME_LABEL_CONFIG } from "../content/themes"
import VideoHero from "../components/VideoHero"
import MorphingHeadline from "../components/MorphingHeadline"
import CategoryCircles from "../components/CategoryCircles"
import type { VideoSource } from "../components/VideoHero"
import { mapActions, useMapStore } from "../features/map/store"
import { useTabs } from "../context/Tabs"

/* ─────────────────────────────────────────────────────────────────────────── */
/* ABOUT SECTION SUB-COMPONENTS                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

const MotionBox = motion.create(Box)

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="overline"
      component="p"
      sx={{ color: "rgba(85,85,85,0.55)", mb: 2 }}
    >
      {children}
    </Typography>
  )
}

function AboutCtaLink({
  children,
  href,
}: {
  children: React.ReactNode
  href: string
}) {
  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          py: 1,
          cursor: "pointer",
          "&:hover .about-arrow": { transform: "translateX(4px)" },
        }}
      >
        <Typography variant="subtitle1">{children}</Typography>
        <ArrowForwardIcon
          className="about-arrow"
          sx={{
            fontSize: "1.1rem",
            flexShrink: 0,
            transition: "transform 0.15s ease",
            color: "inherit",
          }}
        />
      </Box>
    </Link>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */

const VIDEO_SRCS: VideoSource[] = [
  {
    src: "/video/landing-hero-reel.mp4",
    type: "video/mp4",
  },
]

const LIGHT_GREY = "#f7f7f7"
const RULE = "1px solid #e5e5df"

const WATER_THEME_IDS = ["cws", "ag_gw", "eco", "delta"] as const

const WATER_THEME_PHOTOS: Partial<Record<string, string>> = {
  cws: "/images/themes/FL_Porterville-9320.jpg",
  ag_gw: "/images/themes/PJH_Sprinklers_10911-2_07_15_2004.jpg",
  eco: "/images/themes/CC_salmon_underH20-5_10_15_2012.jpg",
  delta: "/images/themes/Screenshot 2026-02-25 at 11.21.jpg",
}

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
const PANEL4_HEIGHT_VH = 200
/** Sticky viewport height (always 100vh). */
const PANEL4_STICKY_VH = 100
/**
 * Local-progress fraction at which Panel 4's sticky viewport releases.
 * = 1 − sticky_height / container_height = 1 − 100/200 = 0.5.
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
  const yNum = useScrollValue(
    progress,
    [0, PARA_APPEAR, PARA_LEAVE, 1],
    [30, 0, 0, -30],
    {
      ease: easeOut,
    },
  )
  const y = useTransform(yNum, (v) => `${v}vh`)
  const opacity = useScrollValue(
    progress,
    [0, PARA_APPEAR, PARA_LEAVE, 1],
    [0, 1, 1, 0],
    {
      ease: easeOut,
    },
  )

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
          COEQWAL &mdash; the Collaboratory for Equity in Water Allocation
          &mdash; is a publicly-funded project that works with communities to
          model alternative water management scenarios for California&rsquo;s
          Central Valley.
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
  const yNum = useScrollValue(
    progress,
    [0, 0.5, 0.6, 0.85, 1],
    [0, 0, -12, -12, -30],
  )
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
    <motion.div style={{ opacity, gridColumn: 2, alignSelf: "start" }}>
      <Box
        sx={{
          maxWidth: { xs: "540px", lg: "none" },
          textAlign: { xs: "center", lg: "left" },
          color: theme.palette.text.secondary,
        }}
      >
        <Typography variant="displayBody" component="p">
          COEQWAL uses a computational model called CalSim to run a broad range
          of alternative water management scenarios for California&rsquo;s
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
  // Hold start: circles are stationary at 50vh from p3HoldStart → p3StickyRelease.
  // 0.40 leaves ~0.10 × span of hold before PANEL4_STICKY_RELEASE = 0.5
  // (PANEL4_HEIGHT_VH was halved from 300 → 200, so sticky release moved from 0.667 → 0.5).
  const p3HoldStart = p3Start + (p3End - p3Start) * 0.4
  // Hold at 50vh until sticky releases and headline/paragraph scroll off (PANEL4_STICKY_RELEASE = 0.5).
  const p3StickyRelease = p3Start + (p3End - p3Start) * PANEL4_STICKY_RELEASE
  // Float finishes at 0.73: lists appear shortly after sticky release (0.667),
  // freeing most of the remaining p3 runway for the hold-with-lists phase below.
  const p3ListsUp = p3Start + (p3End - p3Start) * 0.73
  // Hold at 20vh with lists visible from p3ListsUp → p3ListsHold before exiting.
  const p3ListsHold = p3Start + (p3End - p3Start) * 0.93

  // Circles drift slowly upward through Panel 5.  Borrowing Panel 5's scroll runway
  // keeps the post-sticky-release runway constraint (always 100vh) from rushing the exit.
  const p4Start = p4 ? p4.start : p3End
  const p4Span = p4 ? p4.end - p4.start : 0.18
  // Opacity fades over 42%→62% of P4 (unchanged).
  // Cap at 0.99 so the fade always completes before the scroll container ends.
  const p4ExitStart = p4Start + p4Span * 0.42
  const p4ExitEnd = Math.min(p4Start + p4Span * 0.62, 0.99)
  // Y endpoint is extended to 82% of P4: same 120vh drift (20→-100) over a longer
  // scroll runway → circles scroll more slowly once the lists are visible.
  const p4YEnd = Math.min(p4Start + p4Span * 0.82, 0.99)

  // Opacity: fade in at appear, stay fully opaque while drifting, fade during Panel 5 exit
  const opacity = useTransform(
    scrollYProgress,
    [0, appearStart, appearEnd, p4ExitStart, p4ExitEnd],
    [0, 0, 1, 1, 0],
  )

  // Y: glide in, arrive at midscreen, hold while headline visible,
  // sticky releases, float to 20vh, hold with lists visible, drift off screen.
  const yNum = useTransform(
    scrollYProgress,
    [
      appearStart,
      p2 ? p2.mid : 0.62,
      p3HoldStart,
      p3StickyRelease,
      p3ListsUp,
      p3ListsHold,
      p4YEnd,
    ],
    [60, 45, 50, 50, 20, 20, -100],
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

/** Water-theme card — coloured header, photo, description */
function ThemeCard({
  label,
  description,
  photo,
  bg,
  textColor,
  index,
}: {
  label: string
  description: string
  photo?: string
  bg: string
  textColor: string
  index: number
}) {
  const theme = useTheme()
  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: "easeOut", delay: index * 0.07 }}
      sx={{
        display: "flex",
        flexDirection: "column",
        border: RULE,
        borderRadius: theme.borderRadius.md,
        overflow: "hidden",
      }}
    >
      {/* Coloured header */}
      <Box
        sx={{
          backgroundColor: bg,
          px: { xs: 3, md: 3.5 },
          py: { xs: 2.5, md: 3 },
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1rem", md: "1.05rem" },
            lineHeight: 1.3,
            color: textColor,
          }}
        >
          {label}
        </Typography>
      </Box>

      {/* Photo */}
      <Box
        aria-hidden="true"
        sx={{
          width: "100%",
          aspectRatio: "4 / 3",
          position: "relative",
          backgroundColor: "#d8d8d8",
        }}
      >
        {photo && (
          <Image
            src={photo}
            alt=""
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        )}
      </Box>

      {/* Description */}
      <Box
        sx={{
          backgroundColor: "#fff",
          px: { xs: 3, md: 3.5 },
          py: { xs: 2.5, md: 3 },
          flex: 1,
        }}
      >
        <Typography variant="body2" sx={{ color: "#555", lineHeight: 1.7 }}>
          {description}
        </Typography>
      </Box>
    </MotionBox>
  )
}

const IntroSection = () => {
  const theme = useTheme()
  const waterThemePalette = theme.palette.waterThemes as Record<
    string,
    { background: string; text: string }
  >
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

  // Shared scroll progress for the introPanelsRef container, used by Panel 5
  // headline to fade in after the category circles have fully exited.
  const { scrollYProgress: introProgress } = useScroll({
    target: introPanelsRef,
    offset: ["start start", "end end"],
    layoutEffect: false,
  })

  // Mirror the same p4ExitStart/p4ExitEnd fractions used in FloatingCategoryCircles.
  // The headline cross-fades WITH the circles' opacity exit (starts at p4ExitStart)
  const p4Boundaries = boundaries.panels[4]
  const p4ExitStart = p4Boundaries
    ? p4Boundaries.start + (p4Boundaries.end - p4Boundaries.start) * 0.42
    : 0.93
  const p4ExitEnd = p4Boundaries
    ? Math.min(
        p4Boundaries.start + (p4Boundaries.end - p4Boundaries.start) * 0.62,
        0.99,
      )
    : 0.95
  const panel5HeadlineOpacity = useTransform(
    introProgress,
    [p4ExitStart, p4ExitEnd],
    [0, 1],
  )

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
        appearRange={
          boundaries.ready && boundaries.panels[1]
            ? [boundaries.panels[1].start * 0.85, boundaries.panels[1].start]
            : undefined
        }
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
                  (boundaries.panels[2].end - boundaries.panels[2].start) * 0.5,
                boundaries.panels[2].start +
                  (boundaries.panels[2].end - boundaries.panels[2].start) * 0.6,
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

      {/* position: relative required for Framer Motion useScroll offset calculations.
          pointerEvents: "auto" re-enables event capture for all scroll panels so that
          users cannot accidentally pan the map through the IntroSection content. */}
      <Box
        ref={introPanelsRef}
        sx={{ position: "relative", pointerEvents: "auto" }}
      >
        {/* Video Hero */}
        <div ref={panel1Ref}>
          <VideoHero
            sources={VIDEO_SRCS}
            fallbackImage="/images/home_hero_fallback.png"
          />
        </div>

        {/* About COEQWAL */}
        <Box
          component="section"
          aria-label="About COEQWAL"
          sx={{
            backgroundColor: theme.palette.common.white,
            px: theme.space.panel.padding,
            py: { xs: 7, md: 9 },
          }}
        >
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              rowGap: { xs: 3, md: 4 },
              columnGap: { md: 6 },
            }}
          >
            {/* Row 1: eyebrow + heading — spans full width */}
            <Box sx={{ gridColumn: { md: "1 / -1" } }}>
              <SectionLabel>About COEQWAL</SectionLabel>
              <Typography variant="h5" component="h2" sx={{ color: "#333" }}>
                A publicly-funded tool
                <br />
                for California&rsquo;s water future
              </Typography>
            </Box>

            {/* Row 2: paragraph + CTA — right column only */}
            <Box sx={{ gridColumn: { xs: "1", md: "2" } }}>
              <Typography variant="body1" sx={{ color: "#555", mb: 4 }}>
                COEQWAL &mdash; the Collaboratory for Equity in Water Allocation
                &mdash; works with communities to model alternative water
                management scenarios for California&rsquo;s Central Valley. Our
                goal is to help communities, policymakers, and researchers
                understand how water decisions affect people and ecosystems.
              </Typography>
              <AboutCtaLink href="/about">
                Learn more about COEQWAL
              </AboutCtaLink>
            </Box>
          </MotionBox>
        </Box>

        {/* Water themes */}
        <Box
          component="section"
          aria-label="Water management themes"
          sx={{
            backgroundColor: LIGHT_GREY,
            borderBottom: RULE,
            px: theme.space.panel.padding,
            py: { xs: 7, md: 9 },
          }}
        >
          <SectionLabel>Water themes</SectionLabel>

          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            sx={{ maxWidth: "680px", mb: 5 }}
          >
            <Typography
              variant="h5"
              component="h2"
              sx={{ color: "#333", mb: 3 }}
            >
              What water issues matter to you?
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "#555", maxWidth: "560px" }}
            >
              Water is important to all of us &mdash; from farmers in the
              Central Valley to communities in the Delta, from salmon in the
              Sacramento River to urban water users in Los Angeles. We can
              consider how decisions affect the issues people care about.
            </Typography>
          </MotionBox>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                lg: "repeat(4, 1fr)",
              },
              gap: { xs: 2, md: 2 },
            }}
          >
            {WATER_THEME_IDS.map((id, i) => {
              const colors = waterThemePalette[id] ?? {
                background: "#eee",
                text: "#333",
              }
              const description =
                WATER_THEMES.find((t) => t.id === id)?.description ?? ""
              return (
                <ThemeCard
                  key={id}
                  label={THEME_LABEL_CONFIG[id]?.label ?? id}
                  description={description}
                  photo={WATER_THEME_PHOTOS[id]}
                  bg={colors.background}
                  textColor={colors.text}
                  index={i}
                />
              )
            })}
          </Box>

          {/* ── Provisional themes (pending decision — remove when resolved) ── */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                lg: "repeat(4, 1fr)",
              },
              gap: { xs: 2, md: 2 },
              mt: 2,
            }}
          >
            {(["climate", "governance"] as const).map((id, i) => {
              const themeEntry = WATER_THEMES.find((t) => t.id === id)
              const description = themeEntry?.description ?? ""
              const label = (themeEntry?.label ?? id).replace(/\n/g, " ")
              return (
                <ThemeCard
                  key={id}
                  label={label}
                  description={description}
                  bg="#efefef"
                  textColor="#444"
                  index={i}
                />
              )
            })}
          </Box>
        </Box>

        {/* On this site, you can */}
        <Box
          component="section"
          aria-label="On this site, you can"
          sx={{
            backgroundColor: theme.palette.common.white,
            px: theme.space.panel.padding,
            pt: { xs: 9, md: 12 },
            pb: 0,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Text content */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            sx={{ maxWidth: "640px" }}
          >
            <SectionLabel>What you can do</SectionLabel>

            <Typography
              variant="body1"
              sx={{ color: "#555", mb: 7, lineHeight: 1.75 }}
            >
              Water is limited and every choice has trade-offs. COEQWAL allows
              you to explore different water scenarios and understand how
              decisions shape potential futures for communities, farms, rivers,
              and the Delta.
            </Typography>

            <Typography
              variant="h5"
              component="h2"
              sx={{ color: "#333", mb: 5 }}
            >
              On this site, you can
            </Typography>

            <Box
              component="ul"
              sx={{
                m: 0,
                p: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              {[
                {
                  verb: "Learn",
                  rest: "how water in California\u2019s Central Valley is managed,",
                },
                {
                  verb: "Explore",
                  rest: "how water outcomes shift under different scenarios, and",
                },
                {
                  verb: "Share",
                  rest: "your insights about California\u2019s water future",
                },
              ].map(({ verb, rest }) => (
                <Box
                  component="li"
                  key={verb}
                  sx={{ display: "flex", gap: 1.5 }}
                >
                  <Typography
                    variant="body1"
                    sx={{ color: "#555", lineHeight: 1.75 }}
                  >
                    <Box
                      component="span"
                      sx={{ color: "#333", fontWeight: 600 }}
                    >
                      {verb}
                    </Box>{" "}
                    {rest}
                  </Typography>
                </Box>
              ))}
            </Box>
          </MotionBox>

          {/* Mock tab row — pinned to bottom */}
          <Box
            sx={{
              mt: 8,
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              borderTop: RULE,
            }}
          >
            {["Learn", "Explore", "Share"].map((label, i) => (
              <Box
                key={label}
                sx={{
                  py: { xs: 4, md: 5 },
                  px: { xs: 2, md: 3 },
                  borderLeft: i > 0 ? RULE : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  cursor: "default",
                  "&:hover .tab-arrow": { transform: "translateX(4px)" },
                }}
              >
                <Typography
                  variant="h5"
                  component="span"
                  sx={{ color: "#333" }}
                >
                  {label}
                </Typography>
                <ArrowForwardIcon
                  className="tab-arrow"
                  sx={{
                    color: "#333",
                    fontSize: "1.4rem",
                    flexShrink: 0,
                    transition: "transform 0.15s ease",
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>

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
            ></Box>
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
              justifyContent: "flex-end",
              paddingTop: theme.space.panel.topOffset,
              paddingBottom: "clamp(96px, 18vh, 180px)",
              paddingLeft: theme.space.panel.padding,
              paddingRight: theme.space.panel.padding,
              color: theme.palette.text.secondary,
            }}
          >
            {/* Headline — fades in once category circles have fully exited */}
            <motion.div style={{ opacity: panel5HeadlineOpacity }}>
              <Box
                sx={{
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
            </motion.div>
          </Box>
        </Box>
        {/* end panel5Ref scroll runway wrapper */}
      </Box>
    </Box>
  )
}

export default IntroSection
