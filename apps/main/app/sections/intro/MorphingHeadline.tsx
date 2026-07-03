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

import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  forwardRef,
} from "react"
import {
  useScroll,
  motion,
  useReducedMotion,
  useTransform,
  useMotionValueEvent,
  MotionValue,
} from "@repo/motion"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { useDockOffset } from "@repo/scrollytelling"

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
  /** Relative weights for each panel's scroll height (default: equal distribution).
   *  e.g., [1, 2, 1, 1] means the second panel takes 2x the scroll distance.
   *  Ignored if panelBoundaries is provided. */
  weights?: number[]
  /** DOM-measured panel boundaries from usePanelBoundaries. If provided, uses these
   *  instead of weight-based calculations for more accurate scroll tracking. */
  panelBoundaries?: {
    panels: { start: number; end: number; mid: number }[]
    ready: boolean
  }
  /**
   * Scroll progress at which the first headline (index 0) should be fully gone
   * and the second headline (index 1) should be fully visible.
   *
   * Computed via useMeetingProgress() in the consumer.e.g. pass the progress
   * value when VideoHero's bottom meets the MorphingHeadline's top. The crossfade
   * spans from crossfadeAt * 0.5 (midpoint of Panel 0) to crossfadeAt.
   *
   * Falls back to weight/boundary-based timing when not provided. When
   * `crossfadeRanges[0]` is provided it takes precedence over this prop.
   */
  crossfadeAt?: number
  /**
   * Explicit scroll-progress window for each consecutive headline
   * transition: `crossfadeRanges[i] = [start, end]` fades headline `i`
   * out and headline `i+1` in over exactly that window.
   *
   * Intended for geometry-driven timing, e.g. the window during which
   * the inter-panel seam sweeps through the headline's vertical extent,
   * so the text changes precisely as the rounded-panel gap swipes past
   * the headline. Array length is typically `headlines.length - 1`.
   * Any entry where `end <= start` is treated as "not ready" and falls
   * back to `crossfadeAt` (for transition 0) or weight/boundary timing.
   */
  crossfadeRanges?: Array<[number, number] | undefined>
  /** Scroll progress range [start, end] where headline fades in (hidden before start) */
  appearRange?: [number, number]
  /** Overall scroll progress range [start, end] where headline translates upward and exits */
  exitRange?: [number, number]
  /** Scroll progress range [start, end] where headline shifts up to make room (e.g., for circles) */
  shiftRange?: [number, number]
  /** Pixels to shift up during shiftRange (default: 100) */
  shiftAmount?: number
  /**
   * When provided, the headline "docks" to this element's bottom once it scrolls
   * past the headline's top.so the headline scrolls away with the page instead
   * of floating over subsequent content. Use with the final panel ref.
   */
  dockRef?: React.RefObject<HTMLElement | null>
  /**
   * Scroll-progress window `[start, end]` during which the headline
   * glides from its default top position down to the vertical center
   * of the viewport. Outside this range (before `start` or between
   * `end` and `centerExitRange[0]`), the headline stays at whichever
   * anchor it last reached. Pair with `centerExitRange` to bring it
   * back up.
   *
   * The component self-measures its own CSS `top` and rendered
   * height, so the center offset is always pixel-accurate regardless
   * of font size or viewport.
   */
  centerEnterRange?: [number, number]
  /**
   * Scroll-progress window `[start, end]` during which the headline
   * glides back from the vertical center to its default top position.
   */
  centerExitRange?: [number, number]
}

