"use client"

/**
 * WaterThemesPanel — Sticky scrollytelling panel for the "What water issues
 * matter to you?" section of the IntroSection.
 *
 * Scroll phases:
 *   1. Delta Aerials image visible with dashed circle outlines
 *   2. Image fades out, gradient shows through
 *   3. Photos fill the circles and labels appear (all at once)
 *
 * The SVG overlay uses the image's native coordinate space (2784×1066) so
 * circles stay locked to landmarks regardless of viewport size.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { NavArrow } from "@repo/ui"
import { motion, useReducedMotion } from "@repo/motion"
import {
  StickyScrollSection,
  useScrollProgress,
  useScrollValue,
} from "@repo/scrollytelling"
import type { MotionValue } from "@repo/motion"
import { WATER_THEMES, THEME_LABEL_CONFIG } from "../content/themes"
import { usePanelRoute } from "../hooks/usePanelRoute"

/* ─────────────────────────────────────────────────────────────────────────── */
/* IMAGE & CIRCLE CONFIG                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

/** Native dimensions of the Delta Aerials image */
const IMG_W = 2784
const IMG_H = 1066

const DELTA_AERIALS_SRC = "/images/themes/2025_08_28_KJ_3517_Delta_Aerials.png"

const WATER_THEME_PHOTOS: Record<string, string | undefined> = {
  cws: "/images/themes/FL_Porterville-9320.jpg",
  ag_gw: "/images/themes/PJH_Sprinklers_10911-2_07_15_2004.jpg",
  eco: "/images/themes/CC_salmon_underH20-5_10_15_2012.jpg",
  delta: "/images/themes/2025_03_11_NS_0036_Oroville_Lake_Levels.jpg",
} as const

interface ThemeCircle {
  id: string
  /** Center X in image-space pixels (0–2784) */
  cx: number
  /** Center Y in image-space pixels (0–1066) */
  cy: number
  /** Radius in image-space pixels */
  r: number
  photo: string
  /** Scale factor for the photo within the circle (default 1). Values > 1 zoom out. */
  photoScale?: number
  label: string
  description: string
}

/** Placeholder circle positions — tune visually against the aerial image */
const CIRCLE_CONFIG: ThemeCircle[] = [
  {
    id: "cws",
    cx: 1028,
    cy: 560,
    r: 130,
    photo: WATER_THEME_PHOTOS.cws!,
    label:
      THEME_LABEL_CONFIG.cws?.label ??
      WATER_THEMES.find((t) => t.id === "cws")?.shortLabel ??
      "Community water systems",
    description: WATER_THEMES.find((t) => t.id === "cws")?.description ?? "",
  },
  {
    id: "ag_gw",
    cx: 628,
    cy: 873,
    r: 130,
    photo: WATER_THEME_PHOTOS.ag_gw!,
    label:
      THEME_LABEL_CONFIG.ag_gw?.label ??
      WATER_THEMES.find((t) => t.id === "ag_gw")?.shortLabel ??
      "Farms & groundwater",
    description: WATER_THEMES.find((t) => t.id === "ag_gw")?.description ?? "",
  },
  {
    id: "eco",
    cx: 1420,
    cy: 871,
    r: 130,
    photo: WATER_THEME_PHOTOS.eco!,
    label:
      THEME_LABEL_CONFIG.eco?.label ??
      WATER_THEMES.find((t) => t.id === "eco")?.shortLabel ??
      "Rivers & ecosystems",
    description: WATER_THEMES.find((t) => t.id === "eco")?.description ?? "",
  },
  {
    id: "delta",
    cx: 1810,
    cy: 558,
    r: 130,
    photo: WATER_THEME_PHOTOS.delta!,
    label:
      THEME_LABEL_CONFIG.delta?.label ??
      WATER_THEMES.find((t) => t.id === "delta")?.shortLabel ??
      "The Delta",
    description: WATER_THEMES.find((t) => t.id === "delta")?.description ?? "",
  },
  {
    id: "governance",
    cx: 2200,
    cy: 871,
    r: 130,
    photo: WATER_THEME_PHOTOS.governance ?? "",
    label:
      WATER_THEMES.find((t) => t.id === "governance")?.shortLabel ??
      "Water operations and impacts",
    description:
      WATER_THEMES.find((t) => t.id === "governance")?.description ??
      "How water management decisions affect trade-offs, equity and resilience",
  },
  {
    id: "climate",
    cx: 2589,
    cy: 558,
    r: 130,
    photo: WATER_THEME_PHOTOS.climate ?? "",
    label:
      WATER_THEMES.find((t) => t.id === "climate")?.shortLabel ??
      "Drought and climate risk",
    description:
      WATER_THEMES.find((t) => t.id === "climate")?.description ??
      "How the water system performs under drought stress, climate variability, and extreme conditions",
  },
]

