/**
 * MorphingHeadline - Scroll-linked headline that morphs between two panels
 *
 * Creates a floating h1 that transitions between VideoHero and FrontmatterPanel
 * text content as the user scrolls. The headline stays visually pinned while
 * crossfading text and adjusting text-shadow.
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

import React, { useEffect, useState } from "react"
import { useScroll, useTransform, motion } from "@repo/motion"
import { Box, Typography, useTheme } from "@repo/ui/mui"

// WCAG 2.3.3: Check for reduced motion preference
const getReducedMotionPreference = () =>
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false

export interface MorphingHeadlineProps {
  /** First panel's headline - line 1 (smaller text) */
  text1Line1: string
  /** First panel's headline - line 2 (bold text) */
  text1Line2: string
  /** Second panel's headline - line 1 (smaller text) */
  text2Line1: string
  /** Second panel's headline - line 2 (bold text) */
  text2Line2?: string
  /** Container ref that spans both panels for scroll tracking */
  containerRef: React.RefObject<HTMLElement | null>
}

export default function MorphingHeadline({
  text1Line1,
  text1Line2,
  text2Line1,
  text2Line2,
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

  // Track scroll progress within the container (both panels)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    // Start when top of container hits top of viewport
    // End when bottom of container hits bottom of viewport
    offset: ["start start", "end end"],
  })

  // Transform scroll progress to opacity values
  // Text 1: fully visible at 0%, starts fading at 40%, gone by 60%
  // Text 2: invisible at 0%, starts appearing at 40%, fully visible by 60%
  const text1Opacity = useTransform(scrollYProgress, [0, 0.4, 0.6], [1, 1, 0])
  const text2Opacity = useTransform(scrollYProgress, [0, 0.4, 0.6], [0, 0, 1])

  // Track text shadow state (on over video, off over solid color)
  const [showTextShadow, setShowTextShadow] = useState(true)

  // Update text shadow based on scroll progress
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (value) => {
      setShowTextShadow(value < 0.5)
    })
    return unsubscribe
  }, [scrollYProgress])

  // Track which text to show (for reduced motion visual and screen readers)
  // Updates at 50% scroll progress
  const [showText1, setShowText1] = useState(true)

  // WCAG 4.1.2: Update screen reader text based on scroll position
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (value) => {
      setShowText1(value < 0.5)
    })
    return unsubscribe
  }, [scrollYProgress])

  // Shared headline styles
  const headlineStyles = {
    color: "common.white",
    maxWidth: "16ch",
    textAlign: { xs: "center", md: "left" } as const,
    position: "absolute" as const,
    top: 0,
    left: 0,
  }

  // If reduced motion, render static text without animation
  if (prefersReducedMotion) {
    return (
      <Box
        sx={{
          position: "fixed",
          top: theme.space.panel.topOffset,
          left: theme.space.panel.padding,
          right: theme.space.panel.padding,
          zIndex: theme.zIndex.heroContent + 10,
          pointerEvents: "none",
          display: { xs: "flex", md: "block" },
          justifyContent: { xs: "center", md: "flex-start" },
        }}
      >
        <Typography
          variant="h1"
          sx={{
            ...headlineStyles,
            position: "relative",
            textShadow: showText1 ? theme.textShadow.display : "none",
          }}
        >
          <Box component="span" sx={{ fontSize: "0.8em" }}>
            {showText1 ? text1Line1 : text2Line1}
          </Box>
          <br />
          <Box component="span" sx={{ fontWeight: 700 }}>
            {showText1 ? text1Line2 : text2Line2 || ""}
          </Box>
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
        display: { xs: "flex", md: "block" },
        justifyContent: { xs: "center", md: "flex-start" },
      }}
    >
      {/* Container for both headlines - they overlap */}
      <Box sx={{ position: "relative" }}>
        {/* Text 1: VideoHero headline - WCAG 1.3.1: Hidden from screen readers */}
        <motion.div style={{ opacity: text1Opacity }} aria-hidden="true">
          <Typography
            variant="h1"
            component="span"
            sx={{
              ...headlineStyles,
              position: "relative",
              textShadow: showTextShadow ? theme.textShadow.display : "none",
            }}
          >
            <Box component="span" sx={{ fontSize: "0.8em", display: "block" }}>
              {text1Line1}
            </Box>
            <Box component="span" sx={{ fontWeight: 700, display: "block" }}>
              {text1Line2}
            </Box>
          </Typography>
        </motion.div>

        {/* Text 2: FrontmatterPanel headline - WCAG 1.3.1: Hidden from screen readers */}
        <motion.div
          style={{
            opacity: text2Opacity,
            position: "absolute",
            top: 0,
            left: 0,
          }}
          aria-hidden="true"
        >
          <Typography
            variant="h1"
            component="span"
            sx={{
              ...headlineStyles,
              position: "relative",
              textShadow: "none",
            }}
          >
            <Box component="span" sx={{ fontSize: "0.8em", display: "block" }}>
              {text2Line1}
            </Box>
            {text2Line2 && (
              <Box component="span" sx={{ fontWeight: 700, display: "block" }}>
                {text2Line2}
              </Box>
            )}
          </Typography>
        </motion.div>

        {/*
          WCAG 1.3.1 & 4.1.2: Screen reader accessible h1 - DO NOT REMOVE
          This is the only h1 exposed to assistive technology.
          Updates based on scroll position to match visible text.
        */}
        <Typography
          variant="h1"
          sx={{
            ...headlineStyles,
            position: "absolute",
            // Visually hidden but accessible to screen readers
            clip: "rect(0 0 0 0)",
            clipPath: "inset(50%)",
            height: 1,
            width: 1,
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {showText1
            ? `${text1Line1} ${text1Line2}`
            : `${text2Line1} ${text2Line2 || ""}`}
        </Typography>
      </Box>
    </Box>
  )
}
