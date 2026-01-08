/**
 * MorphingHeadline - Scroll-linked headline that morphs across multiple panels
 *
 * Creates a floating h1 that transitions between panel headlines as the user
 * scrolls. The headline stays visually pinned while crossfading text and
 * adjusting text-shadow.
 *
 * WCAG 2.0 AA Compliance:
 * - WCAG 1.3.1: Single semantic h1 for screen readers (visual duplicates hidden)
 * - WCAG 2.3.3: Respects prefers-reduced-motion (instant switch, no crossfade)
 * - WCAG 4.1.2: Screen reader text updates based on scroll position
 *
 * Architecture note: Visual h1 elements are aria-hidden, with a single
 * visually-hidden h1 that updates for screen readers. This avoids duplicate
 * heading announcements while maintaining the visual crossfade effect.
 */

"use client"

import React, { useEffect, useState, useMemo } from "react"
import { useScroll, useTransform, motion } from "@repo/motion"
import { Box, Typography, useTheme } from "@repo/ui/mui"

// WCAG 2.3.3: Check for reduced motion preference
const getReducedMotionPreference = () =>
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false

export interface HeadlineText {
  /** First line (smaller text) */
  line1: string
  /** Second line (bold text) */
  line2?: string
  /** Whether to show text shadow (default: true for first headline) */
  textShadow?: boolean
}

export interface MorphingHeadlineProps {
  /** Array of headline texts to morph through */
  headlines: HeadlineText[]
  /** Container ref that spans all panels for scroll tracking */
  containerRef: React.RefObject<HTMLElement | null>
}

