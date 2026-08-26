"use client"

/**
 * WaterThemesPanel.Sticky panel for the "Want to know more section of the IntroSection
 */

import React from "react"
import { Box, Typography, useTheme, alpha } from "@repo/ui/mui"
import {
  InfoCard,
  CircularArrowButton,
  resolveRadius,
  resolveInset,
  type RadiusValue,
  type PanelInset,
} from "@repo/ui"
import { motion, useReducedMotion } from "@repo/motion"
import {
  StickyScrollSection,
  useScrollProgress,
  useScrollValue,
} from "@repo/scrollytelling"
import { useTabNavigation } from "../../hooks/useTabNavigation"
import { TabKey } from "../../types/tabs"
import { ScrollToButton, resolveCssLengthPx } from "@repo/ui"

/*───────────────── */
/* IMAGE & TAB CARDS                                                       */
/*───────────────── */

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
    description: "how water in California’s Central Valley is managed",
  },
  {
    tab: "explore",
    title: "Explore",
    description: "how water outcomes shift under different scenarios, and",
  },
  {
    tab: "share",
    title: "Share",
    description: "your insights about California’s water future",
  },
]

/*───────────────── */
/* INNER CONTENT (reads scroll progress from StickyScrollSection context)      */
/*───────────────── */

function WaterThemesPanelContent({
  borderBottom,
  borderRadius,
  inset,
  frameBackground,
}: {
  borderBottom?: string
  borderRadius?: RadiusValue
  inset?: PanelInset
  frameBackground?: string
}) {
  const theme = useTheme()
  const prefersReducedMotion = useReducedMotion()
  const { navigateToTab } = useTabNavigation()

  const PANEL_BG = theme.palette.brand.sky
  const TEXT_COLOR = "text.primary"

  // Local scroll progress (0-1) within this StickyScrollSection
  const progress = useScrollProgress()

  // Phase opacities.when reduced motion, show final state
  // Image stays visible while cards are fully opaque, then fades out late
  const imageOpacity = useScrollValue(
    progress,
    [0, 1],
    prefersReducedMotion ? [1, 1] : [0.15, 1],
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
        px: theme.space.panel.padding,
        py: theme.space.panel.padding,
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {/* Layer 1: Gradient background (always visible) */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background: `#aacbd9`,
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
          pb: theme.space.panel.padding,
          boxSizing: "border-box",
          maxWidth: theme.breakpoints.values.xl
        }}
      >
        {/* Headline + intro - pinned near the top, fades in on first
            scroll into view */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Static headline in the left column, paragraph in the
              right column (mirrors the About panel's split layout). */}
          <Box
            sx={{
              display: { xs: "block", md: "grid" },
              gridTemplateColumns: { md: "1fr 1fr" },
              alignItems: "start",
            }}
          >
            <Box sx={{ mb: { xs: 2, md: 0 } }}>
              <Typography
                variant="h1"
                component="span"
                sx={{ display: "block", color: TEXT_COLOR }}
              >
                Want to know more?
              </Typography>
            </Box>

            <Typography
              variant="body1"
              sx={{
                color: TEXT_COLOR,
                maxWidth: { xs: "66%", md: "none" },
                mb: { xs: theme.space.section.md, md: 0 },
                gridColumn: { md: "2" },
              }}
            >
              Water is limited and every choice has trade-offs. COEQWAL allows
              you to explore different water scenarios and understand how
              decisions shape potential futures for communities, farms, rivers,
              and the Delta.
            </Typography>
          </Box>
        </motion.div>

        {/* Three squares, one per tab - anchored to the image's top
            edge instead of floating wherever vertical centering left
            them. The Delta Aerials image is width:100%, height:auto,
            bottom-anchored, so its top edge sits
            `100vw * IMG_ASPECT_RATIO` up from the panel's bottom edge.
            translateY(-50%) centers the row ON that line so it reads
            as "starting where the photo begins." */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: theme.space.section.sm,
            mt: "10vh",
          }}
        >
          {TAB_CARDS.map((c, i) => {
            const panelColor = theme.palette.tabPanels[c.tab]
            return (
              <React.Fragment key={c.tab}>
                <InfoCard
                  title={c.title}
                  titleVariant="h5"
                  description={c.description}
                  onClick={() => navigateToTab(c.tab)}
                  variant="onDark"
                  background={panelColor}
                  hoverBackground={alpha(panelColor, 0.85)}
                  sx={{ flex: 1, height: "200px", maxWidth: "350px" }}
                />
                {i < TAB_CARDS.length - 1 && (
                  <CircularArrowButton
                    decorative
                    size={50}
                    rotation="-90deg"
                    color={theme.palette.text.primary}
                  />
                )}
              </React.Fragment>
            )
          })}
        </Box>
      </Box>
      <Box sx={{
        position: "absolute",
        bottom: 40,
        left: "50%",
        transform: "translate(-50%)",
      }}>
        <ScrollToButton
          color={`${theme.palette.text.secondary}`}
          size={52}
          scrollToId="water-themes"
          // Same offset math as VideoHero's scroll button: land
          // the target panel's rounded card flush below the
          // header by subtracting the header height and adding
          // back one top frame-gap. Resolved at click time so
          // the responsive `clamp()` value is read at the
          // viewport's current width.
          scrollOffset={() =>
            theme.layout.headerHeight -
            resolveCssLengthPx(theme.layout.panel.insetY, 24)
          }
          ariaLabel="Scroll down to the know more section"
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
  // background-image fade phase.
  const headerHeight = theme.layout.headerHeight
  return (
    <div
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
          borderBottom={borderBottom}
          borderRadius={borderRadius}
          inset={inset}
          frameBackground={frameBackground}
        />
      </StickyScrollSection>
    </div>
  )
}
