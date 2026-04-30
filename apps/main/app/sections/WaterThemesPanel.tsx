"use client"

/**
 * WaterThemesPanel.Sticky scrollytelling panel for the "What water issues
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
import {
  NavArrow,
  InfoCard,
  ScrollToButton,
  resolveRadius,
  resolveInset,
  tunerInsetY,
  tunerInsetYPx,
  type RadiusValue,
  type PanelInset,
} from "@repo/ui"
import { motion, useReducedMotion } from "@repo/motion"
import {
  StickyScrollSection,
  useScrollProgress,
  useScrollValue,
} from "@repo/scrollytelling"
import type { MotionValue } from "@repo/motion"
import { WATER_THEMES } from "../content/themes"
import { usePanelRoute } from "../hooks/usePanelRoute"

/*───────────────── */
/* IMAGE & CIRCLE CONFIG                                                       */
/*───────────────── */

/** Native dimensions of the Delta Aerials image (kept for reference). */
const _IMG_W = 2784
const _IMG_H = 1066

const DELTA_AERIALS_SRC = "/images/themes/2025_08_28_KJ_3517_Delta_Aerials.png"

const WATER_THEME_PHOTOS: Record<string, string | undefined> = {
  cws: "/images/themes/FL_Porterville-9320.jpg",
  ag_gw: "/images/themes/PJH_Sprinklers_10911-2_07_15_2004.jpg",
  eco: "/images/themes/CC_salmon_underH20-5_10_15_2012.jpg",
  delta: "/images/themes/2025_03_11_NS_0036_Oroville_Lake_Levels.jpg",
} as const

interface ThemeCircle {
  id: string
  /** Center X in image-space pixels (0-2784) */
  cx: number
  /** Center Y in image-space pixels (0-1066) */
  cy: number
  /** Radius in image-space pixels */
  r: number
  photo: string
  /** Scale factor for the photo within the circle (default 1). Values > 1 zoom out. */
  photoScale?: number
  label: string
  description: string
}

/** Throws at module load if a theme ID is missing from WATER_THEMES. */
function requireTheme(id: string) {
  const t = WATER_THEMES.find((t) => t.id === id)
  if (!t) throw new Error(`WATER_THEMES: no entry for id "${id}"`)
  return t
}

/** Circle positions.tune visually against the aerial image. Content comes from WATER_THEMES. */
const CIRCLE_CONFIG: ThemeCircle[] = [
  {
    id: "cws",
    cx: 1028,
    cy: 560,
    r: 130,
    photo: WATER_THEME_PHOTOS.cws!,
    label: requireTheme("cws").shortLabel,
    description: requireTheme("cws").description,
  },
  {
    id: "ag_gw",
    cx: 628,
    cy: 873,
    r: 130,
    photo: WATER_THEME_PHOTOS.ag_gw!,
    label: requireTheme("ag_gw").shortLabel,
    description: requireTheme("ag_gw").description,
  },
  {
    id: "eco",
    cx: 1420,
    cy: 871,
    r: 130,
    photo: WATER_THEME_PHOTOS.eco!,
    label: requireTheme("eco").shortLabel,
    description: requireTheme("eco").description,
  },
  {
    id: "delta",
    cx: 1810,
    cy: 558,
    r: 130,
    photo: WATER_THEME_PHOTOS.delta!,
    label: requireTheme("delta").shortLabel,
    description: requireTheme("delta").description,
  },
  {
    id: "governance",
    cx: 2200,
    cy: 871,
    r: 130,
    photo: WATER_THEME_PHOTOS.governance ?? "",
    label: requireTheme("governance").shortLabel,
    description: requireTheme("governance").description,
  },
]

/*───────────────── */
/* STAGGER TIMING                                                              */
/*───────────────── */

/** Left-to-right reveal order.sorted by cx position */
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

/*───────────────── */
/* PER-CIRCLE SUB-COMPONENTS (each calls its own hooks.lint-safe)            */
/*───────────────── */

/** Photo fill clipped to a circle.owns its staggered opacity hook */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

