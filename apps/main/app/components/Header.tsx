"use client"

import { useRouter } from "next/navigation"
import { useTheme } from "@repo/ui/mui"
import { BaseHeader } from "@repo/ui"

/**
 * Main application header with Next.js routing and theme integration
 */
export function Header() {
  const router = useRouter()
  const theme = useTheme()

  // Smooth scroll to top using requestAnimationFrame
  // Native smooth scroll gets interrupted by React state changes during the tabs
  // transition zone, so we use manual RAF animation which can't be interrupted
  const handleLogoClick = () => {
    const start = window.scrollY
    if (start === 0) return // Already at top

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

  const handleDataClick = () => {
    router.push("/data")
  }

  const handleAboutClick = () => {
    console.log("Navigate to about page")
  }

  return (
    <BaseHeader
      onLogoClick={handleLogoClick}
      onDataClick={handleDataClick}
      onAboutClick={handleAboutClick}
      backgroundColor="transparent"
      textColor={theme.palette.common.white}
      zIndex={theme.zIndex.appBar}
      borderRadius={theme.borderRadius.none}
      boxShadow="none"
      hideOnScroll={false}
      showLanguageSwitcher={false}
    />
  )
}
