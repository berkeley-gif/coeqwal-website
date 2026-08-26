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
import { NavArrow, ScrollToButton, resolveCssLengthPx } from "@repo/ui"
import { StickyScrollSection } from "@repo/scrollytelling"

export function AboutCoeqwalPanel() {
  const theme = useTheme()

  const calSimMapImg = {
    src: "/images/calsim-map-yellow.png",
    alt: "A map demonstrating the service area of Calsim",
  }

  return (
    <div style={{ backgroundColor: theme.palette.brand.panelLight }}>
      <StickyScrollSection
        height="200vh"
        stickyTop={theme.layout.headerHeight}
        stickyHeight={`calc(100vh - ${theme.layout.headerHeight}px)`}
      >
        <Box
          component="section"
          id="about-coeqwal"
          sx={{
            position: "relative",
            background: "inherit",
            overflow: "hidden",
            px: theme.space.panel.padding,
            py: theme.space.panel.padding,
            minHeight: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              color: theme.palette.text.primary,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              rowGap: { xs: 3, md: 2 },
              columnGap: { md: 6 },
              maxWidth: theme.breakpoints.values.xl
            }}
          >
            {/** Title */}
            <Box sx={{ gridColumn: "1 / -1", mb: { xs: 2, md: 3 }, gap: 7 }}>
              <Typography
                variant="h2Main"
                component="span"
                sx={{ color: "inherit", mr: 1 }}
              >
                What is
              </Typography>
              <Typography
                variant="h1"
                component="span"
                sx={{

                  color: "inherit",
                }}
              >
                COEQWAL?
              </Typography>
            </Box>

            {/** Image */}
            <Box
              component="img"
              src={calSimMapImg.src}
              alt={calSimMapImg.alt}
              sx={{
                display: "block",
                mx: 18,
                mt: 1,
                width: "auto",
                maxWidth: "100%",
                height: "auto",
                maxHeight: { xs: "220px", md: "clamp(360px, 45vh, 640px)" },
                objectFit: "contain",
              }}
            />

            {/** Body text */}
            <Box sx={{ maxWidth: "70ch" }}>
              <Typography
                variant="displayBody"
                component="div"
                sx={{ color: "inherit", mb: 4 }}
              >
                COEQWAL – the Collaboratory for Equity in Water Allocation – is
                a publicly-funded project that works with communities to better
                understand how water decisions affect us now and for generations
                to come.
                <br />
                <br />
                Using a water planning model for California’s Central Valley,
                COEQWAL helps you learn how water is currently managed, explore
                alternative pathways, and share your vision for California’s
                water future.
              </Typography>
              <AboutCtaLink href="/about">
                Learn more about COEQWAL
              </AboutCtaLink>
            </Box>


          </Box>
        </Box>

        <Box sx={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translate(-50%)",
        }}>
          <ScrollToButton
            color={`${theme.palette.text.primary}`}
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
