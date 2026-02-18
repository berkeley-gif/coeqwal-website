"use client"

/**
 * ScrollReveal - Viewport-triggered reveal animation with built-in presets
 *
 * Wraps children in a motion.div that animates when scrolled into view.
 * Provides consistent animation presets and respects prefers-reduced-motion.
 *
 * For the "stagger" preset, each direct child is wrapped and animated
 * with an incremental delay.
 *
 * @example
 * <ScrollReveal animation="fadeUp">
 *   <h1>Fades up into view once</h1>
 * </ScrollReveal>
 *
 * @example
 * <ScrollReveal animation="stagger" staggerDelay={0.12}>
 *   <Card /><Card /><Card />
 * </ScrollReveal>
 */

import React, { Children } from "react"
import { motion, useReducedMotion } from "@repo/motion"

type RevealAnimation =
  | "fadeIn"
  | "fadeUp"
  | "fadeDown"
  | "fadeLeft"
  | "fadeRight"
  | "stagger"

interface ScrollRevealProps {
  /** Animation preset (default: "fadeIn") */
  animation?: RevealAnimation
  /** Trigger only on first viewport entry (default: true) */
  once?: boolean
  /** Viewport intersection threshold 0-1 (default: 0.3) */
  amount?: number
  /** Animation delay in seconds */
  delay?: number
  /** Animation duration in seconds (default: 0.6) */
  duration?: number
  /** Delay between children for the "stagger" preset (default: 0.1) */
  staggerDelay?: number
  /** Additional inline styles */
  style?: React.CSSProperties
  /** Additional class name */
  className?: string
  /** Children */
  children: React.ReactNode
}

const PRESETS: Record<
  Exclude<RevealAnimation, "stagger">,
  { hidden: Record<string, number>; visible: Record<string, number> }
> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  fadeUp: {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  },
  fadeDown: {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 },
  },
  fadeLeft: {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0 },
  },
  fadeRight: {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0 },
  },
}

export function ScrollReveal({
  animation = "fadeIn",
  once = true,
  amount = 0.3,
  delay = 0,
  duration = 0.6,
  staggerDelay = 0.1,
  style,
  className,
  children,
}: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return (
      <div style={style} className={className}>
        {children}
      </div>
    )
  }

  if (animation === "stagger") {
    return (
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once, amount }}
        style={style}
        className={className}
      >
        {Children.map(children, (child, i) => (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration,
                  delay: delay + i * staggerDelay,
                },
              },
            }}
          >
            {child}
          </motion.div>
        ))}
      </motion.div>
    )
  }

  const preset = PRESETS[animation]

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={{
        hidden: preset.hidden,
        visible: {
          ...preset.visible,
          transition: { duration, delay },
        },
      }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  )
}
