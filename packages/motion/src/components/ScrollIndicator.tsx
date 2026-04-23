"use client"

/**
 * ScrollIndicator - Animated scroll navigation indicator
 *
 * WCAG 2.0 AA Compliance Notes:
 * - WCAG 2.1.1: Keyboard accessible (tabIndex, onKeyDown) - DO NOT REMOVE
 * - WCAG 2.3.3: Respects prefers-reduced-motion via useReducedMotion hook
 * - WCAG 2.4.3: Focus moves to target element on activation
 * - WCAG 4.1.2: role="button" and aria-label for screen readers
 */

import React, { useEffect, useCallback } from "react"
import { motion, useAnimation, useReducedMotion } from "../index"
import type { TargetAndTransition } from "framer-motion"

type MotionAxis = "vertical" | "horizontal"

interface ScrollIndicatorProps {
  /** Whether to start the animation immediately */
  animationComplete?: boolean
  /** Delay before starting animation (in seconds) */
  delay?: number
  /** Color of the indicator */
  color?: string
  /** Size of the indicator */
  size?: number
  /** Pulse intensity (scale factor) */
  pulseIntensity?: number
  /** Duration of the show animation */
  showDuration?: number
  /** Duration of the hide animation */
  hideDuration?: number
  /** Click handler for the indicator */
  onClick?: () => void
  /** Target element ID to scroll to (if provided, handles scrolling automatically) */
  scrollToId?: string
  /**
   * Offset (in px) subtracted from the target's top when scrolling.
   * Use this to account for a fixed header so the scrolled-to
   * element lands below it instead of underneath it. Pass a
   * function to resolve the offset at click time (e.g. when it
   * depends on CSS variables that may change live). Defaults to 0.
   */
  scrollOffset?: number | (() => number)
  /** Custom icon/content to animate */
  children?: React.ReactNode
  /** Additional styles */
  style?: React.CSSProperties
  /** CSS class name */
  className?: string
  /** The direction of bounce */
  motionAxis?: MotionAxis
  /** Accessible label for screen readers (WCAG 4.1.2) */
  ariaLabel?: string
  /** Optional label above the icon (e.g. “Scroll”); not animated with the bounce */
  label?: React.ReactNode
}

/**
 * An animated scroll indicator that bounces and pulses to draw attention.
 * Used to indicate that users should click or scroll to see more content.
 */
export const ScrollIndicator: React.FC<ScrollIndicatorProps> = ({
  animationComplete = true,
  delay = 1.0,
  color = "currentColor",
  size = 28,
  pulseIntensity = 1,
  showDuration = 1.5,
  hideDuration = 0.8,
  onClick,
  scrollToId,
  scrollOffset = 0,
  children,
  style = {},
  className,
  motionAxis = "vertical",
  ariaLabel,
  label,
}) => {
  const controls = useAnimation()
  // WCAG 2.3.3: Respect user's reduced motion preference (reacts to changes)
  const prefersReducedMotion = useReducedMotion()

  const axisKey: "x" | "y" = motionAxis === "horizontal" ? "x" : "y"

  const isInteractive = !!scrollToId || !!onClick

  // Handle scroll to target element
  const handleScrollClick = useCallback(() => {
    if (scrollToId) {
      const targetElement = document.getElementById(scrollToId)
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect()
        const currentScrollTop =
          window.pageYOffset || document.documentElement.scrollTop
        const resolvedOffset =
          typeof scrollOffset === "function" ? scrollOffset() : scrollOffset
        const targetPosition = rect.top + currentScrollTop - resolvedOffset

        requestAnimationFrame(() => {
          window.scrollTo({
            top: targetPosition,
            behavior: "smooth",
          })
        })

        // Move focus to target for screen readers (WCAG 2.4.3)
        targetElement.focus({ preventScroll: true })
      }
    }

    // Call custom onClick if provided
    onClick?.()
  }, [scrollToId, scrollOffset, onClick])

  // WCAG 2.1.1: Keyboard accessibility
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        handleScrollClick()
      }
    },
    [handleScrollClick],
  )

  useEffect(() => {
    let animationRunning = true
    let timeoutId: NodeJS.Timeout | null = null

    const bounce = [0, 0, 0]

    const animateIndicator = async () => {
      if (!animationRunning) return

      if (animationComplete) {
        // Wait for specified delay
        timeoutId = setTimeout(async () => {
          if (!animationRunning) return

          try {
            const showAnim: TargetAndTransition = {
              opacity: 1,
              transition: { duration: showDuration },
            }
            showAnim[axisKey] = 0
            // Start the animation sequence
            await controls.start(showAnim)

            // WCAG 2.3.3: Skip bounce animation if user prefers reduced motion
            if (prefersReducedMotion) {
              return // Just show the indicator without continuous animation
            }

            // Begin the pulsing/bouncing animation with pauses
            const animateWithPauses = async () => {
              while (animationRunning) {
                if (!animationRunning) break

                try {
                  const bounceAnim: TargetAndTransition = {
                    transition: {
                      duration: 6,
                      ease: "easeInOut",
                    },
                  }
                  bounceAnim[axisKey] = bounce
                  bounceAnim.scale =
                    pulseIntensity !== 1 ? [1, pulseIntensity, 1] : 1

                  await controls.start(bounceAnim)
                } catch {
                  // Animation interrupted, exit gracefully
                  break
                }
              }
            }

            if (animationRunning) {
              animateWithPauses()
            }
          } catch {
            // Animation interrupted, exit gracefully
          }
        }, delay * 1000)
      } else {
        // Hide the indicator if animation isn't complete
        try {
          const hideAnim: TargetAndTransition = {
            opacity: 0,
            transition: { duration: hideDuration },
          }
          hideAnim[axisKey] = 20
          controls.start(hideAnim)
        } catch {
          // Animation interrupted, exit gracefully
        }
      }
    }

    animateIndicator()

    // Cleanup function
    return () => {
      animationRunning = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [
    animationComplete,
    controls,
    delay,
    pulseIntensity,
    showDuration,
    hideDuration,
    motionAxis,
    axisKey,
    prefersReducedMotion, // WCAG 2.3.3: Re-run if preference changes
  ])

  /** Initial state (typed safely) */
  const initial: TargetAndTransition = { opacity: 0 }
  initial[axisKey] = 20

  return (
    <div
      onClick={isInteractive ? handleScrollClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      className={className}
      /*
       * WCAG Accessibility Attributes - DO NOT REMOVE:
       * - role="button": WCAG 4.1.2 - Identifies element as interactive
       * - tabIndex={0}: WCAG 2.1.1 - Makes element keyboard focusable
       * - aria-label: WCAG 4.1.2 - Provides accessible name
       */
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={isInteractive ? ariaLabel : undefined}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: label ? 10 : undefined,
        cursor: isInteractive ? "pointer" : "default",
        outline: "none",
        ...style,
      }}
    >
      {label}
      <motion.div
        initial={initial}
        animate={controls}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          fontSize: size,
          outline: "none",
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}
