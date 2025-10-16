"use client"

/**
 * Flip the "entered" gate the first time the user reaches the tabs area.
 * This does NOT write the URL or cause scroll — it only sets a boolean so
 * the scroll-align hook can act later on tab changes.
 */

import { useEffect } from "react"
import { useTabs } from "../context/Tabs"

export function useMarkTabsEnteredOnScroll() {
  const { tabsRef, panelRef, hasEnteredTabsRef } = useTabs()

  useEffect(() => {
    if (hasEnteredTabsRef.current) return

    const tabsEl = tabsRef.current
    const panelEl = panelRef.current
    if (!tabsEl || !panelEl) return

    const check = () => {
      if (hasEnteredTabsRef.current) return
      // Tabs are sticky if their top is at/above the top of the viewport.
      const isSticky = tabsEl.getBoundingClientRect().top <= 0
      // Or the current panel has reached under the tabs
      const underTabs =
        panelEl.getBoundingClientRect().top <= tabsEl.offsetHeight
      if (isSticky || underTabs) {
        hasEnteredTabsRef.current = true
      }
    }

    // In case we load with tabs already near the top (small header, anchors, etc.)
    check()

    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          check()
          ticking = false
        })
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [tabsRef, panelRef, hasEnteredTabsRef])
}
