"use client"

/**
 * - This hook scrolls to the top of the tabs / top of the tab panel
 * - Skips first render (no jump on load).
 * - Uses a single rAF to let layout settle.
 * - Clamps target to [0, maxScroll] to avoid overshoot.
 */

import { useEffect, useRef } from "react"
import { useTabs, clamp } from "../context/Tabs"

type Options = {
  behavior?: ScrollBehavior
  // extra pixels to stop above the original tabs position
  offsetPx?: number
}

export function useScrollTabsIntoViewOnChange({
  behavior = "smooth",
  offsetPx = 0,
}: Options) {
  const { state, tabsRef, hasEnteredTabsRef } = useTabs()
  const { activeTab } = state

  // Store the original Y-position of the tabs container
  const originalTabsTopRef = useRef<number | null>(null)

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
    // don't do anything until user has actually scrolled into the tabs area
    if (!hasEnteredTabsRef.current) return

    const tabsEl = tabsRef.current
    if (!tabsEl) return

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
  }, [activeTab, behavior, offsetPx, tabsRef, hasEnteredTabsRef])
}