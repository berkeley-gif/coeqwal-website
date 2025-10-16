"use client"

/**
 * - Scrolls so the NEW panel's top sits just under the sticky tabs.
 * - Skips first render (no jump on load).
 * - Skips when (panel + tabs) fits in the viewport.
 * - Uses a single rAF to let layout settle.
 * - Clamps target to [0, maxScroll] to avoid overshoot at document end.
 *
 * Junior-friendly mental model:
 *   1) Wait one frame so DOM has updated.
 *   2) Measure panelTop and tabsHeight.
 *   3) Scroll to panelTop - tabsHeight - offsetPx (but never < 0 or > maxScroll).
 */

import { useEffect, useRef } from "react"
import { useTabs, clamp } from "../context/Tabs"

type Options = {
  behavior?: ScrollBehavior
  // extra pixels to stop above the panel
  offsetPx?: number
}

export function useScrollTabsIntoViewOnChange({
  behavior = "smooth",
  offsetPx = 0,
}: Options) {
  const { state, tabsRef, panelRef, hasEnteredTabsRef } = useTabs()
  const { activeTab } = state

  // Track first run so we don't scroll to the tabs on initial page load
  const hasMountedRef = useRef(false)

  useEffect(() => {
    // don't do anything until user has entered the tabs area
    if (!hasEnteredTabsRef.current) return

    // First render? Don't scroll
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    const tabsEl = tabsRef.current
    const panelEl = panelRef.current
    if (!tabsEl || !panelEl) return

    const raf = requestAnimationFrame(() => {
      const vh = window.innerHeight
      const tabsHeight = tabsEl.offsetHeight
      const panelHeight = panelEl.scrollHeight

      // if panel + tabs fits on screen, no need to scroll
      if (panelHeight + tabsHeight <= vh) return

      // compute where to place the page so the panel top sits under the sticky tabs
      const panelTopDoc = panelEl.getBoundingClientRect().top + window.scrollY
      const rawTarget = panelTopDoc - (tabsHeight + offsetPx)

      // clamp to valid scroll range and micro-jitter guard
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight
      const targetY = clamp(rawTarget, 0, Math.max(0, maxScroll))

      const epsilon = 1
      if (Math.abs(window.scrollY - targetY) > epsilon) {
        window.scrollTo({ top: targetY, behavior })
      }
    })

    return () => cancelAnimationFrame(raf)
  }, [activeTab, behavior, offsetPx, tabsRef, panelRef, hasEnteredTabsRef])
}
