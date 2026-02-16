/**
 * MorphingHeadline - Scroll-linked headline that morphs across multiple panels
 *
 * Creates a floating h1 that transitions between panel headlines as the user
 * scrolls. The headline stays visually pinned while crossfading text and
 * adjusting text-shadow.
 *
 * Supports any number of headlines - dynamically calculates opacity transitions.
 * Scrolling up reverses the morph effect naturally via scroll progress tracking.
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

import React, { useEffect, useState, useMemo, useCallback } from "react"
import { useScroll, motion, useReducedMotion } from "@repo/motion"
import { Box, Typography, useTheme } from "@repo/ui/mui"

/**
 * Interpolates a value within keyframe ranges
 * Used to calculate opacity based on scroll progress
 */
function interpolate(
  value: number,
  inputRange: number[],
  outputRange: number[],
): number {
  // Find the segment we're in
  for (let i = 0; i < inputRange.length - 1; i++) {
    const inputStart = inputRange[i] ?? 0
    const inputEnd = inputRange[i + 1] ?? 1
    const outputStart = outputRange[i] ?? 0
    const outputEnd = outputRange[i + 1] ?? 0

    if (value >= inputStart && value <= inputEnd) {
      // Linear interpolation within this segment
      const progress = (value - inputStart) / (inputEnd - inputStart)
      return outputStart + progress * (outputEnd - outputStart)
    }
  }

  // Outside range - clamp to nearest output
  if (value <= (inputRange[0] ?? 0)) return outputRange[0] ?? 0
  return outputRange[outputRange.length - 1] ?? 0
}

export interface HeadlineText {
  /** First line (smaller text) */
  line1: string
  /** Second line (bold text) */
  line2?: string
  /** Whether to show text shadow (default: true for first headline) */
  textShadow?: boolean
  /** Text color (default: "text.secondary") */
  textColor?: string
}

export interface MorphingHeadlineProps {
  /** Array of headline texts to morph through (supports any number) */
  headlines: HeadlineText[]
  /** Container ref that spans all panels for scroll tracking */
  containerRef: React.RefObject<HTMLElement | null>
}

