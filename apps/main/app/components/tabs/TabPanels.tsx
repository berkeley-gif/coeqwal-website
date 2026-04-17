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
import { AutoHeight } from "@repo/ui"
import { useTabNavigation } from "../../hooks/useTabNavigation"
import { useScrollTabsIntoViewOnChange } from "../../hooks/useScrollTabsIntoViewOnChange"
import { useMarkTabsInView } from "../../hooks/useMarkTabsInView"

import LearnPanel from "../tabPanels/Learn"
import ExplorePanel from "../tabPanels/Explore"
import SharePanel from "../tabPanels/Share"
import { useScenarioExplorerStore } from "../../features/scenarioExplorer/store"

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

  // Sole owner of the ?tab= URL parameter.
  // Adds ?tab= when user scrolls into the tabs area, removes it when they leave.
  // Also updates ?tab= when activeTab changes (click, auto-advance, URL init).
  // useTabNavigation only dispatches context state.it does not touch the URL.
  useEffect(() => {
    const urlTab = searchParams.get("tab") as TabKey | null
    const params = new URLSearchParams(searchParams.toString())

    if (isInTabsArea) {
      if (urlTab !== activeTab) {
        params.set("tab", activeTab)
        const query = params.toString()
        router.replace(query ? `?${query}` : "?", { scroll: false })
      }
    } else if (!isInTabsArea && urlTab) {
      // We are outside the tabs area  to  remove ?tab if it exists
      params.delete("tab")
      const query = params.toString()
      router.replace(query ? `?${query}` : "?", { scroll: false })
    }
  }, [isInTabsArea, activeTab, searchParams, router])

  // On initial load with ?tab=..., sync state + scroll once.
  // Also rehydrate ?scenarios= and ?climate= into the scenario explorer store.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlTab = params.get("tab") as TabKey | null

    if (urlTab && urlTab !== activeTab) {
      navigateToTab(urlTab)
    }

    const scenariosParam = params.get("scenarios")
    if (scenariosParam) {
      const ids = scenariosParam.split(",").filter(Boolean)
      if (ids.length > 0) {
        useScenarioExplorerStore.getState().setSharedScenarioIds(ids)
      }
    }

    const climateParam = params.get("climate")
    if (climateParam) {
      useScenarioExplorerStore.getState().setHydroclimate(climateParam)
    }

    if (urlTab && !didScrollFromUrlRef.current && panelRef.current) {
      didScrollFromUrlRef.current = true

      const rect = panelRef.current.getBoundingClientRect()
      const absoluteTop = window.scrollY + rect.top

      const targetY = absoluteTop - collapsedHeaderHeight

      window.scrollTo({ top: targetY, behavior: "smooth" })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Background color tied to active tab
  // Learn and Explore tabs use transparent - they manage their own backgrounds
  // (Learn uses persistent map, Explore uses DashboardPanel with conditional background)
  // Note: Use rgba format for Framer Motion animation compatibility
  const panelColor: string = useMemo(() => {
    if (activeTab === "learn" || activeTab === "explore")
      return "rgba(0, 0, 0, 0)"
    return TABS.find((t) => t.key === activeTab)?.panelColor ?? "#ffffff"
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
      case "share":
        return (
          <TabPanel tabKey="share" ref={panelRef}>
            <SharePanel />
          </TabPanel>
        )
    }
  }

  return (
    <div style={{ pointerEvents: isMapTab ? "none" : "auto" }}>
      <AutoHeight>
        <motion.div
          initial={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
          animate={{ backgroundColor: panelColor }}
          transition={{ type: "spring", stiffness: 180, damping: 26 }}
          style={{
            position: "relative",
            borderRadius: 0,
            marginTop: -1,
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
