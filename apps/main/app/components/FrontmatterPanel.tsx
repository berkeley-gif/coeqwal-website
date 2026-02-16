"use client"

/**
 * FrontmatterPanel - Full-viewport panel with headline and body content
 *
 * Variants:
 * - "default": Headline + DisplayBlock body text (diagonal layout)
 * - "actions": Headline + action items list (centered layout)
 *
 * WCAG 2.0 AA Compliance:
 * - WCAG 1.3.1: Semantic <section> with aria-label
 * - WCAG 2.3.3: Reduced motion handled globally via MotionConfig in ThemeRegistry
 * - WCAG 2.4.7: Focus-visible on scroll button (via ScrollToButton)
 * - WCAG 4.1.2: Proper aria-labels on interactive elements
 * - Responsive: Same layout behavior as VideoHero (centered on mobile <900px)
 */

import React from "react"
import { motion } from "@repo/motion"
import { ScrollToButton, DisplayBlock, Panel } from "@repo/ui"
import { Box, Typography, useTheme } from "@repo/ui/mui"

import { fadeIn } from "../lib/constants/motionAnimations"

const MotionBox = motion.create(Box)

/** Action item for the "actions" variant */
export interface ActionItem {
  /** The action word (e.g., Learn, Explore, Share) */
  action: string
  /** Color for the action word */
  color: string
  /** Description text */
  description: string
}

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
  /** Panel variant: "default" for DisplayBlock, "actions" for action items */
  variant?: "default" | "actions"
  /** Body text for the DisplayBlock (required for "default" variant) */
  bodyText?: React.ReactNode
  /** Action items (required for "actions" variant) */
  actions?: ActionItem[]
  /** ID of element to scroll to (optional) */
  scrollToId?: string
  /** Text color for headline (defaults to white) */
  textColor?: string
  /** Whether to apply text shadows (default: false for solid backgrounds) */
  textShadow?: boolean
  /** Hide the headline (for use with MorphingHeadline) */
  hideHeadline?: boolean
  /** Background color for the DisplayBlock (for transparent panel backgrounds) */
  displayBlockBackground?: string
}