export default function MorphingHeadline({
  headlines,
  containerRef,
}: MorphingHeadlineProps) {
  const theme = useTheme()
  // WCAG 2.3.3: Respect user's reduced motion preference (reacts to changes)
  const prefersReducedMotion = useReducedMotion()

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

  /**
   * Calculate opacity keyframes for each headline based on number of panels.
   * Dynamically supports any number of headlines.
   *
   * Transition timing varies by position to account for visual perception:
   * - Earlier transitions need slightly less delay (panel already scrolling in)
   * - Later transitions need more delay (to sync with panel visibility)
   */
  const opacityKeyframes = useMemo(() => {
    const count = headlines.length
    if (count < 2)
      return headlines.map(() => ({ input: [0, 1], output: [1, 1] }))

    const panelSize = 1 / count

    return headlines.map((_, index) => {
      const panelStart = index * panelSize
      const panelEnd = (index + 1) * panelSize

      // Adjust timing based on transition position.
      // Visual perception requires earlier transitions at the start of a scroll sequence
      // and later transitions as the user settles into the scroll rhythm.
      // These values are tuned by hand - adjust if adding more panels.
      const getTransitionTiming = (transitionIndex: number) => {
        if (transitionIndex === 0) return { start: 0.0, end: 0.1 } // First: immediate
        if (transitionIndex === 1) return { start: 0.1, end: 0.25 } // Middle: standard
        return { start: 0.2, end: 0.35 } // Later: delayed
      }

      if (index === 0) {
        // First headline: visible at start, fades out into panel 2
        const timing = getTransitionTiming(0)
        const nextFadeStart = panelEnd + panelSize * timing.start
        const nextFadeEnd = panelEnd + panelSize * timing.end
        return {
          input: [0, nextFadeStart, nextFadeEnd],
          output: [1, 1, 0],
        }
      } else if (index === count - 1) {
        // Last headline: fades in during this panel, stays visible
        const timing = getTransitionTiming(index - 1)
        const fadeStart = panelStart + panelSize * timing.start
        const fadeEnd = panelStart + panelSize * timing.end
        return {
          input: [fadeStart, fadeEnd, 1],
          output: [0, 1, 1],
        }
      } else {
        // Middle headlines: fade in during this panel, fade out into next panel
        const fadeInTiming = getTransitionTiming(index - 1)
        const fadeOutTiming = getTransitionTiming(index)
        const fadeStart = panelStart + panelSize * fadeInTiming.start
        const fadeEnd = panelStart + panelSize * fadeInTiming.end
        const nextFadeStart = panelEnd + panelSize * fadeOutTiming.start
        const nextFadeEnd = panelEnd + panelSize * fadeOutTiming.end
        return {
          input: [fadeStart, fadeEnd, nextFadeStart, nextFadeEnd],
          output: [0, 1, 1, 0],
        }
      }
    })
  }, [headlines])

  // Track opacities for all headlines (dynamic array)
  const [opacities, setOpacities] = useState<number[]>(() =>
    headlines.map((_, i) => (i === 0 ? 1 : 0)),
  )

  // Track dock offset (when scrolled past container, headline moves up with it)
  const [dockOffset, setDockOffset] = useState(0)

  // Calculate opacity for a specific headline at a given scroll progress
  const calculateOpacity = useCallback(
    (index: number, progress: number): number => {
      const keyframes = opacityKeyframes[index]
      if (!keyframes) return 0
      return interpolate(progress, keyframes.input, keyframes.output)
    },
    [opacityKeyframes],
  )

  // Update opacities when scroll progress changes
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (value) => {
      const newOpacities = headlines.map((_, index) =>
        calculateOpacity(index, value),
      )
      setOpacities(newOpacities)
    })
    return unsubscribe
  }, [scrollYProgress, headlines, calculateOpacity])

  // Separate scroll listener for docking (works even when scrolled past container)
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight

      // When container bottom is above viewport bottom, we've scrolled past
      if (rect.bottom < viewportHeight) {
        // Calculate how much to offset (negative value moves headline up)
        setDockOffset(rect.bottom - viewportHeight)
      } else {
        setDockOffset(0)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll() // Check initial state

    return () => window.removeEventListener("scroll", handleScroll)
  }, [containerRef])

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
    color: "text.secondary",
    // fontSize needed for maxWidth "ch" unit to calculate correctly
    fontSize: theme.typography.h1.fontSize,
    maxWidth: "16ch",
    textAlign: { xs: "center", lg: "left" } as const,
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
          display: { xs: "none", lg: "block" },
          transform: dockOffset !== 0 ? `translateY(${dockOffset}px)` : "none",
        }}
      >
        <Box
          sx={{
            ...headlineStyles,
            position: "relative",
            color: activeHeadline?.textColor || "text.secondary",
            textShadow:
              activeHeadline?.textShadow !== false
                ? theme.textShadow.display
                : "none",
          }}
        >
          <Typography variant="h2Main" component="span" sx={{ display: "block" }}>
            {activeHeadline?.line1}
          </Typography>
          {activeHeadline?.line2 && (
            <Typography variant="h1" component="span" sx={{ display: "block" }}>
              {activeHeadline.line2}
            </Typography>
          )}
        </Box>
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
        display: { xs: "none", lg: "block" },
        transform: dockOffset !== 0 ? `translateY(${dockOffset}px)` : "none",
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
            style={{ opacity: opacities[index] ?? 0 }}
            aria-hidden="true"
          >
            <Box
              sx={{
                ...headlineStyles,
                color: headline.textColor || "text.secondary",
                textShadow:
                  headline.textShadow !== false
                    ? theme.textShadow.display
                    : "none",
              }}
            >
              <Typography variant="h2Main" component="span" sx={{ display: "block" }}>
                {headline.line1}
              </Typography>
              {headline.line2 && (
                <Typography variant="h1" component="span" sx={{ display: "block" }}>
                  {headline.line2}
                </Typography>
              )}
            </Box>
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
