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
  width: number
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
              height: { xs: "28px", md: "46px" }, // fixed display height for every logo
              width: "auto", // preserves each logo's own aspect ratio
              objectFit: "contain",
            }}
          />
        ))}
      </Box>
    </Box>
  )
}
