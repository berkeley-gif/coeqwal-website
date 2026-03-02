"use client"

/**
 * Contact section - A block featuring a title, a contact text and an email
 * WCAG 2.0 AA Compliance:
 * - WCAG 1.3.1: Semantic <section> with aria-label
 */

import React from "react"
import { motion } from "@repo/motion"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { fadeIn } from "../lib/constants/motionAnimations"

export interface ContactSectionProps {
  /** Panel ID for navigation */
  id: string
  /** Accessible label for the section */
  ariaLabel: string
  /** Title for the section */
  title: string
  /** Logos for the grid */
  text: string
  /** Email address */
  email: string
}

export function ContactSection({
  id,
  ariaLabel,
  title,
  text,
  email,
}: ContactSectionProps) {
  const theme = useTheme()
  return (
    <Box
      component="section"
      id={id}
      aria-label={ariaLabel}
      sx={{
        pointerEvents: "auto",
        background: theme.palette.blue.pale,
        paddingTop: `${theme.layout.headerHeight + 25}px`,
        paddingBottom: `${theme.layout.headerHeight + 25}px`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: theme.palette.blue.darkest,
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
        }}
        variants={fadeIn}
      >
        <Typography variant="h4">{title}</Typography>
      </Box>

      {/* Contact paragraph with email */}
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
    </Box>
  )
}
