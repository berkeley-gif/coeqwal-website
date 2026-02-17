"use client"

import { BaseHeader } from "@repo/ui"
import { useRouter } from "next/navigation"
import { useTheme, Box } from "@repo/ui/mui"
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
  const router = useRouter()
  const theme = useTheme()
  const { isInTabsArea, isHeaderDark } = useTabs()

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
    <Box
      sx={{
        // Remove text shadow when header is in dark/flat mode
        ...(isHeaderDark && {
          "& .MuiButton-root, & .MuiToolbar-root": {
            textShadow: "none !important",
          },
        }),
      }}
    >
      <BaseHeader
        onLogoClick={handleLogoClick}
        onAboutClick={() => router.push("about")}
        onGetDataClick={() => router.push("data")}
        // Dynamic background: solid when in tabs area, transparent otherwise
        backgroundColor={isInTabsArea ? "rgba(42, 82, 135, 0.75)" : "transparent"}
        // Text color and logo controlled by IntroSection via context
        textColor={
          isHeaderDark
            ? theme.palette.text.primary
            : theme.palette.common.white
        }
        borderBottom={
          isHeaderDark
            ? `${theme.strokeWidth.rule}px solid ${theme.palette.text.primary}CC`
            : `${theme.strokeWidth.rule}px solid ${theme.palette.common.white}CC`
        }
        logoVariant={isHeaderDark ? "color" : "light"}
      />
    </Box>
  )
}
