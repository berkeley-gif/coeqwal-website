"use client"

/**
 * ScrollElement - Animated child of a ScrollSection
 *
 * Animates opacity (and optionally position) based on the parent
 * ScrollSection's scroll progress. Define enter/hold/exit phases
 * as progress ranges.
 *
 * WCAG 2.3.3: Respects prefers-reduced-motion by skipping animations
 * and rendering at the hold/visible state.
 *
 * @example
 * <ScrollSection height="200vh">
 *   <ScrollElement enter={[0.1, 0.3]} hold={[0.3, 0.7]} exit={[0.7, 0.9]}>
 *     <p>Fades in, holds, fades out</p>
 *   </ScrollElement>
 * </ScrollSection>
 *
 * @example
 * // Fade in only (no exit)
 * <ScrollElement enter={[0.2, 0.5]}>
 *   <p>Fades in and stays visible</p>
 * </ScrollElement>
 */

import React, { useContext, useMemo } from "react"
import { motion, useTransform, useReducedMotion } from "@repo/motion"
import type { ProgressRange, AnimationType } from "../types"
import { ScrollSectionContext } from "./ScrollSection"

interface ScrollElementProps {
  /** Progress range for enter animation [start, end] */
  enter: ProgressRange
  /** Progress range for hold phase [start, end] (optional) */
  hold?: ProgressRange
  /** Progress range for exit animation [start, end] (optional) */
  exit?: ProgressRange
  /** Animation type (default: "fade") */
  animation?: AnimationType
  /** Additional inline styles */
  style?: React.CSSProperties
  /** Additional class name */
  className?: string
  /** Children */
  children: React.ReactNode
}

export function ScrollElement({
  enter,
  hold,
  exit,
  animation = "fade",
  style,
  className,
  children,
}: ScrollElementProps) {
  const context = useContext(ScrollSectionContext)
  const prefersReducedMotion = useReducedMotion()

  if (!context) {
    throw new Error("ScrollElement must be used inside a ScrollSection")
  }

  const { progress } = context

  // Build opacity keyframes from phases
  const { inputRange, outputRange } = useMemo(() => {
    const input: number[] = []
    const output: number[] = []

    // Before enter
    input.push(enter[0])
    output.push(0)

    // End of enter
    input.push(enter[1])
    output.push(1)

    // Hold phase (if specified)
    if (hold) {
      if (hold[0] > enter[1]) {
        input.push(hold[0])
        output.push(1)
      }
      input.push(hold[1])
      output.push(1)
    }

    // Exit phase (if specified)
    if (exit) {
      if (exit[0] > (hold ? hold[1] : enter[1])) {
        input.push(exit[0])
        output.push(1)
      }
      input.push(exit[1])
      output.push(0)
    }

    return { inputRange: input, outputRange: output }
  }, [enter, hold, exit])

  const opacity = useTransform(progress, inputRange, outputRange)

  // Slide animations
  const slideY = useTransform(
    progress,
    [enter[0], enter[1]],
    animation === "slideUp" ? [40, 0] : [0, 0],
  )

  const slideX = useTransform(
    progress,
    [enter[0], enter[1]],
    animation === "slideLeft" ? [40, 0] : [0, 0],
  )

  // WCAG 2.3.3: Skip animations if user prefers reduced motion
  if (prefersReducedMotion) {
    return (
      <div style={style} className={className}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      style={{
        opacity: animation === "none" ? undefined : opacity,
        y: animation === "slideUp" ? slideY : undefined,
        x: animation === "slideLeft" ? slideX : undefined,
        ...style,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
