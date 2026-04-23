"use client"

/**
 * useMarkTabsInView - Hook to track tab visibility
 *
 * Uses intersection observer to determine if tabs are in view.
 */

import { useEffect } from "react"
import { useTabs } from "../context/Tabs"

export function useMarkTabsInView(stickyOffsetPx: number = 0) {
  const { tabsRef, setIsInTabsArea, isInTabsArea } = useTabs()

  useEffect(() => {
    const tabsEl = tabsRef.current
    if (!tabsEl) return

    const update = () => {
      const tabsRect = tabsEl.getBoundingClientRect()
      const distanceFromSticky = Math.abs(tabsRect.top - stickyOffsetPx)

      // Hysteresis: different thresholds for entering vs leaving collapsed state
      // - Collapse when within 1px of sticky position
      // - Stay collapsed until far enough from sticky (large enough to ignore
      //   small programmatic scrolls e.g. tour scrollIntoView)
      // This prevents jitter when tabs collapse and page height changes
      const enterThreshold = 1
      const exitThreshold = 100

      if (isInTabsArea) {
        // Currently collapsed - only expand if we scroll far enough away
        if (distanceFromSticky > exitThreshold) {
          setIsInTabsArea(false)
        }
      } else {
        // Currently expanded - collapse when we reach sticky position
        if (distanceFromSticky <= enterThreshold) {
          setIsInTabsArea(true)
        }
      }
    }

    // Run once in case we load mid-page
    update()

    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)

    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [tabsRef, stickyOffsetPx, setIsInTabsArea, isInTabsArea])
}
