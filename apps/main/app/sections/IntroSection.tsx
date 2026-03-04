"use client"

import { useRef, useEffect, useMemo } from "react"
import Link from "next/link"
import { useTranslation } from "@repo/i18n"
import { Box, Typography, ArrowForwardIcon, useTheme } from "@repo/ui/mui"
import { CoeqwalPanel } from "@repo/ui"
import { motion } from "@repo/motion"
import {
  useScrollProgress,
  useMotionValue,
  useMeetingProgress,
} from "@repo/scrollytelling"

import { useTabs } from "../context/Tabs"
import VideoHero from "../components/VideoHero"
import type { VideoSource } from "../components/VideoHero"
import MorphingHeadline from "../components/MorphingHeadline"
import { WaterThemesPanel } from "./WaterThemesPanel"

/* ─────────────────────────────────────────────────────────────────────────── */
/* SUB-COMPONENTS                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

const MotionBox = motion.create(Box)

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
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {children}
        </Typography>
        <ArrowForwardIcon
          className="about-arrow"
          sx={{
            fontSize: "1.1rem",
            flexShrink: 0,
            transition: "transform 0.15s ease",
            color: "inherit",
            "& path": {
              stroke: "currentColor",
              strokeWidth: "0.5px",
              paintOrder: "stroke fill",
            },
          }}
        />
      </Box>
    </Link>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* CONSTANTS                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

const VIDEO_SRCS: VideoSource[] = [
  {
    src: "/video/landing-hero-reel.mp4",
    type: "video/mp4",
  },
]

const RULE = "1px solid #e5e5df"

/* ─────────────────────────────────────────────────────────────────────────── */
/* INTRO SECTION                                                                */
/* ─────────────────────────────────────────────────────────────────────────── */