/** Label card positioned at 9:00.owns its staggered opacity hook */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ThemeCircleLabel({
  circle,
  index,
  progress,
  prefersReducedMotion,
  onLearnMore,
  comingSoon,
}: {
  circle: ThemeCircle
  index: number
  progress: MotionValue<number>
  prefersReducedMotion: boolean | null
  onLearnMore?: () => void
  comingSoon?: boolean
}) {
  const theme = useTheme()
  const start = getStaggerStart(index, LABEL_START, LABEL_END)
  const opacity = useScrollValue(
    progress,
    [start, start + FADE_DUR],
    prefersReducedMotion ? [1, 1] : [0, 1],
  )

  const labelW = 400
  const gap = 20
  const labelX = circle.cx - circle.r - gap - labelW
  const labelY = circle.cy - 140

  const themeColors = theme.palette.waterThemes[
    circle.id as keyof typeof theme.palette.waterThemes
  ] ?? { background: "#eee", text: "#333" }

  return (
    <motion.foreignObject
      x={labelX}
      y={labelY}
      width={labelW}
      height={320}
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
            fontSize: theme.typography.displayBody.fontSize,
            fontWeight: theme.typography.displayBody.fontWeight,
            lineHeight: theme.typography.displayBody.lineHeight,
          }}
        >
          {circle.description}
        </div>
        {onLearnMore ? (
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
              fontSize: theme.typography.displayBody.fontSize as string,
              fontWeight: 600,
              cursor: "pointer",
              pointerEvents: "auto",
            }}
          >
            Learn more
            <NavArrow />
          </div>
        ) : comingSoon ? (
          <div
            style={{
              marginTop: "10px",
              fontSize: theme.typography.displayBody.fontSize as string,
              fontWeight: 600,
              opacity: 0.5,
            }}
          >
            Coming soon
          </div>
        ) : null}
      </div>
    </motion.foreignObject>
  )
}

/*───────────────── */
/* INNER CONTENT (reads scroll progress from StickyScrollSection context)      */
/*───────────────── */

function WaterThemesPanelContent({
  contentOpacity,
  borderBottom,
  borderRadius,
  inset,
  frameBackground,
}: {
  contentOpacity: MotionValue<number>
  borderBottom?: string
  borderRadius?: RadiusValue
  inset?: PanelInset
  frameBackground?: string
}) {
  const theme = useTheme()
  const prefersReducedMotion = useReducedMotion()
  const { openThemePanel } = usePanelRoute()

  // Local scroll progress (0-1) within this StickyScrollSection
  const progress = useScrollProgress()

  // Phase opacities.when reduced motion, show final state
  // Image stays visible while cards are fully opaque, then fades out late
  const imageOpacity = useScrollValue(
    progress,
    [0.85, 0.95],
    prefersReducedMotion ? [0, 0] : [1, 0],
  )

  const radius = resolveRadius(borderRadius, theme.borderRadius)
  const insetCfg = resolveInset(inset)

  const content = (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderBottom: insetCfg ? "none" : (borderBottom ?? "none"),
        borderRadius: radius,
      }}
    >
      {/* Layer 1: Gradient background (always visible) */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
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
          zIndex: 0,
          opacity: imageOpacity,
          pointerEvents: "none",
        }}
      />

      {/* Layer 3: Text content + theme cards */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          px: theme.space.panel.padding,
          pt: theme.space.panel.topOffset,
          pb: theme.space.panel.padding,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "100%",
          boxSizing: "border-box",
          // Short-viewport layout: anchor content to the top so the
          // paragraph sits at the same vertical level as the morphing
          // headline instead of being vertically centered. The top
          // padding is reduced by headerHeight + insetY so the content
          // starts at the same viewport Y as the MorphingHeadline
          // overlay (which is fixed at `top: panel.topOffset`). The
          // sticky panel is pinned at `headerHeight` from the viewport
          // top, and the rounded card is inset by `insetY`, so those
          // two offsets must be subtracted for the content's top edge
          // to land on the same viewport row as the headline.
          "@media (max-height: 859px)": {
            justifyContent: "flex-start",
            pt: `calc(${theme.space.panel.topOffset} - ${theme.layout.headerHeight}px - ${tunerInsetY()})`,
          },
        }}
      >
        {/* Headline + intro - fades in with crossfade */}
        <motion.div style={{ opacity: contentOpacity }}>
          {/* Short-viewport split: responsive headline in the left
              column, paragraph in the right column (mirrors the About
              panel's split layout). Only kicks in at md+ widths so the
              paragraph does not get cramped on narrow landscape phones.
              On lg+ the responsive headline is hidden and the
              MorphingHeadline overlay occupies the left half, so the
              paragraph still reads as sitting beside it. */}
          <Box
            sx={{
              "@media (max-height: 859px)": {
                display: { xs: "block", md: "grid" },
                gridTemplateColumns: { md: "1fr 1fr" },
                columnGap: { md: theme.space.section.lg },
                alignItems: "start",
              },
            }}
          >
            {/* Responsive headline - visible on xs-md only */}
            <Box
              sx={{
                display: { xs: "block", lg: "none" },
                mb: 2,
                "@media (max-height: 859px)": { mb: { xs: 2, md: 0 } },
              }}
            >
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

            <Typography
              variant="body1"
              sx={{
                color: "text.primary",
                maxWidth: "66%",
                mb: theme.space.section.md,
                "@media (max-height: 859px)": {
                  maxWidth: { xs: "66%", md: "none" },
                  mb: { xs: theme.space.section.md, md: 0 },
                  gridColumn: { md: "2" },
                  // Lift the paragraph by its own half-leading so the
                  // first character's cap-top aligns with the morphing
                  // headline's top instead of sitting below it by the
                  // body1 line-height gap. body1 has lineHeight 1.75
                  // at fontSize 1.25rem, so (1.75 - 1) / 2 = 0.375em
                  // of invisible space sits above the glyphs. Negating
                  // that margin brings the visual top flush.
                  mt: { md: "-0.375em" },
                },
              }}
            >
              Water is important to all of us — from farmers in the Central
              Valley to communities in the Delta, from salmon in the Sacramento
              River to urban water users in Los Angeles. We can consider how
              decisions affect the issues people care about.
            </Typography>
          </Box>
        </motion.div>

        {/* Five theme cards - horizontal grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            alignItems: "stretch",
            columnGap: theme.space.section.sm,
            rowGap: theme.space.component.lg,
            // Short-viewport layout: the text block above is anchored
            // to the headline's top instead of being vertically
            // centered, which removes the natural breathing room
            // between the paragraph and the cards. Restore it with an
            // explicit top padding.
            "@media (max-height: 859px)": {
              pt: "60px",
            },
          }}
        >
          {CIRCLE_CONFIG.map((c) => {
            const active = c.id !== "governance"
            return (
              <InfoCard
                key={c.id}
                title={c.label}
                description={c.description}
                onClick={active ? () => openThemePanel(c.id) : undefined}
                variant="onLight"
                // Active cards: lift the translucent fill
                // (rgba(210,228,242,0.8) by default) to full opacity
                // on hover so the card "comes forward" and invites
                // interaction. Non-active ("Coming soon") cards
                // inherit the default hover behaviour (no click, so
                // no hover lift is applied by InfoCard).
                hoverBackground={active ? "rgb(210,228,242)" : undefined}
              >
                {!active && (
                  <Typography
                    variant="body2"
                    sx={{
                      mt: theme.space.component.sm,
                      fontStyle: "italic",
                    }}
                  >
                    Coming soon
                  </Typography>
                )}
              </InfoCard>
            )
          })}
        </Box>
      </Box>

      {/* Scroll-down arrow, matches the VideoHero and About panels.
          Absolutely positioned against the rounded card (whose wrapper
          has position:relative), bottom-center, above all other
          layers so it stays visible throughout the sticky pin. */}
      <Box
        sx={{
          position: "absolute",
          bottom: "clamp(24px, 4vh, 48px)",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 3,
          pointerEvents: "auto",
        }}
      >
        <ScrollToButton
          color={`${theme.palette.common.white}D9`}
          size={52}
          scrollToId="want-to-know-more"
          // Same offset math as the VideoHero / About buttons: land
          // the target section's rounded card flush below the fixed
          // header. Resolved at click time so live PanelTuner edits
          // take effect immediately.
          scrollOffset={() => theme.layout.headerHeight - tunerInsetYPx()}
          ariaLabel="Scroll down to the want to know more section"
        />
      </Box>
    </Box>
  )

  if (insetCfg) {
    return (
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          background: frameBackground ?? "transparent",
          borderBottom: borderBottom ?? "none",
          px: insetCfg.x,
          py: insetCfg.y,
          boxSizing: "border-box",
        }}
      >
        {content}
      </Box>
    )
  }

  return content
}

