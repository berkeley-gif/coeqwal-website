"use client"

/**
 * TabPanels
 * - Renders the active tab's panel with a nice crossfade/slide.
 * - Keeps URL <-> state in sync on load or on manual URL edits (deep-link safe).
 */

import { useMemo, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "@repo/motion"

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

import { HEADER_SHRUNK_H } from "../../../../../packages/ui/src/components/navigation/BaseHeader"

export default function TabPanels() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state, panelRef, isInTabsArea } = useTabs()
  const { activeTab } = state
  const { navigateToTab } = useTabNavigation()

  // Const to track if we've already auto-scrolled from a URL Tab
  const didScrollFromUrlRef = useRef(false)

  useMarkTabsInView(HEADER_SHRUNK_H)

  // Scroll to tab top on every tab change
  useScrollTabsIntoViewOnChange({ behavior: "smooth", offsetPx: HEADER_SHRUNK_H })

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
      const targetY = absoluteTop

      window.scrollTo({ top: targetY, behavior: "smooth" })
    }
  }, [])


  // Background color tied to active tab
  const panelColor: string = useMemo(() => {
    return TABS.find((t) => t.key === activeTab)?.panelColor ?? "fffff"
  }, [activeTab])

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
    <AutoHeight>
      <motion.div
        ref={panelRef}
        animate={{ backgroundColor: panelColor }}
        transition={{ type: "spring", stiffness: 180, damping: 26 }}
        style={{
          position: "relative",
          borderRadius: 0,
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
            style={{ position: "relative" }}
          >
            {render(activeTab)}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </AutoHeight>
  )
}
