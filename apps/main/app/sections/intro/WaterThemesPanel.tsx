"use client"

/**
 * WaterThemesPanel.Sticky scrollytelling panel for the "What water issues
 * matter to you?" section of the IntroSection
 */

import React from "react"
import { Box, Typography, useTheme, alpha } from "@repo/ui/mui"
import {
  InfoCard,
  InfoCardGrid,
  CircularArrowButton,
  ScrollToButton,
  resolveRadius,
  resolveInset,
  resolveCssLengthPx,
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
import { useTabNavigation } from "../../hooks/useTabNavigation"
import { TabKey } from "../../types/tabs"

/*───────────────── */
/* IMAGE & TAB CARDS                                                       */
/*───────────────── */

/** Native dimensions of the Delta Aerials image (kept for reference). */
const _IMG_W = 2784
const _IMG_H = 1066

const DELTA_AERIALS_SRC = "/images/themes/2025_08_28_KJ_3517_Delta_Aerials.png"

interface TabCard {
  tab: TabKey
  title: string
  description: string
}

/** The three squares link straight to a tab via navigateToTab. */
const TAB_CARDS: TabCard[] = [
  {
    tab: "learn",
    title: "Learn",
    description:
      "Learn how water flows through California's Central Valley and the tools we use for water planning and decision-making.",
  },
  {
    tab: "explore",
    title: "Explore",
    description:
      "Explore how water allocations change under different scenarios and hydroclimates — and discover new possibilities for California's water future.",
  },
  {
    tab: "share",
    title: "Share",
    description:
      "Select scenario data and share what you've learned to shape our water future.",
  },
]

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
  const { navigateToTab } = useTabNavigation()

  // Local scroll progress (0-1) within this StickyScrollSection
  const progress = useScrollProgress()

  // Phase opacities.when reduced motion, show final state
  // Image stays visible while cards are fully opaque, then fades out late
  const imageOpacity = useScrollValue(
    progress,
    [0, 1],
    prefersReducedMotion ? [1, 1] : [0, 1],
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
          background: `${theme.palette.brand.panelLight}`,
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
            pt: `calc(${theme.space.panel.topOffset} - ${theme.layout.headerHeight}px - ${theme.layout.panel.insetY})`,
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

        {/* Three squares, one per tab */}


        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: theme.space.section.sm,
            "@media (max-height: 859px)": { pt: "60px" },
          }}
        >
          {TAB_CARDS.map((c, i) => {
            const panelColor = theme.palette.tabPanels[c.tab]
            return (
              <React.Fragment key={c.tab}>
                <InfoCard
                  title={c.title}
                  titleVariant="h6"
                  description={c.description}
                  onClick={() => navigateToTab(c.tab)}
                  variant="onDark"
                  background={panelColor}
                  hoverBackground={alpha(panelColor, 0.85)}
                  sx={{ flex: 1, height: "250px" }}
                />
                {i < TAB_CARDS.length - 1 && (
                  <CircularArrowButton
                    decorative
                    size={40}
                    rotation="-90deg"
                  />
                )}
              </React.Fragment>
            )
          })}
        </Box>

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
