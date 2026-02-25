"use client"

import { BaseHeader } from "@repo/ui"
import { useRouter } from "next/navigation"
import { useTheme } from "@repo/ui/mui"
import { useTabs } from "../context/Tabs"
import { WATER_THEMES } from "@repo/data/coeqwal"

/**
 * Main application header
 *
 *
 * WCAG 2.0 AA Compliance:
 * - Inherits all accessibility features from BaseHeader
 * - WCAG 2.3.3: Respects prefers-reduced-motion for scroll animation
 */
export function Header() {
  const router = useRouter()
  const theme = useTheme()
  const { isInTabsArea } = useTabs()

  const handleLogoClick = () => {
    const start = window.scrollY
    if (start === 0) return

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches

    if (prefersReducedMotion) {
      window.scrollTo(0, 0)
      return
    }

    const startTime = performance.now()
    const duration = 600
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      window.scrollTo(0, start * (1 - easeOutCubic(progress)))
      if (progress < 1) requestAnimationFrame(animateScroll)
    }
    requestAnimationFrame(animateScroll)
  }

  const waterThemesOptions = WATER_THEMES.map((wt) => ({
    key: wt.id,
    label: wt.label.replace(/\n/g, " "),
    onClick: () => {},
  }))

  return (
    <BaseHeader
      onLogoClick={handleLogoClick}
      onAboutClick={() => router.push("/about")}
      onGetDataClick={() => router.push("/data")}
      waterThemesOptions={waterThemesOptions}
      backgroundColor={
        isInTabsArea ? "rgba(42, 82, 135, 0.75)" : theme.palette.common.white
      }
      textColor={isInTabsArea ? theme.palette.common.white : "#555555"}
      borderBottom={
        isInTabsArea
          ? `${theme.strokeWidth.rule}px solid rgba(255,255,255,0.2)`
          : "1px solid #e5e5df"
      }
      logoVariant={isInTabsArea ? "light" : "color"}
      shrinkOnScroll
    />
  )
}
