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
    const panelEl = panelRef.current
    if (!tabsEl || !panelEl) return

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

    console.log("activeTab changed")

    const raf = requestAnimationFrame(() => {
      const panelRect = panelEl.getBoundingClientRect()
      // Fallback: if for some reason we never captured original, measure now
      const tabsHeight = tabsEl.offsetHeight

      const absolutePanelTop = window.scrollY + panelRect.top

      console.log(
        `absolutePanelTop => window.scrollY: ${window.scrollY} + panelRect.top: ${panelRect.top} = ${absolutePanelTop}`,
      )

      const rawTarget = absolutePanelTop - tabsHeight - offsetPx

      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight
      const targetY = clamp(rawTarget, 0, Math.max(0, maxScroll))

      const epsilon = 1
      if (Math.abs(window.scrollY - targetY) > epsilon) {
        console.log("scrolling to targetY: ", targetY)
        window.scrollTo({ top: targetY, behavior })
      }
    })

    return () => cancelAnimationFrame(raf)
  }, [activeTab, behavior, offsetPx, tabsRef, isInTabsArea, panelRef])
}