export default function FrontmatterPanel({
  id,
  ariaLabel,
  backgroundColor,
  headlineLine1,
  headlineLine2,
  variant = "default",
  bodyText,
  actions,
  scrollToId,
  textColor = "common.white",
  textShadow = false,
  hideHeadline = false,
  displayBlockBackground,
}: FrontmatterPanelProps) {
  const theme = useTheme()

  // Animation variants - MotionConfig in ThemeRegistry handles reduced motion automatically
  const heroIn = {
    hidden: { opacity: 0, x: -24, filter: "blur(6px)" },
    show: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  const heroInRight = {
    hidden: { opacity: 0, x: 24, filter: "blur(6px)" },
    show: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: "easeOut", delay: 0.12 },
    },
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  }

  // Actions variant: diagonal layout matching default variant (headline top-left, actions bottom-right)
  if (variant === "actions" && actions) {
    return (
      <Panel
        id={id}
        ariaLabel={ariaLabel}
        backgroundColor={backgroundColor}
        sx={{
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Headline - top-left on desktop, centered on mobile */}
        <MotionBox
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={heroIn}
          sx={{
            alignSelf: { xs: "stretch", md: "flex-start" },
            display: hideHeadline
              ? { xs: "flex", md: "none" }
              : { xs: "flex", md: "block" },
            justifyContent: { xs: "center", md: "flex-start" },
          }}
        >
          <Box
            sx={{
              color: textColor,
              textShadow: textShadow ? theme.textShadow.display : "none",
              // fontSize needed for maxWidth "ch" unit to calculate correctly
              fontSize: theme.typography.h1Bold.fontSize,
              // lineHeight controls spacing between the two headline lines
              lineHeight: 1,
              maxWidth: "16ch",
              textAlign: { xs: "center", md: "left" },
            }}
          >
            <Typography variant="h2Main" component="span">
              {headlineLine1}
            </Typography>
            {headlineLine2 && (
              <>
                <br />
                <Typography variant="h1Bold" component="span">
                  {headlineLine2}
                </Typography>
              </>
            )}
          </Box>
        </MotionBox>
        {/* Desktop spacer when headline hidden (maintains action items position) */}
        {hideHeadline && <Box sx={{ display: { xs: "none", md: "block" } }} />}

        {/* Action items - bottom-right on desktop, centered on mobile */}
        <MotionBox
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
          sx={{
            alignSelf: { xs: "stretch", md: "flex-end" },
            display: { xs: "flex", md: "block" },
            justifyContent: { xs: "center", md: "flex-end" },
          }}
        >
          <Box
            component="ul"
            sx={{
              listStyle: "none",
              p: 0,
              m: 0,
              display: "flex",
              flexDirection: "column",
              gap: { xs: 4, md: 4 },
              maxWidth: "520px",
            }}
          >
            {actions.map((item, index) => (
              <motion.li key={index} variants={fadeIn}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: { xs: 0.5, md: 0.5 },
                  }}
                >
                  {/* Action word */}
                  <Typography
                    variant="h3"
                    sx={{
                      color: item.color,
                    }}
                  >
                    {item.action}
                  </Typography>

                  {/* Description */}
                  <Typography
                    variant="body1"
                    sx={{
                      color: textColor,
                    }}
                  >
                    {item.description}
                  </Typography>
                </Box>
              </motion.li>
            ))}
          </Box>
        </MotionBox>

        {/* Scroll indicator (optional) */}
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
      </Panel>
    )
  }

  // Default variant: diagonal layout with DisplayBlock
  return (
    <Panel
      id={id}
      ariaLabel={ariaLabel}
      backgroundColor={backgroundColor}
      sx={{
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Headline - top-left on desktop, centered on mobile */}
      {/* When hideHeadline: show on mobile only (MorphingHeadline handles desktop) */}
      <MotionBox
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={heroIn}
        sx={{
          alignSelf: { xs: "stretch", md: "flex-start" },
          display: hideHeadline
            ? { xs: "flex", md: "none" } // Mobile: show, Desktop: hidden (MorphingHeadline)
            : { xs: "flex", md: "block" }, // Always show when not using MorphingHeadline
          justifyContent: { xs: "center", md: "flex-start" },
        }}
      >
        <Box
          sx={{
            color: textColor,
            textShadow: textShadow ? theme.textShadow.display : "none",
            // fontSize needed for maxWidth "ch" unit to calculate correctly
            fontSize: theme.typography.h1Bold.fontSize,
            // lineHeight controls spacing between the two headline lines
            lineHeight: 1,
            maxWidth: "16ch",
            textAlign: { xs: "center", md: "left" },
          }}
        >
          <Typography variant="h2Main" component="span">
            {headlineLine1}
          </Typography>
          {headlineLine2 && (
            <>
              <br />
              <Typography variant="h1Bold" component="span">
                {headlineLine2}
              </Typography>
            </>
          )}
        </Box>
      </MotionBox>
      {/* Desktop spacer when headline hidden (maintains DisplayBlock position) */}
      {hideHeadline && <Box sx={{ display: { xs: "none", md: "block" } }} />}

      {/* Body - bottom-right on desktop, centered on mobile */}
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
        <DisplayBlock
          textShadow={textShadow}
          sx={
            displayBlockBackground
              ? { background: displayBlockBackground }
              : undefined
          }
        >
          {bodyText}
        </DisplayBlock>
      </MotionBox>

      {/* Scroll indicator - centered at bottom (optional) */}
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
            color={`${theme.palette.common.white}D9`}
            size={52}
            scrollToId={scrollToId}
            ariaLabel="Scroll down to continue"
          />
        </Box>
      )}
    </Panel>
  )
}
