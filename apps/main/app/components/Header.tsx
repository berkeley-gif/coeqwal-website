"use client"

import { useEffect, useMemo, useState } from "react"
import { BaseHeader, getWaterThemeOptions } from "@repo/ui"
import { useRouter, usePathname } from "next/navigation"
import { useTheme } from "@repo/ui/mui"
import { useTabs } from "../context/Tabs"
import { usePanelRoute } from "../hooks/usePanelRoute"
import { WATER_THEMES } from "../content/themes"
import { useTabNavigation } from "../hooks/useTabNavigation"

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
  const pathname = usePathname()
  const theme = useTheme()
  const { navigateToTab } = useTabNavigation()

  // Context for the theme panels
  const { activeThemeKey, openThemePanel } = usePanelRoute()

  const { isPastHero: rawIsPastHero } = useTabs()

  // Tracks whether a tab navigation click just fired, so the header can
  // snap to its shrunk state immediately instead of waiting for `pathname`
  // to catch up (which lags a beat behind the synchronous tab-context
  // update and caused the tabs strip to render clipped under the header
  // on the first paint). Local state, not shared context - setting it
  // should only re-render this component, not the whole app.
  const [isNavigatingToTabs, setIsNavigatingToTabs] = useState(false)

  useEffect(() => {
    const handleNavigating = () => setIsNavigatingToTabs(true)
    window.addEventListener("explore:navigating", handleNavigating)
    return () =>
      window.removeEventListener("explore:navigating", handleNavigating)
  }, [])

  useEffect(() => {
    setIsNavigatingToTabs(false)
  }, [pathname])

  // On any route other than "/", there's no hero to scroll past.
  // Default to the "past hero" appearance (solid nav) immediately.
  const isHomePage = pathname === "/"
  const isTabsPage =
    pathname === "/learn" ||
    pathname === "/explore" ||
    pathname === "/share" ||
    isNavigatingToTabs

  // Defer isPastHero until after hydration so server and client render
  // the same initial markup (variant="light"). Once mounted, the real
  // scroll-based value takes over.
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => setHasMounted(true), [])
  const isPastHero = hasMounted && (isHomePage ? rawIsPastHero : true)
  const shrinkOnScroll = !isTabsPage

  const handleLogoClick = () => {
    if (typeof window === "undefined") return

    if (pathname !== "/") {
      router.push("/")
      return
    }

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

  const waterThemesOptions = useMemo(() => {
    const disabledKeys = WATER_THEMES.filter(
      (theme) => theme.sections.length === 0,
    ).map((theme) => theme.id)

    return getWaterThemeOptions({
      activeKey: activeThemeKey,
      disabledKeys,
      onThemeClick: openThemePanel,
    })
  }, [activeThemeKey, openThemePanel])

  return (
    <BaseHeader
      onLogoClick={handleLogoClick}
      onAboutClick={() => router.push("/about")}
      onGetDataClick={() => router.push("/data")}
      onGetStartedClick={() => navigateToTab("learn")}
      onToolsClick={() => navigateToTab("explore")}
      waterThemesOptions={waterThemesOptions}
      backgroundColor={isPastHero ? theme.palette.common.white : "transparent"}
      textColor={isPastHero ? "#555555" : theme.palette.common.white}
      borderBottom="none"
      navTextShadow={isPastHero ? "none" : theme.textShadow.nav}
      logoVariant={isPastHero ? "color" : "light"}
      shrinkOnScroll={shrinkOnScroll}
      forceShrunk={isTabsPage}
    />
  )
}
