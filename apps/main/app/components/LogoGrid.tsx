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
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)", // 4 columns
          gap: "16px",
          maxWidth: "900px", // Max width of grid
          margin: "60px auto", // Centers the grid horizontally
          placeItems: "center",
        }}
      >
        {logos.map((logo) => (
          <Box
            component="img"
            src={logo.src}
            alt={logo.alt}
            key={logo.src}
            sx={{
              height: "auto",
              maxWidth: "100%", // Prevents overflow
              width: "auto", // Let it scale naturally
              objectFit: "contain",
            }}
          />
        ))}
      </Box>
    </Box>
  )
}
