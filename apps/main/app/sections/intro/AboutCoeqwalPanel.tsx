"use client"

/**
 * About COEQWAL panel: the second panel in the intro. Pinned at the
 * header for a ~100vh scroll runway via `StickyScrollSection` so the
 * user can read the description in place. Mirrors the WaterThemesPanel
 * geometry (stickyTop = headerHeight, stickyHeight = 100vh - header)
 * so both panels share the same pinned rectangle below the header.
 *
 * The outer wrapper is painted with the frame background so the
 * sticky region reads as continuous white frame.
 */

import Link from "next/link"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import {
  CoeqwalPanel,
  NavArrow,
  ScrollToButton,
  resolveCssLengthPx,
} from "@repo/ui"
import { StickyScrollSection } from "@repo/scrollytelling"

export function AboutCoeqwalPanel() {
  const theme = useTheme()

  return (
    <div style={{ backgroundColor: theme.palette.brand.sky }}>
      <StickyScrollSection
        height="200vh"
        stickyTop={theme.layout.headerHeight}
        stickyHeight={`calc(100vh - ${theme.layout.headerHeight}px)`}
      >
        <CoeqwalPanel
          id="about-coeqwal"
          background={theme.palette.brand.sky}
          textColor={theme.palette.text.secondary}
          minHeight="100vh"
          borderRadius={0}
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
              understand how water decisions affect us now and for generations
              to come
              <br />
              <br />
              Using a water planning model for California’s Central Valley,
              COEQWAL helps you learn how water is currently managed, explore
              alternative pathways, and share your vision for California’s water
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
              ariaLabel="Scroll down to the know more section"
            />
          }
        />
      </StickyScrollSection>
    </div>
  )
}

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
