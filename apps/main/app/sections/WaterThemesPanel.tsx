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
import { motion, useReducedMotion } from "@repo/motion"
import {
  StickyScrollSection,
  useScrollProgress,
  useScrollValue,
} from "@repo/scrollytelling"
import type { MotionValue } from "@repo/motion"
import { WATER_THEMES } from "@repo/data/coeqwal"
import { THEME_LABEL_CONFIG } from "../content/themes"

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
  delta: "/images/themes/Screenshot 2026-02-25 at 11.21.jpg",
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
    description:
      WATER_THEMES.find((t) => t.id === "cws")?.description ?? "",

  },
  {
    id: "ag_gw",
    cx: 628,
    cy: 833,
    r: 130,
    photo: WATER_THEME_PHOTOS.ag_gw!,
    label:
      THEME_LABEL_CONFIG.ag_gw?.label ??
      WATER_THEMES.find((t) => t.id === "ag_gw")?.shortLabel ??
      "Farms & groundwater",
    description:
      WATER_THEMES.find((t) => t.id === "ag_gw")?.description ?? "",

  },
  {
    id: "eco",
    cx: 1420,
    cy: 831,
    r: 130,
    photo: WATER_THEME_PHOTOS.eco!,
    label:
      THEME_LABEL_CONFIG.eco?.label ??
      WATER_THEMES.find((t) => t.id === "eco")?.shortLabel ??
      "Rivers & ecosystems",
    description:
      WATER_THEMES.find((t) => t.id === "eco")?.description ?? "",

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
    description:
      WATER_THEMES.find((t) => t.id === "delta")?.description ?? "",

  },
  {
    id: "governance",
    cx: 2200,
    cy: 831,
    r: 130,
    photo: WATER_THEME_PHOTOS.governance ?? "",
    label:
      WATER_THEMES.find((t) => t.id === "governance")?.shortLabel ??
      "Operations & impacts",
    description:
      WATER_THEMES.find((t) => t.id === "governance")?.description ?? "",

  },
  {
    id: "climate",
    cx: 2589,
    cy: 558,
    r: 130,
    photo: WATER_THEME_PHOTOS.climate ?? "",
    label:
      WATER_THEMES.find((t) => t.id === "climate")?.shortLabel ??
      "Climate resilience",
    description:
      WATER_THEMES.find((t) => t.id === "governance")?.description ?? "",

  },
]

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

  // Local scroll progress (0–1) within this StickyScrollSection
  const progress = useScrollProgress()

  // Phase opacities — when reduced motion, show final state
  // TODO: background fade temporarily disabled for experimentation
  const imageOpacity = useScrollValue(
    progress,
    [0.30, 0.50],
    prefersReducedMotion ? [1, 1] : [1, 1],
  )
  const circleOutlineOpacity = useScrollValue(
    progress,
    [0.20, 0.35],
    prefersReducedMotion ? [1, 1] : [0, 1],
  )
  const photoOpacity = useScrollValue(
    progress,
    [0.50, 0.70],
    prefersReducedMotion ? [1, 1] : [0, 1],
  )
  const labelOpacity = useScrollValue(
    progress,
    [0.55, 0.75],
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

        {/* Dashed circle outlines */}
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

        {/* Photo fills (clipped to circles) */}
        {CIRCLE_CONFIG.filter((c) => c.photo).map((c) => (
          <motion.image
            key={`photo-${c.id}`}
            href={c.photo}
            x={c.cx - c.r}
            y={c.cy - c.r}
            width={c.r * 2}
            height={c.r * 2}
            clipPath={`url(#clip-${c.id})`}
            preserveAspectRatio="xMidYMid slice"
            style={{ opacity: photoOpacity }}
          />
        ))}

        {/* Labels via foreignObject */}
        {CIRCLE_CONFIG.map((c) => {
          const labelW = 340
          const gap = 20
          // 9:00 position (direct left): right edge of label near circle's left,
          // vertically centered on the circle
          const labelX = c.cx - c.r - gap - labelW
          const labelY = c.cy - 120

          // Per-theme colors from the design system
          const themeColors =
            theme.palette.waterThemes[
              c.id as keyof typeof theme.palette.waterThemes
            ] ?? { background: "#eee", text: "#333" }

          return (
            <motion.foreignObject
              key={`label-${c.id}`}
              x={labelX}
              y={labelY}
              width={labelW}
              height={260}
              style={{ opacity: labelOpacity, overflow: "visible" }}
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
                  {c.label}
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    lineHeight: 1.5,
                  }}
                >
                  {c.description}
                </div>
              </div>
            </motion.foreignObject>
          )
        })}
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
