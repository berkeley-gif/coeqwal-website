"use client"

import { BaseHeader } from "@repo/ui"
import { useTabs } from "../context/Tabs"

/**
 * Main application header
 *
 * Wraps BaseHeader with app-specific behavior:
 * - Dynamic background color based on scroll position (tabs area detection)
 * - Custom smooth scroll to top for logo click
 *
 * WCAG 2.0 AA Compliance:
 * - Inherits all accessibility features from BaseHeader
 * - WCAG 2.3.3: Respects prefers-reduced-motion for scroll animation
 */
export function Header() {
  const { isInTabsArea } = useTabs()

  // Smooth scroll to top using requestAnimationFrame
  // Native smooth scroll gets interrupted by React state changes during the tabs
  // transition zone, so we use manual RAF animation which can't be interrupted
  const handleLogoClick = () => {
    const start = window.scrollY
    if (start === 0) return // Already at top

    // WCAG 2.3.3: Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches

    if (prefersReducedMotion) {
      // Instant scroll for users who prefer reduced motion
      window.scrollTo(0, 0)
      return
    }

    const startTime = performance.now()
    const duration = 600 // ms

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)

      window.scrollTo(0, start * (1 - eased))

      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      }
    }

    requestAnimationFrame(animateScroll)
  }

  return (
    <BaseHeader
      onLogoClick={handleLogoClick}
      // Dynamic background: solid when in tabs area, transparent otherwise
      backgroundColor={isInTabsArea ? "rgba(42, 82, 135, 0.75)" : "transparent"}
    />
  )
}
