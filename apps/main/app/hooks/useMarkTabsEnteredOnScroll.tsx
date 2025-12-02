"use client"

/**
 * Flip the "entered" gate the first time the user reaches the tabs area.
 * This does NOT write the URL or cause scroll — it only sets a boolean so
 * the scroll-align hook can act later on tab changes.
 */

import { useEffect } from "react"
import { useTabs } from "../context/Tabs"
import { useRouter, useSearchParams } from "next/navigation"

import type { TabKey } from "@repo/ui"
import { TABS } from "../types/tabs"

export function useMarkTabsEnteredOnScroll(stickyOffsetPx: number = 0) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { tabsRef, panelRef, hasEnteredTabs } = useTabs()

  useEffect(() => {
    if (hasEnteredTabs.current) return

    const tabsEl = tabsRef.current
    const panelEl = panelRef.current
    if (!tabsEl || !panelEl) return

    const check = () => {
      const urlTab = searchParams.get("tab") as TabKey | null
      if (hasEnteredTabsRef.current) return

      const tabsRect = tabsEl.getBoundingClientRect()

      // ✅ Tabs are "in view" if they are stuck at their sticky offset
      const inArea = Math.abs(tabsRect.top - stickyOffsetPx) <= 1

      if (hasEnteredTabsRef.current !== inArea) {
        hasEnteredTabsRef.current = inArea
        console.log("Has entered tabs for the first time →", inArea)

        if (!urlTab) {
          // update URL to reflect first time we enter tabs
          const params = new URLSearchParams(searchParams.toString())

          params.set("tab", TABS[0]?.key ?? "")
          router.replace(`?${params.toString()}`, { scroll: false })
        }
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
