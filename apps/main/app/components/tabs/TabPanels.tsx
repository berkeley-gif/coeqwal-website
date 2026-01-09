"use client"

/**
 * TabPanels
 * - Renders the active tab's panel with a nice crossfade/slide.
 * - Keeps URL <-> state in sync on load or on manual URL edits (deep-link safe).
 */

import { useMemo, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "@repo/motion"
import { useTheme } from "@repo/ui/mui"

import { useTabs } from "../../context/Tabs"
import { TABS, TabKey } from "../../types/tabs"
import TabPanel from "../../components/tabs/TabPanel"
import AutoHeight from "../../../../../packages/ui/src/components/common/AutoHeight"
import { useTabNavigation } from "../../hooks/useTabNavigation"
import { useScrollTabsIntoViewOnChange } from "../../hooks/useScrollTabsIntoViewOnChange"
import { useMarkTabsInView } from "../../hooks/useMarkTabsInView"

import LearnPanel from "../tabPanels/Learn"
import ExplorePanel from "../tabPanels/Explore"

const panelVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
}

export default function TabPanels() {
  const theme = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state, panelRef, isInTabsArea } = useTabs()
  const { activeTab } = state
  const { navigateToTab } = useTabNavigation()

  // Const to track if we've already auto-scrolled from a URL Tab
  const didScrollFromUrlRef = useRef(false)

  const collapsedHeaderHeight = theme.layout.collapsedHeaderHeight

  useMarkTabsInView(collapsedHeaderHeight)

  // Scroll to tab top on every tab change
  useScrollTabsIntoViewOnChange({
    behavior: "smooth",
    offsetPx: collapsedHeaderHeight,
  })

  useEffect(() => {
    // Read the *current* URL query from the browser
    const urlTab = searchParams.get("tab") as TabKey | null
    const params = new URLSearchParams(searchParams.toString())

    if (isInTabsArea) {
      // We are in the tabs area → ensure ?tab=<activeTab>
      if (urlTab !== activeTab) {
        params.set("tab", activeTab)
        const query = params.toString()
        router.replace(query ? `?${query}` : "?", { scroll: false })
      }
    } else if (!isInTabsArea && urlTab) {
      // We are outside the tabs area → remove ?tab if it exists
      params.delete("tab")
      const query = params.toString()
      router.replace(query ? `?${query}` : "?", { scroll: false })
    }
  }, [isInTabsArea, activeTab, searchParams, router])

  // On initial load with ?tab=..., sync state + scroll once
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlTab = params.get("tab") as TabKey | null

    if (urlTab && urlTab !== activeTab) {
      // Set initial active tab from URL
      navigateToTab(urlTab)
    }

    if (urlTab && !didScrollFromUrlRef.current && panelRef.current) {
      didScrollFromUrlRef.current = true

      const rect = panelRef.current.getBoundingClientRect()
      const absoluteTop = window.scrollY + rect.top

      const targetY = absoluteTop - collapsedHeaderHeight

      window.scrollTo({ top: targetY, behavior: "smooth" })
    }
  }, [])

  // Background color tied to active tab
  // Learn and Explore tabs use transparent - they manage their own backgrounds
  // (Learn uses persistent map, Explore uses DashboardPanel with conditional background)
  const panelColor: string = useMemo(() => {
    if (activeTab === "learn" || activeTab === "explore") return "transparent"
    return TABS.find((t) => t.key === activeTab)?.panelColor ?? "fffff"
  }, [activeTab])

  // Map tabs need pointerEvents: "none" on wrapper so the persistent map
  // behind (at z-index: -1) can receive drag/pan events.
  // Child components re-enable pointer events on interactive elements.
  const isMapTab = activeTab === "learn" || activeTab === "explore"

  const render = (tab: TabKey) => {
    switch (tab) {
      case "learn":
        return (
          <TabPanel tabKey="learn" ref={panelRef}>
            <LearnPanel />
          </TabPanel>
        )
      case "explore":
        return (
          <TabPanel tabKey="explore" ref={panelRef}>
            <ExplorePanel />
          </TabPanel>
        )
      case "empower":
        return (
          <TabPanel tabKey="empower" ref={panelRef}>
            <h2>Empower</h2>
            <p style={{ height: "500px" }}>Coming soon...</p>
          </TabPanel>
        )
    }
  }

  return (
    <div style={{ pointerEvents: isMapTab ? "none" : "auto" }}>
      <AutoHeight>
        <motion.div
          animate={{ backgroundColor: panelColor }}
          transition={{ type: "spring", stiffness: 180, damping: 26 }}
          style={{
            position: "relative",
            borderRadius: 0,
            pointerEvents: isMapTab ? "none" : "auto",
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              variants={panelVariants}
              initial="center"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 220, damping: 26 }}
              style={{
                position: "relative",
                pointerEvents: isMapTab ? "none" : "auto",
              }}
            >
              {render(activeTab)}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </AutoHeight>
    </div>
  )
}
