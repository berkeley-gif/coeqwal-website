"use client"

/**
 * TabPanels
 * - Renders the active tab's panel
 */

import { useMemo, useEffect } from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "@repo/motion"
import { useTheme } from "@repo/ui/mui"

import { useTabs, setActiveTab } from "../../context/Tabs"
import { TABS, TAB_ORDER, TabKey } from "../../types/tabs"
import TabPanel from "../../components/tabs/TabPanel"
import { AutoHeight } from "@repo/ui"

import LearnPanel from "../tabPanels/Learn"
import ExplorePanel from "../tabPanels/Explore"
import SharePanel from "../tabPanels/Share"
// Share url -> state rehydration
import { useShareUrlRehydration } from "../../features/scenarioExplorer/explorer/share"

const panelVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
}

function isTabKey(value: string | null): value is TabKey {
  return value !== null && TAB_ORDER.includes(value as TabKey)
}

export default function TabPanels() {
  const theme = useTheme()
  const pathname = usePathname()
  const { state, panelRef, dispatch } = useTabs()
  const { activeTab } = state

  // pathname is read only for this one-time sync; adding it would re-run on
  // every navigation and fight the context-driven tab state described above.
  useEffect(() => {
    const segment = pathname.split("/").pop() ?? null
    if (isTabKey(segment)) {
      dispatch(setActiveTab(segment))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])

  // Mount-once rehydration of share-link state into the scenario-explorer
  // store. Reads window.location.search directly, so it does not suspend.
  // Lives in apps/main/app/features/scenarioExplorer/share/useShareUrlRehydration.ts
  useShareUrlRehydration()

  // Map tabs need pointerEvents: "none" on wrapper so the persistent map
  // behind (at z-index: -1) can receive drag/pan events.
  // Child components re-enable pointer events on interactive elements.
  const isMapTab = activeTab === "learn" || activeTab === "explore"

  // Learn and Explore are transparent — they let the map show through.
  // Share has its own background color.
  const panelColor: string = useMemo(() => {
    if (activeTab === "learn" || activeTab === "explore")
      return "rgba(0, 0, 0, 0)"
    return (
      TABS.find((t) => t.key === activeTab)?.panelColor ??
      theme.palette.common.white
    )
  }, [activeTab, theme.palette.common.white])

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

  const panelContent = (
    <motion.div
      initial={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
      animate={{ backgroundColor: panelColor }}
      transition={{ type: "spring", stiffness: 180, damping: 26 }}
      style={{
        position: "relative",
        borderRadius: 0,
        marginTop: -1,
        pointerEvents: isMapTab ? "none" : "auto",
        ...(activeTab === "explore" && {
          height: "100%",
        }),
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
            ...(activeTab === "explore" && {
              height: "100%",
            }),
          }}
        >
          {render(activeTab)}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )

  return (
    <div
      style={{
        pointerEvents: isMapTab ? "none" : "auto",
        ...(activeTab === "explore" && {
          flex: 1,
          minHeight: 0,
        }),
      }}
    >
      {activeTab === "explore" ? (
        panelContent
      ) : (
        <AutoHeight>{panelContent}</AutoHeight>
      )}
    </div>
  )
}
