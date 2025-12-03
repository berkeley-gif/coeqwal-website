"use client"

/**
 * - Scrolls to the top of the tab panel when activeTab changes within the tab section
 */

import { useEffect, useRef } from "react"
import { useTabs, clamp } from "../context/Tabs"
import type { TabKey } from "../types/tabs"

type Options = {
  behavior?: ScrollBehavior
  offsetPx?: number
}

export function useScrollTabsIntoViewOnChange({
  behavior = "smooth",
  offsetPx = 0,
}: Options) {
  const { state, tabsRef, isInTabsArea } = useTabs()
  const { activeTab } = state

  // Store the original Y-position of the tabs container
  const originalTabsTopRef = useRef<number | null>(null)

  // Track whether we were in the tabs area on last render
  const wasInAreaRef = useRef(false)

  // Track which tab we already aligned for (so we don't re-scroll on the same tab)
  const lastAlignedTabRef = useRef<TabKey | null>(null)

  // Capture original position once, on mount (before sticky behavior matters)
  useEffect(() => {
    const tabsEl = tabsRef.current
    if (!tabsEl) return

    if (originalTabsTopRef.current == null) {
      originalTabsTopRef.current =
        tabsEl.getBoundingClientRect().top + window.scrollY
    }
  }, [tabsRef])

  useEffect(() => {
    const tabsEl = tabsRef.current
    if (!tabsEl) return

    const wasInArea = wasInAreaRef.current
    wasInAreaRef.current = isInTabsArea

    // If we're not in tabs area, don't auto-scroll
    if (!isInTabsArea) {
      lastAlignedTabRef.current = null
      return
    }

    // First time we enter tabs area, do not auto-align
    // Current tab neeeds to be stored so we only align on later tab changes
    if (!wasInArea) {
      lastAlignedTabRef.current = activeTab
      return
    }

    // If the active tab didn't change since we last aligned, return
    if (lastAlignedTabRef.current === activeTab) return

    lastAlignedTabRef.current = activeTab

    const raf = requestAnimationFrame(() => {
      // Fallback: if for some reason we never captured original, measure now
      const baseTabsTop =
        originalTabsTopRef.current ??
        tabsEl.getBoundingClientRect().top + window.scrollY

      const rawTarget = baseTabsTop - offsetPx

      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight
      const targetY = clamp(rawTarget, 0, Math.max(0, maxScroll))

      const epsilon = 1
      if (Math.abs(window.scrollY - targetY) > epsilon) {
        window.scrollTo({ top: targetY, behavior })
      }
    })

    return () => cancelAnimationFrame(raf)
  }, [activeTab, behavior, offsetPx, tabsRef, isInTabsArea])
}
