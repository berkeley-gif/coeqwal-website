"use client"

/**
 * Center Image Text - Centered image with text underneath
 *
 *
 * WCAG 2.0 AA Compliance:
 * - WCAG 1.1.1: Alt text for images
 * - WCAG 1.3.1: Semantic <section> with aria-label
 * - WCAG 2.3.3: Reduced motion handled globally via MotionConfig in ThemeRegistry
 * - WCAG 2.4.7: Focus-visible on scroll button (via ScrollToButton)
 * - WCAG 4.1.2: Proper aria-labels on interactive elements
 * - Responsive: Same layout behavior as VideoHero (centered on mobile <900px)
 */

import React from "react"
import { motion } from "@repo/motion"
import { ScrollToButton } from "@repo/ui"
import { Box, Typography, useTheme } from "@repo/ui/mui"

import { fadeIn } from "../lib/constants/motionAnimations"

export interface CenterImageTextProps {
  /** Panel ID for navigation */
  id: string
  /** Accessible label for the section */
  ariaLabel: string
  /** Background color (theme color or CSS value) */
  backgroundColor: string
  /** Padding for the top (optional) */
  paddingTop: number
  /** Body text bolded section (optional) */
  bodyTextBold?: string
  /** Body text for the DisplayBlock (required for "default" variant) */
  bodyText?: string
  /** ID of element to scroll to (optional) */
  scrollToId?: string
  /** Text color for headline (defaults to white) */
  textColor?: string
  /** Whether to apply text shadows (default: false for solid backgrounds) */
  textShadow?: boolean
  /** Image source */
  imgSrc: string
  /** Image alt text */
  imgAlt: string
}

export function CenterImageText({
  id,
  ariaLabel,
  backgroundColor,
  bodyTextBold,
  bodyText,
  scrollToId,
  paddingTop = 0,
  textColor = "common.white",
  imgSrc = "",
  imgAlt = "",
}: CenterImageTextProps) {
  const theme = useTheme()

  return (
    <Box
      component={motion.div}
      initial="hidden"
      whileInView="show"
      variants={fadeIn}
      id={id}
      aria-label={ariaLabel}
      sx={{
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        boxSizing: "border-box",
        minHeight: "100vh",
        gap: { xs: theme.spacing(4), md: theme.spacing(7) },
        paddingTop: {
          xs: theme.spacing(paddingTop / 8 + 4),
          md: `calc(${paddingTop}px + ${theme.spacing(4)})`,
        },
        paddingBottom: { xs: theme.spacing(6), md: theme.spacing(6) },
        paddingX: {
          xs: theme.space.page.x.xs,
          sm: theme.space.page.x.sm,
          md: "0px",
        },
        backgroundColor: backgroundColor,
      }}
    >
      {/* Image: wrapped so it can shrink to whatever vertical space is left after text + arrow */}
      <Box
        sx={{
          flex: "1 1 auto",
          minHeight: "15vh",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box
          component="img"
          src={imgSrc}
          alt={imgAlt}
          sx={{
            maxWidth: "100%",
            maxHeight: "60vh",
            width: "auto",
            height: "auto",
            objectFit: "contain",
          }}
        />
      </Box>

      {/* Text */}
      <Box
        component="div"
        sx={{
          listStyle: "none",
          m: "0 auto",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          gap: { xs: 4, md: 4 },
          textAlign: { xs: "center", md: "left" },
          width: "100%",
          maxWidth: { xs: "100%", sm: "85%", md: "55%", xl: "40%" },
          paddingLeft: { xs: "0px", md: "55px" },
        }}
      >
        {/* Body */}
        <Typography
          variant="body1"
          sx={{
            color: textColor,
          }}
        >
          <strong>{bodyTextBold}</strong>
          {bodyText}
        </Typography>
      </Box>

      {/* Scroll indicator (optional) */}
      {scrollToId && (
        <Box
          sx={{
            pointerEvents: "auto",
            margin: "0 auto",
            flexShrink: 0,
            bottom: "clamp(24px, 4vh, 48px)",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <ScrollToButton
            color={`${theme.palette.common.white}D9`}
            size={52}
            scrollToId={scrollToId}
            ariaLabel="Scroll down to continue"
          />
        </Box>
      )}
    </Box>
  )
}
