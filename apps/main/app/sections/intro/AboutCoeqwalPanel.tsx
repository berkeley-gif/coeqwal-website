"use client"

/**
 * About COEQWAL panel: the second panel in the IntroSection's morphing
 * stack. Pinned at the header for a ~100vh scroll runway via
 * `StickyScrollSection` so the user can read the description while the
 * MorphingHeadline morphs above it. Mirrors the WaterThemesPanel
 * geometry (stickyTop = headerHeight, stickyHeight = 100vh - header)
 * so both panels share the same pinned rectangle below the header.
 *
 * The outer wrapper is painted with the frame background so the
 * sticky region reads as continuous white frame. The headline itself
 * is drawn by the MorphingHeadline overlay on lg+; the
 * `responsiveHeadline` slot below fills in on smaller screens.
 */

import { forwardRef } from "react"
import Link from "next/link"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import {
  CoeqwalPanel,
  NavArrow,
  ScrollToButton,
  resolveCssLengthPx,
} from "@repo/ui"
import { StickyScrollSection } from "@repo/scrollytelling"
import type { MotionValue } from "@repo/motion"

interface AboutCoeqwalPanelProps {
  /**
   * Per-panel content opacity, driven by the morphing-headline
   * choreography. Wired into `CoeqwalPanel.contentMotionStyle.opacity`.
   */
  contentOpacity: MotionValue<number>
}

export const AboutCoeqwalPanel = forwardRef<
  HTMLDivElement,
  AboutCoeqwalPanelProps
>(function AboutCoeqwalPanel({ contentOpacity }, ref) {
  const theme = useTheme()

  return (
    <div ref={ref} style={{ backgroundColor: theme.palette.common.white }}>
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
          // padding) equals the StickyScrollSection's stickyHeight
          // (`100vh - headerHeight`). Mirrors the WaterThemesPanel
          // geometry. Without subtracting the second `insetY` the
          // CoeqwalPanel is `insetY` taller than the sticky
          // container, which clips the bottom frame-gap under
          // `overflow: hidden` and makes the rounded card sit flush
          // with the sticky bottom edge instead of floating with
          // symmetric top/bottom padding.
          minHeight={`calc(100vh - ${theme.layout.headerHeight}px - 2 * ${theme.layout.panel.insetY})`}
          borderRadius={theme.layout.panel.radius}
          inset={{
            x: theme.layout.panel.insetX,
            y: theme.layout.panel.insetY,
          }}
          frameBackground={theme.palette.common.white}
          contentMotionStyle={{ opacity: contentOpacity }}
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
          scrollIndicator={
            <ScrollToButton
              color={`${theme.palette.text.secondary}D9`}
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
              ariaLabel="Scroll down to the water issues section"
            />
          }
        />
      </StickyScrollSection>
    </div>
  )
})

/** Pill-style CTA for the About COEQWAL panel. */
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