export default function MorphingHeadline({
  headlines,
  containerRef,
}: MorphingHeadlineProps) {
  const theme = useTheme()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    getReducedMotionPreference,
  )

  // Listen for changes to reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  // Track scroll progress within the container (all panels)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
    /**
     * Required because ref is defined in parent component (IntroSection).
     * When layoutEffect is true (default), useScroll uses useLayoutEffect which
     * runs before the ref is attached to the DOM. Setting false switches to
     * useEffect, ensuring the ref is hydrated before scroll tracking begins.
     * @see https://github.com/motiondivision/motion/issues/2483
     */
    layoutEffect: false,
  })

  // Calculate opacity keyframes for each headline based on number of panels
  // Each panel gets equal scroll range, with crossfades at panel boundaries
  const opacityTransforms = useMemo(() => {
    const count = headlines.length
    if (count < 2) return []

    // For N panels, we have N-1 transition points
    // Each panel occupies 1/N of the scroll range
    const panelSize = 1 / count

    return headlines.map((_, index) => {
      // Calculate when this headline should be visible
      // Each headline fades in at its panel start and fades out at its panel end
      const panelStart = index * panelSize
      const panelEnd = (index + 1) * panelSize

      // Transition zone is 20% of panel size, centered on boundary
      const transitionSize = panelSize * 0.2

      // Fade in: from previous panel end to this panel start + transition
      const fadeInStart = Math.max(0, panelStart - transitionSize)
      const fadeInEnd = panelStart + transitionSize

      // Fade out: from this panel end - transition to next panel start + transition
      const fadeOutStart = panelEnd - transitionSize
      const fadeOutEnd = Math.min(1, panelEnd + transitionSize)

      // Build keyframes
      if (index === 0) {
        // First headline: visible at start, fades out
        return {
          input: [0, fadeOutStart, fadeOutEnd],
          output: [1, 1, 0],
        }
      } else if (index === count - 1) {
        // Last headline: fades in, stays visible
        return {
          input: [fadeInStart, fadeInEnd, 1],
          output: [0, 1, 1],
        }
      } else {
        // Middle headlines: fade in, stay visible, fade out
        return {
          input: [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd],
          output: [0, 1, 1, 0],
        }
      }
    })
  }, [headlines])

  // Create motion values for each headline opacity
  const opacity0 = useTransform(
    scrollYProgress,
    opacityTransforms[0]?.input || [0, 1],
    opacityTransforms[0]?.output || [1, 1],
  )
  const opacity1 = useTransform(
    scrollYProgress,
    opacityTransforms[1]?.input || [0, 1],
    opacityTransforms[1]?.output || [0, 0],
  )
  const opacity2 = useTransform(
    scrollYProgress,
    opacityTransforms[2]?.input || [0, 1],
    opacityTransforms[2]?.output || [0, 0],
  )

  const opacities = [opacity0, opacity1, opacity2]

  // Track which headline to show (for reduced motion and screen readers)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (value) => {
      const panelSize = 1 / headlines.length
      const newIndex = Math.min(
        Math.floor(value / panelSize + 0.5),
        headlines.length - 1,
      )
      setActiveIndex(newIndex)
    })
    return unsubscribe
  }, [scrollYProgress, headlines.length])

  // Shared headline styles
  const headlineStyles = {
    color: "common.white",
    maxWidth: "16ch",
    textAlign: { xs: "center", md: "left" } as const,
  }

  // If reduced motion, render static text without animation
  if (prefersReducedMotion) {
    const activeHeadline = headlines[activeIndex]
    return (
      <Box
        sx={{
          position: "fixed",
          top: theme.space.panel.topOffset,
          left: theme.space.panel.padding,
          right: theme.space.panel.padding,
          zIndex: theme.zIndex.heroContent + 10,
          pointerEvents: "none",
          display: { xs: "none", md: "block" },
        }}
      >
        <Typography
          variant="h1"
          sx={{
            ...headlineStyles,
            position: "relative",
            textShadow:
              activeHeadline?.textShadow !== false
                ? theme.textShadow.display
                : "none",
          }}
        >
          <Box component="span" sx={{ fontSize: "0.8em" }}>
            {activeHeadline?.line1}
          </Box>
          {activeHeadline?.line2 && (
            <>
              <br />
              <Box component="span" sx={{ fontWeight: 700 }}>
                {activeHeadline.line2}
              </Box>
            </>
          )}
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        position: "fixed",
        top: theme.space.panel.topOffset,
        left: theme.space.panel.padding,
        right: theme.space.panel.padding,
        zIndex: theme.zIndex.heroContent + 10,
        pointerEvents: "none",
        display: { xs: "none", md: "block" },
      }}
    >
      {/* Container for all headlines - they overlap via CSS grid */}
      <Box
        sx={{
          display: "grid",
          "& > *": {
            gridArea: "1 / 1",
          },
        }}
      >
        {/* Render each headline with its opacity transform */}
        {headlines.map((headline, index) => (
          <motion.div
            key={index}
            style={{ opacity: opacities[index] }}
            aria-hidden="true"
          >
            <Typography
              variant="h1"
              component="span"
              sx={{
                ...headlineStyles,
                textShadow:
                  headline.textShadow !== false
                    ? theme.textShadow.display
                    : "none",
              }}
            >
              <Box component="span" sx={{ fontSize: "0.8em", display: "block" }}>
                {headline.line1}
              </Box>
              {headline.line2 && (
                <Box
                  component="span"
                  sx={{ fontWeight: 700, display: "block" }}
                >
                  {headline.line2}
                </Box>
              )}
            </Typography>
          </motion.div>
        ))}

        {/*
          WCAG 1.3.1 & 4.1.2: Screen reader accessible h1 - DO NOT REMOVE
          This is the only h1 exposed to assistive technology.
          Updates based on scroll position to match visible text.
        */}
        <Typography
          variant="h1"
          sx={{
            clip: "rect(0 0 0 0)",
            clipPath: "inset(50%)",
            height: 1,
            width: 1,
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {`${headlines[activeIndex]?.line1 || ""} ${headlines[activeIndex]?.line2 || ""}`}
        </Typography>
      </Box>
    </Box>
  )
}
