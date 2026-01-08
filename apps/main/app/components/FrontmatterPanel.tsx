/**
 * FrontmatterPanel - Full-viewport panel with headline and body content
 *
 * Variants:
 * - "default": Headline + DisplayBlock body text (diagonal layout)
 * - "actions": Headline + action items list (centered layout)
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
  bodyText?: string
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

  // Actions variant: centered layout with action items
  if (variant === "actions" && actions) {
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
          pointerEvents: "auto",
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
          {/* Headline for actions variant */}
          <MotionBox
            variants={fadeIn}
            sx={{
              display: hideHeadline
                ? { xs: "block", md: "none" }
                : "block",
              mb: { xs: 6, md: 8 },
            }}
          >
            <Typography
              variant="h1"
              sx={{
                color: textColor,
                textShadow: textShadow ? theme.textShadow.display : "none",
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

          {/* Action items list */}
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
              <motion.li key={index} variants={fadeIn}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "180px 1fr" },
                    gap: { xs: 1, md: 4 },
                    alignItems: "baseline",
                  }}
                >
                  {/* Action word */}
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
      </Box>
    )
  }

  // Default variant: diagonal layout with DisplayBlock
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
          <Typography
            variant="h1"
            sx={{
              color: textColor,
              textShadow: textShadow ? theme.textShadow.display : "none",
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
        {/* Desktop spacer when headline hidden (maintains DisplayBlock position) */}
        {hideHeadline && <Box sx={{ display: { xs: "none", md: "block" } }} />}

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
