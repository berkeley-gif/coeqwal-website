"use client"

/**
 * Contact section - A section with text that can be used for ending sections or panels
 * WCAG 2.0 AA Compliance:
 * - WCAG 1.3.1: Semantic <section> with aria-label
 */

import React from "react"
import { motion } from "@repo/motion"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { fadeIn } from "../lib/constants/motionAnimations"
import { themeValues } from "@repo/ui/themes/theme"

export interface CenteredTextSectionProps {
  /** Panel ID for navigation */
  id: string
  /** Accessible label for the section */
  ariaLabel: string
  /** Title for the section */
  title?: string
  /** Logos for the grid */
  text: string
  /** Email address */
  email?: string
  /** Background color */
  bgColor?: string
  /** Text color */
  textColor?: string
}

export function CenteredTextSection({
  id,
  ariaLabel,
  title,
  text,
  email,
  bgColor,
  textColor,
}: CenteredTextSectionProps) {
  const theme = useTheme()
  return (
    <Box
      component="section"
      id={id}
      aria-label={ariaLabel}
      sx={{
        pointerEvents: "auto",
        background: bgColor ? bgColor : theme.palette.blue.pale,
        paddingTop: `${theme.layout.headerHeight + 25}px`,
        paddingBottom: `${theme.layout.headerHeight + 25}px`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: textColor ? textColor : theme.palette.blue.darkest,
      }}
    >
      {/* Title */}
      {title && (
        <Box
          component={motion.div}
          initial="hidden"
          whileInView="show"
          sx={{
            width: "100%",
            textAlign: "center",
          }}
          variants={fadeIn}
        >
          <Typography variant="h4">{title}</Typography>
        </Box>
      )}
      {/* Contact paragraph with email */}
      {email ? (
        <Box
          component={motion.div}
          initial="hidden"
          whileInView="show"
          variants={fadeIn}
          sx={{
            width: "100%",
            maxWidth: "800px", // Max width of grid
            margin: "60px auto", // Centers the grid horizontally
            textAlign: "center",
          }}
        >
          <Typography variant="body1">
            {text} <a href={`mailto:${email}`}>{email}</a>
          </Typography>
        </Box>
      ) : (
        <Box
          component={motion.div}
          initial="hidden"
          whileInView="show"
          variants={fadeIn}
          sx={{
            width: "100%",
            maxWidth: "800px", // Max width of grid
            margin: "60px auto", // Centers the grid horizontally
            textAlign: "center",
          }}
        >
          <Typography variant="body1" sx={{ maxSize: themeValues.spacing.paragraphMaxSize }}>{text}</Typography>
        </Box>
      )}
    </Box>
  )
}
