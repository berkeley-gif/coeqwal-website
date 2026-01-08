/**
 * FrontmatterPanel - Full-viewport panel with headline and body text
 *
 * WCAG 2.0 AA Compliance:
 * - WCAG 1.3.1: Semantic <section> with aria-label
 * - WCAG 2.3.3: Respects prefers-reduced-motion preference
 * - WCAG 2.4.7: Focus-visible on scroll button (via ScrollToButton)
 * - WCAG 4.1.2: Proper aria-labels on interactive elements
 * - Responsive: Same layout behavior as VideoHero (centered on mobile <900px)
 */

import React from "react"
import { motion } from "@repo/motion"
import { ScrollToButton, DisplayBlock } from "@repo/ui"
import { Box, Typography, useTheme } from "@repo/ui/mui"

const MotionBox = motion.create(Box)

// WCAG 2.3.3: Check for reduced motion preference
const prefersReducedMotion =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false

export interface FrontmatterPanelProps {
  /** Panel ID for navigation */
  id: string
  /** Accessible label for the section */
  ariaLabel: string
  /** Background color (theme color or CSS value) */
  backgroundColor: string
  /** Headline text (first line) */
  headlineLine1: string
  /** Headline text (second line, bold) */
  headlineLine2?: string
  /** Body text for the DisplayBlock */
  bodyText: string
  /** ID of element to scroll to (optional) */
  scrollToId?: string
  /** Text color for headline (defaults to white) */
  textColor?: string
  /** Whether to apply text shadows (default: false for solid backgrounds) */
  textShadow?: boolean
}

export default function FrontmatterPanel({
  id,
  ariaLabel,
  backgroundColor,
  headlineLine1,
  headlineLine2,
  bodyText,
  scrollToId,
  textColor = "common.white",
  textShadow = false,
}: FrontmatterPanelProps) {
  const theme = useTheme()

  // WCAG 2.3.3: Reduced motion variants - simplified animations for accessibility
  const heroIn = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.3 } },
      }
    : {
        hidden: { opacity: 0, x: -24, filter: "blur(6px)" },
        show: {
          opacity: 1,
          x: 0,
          filter: "blur(0px)",
          transition: { duration: 0.6, ease: "easeOut" },
        },
      }

  const heroInRight = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.3 } },
      }
    : {
        hidden: { opacity: 0, x: 24, filter: "blur(6px)" },
        show: {
          opacity: 1,
          x: 0,
          filter: "blur(0px)",
          transition: { duration: 0.6, ease: "easeOut", delay: 0.12 },
        },
      }

  return (
    <Box
      component="section"
      id={id}
      aria-label={ariaLabel}
      sx={{
        position: "relative",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        backgroundColor,
        pointerEvents: "auto",
      }}
    >
      {/* Content layout — flex space-between for diagonal positioning */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          paddingTop: theme.space.panel.topOffset,
          paddingBottom: theme.space.panel.bottomOffset,
          paddingLeft: theme.space.panel.padding,
          paddingRight: theme.space.panel.padding,
          zIndex: theme.zIndex.heroContent,
        }}
      >
        {/* Headline — top-left on desktop, centered on mobile */}
        <MotionBox
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={heroIn}
          sx={{
            alignSelf: { xs: "stretch", md: "flex-start" },
            display: { xs: "flex", md: "block" },
            justifyContent: { xs: "center", md: "flex-start" },
          }}
        >
          <Typography
            variant="h1"
            sx={{
              color: textColor,
              textShadow: theme.textShadow.display,
              maxWidth: "16ch",
              textAlign: { xs: "center", md: "left" },
            }}
          >
            <Box component="span" sx={{ fontSize: "0.8em" }}>
              {headlineLine1}
            </Box>
            {headlineLine2 && (
              <>
                <br />
                <Box component="span" sx={{ fontWeight: 700 }}>
                  {headlineLine2}
                </Box>
              </>
            )}
          </Typography>
        </MotionBox>

        {/* Body — bottom-right on desktop, centered on mobile */}
        <MotionBox
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={heroInRight}
          sx={{
            alignSelf: { xs: "stretch", md: "flex-end" },
            display: { xs: "flex", md: "block" },
            justifyContent: { xs: "center", md: "flex-end" },
          }}
        >
          <DisplayBlock textShadow={textShadow}>{bodyText}</DisplayBlock>
        </MotionBox>
      </Box>

      {/* Scroll indicator — centered at bottom (optional) */}
      {scrollToId && (
        <Box
          sx={{
            position: "absolute",
            bottom: "clamp(24px, 4vh, 48px)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: theme.zIndex.heroScrollIndicator,
          }}
        >
          <ScrollToButton
            color="rgba(255, 255, 255, 0.85)"
            size={52}
            scrollToId={scrollToId}
            ariaLabel="Scroll down to continue"
          />
        </Box>
      )}
    </Box>
  )
}
