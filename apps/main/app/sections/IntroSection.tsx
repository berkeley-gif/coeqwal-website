"use client"

import { useRef, useEffect, useMemo } from "react"
import Link from "next/link"
import { useTranslation } from "@repo/i18n"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import {
  CoeqwalPanel,
  NavArrow,
  tunerRadius,
  tunerInsetX,
  tunerInsetY,
} from "@repo/ui"
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
          "&:hover .about-arrow": { transform: "translateX(4px)" },
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: "fontWeightSemiBold" }}
        >
          {children}
        </Typography>
        <NavArrow className="about-arrow" />
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
  // Dock marker at the END of the 300vh sticky section.MorphingHeadline
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

  // Geometry-driven crossfade timing.
  //
  // `crossfadeAt{1,2}` are the scroll progresses at which the seam
  // between two adjacent panels sits at the headline's top edge. They
  // are still used for panelBoundaries (drives activeIndex / screen
  // reader state) and as a fallback if the range pair below isn't
  // ready yet.
  //
  // `crossfadeRanges` below pair each seam with two meeting progresses
  // so the opacity crossfade can span the exact scroll window during
  // which the seam (and the inset-frame gap that straddles it) is
  // within the headline's vertical extent. The fade starts when the
  // trailing edge of panel A meets the BOTTOM of the headline (gap
  // first overlaps) and ends when the leading edge of panel B meets
  // the TOP of the headline (gap has fully passed). Because the
  // headline is position:fixed, useMeetingProgress treats its scroll
  // rate as 0, so each window's width equals the headline's own
  // height — the text visibly changes as the gap swipes past it.
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

  // Transition 0 (VideoHero → About): gap enters when hero's bottom
  // reaches the headline's bottom; leaves when About's top reaches the
  // headline's top.
  const gap1Start = useMeetingProgress(
    containerRef,
    videoHeroRef,
    morphHeadlineRef,
    { edgeA: "bottom", edgeB: "bottom" },
  )
  const gap1End = useMeetingProgress(
    containerRef,
    aboutPanelRef,
    morphHeadlineRef,
    { edgeA: "top", edgeB: "top" },
  )

  // Transition 1 (About → WaterThemes): same pattern, one seam down.
  const gap2Start = useMeetingProgress(
    containerRef,
    aboutPanelRef,
    morphHeadlineRef,
    { edgeA: "bottom", edgeB: "bottom" },
  )
  const gap2End = useMeetingProgress(
    containerRef,
    waterThemesPanelRef,
    morphHeadlineRef,
    { edgeA: "top", edgeB: "top" },
  )

  const crossfadeRanges = useMemo<Array<[number, number] | undefined>>(
    () => [
      [gap1Start, gap1End],
      [gap2Start, gap2End],
    ],
    [gap1Start, gap1End, gap2Start, gap2End],
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
      textShadow: true,
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
      {/* Morphing headline.fixed overlay, upper-left.
          panelBoundaries is geometry-driven via useMeetingProgress.
          crossfadeAt synchronises the 0 to 1 fade precisely at the panel border.
          No exitRange: the final headline ("What water issues") stays fixed -
          it is the terminal state of the morph sequence. */}
      <MorphingHeadline
        ref={morphHeadlineRef}
        headlines={headlines}
        containerRef={containerRef}
        weights={[1, 1, 2]}
        panelBoundaries={panelBoundaries}
        crossfadeAt={crossfadeAt1 > 0 ? crossfadeAt1 : undefined}
        crossfadeRanges={crossfadeRanges}
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

      {/* About COEQWAL.headline handled by MorphingHeadline overlay on lg+;
          responsiveHeadline fills in on smaller screens */}
      <div ref={aboutPanelRef}>
        <CoeqwalPanel
          id="about-coeqwal"
          background={theme.palette.brand.water}
          textColor={theme.palette.text.secondary}
          // Parent panel occupies exactly the viewport below the
          // fixed header. The inner rounded card is padded inside
          // by the `inset` prop (insetY top and bottom, insetX
          // left and right), so the parent's full height keeps the
          // viewport fully covered (no map bleed-through) while the
          // rounded card retains its frame strips above and below.
          minHeight={`calc(100vh - ${theme.layout.headerHeight}px)`}
          borderRadius={tunerRadius()}
          inset={{ x: tunerInsetX(), y: tunerInsetY() }}
          frameBackground={theme.palette.common.white}
          contentMotionStyle={{ opacity: aboutOpacity }}
          responsiveHeadline={
            <>
              <Typography
                variant="h2Main"
                component="span"
                sx={{ display: "block", color: "text.secondary" }}
              >
                What is
              </Typography>
              <Typography
                variant="h1"
                component="span"
                sx={{ display: "block", color: "text.secondary" }}
              >
                COEQWAL?
              </Typography>
            </>
          }
          description={
            <>
              COEQWAL – the Collaboratory for Equity in Water Allocation – is a
              publicly-funded project that works with communities to better
              understand how water is managed in California.
              <br />
              <br />
              Using water planning models, COEQWAL sheds light on how
              alternative decisions and climate change scenarios shape our water
              future.
            </>
          }
          cta={
            <AboutCtaLink href="/about">Learn more about COEQWAL</AboutCtaLink>
          }
          layout="split"
          descriptionSx={{ maxWidth: "calc(100% - 40px)" }}
        />
      </div>

      {/* Water themes.sticky scrollytelling with circle overlays */}
      <WaterThemesPanel
        panelRef={waterThemesPanelRef}
        dockRef={waterThemesDockRef}
        contentOpacity={waterThemesOpacity}
        borderBottom={theme.border.light}
        borderRadius={tunerRadius()}
        inset={{ x: tunerInsetX(), y: tunerInsetY() }}
        frameBackground={theme.palette.common.white}
      />

      {/* Want to know more?.frame + rounded inset panel */}
      <Box
        sx={{
          backgroundColor: theme.palette.common.white,
          px: tunerInsetX(),
          py: tunerInsetY(),
        }}
      >
        <Box
          component="section"
          aria-label="On this site, you can"
          sx={{
            backgroundColor: "brand.panelLight",
            borderRadius: tunerRadius(),
            overflow: "hidden",
            px: theme.space.panel.padding,
            pt: theme.space.panel.padding,
            pb: `calc(${theme.space.panel.padding} + 80px)`,
          }}
        >
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Typography variant="h2Main" component="h2">
            Want to
          </Typography>
          <Typography variant="h1" component="h1">
            know more?
          </Typography>
        </MotionBox>

        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
          sx={{
            mt: theme.space.section.lg,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            columnGap: { md: theme.space.section.lg },
            rowGap: { xs: theme.space.section.md },
          }}
        >
          <Box
            component="ul"
            sx={{
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: theme.space.gap.xl,
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
                <Typography variant="body1">
                  <Box
                    component="span"
                    sx={{ fontWeight: "fontWeightSemiBold" }}
                  >
                    {verb}
                  </Box>{" "}
                  {rest}
                </Typography>
              </Box>
            ))}
          </Box>

          <Typography variant="body1">
            Water is limited and every choice has trade-offs. COEQWAL allows you
            to explore different water scenarios and understand how decisions
            shape potential futures for communities, farms, rivers, and the
            Delta.
          </Typography>
        </MotionBox>
        </Box>
      </Box>
    </Box>
  )
}

export default IntroSection
