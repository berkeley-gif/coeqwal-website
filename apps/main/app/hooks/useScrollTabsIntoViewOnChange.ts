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
  const { state, tabsRef, panelRef, isInTabsArea } = useTabs()
  const { activeTab } = state

  // Track whether we were in the tabs area on last render
  const wasInAreaRef = useRef(false)

  // Track which tab we already aligned for (so we don't re-scroll on the same tab)
  const lastAlignedTabRef = useRef<TabKey | null>(null)

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

    // TabPanels wraps the active panel in AnimatePresence mode="wait", so the
    // new panel does not mount until the previous panel's exit spring finishes
    // (a few hundred ms). Until then `panelRef.current` still points at the
    // exiting panel (or is briefly null), and a single-frame measure would
    // scroll to the wrong element. Each TabPanel renders
    // id={`panel-${tabKey}`}, so we poll rAF until the ref matches the
    // expected id for the new activeTab, then align. Bail after MAX_FRAMES.
    const expectedId = `panel-${activeTab}`
    const MAX_FRAMES = 60
    let rafId = 0
    let framesTried = 0

    const tryAlign = () => {
      const panelEl = panelRef.current
      if (!panelEl || panelEl.id !== expectedId) {
        if (++framesTried < MAX_FRAMES) {
          rafId = requestAnimationFrame(tryAlign)
        }
        return
      }

      const panelRect = panelEl.getBoundingClientRect()
      const tabsHeight = tabsEl.offsetHeight
      const absolutePanelTop = window.scrollY + panelRect.top
      const rawTarget = absolutePanelTop - tabsHeight - offsetPx

      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight
      const targetY = clamp(rawTarget, 0, Math.max(0, maxScroll))

      const epsilon = 1
      if (Math.abs(window.scrollY - targetY) > epsilon) {
        window.scrollTo({ top: targetY, behavior })
      }
    }

    rafId = requestAnimationFrame(tryAlign)
    return () => cancelAnimationFrame(rafId)
  }, [activeTab, behavior, offsetPx, tabsRef, isInTabsArea, panelRef])
}
