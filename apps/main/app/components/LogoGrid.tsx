"use client"

/**
 * Logo Grid - A grid with partner logos, in 4 column grids
 *
 * WCAG 2.0 AA Compliance:
 * - WCAG 1.1.1: Alt text for images
 * - WCAG 1.3.1: Semantic <section> with aria-label
 */

import React from "react"
import { motion } from "@repo/motion"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { fadeIn } from "../lib/constants/motionAnimations"

export interface GridLogo {
  src: string
  alt: string
  /** Pixel width of the image file itself (not the display size) */
  intrinsicWidth: number
  /** Pixel height of the image file itself (not the display size) */
  intrinsicHeight: number
}

// Single place to tune logo sizing.
// squareHeight: display height of a 1:1 logo — the tallest any logo gets.
// wideShrinkExponent: how much wider logos lose height.
//   0 = every logo the same height (wide logos dominate)
//   0.5 = every logo the same area (equal visual weight)
//   1 = every logo the same width (wide logos become slivers)
const LOGO_SIZING = {
  squareHeight: { xs: 44, md: 95 },
  wideShrinkExponent: 0.5,
}

function getLogoHeights(logo: GridLogo): { xs: string; md: string } {
  const aspectRatio = logo.intrinsicWidth / logo.intrinsicHeight
  // Missing or zero dimensions give NaN/Infinity; fall back to square sizing
  // rather than rendering a 0px or NaN-height logo.
  // Clamping at 1 also stops portrait logos from growing taller than squareHeight.
  const safeAspectRatio = Number.isFinite(aspectRatio)
    ? Math.max(aspectRatio, 1)
    : 1
  const heightFactor = safeAspectRatio ** -LOGO_SIZING.wideShrinkExponent

  return {
    xs: `${Math.round(LOGO_SIZING.squareHeight.xs * heightFactor)}px`,
    md: `${Math.round(LOGO_SIZING.squareHeight.md * heightFactor)}px`,
  }
}

export interface LogoGridProps {
  /** Panel ID for navigation */
  id: string
  /** Accessible label for the section */
  ariaLabel: string
  /** Title for the section */
  title: string
  /** Logos for the grid */
  logos: GridLogo[]
}

export function LogoGrid({ id, ariaLabel, title, logos }: LogoGridProps) {
  const theme = useTheme()
  return (
    <Box
      component="section"
      id={id}
      aria-label={ariaLabel}
      sx={{
        pointerEvents: "auto",
        background: theme.palette.brand.panelDark,
        paddingTop: `${theme.layout.headerHeight + 25}px`,
        paddingBottom: `${theme.layout.headerHeight + 25}px`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Title */}
      <Box
        component={motion.div}
        initial="hidden"
        whileInView="show"
        sx={{
          width: "100%",
          textAlign: "center",
          color: theme.palette.common.white,
        }}
        variants={fadeIn}
      >
        <Typography variant="h4">{title}</Typography>
      </Box>

      {/* Grid */}
      <Box
        component={motion.div}
        initial="hidden"
        whileInView="show"
        variants={fadeIn}
        sx={{
          width: "100%",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          rowGap: { xs: "20px", md: "28px" },
          columnGap: { xs: "20px", md: "32px" },
          paddingX: { xs: "24px", md: "0" },
          maxWidth: "1100px", // Max width of the logo block
          margin: "60px auto", // Centers the block horizontally
        }}
      >
        {logos.map((logo) => (
          <Box
            component="img"
            src={logo.src}
            alt={logo.alt}
            key={logo.src}
            loading="lazy"
            sx={{
              height: getLogoHeights(logo), // shorter for wider logos so all carry similar visual weight
              width: "auto", // preserves each logo's own aspect ratio
              objectFit: "contain",
            }}
          />
        ))}
      </Box>
    </Box>
  )
}