/* ─────────────────────────────────────────────────────────────────────────── */
/* STAGGER TIMING                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

/** Left-to-right reveal order — sorted by cx position */
const SORTED_INDICES = CIRCLE_CONFIG.map((c, i) => ({ cx: c.cx, i }))
  .sort((a, b) => a.cx - b.cx)
  .map((entry) => entry.i)

const PHOTO_START = 0.3
const PHOTO_END = 0.7
const LABEL_START = 0.32
const LABEL_END = 0.72
const FADE_DUR = 0.08
const CIRCLE_COUNT = CIRCLE_CONFIG.length

function getStaggerStart(index: number, rangeStart: number, rangeEnd: number) {
  const order = SORTED_INDICES.indexOf(index)
  return (
    rangeStart +
    (order / (CIRCLE_COUNT - 1)) * (rangeEnd - rangeStart - FADE_DUR)
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* PER-CIRCLE SUB-COMPONENTS (each calls its own hooks — lint-safe)            */
/* ─────────────────────────────────────────────────────────────────────────── */

/** Photo fill clipped to a circle — owns its staggered opacity hook */
function ThemeCirclePhoto({
  circle,
  index,
  progress,
  prefersReducedMotion,
}: {
  circle: ThemeCircle
  index: number
  progress: MotionValue<number>
  prefersReducedMotion: boolean | null
}) {
  const start = getStaggerStart(index, PHOTO_START, PHOTO_END)
  const opacity = useScrollValue(
    progress,
    [start, start + FADE_DUR],
    prefersReducedMotion ? [1, 1] : [0, 1],
  )

  if (!circle.photo) return null

  const zoomOut = circle.photoScale ?? 1
  const imgR = circle.r / zoomOut
  const fit = circle.photoScale ? "xMidYMid meet" : "xMidYMid slice"

  return (
    <motion.image
      href={circle.photo}
      x={circle.cx - imgR}
      y={circle.cy - imgR}
      width={imgR * 2}
      height={imgR * 2}
      clipPath={`url(#clip-${circle.id})`}
      preserveAspectRatio={fit}
      style={{ opacity }}
    />
  )
}

/** Label card positioned at 9:00 — owns its staggered opacity hook */
function ThemeCircleLabel({
  circle,
  index,
  progress,
  prefersReducedMotion,
  onLearnMore,
}: {
  circle: ThemeCircle
  index: number
  progress: MotionValue<number>
  prefersReducedMotion: boolean | null
  onLearnMore?: () => void
}) {
  const theme = useTheme()
  const start = getStaggerStart(index, LABEL_START, LABEL_END)
  const opacity = useScrollValue(
    progress,
    [start, start + FADE_DUR],
    prefersReducedMotion ? [1, 1] : [0, 1],
  )

  const labelW = 340
  const gap = 20
  const labelX = circle.cx - circle.r - gap - labelW
  const labelY = circle.cy - 120

  const themeColors = theme.palette.waterThemes[
    circle.id as keyof typeof theme.palette.waterThemes
  ] ?? { background: "#eee", text: "#333" }

  return (
    <motion.foreignObject
      x={labelX}
      y={labelY}
      width={labelW}
      height={260}
      style={{ opacity, overflow: "visible" }}
    >
      <div
        style={{
          backgroundColor: themeColors.background,
          color: theme.palette.text.primary,
          fontFamily: "inherit",
          borderRadius: "8px",
          padding: "14px 18px",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: "24px",
            lineHeight: 1.3,
            marginBottom: "6px",
          }}
        >
          {circle.label}
        </div>
        <div
          style={{
            fontSize: "18px",
            lineHeight: 1.5,
          }}
        >
          {circle.description}
        </div>
        {onLearnMore && (
          <div
            role="button"
            tabIndex={0}
            onClick={onLearnMore}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onLearnMore()
              }
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "10px",
              fontSize: "18px",
              fontWeight: 600,
              cursor: "pointer",
              pointerEvents: "auto",
            }}
          >
            Learn more
            <NavArrow />
          </div>
        )}
      </div>
    </motion.foreignObject>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* INNER CONTENT (reads scroll progress from StickyScrollSection context)      */
/* ─────────────────────────────────────────────────────────────────────────── */

function WaterThemesPanelContent({
  contentOpacity,
  borderBottom,
}: {
  contentOpacity: MotionValue<number>
  borderBottom?: string
}) {
  const theme = useTheme()
  const prefersReducedMotion = useReducedMotion()
  const { openThemePanel } = usePanelRoute()

  // Local scroll progress (0–1) within this StickyScrollSection
  const progress = useScrollProgress()

  // Phase opacities — when reduced motion, show final state
  // Image fades out after the last theme circle/label has appeared
  const imageOpacity = useScrollValue(
    progress,
    [0.75, 0.88],
    prefersReducedMotion ? [0, 0] : [1, 0],
  )
  const circleOutlineOpacity = useScrollValue(
    progress,
    [0.15, 0.3],
    prefersReducedMotion ? [1, 1] : [0, 1],
  )

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderBottom: borderBottom ?? "none",
      }}
    >
      {/* Layer 1: Gradient background (always visible) */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to bottom, ${theme.palette.brand.water}, ${theme.palette.brand.panelLight})`,
        }}
      />

      {/* Layer 2: Delta Aerials image (fades out on scroll) */}
      <motion.img
        src={DELTA_AERIALS_SRC}
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "auto",
          opacity: imageOpacity,
          pointerEvents: "none",
        }}
      />

      {/* Layer 3: SVG overlay — circles, photos, labels */}
      <svg
        viewBox={`0 0 ${IMG_W} ${IMG_H}`}
        preserveAspectRatio="xMidYMax meet"
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "auto",
          pointerEvents: "none",
        }}
      >
        <defs>
          {CIRCLE_CONFIG.map((c) => (
            <clipPath key={`clip-${c.id}`} id={`clip-${c.id}`}>
              <circle cx={c.cx} cy={c.cy} r={c.r} />
            </clipPath>
          ))}
        </defs>

        {/* Photo fills (clipped to circles) */}
        {CIRCLE_CONFIG.map((c, i) => (
          <ThemeCirclePhoto
            key={`photo-${c.id}`}
            circle={c}
            index={i}
            progress={progress}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}

        {/* Dashed circle outlines (on top of photos) */}
        {CIRCLE_CONFIG.map((c) => (
          <motion.circle
            key={`outline-${c.id}`}
            cx={c.cx}
            cy={c.cy}
            r={c.r}
            fill="none"
            stroke="white"
            strokeWidth={8}
            strokeDasharray="18 20"
            style={{ opacity: circleOutlineOpacity }}
          />
        ))}

        {/* Labels via foreignObject */}
        {CIRCLE_CONFIG.map((c, i) => (
          <ThemeCircleLabel
            key={`label-${c.id}`}
            circle={c}
            index={i}
            progress={progress}
            prefersReducedMotion={prefersReducedMotion}
            onLearnMore={
              c.id === "delta" ? () => openThemePanel("delta") : undefined
            }
          />
        ))}
      </svg>

      {/* Layer 4: Text content — headline + description */}
      <motion.div
        style={{
          position: "relative",
          zIndex: 1,
          opacity: contentOpacity,
          paddingLeft: theme.space.panel.padding,
          paddingRight: theme.space.panel.padding,
          paddingTop: theme.space.panel.topOffset,
        }}
      >
        {/* Responsive headline — visible on xs–md only */}
        <Box sx={{ display: { xs: "block", lg: "none" }, mb: 2 }}>
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
        </Box>

        {/* Description — right column on md+, matching CoeqwalPanel split layout */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            columnGap: { md: 6 },
          }}
        >
          <Box />
          <Typography
            variant="body1"
            component="div"
            sx={{
              color: "text.primary",
              maxWidth: "calc(100% - 40px)",
            }}
          >
            Water is important to all of us — from farmers in the Central Valley
            to communities in the Delta, from salmon in the Sacramento River to
            urban water users in Los Angeles. We can consider how decisions
            affect the issues people care about.
          </Typography>
        </Box>
      </motion.div>
    </Box>
  )
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* EXPORTED PANEL                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

export interface WaterThemesPanelProps {
  /** Ref forwarded to the outer wrapper */
  panelRef: React.RefObject<HTMLDivElement | null>
  /**
   * Ref attached to an invisible marker at the END of the scroll runway.
   * MorphingHeadline uses this via useDockOffset so the headline only
   * scrolls away once the full 300vh sticky section has been scrolled through.
   * Without this, docking starts as soon as the section's *top* passes y=0,
   * which pushes the headline off-screen ~200vh too early.
   */
  dockRef?: React.RefObject<HTMLDivElement | null>
  /** Scroll-driven opacity from the IntroSection crossfade system */
  contentOpacity: MotionValue<number>
  /** Bottom border style */
  borderBottom?: string
}

export function WaterThemesPanel({
  panelRef,
  dockRef,
  contentOpacity,
  borderBottom,
}: WaterThemesPanelProps) {
  return (
    <div ref={panelRef}>
      <StickyScrollSection height="300vh">
        <WaterThemesPanelContent
          contentOpacity={contentOpacity}
          borderBottom={borderBottom}
        />
      </StickyScrollSection>
      {/* Dock marker — positioned 75vh above the section end via
          position:relative so getBoundingClientRect() reflects the offset.
          The headline starts scrolling away once this marker's top crosses y=0,
          which happens ~75vh before the section ends (after photos/labels
          are fully revealed at the ~0.75 progress mark). */}
      {dockRef && (
        <div
          ref={dockRef}
          style={{ height: 0, position: "relative", top: "-100vh" }}
        />
      )}
    </div>
  )
}
