"use client"

import { Suspense, useRef, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useTranslation } from "@repo/i18n"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import {
  CoeqwalPanel,
  NavArrow,
  ScrollToButton,
  tunerRadius,
  tunerInsetX,
  tunerInsetY,
  tunerInsetYPx,
} from "@repo/ui"
import { motion } from "@repo/motion"
import {
  useScrollProgress,
  useMotionValue,
  useMeetingProgress,
  StickyScrollSection,
} from "@repo/scrollytelling"

import { useTabs } from "../context/Tabs"
import VideoHero from "../components/VideoHero"
import type { VideoSource } from "../components/VideoHero"
import MorphingHeadline from "../components/MorphingHeadline"
import { WaterThemesPanel } from "./WaterThemesPanel"

/*───────────────── */
/* SUB-COMPONENTS                                                               */
/*───────────────── */

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
          component="span"
          sx={(theme) => ({
            ...theme.typography.overline,
            fontWeight: 600,
            letterSpacing: "0.2em",
            lineHeight: 1.2,
            color: "inherit",
          })}
        >
          {children}
        </Typography>
        <NavArrow className="about-arrow" />
      </Box>
    </Link>
  )
}

/*───────────────── */
/* CONSTANTS                                                                    */
/*───────────────── */

const VIDEO_SRCS: VideoSource[] = [
  {
    src: "/video/landing-hero-reel.mp4",
    type: "video/mp4",
  },
]

/*───────────────── */
/* INTRO SECTION                                                                */
/*───────────────── */

