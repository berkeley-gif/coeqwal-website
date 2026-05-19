"use client"

/**
 *  useExplorerLifecycle - Explore-tab mount effects. Called once from ScenarioExplorer.
 *
 * Two responsibilities:
 * 1. Tier data prefetch (SWR cache warming for all tools)
 * 2. Scroll-to-tabs when switching from Get started to Tools
 */

import { useEffect, useRef } from "react"
import { useTheme } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"
import { usePrefetchTiers } from "./tools/hooks/usePrefetchTiers"

export function useExplorerLifecycle(): void {
  const theme = useTheme()
  const mainView = useScenarioExplorerStore((s) => s.mainView)

  // Warms SWR tier caches for all scenarios in all hydroclimates as soon as scenario list
  // mappings are available. Runs once per Explore tab mount so tool panels
  // get cache hits instead of loading spinners on first render.
  usePrefetchTiers()

  // On Get started -> Tools transition, scrolls so #tabs sits below the
  // collapsed header.
  const prevMainViewRef = useRef(mainView)
  useEffect(() => {
    const prev = prevMainViewRef.current
    prevMainViewRef.current = mainView
    if (prev === mainView) return
    if (mainView !== "explorer") return

    const tabsEl = document.getElementById("tabs")
    if (!tabsEl) return

    requestAnimationFrame(() => {
      const tabsRect = tabsEl.getBoundingClientRect()
      const targetY =
        window.scrollY + tabsRect.top - theme.layout.collapsedHeaderHeight
      window.scrollTo({ top: targetY, behavior: "smooth" })
    })
  }, [mainView, theme.layout.collapsedHeaderHeight])
}
