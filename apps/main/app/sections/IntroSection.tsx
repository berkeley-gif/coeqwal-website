"use client"

import { useRef, useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useTranslation } from "@repo/i18n"
import { Box, Typography, ArrowForwardIcon, useTheme } from "@repo/ui/mui"
import { CoeqwalPanel } from "@repo/ui"
import { motion } from "@repo/motion"
import {
  useScrollProgress,
  useMotionValue,
  useMeetingProgress,
  ScrollReveal,
} from "@repo/scrollytelling"

import { WATER_THEMES } from "@repo/data/coeqwal"
import { THEME_LABEL_CONFIG } from "../content/themes"
import VideoHero from "../components/VideoHero"
import type { VideoSource } from "../components/VideoHero"
import MorphingHeadline from "../components/MorphingHeadline"

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
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{children}</Typography>
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

const WATER_THEME_IDS = ["cws", "ag_gw", "eco", "delta"] as const

const WATER_THEME_PHOTOS: Partial<Record<string, string>> = {
  cws: "/images/themes/FL_Porterville-9320.jpg",
  ag_gw: "/images/themes/PJH_Sprinklers_10911-2_07_15_2004.jpg",
  eco: "/images/themes/CC_salmon_underH20-5_10_15_2012.jpg",
  delta: "/images/themes/Screenshot 2026-02-25 at 11.21.jpg",
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* THEME CARD                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

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

  // Scroll progress across the entire IntroSection
  const scrollProgress = useScrollProgress(containerRef)

  // Geometry-driven crossfade timing:
  // each value is the scroll progress when the panel border reaches the headline's top.
  // useMeetingProgress accounts for the headline being position:fixed (scroll rate = 0).
  const crossfadeAt1 = useMeetingProgress(
    containerRef, videoHeroRef, morphHeadlineRef,
    { edgeA: "bottom", edgeB: "top" },
  )
  const crossfadeAt2 = useMeetingProgress(
    containerRef, aboutPanelRef, morphHeadlineRef,
    { edgeA: "bottom", edgeB: "top" },
  )

  // Build panel boundaries for MorphingHeadline from the meeting points
  const panelBoundaries = useMemo(() => ({
    panels: [
      { start: 0,           mid: crossfadeAt1 / 2,                         end: crossfadeAt1 },
      { start: crossfadeAt1, mid: (crossfadeAt1 + crossfadeAt2) / 2,        end: crossfadeAt2 },
      { start: crossfadeAt2, mid: (crossfadeAt2 + 1) / 2,                   end: 1 },
    ],
    ready: crossfadeAt1 > 0 && crossfadeAt2 > 0,
  }), [crossfadeAt1, crossfadeAt2])

  // Content opacity driven by the same meeting points.
  // Seeded from the current scroll position so HMR / remount doesn't
  // leave content invisible when the user is already scrolled past a panel.
  const aboutOpacity = useMotionValue(
    scrollProgress.get() >= crossfadeAt1 ? 1 : 0
  )
  const waterThemesOpacity = useMotionValue(
    scrollProgress.get() >= crossfadeAt2 ? 1 : 0
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
  }, [scrollProgress, crossfadeAt1, crossfadeAt2, aboutOpacity, waterThemesOpacity])

  const waterThemePalette = theme.palette.waterThemes as Record<
    string,
    { background: string; text: string }
  >

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
          crossfadeAt synchronises the 0→1 fade precisely at the panel border.
          No exitRange: the final headline ("What water issues") stays fixed —
          it is the terminal state of the morph sequence. */}
      <MorphingHeadline
        ref={morphHeadlineRef}
        headlines={headlines}
        containerRef={containerRef}
        weights={[1, 1, 2]}
        panelBoundaries={panelBoundaries}
        crossfadeAt={crossfadeAt1 > 0 ? crossfadeAt1 : undefined}
        dockRef={waterThemesPanelRef}
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
        minHeight="80vh"
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
        cta={<AboutCtaLink href="/about">Learn more about COEQWAL</AboutCtaLink>}
        layout="split"
      />
      </div>

      {/* Water themes — headline handled by MorphingHeadline overlay on lg+;
          responsiveHeadline fills in on smaller screens */}
      <div ref={waterThemesPanelRef}>
      <CoeqwalPanel
        description="Water is important to all of us — from farmers in the Central Valley to communities in the Delta, from salmon in the Sacramento River to urban water users in Los Angeles. We can consider how decisions affect the issues people care about."
        borderBottom={RULE}
        layout="split"
        contentMotionStyle={{ opacity: waterThemesOpacity }}
        responsiveHeadline={
          <>
            <Typography
              variant="h2Main"
              component="span"
              sx={{ display: "block", color: "text.primary" }}
            >
              What water issues
            </Typography>
            <Typography
              variant="h1"
              component="span"
              sx={{ display: "block", color: "text.primary" }}
            >
              matter to you?
            </Typography>
          </>
        }
        descriptionSx={{
          mt: {
            xs: 0,
            lg: `calc(${theme.space.panel.topOffset} - ${theme.space.panel.padding})`,
          },
        }}
        childrenMt={{ xs: 5, lg: `calc(${theme.space.panel.padding} + 40px)` }}
      >
        {/* Four main theme cards — reveal the grid as it enters the viewport */}
        <ScrollReveal animation="fadeUp" amount={0.1} duration={0.5}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
              gap: { xs: 2, md: 2 },
            }}
          >
            {WATER_THEME_IDS.map((id, i) => {
              const colors = waterThemePalette[id] ?? { background: "#eee", text: "#333" }
              const description = WATER_THEMES.find((t) => t.id === id)?.description ?? ""
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
        </ScrollReveal>

        {/* ── Provisional themes (pending decision) ── */}
        <ScrollReveal animation="fadeUp" amount={0.1} duration={0.5} delay={0.1}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
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
        </ScrollReveal>
      </CoeqwalPanel>
      </div>

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
            Water is limited and every choice has trade-offs. COEQWAL allows
            you to explore different water scenarios and understand how
            decisions shape potential futures for communities, farms, rivers,
            and the Delta.
          </Typography>
        </MotionBox>
      </Box>
    </Box>
  )
}

export default IntroSection