const IntroSection = () => {
  const theme = useTheme()
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const morphHeadlineRef = useRef<HTMLDivElement>(null)
  // Invisible fixed marker at the viewport's vertical center.
  // Used by `useMeetingProgress` to time the About→WaterThemes
  // text crossfade against the visible headline position: during
  // the About panel the headline has glided to viewport center, so
  // the seam "visually" crosses the headline when the seam passes
  // the center line, not when it passes the headline's default
  // top anchor.
  const viewportCenterRef = useRef<HTMLDivElement>(null)
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

  // Measure the morphing headline's rendered height so the
  // viewport-center marker below can be sized to match. The marker
  // is what `useMeetingProgress` compares against to time the
  // About→WaterThemes text crossfade and the return-to-top glide.
  // It needs a real (non-zero) height so gap2Start (seam reaches
  // centered headline's bottom) and gap2End (seam reaches centered
  // headline's top) are two distinct scroll events spanning the
  // centered headline's vertical extent.
  const [headlineHeight, setHeadlineHeight] = useState(0)
  useEffect(() => {
    if (typeof window === "undefined") return
    const el = morphHeadlineRef.current
    if (!el) return
    const update = () => setHeadlineHeight(el.getBoundingClientRect().height)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener("resize", update, { passive: true })
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", update)
    }
  }, [])

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
  // the top of the headline (gap has fully passed). Because the
  // headline is position:fixed, useMeetingProgress treats its scroll
  // rate as 0, so each window's width equals the headline's own
  // height. The text visibly changes as the gap swipes past it.
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

  // Transition 0 (VideoHero -> About): gap enters when hero's bottom
  // reaches the headline's bottom. Leaves when About's top reaches the
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

  // Transition 1 (About -> WaterThemes): measure against the
  // viewport-center marker, which is sized to the headline's own
  // height and centered on the viewport. That way the two meeting
  // events span the centered headline's vertical extent. gap2Start
  // is when the seam reaches the centered headline's BOTTOM, gap2End
  // is when the seam reaches its top, mirroring the gap1 pattern
  // that uses the headline ref directly while it sits at its default
  // top anchor.
  const gap2Start = useMeetingProgress(
    containerRef,
    aboutPanelRef,
    viewportCenterRef,
    { edgeA: "bottom", edgeB: "bottom" },
  )
  const gap2End = useMeetingProgress(
    containerRef,
    waterThemesPanelRef,
    viewportCenterRef,
    { edgeA: "top", edgeB: "top" },
  )

  // Delay the About -> WaterThemes text crossfade until slightly after
  // the seam has fully swept past the centered headline. Without
  // this delay the dark-blue panel-3 text fades in while the white
  // inset-frame seam is still crossing the headline, which reads as
  // dark-blue text over a white band, visually muddy. Shifting the
  // crossfade window forward by one gap2Duration (the headline's
  // own height, i.e. the full time it takes the seam to cross the
  // headline) means the text only starts morphing once the seam is
  // above the headline's top edge and the dark-blue panel-3 frame
  // has become the uninterrupted backdrop. Tweak `textDelayFactor`
  // if the feel needs to be tighter or looser.
  const gap2Duration = gap2End - gap2Start
  const textDelayFactor = 1.0
  const textCrossfadeDelay = gap2Duration * textDelayFactor
  const textCrossfadeStart = gap2Start + textCrossfadeDelay
  const textCrossfadeEnd = gap2End + textCrossfadeDelay

  const crossfadeRanges = useMemo<Array<[number, number] | undefined>>(
    () => [
      [gap1Start, gap1End],
      [textCrossfadeStart, textCrossfadeEnd],
    ],
    [gap1Start, gap1End, textCrossfadeStart, textCrossfadeEnd],
  )

  // Motion-only ranges for the headline's center glide. Decoupled
  // from the text crossfade (`crossfadeRanges`) so the vertical
  // translation can take more scroll distance than the crossfade.
  //
  // Enter: starts as the VideoHero ->About seam reaches the headline's
  // bottom (gap1Start), finishes ~halfway between gap1End and the
  // About→WaterThemes seam approach. That stretches the downward
  // glide well past the text crossfade for a slower, smoother feel.
  //
  // Exit: anchored off `gap2End` (seam reaches the top of the
  // centered headline), deliberately not off `textCrossfadeEnd`.
  // The delay applied to the text crossfade is a cosmetic shift to
  // avoid dark-blue text over the white seam. The motion pause +
  // glide back up to the top anchor should still be scheduled
  // relative to the seam itself so the overall return-to-top
  // timing doesn't get pushed later as we tweak the text delay.
  const centerEnterEnd = gap1End + (gap2Start - gap1End) * 0.5
  const centerEnterRange: [number, number] = [gap1Start, centerEnterEnd]
  const centerExitPause = gap2Duration * 0.5
  const centerExitDuration = gap2Duration * 2.0
  const centerExitRange: [number, number] = [
    gap2End + centerExitPause,
    gap2End + centerExitPause + centerExitDuration,
  ]

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
      {/* Invisible viewport-center marker (see viewportCenterRef).
          Sized to the morphing headline's own rendered height and
          centered on the viewport via translateY(-50%), so its
          top/bottom edges straddle the centered headline's extent:
            marker.top    = windowHeight/2 - headlineHeight/2
            marker.bottom = windowHeight/2 + headlineHeight/2
          `useMeetingProgress` then produces a real, non-zero
          scroll window during which the About→WaterThemes seam
          sweeps through the centered headline. */}
      <div
        ref={viewportCenterRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "50%",
          left: 0,
          width: 0,
          height: headlineHeight,
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
      />
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
        centerEnterRange={centerEnterRange}
        centerExitRange={centerExitRange}
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
          responsiveHeadline fills in on smaller screens.
          Wrapped in a StickyScrollSection so the panel pins at the
          header for a ~100vh scroll runway before unpinning into the
          WaterThemesPanel. Mirrors the WaterThemesPanel geometry
          (stickyTop=headerHeight, stickyHeight=100vh−headerHeight) so
          both panels share the same pinned rectangle below the header.
          The outer div is painted with the frame background so the
          sticky region reads as continuous white frame, matching the
          WaterThemesPanel pattern. */}
      <div
        ref={aboutPanelRef}
        style={{ backgroundColor: theme.palette.common.white }}
      >
        <StickyScrollSection
          height="200vh"
          stickyTop={theme.layout.headerHeight}
          stickyHeight={`calc(100vh - ${theme.layout.headerHeight}px)`}
        >
          <CoeqwalPanel
            id="about-coeqwal"
            background={theme.palette.brand.water}
            textColor={theme.palette.text.secondary}
            // Size the inner rounded card so the CoeqwalPanel's total
            // outer height (minHeight + 2·insetY from its own py
            // padding) exactly equals the StickyScrollSection's
            // stickyHeight (`100vh − headerHeight`). This matches the
            // WaterThemesPanel geometry. Its content wrapper is
            // `height: 100%` inside the sticky div, with `py: insetY`
            // producing the same rounded-card extent. Without
            // subtracting the second `insetY` the CoeqwalPanel is
            // `insetY` taller than the sticky container, which clips
            // the bottom frame-gap under `overflow: hidden` and makes
            // the rounded card sit flush with the sticky bottom edge
            // instead of floating with symmetric top/bottom padding.
            minHeight={`calc(100vh - ${theme.layout.headerHeight}px - 2 * ${tunerInsetY()})`}
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
                COEQWAL – the Collaboratory for Equity in Water Allocation – is
                a publicly-funded project that works with communities to better
                understand how water is managed in California.
                <br />
                <br />
                Using water planning models, COEQWAL sheds light on how
                alternative decisions and climate change scenarios shape our
                water future.
              </>
            }
            cta={
              <AboutCtaLink href="/about">
                Learn more about COEQWAL
              </AboutCtaLink>
            }
            layout="split"
            descriptionSx={{ maxWidth: "calc(100% - 40px)" }}
            scrollIndicator={
              <ScrollToButton
                color={`${theme.palette.text.secondary}D9`}
                size={52}
                scrollToId="water-themes"
                // Same offset math as VideoHero's scroll button: land
                // the target panel's rounded card flush below the
                // header by subtracting the header height and adding
                // back one top frame-gap. Resolved at click time so
                // live PanelTuner edits take effect.
                scrollOffset={() => theme.layout.headerHeight - tunerInsetYPx()}
                ariaLabel="Scroll down to the water issues section"
              />
            }
          />
        </StickyScrollSection>
      </div>

      {/* 
          WaterThemesPanel reads `?theme=...` via `usePanelRoute`
          (which calls `useSearchParams`), so it must sit under a
          Suspense boundary. The boundary is local here, not around
          the entire IntroSection in page.tsx, so the rest of the
          intro (VideoHero, About panel) renders at SSG. */}
      <Suspense fallback={null}>
        <WaterThemesPanel
          panelRef={waterThemesPanelRef}
          dockRef={waterThemesDockRef}
          contentOpacity={waterThemesOpacity}
          borderRadius={tunerRadius()}
          inset={{ x: tunerInsetX(), y: tunerInsetY() }}
          frameBackground={theme.palette.common.white}
        />
      </Suspense>

      {/* Want to know more?.frame + rounded inset panel.
          The `id` sits on the OUTER white frame wrapper (not the
          inner rounded card) so the panel-3 scroll-advance arrow's
          `scrollOffset = headerHeight - insetY` lands this panel
          with the same geometry as panels 2 and 3: the frame's top
          `insetY` tucks behind the fixed header and the inner
          rounded card lines up flush at `y = headerHeight`. */}
      <Box
        id="want-to-know-more"
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
            pb: `calc(${theme.space.panel.padding} + 50px)`,
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
            <Typography variant="body1">
              Water is limited and every choice has trade-offs. COEQWAL allows
              you to explore different water scenarios and understand how
              decisions shape potential futures for communities, farms, rivers,
              and the Delta.
            </Typography>

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
                  rest: "how water in California\u2019s Central Valley is managed",
                },
                {
                  verb: "Explore",
                  rest: "how water outcomes shift under different scenarios",
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
          </MotionBox>
        </Box>
      </Box>
    </Box>
  )
}

export default IntroSection