/*───────────────── */
/* EXPORTED PANEL                                                               */
/*───────────────── */

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
  /** Rounded corner radius for the pinned panel surface. */
  borderRadius?: RadiusValue
  /** Pull the panel in from the viewport edges so all four rounded
   *  corners are visible against a `frameBackground`. */
  inset?: PanelInset
  /** Background rendered in the frame around an inset panel. */
  frameBackground?: string
}

export function WaterThemesPanel({
  panelRef,
  dockRef,
  contentOpacity,
  borderBottom,
  borderRadius,
  inset,
  frameBackground,
}: WaterThemesPanelProps) {
  const theme = useTheme()
  // Pin the sticky child `headerHeight` px from the top of the
  // viewport and size it to the viewport below the header. The
  // inner rounded card is inset on top and bottom by the `inset`
  // prop, so its visible height ends up
  //   100vh - headerHeight - 2 · insetY
  // (one gap-band above and below the rounded rect). The 200vh
  // scroll runway gives a ~100vh pinned window that drives the
  // image-fade / circle-reveal phases. The wrapper is painted
  // with the frame background so the pinned surface reads as
  // continuous frame.
  const headerHeight = theme.layout.headerHeight
  return (
    <div
      ref={panelRef}
      id="water-themes"
      style={{
        backgroundColor: frameBackground,
      }}
    >
      <StickyScrollSection
        height="200vh"
        stickyTop={headerHeight}
        stickyHeight={`calc(100vh - ${headerHeight}px)`}
      >
        <WaterThemesPanelContent
          contentOpacity={contentOpacity}
          borderBottom={borderBottom}
          borderRadius={borderRadius}
          inset={inset}
          frameBackground={frameBackground}
        />
      </StickyScrollSection>
      {/* Dock marker.positioned 75vh above the section end via
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
