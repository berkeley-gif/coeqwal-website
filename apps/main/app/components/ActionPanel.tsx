/**
 * ActionPanel - Full-viewport panel laying out site action content
 *
 * WCAG 2.0 AA Compliance:
 * - WCAG 1.3.1: Semantic structure with proper heading levels
 * - WCAG 2.3.3: Respects prefers-reduced-motion preference
 * - WCAG 1.4.3: Sufficient color contrast for all text
 */

import React from "react"
import { motion } from "@repo/motion"
import { Box, Typography, useTheme } from "@repo/ui/mui"

const MotionBox = motion.create(Box)

// WCAG 2.3.3: Check for reduced motion preference
const prefersReducedMotion =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false

interface ActionItem {
  /** The action word (learn, explore, share) */
  action: string
  /** Color for the action word */
  color: string
  /** Description text */
  description: string
}

export interface ActionPanelProps {
  /** Panel ID for navigation */
  id: string
  /** Accessible label for the section */
  ariaLabel: string
  /** Background color */
  backgroundColor: string
  /** Introductory text (e.g., "On this site, you can") */
  introText: string
  /** Array of action items */
  actions: ActionItem[]
  /** Text color (defaults to white) */
  textColor?: string
}

export default function ActionPanel({
  id,
  ariaLabel,
  backgroundColor,
  introText,
  actions,
  textColor = "common.white",
}: ActionPanelProps) {
  const theme = useTheme()

  // Animation variants
  const fadeIn = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.3 } },
      }
    : {
        hidden: { opacity: 0, y: 20 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: "easeOut" },
        },
      }

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.15,
        delayChildren: prefersReducedMotion ? 0 : 0.2,
      },
    },
  }

  return (
    <Box
      component="section"
      id={id}
      aria-label={ariaLabel}
      sx={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        backgroundColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: { xs: 8, md: 12 },
        px: theme.space.panel.padding,
      }}
    >
      <MotionBox
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
        sx={{
          maxWidth: "900px",
          width: "100%",
        }}
      >
        {/* Intro text */}
        <MotionBox variants={fadeIn}>
          <Typography
            variant="h2"
            sx={{
              color: textColor,
              fontSize: { xs: "1.5rem", md: "2rem" },
              fontWeight: 400,
              mb: { xs: 6, md: 8 },
              opacity: 0.9,
            }}
          >
            {introText}
          </Typography>
        </MotionBox>

        {/* Action items - Swiss grid layout */}
        <Box
          component="ul"
          sx={{
            listStyle: "none",
            p: 0,
            m: 0,
            display: "flex",
            flexDirection: "column",
            gap: { xs: 5, md: 6 },
          }}
        >
          {actions.map((item, index) => (
            <MotionBox
              key={index}
              component="li"
              variants={fadeIn}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "180px 1fr" },
                gap: { xs: 1, md: 4 },
                alignItems: "baseline",
              }}
            >
              {/* Action word - bold, colored */}
              <Typography
                variant="h3"
                sx={{
                  color: item.color,
                  fontSize: { xs: "2rem", md: "2.5rem" },
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                  lineHeight: 1.2,
                }}
              >
                {item.action}
              </Typography>

              {/* Description */}
              <Typography
                variant="body1"
                sx={{
                  color: textColor,
                  fontSize: { xs: "1.1rem", md: "1.25rem" },
                  lineHeight: 1.6,
                  maxWidth: "600px",
                }}
              >
                {item.description}
              </Typography>
            </MotionBox>
          ))}
        </Box>
      </MotionBox>
    </Box>
  )
}