const MorphingHeadline = forwardRef<HTMLDivElement, MorphingHeadlineProps>(
  function MorphingHeadline(
    {
      headlines,
      containerRef,
      weights,
      panelBoundaries,
      crossfadeAt,
      crossfadeRanges,
      appearRange,
      exitRange,
      shiftRange,
      shiftAmount = 100,
      dockRef,
      centerEnterRange,
      centerExitRange,
    },
    ref,
  ) {
    const theme = useTheme()
    // WCAG 2.3.3: Respect user's reduced motion preference (reacts to changes)
    const prefersReducedMotion = useReducedMotion()

    // Viewport height in pixels.updated on resize so the exit Y distance always
    // matches the 1:1 natural scroll rate of the sticky paragraph that exits alongside it.
    const [windowHeight, setWindowHeight] = useState(900)
    useEffect(() => {
      setWindowHeight(window.innerHeight)
      const onResize = () => setWindowHeight(window.innerHeight)
      window.addEventListener("resize", onResize, { passive: true })
      return () => window.removeEventListener("resize", onResize)
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

    // Exit opacity: easeOut mirrors Panel3Text's paragraph fade.fast at first,
    // slowing near zero, so both elements visually exit at the same perceived rate.
    // Fallback uses [0, 1] -> [1, 1] (non-degenerate constant 1) instead of [1, 1]
    // which would cause 0/0 = NaN in Framer Motion's interpolator.
    const exitOpacity = useTransform(
      scrollYProgress,
      exitRange ? [exitRange[0], exitRange[1]] : [0, 1],
      exitRange ? [1, 0] : [1, 1],
      { ease: (t: number) => 1 - (1 - t) * (1 - t) },
    )

    // Appear opacity: hidden before appearRange[0], fades in by appearRange[1].
    // Fallback uses [0, 1] -> [1, 1] (non-degenerate constant 1) instead of [0, 0].
    const appearOpacity = useTransform(
      scrollYProgress,
      appearRange ? [0, appearRange[0], appearRange[1]] : [0, 1],
      appearRange ? [0, 0, 1] : [1, 1],
    )

    // Combined: invisible before appearRange, fades out during exitRange.
    // Guard explicitly against NaN.?? only catches null/undefined, not NaN.
    const combinedOpacity = useTransform(
      [appearOpacity, exitOpacity] as MotionValue<number>[],
      ([a, e]: number[]) => {
        const sa = Number.isFinite(a) ? (a as number) : 1
        const se = Number.isFinite(e) ? (e as number) : 1
        return sa * se
      },
    )

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

      // Use DOM-measured boundaries if available, otherwise fall back to weights
      // Include ALL panel boundaries (not just headline count) so the last headline
      // can reference panels beyond its "slot" (e.g., headline 3 maps to panel 4)
      let panelStarts: number[]
      if (panelBoundaries?.ready && panelBoundaries.panels.length >= count) {
        panelStarts = [
          ...panelBoundaries.panels.map((p) => p.start),
          panelBoundaries.panels[panelBoundaries.panels.length - 1]?.end ?? 1,
        ]
      } else {
        const w = weights || headlines.map(() => 1)
        const totalWeight = w.reduce((sum, v) => sum + v, 0)
        panelStarts = w.reduce<number[]>(
          (acc, weight) => [
            ...acc,
            (acc[acc.length - 1] ?? 0) + weight / totalWeight,
          ],
          [0],
        )
      }

      // Resolve the scroll-progress window for transition `i` (headline i
      // -> headline i+1). Prefers an explicit, geometry-driven
      // `crossfadeRanges[i]` when valid, otherwise falls back to the
      // single-point `crossfadeAt` (for transition 0) or to a narrow
      // weight/boundary-based window near the panel seam.
      const transitionRange = (i: number): [number, number] => {
        const explicit = crossfadeRanges?.[i]
        if (explicit && explicit[1] > explicit[0]) return explicit

        if (i === 0 && crossfadeAt !== undefined) {
          return [crossfadeAt * 0.25, crossfadeAt]
        }

        const boundary = panelStarts[i + 1] ?? 1
        const prevSize = boundary - (panelStarts[i] ?? 0)
        return [boundary - 0.3 * prevSize, boundary - 0.15 * prevSize]
      }

      // For each headline build its opacity keyframes from two
      // (at most) overlapping-but-disjoint ranges: a fade-in drawn
      // from the previous transition, and a fade-out drawn from the
      // next transition. First headline has no fade-in. Last has no
      // fade-out.
      return headlines.map((_, index) => {
        const fadeIn = index > 0 ? transitionRange(index - 1) : null
        const fadeOut = index < count - 1 ? transitionRange(index) : null

        if (!fadeIn && fadeOut) {
          return { input: [0, fadeOut[0], fadeOut[1]], output: [1, 1, 0] }
        }
        if (fadeIn && !fadeOut) {
          return { input: [fadeIn[0], fadeIn[1], 1], output: [0, 1, 1] }
        }
        if (fadeIn && fadeOut) {
          return {
            input: [fadeIn[0], fadeIn[1], fadeOut[0], fadeOut[1]],
            output: [0, 1, 1, 0],
          }
        }
        return { input: [0, 1], output: [1, 1] }
      })
    }, [headlines, weights, panelBoundaries, crossfadeAt, crossfadeRanges])

    // Track opacities for all headlines (dynamic array)
    const [opacities, setOpacities] = useState<number[]>(() =>
      headlines.map((_, i) => (i === 0 ? 1 : 0)),
    )

    // Self-measured CSS top (in px) and rendered height. Used to
    // compute the translateY that centers the headline vertically
    // in the viewport for centerEnter/centerExit transitions.
    // Measured on mount, on resize, and whenever the headline's own
    // box resizes (font swap, text change, language).
    const internalRef = useRef<HTMLDivElement | null>(null)
    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        internalRef.current = node
        if (typeof ref === "function") ref(node)
        else if (ref)
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      },
      [ref],
    )
    const [selfMetrics, setSelfMetrics] = useState<{
      topPx: number
      heightPx: number
    }>({ topPx: 0, heightPx: 0 })
    useEffect(() => {
      if (typeof window === "undefined") return
      const el = internalRef.current
      if (!el) return
      const measure = () => {
        const cs = window.getComputedStyle(el)
        const topPx = parseFloat(cs.top) || 0
        const heightPx = el.getBoundingClientRect().height
        setSelfMetrics((prev) =>
          prev.topPx === topPx && prev.heightPx === heightPx
            ? prev
            : { topPx, heightPx },
        )
      }
      measure()
      const ro = new ResizeObserver(measure)
      ro.observe(el)
      window.addEventListener("resize", measure, { passive: true })
      return () => {
        ro.disconnect()
        window.removeEventListener("resize", measure)
      }
    }, [])

    // TranslateY that takes the headline from its default top anchor
    // down to viewport-vertical-center during `centerEnterRange`, holds
    // it there, then lifts it back during `centerExitRange`.
    //
    // centerOffset = (windowHeight / 2) - (headlineHeight / 2) - topPx
    // so the element's vertical midpoint lands at the viewport midpoint.
    const centerOffset = useMemo(() => {
      if (!centerEnterRange && !centerExitRange) return 0
      return windowHeight / 2 - selfMetrics.heightPx / 2 - selfMetrics.topPx
    }, [windowHeight, selfMetrics, centerEnterRange, centerExitRange])

    const centerYInput = useMemo<number[]>(() => {
      if (!centerEnterRange && !centerExitRange) return [0, 1]
      const enter = centerEnterRange ?? [0, 0]
      const exit = centerExitRange ?? [1, 1]
      // Build a monotonically increasing input array. Clamp if ranges
      // were passed out of order so useTransform doesn't throw.
      const pts = [0, enter[0], enter[1], exit[0], exit[1], 1]
      for (let i = 1; i < pts.length; i++) {
        if ((pts[i] as number) < (pts[i - 1] as number))
          pts[i] = pts[i - 1] as number
      }
      return pts
    }, [centerEnterRange, centerExitRange])

    const centerYOutput = useMemo<number[]>(() => {
      if (!centerEnterRange && !centerExitRange) return [0, 0]
      const hasEnter = !!centerEnterRange
      const hasExit = !!centerExitRange
      return [
        0,
        hasEnter ? 0 : centerOffset,
        centerOffset,
        centerOffset,
        hasExit ? 0 : centerOffset,
        0,
      ]
    }, [centerEnterRange, centerExitRange, centerOffset])

    const centerY = useTransform(scrollYProgress, centerYInput, centerYOutput)

    // Dock offset.rAF-safe, no forced layout flush on scroll.
    // Returns a MotionValue that drives both the animated branch (direct DOM write)
    // and the reduced-motion branch (via useMotionValueEvent below).
    const dockOffsetMV = useDockOffset(dockRef, containerRef)

    // Reduced-motion branch: sync dockOffset state from the MotionValue so the
    // static CSS transform can be updated without a scroll listener.
    const [dockOffset, setDockOffset] = useState(0)
    useMotionValueEvent(dockOffsetMV, "change", setDockOffset)

    // Y transform: combines mid-panel shift (for circles) and exit scroll-away.
    // The exit segment uses easeIn (quadratic) so the headline starts slowly -
    // matching the circles' gradual upward glide.then builds momentum off-screen.
    // Shift and hold segments stay linear.
    const exitYInput: number[] = []
    const exitYOutput: number[] = []
    const exitYEase: ((t: number) => number)[] = []
    const linear = (t: number) => t
    const easeInQuad = (t: number) => t * t

    if (shiftRange && exitRange) {
      exitYInput.push(shiftRange[0])
      exitYOutput.push(0)
      exitYInput.push(shiftRange[1])
      exitYOutput.push(-shiftAmount)
      exitYEase.push(linear)
      if (exitRange[0] > shiftRange[1]) {
        exitYInput.push(exitRange[0])
        exitYOutput.push(-shiftAmount)
        exitYEase.push(linear)
      }
      exitYInput.push(exitRange[1])
      exitYOutput.push(-shiftAmount - windowHeight)
      exitYEase.push(easeInQuad)
    } else if (exitRange) {
      exitYInput.push(exitRange[0], exitRange[1])
      exitYOutput.push(0, -windowHeight)
      exitYEase.push(easeInQuad)
    } else {
      exitYInput.push(0, 1)
      exitYOutput.push(0, 0)
      exitYEase.push(linear)
    }

    const exitY = useTransform(scrollYProgress, exitYInput, exitYOutput, {
      ease: exitYEase,
    })

    // Combined y = scroll-driven exit + dock offset + center glide.
    const combinedY = useTransform(
      [exitY, dockOffsetMV, centerY] as MotionValue<number>[],
      ([e, d, c]: number[]) => (e ?? 0) + (d ?? 0) + (c ?? 0),
    )

    // Calculate opacity for a specific headline at a given scroll progress
    const calculateOpacity = useCallback(
      (index: number, progress: number): number => {
        const keyframes = opacityKeyframes[index]
        if (!keyframes) return 0
        return interpolate(progress, keyframes.input, keyframes.output)
      },
      [opacityKeyframes],
    )

    // Update opacities when scroll progress changes.
    // Also recalculate immediately for the current position whenever calculateOpacity
    // changes (e.g. after panelBoundaries/crossfadeAt arrive while the page is already
    // scrolled). Without this, opacities stay stale until the next scroll event.
    useEffect(() => {
      const recalculate = (value: number) => {
        setOpacities(
          headlines.map((_, index) => calculateOpacity(index, value)),
        )
      }
      recalculate(scrollYProgress.get())
      return scrollYProgress.on("change", recalculate)
    }, [scrollYProgress, headlines, calculateOpacity])

    // Track which headline to show (for reduced motion and screen readers)
    const [activeIndex, setActiveIndex] = useState(0)

    useEffect(() => {
      // Use DOM-measured boundaries if available, otherwise fall back to weights
      let computedBoundaries: number[]
      if (
        panelBoundaries?.ready &&
        panelBoundaries.panels.length >= headlines.length
      ) {
        computedBoundaries = [
          0,
          ...panelBoundaries.panels
            .slice(0, headlines.length)
            .map((p) => p.start),
        ]
      } else {
        const w = weights || headlines.map(() => 1)
        const totalWeight = w.reduce((sum, v) => sum + v, 0)
        computedBoundaries = w.reduce<number[]>(
          (acc, weight) => [
            ...acc,
            (acc[acc.length - 1] ?? 0) + weight / totalWeight,
          ],
          [0],
        )
      }

      const findIndex = (value: number) => {
        let idx = 0
        for (let i = 0; i < computedBoundaries.length - 1; i++) {
          const mid =
            ((computedBoundaries[i] ?? 0) + (computedBoundaries[i + 1] ?? 1)) /
            2
          if (value >= mid) idx = Math.min(i + 1, headlines.length - 1)
        }
        return idx
      }
      // Recalculate immediately so activeIndex is correct when boundaries arrive
      // while the page is already scrolled (same staleness fix as opacities above).
      setActiveIndex(findIndex(scrollYProgress.get()))
      return scrollYProgress.on("change", (value) =>
        setActiveIndex(findIndex(value)),
      )
    }, [scrollYProgress, headlines, weights, panelBoundaries])

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
          ref={setRefs}
          sx={{
            position: "fixed",
            top: theme.space.panel.topOffset,
            left: theme.space.panel.padding,
            right: theme.space.panel.padding,
            zIndex: theme.zIndex.heroContent + 10,
            pointerEvents: "none",
            display: { xs: "none", lg: "block" },
            ...(dockOffset !== 0 && {
              transform: `translateY(${dockOffset}px)`,
            }),
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
            <Typography
              variant="h2Main"
              component="span"
              sx={{ display: "block" }}
            >
              {activeHeadline?.line1}
            </Typography>
            {activeHeadline?.line2 && (
              <Typography
                variant="h1"
                component="span"
                sx={{ display: "block" }}
              >
                {activeHeadline.line2}
              </Typography>
            )}
          </Box>
        </Box>
      )
    }

    return (
      <motion.div
        ref={setRefs}
        style={{
          y: combinedY,
          opacity: combinedOpacity,
          position: "fixed",
          top: theme.space.panel.topOffset,
          left: theme.space.panel.padding,
          right: theme.space.panel.padding,
          zIndex: theme.zIndex.heroContent + 10,
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            display: { xs: "none", lg: "block" },
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
                  <Typography
                    variant="h2Main"
                    component="span"
                    sx={{ display: "block" }}
                  >
                    {headline.line1}
                  </Typography>
                  {headline.line2 && (
                    <Typography
                      variant="h1"
                      component="span"
                      sx={{ display: "block" }}
                    >
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
      </motion.div>
    )
  },
)

export default MorphingHeadline