const IntroSection = () => {
  const theme = useTheme()
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const morphHeadlineRef = useRef<HTMLDivElement>(null)
  const videoHeroRef = useRef<HTMLDivElement>(null)
  const aboutPanelRef = useRef<HTMLDivElement>(null)
  const waterThemesPanelRef = useRef<HTMLDivElement>(null)
  // Dock marker at the END of the 300vh sticky section — MorphingHeadline
  // docks here so it only scrolls away once the full section is done.
  const waterThemesDockRef = useRef<HTMLDivElement>(null)

  // Scroll progress across the entire IntroSection
  const scrollProgress = useScrollProgress(containerRef)

  // Track hero scroll progress for header transparency transition
  const { setIsPastHero } = useTabs()
  const heroScrollProgress = useScrollProgress(videoHeroRef, {
    offset: ["start start", "end start"],
  })

  useEffect(() => {
    let wasPastHero = heroScrollProgress.get() > 0.5
    setIsPastHero(wasPastHero)

    return heroScrollProgress.on("change", (p) => {
      const isPast = p > 0.5
      if (isPast !== wasPastHero) {
        wasPastHero = isPast
        setIsPastHero(isPast)
      }
    })
  }, [heroScrollProgress, setIsPastHero])

  // Geometry-driven crossfade timing:
  // each value is the scroll progress when the panel border reaches the headline's top.
  // useMeetingProgress accounts for the headline being position:fixed (scroll rate = 0).
  const crossfadeAt1 = useMeetingProgress(
    containerRef,
    videoHeroRef,
    morphHeadlineRef,
    { edgeA: "bottom", edgeB: "top" },
  )
  const crossfadeAt2 = useMeetingProgress(
    containerRef,
    aboutPanelRef,
    morphHeadlineRef,
    { edgeA: "bottom", edgeB: "top" },
  )

  // Build panel boundaries for MorphingHeadline from the meeting points
  const panelBoundaries = useMemo(
    () => ({
      panels: [
        { start: 0, mid: crossfadeAt1 / 2, end: crossfadeAt1 },
        {
          start: crossfadeAt1,
          mid: (crossfadeAt1 + crossfadeAt2) / 2,
          end: crossfadeAt2,
        },
        { start: crossfadeAt2, mid: (crossfadeAt2 + 1) / 2, end: 1 },
      ],
      ready: crossfadeAt1 > 0 && crossfadeAt2 > 0,
    }),
    [crossfadeAt1, crossfadeAt2],
  )

  // Content opacity driven by the same meeting points.
  // Seeded from the current scroll position so HMR / remount doesn't
  // leave content invisible when the user is already scrolled past a panel.
  const aboutOpacity = useMotionValue(
    scrollProgress.get() >= crossfadeAt1 ? 1 : 0,
  )
  const waterThemesOpacity = useMotionValue(
    scrollProgress.get() >= crossfadeAt2 ? 1 : 0,
  )

  useEffect(() => {
    // Re-sync immediately in case crossfadeAt values were measured after mount
    const p = scrollProgress.get()
    aboutOpacity.set(p >= crossfadeAt1 ? 1 : 0)
    waterThemesOpacity.set(p >= crossfadeAt2 ? 1 : 0)

    return scrollProgress.on("change", (p) => {
      aboutOpacity.set(p >= crossfadeAt1 ? 1 : 0)
      waterThemesOpacity.set(p >= crossfadeAt2 ? 1 : 0)
    })
  }, [
    scrollProgress,
    crossfadeAt1,
    crossfadeAt2,
    aboutOpacity,
    waterThemesOpacity,
  ])

  const headlines = [
    {
      line1: t("homePanel.titleLine1"),
      line2: t("homePanel.titleLine2"),
      textShadow: true as const,
    },
    {
      line1: "What is",
      line2: "COEQWAL?",
      textShadow: false,
      textColor: "text.secondary",
    },
    {
      line1: "What water issues",
      line2: "matter to you?",
      textShadow: false,
      textColor: "text.primary",
    },
  ]

  return (
    <Box ref={containerRef} sx={{ pointerEvents: "auto" }}>
      {/* Morphing headline — fixed overlay, upper-left.
          panelBoundaries is geometry-driven via useMeetingProgress.
          crossfadeAt synchronises the 0 to 1 fade precisely at the panel border.
          No exitRange: the final headline ("What water issues") stays fixed —
          it is the terminal state of the morph sequence. */}
      <MorphingHeadline
        ref={morphHeadlineRef}
        headlines={headlines}
        containerRef={containerRef}
        weights={[1, 1, 2]}
        panelBoundaries={panelBoundaries}
        crossfadeAt={crossfadeAt1 > 0 ? crossfadeAt1 : undefined}
        dockRef={waterThemesDockRef}
      />

      {/* Video Hero */}
      <div ref={videoHeroRef}>
        <VideoHero
          sources={VIDEO_SRCS}
          fallbackImage="/images/home_hero_fallback.png"
          hideHeadline
        />
      </div>

      {/* About COEQWAL — headline handled by MorphingHeadline overlay on lg+;
          responsiveHeadline fills in on smaller screens */}
      <div ref={aboutPanelRef}>
        <CoeqwalPanel
          id="about-coeqwal"
          background={theme.palette.brand.water}
          textColor={theme.palette.common.white}
          minHeight="120vh"
          contentMotionStyle={{ opacity: aboutOpacity }}
          responsiveHeadline={
            <>
              <Typography
                variant="h2Main"
                component="span"
                sx={{ display: "block", color: theme.palette.common.white }}
              >
                What is
              </Typography>
              <Typography
                variant="h1"
                component="span"
                sx={{ display: "block", color: theme.palette.common.white }}
              >
                COEQWAL?
              </Typography>
            </>
          }
          description={
            <>
              COEQWAL &mdash; the Collaboratory for Equity in Water Allocation
              &mdash; works with communities to model alternative water
              management scenarios for California&rsquo;s Central Valley. Our
              goal is to help communities, policymakers, and researchers
              understand how water decisions affect people and ecosystems.
            </>
          }
          cta={
            <AboutCtaLink href="/about">Learn more about COEQWAL</AboutCtaLink>
          }
          layout="split"
          descriptionSx={{ maxWidth: "calc(100% - 40px)" }}
        />
      </div>

      {/* Water themes — sticky scrollytelling with circle overlays */}
      <WaterThemesPanel
        panelRef={waterThemesPanelRef}
        dockRef={waterThemesDockRef}
        contentOpacity={waterThemesOpacity}
        borderBottom={RULE}
      />

      {/* Spacer between themes panel and site overview */}
      <Box
        sx={{
          height: theme.space.panel.padding,
          backgroundColor: theme.palette.brand.panelLight,
        }}
      />

      {/* On this site, you can */}
      <Box
        component="section"
        aria-label="On this site, you can"
        sx={{
          backgroundColor: theme.palette.brand.panelLight,
          px: theme.space.panel.padding,
          pt: theme.space.panel.padding,
          pb: `calc(${theme.space.panel.padding} + 80px)`,
        }}
      >
        {/* Headline — matches MorphingHeadline typography */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Typography
            variant="h2Main"
            component="h2"
            sx={{ display: "block", color: "text.primary" }}
          >
            On this site
          </Typography>
          <Typography
            variant="h1"
            component="h1"
            sx={{ display: "block", color: "text.primary" }}
          >
            you can
          </Typography>
        </MotionBox>

        {/* Two-column content */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
          sx={{
            mt: 6,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            columnGap: { md: 6 },
            rowGap: { xs: 5 },
          }}
        >
          {/* Left column — list */}
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
              <Box component="li" key={verb}>
                <Typography
                  variant="body1"
                  sx={{ color: theme.palette.text.primary, lineHeight: 1.75 }}
                >
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {verb}
                  </Box>{" "}
                  {rest}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Right column — intro paragraph */}
          <Typography
            variant="body1"
            sx={{ color: theme.palette.text.primary, lineHeight: 1.75 }}
          >
            Water is limited and every choice has trade-offs. COEQWAL allows you
            to explore different water scenarios and understand how decisions
            shape potential futures for communities, farms, rivers, and the
            Delta.
          </Typography>
        </MotionBox>
      </Box>
    </Box>
  )
}

export default IntroSection
