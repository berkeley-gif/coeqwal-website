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

import { useTabs, setActiveTab } from "../../context/Tabs"
import { TABS, TAB_ORDER, TabKey } from "../../types/tabs"
import TabPanel from "../../components/tabs/TabPanel"
import { AutoHeight } from "@repo/ui"
import { useScrollTabsIntoViewOnChange } from "../../hooks/useScrollTabsIntoViewOnChange"
import { useMarkTabsInView } from "../../hooks/useMarkTabsInView"

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state, panelRef, tabsRef, isInTabsArea, dispatch } = useTabs()
  const { activeTab } = state

  // Const to track if we've already auto-scrolled from a URL Tab
  const didScrollFromUrlRef = useRef(false)
  /** After user has reached the sticky tabs at least once, stripping ?tab= on scroll-up is OK. */
  const hasBeenInTabsAreaRef = useRef(false)
  /** Tab requested by ?tab= on first load. Scroll once the matching panel is mounted. */
  const pendingUrlTabScrollRef = useRef<TabKey | null>(null)

  useEffect(() => {
    if (isInTabsArea) hasBeenInTabsAreaRef.current = true
  }, [isInTabsArea])

  const collapsedHeaderHeight = theme.layout.collapsedHeaderHeight

  useMarkTabsInView(collapsedHeaderHeight)

  // Scroll to tab top on every tab change
  useScrollTabsIntoViewOnChange({
    behavior: "smooth",
    offsetPx: collapsedHeaderHeight,
  })

  // Mount-once rehydration of share-link state into the scenario-explorer
  // store. Reads window.location.search directly, so it does not suspend.
  // Lives in apps/main/app/features/scenarioExplorer/share/useShareUrlRehydration.ts
  useShareUrlRehydration()

  /*
   * URL <-> activeTab sync for ?tab=
   *
   * Sole owner of the ?tab= URL parameter.
   * Adds ?tab= when user scrolls into the tabs area, removes it when they leave.
   * Also updates ?tab= when activeTab changes (click, auto-advance, URL init).
   * useTabNavigation only dispatches context state.it does not touch the URL.
   *
   * This is the only useSearchParams call in TabPanels, and the only reason
   * the surrounding <Suspense> boundary in page.tsx exists. Other URL reads
   * in this file go through window.location.search and do not suspend.
   */
  useEffect(() => {
    const urlTab = searchParams.get("tab") as TabKey | null
    const params = new URLSearchParams(searchParams.toString())

    if (isInTabsArea) {
      if (urlTab !== activeTab) {
        params.set("tab", activeTab)
        const query = params.toString()
        router.replace(query ? `?${query}` : "?", { scroll: false })
      }
    } else if (!isInTabsArea && urlTab && hasBeenInTabsAreaRef.current) {
      // Remove ?tab= only after the user has been in the tabs region before.
      // On first paint we are "above" the tabs but may be honoring ?tab= deep links;
      // stripping here used to clear the param before the deep-link effect ran.
      params.delete("tab")
      const query = params.toString()
      router.replace(query ? `?${query}` : "?", { scroll: false })
    }
  }, [isInTabsArea, activeTab, searchParams, router])

  /*
   * Effect 2: mount-once initial-load sync for ?tab=
   *
   * Reads window.location.search directly, so it does not call
   * useSearchParams and does not suspend. Runs once on mount to honor a
   * deep-link tab choice. Stashes the target tab in pendingUrlTabScrollRef
   * so the next effect can scroll the matching panel into view after
   * AnimatePresence (mode="wait") mounts it.
   *
   * Share-link rehydration of explorer store state lives in
   * useShareUrlRehydration above. The two run side by side at mount.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const rawTab = params.get("tab")
    const urlTab = isTabKey(rawTab) ? rawTab : null

    if (urlTab) {
      pendingUrlTabScrollRef.current = urlTab
      dispatch(setActiveTab(urlTab))
    }
  }, [dispatch])

  useEffect(() => {
    const target = pendingUrlTabScrollRef.current
    if (!target || didScrollFromUrlRef.current) return
    if (activeTab !== target) return

    const headerOffset = collapsedHeaderHeight
    const expectedPanelId = `panel-${target}`
    const MAX_FRAMES = 120
    let frame = 0
    let rafId = 0

    const scrollToStickyTabs = () => {
      const tabsEl = tabsRef.current
      if (!tabsEl) return
      const tabsRect = tabsEl.getBoundingClientRect()
      const absoluteTop = window.scrollY + tabsRect.top
      const targetY = Math.max(0, absoluteTop - headerOffset)
      window.scrollTo({ top: targetY, behavior: "auto" })
    }

    const tick = () => {
      frame += 1
      const tabsEl = tabsRef.current
      if (!tabsEl) {
        if (frame < MAX_FRAMES) rafId = requestAnimationFrame(tick)
        return
      }

      const panelEl = panelRef.current
      const panelReady = panelEl?.id === expectedPanelId
      if (!panelReady && frame < MAX_FRAMES) {
        rafId = requestAnimationFrame(tick)
        return
      }

      scrollToStickyTabs()
      didScrollFromUrlRef.current = true
      pendingUrlTabScrollRef.current = null
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [activeTab, collapsedHeaderHeight, panelRef, tabsRef])

  // Background color tied to active tab
  // Learn and Explore tabs use transparent - they manage their own backgrounds
  // (Learn uses persistent map, Explore uses DashboardPanel with conditional background)
  // Note: Use rgba format for Framer Motion animation compatibility
  const panelColor: string = useMemo(() => {
    if (activeTab === "learn" || activeTab === "explore")
      return "rgba(0, 0, 0, 0)"
    return (
      TABS.find((t) => t.key === activeTab)?.panelColor ??
      theme.palette.common.white
    )
  }, [activeTab, theme.palette.common.white])

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
